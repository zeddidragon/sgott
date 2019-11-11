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
  function Str(buffer, value, offset = 0x00, base = 0x00) {
    return buffer.write(value, base + offset)
  }

  function UInt(buffer, value, offset = 0x00, base = 0x00) {
    return buffer[`writeUInt32${endian}`](value, base + offset)
  }

  function Int(buffer, value, offset = 0x00, base = 0x00) {
    return buffer[`writeInt32${endian}`](value, base + offset)
  }

  function Float(buffer, value, offset = 0x00, base = 0x00) {
    return buffer[`writeFloat${endian}`](value, base + offset)
  }
  
  function Hex(buffer, value, offset = 0x00, base = 0x00) {
    return buffer.write(value.padStart(8, '0'), base + offset, 'hex')
  }

  function stringBytes(string) {
    // SGO uses wide chars for strings
    return Buffer.byteLength(string, 'utf16le')
  }

  function buffersBytes(buffers) {
    return buffers.reduce((sum, buf) => sum + buf.length, 0)
  }

  const deferredStrings = new Set()
  const stringDefers = []
  function DeferStr(buffer, str, offset = 0x00, base = 0x00) {
    str = str.trim() + '\0'
    deferredStrings.add(str)
    stringDefers.push({ str, buffer, base, offset })
  }

  function unrollStrings(buffers) {
    const bufferIdxs = new Map()

    const strings = Array.from(deferredStrings).sort()
    const stringBufferSize = strings.reduce((sum, str) => {
      return sum + stringBytes(str)
    }, 0)
    const stringBuffer = Buffer.alloc(stringBufferSize)
    const stringIdxs = {}

    var idx = 0x00
    for(const buf of buffers) {
      bufferIdxs.set(buf, idx)
      idx += buf.length
    }
    var strIdx = 0x00
    for(const str of strings) {
      stringIdxs[str] = idx
      stringBuffer.write(str, strIdx, 'utf16le')
      const size = stringBytes(str)
      strIdx += size
      idx += size
    }
    if(endian !== 'LE') stringBuffer.swap16()

    for(const { str, buffer, base, offset } of stringDefers) {
      const strIdx = stringIdxs[str]
      const bufIdx = bufferIdxs.get(buffer)
      Int(buffer, strIdx - bufIdx - base, offset, base)
    }

    return stringBuffer
  }

  function Unknowns(buffer, obj, offset = 0x00, base = 0x00) {
    const index = base + offset
    for(const key of Object.keys(obj)) {
      if(!key.startsWith('0x')) continue
      const pos = parseInt(key.slice(2), 16)
      const value = obj[key]
      Hex(buffer, value, pos, index)
    }
  }

  function Enumeration(Definition) {
    const block = 0x04
    const { size } = Definition
    return function EnumerationDef(obj) {
      const { nodes } = obj

      const structBufferSize = nodes.length * size
      const padding = padCeil(structBufferSize) - structBufferSize

      const heap = []
      var heapIdx = padCeil(structBufferSize)

      const mem = {
        addToHeap(buf) {
          const idx = mem.heapIdx()
          if(!buf) return idx
          if(Array.isArray(buf)) {
            heapIdx += buf.reduce((sum, b) => sum + b.length, 0)
            heap.push(...buf)
          } else {
            heapIdx += buf.length
            heap.push(buf)
          }
          return idx
        },
        heapIdx() {
          return heapIdx
        }
      }

      const buffers = nodes.map((node, i) => {
        const buffer = Definition(node, { i, mem })
        heapIdx -= block
        return buffer
      })

      if(padding) buffers.push(Buffer.alloc(padding))
      return [...buffers, ...heap]
    }
  }

  function Struct(definitions, size) {
    const block = 0x04
    if(!size) size = Math.max(...definitions.map(([k]) => +k)) + block
    function StructDef(node, state) {
      const { i, mem } = state || {}
      const tmp = {}
      const buffer = Buffer.alloc(size)
      Unknowns(buffer, node)
      for(const [off, writeFn, valueFn] of definitions) {
        const value = valueFn(node, { i, mem, tmp })
        writeFn(buffer, value, off, 0x00, { i, mem, tmp })
      }

      return buffer
    }
    StructDef.size = size
    return StructDef
  }

  function Ref(buffer, refBuffer, offset, base, { mem }) {
    return Int(buffer, mem.addToHeap(refBuffer), offset, base)
  }

  function Null() {
    return null
  }

  const WayPoint = Struct([
    [0x00, UInt, (node, { i }) => i],
    [0x04, UInt, ({ link }) => (link && link.length) || 0],
    [0x08, Ref, WayPointLink],
    [0x10, Ref, Null],
    [0x14, UInt, node => node.id],
    [0x18, UInt, WayPointConfig],
    [0x1C, Ref, (node, { tmp }) => tmp.config],
    [0x24, DeferStr, node => node.name || ''],
    [0x28, Float, node => node.x],
    [0x2C, Float, node => node.y],
    [0x30, Float, node => node.z],
  ], 0x3C)

  function WayPointLink(node) {
    const { link } = node
    if(!(link && link.length)) return
    const buffer = Buffer.alloc(padCeil(link.length))
    link.forEach((v, i) => Int(buffer, v, i * 0x04, 0))
    return buffer
  }

  function WayPointConfig(node, { tmp }) {
    if(!node.config && node.width == null) return 0
    const cfg = node.config || {
      format: 'SGO',
      endian: node.cfgEn || endian,
      variables: [{
        type: "float",
        name: 'rmpa_float_WayPointWidth',
        value: node.width == null ? -1 : node.width,
      }],
    }
    const buf = sgo(cfg)
    const size = buf.length
    tmp.config = Buffer.concat([buf, Buffer.alloc(padCeil(size) - size)])
    return size
  }

  const Shape = Struct([
    [0x08, DeferStr, node => node.type],
    [0x10, DeferStr, node => node.name || ''],
    [0x24, Ref, node => ShapeCoords(node.coords)],
  ], 0x30)

  const ShapeCoords = Struct([
    [0x00, Float, node => node.px],
    [0x04, Float, node => node.py],
    [0x08, Float, node => node.pz],
    [0x10, Float, node => node.sizex],
    [0x14, Float, node => node.sizey],
    [0x18, Float, node => node.sizez],
    [0x30, Float, node => node.diameter],
  ], 0x40)

  function Header(SubHeader) {
  }

  function SubHeader(Type) {
    const Enumerated = Enumeration(Type)
    return Struct([
      [0x14, DeferStr, node => node.name || ''],
      [0x18, UInt, node => node.nodes.length],
      [0x1C, Ref, Enumerated],
      [0x08, Ref, Null],
    ], 0x20)
  }

  const header = Buffer.alloc(0x30)
  Unknowns(header, obj, 0x00)
  Str(header, endian === 'LE' ? 'RMP\0' : '\0PMR', 0x00)

  const types = []
  function addEntry(prop, Type, offset = 0x00) {
    const typeHeaderSize = 0x20
    const subHeaderSize = 0x20

    Int(header, 0x30 + buffersBytes(types), 0x04, offset)
    const count = prop && prop.entries.length
    if(!count) return
    UInt(header, 1, offset)

    const headerSize = typeHeaderSize + subHeaderSize * prop.entries.length
    const typeHeader = Buffer.alloc(headerSize)
    types.push(typeHeader)
    Unknowns(typeHeader, prop, 0x00)
    UInt(typeHeader, prop.entries.length, 0x00) // Amount of entries
    Int(typeHeader, typeHeaderSize, 0x04) // Pointer to first entry
    Int(typeHeader, prop.id, 0x10) // ID
    DeferStr(typeHeader, '', 0x18, 0x00) // Name?
    var headerIdx = typeHeaderSize
    var heapIdx = headerSize
    for(const entry of prop.entries) {
      Unknowns(typeHeader, entry, headerIdx + 0x00)
      Int(typeHeader, heapIdx, headerIdx + 0x1C) // Beginning of enumeration
      Int(typeHeader, entry.id, headerIdx + 0x0C) // ID
      DeferStr(typeHeader, entry.name, 0x14, headerIdx)
      UInt(typeHeader, entry.nodes.length, 0x18, headerIdx)
      const nodes = Type(entry)
      types.push(...nodes)
      heapIdx += buffersBytes(nodes)
      Int(typeHeader, heapIdx - headerIdx, 0x08, headerIdx) // End of enumeration
      headerIdx += subHeaderSize
    }
    Int(typeHeader, heapIdx, 0x0C) // Pointer to end of entry
  }


  addEntry(obj.routes, Enumeration(SubHeader(WayPoint)), 0x08)
  // addEntry(obj.shapes, SubHeader(Shape), 0x10)
  // addEntry(obj.cameras, 0x18)
  // addEntry(obj.spawns, 0x20)
  
  const buffers = [
    header,
    ...types,
  ]

  buffers.push(unrollStrings(buffers))
  return Buffer.concat(buffers)
}

exports.compile = compile
exports.compiler = opts => obj => compile(obj, opts)
