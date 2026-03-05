const DsgoType = require('../dsgo-type')

function double({ value }) {
  return {
    type: DsgoType.DOUBLE,
    double: value,
  }
}

module.exports = { double }
