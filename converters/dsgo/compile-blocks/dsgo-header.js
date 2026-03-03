// # DSGO Header
//
// DsRt NcPt  |0x10
//
// Ds: Leader that says either DSGO or OGSD to indicate big-endian/little-endian
// Rt: Points to the top-level DSGO table
// Nc: Amount of DSGO nodes
// Pt: Pointer to first DSGO node
function dsgoHeader(writer, { leader, nodesCount, nodesPtr, rootPtr }) {
  writer.endian = leader === 'DSGO' ? 'LE' : 'BE'
  writer.write(0x00, leader)
  writer.ptr(0x04, nodesPtr)
  writer.uint(0x08, nodesCount)
  writer.ptr(0x0c, rootPtr)
}

module.exports = {
  dsgoHeader,
}
