const util = require('util')
const kleur = require('kleur')
const { count } = require('../../../helpers/count')

// The intention is to crawl the buffer from start to end, keeping track of every single byte
class BufferCrawler {
  constructor(buffer) {
    this.address = 0
    this.endian = 'LE'
    this.buffer = buffer
    this.tallyMarks = []
    this.skipTally = false
  }

  setContext(label) {
    return this.context = count(label)
  }
  
  at(offset = 0x00) {
    return this.buffer.slice(this.address + offset)
  }

  crawl(length) { // Identical to `jump` but doesn't clear the context
    this.address += length
  }

  jump(length) {
    this.context = null
    this.address += length
  }

  skipTo(address) {
    this.tally(0, 'SKIPPED', address - this.address)
    this.address = address
  }

  padding(offset = 0x00, size = 0x04) {
    this.tally(offset, 'padding', size)
  }

  isDone() {
    return this.address >= this.buffer.length
  }

  tally(offset = 0x00, label, length) {
    if (this.skipTally)
      return
    this.tallyMarks.push([this.context, label, this.address + offset, this.address + offset + length])
  }

  ascii(offset = 0x00, length = 0x04) {
    this.tally(offset, 'ascii', length)
    return this.buffer
      .slice(this.address + offset, this.address + offset + length)
      .toString('ascii')
  }

  uint(offset = 0x00) {
    this.tally(offset, 'uint', 0x04)
    return (this.endian === 'LE')
      ? this.at(offset).readUInt32LE()
      : this.at(offset).readUInt32BE()
  }

  ptr(offset = 0x00) {
    this.tally(offset, 'ptr', 0x04)
    const jump = (this.endian === 'LE')
      ? this.at(offset).readUInt32LE()
      : this.at(offset).readUInt32BE()
    return this.address + jump
  }

  bigInt(offset = 0x00) {
    this.tally(offset, 'bigInt', 0x08)
    return (this.endian === 'LE')
      ? this.at(offset).readBigInt64LE()
      : this.at(offset).readBigInt64BE()
  }

  double(offset = 0x00) {
    this.tally(offset, 'double', 0x08)
    return (this.endian === 'LE')
      ? this.at(offset).readDoubleLE()
      : this.at(offset).readDoubleBE()
  }

  string(offset = 0x00, length = 0x00) {
    let slice = this.at(offset)
    length = length * 2 || Math.min(
      slice.indexOf('\0', 0x00, 'utf16le'),
      slice.length)
    this.tally(offset, 'string', length + 0x04)
    slice = slice.slice(0x00, length)
    return (this.endian === 'LE')
      ? slice.toString('utf16le')
      : Buffer.from(slice).swap16().toString('utf16le')
  }

  hex(offset = 0x00, length = Infinity) {
    this.tally(offset, 'hex', length)
    return this.buffer.slice(offset, offset + length).toString('hex')
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
    return `Cursor 0x${this.address.toString(16)} (${this.endian})
${bufferView.map(r => r.join(' ')).join('\n')}`
  }
}

function bufferCrawler(buffer) {
  return new BufferCrawler(buffer)
}

module.exports = bufferCrawler
