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

  const deferredStrings = new Set()
  const stringDefers = []
  function DeferStr(cursor, str, offset = 0x00) {
    str = str.trim() + '\0'
    deferredStrings.add(str)
    stringDefers.push({ str, cursor: cursor.clone(), offset })
  }
  DeferStr.size = 0x04

  function unrollStrings() {
    const strings = Array.from(deferredStrings).sort()
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

    write(Type, value, tmp, opts = {}) {
      if(this.index > this.buffer.length - Type.size) {
        throw new Error('End of buffer exceeded')
      }
      if(!Type.size && !opts.size) {
        throw new Error('Trying to write a type without a size!')
      }
      Type(this, value, tmp)
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
  function malloc(size) {
    if(size == null) throw new Error('No size provided to allocate (0 is valid)')
    const pos = heapIdx
    const buffer = Buffer.alloc(size)
    heap.push(buffer)
    heapIdx += size
    return new Cursor(buffer, pos)
  }

  function Allocate(Type, cb, opts = {}) {
    function AllocateDef(data, cursor, tmp = {}) {
      const value = cb(data, cursor, tmp)
      if(!value) return null
      const writeOpts = {}
      var size = Type.size
      if(Buffer.isBuffer(value)) {
        size = value.length
        writeOpts.size = size
      }
      if(opts.padding) {
        size = padCeil(size, opts.padding)
        writeOpts.size = size
      }
      return malloc(size).write(Type, value, tmp, writeOpts)
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
        writeFn(cursor, value, off)
      }

      return cursor
    }
    StructDef.size = size
    return StructDef
  }

  function Collection(Type, cb) {
    return function CollectionDef(data) {
      if(!data) return null
      const entries = cb(data)
      if(!(entries && entries.length)) return null

      const cursor = malloc(padCeil(entries.length * Type.size))
      entries.forEach(entry => cursor.write(Type, entry))
      return cursor
    }
  }

  function compile(Entry) {
    malloc(Entry.size).write(Entry, obj)
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
    DeferStr,
    Ref,
    Null,
    Allocate,
    Struct,
    Collection,
  }

  return compile
}

compile.compile = compile
compile.compiler = opts => obj => compile(obj, opts)

module.exports = compile
