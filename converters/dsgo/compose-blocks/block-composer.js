class BlockComposer {
  address = 0x00
  state = null
  blocks = {} // Output data, buffer chunked into human-readable objects
  deferredStrings = []

  constructor(_, state) {
    this.state = state
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

function blockComposer(_, state) {
  return new BlockComposer(_, state)
}

module.exports = blockComposer
