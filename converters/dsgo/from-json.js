function compileDsgo(compiler, obj) {
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
    Cursor,
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

  function unrollType4({ cmd, value, values }) {
    if(cmd.startsWith('f:[')) { // Process subCommands of unknown name
      value = +value.slice(3, -1).split('/').pop()
      cmd = 'f'
    } else if(cmd.startsWith('f:')) { // Process subCommands with known name
      const subCommand = cmd.slice(2)
      value = type4SubCommands[subCommand]
      cmd = 'f'
      if(!value) throw new Error(`Unknown type4 subcommand: ${subCommand}`)
    }
    return [...(values || []).flatMap(unrollType4), { cmd, value }]
  }

  function type4Size({ cmd, value }) {
    if(cmd === 'value') return 0x0c // 4B type + 8B value
    if(cmd.startsWith('f:')) return 0x08 // 4B type + 4B subtype
    if(value == null) return 0x04 // 4B type
    return 0x08 // 4B type + 4B value
  }

  function Type4Size(obj, _, tmp) {
    const nodes = unrollType4(obj)
    const size = nodes.reduce((sum, obj) => sum + type4Size(obj), 0x04) // 4B trailing. Empty command means "end"
    tmp.nodes = nodes
    tmp.size = size
    return size
  }

  const type4Commands = {
    'end':    0x00,
    'value':  0x01,
    'ref':    0x03,
    'f':      0x04,
    '+':      0x05,
    '-':      0x06,
    '*':      0x07,
    '/':      0x08,
  }

  const type4SubCommands = {
    'limit': 0x80000005,
    'lerp': 0x80000006,
  }

  function writeType4(cursor, { cmd, value }) {
    let valueType = cmd === 'value' ? Double : UInt

    const cmdIndex = type4Commands[cmd]
    if(!cmdIndex) throw new Error(`Command not found: ${cmd}`)

    cursor.write(UInt, cmdIndex, 0x00)
    if(value != null) {
      cursor.write(valueType, value)
    }
  }

  function Type4Data(obj, _, tmp) {
    const { nodes, size } = tmp
    const buffer =  Buffer.alloc(size)
    const cursor = new Cursor(buffer)
    for(const node of nodes) writeType4(cursor, node)
    return cursor.buffer
  }

  const Type4 = Struct([
    [0x00, UInt, Type4Size],
    [0x04, Ref, Allocate(Copy, Type4Data)],
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
      // The padding is after the names table, but the padding will strictly depend on the size of the variables table.
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
    'calc': Struct([
      [0x00, Ref, Allocate(Type4, ({ value }) => value)],
      [0x08, BigUInt, () => 4],
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
