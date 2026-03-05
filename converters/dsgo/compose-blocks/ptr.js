const DsgoType = require('../dsgo-type')

function ptr({ value }, { nodes, defer, unroll }) {
  const node = {
    type: DsgoType.DSGO,
    ptr: void 0,
  }
  nodes.push(node)
  const table = {
    type: 'table',
    content: {
      table: [],
      names: [],
    }
  }
  node.ptr = defer(node, 'value', value)
  value.forEach(unroll)
}

module.exports = { ptr }
