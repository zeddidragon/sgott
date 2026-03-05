const DsgoType = require('../dsgo-type')

function extra({ value }, composer) {
  const type = DsgoType.DSGO
  const ptr = composer.addBlock(Math.ceil(value.content.length / 2) + 0x10, {
    type: 'extra',
    content: value,
  })
  return { type, ptr }
}

module.exports = { extra }
