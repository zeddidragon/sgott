const json = require('json-stringify-pretty-compact')
const { blocksToDsgo } = require('./blocks-to-dsgo')
const { jsonToDsgoBlocks } = require('./json-to-dsgo-blocks')

function compileDsgo(obj, state) {
  const blocks = jsonToDsgoBlocks(obj, state)
  if(state.opts.blocks)
    return json(blocks)

  return blocksToDsgo(blocks, state)
}

module.exports = compileDsgo
