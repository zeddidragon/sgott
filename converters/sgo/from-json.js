const compiler = require('../compiler.js')
const infer = require('../infer.js')

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
    Union,
    Collection,
    Defer,
    DeferStr,
  } = types

  function ExtraSize(cursor, value, offset, tmp) {
    const buffer = infer.compileData(value.data || value)
    tmp.buffer = buffer
    if(/sgo/i.test(value.format || value.type)) {
      const variables = value.data ? value.data.variables : value.variables
      if(!(variables && variables.length)) return
    }
    UInt(cursor, buffer.length, offset)
  }

  const SgoNode = Union('type', {
    'ptr': Struct([
      [0x00, UInt, () => 0],
      [0x04, UInt, obj => (obj.value && obj.value.length) || 0x00],
      [0x08, Ref, Collection((...args) => SgoNode(...args), obj => obj.value, { size: 0x0C })],
    ], 0x0C),
    'int': Struct([
      [0x00, UInt, () => 1],
      [0x04, UInt, () => 0x04],
      [0x08, Int, obj => obj.value || 0],
    ], 0x0C),
    'float': Struct([
      [0x00, UInt, () => 2],
      [0x04, UInt, () => 0x04],
      [0x08, Float, obj => obj.value || 0],
    ], 0x0C),
    'string': Struct([
      [0x00, UInt, () => 3],
      [0x04, UInt, obj => (obj.value && obj.value.length) || 0x00],
      [0x08, DeferStr, obj => obj.value || ''],
    ], 0x0C),
    'extra': Struct([
      [0x00, UInt, () => 4],
      [0x04, ExtraSize, obj => obj.value],
      [0x08, Defer, (obj, cursor, tmp) => tmp.buffer],
    ], 0x0C),
  }, 0x0C)

  const SgoHeader = (() => {
    if(obj.version === 0xEDF2017) {
      const SgoIndex2017 = Struct([
        [0x00, DeferStr, node => node.name],
      ], 0x04)

      return Struct([
        [0x00, Str, obj => (obj.endian === 'BE' ? '\0OGS' : 'SGO\0')],
        [0x04, UInt, obj => obj.variables.length],
        [0x08, Ref, Collection(SgoNode, obj => obj.variables)],
        [0x0C, Ref, Collection(SgoIndex2017, obj => obj.variables, {
          padding: 0x10,
        })],
      ], 0x10)
    }

    const SgoIndex = Struct([
      [0x00, DeferStr, node => node.name],
      [0x04, UInt, (node, cursor) => cursor.writeCount],
    ], 0x08)

    return Struct([
      // Filetype header indicating this is an SGO file.
      // For big-endian the header instead says OGS
      [0x00, Str, obj => (obj.endian === 'BE' ? '\0OGS' : 'SGO\0')],
      // SGO version number?
      [0x04, UInt, obj => obj.version || 0x0102],
      // Amount of top-level variables.
      [0x08, UInt, obj => obj.variables.length],
      // Pointer to the start of the top-level variables.
      [0x0C, Ref, Collection(SgoNode, obj => obj.variables)],
      // Also amount of top-level variables? Likely points at the amount of variable names.
      [0x10, UInt, obj => obj.variables.length],
      // Pointer to string array of variable namese.
      [0x14, Ref, Collection(SgoIndex, obj => obj.variables, {
        padding: 0x10,
        dbg: 'vars',
      })],
      [0x1C, Ref, Null],
    ], 0x20)
  })()

  return compile(SgoHeader)
}

compileSgo.compile = compileSgo
compileSgo.compiler = () => obj => compileSgo(obj)

module.exports = compileSgo
