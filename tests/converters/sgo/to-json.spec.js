const { describe, it } = require('node:test')
const decompiler = require('#converters/decompiler.js')
const decompileSgo = require('#converters/sgo/to-json.js')

describe('sgo\\to-json.js', () => {
  function setupSimpleSgo() {
    const nodeCount = 1
    const header = Buffer.alloc(0x20)
    const nodes = Buffer.alloc(0x0C * nodeCount)
    const names = Buffer.alloc(0x08 * nodeCount)
    const strings = Buffer.from('test\0', 'utf16le')

    header.slice(0x00).write('SGO\0', 'ascii')
    header.slice(0x04).writeUint32LE(0x0102) // Version
    header.slice(0x08).writeUint32LE(nodeCount) // Amount of variables
    header.slice(0x0C).writeUint32LE(header.length) // Ptr to first variable, all are named
    header.slice(0x10).writeUint32LE(nodeCount) // Amount of variable names
    header.slice(0x14).writeUint32LE(header.length + nodes.length) // Ptr to names declaration

    names.slice(0x00).writeUint32LE(names.length) // String is first item after this buffer
    names.slice(0x04).writeUint32LE(0) // first item

    return [
      header,
      nodes,
      names,
      strings,
    ]
  }

  it('should identify a file being Big-Endian', t => {
    const header = Buffer.alloc(0x20)
    const vars = Buffer.alloc(0x0C)
    const varNames = Buffer.alloc(0x08)
    const strings = Buffer.from('EdfEdf\0', 'utf16le').swap16()

    header.slice(0x00).write('\0OGS', 'ascii')
    header.slice(0x04).writeUint32BE(0x0102) // Version
    header.slice(0x08).writeUint32BE(1) // Amount of variables
    header.slice(0x0C).writeUint32BE(header.length) // Ptr to first variable, all are named
    header.slice(0x10).writeUint32BE(1) // Amount of variable names
    header.slice(0x14).writeUint32BE(header.length + vars.length) // Ptr to names declaration

    vars.slice(0x00).writeUint32BE(2) // type: int
    vars.slice(0x04).writeUint32BE(0x04) // size of value (int is 4 bytes)
    vars.slice(0x08).writeFloatBE(8.5)

    varNames.slice(0x00).writeUint32BE(varNames.length) // String is first item after this buffer
    varNames.slice(0x04).writeUint32BE(0) // first item

    const buffer = Buffer.concat([
      header,
      vars,
      varNames,
      strings,
    ])

    const result = decompileSgo(decompiler, buffer)
    t.assert.deepEqual(result, {
      format: 'SGO',
      endian: 'BE',
      version: 258,
      variables: [ { name: 'EdfEdf', type: 'float', value: 8.5 } ],
    })
  })

  it('should parse 1:int', t => {
    const setup = setupSimpleSgo()
    const node = setup[1]

    node.slice(0x00).writeUint32LE(1) // type: int
    node.slice(0x04).writeUint32LE(0x04) // size of value (int is 4 bytes)
    node.slice(0x08).writeInt32LE(7)

    const buffer = Buffer.concat(setup)
    const result = decompileSgo(decompiler, buffer)

    t.assert.deepEqual(result, {
      format: 'SGO',
      endian: 'LE',
      version: 258,
      variables: [ { name: 'test', type: 'int', value: 7 } ],
    })
  })

  it('should parse 2:float', t => {
    const setup = setupSimpleSgo()
    const node = setup[1]

    node.slice(0x00).writeUint32LE(2) // type: float
    node.slice(0x04).writeUint32LE(0x04) // size of value (float is 4 bytes)
    node.slice(0x08).writeFloatLE(9.5)

    const buffer = Buffer.concat(setup)
    const result = decompileSgo(decompiler, buffer)

    t.assert.deepEqual(result, {
      format: 'SGO',
      endian: 'LE',
      version: 258,
      variables: [ { name: 'test', type: 'float', value: 9.5 } ],
    })
  })

  it('should parse 0:ptr', t => {
    const [header, nodes, names, strings] = setupSimpleSgo()

    nodes.slice(0x00).writeUint32LE(0) // type: ptr
    nodes.slice(0x04).writeUint32LE(2) // amount of items being pointed to
    nodes.slice(0x08).writeUint32LE(nodes.length + names.length + strings.length) // Heap is not normally after strings, but there is no reason the parser should not handle this

    const heap = Buffer.alloc(0x0C * 2) // The items being pointed to
    let node = heap.slice(0x00) // First node
    node.slice(0x00).writeUint32LE(1)
    node.slice(0x04).writeUint32LE(0x04)
    node.slice(0x08).writeUint32LE(3)

    node = heap.slice(0x0C)    // Second node
    node.slice(0x00).writeUint32LE(2)
    node.slice(0x04).writeUint32LE(0x04)
    node.slice(0x08).writeFloatLE(3.5)

    const buffer = Buffer.concat([
      header,
      nodes,
      names,
      strings,
      heap,
    ])
    const result = decompileSgo(decompiler, buffer)

    t.assert.deepEqual(result, {
      format: 'SGO',
      endian: 'LE',
      version: 258,
      variables: [ { name: 'test', type: 'ptr', value: [
        { type: 'int', value: 3 },
        { type: 'float', value: 3.5 },
      ] } ],
    })
  })

  it('should parse 3:string', t => {
    const [header, nodes, names, strings] = setupSimpleSgo()

    const string = 'We shall never surrender, we are the E D F!'
    nodes.slice(0x00).writeUint32LE(3) // type: string
    nodes.slice(0x04).writeUint32LE(string.length) // length of string being pointed to (before terminator)
    nodes.slice(0x08).writeUint32LE(nodes.length + names.length + strings.length)

    const strings2 = Buffer.from(string + '\0', 'utf16le')

    const buffer = Buffer.concat([
      header,
      nodes,
      names,
      strings,
      strings2,
    ])
    const result = decompileSgo(decompiler, buffer)

    t.assert.deepEqual(result, {
      format: 'SGO',
      endian: 'LE',
      version: 258,
      variables: [ { name: 'test', type: 'string', value: string } ],
    })
  })

  it('should parse 4:extra', t => {
    const [header, nodes, names, strings] = setupSimpleSgo()

    const extra = Buffer.from('Mystery content\0', 'ascii')

    nodes.slice(0x00).writeUint32LE(4) // type: extra
    nodes.slice(0x04).writeUint32LE(extra.length) // length of data being pointed to
    nodes.slice(0x08).writeUint32LE(nodes.length + names.length + strings.length) // extra is not normally after strings, but the parser will handle it fine

    const buffer = Buffer.concat([
      header,
      nodes,
      names,
      strings,
      extra,
    ])
    const result = decompileSgo(decompiler, buffer)

    t.assert.deepEqual(result, {
      format: 'SGO',
      endian: 'LE',
      version: 258,
      variables: [ { name: 'test', type: 'extra', value: extra.toString('base64') } ],
    })
  })

  it('should parse 5:extra', t => {
    const [header, nodes, names, strings] = setupSimpleSgo()

    const extra = Buffer.from('Mystery content\0', 'ascii')

    nodes.slice(0x00).writeUint32LE(5) // type: extra5
    nodes.slice(0x04).writeUint32LE(extra.length) // length of data being pointed to
    nodes.slice(0x08).writeUint32LE(nodes.length + names.length + strings.length) // extra is not normally after strings, but the parser will handle it fine

    const buffer = Buffer.concat([
      header,
      nodes,
      names,
      strings,
      extra,
    ])
    const result = decompileSgo(decompiler, buffer)

    t.assert.deepEqual(result, {
      format: 'SGO',
      endian: 'LE',
      version: 258,
      variables: [ { name: 'test', type: 'extra5', value: extra.toString('base64') } ],
    })
  })
})
