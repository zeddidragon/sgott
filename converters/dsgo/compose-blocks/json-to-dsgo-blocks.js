const { double } = require('./double')
const { string } = require('./string')
const { extra } = require('./extra')
const { ptr } = require('./ptr')
const { calc } = require('./calc')
const dsgoTypes = {
  double,
  string,
  extra,
  ptr,
  calc,
}
const blockComposer = require('./block-composer')

function jsonToDsgoBlocks(json, state) {
  const composer = blockComposer(json, state)

  const traversed = new Set()
  function* eachNode(nodes) {
    for(let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      switch(node.type) {
      case 'ptr': {
        yield node
        yield *eachNode(node.value)
        break
      }
      case 'heap': {
        // NOT yielded. Resolved later in ./ptr.js
        const heapNode = json.heap[node.value]
        if(heapNode == null)
          throw new Error(`Heap node not found: "${node.value}"`)

        if(!traversed.has(heapNode)) {
          traversed.add(heapNode)
          yield* eachNode([heapNode])
        }
        break
      }
      default: {
        yield node
        break
      }
      }
    }
  }

  // First pass, simply unroll all the nodes as is
  const jsonNodes = []
  const rootNode = {
    type: 'ptr',
    value: json.variables,
  }
  for(const jsonNode of eachNode([rootNode])) {
    jsonNodes.push(jsonNode)
  }

  const blockNodes = new Array(jsonNodes.length)
  composer.addBlock(0x10 + jsonNodes.length * 0x10, 'header', {
    leader: json.endian === 'LE' ? 'DSGO' : 'OGSD',
    rootIndex: 0,
    nodes: blockNodes,
  })

  // Now that we know the total amount of nodes we have an address
  const address = 0x10 + jsonNodes.length * 0x10
  for(let i = 0; i < jsonNodes.length; i++) {
    const node = jsonNodes[i]
    blockNodes[i] = dsgoTypes[node.type](node, composer, jsonNodes, json)
  }

  return composer.finalize()
}

module.exports = {
  jsonToDsgoBlocks,
}
