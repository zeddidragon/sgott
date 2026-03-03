const DsgoType = require('../dsgo-type')

// # Single DSGO node
//
// DtBg Type | 0x10
//
// Type: Indicates the type of data in DtBd
// 0: DtBg is a 64-bit double
// 1: Dt points to a string,         Bg is 0
// 2: Dt points to an embedded file, Bg is 0
// 3: Dt points to a DSGO list,      Bg is 0
// 4: Dt points to a Calc node,      Bg is 0
function dsgoNode(crawler) {
  const type = crawler.bigInt(0x08)
  const index = count(crawler)
  if (type === DsgoType.DOUBLE) {
    const double = crawler.double(0x00)
    return {
      size: 0x10,
      type: `dsgo${type}`,
      content: { '#': index, type, double },
    }

  } else {
    const ptr = crawler.ptr(0x00)
    crawler.register(ptr, type)
    return {
      size: 0x10,
      type: `dsgo${type}`,
      content: { '#': index, type, ptr },
    }
  }
}

const counter = new Map() // Start from 0 in case of a new crawler
function count(obj) {
  let value = counter.get(obj) || 0
  counter.set(obj, value + 1)
  return value
}

module.exports = {
  dsgoNode,
}
