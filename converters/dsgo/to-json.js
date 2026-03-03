const { dsgoToBlocks } = require('./dsgo-to-blocks')
const { blocksToJson } = require('./blocks-to-json')

function decompileDsgo(buffer, opts) {
  const blocks = dsgoToBlocks(buffer, opts)
  if(opts.intermediate)
    return blocks
  const resolved = blocksToJson(blocks, opts)
  return resolved
}

module.exports = decompileDsgo
