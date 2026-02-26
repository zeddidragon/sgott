const Mode = { // enum
  HEADER: 0,
  VARS: 1,
  DSGO: 2,
}

const DsgoType = {
  DOUBLE: 0n, // BigInt
  STRING: 1n,
  EXTRA: 2n,
  POINTER: 3n,
  CALC: 4n,
}

class BufferCrawler { // The intention is to crawl the buffer from start to end, keeping track of every single byte
  constructor(buffer) {
    this.index = 0
    this.endian = 'LE'
    this.buffer = buffer
    this.tallyMarks = []
  }

  idx() {
    return '0x' + this.index.toString(16)
  }
  
  at(offset = 0x00) {
    return this.buffer.slice(this.index + offset)
  }

  jump(length) {
    this.context = null
    this.index += length
  }

  skipTo(index) {
    this.tally(0, 'SKIPPED', index - this.index)
  }

  isDone() {
    return this.index >= this.buffer.length
  }

  tally(offset = 0x00, label, length) {
    for(let idx = this.index + offset; idx < this.index + offset + length; idx += 0x04) 
      this.tallyMarks.push([this.context, label, idx]);
  }

  ascii(offset = 0x00, length = 0x04) {
    this.tally(offset, 'ascii', length)
    return this.buffer
      .slice(this.index + offset, this.index + offset + length)
      .toString('ascii')
  }

  uint(offset = 0x00) {
    this.tally(offset, 'uint', 0x04)
    return (this.endian === 'LE')
      ? val.readUInt32LE()
      : val.readUInt32BE()
  }

  ptr(offset = 0x00) {
    this.tally(offset, 'ptr', 0x04)
    const jump = (this.endian === 'LE')
      ? this.at(offset).readUInt32LE()
      : this.at(offset).readUInt32BE()
    return this.index + jump
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

  dsgo(offset = 0x00) { // Read several types. This is used to keep the tally in order.
    const type = (this.endian === 'LE')
      ? this.at(offset + 0x08).readBigInt64LE()
      : this.at(offset + 0x08).readBigInt64BE()
    let ptr, double

    if(type === 0)
      double = this.double(offset + 0x00)
    else {
      ptr = this.ptr(offset + 0x00)
      this.tally(offset + 0x04, 'blank', 0x04)
    }
    this.tally(offset + 0x08, 'dsgoType', 0x08)

    return { type, ptr, double }
  }
}

class ReferenceTracker {
  constructor() {
    this.refs = []
    this.processed = []
  }

  add(idx, mode, origin) { // Adds the reference sorted
    let i = 0
    for(; i < this.refs.length; i++) {
      const ref = this.refs[i]
      if(idx < ref.idx)
        break
    }
    this.refs.splice(i, 0, { idx, mode, origin })
  }

  peek() {
    return this.refs[0]
  }

  consume() {
    this.processed.push(this.refs.shift())
  }
}

function decompileDsgo(_, buffer, config) {
  let mode = Mode.HEADER
  let prev = -1

  const crawler = new BufferCrawler(buffer)

  const references = new ReferenceTracker()

  const variables = []
  const nodes = []
  const data = { tally: crawler.tallyMarks, refs: references.refs, processed: references.processed, nodes }

  loop: while(!crawler.isDone()) {
    if (prev === crawler.index) {
      console.log(data)
      throw new Error(`Crawler has not advanced at ${crawler.idx()} (Mode: ${mode})`)
    }
    prev = crawler.index

    const ref = references.peek()
    if(ref && ref.idx === crawler.index) {
      mode = ref.mode
      references.consume()
    } else if(ref) {
      crawler.skipTo(ref.idx)
      continue
    } else if(mode == null) {
      console.log(data)
      throw new Error(`Crawler orphaned at ${crawler.idx()} (Mode: ${mode})`)
    }

    switch(mode) {
      // # DSGO Header
      //
      // DSGO AABB
      //
      // DSGO: Leader that says either DSGO or OGSD to indicate big-endian/little-endian
      // AA: Points to the top-level DSGO list
      // BB: Points to the heap nodes
      case Mode.HEADER: {
        crawler.context = 'DSGO Header'
        const leader = crawler.ascii(0x00, 0x04)
        const varsPtr = crawler.ptr(0x04)
        const nodesPtr = crawler.ptr(0x08)

        references.add({
          idx: varsPtr,
          mode: Mode.VARS,
          origin: crawler.index,
        })

        data.leader = leader
        crawler.endian = leader === 'DSGO' ? 'LE' : 'BE'

        crawler.jump(0x10)
        break
      }

      // # Single DSGO node
      //
      // AABB TYPE
      //
      // TYPE: Indicates the type of data in AABB
      // 0: AABB is a 64-bit double
      // 1: AA points to a string,         BB is 0
      // 2: AA points to an embedded file, BB is 0
      // 3: AA points to a DSGO list,      BB is 0
      // 4: AA points to a Calc node,      BB is 0
      case Mode.VARS: {
        crawler.context = ` Node ${nodes.length}`
        const { type, double, ptr } = crawler.dsgo(0x00)
        if (type === 0)
          nodes.push({ type, double })
        else
          nodes.push({ type, ptr })

        switch(type) {
          case DsgoType.POINTER: {
            references.add({
              idx: ptr,
              mode: Mode.DSGO,
              origin: crawler.index,
            })

            break
          }

          default:
            throw new Error(`Unknown DSGO type: ${type}`)
        }
        
        crawler.jump(0x10)
        break
      }

      // # DSGO list
      //
      // AABB CCDD
      //
      // AA: Points to a list of null-terminated strings that names each DSGO node in order. May be 0 for anonymous node.
      // BB: The count of strings. May be 0.
      // CC: Points to the first DSGO node in the array, usually 0x10. Can be 0 for an empty list.
      // DD: The count of nodes. May be 0 for an empty list.
      case Mode.DSGO: {
        const strCursor = crawler.ptr(0x00)
        const strCount = crawler.uint(0x04)
        const varCursor = crawler.ptr(0x08)
        const varCount = crawler.uint(0x0C)

        crawler.jump(0x10)
        break;
      }

      default:
        // break loop
        console.log(data)
        throw new Error(`Unknown mode ${mode} at ${crawler.idx()}`)
    }

    mode = null
  }

  return data
}

module.exports = decompileDsgo
