const util = require('util')
const kleur = require('kleur')

// enum used for both DSGO type and the parser's state machine
const DsgoType = {
  DOUBLE: 0n,
  STRING: 1n,
  EXTRA: 2n,
  DSGO: 3n, 
  CALC: 4n,
}

// Internal values for state machine only
const State = {
  ...DsgoType,

  HEADER: 100n,
  NODE: 101n,
}

function decompileDsgo(_, buffer, config) {
  function abort(msg) {
    console.log(crawler)
    throw new Error(msg)
  }

  let state = State.HEADER
  let prev = -1

  const crawler = new BufferCrawler(buffer)


  const refs = new ReferenceTracker()

  const variables = []
  const nodes = []
  const tables = []
  const extra = []
  const data = { tally: crawler.tallyMarks, refs: refs.refs, processed: refs.processed, extra, tables, nodes }

  loop: while(!crawler.isDone()) {
    if (prev === crawler.index) {
      console.log(data)
      throw new Error(`Crawler has not advanced at ${crawler.idx()} (State: ${state})`)
    }
    prev = crawler.index

    const ref = refs.peek()
    if(ref && ref.idx === crawler.index) {
      state = ref.state
      refs.consume()
    } else if(ref) {
      crawler.skipTo(ref.idx)
      continue
    } else if(state == null) {
      console.log(data)
      throw new Error(`Crawler orphaned at ${crawler.idx()} (State: ${state})`)
    }

    switch(state) {
      // # DSGO Header
      //
      // DsRt NcPt  |0x10
      //
      // Ds: Leader that says either DSGO or OGSD to indicate big-endian/little-endian
      // Rt: Points to the top-level DSGO table
      // Nc: Amount of DSGO nodes
      // Pt: Pointer to first DSGO node
      case State.HEADER: {
        crawler.context = 'DSGO Header'
        const leader = crawler.ascii(0x00, 0x04)
        const rootPtr = crawler.ptr(0x04)
        const nodesCount = crawler.uint(0x08)
        const nodesPtr = crawler.ptr(0x0c)

        for(let i = 0; i < nodesCount; i++) {
          refs.add({
            idx: nodesPtr + i * 0x10,
            state: State.NODE,
            origin: crawler.index,
          })
        }

        data.header = {
          leader,
          rootPtr,
          nodesCount,
          nodesPtr,
        }
        crawler.endian = leader === 'DSGO' ? 'LE' : 'BE'

        crawler.jump(0x10)
        break
      }

      // # Single DSGO node
      //
      // DtBg Type | 0x10
      //
      // Type: Indicates the type of data in DtBd
      // 0: DtBg is a 64-bit double
      // 1: Dt points to a string,         Bg is 0
      // 2: Dt points to an embedded file, Bg is 0
      // 3: Dt points to a DSGO list,      Bg is 0
      // 4: Dt points to a Calc node,      Bg is 0
      case State.NODE: {
        crawler.context = count('DSGO Node')
        const { type, double, ptr } = crawler.dsgo(0x00)

        switch(type) {
          case DsgoType.DOUBLE: {
            const node = { idx: crawler.index, type, double }
            nodes.push(node)
            break
          }

          default:
            const node = { idx: crawler.index, type, ptr }
            nodes.push(node)
            refs.add({
              idx: ptr,
              state: type,
              origin: node,
            })
        }
        
        crawler.jump(0x10)
        break
      }

      // # Embedded file
      // SzDp
      // ...data...
      //
      // Sz: Length of the data in bytes
      // Dp: Points to the start of the data
      // 
      // The file may or may not be in a known format, including SGO, RMP, DSGO, or anything else
      // Contents of embedded files are independent from this file and will not reference our data
      // The data is padded up to the nearest 8 bytes
      case State.EXTRA: {
        crawler.context = count('Extra')
        const length = ceil(crawler.uint(0x00), 0x8)
        const offset = crawler.uint(0x04)
        const data = crawler.hex(offset, length)
        extra.push({
          idx: crawler.index,
          origin: ref.origin,
          data,
        })

        crawler.jump(0x10 + length)
        break
      }

      // # DSGO list
      //
      // SpSc IcNc
      // I1I2 ..IN
      // L1L2 ..LN
      // S1S2 ..SN
      //
      // Sp: Points to structure of node names. May be 0, indicating anonymous nodes or an empty list.
      // Sc: The count of named nodes. May be 0.
      // Ic: Points to table of DSGO node indices. May be 0, indicating an empty list.
      // Nc: The count of nodes being referenced. May be 0 for an empty list.
      //
      // I1, I2... IN: Node indexes. Index refers to the order in the file's overall DSGO heap.
      // L1, L2... LN: Node indexes. If L1 is 8, then the first string names the node mentioned in I8.
      // S1, S2... SN: Pointer to the string being used. S1 corresponds to the index indexed by L1.
      case State.DSGO: {
        const label = count('DSGO Table')
        crawler.context = label
        const strCursor = crawler.ptr(0x00)
        const strCount = crawler.uint(0x04)
        const varCursor = crawler.ptr(0x08)
        const varCount = crawler.uint(0x0c)

        const indices = new Array(varCount)
        const stringIndices = new Array(strCount)

        const table = { idx: crawler.index, strCursor, strCount, varCursor, varCount, strCount, varCount }
        tables.push(table)

        crawler.jump(0x10)
        crawler.context = `${label} Index`

        for(let i = 0; i < varCount; i++) {
          indices[i] = crawler.uint(i + 0x04)
        }


        crawler.jump(0x10 + ceil(strCount, 2) * 0x08 + ceil(varCount, 2) * 0x04)
        break;
      }

      default:
        // break loop
        console.log(data)
        throw new Error(`Unknown state ${state} at ${crawler.idx()}`)
    }

    state = null
  }

  return data
}

