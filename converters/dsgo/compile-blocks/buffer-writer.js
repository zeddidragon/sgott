// The intention is to write the buffer from start to end, keeping track of every single byte
// Usage:
// const writer = bufferWriter(blocks)
// writer.addType(TYPE, callback) // Associate a callback with a type.
// const output = writer.go()
class BufferWriter {
  address = 0x00 // Cursor
  state = null // "Global" config
  blocks = null // Input data
  buffer = null // Output data
  types = { SKIPPED: () => {}, END: () => {} }
  endian = 'LE'

  constructor(blocks, state) {
    this.blocks = blocks
    this.state = state
    const size = +Object.entries(blocks)
      .find(([address, block]) => block.type === 'END')
      ?.[0]
    if(size == null) 
      throw new Error('END block not found, cannot determine size')

    this.buffer = Buffer.alloc(size)
  }

  addType(type, cb) {
    this.types[type] = cb
  }

  go() {
    for(const [address, { type, content }] of Object.entries(this.blocks)) {
      const cb = this.types[type]
      if(!cb) {
        console.log('No type registered', type, address)
        continue
      }
      this.address = +address
      cb(this, content)
    }

    return this.buffer
  }

  at(offset = 0x00) {
    return this.buffer.slice(this.address + offset)
  }

  jump(length) {
    this.address += length
  }

  write(offset = 0x00, value) {
    return this.at(offset).write(value)
  }

  uint(offset = 0x00, value) {
    return (this.endian === 'LE')
      ? this.at(offset).writeUInt32LE(value)
      : this.at(offset).writeUInt32BE(value)
  }

  // `value` will be an absolute pointer to a specific address in the buffer
  // but dsgo wants an offset from the current address
  ptr(offset = 0x00, value) {
    return this.uint(offset, value - this.address)
  }

  bigInt(offset = 0x00, value) {
    return (this.endian === 'LE')
      ? this.at(offset).writeBigInt64LE(value)
      : this.at(offset).writeBigInt64BE(value)
  }

  double(offset = 0x00, value) {
    return (this.endian === 'LE')
      ? this.at(offset).writeDoubleLE(value)
      : this.at(offset).writeDoubleBE(value)
  }

  string(offset = 0x00, value) {
    return (this.endian === 'LE')
      ? this.at(offset).write(value + '\0', 'utf16le')
      : this.at(offset).write(value + '\0', 'utf16be')
  }

  hex(offset = 0x00, value) {
    return this.at(offset).write(value, 'hex')
  }
}

function bufferWriter(blocks, state) {
  return new BufferWriter(blocks, state)
}

module.exports = bufferWriter
