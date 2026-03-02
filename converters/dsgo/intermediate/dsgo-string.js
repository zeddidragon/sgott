// # String
// str...\0
//
// String of arbitrary length, null-terminated
function dsgoString(crawler) {
  const string = crawler.string(0x00)

  return {
    address: crawler.address,
    size: string.length * 2 + 0x02,
    type: 'string',
    value: string,
  }
}

module.exports = {
  dsgoString,
}
