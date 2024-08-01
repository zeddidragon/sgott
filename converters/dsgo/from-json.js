const compiler = require('../compiler.js')
  const infer = require('../infer.js')

function compileDsgo(obj) {
  const { compile, types } = compiler(obj)
  const {
    Str,
    Ref,
    UInt,
    BigUInt,
    Double,
    Struct,
    Union,
    Collection,
  } = types

  const nodes = []
  const heap = []
  const stringSet = new Set(obj.strings || [])

  function unrollData(data) {
    const idx = nodes.length
    const heapIdx = heap.length
    if(Array.isArray(data)) {
      const indices = []
      nodes.push({
        type: 'ptr',
        value: heapIdx,
      })
      heap.push({
        type: 'dsgo',
        indices,
      })
      for(const value of data) {
        indices.push(unrollData(value))
      }
    } else if(data === null) {
      unrollData([])
    } else if(typeof(data) === 'object' && data['$SGOTT_EMBED']) {
      nodes.push({
        type: 'extra',
        value: heapIdx,
      })
      heap.push({
        type: 'extra',
        data: data.data,
      })
    } else if(typeof(data) === 'object') {
      const strings = Object.keys(data)
      for(const key of strings) {
        stringSet.add(key)
      }
      const indices = []
      nodes.push({
        type: 'ptr',
        value: heapIdx,
      })
      heap.push({
        type: 'dsgo',
        strings,
        indices,
      })
      for(const value of Object.values(data)) {
        indices.push(unrollData(value))
      }
    } else if(typeof(data) === 'number') {
      const node = {
        type: 'double',
        value: data,
      }
      nodes.push(node)
    } else if(typeof(data) === 'string') {
      stringSet.add(data)
      const node = {
        type: 'string',
        value: data,
      }
      nodes.push(node)
    } else {
      console.log(data)
      throw new Error('Unhandled value')
    }
    return idx
  }

  unrollData(obj.data)

  function Extra({ value: heapIdx }) {
    const { data } = heap[heapIdx]
    const buffer = Buffer.from(data, 'hex')
    const leader = Buffer.alloc(0x04)
    const cursor = {
      buffer: leader,
      index: 0,
      endian: obj.endian,
    }
    UInt(cursor, buffer.length)
    return Buffer.concat([leader, buffer])
  }

  function DeferStr({ buffer, index }, value, offset = 0x00) {
    const ptr = nodeBufferLength - index
      + heapBufferLength
      + stringRegister[value]
    BigUInt({ buffer, index }, ptr, 0x00)
  }
  DeferStr.size = 0x08

  function Defer({ buffer, index }, value, offset = 0x00) {
    const ptr = nodeBufferLength - index
      + heapRegister[value]
    BigUInt({ buffer, index }, ptr, 0x00)
  }
  Defer.size = 0x08

  const DsgoNode = Union('type', {
    'double': Struct([
      [0x00, Double, ({ value }) => value || 0x00],
      [0x08, BigUInt, () => 0],
    ], 0x10),
    'string': Struct([
      [0x00, DeferStr, ({ value }) => value || ''],
      [0x08, BigUInt, () => 1],
    ], 0x10),
    'extra': Struct([
      [0x00, Defer, ({ value }) => value],
      [0x08, BigUInt, () => 2],
    ], 0x10),
    'ptr': Struct([
      [0x00, Defer, ({ value }) => value],
      [0x08, BigUInt, () => 3],
    ], 0x10),
  }, 0x10)

  const DsgoHeader = Struct([
    // Filetype header indicating this is a DSGO file.
    // For big-endian the header might instead says OGSD (not verified)
    [0x00, Str, obj => (obj.endian === 'BE' ? 'OGSD' : 'DSGO')],
    // Index of DSGO nodes
    [0x04, UInt, () => 0x10],
    // Total amount of nodes
    [0x08, UInt, () => nodes.length],
    // Pointer to the entry node
    [0x0c, UInt, () => 0x10],
    // Also amount of top-level variables? Likely points at the amount of variable names.
  ], 0x10)

  let index = 0
  let buffer

  const header = compile(DsgoHeader)

  const stringRegister = {}
  const strings = Array.from(stringSet) //.sort()
  function stringBytes(string) {
    return Buffer.byteLength(string + '\x00', 'utf16le')
  }
  const stringBufferLength = strings.reduce((acc, string) => {
    return acc + stringBytes(string)
  }, 0)
  const stringBuffer = Buffer.alloc(stringBufferLength)
  index = 0
  buffer = stringBuffer
  for(const string of strings) {
    stringRegister[string] = index
    buffer.write(string, index, 'utf16le')
    index += stringBytes(string)
  }

  function heapBytes(data) {
    if(data.type === 'dsgo') {
      return 0x10
        + data.indices.length * 0x04
        + (data.strings?.length || 0) * 0x08
    } else if(data.type === 'extra') {
      return 0x08 + Buffer.byteLength(data.data, 'hex')
    } else {
      console.log(data)
      throw new Error('Unhandled value')
    }
    return 0
  }

  const heapRegister = []
  const heapBufferLength = heap.reduce((acc, data) => {
    return acc + Math.ceil(heapBytes(data) / 0x08) * 0x08
  }, 0)
  const heapBuffer = Buffer.alloc(heapBufferLength)
  index = 0
  buffer = heapBuffer
  for(let i = 0; i < heap.length; i++) {
    const data = heap[i]
    if(index % 0x08) {
      index = Math.ceil(index / 0x08) * 0x08
    }
    heapRegister[i] = index
    if(data.type === 'dsgo') {
      const headerSize = 0x10
      const indexSize = data.indices.length * 0x04
      // String table pointer, count
      const stringCount = data.strings?.length || 0
      const stringIndex = stringCount ? indexSize + headerSize : 0
      UInt({ buffer, index }, stringIndex, 0x00)
      UInt({ buffer, index }, stringCount, 0x04)
      // Index table pointer, count
      const valIndex = data.indices.length ? headerSize : 0
      UInt({ buffer, index }, valIndex, 0x08)
      UInt({ buffer, index }, data.indices.length, 0x0c)
      index += headerSize
      for(const nodeIndex of data.indices) {
        UInt({ buffer, index }, nodeIndex, 0x00)
        index += 0x04
      }
      const stringMap = {}
      for(let i = 0; i < stringCount; i++) {
        stringMap[data.strings[i]] = i
      }
      // DSGO usually sort keys. It's unclear wether this is important
      // but the more identical the output can be to the original file
      // the easier it is to debug
      const sorted = (data.strings || []).slice().sort()
      for(let i = 0; i < stringCount; i++) {
        const string = sorted[i]
        UInt({ buffer, index }, buffer.length - index + stringRegister[string], 0x00)
        UInt({ buffer, index }, stringMap[string], 0x04)
        index += 0x08
      }
    } else if(data.type === 'extra') {
      const headerSize = 0x08
      const bufferSize = Buffer.byteLength(data.data, 'hex')
      UInt({ buffer, index }, bufferSize, 0x00)
      UInt({ buffer, index }, 0x08, 0x04)
      index += headerSize
      buffer.write(data.data, index, 'hex')
      index += bufferSize
    } else {
      console.log(data)
      throw new Error('Unhandled value')
    }
  }

  const nodeBufferLength = nodes.length * DsgoNode.size
  const nodeBuffer = Buffer.alloc(nodeBufferLength)
  index = 0
  buffer = nodeBuffer
  for(const node of nodes) {
    DsgoNode({ buffer, index }, node)
    index += DsgoNode.size
  }

  return Buffer.concat([
    header,
    nodeBuffer,
    heapBuffer,
    stringBuffer,
  ])
}

compileDsgo.compile = compileDsgo
compileDsgo.compiler = () => obj => compileDsgo(obj)

module.exports = compileDsgo
