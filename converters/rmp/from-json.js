const sgo = require('../sgo/from-json').compiler()
require('util').inspect.defaultOptions.depth = null

// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function padCeil(value, divisor = 0x10) {
  return Math.ceil(value / divisor) * divisor
}

function compile(obj) {
  const { endian } = obj
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
      } else {
        this.buffer = buffer
        this.pos = pos
        this.index = index
        this.writeCount = 0
      }
    }

    write(Type, data) {
      if(this.index > this.buffer.length - Type.size) {
        throw new Error('End of buffer exceeded')
      }
      if(!Type.size) {
        throw new Error('Trying to write a type without a size!')
      }
      Type(this, data)
      this.index += Type.size
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
    const pos = heapIdx
    const buffer = Buffer.alloc(size)
    heap.push(buffer)
    heapIdx += size
    return new Cursor(buffer, pos)
  }

  function Allocate(Type, cb) {
    return function(data) {
      return malloc(Type.size).write(Type, cb(data))
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

  function SubHeader(Type) {
    return Struct([
      [0x14, DeferStr, entry => entry.name || ''],
      [0x18, UInt, entry => entry.nodes.length],
      [0x1C, Ref, Collection(Type, entry => entry.nodes)],
      [0x08, Ref, Null],
    ], 0x20)
  }

  function WayPointLink(node) {
    if(!(node.link && node.link.length)) return 
    const cursor = malloc(padCeil(node.link.length * 0x04))
    node.link.forEach(v => cursor.write(UInt, v))
    return cursor
  }

  function WayPointSgo(node, _cursor, tmp) {
    const cfg = node.config || {
      format: 'SGO',
      endian: node.cfgEn || endian,
      variables: [{
        type: "float",
        name: 'rmpa_float_WayPointWidth',
        value: node.width == null ? -1 : node.width,
      }],
    }
    const buffer = sgo(cfg)
    tmp.sgoSize = buffer.length
    const cursor = malloc(padCeil(buffer.length))
    buffer.copy(cursor.buffer)
    return cursor
  }

  const WayPoint = Struct([
    [0x00, UInt, (node, cursor) => cursor.writeCount],
    [0x04, UInt, node => (node.link && node.link.length) || 0],
    [0x08, Ref, WayPointLink],
    [0x10, Ref, Null],
    [0x1C, Ref, WayPointSgo],
    [0x14, UInt, node => node.sgoSize],
    [0x18, UInt, (node, cursor, tmp) => tmp.sgoSize],
    [0x24, DeferStr, node => node.name || ''],
    [0x28, Float, node => node.x],
    [0x2C, Float, node => node.y],
    [0x30, Float, node => node.z],
  ], 0x3C)

  const ShapeData = Struct([
    [0x00, Float, node => node.px],
    [0x04, Float, node => node.py],
    [0x08, Float, node => node.pz],
    [0x10, Float, node => node.sizex],
    [0x14, Float, node => node.sizey],
    [0x18, Float, node => node.sizez],
    [0x30, Float, node => node.diameter],
  ], 0x40)

  const Shape = Struct([
    [0x08, DeferStr, node => node.type],
    [0x10, DeferStr, node => node.name || ''],
    [0x1C, UInt, node => node.id],
    [0x24, Ref, Allocate(ShapeData, node => node.coords)],
  ], 0x30)

  function TypeHeader(Type, cb) {
    const Header = Struct([
      [0x00, UInt, obj => obj.entries.length],
      [0x04, Ref, Collection(SubHeader(Type), obj => obj.entries)],
      [0x0C, Ref, Null],
      [0x10, UInt, obj => obj.id],
      [0x18, DeferStr, obj => obj.name || ''],
    ], 0x20)

    return function AllocateHeader(obj) {
      const entry = cb(obj)
      if(!entry) return null
      return malloc(Header.size).write(Header, entry)
    }
  }

  const RmpHeader = Struct([
    [0x00, Str, obj => (obj.endian === 'LE' ? 'RMP\0' : '\0PMR')],
    [0x08, UInt, obj => +!!obj.routes],
    [0x0C, Ref, TypeHeader(WayPoint, obj => obj.routes)],
    [0x10, UInt, obj => +!!obj.shapes],
    [0x14, Ref, TypeHeader(Shape, obj => obj.shapes)],
    // [0x08, UInt, obj => anyEntries(obj.cameras)],
    // [0x1C, Ref, Batch(CameraHeader(Camera))],
    // [0x20, UInt, obj => anyEntries(obj.spawns)],
    // [0x24, Ref, Batch(TypeHeader(WayPoint))],
  ], 0x30)
  heapIdx = RmpHeader.size

  malloc(padCeil(RmpHeader.size)).write(RmpHeader, obj)
  unrollStrings()
  return Buffer.concat(heap)
}

exports.compile = compile
exports.compiler = opts => obj => compile(obj, opts)
