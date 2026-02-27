// # String
// str...\0
//
// String of arbitrary length, null-terminated
function dsgoString(crawler, { strings }) {
  crawler.setContext('String')
  const str = crawler.string(0x00)

  strings[crawler.address] = str
  crawler.jump(str.length * 2 + 0x02)
}

module.exports = {
  dsgoString,
}
