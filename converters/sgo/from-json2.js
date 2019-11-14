const compiler = require('../../helpers/compiler')

function compileSgo(obj) {
  const { compile, types } = compiler(obj)
  const {
    Str,
    Ref,
    UInt,
    Int,
    Float,
    Null,
    Struct,
    Allocate,
    Collection,
    Defer,
    DeferStr,
  } = types
  const sgoValueTypes = {
    ptr: [0, Ref],
    int: [1, Int],
    float: [2, Float],
    string: [3, DeferStr],
    extra: [4, Defer],
  }

  function SgoType(node, cursor, tmp) {
    const [typeId, typeFn] = sgoValueTypes[node.type]
    tmp.typeFn = typeFn
    return typeId
  }

  function SgoSize({ type, value }, cursor, tmp) {
    if(value == null) return 0
    if(type === 'ptr') return value.length
    if(type === 'string') return value.trim().length
    if(type === 'extra') return ExtraSize(value, cursor, tmp)
    return 0x04
  }

  function ExtraSgo(value, cursor, tmp) {
    const buffer = compileSgo(value)
    tmp.buffer = buffer
    const variables = value.variables || value.data.variables
    if(variables && variables.length) return buffer.length
    return 0
  }

  function ExtraSize(value, cursor, tmp) {
    const format = value.type || value.format
    if(/sgo/i.test(format)) return ExtraSgo(value, cursor, tmp)

    const buffer = Buffer.from(value.data || value, 'base64')
    tmp.buffer = buffer
    return buffer.length
  }

  const SgoValue = {
    ptr({ value }) {
      if(value == null) return 0
      return Collection(SgoNode)(value)
    },
    int: ({ value }) => value,
    float: ({ value }) => value,
    string: ({ value }) => (value || '').trim(),
    extra: (node, cursor, tmp) => tmp.buffer,
  }

  function WriteSgoValue(cursor, value, off, tmp) {
    tmp.typeFn(cursor, value, off, tmp)
  }

  const SgoNode = Struct([
    [0x00, UInt, SgoType],
    [0x04, UInt, SgoSize],
    [0x08, WriteSgoValue, (...args) => SgoValue[args[0].type](...args)],
  ], 0x0C)

  const SgoIndex = Struct([
    [0x00, DeferStr, node => node.name],
    [0x04, UInt, (node, cursor) => cursor.writeCount],
  ], 0x08)

  const SgoHeader = Struct([
    [0x00, Str, obj => (obj.endian === 'BE' ? '\0OGS' : 'SGO\0')],
    [0x04, UInt, obj => obj.version || 0x0102],
    [0x08, UInt, obj => obj.variables.length],
    [0x0C, Ref, Collection(SgoNode, obj => obj.variables)],
    [0x10, UInt, obj => obj.variables.length],
    [0x14, Ref, Collection(SgoIndex, obj => obj.variables, { padding: 0x10 })],
    [0x1C, Ref, Null],
  ], 0x20)

  return compile(SgoHeader)
}

compileSgo.compile = compileSgo
compileSgo.compiler = () => obj => compileSgo(obj)

module.exports = compileSgo
