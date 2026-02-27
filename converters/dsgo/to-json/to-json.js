const bufferCrawler = require('./buffer-crawler')
const referenceTracker = require('./reference-tracker')
const State = require('./state')
const { dsgoHeader } = require('./dsgo-header')
const { dsgoNode } = require('./dsgo-node')
const { dsgoString } = require('./dsgo-string')
const { dsgoExtra } = require('./dsgo-extra')
const { dsgoTable } = require('./dsgo-table')
const { dsgoCalc } = require('./dsgo-calc')
const { dsgoResolver } = require('./resolver')

function decompileDsgo(_, buffer, config) {
  function abort(msg) {
    console.log(data)
    console.log(crawler, { state })
    throw new Error(msg)
  }

  let state = State.HEADER
  let prev = -1

  const crawler = bufferCrawler(buffer)
  const refs = referenceTracker()

  const data = {
    tally: crawler.tallyMarks,
    refs: refs,
    processed: refs.processed,
    abort,
    nodes: [],
    tables: {},
    strings: {},
    extras: {},
    calcs: {},
  }

  // START Process all the data in the buffer
  loop: while(!crawler.isDone()) {
    if (prev === crawler.address) {
      abort('Crawler has not advanced')
    }

    prev = crawler.address
    const ref = refs.peek()
    if(ref && ref.address === crawler.address) {
      state = ref.state
      refs.consume()
    } else if(ref) {
      crawler.skipTo(ref.address)
      continue
    } else if(state == null) {
      abort('Crawler orphaned')
    }

    const processor = {
      [State.HEADER]: dsgoHeader,
      [State.NODE]: dsgoNode,
      [State.STRING]: dsgoString,
      [State.EXTRA]: dsgoExtra,
      [State.CALC]: dsgoCalc,
      [State.DSGO]: dsgoTable,
    }[state];

    if(!processor)
      abort(`Unknown state ${state}`)
    else
      processor(crawler, data)

    state = null
  }
  // END all the data in the buffer

  return {
    format: 'DSGO',
    endian: crawler.endian,
    variables: dsgoResolver(data),
    strings: Object.values(data.strings),
  }
}

BigInt.prototype.toJSON = function () {
  return JSON.rawJSON(this.toString())
}

module.exports = decompileDsgo
