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
function dsgoExtra(writer, { format, content }) {
  // TODO: Handle formats other than `raw`
  writer.uint(0x00, content.length)
  writer.uint(0x04, 0x08) // Relative pointer to content body
  writer.write(0x08, content)
}

module.exports = {
  dsgoExtra,
}
