const storage = require('../../../helpers/storage')
const DsgoType = require('../dsgo-type')

function extra({ value: { format, value } }, composer) {
  const type = DsgoType.DSGO

  let data
  switch(format) {
    case 'hex':
      data = value
      break
    case 'file': {
      data = storage.get('readExtra')(value)
      break
    }
    default:
      throw new Error(`Unknown data format: "${format}"`)
  }

  // `data` should be a hex string by this point
  const ptr = composer.addBlock(Math.ceil(data.length / 2) + 0x10, 'extra', {
    format: 'hex',
    value: data,
  })
  return { type, ptr }
}

module.exports = { extra }
