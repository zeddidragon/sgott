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
    Copy,
    Struct,
    Allocate,
    Collection,
    DeferStr,
  } = types
  const sgoValueTypes = {
    ptr: [0, Ref],
    int: [1, Int],
    float: [2, Float],
    string: [3, DeferStr],
    extra: [4, Ref],
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

    const buffer = Buffer.from(value, 'base64')
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
    extra(node, cursor, tmp) {
      return Allocate(Copy, () => tmp.buffer, { padding: 0x10 })(node)
    }
  }

  function WriteSgoValue(cursor, value) {
    sgoValueTypes[node.type][0](cursor, value)
  }

  const SgoNode = Struct([
    [0x00, UInt, node => sgoValueTypes[node.type][0]],
    [0x04, UInt, SgoSize],
    [0x08, WriteSgoValue, node => SgoValue[node.type](node)],
  ], 0x0C)

  const SgoHeader = Struct([
    [0x00, Str, obj => (obj.endian === 'BE' ? '\0OGS' : 'SGO\0')],
    [0x04, UInt, obj => obj.version || 0x0102],
    [0x08, UInt, obj => obj.variables.length],
    [0x0C, Ref, Collection(SgoNode, obj => obj.variables)],
    [0x10, UInt, obj => obj.variables.length],
    [0x14, Ref, Collection(DeferStr, obj => obj.variables.map(v => v.name))],
    [0x1C, Ref, Null],
  ], 0x20)

  return compile(SgoHeader)
}

compileSgo.compile = compileSgo
compileSgo.compiler = () => obj => compileSgo(obj)

module.exports = compileSgo
