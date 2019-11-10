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

  function StructCollection(definitions, size) {
    const block = 0x04
    if(!size) size = Math.max(...definitions).map(([k]) => +k) + block
    function StructDef(obj) {
      const { nodes } = obj
      const buffer = Buffer.alloc(padCeil(nodes.length * size))
      const buffers = [buffer]
      var heapSize = 0x00
      var offset = 0x00

      const mem = {
        addToHeap(buf) {
          const idx = mem.heapIdx()
          if(!buf) return idx
          heapSize += buf.length
          buffers.push(buf)
          return idx
        },
        heapIdx() {
          return buffer.length - offset + heapSize
        }
      }

      for(var i = 0; i < nodes.length; i++) {
        const tmp = {}
        const base = i * size
        offset = base
        const node = nodes[i]
        Unknowns(buffer, node, 0x00, base)
        for(const [off, writeFn, valueFn] of definitions) {
          const value = valueFn(node, { i, mem, tmp })
          writeFn(buffer, value, off, base, { i, mem, tmp })
        }
      }

      return buffers
    }
    return StructDef
  }

  function Ref(buffer, refBuffer, offset, base, { mem }) {
    return Int(buffer, mem.addToHeap(refBuffer), offset, base)
  }

  function Null() {
    return null
  }

  const WayPoints = StructCollection([
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

  addEntry(obj.routes, WayPoints, 0x08)
  // addEntry(obj.shapes, 0x10)
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
