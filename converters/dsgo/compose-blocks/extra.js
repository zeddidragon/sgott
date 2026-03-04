const DsgoType = require('../dsgo-type')

function extra({ value }, { nodes, defer }) {
  const node = {
    type: DsgoType.EXTRA,
    ptr: void 0,
  }
  nodes.push(node)
  node.ptr = defer(node, 'value', value)
}

module.exports = { extra }
