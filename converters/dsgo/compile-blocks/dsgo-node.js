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

function dsgoDouble(writer, { type, double }) {
  writer.double(0x00, double)
  writer.bigInt(0x08, BigInt(type))
}

function dsgoPtr(writer, { type, ptr }) {
  writer.ptr(0x00, ptr)
  writer.bigInt(0x08, BigInt(type))
}

module.exports = {
  dsgoNode,
  dsgoDouble,
  dsgoPtr,
}
