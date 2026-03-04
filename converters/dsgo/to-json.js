const { dsgoToBlocks } = require('./dsgo-to-blocks')
const { dsgoBlocksToJson } = require('./dsgo-blocks-to-json')

function decompileDsgo(buffer, opts) {
  const blocks = dsgoToBlocks(buffer, opts)
  if(opts.blocks)
    return blocks
  const resolved = dsgoBlocksToJson(blocks, opts)
  return resolved
}

module.exports = decompileDsgo
