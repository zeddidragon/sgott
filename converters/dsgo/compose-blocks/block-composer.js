class BlockComposer {
  address = 0x00
  alignment = 0x10
  blocks = {} // Output data, buffer chunked into human-readable objects

  addState(state, cb) {
    if(state == null) {
      console.error({ state, cb })
      throw new Error('Trying to add a null state, which is not valid')
    }
    this.states[state] = cb
  }

  addBlock(size, type, content) {
    const address = this.address
    this.blocks[address] = { type, content }

    this.address += size
    const disalignment = this.address % this.alignment
    if(disalignment)
      this.address += this.alignment - disalignment

    return address
  }

  deferString(string, object, property) {
    // console.log('deferring', string)
    // TODO
  }

  get header() {
    return this.blocks[0].content
  }
}

function blockComposer() {
  return new BlockComposer()
}

module.exports = blockComposer
