const DsgoType = require('../dsgo-type')

const HEADER_SIZE = 0x10
const NODE_SIZE = 0x10

// # DSGO Header
//
// DsPt NcRt  |0x10
//
// Ds: Leader that says either DSGO or OGSD to indicate big-endian/little-endian
// Pt: Pointer to first DSGO node
// Nc: Amount of DSGO nodes
// Rt: Points to the top-level DSGO table
function dsgoHeader(crawler) {
  const leader = crawler.ascii(0x00, 0x04)
  const ptrA = crawler.ptr(0x04)
  const nodesCount = crawler.uint(0x08)
  const ptrB = crawler.ptr(0x0c)

  crawler.endian = leader === 'DSGO' ? 'LE' : 'BE'

  const offset = Math.min(ptrA, ptrB) // Unclear which is which
  const rootIndex = (Math.max(ptrA, ptrB) - offset) / NODE_SIZE  // Whichever is larger must point to the root node. They're usually identical.

  if (offset !== HEADER_SIZE)
    crawler.abort(`Offset expected to be ${HEADER_SIZE} but was ${offset}`)
  crawler.jump(offset)

  const nodes = new Array(nodesCount)
  for(let i = 0; i < nodesCount; i++) {
    nodes[i] = dsgoNode(crawler)
    crawler.jump(NODE_SIZE)
  }

  return {
    size: HEADER_SIZE + NODE_SIZE * nodesCount,
    type: 'header',
    content: { leader, rootIndex, nodes },
  }
}

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
  if (type === DsgoType.DOUBLE) {
    const double = crawler.double(0x00)
    return { type, double }

  } else {
    const ptr = crawler.ptr(0x00)
    crawler.register(ptr, type)
    return { type, ptr }
  }
}

module.exports = {
  dsgoHeader,
}
