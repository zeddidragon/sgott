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
function dsgoHeader(writer, { leader, rootIndex, nodes }) {
  writer.endian = leader === 'DSGO' ? 'LE' : 'BE'
  writer.write(0x00, leader)
  writer.ptr(0x04, HEADER_SIZE)
  writer.uint(0x08, nodes.length)
  writer.ptr(0x0c, HEADER_SIZE + NODE_SIZE * rootIndex)

  writer.jump(HEADER_SIZE)
  for(const node of nodes) {
    dsgoNode(writer, node)
    writer.jump(NODE_SIZE)
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
function dsgoNode(writer, { type, double, ptr }) {
  if(type === 0)
    writer.double(0x00, double)
  else
    writer.ptr(0x00, ptr)
  writer.bigInt(0x08, BigInt(type))
}

module.exports = {
  dsgoHeader,
}
