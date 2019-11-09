const json = require('json-stringify-pretty-compact')
const sgo = require('../sgo/to-json').decompiler
require('util').inspect.defaultOptions.depth = null
// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function decompiler(config = {}) {
  var endian

  function Str(buffer, offset = 0, base = 0) {
    buffer = buffer.slice(base + offset)
    return (endian === 'LE'
      ? buffer.toString('utf16le')
      : Buffer.from(buffer).swap16().toString('utf16le')
    ).trim()
  }

  function UInt(buffer, offset = 0, base = 0) {
    return buffer[`readUInt32${endian}`](base + offset)
  }

  function Int(buffer, offset = 0, base = 0) {
    return buffer[`readInt32${endian}`](base + offset)
  }

  function Float(buffer, offset = 0, base = 0) {
    return buffer[`readFloat${endian}`](base + offset)
  }

  function Ptr(buffer, offset = 0, base = 0) {
    return base + Int(buffer, offset, base)
  }

  function Ref(fn) {
    return function Deref(buffer, offset = 0, base = 0) {
      const jump = Ptr(buffer, offset, base)
      return fn(buffer, 0, jump)
    }
  }

  function StrPtr(buffer, offset = 0, base = 0) {
    const index = base + offset
    const end = buffer.length
    const terminator = Math.min(buffer.indexOf('\0', index, 'utf16le'), end)
    return Str(buffer.slice(index, terminator > 0 ? terminator : end))
  }

  function SGO(buffer, offset = 0, base = 0) {
    return sgo()(buffer.slice(base + offset))
  }

  function Hex(buffer, offset = 0, base = 0, full = false) {
    const isValue = UInt(buffer, offset, base)
    if(!isValue && !full) return
    const index = base + offset
    return (
      buffer
        .slice(index, index + 0x04)
        .toString('hex')
        .replace(full ? '' : /^0+/, '')
    )
  }

  function HexKey(i) {
    return `0x${i.toString(16).padStart(2, '0')}`
  }

  function Struct(definitions, size) {
    const block = 0x04
    if(!size) size = Math.max(...Object.keys(definitions).map(k => +k)) + block
    function StructDef(buffer, offset = 0, base = 0) {
      const obj = {}
      const index = base + offset
      if(config.debug) obj.dbg = {
        '@': HexKey(index),
        values: [],
      }

      for(var i = 0x00; i < size; i += block) {
        const def = definitions[i]
        const raw = config.debug || !def
        const [key, fn, opts = {}] = def || []
        const value = fn && (fn(buffer, i, index) || 0)
        const hexKey = raw && HexKey(i)
        const hexValue = raw && Hex(buffer, i, index)

        if(config.debug) {
          const dbg = [hexKey, Hex(buffer, i, index, true)]
          if(key) dbg.push(key, value || 0)
          obj.dbg.values.push(dbg)
        }

        if(def && (config.debug || !opts.ignore)) {
          obj[key] = value == null ? 0 : value
        }
        if(!def && hexValue) {
          obj[hexKey] = hexValue
        }

      }

      return obj
    }

    StructDef.size = size
    return StructDef
  }

  function Leader(buffer, offset = 0, base = 0) {
    const index = base + offset
    const leader = buffer
      .slice(index, index + 0x4)
      .toString('ascii')
    endian = leader === 'RMP\0' ? 'LE' : 'BE'
    return leader
  }

  const CollectionHeader = Struct({
    [0x00]: ['count', UInt],
    [0x04]: ['startPtr', Ptr],
    [0x0C]: ['endPtr', Ptr, { ignore: true }],
    [0x10]: ['id', UInt],
    [0x18]: ['name', StrPtr],
  }, 0x20)

  const SubHeader = Struct({
    [0x08]: ['endPtr', UInt, { ignore: true }],
    [0x0C]: ['id', UInt],
    [0x14]: ['name', StrPtr],
    [0x18]: ['count', UInt],
    [0x1C]: ['startPtr', Ptr],
  }, 0x20)

  const CamerasHeader = Struct({
    [0x04]: ['endPtr', Ptr, { ignore: true }],
    [0x08]: ['id', UInt],
    [0x14]: ['name', StrPtr],
    [0x18]: ['count', UInt],
    [0x1C]: ['startPtr', Ptr],
  }, 0x20)

  const CameraSubHeader = Struct({
    [0x04]: ['endPtr', UInt, { ignore: true }],
    [0x14]: ['name', StrPtr],
    [0x18]: ['count', UInt],
    [0x1C]: ['startPtr', Ptr],
    [0x24]: ['timing1', Ptr],
    [0x2C]: ['timing2', Ptr],
  }, 0x20)

  function Collection(Type, CHeader=CollectionHeader, SHeader=SubHeader) {
    return function Collection(buffer, offset = 0, base = 0) {
      const isEntry = UInt(buffer, offset - 0x04, base)
      if(!isEntry) return
      base = Ptr(buffer, offset, base)
      offset = 0
      const header = CHeader(buffer, offset, base)
      base = header.startPtr
      const entries = Array(header.count).fill(null)

      for(var i = 0; i < header.count; i++) {
        const subHeader = SHeader(buffer, offset, base)
        const nodes = Array(subHeader.count).fill(null)

        for(var j = 0; j < subHeader.count; j++) {
          const location = subHeader.startPtr + j * Type.size
          nodes[j] = Type(buffer, 0, location)
        }

        delete subHeader.count
        delete subHeader.startPtr
        entries[i] = { ...subHeader, nodes }

        base += SubHeader.size
      }

      delete header.startPtr
      delete header.count
      return { ...header, entries }
    }
  }
  Collection.size = 0x20

  function WayPoints(buffer, offset = 0, base = 0) {
    const point = WayPoint(buffer, offset, base)
    if(config.debug) {
      point.dbg.deref = {
        link: point.link.dbg,
      }
    }
    const cfg = SGO(buffer, 0, point.config)

    delete point.idx

    if(point.config2 && point.config !== point.config2) {
      point.cfg2 = SGO(buffer, 0, point.config2)
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
    [0x04]: ['endPtr', Ptr, { ignore: true }],
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
  function CameraNode(buffer, offset = 0, base = 0) {
    const obj = {}
    const index = base + offset
    const definitions = CameraNodeKnownValues

    const matrix = Array(16).fill(0)
    const matrixStart = 0x1C
    const matrixEnd = matrixStart + 0x40
    for(let i = 0; i < 16; i++) {
      const idx = index + matrixStart + i * 0x04
      matrix[i] = Float(buffer, idx)
    }

    for(let i = 0; i < CameraNode.size; i += 0x04) {
      if(i === matrixStart) {
        obj.matrix = matrix
        continue
      }
      if(i >= matrixStart && i < matrixEnd) continue
      const def = definitions[i]

      if(!def) {
        const value = Hex(buffer, i, index)
        if(!value) continue
        const key = HexKey(i)
        obj[key] = value == null ? 0 : value
        continue
      }

      const [key, fn] = def
      const value = fn(buffer, i, index)

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

  function WayPointLink(buffer, offset = 0, base = 0) {
    const index = base + offset
    const ret = [0, 0]
    ret[0] = Int(buffer, 0x00, index)
    ret[1] = Int(buffer, 0x04, index)
    const v2 = Int(buffer, 0x08, index)
    const v3 = Int(buffer, 0x0C, index)
    if(v2 || v3) ret.push(v2, v3)
    if(config.debug) {
      ret.dbg = {
        '@': HexKey(index),
        raw: [0x00, 0x04, 0x08, 0x0C]
          .map(addr => Hex(buffer, addr, index, true))
          .join(' ')
      }
    }
    return ret
  }
  WayPointLink.size = 0x10

  const WayPoint = Struct({
    [0x00]: ['idx', UInt],
    [0x04]: ['linkType', UInt],
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
    const result = Main(buffer, 0, index)

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
