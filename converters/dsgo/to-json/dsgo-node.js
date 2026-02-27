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
function dsgoNode(crawler, { nodes, refs }) {
  crawler.setContext('DSGO Node')

  crawler.skipTally = true
  const type = crawler.bigInt(0x08)
  crawler.skipTally = false

  if (type === DsgoType.DOUBLE) {
    const double = crawler.double(0x00)
    crawler.bigInt(0x08) // Keep tally in order

    const node = { address: crawler.address, type, double }
    nodes.push(node)

  } else {
    const ptr = crawler.ptr(0x00)
    crawler.padding(0x04, 0x04) // Keep tally in order
    crawler.bigInt(0x08)

    const node = { address: crawler.address, type, ptr }
    nodes.push(node)
    refs.add({
      address: ptr,
      state: type,
      origin: node,
    })
  }
  
  crawler.jump(0x10)
}

module.exports = {
  dsgoNode,
}
