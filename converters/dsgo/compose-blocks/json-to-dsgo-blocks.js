const { double } = require('./double')
const { string } = require('./string')
const { extra } = require('./extra')
const { ptr } = require('./ptr')
const { heap } = require('./heap')
const { calc } = require('./calc')
const dsgoTypes = {
  double,
  string,
  extra,
  ptr,
  heap,
  calc,
}
const blockComposer = require('./block-composer')

function jsonToDsgoBlocks(json) {
  const composer = blockComposer(json)
  // composer.addState('double', double)
  // composer.addState('string', string)
  // composer.addState('extra', extra)
  // composer.addState('ptr', ptr)
  // composer.addState('heap', heap)
  // composer.addState('calc', calc)

  const traversed = new Set()
  function* eachNode(nodes) {
    for(const node of nodes) {
      yield node
      switch(node.type) {
        case 'ptr': {
          yield *eachNode(node.value)
          break
        }
        case 'heap': {
          const heapNode = json.heap[node.value]
          if(!traversed.has(heapNode)) {
            traversed.add(heapNode)
            yield* eachNode([heapNode])
          }
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
  let address = 0x10 + jsonNodes.length * 0x10
  for(let i = 0; i < jsonNodes.length; i++) {
    const node = jsonNodes[i]
    blockNodes[i] = dsgoTypes[node.type](node, composer, jsonNodes)
  }

  return composer.blocks
}

module.exports = jsonToDsgoBlocks
