const DsgoType = require('../dsgo-type')

function extra({ value: { format, value } }, composer) {
  const type = DsgoType.EXTRA

  let data
  switch(format) {
  case 'hex':
    data = value
    break
  case 'file': {
    data = composer.state.readExtra(value)
    break
  }
  default:
    throw new Error(`Unknown data format: "${format}"`)
  }

  // `data` should be a hex string by this point
  composer.align(0x08)
  const address = composer.address
  composer.address += 0x08 // Size of header
  composer.align(0x10)
  const offset = composer.address - address
  const size = Math.ceil(data.length / 2)
  composer.address = address

  const ptr = composer.addBlock(offset + size, 'extra', {
    format: 'hex',
    value: data,
  })
  composer.align(0x08)
  return { type, ptr }
}

module.exports = { extra }
