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
function dsgoExtra(writer, { format, value }) {
  // Extra data wants to be aligned at the next 0
  let offset = Math.ceil((writer.address + 0x08) / 0x10) * 0x10 - writer.address

  // TODO: Handle formats other than `raw`
  if(format !== 'hex')
    throw new Error('format should be hex')
  writer.uint(0x00, value.length / 2) // A byte is 2 hex characters
  writer.uint(0x04, offset) // Relative pointer to content body
  writer.jump(offset)
  writer.hex(0x00, value)
}

module.exports = {
  dsgoExtra,
}
