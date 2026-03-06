const storage = require('../../../helpers/storage')
let i = 0;

// # Embedded file
// SzDp
// ...data...
//
// Sz: Length of the data in bytes
// Dp: Points to the start of the data
// 
// The file may or may not be in a known format, including SGO, RMP, DSGO, or anything else
// Contents of embedded files are independent from this file and will not reference our data
// The data is padded up to the nearest 8 bytes
function dsgoExtra(crawler) {
  const length = crawler.uint(0x00)
  const offset = crawler.uint(0x04)

  if (offset !== 0x08 && offset !== 0x10)
    crawler.abort(`Offset expected to be ${0x08} or ${0x10} but was ${offset}`)

  crawler.jump(offset)
  let content
  if(storage.get('opts')?.['export-extra']) {
    // TODO: Guess the file format
    const fileName = `extra-${i++}.bin`
    storage.push('export-extra', { fileName, data: crawler.at(0x00).slice(0x00, length)})
    content = { format: 'file', value: fileName }
  } else {
    const data = crawler.hex(0x00, length) // Assumes data immediately follows header
    content = { format: 'hex', value: data }
  }

  return {
    size: offset + length,
    type: 'extra',
    content,
  }
}

module.exports = {
  dsgoExtra,
}
