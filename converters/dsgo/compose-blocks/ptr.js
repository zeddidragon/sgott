const { compareStrings } = require('../../../helpers/compare-strings')
const DsgoType = require('../dsgo-type')

function ptr({ value }, composer, jsonNodes, json) {
  const table = new Array(value.length)
  for(let i = 0; i < value.length; i++) {
    let node = value[i]
    if(node.type === 'heap') {
      node = json.heap[node.value]
      if(node == null)
        throw new Error(`Heap node not found: "${value[i].value}"`)
    }
    const index = jsonNodes.indexOf(node)
    if(index === -1) {
      console.error(value[i])
      throw new Error(`Child node not found in nodes list.`)
    }
    table[i] = index
  }

  // index of node in table => address to string that is the name
  // the list _must_ be sorted by charcodes because the game uses this list to search for a node by name
  const names = value
    .map((node, idx) => ({ node, idx })) // Get index within the table
    .filter(({ node }) => node.name != null)
    .sort(({ node: a }, { node: b }) => compareStrings(a.name, b.name))
    .map(({ node: { name }, idx }) => {
      const node = { tableIndex: idx }
      composer.deferString(name, node, 'nameAddress')
      return node
    })

  const size = 0x10 + table.length * 0x04 + names.length * 0x08

  composer.align(0x08)
  const ptr = composer.addBlock(size, 'table', {
    table,
    names,
  })

  return { type: DsgoType.DSGO, ptr }
}

module.exports = { ptr }
