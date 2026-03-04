const DsgoType = require('../dsgo-type')

function double({ value }, { nodes }) {
  const node = {
    type: DsgoType.DOUBLE,
    double: value,
  }
  nodes.push(node)
}

module.exports = { double }