let countLabels = {}
function count(label) {
  countLabels[label] ??= 0
  return `${label} ${countLabels[label]++}`
}

function ceil(v, x) {
  return Math.ceil(v / x) * x
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
    this.index = index
  }

  isDone() {
    return this.index >= this.buffer.length
  }

  tally(offset = 0x00, label, length) {
    // for(let idx = this.index + offset; idx < this.index + offset + length; idx += 0x04) 
    //   this.tallyMarks.push([this.context, label, idx]);
    this.tallyMarks.push([this.context, label, this.index + offset, this.index + offset + length])
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
      ? this.at(offset).readUInt32LE()
      : this.at(offset).readUInt32BE()
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

    if(type === DsgoType.DOUBLE)
      double = this.double(offset + 0x00)
    else {
      ptr = this.ptr(offset + 0x00)
      this.tally(offset + 0x04, 'blank', 0x04)
    }
    this.tally(offset + 0x08, 'dsgoType', 0x08)

    return { type, ptr, double }
  }

  hex(offset = 0x00, length = Infinity) {
    this.tally(offset, 'hex', length)
    return this.buffer.slice(offset, offset + length).toString('hex')
  }

  [util.inspect.custom]() {
    const startAt = Math.max(0, Math.floor((this.index / 0x10) - 1) * 0x10)
    const endAt = Math.min(startAt + 0x80, this.buffer.length)
    let bufferView = []
    for(let i = startAt; i < endAt; i += 0x2) {
      if(!(i % 0x10)) {
        bufferView.push([kleur.magenta(`${i.toString(16).padStart(8, 0)}:`)])
      }
      let str = this.buffer.readUInt16BE(i).toString(16).padStart(4, 0)
      if(this.index === i) {
        str = kleur.yellow(str)
      }
      bufferView[bufferView.length - 1].push(str)
    }
    return `Cursor 0x${this.index.toString(16)} (${this.endian})
${bufferView.map(r => r.join(' ')).join('\n')}`
  }
}

class ReferenceTracker {
  constructor() {
    this.refs = []
    this.processed = []
  }

  add({ idx, state, origin }) { // Adds the reference sorted
    let i = 0
    for(; i < this.refs.length; i++) {
      const ref = this.refs[i]
      if(idx < ref.idx)
        break
    }
    this.refs.splice(i, 0, { idx, state, origin })
  }

  peek() {
    return this.refs[0]
  }

  consume() {
    this.processed.push(this.refs.shift())
  }
}

module.exports = decompileDsgo
