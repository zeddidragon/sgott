const bufferWriter = require('./buffer-writer')
const { dsgoHeader } = require('./dsgo-header')
const { dsgoString } = require('./dsgo-string')
const { dsgoDouble, dsgoPtr } = require('./dsgo-node')

function blocksToDsgo(obj) {
  const writer = new bufferWriter(obj)
  writer.addType('header', dsgoHeader)
  writer.addType('string', dsgoString)
  writer.addType('dsgo0', dsgoDouble)
  writer.addType('dsgo1', dsgoPtr)
  writer.addType('dsgo2', dsgoPtr)
  writer.addType('dsgo3', dsgoPtr)
  writer.addType('dsgo4', dsgoPtr)
  return writer.go()
}

module.exports = {
  blocksToDsgo,
}
