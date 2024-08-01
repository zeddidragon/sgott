const decompiler = require('../decompiler.js')

function decompileDsgo(buffer, config) {
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
    const strings = Array(strCount).fill(null)
    const keyTable = Array(strCount).fill(null)
    for(let i = 0; i < strCount; i++) {
      const str = Str(strCursor, 0x00)
      const strIdx = UInt(strCursor, 0x04)
      strings[strIdx] = str
      keyTable[i] = str
      strCursor.move(0x08)
    }
    const vars = Array(varCount).fill(null)
    for(let i = 0; i < varCount; i++) {
      const nodeIdx = UInt(varCursor)
      vars[i] = nodeIdx
      varCursor.move(0x04)
    }
    if(!strCount) {
      deferred.push(vars)
      return vars
    } else {
      const obj = {}
      for(let i = 0; i < strings.length; i++) {
        obj[strings[i]] = vars[i]
      }
      deferred.push(obj)
      keyTables.set(obj, keyTable)
      return obj
    }
  }
  DsgoStructure.size = 0x10

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
          '$SGOTT_EMBED': true,
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
  }, 0x10)

  const DsgoHeader = Struct({
    [0x00]: ['endian', Leader('DSGO')],
    [0x04]: ['data', DRef(DRef(DsgoStructure))],
    [0x08]: ['nodes', Ref(Collection(DsgoNode))],
  }, 0x10)

  const decompiled = decompile(DsgoHeader)
  for(const obj of deferred) {
    if(Array.isArray(obj)) {
      for(let i = 0; i < obj.length; i++) {
        obj[i] = decompiled.nodes[obj[i]].value
      }
    } else {
      for(const [key, idx] of Object.entries(obj)) {
        const node = decompiled.nodes[idx]
        obj[key] = node.value
      }
      if(config.debug) {
        obj['$KEY_TABLE$'] = keyTables.get(obj)
      }
    }
  }
  delete decompiled.nodes
  return decompiled
}

module.exports = decompileDsgo
