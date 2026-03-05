const { compareStrings } = require('../../../helpers/compare-strings')
const DsgoType = require('../dsgo-type')

function ptr({ value }, composer, nodes) {
  const table = value.map(v => nodes.indexOf(v))
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

  const size = 0x10 + nodes.length * 0x04
  const ptr = composer.addBlock(size, 'table', {
    table,
    names,
  })
  console.log(table, names, ptr)

  return { type: DsgoType.DSGO, ptr }
}

module.exports = { ptr }
