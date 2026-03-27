const { dsgoToBlocks } = require('./dsgo-to-blocks')
const { dsgoBlocksToJson } = require('./dsgo-blocks-to-json')

function decompileDsgo(buffer, state) {
  const blocks = dsgoToBlocks(buffer, state)
  if(state.opts.blocks)
    return blocks
  const resolved = dsgoBlocksToJson(blocks, state)
  return resolved
}

module.exports = decompileDsgo
