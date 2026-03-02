const util = require('util')
const kleur = require('kleur')
const { count } = require('../../../helpers/count')

// The intention is to crawl the buffer from start to end, keeping track of every single byte
// Usage:
// const crawler = bufferCrawler(buffer)
// crawler.addState(STATE, callback) // Associate a callback with a state. Callback might `.register()` data further ahead.
// crawler.register(0x00, STATE) // Register a state for when the crawler reaches address 0. STATE should refer to an added STATE
// const output = crawler.go()
class BufferCrawler {
  address = 0x00 // Cursor
  buffer = null // Input data cursor seeks over
  blocks = [] // Output data, buffer chunked into human-readable objects
  states = {}
  refs = []
  endian = 'LE'

  constructor(buffer) {
    this.buffer = buffer
  }

  abort(message) {
    console.error(this)
    throw new Error(message)
  }

  addState(state, cb) {
    if(state == null) {
      console.error({ state, cb })
      throw new Error('Trying to add a null state, which is not valid')
    }
    this.states[state] = cb
  }

  register(address, state) {
    if(state == null) {
      console.error({ state, address })
      throw new Error('Trying to register a null state, which is not valid')
    }

    let i = 0
    for(; i < this.refs.length; i++) {
      const ref = this.refs[i]
      if(address === ref.address) // No need to add this register again
        return                    // This commonly happens with strings, which can be references from multiple places
      if(address < ref.address)
        break
    }
    this.refs.splice(i, 0, { address, state })
  }

  go() {
    if (this.address !== 0)
      this.abort('Crawler is not fresh')

    loop:
    while(this.address < this.buffer.length) {
      const ref = this.refs[0]
      // console.log('ref:', { address: ref?.address.toString(16), state: ref?.state })
      if(!ref) {
        this.skipTo(this.buffer.length)
        break
      }

      if(ref.address < this.address) {
        console.error('References out of order:', { pos: this.hexPos(), address: ref.address.toString(16), state: ref.state })
        this.refs.shift()
        continue
      }
      if(ref.address > this.address) {
        this.skipTo(ref.address)
        continue
      }

      const cb = this.states[ref.state]
      if(!cb)
        this.abort(`State not added: ${ref.state}`)

      this.refs.shift()
      const block = cb(this)
      if(!block.size) {
        console.error(block)
        this.abort('Returned block has no size!')
      }
      this.blocks.push(block)
      this.address = block.address + block.size
    }

    return this.blocks
  }

  at(offset = 0x00) {
    return this.buffer.slice(this.address + offset)
  }

  jump(length) {
    this.address += length
  }

  skipTo(address) {
    this.blocks.push({
      address: this.address,
      size: address - this.address,
      type: 'SKIPPED',
      content: this.buffer.slice(this.address, address).toString('hex')
    })
    this.address = address
  }

  padding(offset = 0x00, size = 0x04) {
  }

  ascii(offset = 0x00, length = 0x04) {
    return this.buffer
      .slice(this.address + offset, this.address + offset + length)
      .toString('ascii')
  }

  uint(offset = 0x00) {
    return (this.endian === 'LE')
      ? this.at(offset).readUInt32LE()
      : this.at(offset).readUInt32BE()
  }

  ptr(offset = 0x00) {
    const jump = (this.endian === 'LE')
      ? this.at(offset).readUInt32LE()
      : this.at(offset).readUInt32BE()
    return this.address + jump
  }

  bigInt(offset = 0x00) {
    return (this.endian === 'LE')
      ? this.at(offset).readBigInt64LE()
      : this.at(offset).readBigInt64BE()
  }

  double(offset = 0x00) {
    return (this.endian === 'LE')
      ? this.at(offset).readDoubleLE()
      : this.at(offset).readDoubleBE()
  }

  string(offset = 0x00, length = 0x00) {
    let slice = this.at(offset)
    length = length * 2 || Math.min(
      slice.indexOf('\0', 0x00, 'utf16le'),
      slice.length)
    slice = slice.slice(0x00, length)
    return (this.endian === 'LE')
      ? slice.toString('utf16le')
      : Buffer.from(slice).swap16().toString('utf16le')
  }

  hex(offset = 0x00, length = Infinity) {
    return this.buffer.slice(offset, offset + length).toString('hex')
  }
  
  hexPos() {
    return this.address.toString(16)
  }

  [util.inspect.custom]() {
    const startAt = Math.max(0, Math.floor((this.address / 0x10) - 1) * 0x10)
    const endAt = Math.min(startAt + 0x80, this.buffer.length)
    let bufferView = []
    for(let i = startAt; i < endAt; i += 0x2) {
      if(!(i % 0x10)) {
        bufferView.push([kleur.magenta(`${i.toString(16).padStart(8, 0)}:`)])
      }
      let str = this.buffer.readUInt16BE(i).toString(16).padStart(4, 0)
      if(this.address === i) {
        str = kleur.yellow(str)
      }
      bufferView[bufferView.length - 1].push(str)
    }
    return `Cursor 0x${this.hexPos()} (${this.endian})
${bufferView.map(r => r.join(' ')).join('\n')}`
  }
}

function bufferCrawler(buffer) {
  return new BufferCrawler(buffer)
}

module.exports = bufferCrawler
