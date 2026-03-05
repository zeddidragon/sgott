const DsgoType = require('../dsgo-type')

function calc({ value }, composer) {
  const type = DsgoType.DSGO
  const ptr = void 0
  return { type, ptr }
}

module.exports = { calc }
