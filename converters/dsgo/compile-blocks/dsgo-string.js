// # String
// str...\0
//
// String of arbitrary length, null-terminated
function dsgoString(writer, content) {
  writer.string(0x00, content)
}

module.exports = {
  dsgoString,
}
