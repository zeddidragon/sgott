const bufferCrawler = require('./buffer-crawler')
const State = require('./state')
const { dsgoHeader } = require('./dsgo-header')
const { dsgoString } = require('./dsgo-string')
const { dsgoExtra } = require('./dsgo-extra')
const { dsgoTable } = require('./dsgo-table')
const { dsgoCalc } = require('./dsgo-calc')

function dsgoToBlocks(buffer, config) {
  const crawler = bufferCrawler(buffer)
  crawler.addState(State.HEADER, dsgoHeader)
  crawler.addState(State.STRING, dsgoString)
  crawler.addState(State.EXTRA, dsgoExtra)
  crawler.addState(State.DSGO, dsgoTable)
  crawler.addState(State.CALC, dsgoCalc)
  crawler.register(0x0, State.HEADER)
  const blocks = crawler.go()
  require('./check-orphans').checkOrphans(blocks)
  return blocks
}

BigInt.prototype.toJSON = function () {
  return JSON.rawJSON(this.toString())
}

module.exports = {
  dsgoToBlocks,
}
