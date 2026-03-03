const DsgoType = require('../dsgo-type')

// Internal values for state machine only
const State = {
  ...DsgoType,

  HEADER: 100n,
  NODE: 101n,
}

module.exports = State
