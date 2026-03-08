const CalcType = require('../calc-type')

// # Calc
//
// 
function dsgoCalc(crawler) {
  const size = crawler.uint(0x00)
  let offset = crawler.uint(0x04)

  if (offset !== 0x08)
    abort(`Offset expected to be ${0x08} but was ${offset}`)

  // Helper functions that manipulates the stack and crawls the offset
  function int() {
    const val = crawler.uint(offset)
    offset += 0x04
    return val
  }
  function double() {
    const val = crawler.double(offset)
    offset += 0x08
    return val
  }
  const headerSize = offset

  function push(command, value) {
    content.push({ command, value })
  }

  crawler.jump(offset) // Assumes data immediately follows header
  offset = 0x00

  const content = []
  loop:
  while(offset < size) {
    const command = int()
    switch(command) {
      case CalcType.READ_VALUE:
        push(command, double())
        break

      case CalcType.READ_NODE:
      case CalcType.FUNCTION:
        push(command, int())
        break

      case CalcType.MATH_ADD:
      case CalcType.MATH_SUB:
      case CalcType.MATH_MUL:
      case CalcType.MATH_DIV:
        push(command)
        break

      case CalcType.END:
        push(command)
        break loop
    }
  }

  return {
    size: headerSize + offset,
    type: 'calc',
    content,
  }
}

module.exports = {
  dsgoCalc,
}
