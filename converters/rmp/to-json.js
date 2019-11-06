const fs = require('fs')
const json = require('json-stringify-pretty-compact')
const sgo = require('../sgo/to-json').decompiler
require('util').inspect.defaultOptions.depth = null
// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function decompiler(config = {}) {
  var endian

  function Str(buffer) {
    return (endian === 'LE'
      ? buffer.toString('utf16le')
      : Buffer.from(buffer).swap16().toString('utf16le')
    ).trim()
  }

  function UInt(buffer, offset = 0) {
    return buffer[`readUInt32${endian}`](offset)
  }

  function Int(buffer, offset = 0) {
    return buffer[`readInt32${endian}`](offset)
  }

  function Float(buffer, offset = 0) {
    return buffer[`readFloat${endian}`](offset)
  }

  function Ptr(buffer, index, baseIndex) {
    return baseIndex + Int(buffer, index)
  }

  function Ref(fn) {
    return function Deref(buffer, index, baseIndex) {
      const jump = Ptr(buffer, index, baseIndex)
      return fn(buffer, jump, jump)
    }
  }

  function StrPtr(buffer, index, base) {
    if(base) {
      const ioffset = Int(buffer, index)
      return StrPtr(buffer, base + ioffset)
    }
    const end = buffer.length
    const terminator = Math.min(buffer.indexOf('\0', index, 'utf16le'), end)
    return Str(buffer.slice(index, terminator > 0 ? terminator : end))
  }

  function SGO(buffer, index) {
    return sgo()(buffer.slice(index))
  }

  function Hex(buffer, index) {
    const isValue = UInt(buffer, index)
    if(!isValue) return
    return (
      buffer
        .slice(index, index + 0x04)
        .toString('hex')
        .replace(/^0+/, '')
    )
  }

  function HexKey(i) {
    return `0x${i.toString(16).padStart(2, '0')}`
  }

  function Struct(definitions, size) {
    const block = 0x04
    if(!size) size = Math.max(...Object.keys(definitions).map(k => +k)) + block
    function StructDef(buffer, index = 0) {
      const obj = {}

      for(var i = 0x00; i < size; i += block) {
        const def = definitions[i]

        if(!def) {
          const value = Hex(buffer, index + i)
          if(!value) continue
          const key = HexKey(i)
          obj[key] = value == null ? 0 : value
          continue
        }

        const [key, fn] = def
        const value = fn(buffer, index + i, index)
        obj[key] = value == null ? 0 : value
      }

      return obj
    }

    StructDef.size = size
    return StructDef
  }

  function Leader(buffer) {
    const leader = buffer.slice(0, 4).toString('ascii')
    endian = leader === 'RMP\0' ? 'LE' : 'BE'
    return leader
  }

  const CollectionHeader = Struct({
    [0x00]: ['count', UInt],
    [0x04]: ['startPtr', Ptr],
    [0x0C]: ['endPtr', Ptr],
    [0x10]: ['id', UInt],
    [0x18]: ['name', StrPtr],
  }, 0x20)

  const SubHeader = Struct({
    [0x08]: ['endPtr', UInt],
    [0x0C]: ['id', UInt],
    [0x14]: ['name', StrPtr],
    [0x18]: ['count', UInt],
    [0x1C]: ['startPtr', Ptr],
  }, 0x20)

  const CamerasHeader = Struct({
    [0x04]: ['endPtr', Ptr],
    [0x08]: ['id', UInt],
    [0x14]: ['name', StrPtr],
    [0x18]: ['count', UInt],
    [0x1C]: ['startPtr', Ptr],
  }, 0x20)

  const CameraSubHeader = Struct({
    [0x04]: ['endPtr', UInt],
    [0x14]: ['name', StrPtr],
    [0x18]: ['count', UInt],
    [0x1C]: ['startPtr', Ptr],
    [0x24]: ['timing1', Ptr],
    [0x2C]: ['timing2', Ptr],
  }, 0x20)

  function Collection(Type, CHeader=CollectionHeader, SHeader=SubHeader) {
    return function Collection(buffer, index, _index) {
      const isEntry = UInt(buffer, index - 0x04)
      if(!isEntry) return
      index = Ptr(buffer, index, _index)
      const header = CHeader(buffer, index, index)
      index = header.startPtr
      const entries = Array(header.count).fill(null)

      for(var i = 0; i < header.count; i++) {
        const subHeader = SHeader(buffer, index, index)
        const nodes = Array(subHeader.count).fill(null)

        for(var j = 0; j < subHeader.count; j++) {
          const location = subHeader.startPtr + j * Type.size
          nodes[j] = Type(buffer, location, location)
        }

        delete subHeader.count
        delete subHeader.startPtr
        delete subHeader.endPtr
        entries[i] = { ...subHeader, nodes }

        index += SubHeader.size
      }

      delete header.startPtr
      delete header.endPtr
      delete header.count
      return { ...header, entries }
    }
  }
  Collection.size = 0x20

  function WayPoints(buffer, index) {
    const point = WayPoint(buffer, index, index)
    const cfg = SGO(buffer, point.config)

    delete point.idx

    if(point.config !== point.config2) {
      point.cfg2 = SGO(buffer, point.config2)
    }
    delete point.config
    delete point.config2

    const width = cfg.variables
      .find(n => n.name === 'rmpa_float_WayPointWidth')
    if(width && width.value !== -1) point.width = width.value
    if(!(width && cfg.variables.length === 1)) {
      point.cfg = cfg
    } else if(cfg.endian !== endian) {
      point.cfgEn = cfg.endian
    }

    return point
  }

  const Spawn = Struct({
    [0x04]: ['endPtr', Ptr],
    [0x08]: ['id', UInt],
    [0x0c]: ['px', Float],
    [0x10]: ['py', Float],
    [0x14]: ['pz', Float],
    [0x1c]: ['tx', Float],
    [0x20]: ['ty', Float],
    [0x24]: ['tz', Float],
    [0x34]: ['name', StrPtr],
  }, 0x40)

  const ShapeCoords = Struct({
    [0x00]: ['px', Float],
    [0x04]: ['py', Float],
    [0x08]: ['pz', Float],
    [0x10]: ['sizex', Float],
    [0x14]: ['sizey', Float],
    [0x18]: ['sizez', Float],
    [0x30]: ['diameter', StrPtr],
  }, 0x40)

  const Shape = Struct({
    [0x08]: ['type', StrPtr],
    [0x10]: ['name', StrPtr],
    [0x24]: ['coords', Ref(ShapeCoords)],
  }, 0x30)

  // const CameraNode = Struct({
  //   [0x0C]: ['config', Ref(SGO)],
  //   [0x10]: ['id', UInt],
  //   [0x68]: ['name', StrPtr],
  // }, 0x74)
  const CameraNodeKnownValues = {
    [0x0C]: ['config', Ref(SGO)],
    [0x10]: ['id', UInt],
    [0x68]: ['name', StrPtr],
  }
  function CameraNode(buffer, index, _index) {
    const obj = {}
    const definitions = CameraNodeKnownValues

    const matrix = Array(16).fill(0)
    const matrixStart = 0x1C
    const matrixEnd = matrixStart + 0x40
    for(var i = 0; i < 16; i++) {
      const idx = index + matrixStart + i * 0x04
      matrix[i] = Float(buffer, idx)
    }

    for(var i = 0; i < CameraNode.size; i += 0x04) {
      if(i === matrixStart) {
        obj.matrix = matrix
        continue
      }
      if(i >= matrixStart && i < matrixEnd) continue
      const def = definitions[i]

      if(!def) {
        const value = Hex(buffer, index + i)
        if(!value) continue
        const key = HexKey(i)
        obj[key] = value == null ? 0 : value
        continue
      }

      const [key, fn] = def
      const value = fn(buffer, index + i, index)

      if(key === 'config') {
        if(value.variables.length) {
          obj[key] = value
        } else if(value.endian !== endian) {
          obj.cfgEn = value.endian
        }
      } else {
        obj[key] = value
      }
    }

    const slice = buffer.slice(index + 0x6c, index + 0x6c + 0x08)

    return obj
  }
  CameraNode.size = 0x74

  const Main = Struct({
    [0x00]: ['leader', Leader],
    [0x08]: ['isRoutes', UInt],
    [0x0C]: ['routes', Collection(WayPoints)],
    [0x10]: ['isShapes', UInt],
    [0x14]: ['shapes', Collection(Shape)],
    [0x18]: ['isCameras', UInt],
    [0x1C]: ['cameras', Collection(CameraNode, CamerasHeader, CameraSubHeader)],
    [0x20]: ['isSpawns', UInt],
    [0x24]: ['spawns', Collection(Spawn)],
  }, 0x30)

  function WayPointLink(buffer, index) {
    const ret = [0, 0]
    ret[0] = UInt(buffer, index + 0x00)
    ret[1] = UInt(buffer, index + 0x04)
    const v2 = UInt(buffer, index + 0x08)
    const v3 = UInt(buffer, index + 0x0C)
    if(v2 || v3) ret.push(v2)
    if(v3) ret.push(v3)
    return ret
  }
  WayPointLink.size = 0x10

  const WayPoint = Struct({
    [0x00]: ['idx', UInt],
    [0x04]: ['next', UInt],
    [0x08]: ['link', Ref(WayPointLink)],
    [0x10]: ['config', Ptr],
    [0x14]: ['id', UInt],
    [0x1C]: ['config2', Ptr],
    [0x24]: ['name', StrPtr],
    [0x28]: ['x', Float],
    [0x2C]: ['y', Float],
    [0x30]: ['z', Float],
  }, 0x3C)
  WayPoints.size = WayPoint.size

  return function decompile(buffer, index = 0) {
    const result = Main(buffer, index)

    // Cleanup redundant data
    delete result.leader
    delete result.isRoutes
    delete result.isShapes
    delete result.isCameras
    delete result.isSpawns

    return {
      format: 'RMP',
      endian: endian,
      ...result,
    }
  }
}

function decompile(buffer, opts = {}) {
  const data = decompiler(opts)(buffer)
  return json(data)
}

decompile.decompiler = decompiler

module.exports = decompile
