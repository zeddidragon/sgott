const CalcCommand = {
  END: 0,
  READ_VALUE: 1,
  // 2 is unknown / unused
  READ_NODE: 3,
  FUNCTION: 4,
  MATH_ADD: 5,
  MATH_SUB: 6,
  MATH_MUL: 7,
  MATH_DIV: 8,
}

// # Calc
//
// 
function dsgoCalc(writer, cmd) {
  let size = 0

  writer.uint(0x00, size)
  writer.uint(0x04, 0x08) // ptr to ndoes
}

module.exports = {
  dsgoCalc,
}
