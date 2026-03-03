// # DSGO table
//
// SpSc IcNc
// I1I2 ..IN
// L1L2 ..LN
// S1S2 ..SN
//
// Sp: Points to structure of node names. May be 0, indicating anonymous nodes or an empty list.
// Sc: The count of named nodes. May be 0.
// Ic: Points to table of DSGO node indices. May be 0, indicating an empty list.
// Nc: The count of nodes being referenced. May be 0 for an empty list.
//
// I1, I2... IN: Node indices. Index refers to the order in the file's overall DSGO heap.
// S1, S2... SN: Pointer to the string being used. S1 corresponds to the node indexed by L1.
// L1, L2... LN: Node indices. If L1 is 8, then the first string names the node mentioned in I8.
function dsgoTable(writer, { table, names }) {
  if(names.length)
    writer.uint(0x00, 0x10 + table.length * 0x04)
  writer.uint(0x04, names.length || 0)          // namesCount
  writer.uint(0x08, 0x10)                       // varsCursor
  writer.uint(0x0c, table.length)               // varsCount

  writer.jump(0x10)

  for(const i of table) {
    writer.uint(0x00, i)
    writer.jump(0x04)
  }

  for(const { tableIndex, nameAddress } of names) {
    writer.ptr(0x00, nameAddress)
    writer.uint(0x04, tableIndex)
    writer.jump(0x08)
  }
}

function ceil(v, x) {
  return Math.ceil(v / x) * x
}

module.exports = {
  dsgoTable,
}
