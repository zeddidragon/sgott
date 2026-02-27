const util = require('util')
const kleur = require('kleur')
const bufferCrawler = require('./buffer-crawler')
const { dsgoHeader } = require('./dsgo-header')
const { dsgoNode } = require('./dsgo-node')
const { dsgoString } = require('./dsgo-string')
const { dsgoExtra } = require('./dsgo-extra')
const { dsgoCalc } = require('./dsgo-calc')

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
    console.log(data)
    console.log(crawler, { state })
    throw new Error(msg)
  }

  let state = State.HEADER
  let prev = -1

  const crawler = bufferCrawler(buffer)


  const refs = new ReferenceTracker()

  const variables = []
  const nodes = []
  const tables = []
  const extra = []
  const strings = []
  const data = {
    tally: crawler.tallyMarks,
    refs: refs.refs,
    // processed: refs.processed,
    extra,
    // tables,
    nodes,
  }

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
      State.HEADER: dsgoHeader,
      State.NODE: dsgoNode,
      State.STRING: dsgoString,
      State.EXTRA: dsgoExtra,
      State.CALC: dsgoCalc,
    }[state];

    if(!processor)
      abort(`Unknown state ${state}`)
    else
      processor(crawler, data)

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

BigInt.prototype.toJSON = function () {
  return JSON.rawJSON(this.toString())
}

module.exports = decompileDsgo
