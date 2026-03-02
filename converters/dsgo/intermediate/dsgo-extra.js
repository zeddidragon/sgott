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

  if(offset > 0x08) 
    crawler.padding(0x08, offset - 0x08)

  const content = crawler.hex(offset, length) // Assumes data immediately follows header
  return {
    address: crawler.address,
    size: (offset - crawler.address) + length,
    type: 'DSGO Extra (Hex)',
    content: content,
  }
}

module.exports = {
  dsgoExtra,
}
