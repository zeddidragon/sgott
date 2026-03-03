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
function dsgoCalc(writer, content) {
  let offset = 0x08

  // Helper functions that manipulates the stack and crawls the offset
  function int(value) {
    writer.uint(offset, value)
    offset += 0x04
  }
  function double(value) {
    writer.double(offset, value)
    offset += 0x08
  }

  for(const { command, value } of content) {
    int(command)
    
    switch(command) {
      case CalcCommand.END: break;

      case CalcCommand.READ_VALUE: double(value); break;
      case CalcCommand.READ_NODE: int(value); break;
      case CalcCommand.FUNCTION: int(value); break;

      // These do not have values. Left for completeness
      case CalcCommand.MATH_ADD: break;
      case CalcCommand.MATH_SUB: break;
      case CalcCommand.MATH_MUL: break;
      case CalcCommand.MATH_DIV: break;
    }
  }

  const size = offset - 0x08
  // Header
  writer.uint(0x00, size)
  writer.uint(0x04, 0x08) // ptr to ndoes

}

module.exports = {
  dsgoCalc,
}
