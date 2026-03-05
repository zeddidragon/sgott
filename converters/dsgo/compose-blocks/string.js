const DsgoType = require('../dsgo-type')

function string({ value }, composer) {
  const node = { type: DsgoType.STRING }
  composer.deferString(value, node, 'ptr')
  return node
}

module.exports = { string }
