const DsgoType = require('./dsgo-type')
const CalcType = require('./calc-type')

const DsgoTypeNames = [
  'double',
  'string',
  'extra',
  'ptr',
  'calc',
]

const CalcCommandNames = [
  'end',
  'value',
  null, // Not known / Not used
  'nodeId',
  'func',
  '+',
  '-',
  '*',
  '/',
]

const CalcFunctions = {
  [0x80000005]: { name: 'f:limit', args: 1 },
  [0x80000006]: { name: 'f:lerp', args: 3 },
}

function dsgoBlocksToJson(blocks, opts) {
  const header = blocks[0]
  if(header.type !== 'header')
    throw new Error(`Expected block[0] to be header, but it's "${block.type}"`)
  const { leader, rootIndex } = header.content
  const endian = leader === 'DSGO' ? 'LE' : 'BE'

  function at(address) {
    if(address == null)
      throw new Error('Address not defined')
    return blocks[address].content
  }

  // First resolve pass. Translate the type and embed ptr values from the block address
  const nodes = header.content.nodes.map(n => {
    const type = DsgoTypeNames[n.type]
    const node = { name: void 0, type, id: void 0, value: void 0 } // ensure value is last in order because it can get massive

    if(type == null) {
      console.error(n)
      throw new Error('Unknown node')
    }

    if(n.type == DsgoType.DOUBLE) { // == in case n.type is int and not BigInt
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

  // BEGIN Resolve type 4 `calc`
  // First pass to translate the commands into plaintext names
  for(const n of nodes.filter(n => n.type === 'calc')) {
    const stack = []

    loop:
    for(const { command, value } of n.value) {
      const cmd = { command: CalcCommandNames[command], value }

      switch(command) {
        case CalcType.END:
          break loop;

        case CalcType.READ_VALUE:
          stack.push(cmd)
          break

        case CalcType.READ_NODE: {
          if(heapRefs[value]) { // Referenced node is in the heap
            cmd.command = 'heapId'
            cmd.value = heapRefs[value].value
          } else { // Referenced node is in the main tree
            const node = nodes[value]
            if(!node.id)
              node.id = `node${value}` // Assumed to be unique

            cmd.value = node.id
          }

          stack.push(cmd)
          break
        }

        case CalcType.FUNCTION: {
          const func = CalcFunctions[value]

          if(!func)
            throw new Error(`Unknown calc function: ${value}`)

          cmd.command = func.name
          cmd.value = stack.splice(-func.args)
          stack.push(cmd)
          break
        }

        case CalcType.MATH_ADD:
        case CalcType.MATH_SUB:
        case CalcType.MATH_MUL:
        case CalcType.MATH_DIV: {
          cmd.value = stack.splice(-2)
          stack.push(cmd)
          break
        }
      }
    }

    n.value = stack[0]
  }

  // END Resolve type 4 `calc`

  return {
    format: 'DSGO',
    endian,
    variables: nodes[rootIndex].value,
    heap,
  }
}

module.exports = {
  dsgoBlocksToJson,
}
