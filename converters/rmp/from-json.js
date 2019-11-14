const compiler = require('../../helpers/compiler')
const sgo = require('../sgo/from-json')

function compile(obj) {
  const { compile, types } = compiler(obj)
  const {
    Str,
    UInt,
    Int,
    Float,
    Tuple,
    DeferStr,
    Ref,
    Null,
    Allocate,
    Struct,
    Collection,
  } = types

  function SubHeader(Type) {
    return Struct([
      [0x0C, UInt, entry => entry.id],
      [0x14, DeferStr, entry => entry.name || ''],
      [0x18, UInt, entry => (entry.nodes && entry.nodes.length) || 0],
      [0x1C, Ref, Collection(Type, entry => entry.nodes)],
      [0x08, Ref, Null],
    ], 0x20)
  }

  function Sgo(cursor, buffer, tmp) {
    tmp.sgoSize = buffer.length
    buffer.copy(cursor.buffer)
  }

  function WayPointSgo(node, { endian }) {
    const cfg = node.config || {
      format: 'SGO',
      endian: node.cfgEn || endian,
      variables: [{
        type: "float",
        name: 'rmpa_float_WayPointWidth',
        value: node.width == null ? -1 : node.width,
      }],
    }
    return sgo(cfg)
  }

  const WayPoint = Struct([
    [0x00, UInt, (node, cursor) => cursor.writeCount],
    [0x04, UInt, node => (node.link && node.link.length) || 0],
    [0x08, Ref, Collection(UInt, node => node.link)],
    [0x10, Ref, Null],
    [0x14, UInt, node => node.id],
    [0x1C, Ref, Allocate(Sgo, WayPointSgo, { padding: 0x10 })],
    [0x18, UInt, (node, cursor, tmp) => tmp.sgoSize],
    [0x24, DeferStr, node => node.name || ''],
    [0x28, Tuple(Float, 4), node => node.pos],
  ], 0x3C)

  const ShapeData = Struct([
    [0x00, Tuple(Float, 4), node => node.pos],
    [0x10, Tuple(Float, 4), node => node.box],
    [0x30, Float, node => node.diameter],
  ], 0x40)

  const Shape = Struct([
    [0x08, DeferStr, node => node.type],
    [0x10, DeferStr, node => node.name || ''],
    [0x18, Ref, Null],
    [0x1C, UInt, node => node.id],
    [0x20, UInt, node => +!!node.coords],
    [0x24, Ref, Allocate(ShapeData, node => node.coords)],
  ], 0x30)

  const Spawn = Struct([
    [0x08, UInt, node => node.id],
    [0x0C, Tuple(Float, 4), node => node.pos],
    [0x1C, Tuple(Float, 4), node => node.look],
    [0x34, DeferStr, node => node.name || ''],
    [0x04, Ref, Null],
  ], 0x40)

  function TypeHeader(Type, cb) {
    return Struct([
      [0x00, UInt, obj => (obj.entries && obj.entries.length) || 0],
      [0x04, Ref, Collection(SubHeader(Type), obj => obj.entries)],
      [0x0C, Ref, Null],
      [0x10, UInt, obj => obj.id],
      [0x18, DeferStr, obj => obj.name || ''],
    ], 0x20)
  }

  function CameraConfigSgo(node, { endian }) {
    const cfg = node.config || {
      format: 'SGO',
      endian: node.cfgEn || endian,
      variables: [],
    }
    return sgo(cfg)
  }

  const CameraNode = Struct([
    [0x0C, Ref, Allocate(Sgo, CameraConfigSgo, { padding: 0x10 })],
    [0x08, UInt, (node, cursor, tmp) => (node.config && tmp.sgoSize) || 0],
    [0x10, UInt, node => node.id],
    [0x1C, Tuple(Float, 16), node => node.matrix],
    [0x68, DeferStr, node => node.name || ''],
  ], 0x74)

  const CameraTimingNode = Struct([
    [0x00, Float, node => node.f00 || 0],
    [0x04, Float, node => node.f04 || 0],
    [0x08, Int, node => (node.i08 == null ? 1 : node.i08)],
    [0x14, Float, node => (node.f14 == null ? 1 : node.f14)],
    [0x18, Float, node => (node.f18 == null ? 1 : node.f18)],
  ], 0x1C)

  const CameraTimingHeader = Struct([
    [0x00, Float, timer => timer.f00 || 0],
    [0x04, UInt, timer => (timer.nodes && timer.nodes.length) || 0],
    [0x08, Ref, Collection(CameraTimingNode, timer => timer.nodes)],
  ], 0x10)

  const CameraSubHeader = Struct([
    [0x14, DeferStr, entry => entry.name || ''],
    [0x18, UInt, entry => (entry.nodes && entry.nodes.length) || 0],
    [0x1C, Ref, Collection(CameraNode, entry => entry.nodes)],
    [0x20, UInt, entry => +!!entry.timing1],
    [0x24, Ref, Allocate(CameraTimingHeader, entry => entry.timing1)],
    [0x28, UInt, entry => +!!entry.timing2],
    [0x2C, Ref, Allocate(CameraTimingHeader, entry => entry.timing2)],
    [0x04, Ref, Null],
  ], 0x30)
  
  const CameraHeader = Struct([
    [0x08, UInt, obj => obj.id],
    [0x14, DeferStr, obj => obj.name || ''],
    [0x18, UInt, obj => (obj.entries && obj.entries.length) || 0],
    [0x1C, Ref, Collection(CameraSubHeader, obj => obj.entries)],
    [0x04, Ref, Null],
  ], 0x20)

  const RmpHeader = Struct([
    [0x00, Str, obj => (obj.endian === 'LE' ? 'RMP\0' : '\0PMR')],
    [0x08, UInt, obj => +!!obj.routes],
    [0x0C, Ref, Allocate(TypeHeader(WayPoint), obj => obj.routes)],
    [0x10, UInt, obj => +!!obj.shapes],
    [0x14, Ref, Allocate(TypeHeader(Shape), obj => obj.shapes)],
    [0x18, UInt, obj => +!!obj.cameras],
    [0x1C, Ref, Allocate(CameraHeader, obj => obj.cameras)],
    [0x20, UInt, obj => +!!obj.spawns],
    [0x24, Ref, Allocate(TypeHeader(Spawn), obj => obj.spawns)],
  ], 0x30)

  return compile(RmpHeader)
}

compile.compile = compile
compile.compiler = opts => obj => compile(obj, opts)

module.exports = compile
