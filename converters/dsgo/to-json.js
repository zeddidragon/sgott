function decompileDsgo(decompiler, buffer, config) {
  const { decompile, types } = decompiler('DSGO', buffer, config)
  const {
    Str,
    UInt,
    BigUInt,
    Double,
    Ref,
    Ptr,
    Leader,
    Struct,
    Collection,
  } = types

  // Signature different from other decompilers!!
  function Type4(cursor) {
    function int() {
      const val = UInt(cursor)
      cursor.move(0x04)
      return val
    }
    function double() {
      const val = Double(cursor)
      cursor.move(0x08)
      return val
    }
    // Write out math equation, push to stack
    function math(token) {
      push({ cmd: token, values: pop(2) })
    }
    function pop(amount = 1) {
      if(stack.length < amount) {
        throw new Error(`Calc error: ${amount} values were expected, but were ${stack.length}`)
      }
      return stack.splice(-amount)
    }
    function push(value) {
      stack.push(value)
    }

    const size = int()
    const offset = int()
    const end = cursor.pos + size;
    const stack = [];

    type4:
    while(cursor.pos < end) {
      let type = int();
      switch(type) {
        // End of data
        case 0: break type4;

        // Read values
        case 1: push({ cmd: 'value', value: double() }); break; // Literal
        case 3: push({ cmd: `ref`, value: int() }); break; // Index

        case 4: { // Function
          const command = int();
          switch(command) {
            case 0x80000005: push({ cmd: 'f:limit', value: [pop()] }); break; // Limit
            case 0x80000006: push({ cmd: 'f:lerp', values: pop(3) }); break;
            default: push(`f:[${command.toString(16)}/${command}]`); break;
          }
          break;
        }
        
        // Math operations
        case 5: math('+'); break;
        case 6: math('-'); break;
        case 7: math('*'); break;
        case 8: math('/'); break;

        default: throw new Error(`Calc error: Unknown operator "${type}"`); break;
      }
    }

    if(!stack.length) throw new Error('Calc error: No output')
    if(stack.length > 1) {
      throw new Error(`Calc error: Stack unresolved | ${stack.join(', ')}`)
    }

    return stack[0]
  }

  function Extra(cursor, offset) {
    const size = UInt(cursor, offset)
    cursor = Ptr(cursor, offset + 0x04)
    const data = cursor.at(0x00).slice(0x00, size)
    return data.toString('hex')
  }

  // DSGO doesn't include size in pointer, pointing to a single header always
  function DRef(Type) {
    function Deref(cursor, offset = 0x00) {
      cursor = Ptr(cursor, offset)
      return Type(cursor, 0x00)
    }
    Deref.size = 0x04
    return Deref
  }

  // DSGO has the type listed second
  function DUnion(Types, size) {
    function DUnionDef(cursor, offset = 0x00) {
      const type = BigUInt(cursor, offset + 0x08)
      if(!Types[type]) {
        console.log(cursor)
        throw new Error(`Type definition missing: ${type}`)
      }
      return Types[type](cursor, offset)
    }
    DUnionDef.size = size
    DUnionDef.Types = Types
    return DUnionDef
  }

  const deferred = []
  const keyTables = new Map()
  function DsgoStructure(cursor, offset) {
    const strCursor = Ptr(cursor, offset + 0x00)
    const strCount = UInt(cursor, offset + 0x04)
    const varCursor = Ptr(cursor, offset + 0x08)
    const varCount = UInt(cursor, offset + 0x0c)
    if(!varCount) {
      return null
    }
    const strings = {}
    for(let i = 0; i < strCount; i++) {
      const str = Str(strCursor, 0x00)
      const strIdx = UInt(strCursor, 0x04)
      strings[strIdx] = str
      strCursor.move(0x08)
    }
    const vars = Array(varCount).fill(null)
    for(let i = 0; i < varCount; i++) {
      const nodeIdx = UInt(varCursor)
      vars[i] = nodeIdx
      varCursor.move(0x04)
    }
    deferred.push(vars)
    for(let i = 0; i < strings.length; i++) {
      const name = strings[i]
      const node = vars[i]
      vars[i] = { name, type: node.type, ...node }
    }
    if(strCount) {
      keyTables.set(vars, strings)
    }
    return vars
  } DsgoStructure.size = 0x10

  const DsgoNode = DUnion({
    [0x00]: Struct({
      [0x00]: ['value', Double],
      [0x08]: ['type', () => 'double'],
    }, 0x10),
    [0x01]: Struct({
      [0x00]: ['value', Str],
      [0x08]: ['type', () => 'str'],
    }, 0x10),
    [0x02]: Struct({
      [0x00]: ['value', (cursor, offset) => {
        cursor = Ptr(cursor, offset)
        return {
          format: 'hex',
          data: Extra(cursor, 0x00),
        }
      }],
      [0x08]: ['type', () => 'extra'],
    }, 0x10),
    [0x03]: Struct({
      [0x00]: ['value', DRef(DsgoStructure)],
      [0x08]: ['type', () => 'ptr'],
    }, 0x10),
    [0x04]: Struct({
      [0x00]: ['value', DRef(Type4)],
      [0x08]: ['type', () => 'calc'],
    }, 0x10),
  }, 0x10)

  DsgoNode.prototype.toJson = (...args) => {
    console.log(args)
    return ''
  }

  const DsgoHeader = Struct({
    [0x00]: ['endian', Leader('DSGO')],
    [0x04]: ['variables', DRef(DRef(DsgoStructure))],
    [0x08]: ['nodes', Ref(Collection(DsgoNode))],
  }, 0x10)

  const decompiled = decompile(DsgoHeader)
  for(const arr of deferred) {
    const strings = keyTables.get(arr)
    for(let i = 0; i < arr.length; i++) {
      const node = decompiled.nodes[arr[i]]
      const name = strings?.[i]
      arr[i] = { name, type: node.type, ...node }
    }
  }
  delete decompiled.nodes
  return decompiled
}

module.exports = decompileDsgo
