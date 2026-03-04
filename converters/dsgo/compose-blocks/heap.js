const DsgoType = require('../dsgo-type')

function heap({ value }, { nodes, defer }) {
  const node = {
    type: DsgoType.DSGO,
    ptr: void 0,
  }
  nodes.push(node)
  node.ptr = defer(node, 'value', value)
}

module.exports = { heap }
