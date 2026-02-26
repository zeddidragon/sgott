function padCeil(value, divisor = 0x10) {
  return Math.ceil(value / divisor) * divisor
}

function decompileDsgo(decompiler, buffer, config) {
  console.log('size', buffer.length)
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
    tally,
  } = types
  const type4References = []

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
    Type4.size = size + 0x08
    tally.add(Type4, cursor, -0x08)

    type4:
    while(cursor.pos < end) {
      let type = int();
      switch(type) {
        // End of data
        case 0: break type4;

        // Read values
        case 1: push({ cmd: 'value', value: double() }); break; // Literal
        case 3: { // Index reference
          const node = { cmd: `ref`, value: int() }
          type4References.push(node) // Resolve node name later
          push(node)
          break
        }

        case 4: { // Function
          const command = int();
          switch(command) {
            case 0x80000005: push({ cmd: 'f:limit', values: pop(1) }); break;
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

  const ExtraAlignment = 0x08
  function Extra(cursor, offset) {
    const size = UInt(cursor, offset)
    cursor = Ptr(cursor, offset + 0x04)
    Extra.size = padCeil(size, ExtraAlignment)
    tally.add(Extra, cursor, 0x00)
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
  function DUnion(Types, size, name) {
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

  function DsgoStrings(){}
  function DsgoVars(){}
  function DsgoBlank(){}
  DsgoBlank.size = 0x04
  function DsgoPadding(){}
  DsgoPadding.size = 0x04
  function DsgoTable() {}

  const deferred = []
  const keyTables = new Map()
  function DsgoStructure(cursor, offset) {
    tally.add(DsgoStructure, cursor, offset)
    const strCursor = Ptr(cursor, offset + 0x00)
    const strCount = UInt(cursor, offset + 0x04)
    const varCursor = Ptr(cursor, offset + 0x08)
    const varCount = UInt(cursor, offset + 0x0c)
    
    // Tally handling
    if(!varCount) {
      tally.add(DsgoBlank, strCursor, 0x00)
      tally.add(DsgoBlank, varCursor, 0x00)
      return null
    }
    
    DsgoTable.size = DsgoStructure.size
    if(strCount) {
      DsgoStrings.size = strCount * 0x08
      tally.add(DsgoStrings, strCursor, 0x00)
      DsgoTable.size += DsgoStrings.size
    }
    DsgoVars.size = varCount * 0x04
    tally.add(DsgoVars, varCursor, 0x00)
    DsgoTable.size += DsgoVars.size
    if(varCount % 2 && strCount) {
      tally.add(DsgoPadding, strCursor, strCount * 0x08)
      DsgoTable.size += DsgoPadding.size
    } else if(varCount % 2) {
      tally.add(DsgoPadding, varCursor, varCount * 0x04)
      DsgoTable.size += DsgoPadding.size
    } else {
      // Don't pad table size
    }
    tally.add(DsgoTable, cursor, 0x00)
    // /Tally Handling


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
  }
  DsgoStructure.size = 0x10

  function DsgoType(typeNum, typeName) {
    typeNum = BigInt(typeNum)
    function DsgoTypeEnum(cursor, offset) {
      return typeName
      const value = BigUInt(cursor, offset)
      if(value !== typeNum) {
        throw new Error(`Expected type ${typeName} to be ${typeNum} but was ${value}`)
      }
      return typeName
    }
    DsgoTypeEnum.size = 0x08
    return DsgoTypeEnum
  }

  // BLANK is empty space to fit Double in DsgoNodes for other union types,
  // unecessary to include in JSON
  // We still read them to keep a tally of all bytes,
  // make sure they're accounted for (debugging)
  const BLANK = Symbol('BLANK')
  const DsgoNode = DUnion({
    [0x00]: Struct({
      [0x00]: ['value', Double],
      [0x08]: ['type', DsgoType(0, 'double')],
    }, 0x10, 'DSGO(Double)'),
    [0x01]: Struct({
      [0x00]: ['value', Str],
      [0x04]: [BLANK, UInt],
      [0x08]: ['type', DsgoType(1, 'str')],
    }, 0x10, 'DSGO(Str)'),
    [0x02]: Struct({
      [0x00]: ['value', (cursor, offset) => {
        cursor = Ptr(cursor, offset)
        return {
          format: 'hex',
          data: Extra(cursor, 0x00),
        }
      }],
      [0x04]: [BLANK, UInt],
      [0x08]: ['type', DsgoType(2, 'extra')],
    }, 0x10, 'DSGO(Extra)'),
    [0x03]: Struct({
      [0x00]: ['value', DRef(DsgoStructure)],
      [0x04]: [BLANK, UInt],
      [0x08]: ['type', DsgoType(3, 'ptr')],
    }, 0x10, 'DSGO(ptr)'),
    [0x04]: Struct({
      [0x00]: ['value', DRef(Type4)],
      [0x04]: [BLANK, UInt],
      [0x08]: ['type', DsgoType(4, 'calc')],
    }, 0x10, 'DSGO(calc)'),
  }, 0x10)

  DsgoNode.prototype.toJson = (...args) => {
    console.log(args)
    return ''
  }

  const NODES = Symbol('NODES') // Doesn't get included in output json
  const DsgoHeader = Struct({
    [0x00]: ['endian', Leader('DSGO')],
    [0x04]: ['variables', DRef(DRef(DsgoStructure))],
    [0x08]: [NODES, Ref(Collection(DsgoNode, null, 'DSGO Nodes'))],
  }, 0x10, 'DSGO Header')

  const nodeNames = {}
  const decompiled = decompile(DsgoHeader)
  const INDEX = Symbol('INDEX') // Doesn't get included in output json
  for(const arr of deferred) {
    const strings = keyTables.get(arr)
    for(let i = 0; i < arr.length; i++) {
      const node = decompiled[NODES][arr[i]]
      const name = strings?.[i]
      nodeNames[arr[i]] = name
      arr[i] = {
        name,
        [INDEX]: arr[i],
        type: node.type,
        ...node,
      }
    }
  }

  const nodePaths = {}
  // Straight up perform a full tree scan of every node to find their paths.
  // Node names are preferred over indices when available.
  // Some example paths:
  // ["ShellFishSettings", "gun_battery", "_l"]
  // ["ShellFishSettings", "weak_point", "body", 0, "normal", 1]
  function mapPathToNode(node, index, path = []) {
    path = [...path, node.name || index]
    nodePaths[node[INDEX]] = path
    if(Array.isArray(node.value)) {
      node.value.forEach((n, i) => mapPathToNode(n, i, path))
    }
    if(config['include-index']) {
      node['#index'] = node[INDEX]
    }
  }
  decompiled.variables.forEach((v, i) => mapPathToNode(v, i))

  // Type 4 nodes can refer to DSGO variables by index
  // For modder convenience, attach path of the referred variable
  for(const node of type4References) {
    node.refPath = nodePaths[node.value] || '<Failed to find node path>'
  }

  return decompiled
}

module.exports = decompileDsgo
