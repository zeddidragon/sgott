const fs = require('fs')
const sgo = require('../sgo/to-json').decompiler
require('util').inspect.defaultOptions.depth = null

// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function compile(obj) {
  const { endian } = obj

  function Str(buffer, value, offset = 0x00) {
    return buffer.write(value, offset)
  }

  function UInt(buffer, value, offset = 0x00) {
    return buffer[`writeUInt32${endian}`](value, offset)
  }

  function Int(buffer, value, offset = 0x00) {
    return buffer[`writeInt32${endian}`](value, offset)
  }

  function Float(buffer, value, offset = 0x00) {
    return buffer[`writeFloat${endian}`](value, offset)
  }
  
  function Hex(buffer, value, offset = 0x00) {
    return buffer.write(value.padStart(8, '0'), offset, 'hex')
  }

  function stringCompare(a, b) {
    return a > b ? 1 : -1
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
  function DeferStr(buffer, str, base, offset = 0x00) {
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
      Int(buffer, strIdx - bufIdx - base, offset)
    }

    return stringBuffer
  }

  function Unknowns(buffer, obj, offset = 0x00) {
    for(const key of Object.keys(obj)) {
      if(!key.startsWith('0x')) continue
      const pos = parseInt(key.slice(2), 16)
      const value = obj[key]
      Hex(buffer, value, offset + pos)
      buffer.write
    }
  }

  function RouteWaypoints(obj) {
    const { nodes } = obj
    const nodeSize = 0x3C
    const buffer = Buffer.alloc(nodes.length * nodeSize)
    const buffers = [buffer]
    var heapSize = 0x00
    for(var i = 0; i < obj.nodes.length; i++) {
      const offset = i * nodeSize
      const node = obj.nodes[i]
      Unknowns(buffer, node, offset)
      UInt(buffer, i, offset + 0x00)
      UInt(buffer, node.next, offset + 0x04)
      const next = Buffer.alloc(0x10)
      for(var j = 0; j < 4; j++) {
        UInt(next, node.link[i] || 0, 0x04 * j)
      }
      Int(buffer, buffer.length - offset + heapSize, offset + 0x08)
      Float(buffer, node.x, offset + 0x28)
      Float(buffer, node.y, offset + 0x2C)
      Float(buffer, node.z, offset + 0x30)
      heapSize += next.length
    }
    return buffers
  }

  const header = Buffer.alloc(0x30)
  Unknowns(header, obj, 0x00)
  Str(header, endian === 'LE' ? 'RMP\0' : '\0PMR', 0x00)

  const types = []
  function addEntry(prop, Type, offset = 0x00) {
    const typeHeaderSize = 0x20
    const subHeaderSize = 0x20

    Int(header, 0x30 + buffersBytes(types), offset + 0x04)
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
    DeferStr(typeHeader, '', 0x00, 0x18) // Name?
    var headerIdx = typeHeaderSize
    var heapIdx = headerSize
    for(const entry of prop.entries) {
      Unknowns(typeHeader, entry, headerIdx + 0x00)
      Int(typeHeader, heapIdx, headerIdx + 0x1C) // Beginning of enumeration
      Int(typeHeader, entry.id, headerIdx + 0x0C) // ID
      DeferStr(typeHeader, entry.name, headerIdx, headerIdx + 0x14)
      UInt(typeHeader, entry.nodes.length, headerIdx + 0x18)
      const nodes = Type(entry)
      types.push(...nodes)
      heapIdx += buffersBytes(nodes)
      Int(typeHeader, heapIdx, headerIdx + 0x08) // End of enumeration
      headerIdx += subHeaderSize
    }
    Int(typeHeader, heapIdx, 0x0C) // Pointer to end of entry
  }

  addEntry(obj.routes, RouteWaypoints, 0x08)
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

function hexview(buffer) {
  return '           0011 2233   4455 6677   8899 aabb   ccdd eeff\n\n' + (
    buffer
      .toString('hex')
      .match(/.{1,8}/g)
      .map(row => row.match(/.{1,4}/g).join(' '))
      .map(row => row.replace(/0000/g, '\x1b[2m0000\x1b[0m'))
      .reduce((acc, v, i) => {
        if(!(i % 4)) acc.push([])
        acc[acc.length - 1].push(v)
        return acc
      }, [])
      .map(row => row.join('   '))
      .map((row, i) => (i * 0x10).toString(16).padStart(8) + '   ' + row)
      .join('\n')
  )
}

const json = JSON.parse(fs.readFileSync('tmp/m190mission.json', 'utf8'))
const result = compile(json)
const slice = 0x180
console.log('\nReconstructed')
console.log(hexview(result.slice(0, slice)))
const buffer = fs.readFileSync('testdata/M190/MISSION.RMPA')
console.log('\nReal')
console.log(hexview(buffer.slice(0, slice)))
