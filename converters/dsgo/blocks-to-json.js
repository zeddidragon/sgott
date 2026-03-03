const DsgoType = require('./dsgo-type')
const DsgoTypeNames = [
  'double',
  'string',
  'extra',
  'ptr',
  'calc',
]

function blocksToJson(blocks, opts) {
  const header = blocks[0]
  if(header.type !== 'header')
    throw new Error(`Expected block[0] to be header, but it's "${block.type}"`)
  const { leader, rootIndex } = header.content
  const endian = leader === 'DSGO' ? 'LE' : 'BE'

  function at(address) {
    return blocks[address].content
  }

  // First resolve pass. Translate the type and embed ptr values from the block address
  const nodes = header.content.nodes.map(n => {
    const type = DsgoTypeNames[n.type]
    const node = { name: void 0, type, value: void 0 } // ensure value is last in order because it can get massive

    if(type == null) {
      console.error(n)
      throw new Error('Unknown node')
    }

    if(n.type === DsgoType.DOUBLE) {
      node.value = n.double
      return node
    } else {
      node.value = at(n.ptr)
      return node
    }
  })


  // BEGIN Resolve type 3 `ptr`

  // If a node is referenced multiple times, it won't fit neatly in a tree because JSON can't reference like that
  // The final file might explode in size, or worse, have a circular reference
  // To prevent this, we first have to identify any nodes referenced multiple times
  const referencedNodes = new Set()
  const heap = {}
  const heapRefs = {}
  const heapNodeIds = new Set()
  for(const n of nodes.filter(n => n.type === 'ptr')) {
    for(const index of n.value.table) {
      if(heapRefs[index])
        continue

      if(referencedNodes.has(index)) {
        const heapId = `node${index}`
        heap[heapId] = nodes[index]
        heapRefs[index] = { name: void 0, type: 'heap', value: heapId }
        continue
      }

      referencedNodes.add(index)
    }
  }

  // Now we can resolve all the tables
  for(const n of nodes.filter(n => n.type === 'ptr')) {
    const children = n.value.table.map(index => {
      if(heapRefs[index]) {
        return { ...heapRefs[index] } // Clone the node so it can be named
      }

      return nodes[index]
    })

    for(const { tableIndex, nameAddress } of n.value.names) {
      children[tableIndex].name = at(nameAddress)
    }

    n.value = children
  }

  // END Resolve type 3 `ptr`

  return {
    endian,
    variables: nodes[rootIndex].value,
    heap,
  }
}

module.exports = {
  blocksToJson,
}
