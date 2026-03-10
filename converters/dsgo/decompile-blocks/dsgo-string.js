// # String
// str...\0
//
// String of arbitrary length, null-terminated
function dsgoString(crawler) {
  const string = crawler.string(0x00)

  return {
    size: string.length * 2 + 0x02,
    type: 'string',
    // Despite reading from the string address to the first terminator
    // strings seem to still have trailing spaces.
    // Not always, but often, usually in weapon names.
    // Just the trim the thing, but use original size in the buffer crawler size.
    content: string.trim(),
  }
}

module.exports = {
  dsgoString,
}
