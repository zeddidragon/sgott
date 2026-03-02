const DsgoType = require('../dsgo-type')

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
function dsgoTable(crawler) {
  const address = crawler.address
  const namesCursor = crawler.ptr(0x00)
  const namesCount = crawler.uint(0x04)
  const varCursor = crawler.ptr(0x08)
  const varCount = crawler.uint(0x0c)
  if (varCursor !== crawler.address + 0x10)
    crawler.abort(`Offset expected to be ${0x10} but was ${varCursor - 0x10}`)

  const table = new Array(varCount)
  crawler.jump(0x10)

  for(let i = 0; i < varCount; i++) {
    table[i] = crawler.uint(0x00)
    crawler.jump(0x04)
  }

  const names = new Array(namesCount)
  for(let i = 0; i < namesCount; i++) {
    const nameAddress = crawler.ptr(0x00)
    const nodeIndex = crawler.uint(0x04)
    names[i] = { nodeIndex, nameAddress }
    crawler.register(nameAddress, DsgoType.STRING)
    crawler.jump(0x08)
  }

  return {
    address,
    size: 0x10 + namesCount * 0x08 + varCount * 0x04,
    type: 'DSGO Table',
    content: { table, names },
  }
}

function ceil(v, x) {
  return Math.ceil(v / x) * x
}

module.exports = {
  dsgoTable,
}
