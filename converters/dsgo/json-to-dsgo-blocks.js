const DsgoType = require('./dsgo-type')

function jsonToDsgoBlocks(obj) {
  const blocks = []

  const nodes = []
  const header = {
    type: 'header',
    content: {
      leader: obj.endian === 'LE' ? 'DSGO' : 'OGSD',
      rootIndex: 0,
      nodes: nodes,
    }
  }
  blocks.push(header)

  // Unroll the node tree depth-first
  function unroll(jsonNode) {
    const blockNode = { type: 0 }
    switch(jsonNode.type) {
      case 'ptr': {
        blockNode.type = DsgoType.DSGO
        break
      }
    }
    nodes.push(blockNode)
  }

  unroll({ type: 'ptr', value: obj.variables }) // The root node

  return blocks[0].content
}

module.exports = jsonToDsgoBlocks
