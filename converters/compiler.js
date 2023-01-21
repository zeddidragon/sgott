function padCeil(value, divisor = 0x10) {
  return Math.ceil(value / divisor) * divisor
}

function compile(obj) {
  const endian = obj.endian || 'LE'
  function Str({ buffer, index }, value, offset = 0x00) {
    return buffer.write(value, index + offset)
  }

  function UInt({ buffer, index }, value, offset = 0x00) {
    return buffer[`writeUInt32${endian}`](value, index + offset)
  }
  UInt.size = 0x04

  function Int({ buffer, index }, value, offset = 0x00) {
    return buffer[`writeInt32${endian}`](value, index + offset)
  }
  Int.size = 0x04

  function Float({ buffer, index }, value, offset = 0x00) {
    return buffer[`writeFloat${endian}`](value, index + offset)
  }
  Float.size = 0x04
  
  function Hex({ buffer, index }, value, offset = 0x00) {
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

  const deferredStrings = new Set()
  const stringDefers = []
  function DeferStr(cursor, str, offset = 0x00) {
    str = str.trim() + '\0'
    deferredStrings.add(str)
    stringDefers.push({ str, cursor: cursor.clone(), offset })
  }
  DeferStr.size = 0x04

  function unrollStrings() {
    const nullString = '\x00'
    const strings = Array.from(deferredStrings).sort()
    // SGO sorts this nullstring at the end, js wants it first
    // For consistency, perform that manually
    if(strings[0] === nullString) {
      strings.splice(0, 1)
      strings.push(nullString)
    }
    const stringCursors = {}
    for(const str of strings) {
      const cursor = malloc(stringBytes(str))
      cursor.buffer.write(str, 'utf16le')
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

  function Unknowns(cursor, obj, offset = 0x00) {
    for(const key of Object.keys(obj)) {
      if(!key.startsWith('0x')) continue
      const pos = parseInt(key.slice(2), 16)
      const value = obj[key]
      Hex(cursor, value, offset + pos)
    }
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
  var heapIdx = 0x00
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
      var size = Type.size
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
      return Types[data[prop]](cursor, data)
    }
    UnionDef.size = size
    return UnionDef
  }

  function Collection(Type, cb, opts = {}) {
    return function CollectionDef(data) {
      if(!data) return null
      const entries = cb ? cb(data) : data
      if(!(entries && entries.length)) return null

      var size = entries.length * (opts.size || Type.size)
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
    Int,
    Float,
    Hex,
    Tuple,
    Defer,
    DeferStr,
    Ref,
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
