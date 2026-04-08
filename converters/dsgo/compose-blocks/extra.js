const DsgoType = require('../dsgo-type')

function handleSgo(sgoValue, composer) {
  const type = DsgoType.EXTRA

  const compiled = composer.state.compilers.sgo(composer.state.compiler, sgoValue, composer.state)
  const size = compiled.length
  const offset = alignHeader(composer)
  const ptr = composer.addBlock(offset + size, 'extra', {
    format: 'hex',
    value: compiled.toString('hex'),
  })
  composer.align(0x08)
  return { type, ptr }
}

function alignHeader(composer) {
  // `data` should be a hex string by this point
  composer.align(0x02)
  const address = composer.address
  composer.address += 0x08 // Size of header
  composer.align(0x10)
  const offset = composer.address - address
  composer.address = address
  return offset
}

function extra({ value }, composer) {
  const type = DsgoType.EXTRA

  let data
  switch(value.format) {
  case 'hex':
    data = value.value
    break
  case 'file': {
    data = composer.state.readExtra(value.value)
    if(value.value.endsWith('.json')) {
      contents = JSON.parse(data)
      if(contents.format === 'SGO')
        return handleSgo(contents, composer)
      else
        throw new Error('Expected an "SGO" format file, but it was not one')
    }
    format = 'hex'
    data = data.toString('hex')
    break
  }
  case 'SGO':
    return handleSgo(value, composer)
  default:
    throw new Error(`Unknown data format: "${format}"`)
  }

  // `data` should be a hex string by this point
  const offset = alignHeader(composer)
  const size = Math.ceil(data.length / 2)
  const ptr = composer.addBlock(offset + size, 'extra', {
    format: 'hex',
    value: data,
  })
  composer.align(0x08)
  return { type, ptr }
}

module.exports = { extra }
