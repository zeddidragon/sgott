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

  if (offset > 0x14)
    crawler.abort(`Offset expected to be less than ${0x14} but was ${offset}`)

  crawler.jump(offset)
  const leader = crawler.at(0x00).slice(0x00, 0x04).toString('utf8')
  const data = crawler.hex(0x00, length) // Assumes data immediately follows header
  const content = { format: 'hex', value: data }

  return {
    size: offset + length,
    type: 'extra',
    content,
  }
}

module.exports = {
  dsgoExtra,
}
