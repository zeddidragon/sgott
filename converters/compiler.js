const util = require('util')
const kleur = require('kleur')

function padCeil(value, divisor = 0x10) {
  return Math.ceil(value / divisor) * divisor
}

const Long = BigInt

function compile(obj) {
  const endian = obj.endian || 'LE'
  function Str({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer.write(value, index + offset)
  }

  function UInt({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer[`writeUInt32${endian}`](value, index + offset)
  }
  UInt.size = 0x04

  function BigUInt({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer[`writeBigUInt64${endian}`](Long(value), index + offset)
  }
  BigUInt.size = 0x08

  function Int({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer[`writeInt32${endian}`](value, index + offset)
  }
  Int.size = 0x04

  function BigInt({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer[`writeBigInt64${endian}`](Long(value), index + offset)
  }
  BigInt.size = 0x08

  function Float({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer[`writeFloat${endian}`](value, index + offset)
  }
  Float.size = 0x04

  function Double({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer[`writeDouble${endian}`](value, index + offset)
  }
  Double.size = 0x08
  
  function Hex({ buffer, index = 0x00 }, value, offset = 0x00) {
    return buffer.write(value.padStart(8, '0'), index + offset, 'hex')
  }

  function Tuple(Type, size) {
    const block = Type.size || 0x04
    function TupleDef(cursor, value, offset) {
      (value || [])
        .slice(0, size)
        .forEach((v, i) => Type(cursor, v, offset + i * block))
    }
    TupleDef.size = size * block
    return TupleDef
  }

  const deferred = []
  function Defer(cursor, buffer, offset = 0x00) {
    deferred.push({ buffer, cursor: cursor.clone(), offset })
  }
  Defer.size = 0x04

  function unrollDeferred() {
    for(const { buffer, cursor, offset } of deferred) {
      const allocated = malloc(padCeil(buffer.length))
      buffer.copy(allocated.buffer)
      Int(cursor, cursor.pointer(allocated.pos), offset)
    }
  }

  const deferredStrings = new Set(obj.strings || [])
  const stringDefers = []
  function DeferStr(cursor, str, offset = 0x00) {
    str = str.trim()
    deferredStrings.add(str)
    stringDefers.push({ str, cursor: cursor.clone(), offset })
  }
  DeferStr.size = 0x04

  function unrollStrings() {
    const nullString = '\0'
    const strings = Array.from(deferredStrings)
    if(!obj.strings) { // Sort unless order defined manually
      strings.sort()
    }
    // SGO sorts this nullstring at the end, js wants it first
    // For consistency, perform that manually
    if(strings[0] === nullString) {
      strings.splice(0, 1)
      strings.push(nullString)
    }
    const stringCursors = {}
    for(let str of strings) {
      const written = str + '\0'
      const cursor = malloc(stringBytes(written))
      cursor.buffer.write(written, 'utf16le')
      if(endian !== 'LE') cursor.buffer.swap16()
      stringCursors[str] = cursor
    }

    for(const { str, cursor, offset } of stringDefers) {
      Int(cursor, cursor.pointer(stringCursors[str].pos), offset)
    }
  }

  function stringBytes(string) {
    return Buffer.byteLength(string, 'utf16le')
  }

  // Like Ref, but null values are written as 0 instead of a pointer to nowhere
  function DRef(cursor, value, offset) {
    if(!value) return Int(cursor, 0, offset)
    return Ref(cursor, value, offset)
  }

  function Ref(cursor, value, offset) {
    if(!value) return Int(cursor, cursor.pointer(heapIdx), offset)
    if(!(value instanceof Cursor)) {
      throw new Error('Value expected to be a cursor')
    }
    const jump = cursor.pointer(value.pos)
    Int(cursor, jump, offset)
  }

  function Null() {
    return null
  }
  
  function Copy(cursor, buffer) {
    buffer.copy(cursor.buffer)
  }

  class Cursor {
    constructor(buffer, pos, index = 0x00) {
      if(buffer instanceof Cursor) {
        this.buffer = buffer.buffer
        this.pos = buffer.pos
        this.index = buffer.index
        this.writeCount = buffer.writeCount
        this.endian = buffer.endian
      } else {
        this.buffer = buffer
        this.pos = pos
        this.index = index
        this.writeCount = 0
        this.endian = endian
      }
    }

    [util.inspect.custom]() {
      const startAt = Math.max(0, Math.floor((this.pos / 0x10) - 1) * 0x10)
      const endAt = Math.min(startAt + 0x40, this.buffer.length)
      let bufferView = []
      for(let i = startAt; i < endAt; i += 0x2) {
        if(!(i % 0x10)) {
          bufferView.push([kleur.magenta(`${i.toString(16).padStart(8, 0)}:`)])
        }
        let str = this.buffer.readUInt16BE(i).toString(16).padStart(4, 0)
        if(this.pos === i) {
          str = kleur.yellow(str)
        }
        bufferView[bufferView.length - 1].push(str)
      }
      return `Cursor 0x${this.pos.toString(16)} (${this.endian})
${bufferView.map(r => r.join(' ')).join('\n')}`
    }

    write(Type, value, off, tmp, opts = {}) {
      if(this.index > this.buffer.length - Type.size) {
        throw new Error('End of buffer exceeded')
      }
      if(!Type.size && !opts.size) {
        throw new Error('Trying to write a type without a size!')
      }
      Type(this, value, off, tmp)
      this.index += opts.size || Type.size || 0
      this.writeCount++
      return this
    }

    clone() {
      return new Cursor(this)
    }

    pointer(pos) {
      return pos - this.pos - this.index
    }
  }

  const heap = []
  let heapIdx = 0x00
  function malloc(size, opts = {}) {
    if(size == null) throw new Error('No size provided to allocate (0 is valid)')
    if(opts.padding) {
      size = padCeil(size, opts.padding)
    }
    if(opts.padding && heapIdx % opts.padding) {
      malloc(opts.padding - (heapIdx % opts.padding))
    }
    const pos = heapIdx
    const buffer = Buffer.alloc(size)
    heap.push(buffer)
    heapIdx += size
    return new Cursor(buffer, pos)
  }

  function Allocate(Type, cb, opts = {}) {
    function AllocateDef(data, cursor, off = 0x00, tmp = {}) {
      if(isNaN(off)) { // tmp is third parameter
        tmp = off
        off = 0x00
      }
      const value = cb(data, cursor, tmp)
      if(!value) return null
      const writeOpts = {}
      let size = Type.size
      if(Buffer.isBuffer(value)) {
        size = value.length
        writeOpts.size = size
      }
      if(opts.padding) {
        writeOpts.size = size
      }
      return malloc(size, opts).write(Type, value, off, tmp, writeOpts)
    }
    AllocateDef.size = 0x04
    return AllocateDef
  }

  function Unknowns(cursor, obj, offset = 0x00) {
    for(const key of Object.keys(obj)) {
      if(!key.startsWith('0x')) continue
      const pos = parseInt(key.slice(2), 16)
      const value = obj[key]
      Hex(cursor, value, offset + pos)
    }
  }

  function Struct(definitions, size) {
    const block = 0x04
    if(!size) size = Math.max(...definitions).map(([k]) => +k) + block
    function StructDef(cursor, data) {
      if(!data) return null
      Unknowns(cursor, data)
      const tmp = {}
      for(const [off, writeFn, valueFn] of definitions) {
        const value = valueFn(data, cursor, tmp)
        writeFn(cursor, value, off, tmp)
      }

      return cursor
    }
    StructDef.size = size
    return StructDef
  }

  function Union(prop, Types, size) {
    function UnionDef(cursor, data) {
      const type = data[prop]
      const cb = Types[type]
      if(!cb) {
        throw new Error(`Type not found: "${type}"`)
      }
      return cb(cursor, data)
    }
    UnionDef.size = size
    return UnionDef
  }

  function Collection(Type, cb, opts = {}) {
    return function CollectionDef(data) {
      if(!data) return null
      const entries = cb ? cb(data) : data
      if(!(entries && entries.length)) return null

      const size = entries.length * (opts.size || Type.size)
      const cursor = malloc(size, opts)
      entries.forEach(entry => cursor.write(Type, entry, 0x00, {}, opts))
      return cursor
    }
  }

  function compile(Entry) {
    malloc(Entry.size).write(Entry, obj)
    unrollDeferred()
    unrollStrings()
    return Buffer.concat(heap)
  }

  compile.compile = compile
  compile.types = {
    Str,
    UInt,
    BigUInt,
    Int,
    BigInt,
    Float,
    Double,
    Hex,
    Tuple,
    Defer,
    DeferStr,
    Ref,
    DRef,
    Null,
    Copy,
    Allocate,
    Struct,
    Union,
    Collection,
  }

  return compile
}

compile.compile = compile
compile.compiler = opts => obj => compile(obj, opts)

module.exports = compile
