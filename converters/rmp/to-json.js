const decompiler = require('../../helpers/read-bytes')
const sgo = require('../sgo/to-json').decompiler

function decompile(buffer, config) {
  const { decompile, types } = decompiler('RMP', buffer, config)
  const {
    Str,
    UInt,
    Int,
    Float,
    Ref,
    NullPtr,
    Tuple,
    Struct,
    Collection,
  } = types

  function SubHeader(Type) {
    return Struct({
      [0x04]: ['nullPtr', NullPtr('SubHeader'), { ignore: true }],
      [0x0C]: ['id', UInt],
      [0x14]: ['name', Str],
      [0x18]: ['nodes', Ref(Collection(Type))],
    }, 0x20)
  }

  function TypeHeader(Type) {
    return Struct({
      [0x00]: ['entries', Ref(Collection(SubHeader(Type)))],
      [0x08]: ['nullPtr', NullPtr('TypeHeader'), { ignore: true }],
      [0x10]: ['id', UInt],
      [0x18]: ['name', Str],
    }, 0x20)
  }

  function SGO(cursor, offset = 0x00) {
    const value = sgo()(cursor.at(offset))
    return value
  }

  function Leader(cursor) {
    const leader = cursor.at(0x00).slice(0x00, 0x04).toString('ascii')
    cursor.endian = leader === 'RMP\0' ? 'LE' : 'BE'
    return cursor.endian
  }
  Leader.size = 0x04

  function WayPointConfig(obj, val, cursor) {
    if(!val) {
      return
    }
    const width = val.variables.find(v => v.name === 'rmpa_float_WayPointWidth')
    if(width && val.variables.length === 1) {
      obj.width = width.value
      if(val.endian !== cursor.endian) obj.cfgEn = val.endian
    } else {
      obj.config = val
    }
  }

  function CameraConfig(obj, val, cursor) {
    if(!val) {
      return
    }
    if(!val.variables.length) {
      if(val.endian !== cursor.endian) obj.cfgEn = val.endian
    } else {
      obj.config = val
    }
  }

  const WayPoint = Struct({
    [0x00]: ['idx', UInt, { ignore: true }],
    [0x04]: ['link', Ref(Collection(UInt))],
    [0x0C]: ['nullPtr', NullPtr('WayPoint'), { ignore: true }],
    [0x14]: ['id', UInt],
    [0x18]: [WayPointConfig, Ref(SGO)],
    [0x24]: ['name', Str],
    [0x28]: ['pos', Tuple(Float, 3)],
  }, 0x3C)

  const ShapeData = Struct({
    [0x00]: ['pos', Tuple(Float, 3)],
    [0x10]: ['box', Tuple(Float, 3)],
    [0x30]: ['diameter', Float],
  }, 0x40)

  const Shape = Struct({
    [0x08]: ['type', Str],
    [0x10]: ['name', Str],
    [0x14]: ['nullPtr', NullPtr('Shape'), { ignore: true }],
    [0x1C]: ['id', UInt],
    [0x20]: ['coords', Ref(ShapeData)],
  }, 0x30)

  const Spawn = Struct({
    [0x00]: ['nullPtr', NullPtr('Spawn'), { ignore: true }],
    [0x08]: ['id', UInt],
    [0x0C]: ['pos', Tuple(Float, 3)],
    [0x1C]: ['look', Tuple(Float, 3)],
    [0x34]: ['name', Str],
  }, 0x40)

  const CameraNode = Struct({
    [0x08]: [CameraConfig, Ref(SGO, { force: true })],
    [0x10]: ['id', UInt],
    [0x1C]: ['matrix', Tuple(Float, 16)],
    [0x68]: ['name', Str],
  }, 0x74)

  const CameraTimingNode = Struct({
    [0x00]: ['f00', Float],
    [0x04]: ['f04', Float],
    [0x08]: ['i08', Int],
    [0x14]: ['f14', Float],
    [0x18]: ['f18', Float],
  }, 0x1C)

  const CameraTimingHeader = Struct({
    [0x00]: ['f00', Float],
    [0x04]: ['nodes', Ref(Collection(CameraTimingNode))],
  }, 0x10)

  const CameraSubHeader = Struct({
    [0x00]: ['nullPtr', NullPtr('Spawn'), { ignore: true }],
    [0x14]: ['name', Str],
    [0x18]: ['nodes', Ref(Collection(CameraNode))],
    [0x20]: ['timing1', Ref(CameraTimingHeader)],
    [0x28]: ['timing2', Ref(CameraTimingHeader)],
  }, 0x30)

  const CameraHeader = Struct({
    [0x00]: ['nullPtr', NullPtr('Spawn'), { ignore: true }],
    [0x08]: ['id', UInt],
    [0x14]: ['name', Str],
    [0x18]: ['entries', Ref(Collection(CameraSubHeader))],
  }, 0x20)

  const RmpHeader = Struct({
    [0x00]: ['endian', Leader],
    [0x08]: ['routes', Ref(TypeHeader(WayPoint))],
    [0x10]: ['shapes', Ref(TypeHeader(Shape))],
    [0x18]: ['cameras', Ref(CameraHeader)],
    [0x20]: ['spawns', Ref(TypeHeader(Spawn))],
    // [0x28]: ['abort', process.exit]
  }, 0x30)

  return decompile(RmpHeader)
}

module.exports = decompile
