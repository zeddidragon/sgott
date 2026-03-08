// # String
// str...\0
//
// String of arbitrary length, null-terminated
function dsgoString(crawler) {
  const string = crawler.string(0x00)

  return {
    size: string.length * 2 + 0x02,
    type: 'string',
    content: string,
  }
}

module.exports = {
  dsgoString,
}
