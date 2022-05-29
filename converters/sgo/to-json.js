const decompiler = require('../decompiler')

function decompileSgo(buffer, config) {
  const { decompile, types } = decompiler('SGO', buffer, config)
  const {
    Str,
    UInt,
    Int,
    Float,
    Ref,
    XRef,
    NullPtr,
    Leader,
    Struct,
    Union,
    Collection,
  } = types

  function Extra(cursor, offset, size) {
    const leader = cursor.at(offset).slice(0x00, 0x04).toString()
    const data = cursor.at(offset).slice(0x00, size)
    switch(leader) {
      case 'SGO\0':
      case '\0OGS': {
        return decompileSgo(cursor, {
          offset,
        })
      }
      default: {
        return data.toString('base64')
      }
    }
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
      obj.variables[idx] = {
        name,
        ...obj.variables[idx],
      }
    }
  }

  function AddVariables2017(obj, [variables, labels]) {
    let i = 0
    for(const { name } of labels) {
      variables[i++].name = name
    }
    obj.variables = variables
    obj.version = 0xEDF2017
  }

  const SgoIndex2017 = Struct({
    [0x00]: ['name', Str],
  }, 0x04)

  const SgoHeader = (() => {
    const SgoLeader = Struct({
      [0x00]: ['endian', Leader('SGO')],
      [0x04]: ['version', UInt],
      [0x08]: ['offset2017', UInt],
    }, 0x0a)
    const { version, offset2017 } = decompile(SgoLeader)
    if(offset2017 === 0x10 && version !== 0x102) { // 2017 style header block
      return Struct({
        [0x00]: ['endian', Leader('SGO')],
        [0x04]: [AddVariables2017, XRef([
          Collection(SgoNode),
          Collection(SgoIndex2017)])],
      }, 0x10)
    }

    return Struct({
      [0x00]: ['endian', Leader('SGO')],
      [0x04]: ['version', UInt],
      [0x08]: ['variables', Ref(Collection(SgoNode))],
      [0x10]: [AddVariableNames, Ref(Collection(SgoIndex))],
      [0x18]: ['nullPtr', NullPtr('SgoHeader'), { ignore: true }],
    }, 0x20)
  })()

  return decompile(SgoHeader)
}

decompileSgo.decompile = decompileSgo
decompileSgo.decompiler = opts => buffer => decompileSgo(buffer, opts)

module.exports = decompileSgo
