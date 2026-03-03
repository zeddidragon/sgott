const State = require('./state')

// # DSGO Header
//
// DsRt NcPt  |0x10
//
// Ds: Leader that says either DSGO or OGSD to indicate big-endian/little-endian
// Rt: Points to the top-level DSGO table
// Nc: Amount of DSGO nodes
// Pt: Pointer to first DSGO node
function dsgoHeader(crawler) {
  const leader = crawler.ascii(0x00, 0x04)
  const nodesPtr = crawler.ptr(0x04)
  const nodesCount = crawler.uint(0x08)
  const rootPtr = crawler.ptr(0x0c)
  const offset = Math.min(nodesPtr, rootPtr) // Unclear which is which

  for(let i = 0; i < nodesCount; i++) {
    crawler.register(offset + i * 0x10, State.NODE)
  }

  crawler.endian = leader === 'DSGO' ? 'LE' : 'BE'
  return {
    size: 0x10,
    type: 'header',
    content: { leader, nodesCount, nodesPtr, rootPtr },
  }
}

module.exports = {
  dsgoHeader,
}
