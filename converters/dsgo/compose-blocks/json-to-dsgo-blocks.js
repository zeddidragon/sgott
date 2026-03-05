const { double } = require('./double')
const { string } = require('./string')
const { extra } = require('./extra')
const { ptr } = require('./ptr')
const { heap } = require('./heap')
const { calc } = require('./calc')
const nodeTypes = {
  double,
  string,
  extra,
  ptr,
  heap,
  calc,
}

function jsonToDsgoBlocks(json) {
  const blocks = []
  const rootNode = {
    type: 'ptr',
    value: json.variables,
  }

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

  let i = 0
  for(const node of eachNode([rootNode])) {
    i++;
    if(node.id)
      console.log(i, node)
  }

  return ''
  return rootNode

  /*
  const nodes = []
  const header = {
    type: 'header',
    content: {
      leader: json.endian === 'LE' ? 'DSGO' : 'OGSD',
      rootIndex: 0,
      nodes: nodes,
    }
  }
  blocks.push(header)

  function defer(obj, key, object) {
    // TODO
  }

  function deferString(obj, key, string) {
    // TODO
  }

  // Unroll the node tree depth-first
  function unroll(jsonNode) {
    const blockNode = { type: 0n }
    nodes.push(blockNode)

    const cb = nodeTypes[jsonNode.type]
    if(!cb)
      throw new Error(`Unknown type: "${jsonNode.type}"`)

    cb(jsonNode, {
      json,
      nodes,
      unroll,
      defer,
      deferString,
    })
  }

  unroll({ type: 'ptr', value: json.variables }) // The root node
  */

  return blocks[0].content
}

module.exports = jsonToDsgoBlocks
