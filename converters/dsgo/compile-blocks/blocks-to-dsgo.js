const bufferWriter = require('./buffer-writer')
const { dsgoHeader } = require('./dsgo-header')
const { dsgoString } = require('./dsgo-string')
const { dsgoDouble, dsgoPtr } = require('./dsgo-node')
const { dsgoExtra } = require('./dsgo-extra')
const { dsgoTable } = require('./dsgo-table')
const { dsgoCalc } = require('./dsgo-calc')

function blocksToDsgo(obj) {
  const writer = new bufferWriter(obj)
  writer.addType('header', dsgoHeader)
  writer.addType('string', dsgoString)
  writer.addType('dsgo0', dsgoDouble)
  writer.addType('dsgo1', dsgoPtr)
  writer.addType('dsgo2', dsgoPtr)
  writer.addType('dsgo3', dsgoPtr)
  writer.addType('dsgo4', dsgoPtr)
  writer.addType('extra', dsgoExtra)
  writer.addType('table', dsgoTable)
  writer.addType('calc', dsgoCalc)
  return writer.go()
}

module.exports = {
  blocksToDsgo,
}
