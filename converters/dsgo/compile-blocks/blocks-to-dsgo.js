const bufferWriter = require('./buffer-writer')
const { dsgoHeader } = require('./dsgo-header')
const { dsgoString } = require('./dsgo-string')
const { dsgoExtra } = require('./dsgo-extra')
const { dsgoTable } = require('./dsgo-table')
const { dsgoCalc } = require('./dsgo-calc')

function blocksToDsgo(obj) {
  const writer = new bufferWriter(obj)
  writer.addType('header', dsgoHeader)
  writer.addType('string', dsgoString)
  writer.addType('extra', dsgoExtra)
  writer.addType('table', dsgoTable)
  writer.addType('calc', dsgoCalc)
  return writer.go()
}

module.exports = {
  blocksToDsgo,
}
