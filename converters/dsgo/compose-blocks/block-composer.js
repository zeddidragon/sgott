class BlockComposer {
  address = 0x00
  blocks = {} // Output data, buffer chunked into human-readable objects
  deferredStrings = []

  addState(state, cb) {
    if(state == null) {
      console.error({ state, cb })
      throw new Error('Trying to add a null state, which is not valid')
    }
    this.states[state] = cb
  }

  align(alignment) {
    const disalignment = this.address % alignment
    if(disalignment > 0)
      this.address += alignment - disalignment
  }

  addBlock(size, type, content) {
    const address = this.address
    this.blocks[address] = { type, content }
    this.address += +size
    return address
  }

  deferString(string, object, property) {
    this.deferredStrings.push({ string, object, property })
  }

  get header() {
    return this.blocks[0].content
  }

  addStrings() {
    const strings = {}
    for(const { string, object, property } of this.deferredStrings) {
      if(!strings[string]) {
        strings[string] = this.addBlock(string.length * 2 + 0x02, 'string', string)
      }
      object[property] = strings[string]
    }
  }

  finalize() {
    this.addStrings()
    this.addBlock(0x00, 'END')
    return this.blocks
  }
}

function blockComposer() {
  return new BlockComposer()
}

module.exports = blockComposer
