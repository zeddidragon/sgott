const json = require('json-stringify-pretty-compact')
const jsonToDsgoBlocks = require('./json-to-dsgo-blocks')

function compileDsgo(obj) {
  const blocks = jsonToDsgoBlocks(obj)

  return json(blocks)
}

module.exports = compileDsgo
