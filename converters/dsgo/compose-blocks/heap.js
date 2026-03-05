const DsgoType = require('../dsgo-type')

function heap({ value }, composer) {
  const type = DsgoType.DSGO
  const ptr = void 0
  return { type, ptr }
}

module.exports = { heap }
