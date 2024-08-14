const compiler = require('../compiler.js')
  const infer = require('../infer.js')

function compileDsgo(obj) {
  const { compile, types } = compiler(obj)
  const {
    Str,
    DRef: Ref,
    UInt,
    BigUInt,
    Double,
    Struct,
    Union,
    Copy,
    Allocate,
    Collection,
    Tuple,
    Defer,
    DeferStr,
  } = types

  const nodes = []
  const heap = []
  const stringSet = new Set(obj.strings || [])

  function ExtraSize({ data, format }) {
    return Buffer.byteLength(data, format)
  }

  function Extra({ data, format }) {
    return Buffer.from(data, format)
  }

  const DsgoExtra = Struct([
    [0x00, UInt, ExtraSize],
    [0x04, Ref, Allocate(Copy, Extra, { padding: 0x08 })],
  ], 0x08)

  const DsgoName = Struct([
    [0x00, DeferStr, ([, name]) => name],
    [0x04, UInt, ([index]) => index],
  ], 0x08)

  const DsgoTable = Struct([
    [0x08, Ref, Collection(UInt, obj => obj.indices)],
    [0x0c, UInt, obj => obj.indices?.length || 0],
    [0x00, Ref, Collection(DsgoName, obj => obj.strings)],
    [0x04, UInt, (obj, cursor) => {
      // Dsgo tables have a bit of padding at the end to align to the next adress divisible by 0x08
      // The padding is adter the names table, but the padding will strictly depend on the size of the variabls table.
      // We handle it here at the end as a hack.
      // The actual value returned is simply the size of the strings table.
      //
      if(obj.indices.length % 2) {
        const padding = 0x04
        function Padding() {
        }
        Padding.size = padding
        Allocate(Padding, () => Buffer.alloc(padding))(obj, cursor)
      }

      return obj.strings?.length || 0
    }],
  ], 0x10)

  const DsgoNode = Union('type', {
    'double': Struct([
      [0x00, Double, ({ value }) => value || 0x00],
      [0x08, BigUInt, () => 0],
    ], 0x10),
    'str': Struct([
      [0x00, DeferStr, ({ value }) => value || ''],
      [0x08, BigUInt, () => 1],
    ], 0x10),
    'extra': Struct([
      [0x00, Ref, Allocate(DsgoExtra, ({ value }) => value)],
      [0x08, BigUInt, () => 2],
    ], 0x10),
    'ptr': Struct([
      [0x00, Ref, Allocate(DsgoTable, ({ value }) => {
        const stringMap = {}
        const count = value?.length || 0
        for(let i = 0; i < count; i++) {
          const v = value[i]
          if(v.name == null) {
            continue
          }
          stringMap[v.name] = i
        } 
        const indices = value?.map(v => unrolled.indexOf(v)) || []
        const strings = Object.keys(stringMap)
          .sort()
          .map(str => [stringMap[str], str])
        return {
          indices,
          strings,
        }
      })],
      [0x08, BigUInt, () => 3],
    ], 0x10),
  }, 0x10)

  const unrolled = unrollNode({
    type: 'ptr',
    value: obj.variables,
  })
  const DsgoHeader = Struct([
    // Filetype header indicating this is a DSGO file.
    // For big-endian the header might instead says OGSD (not verified)
    [0x00, Str, obj => (obj.endian === 'BE' ? 'OGSD' : 'DSGO')],
    // Index of DSGO nodes
    [0x04, Ref, Collection(DsgoNode, () => unrolled)],
    // Total amount of nodes
    [0x08, UInt, () => unrolled.length],
    // Pointer to the entry node
    [0x0c, UInt, () => 0x10],
    // Also amount of top-level variables? Likely points at the amount of variable names.
  ], 0x10)

  function unrollNode(node) {
    if(Array.isArray(node.value)) {
      return [node, ...node.value.flatMap(unrollNode)]
    }
    return node
  }

  return compile(DsgoHeader)
}

compileDsgo.compile = compileDsgo
compileDsgo.compiler = () => obj => compileDsgo(obj)

module.exports = compileDsgo
