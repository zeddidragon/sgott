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
    console.log()

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

  it('should parse int', t => {
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

  it('should parse float', t => {
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
})
