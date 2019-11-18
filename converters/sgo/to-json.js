const decompiler = require('../decompiler')

function decompileSgo(buffer, config) {
  const { decompile, types } = decompiler('SGO', buffer, config)
  const {
    Str,
    UInt,
    Int,
    Float,
    Ref,
    NullPtr,
    Leader,
    Struct,
    Union,
    Collection,
  } = types

  function Extra(cursor, offset, size) {
    return cursor.at(offset).slice(0x00, size).toString('base64')
  }

  const SgoNode = Union([
    Struct({
      [0x00]: ['type', () => 'ptr'],
      [0x04]: ['value', Ref(Collection((...args) => SgoNode(...args), 0x0C))],
    }, 0x0C),
    Struct({
      [0x00]: ['type', () => 'int'],
      [0x04]: ['size', UInt, { ignore: true }],
      [0x08]: ['value', Int],
    }, 0x0C),
    Struct({
      [0x00]: ['type', () => 'float'],
      [0x04]: ['size', UInt, { ignore: true }],
      [0x08]: ['value', Float],
    }, 0x0C),
    Struct({
      [0x00]: ['type', () => 'string'],
      [0x04]: ['size', UInt, { ignore: true }],
      [0x08]: ['value', Str],
    }, 0x0C),
    Struct({
      [0x00]: ['type', () => 'extra'],
      [0x04]: ['value', Ref(Extra)],
    }, 0x0C),
  ], 0x0C)

  const SgoIndex = Struct({
    [0x00]: ['name', Str],
    [0x04]: ['idx', UInt],
  }, 0x08)

  function AddVariableNames(obj, value) {
    for(const { name, idx } of value) {
      obj.variables[idx].name = name
    }
  }

  const SgoHeader = Struct({
    [0x00]: ['endian', Leader('SGO')],
    [0x04]: ['version', UInt],
    [0x08]: ['variables', Ref(Collection(SgoNode))],
    [0x10]: [AddVariableNames, Ref(Collection(SgoIndex))],
    [0x18]: ['nullPtr', NullPtr('SgoHeader'), { ignore: true }],
  }, 0x20)

  return decompile(SgoHeader)
}

decompileSgo.decompile = decompileSgo
decompileSgo.decompiler = opts => buffer => decompileSgo(buffer, opts)

module.exports = decompileSgo
