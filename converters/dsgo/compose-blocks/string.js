const DsgoType = require('../dsgo-type')

function string({ value }, { nodes, deferString }) {
  const node = {
    type: DsgoType.STRING,
    ptr: void 0,
  }
  nodes.push(node)
  node.ptr = deferString(node, 'value', value)
}

module.exports = { string }
