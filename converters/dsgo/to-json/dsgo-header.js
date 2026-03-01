const State = require('./state')

// # DSGO Header
//
// DsRt NcPt  |0x10
//
// Ds: Leader that says either DSGO or OGSD to indicate big-endian/little-endian
// Rt: Points to the top-level DSGO table
// Nc: Amount of DSGO nodes
// Pt: Pointer to first DSGO node
function dsgoHeader(crawler, data) {
  crawler.setContext('DSGO Header')
  const leader = crawler.ascii(0x00, 0x04)
  const rootPtr = crawler.ptr(0x04)
  const nodesCount = crawler.uint(0x08)
  const nodesPtr = crawler.ptr(0x0c)

  for(let i = 0; i < nodesCount; i++) {
    data.refs.add({
      address: nodesPtr + i * 0x10,
      state: State.NODE,
    })
  }

  data.header = {
    leader,
    rootPtr,
    nodesCount,
    nodesPtr,
  }
  crawler.endian = leader === 'DSGO' ? 'LE' : 'BE'

  crawler.jump(0x10)
}

module.exports = {
  dsgoHeader,
}
