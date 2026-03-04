const DsgoType = require('../dsgo-type')

function calc({ value }, { nodes, defer }) {
  const node = {
    type: DsgoType.CALC,
    ptr: void 0,
  }
  nodes.push(node)
  node.ptr = defer(node, 'value', value)
}

module.exports = { calc }
