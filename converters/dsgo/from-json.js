const json = require('json-stringify-pretty-compact')
const storage = require('../../helpers/storage')
const { blocksToDsgo } = require('./blocks-to-dsgo')
const { jsonToDsgoBlocks } = require('./json-to-dsgo-blocks')

function compileDsgo(obj) {
  const blocks = jsonToDsgoBlocks(obj)
  if(storage.get('opts').blocks)
    return json(blocks)

  return blocksToDsgo(blocks)
}

module.exports = compileDsgo
