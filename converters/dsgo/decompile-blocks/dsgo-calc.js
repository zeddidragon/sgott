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
/*
function dsgoCalc(crawler) {
  const size = crawler.uint(0x00)
  let offset = crawler.uint(0x04)

  if (offset !== 0x08)
    abort(`Offset expected to be ${0x08} but was ${offset}`)
  const headerSize = offset
  crawler.jump(offset) // Assumes data immediately follows header

  offset = 0x0
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
  function math(token) {
    push({ cmd: token, values: pop(2) })
  }
  function pop(amount = 1) {
    if(stack.length < amount) {
      throw new Error(`Calc error: ${amount} values were expected, but were ${stack.length}`)
    }
    return stack.splice(-amount)
  }
  function push(value) {
    stack.push(value)
  }

  const stack = []
  loop: while(offset < size) {
    const command = int()
    switch(command) {
      case CalcCommand.END:
        break loop;
      
      case CalcCommand.READ_VALUE:
        push({ cmd: 'value', value: double() })
        break
      case CalcCommand.READ_NODE:
        const node = { cmd: 'ref', value: int() }
        push(node)
        break

      case CalcCommand.FUNCTION:
        const func = int()
        switch(func) {
          case 0x80000005: push({ cmd: 'f:limit', values: pop(1) }); break;
          case 0x80000006: push({ cmd: 'f:lerp', values: pop(3) }); break;
          default: push(`f:[${func.toString(16)}/${func}]`); break;
        }
        break

      case CalcCommand.MATH_ADD: math('+'); break;
      case CalcCommand.MATH_SUB: math('-'); break;
      case CalcCommand.MATH_MUL: math('*'); break;
      case CalcCommand.MATH_DIV: math('/'); break;

      default:
        abort(`Calc error: Unknown command ${command}`)
        break
    }
  }

  if(!stack.length) throw new Error('Calc error: No output')
  if(stack.length > 1) {
    throw new Error(`Calc error: Stack unresolved | ${stack.join(', ')}`)
  }

  return {
    size: headerSize + offset,
    type: 'calc',
    content: stack[0],
  }
}
*/

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

  crawler.jump(offset) // Assumes data immediately follows header
  offset = 0x00

  const content = []
  loop:
  while(offset < size) {
    const command = int()
    switch(command) {
      case CalcCommand.END:
        break loop;
      
      case CalcCommand.READ_VALUE:
        content.push({ command: 'value', value: double() })
        break
      case CalcCommand.READ_NODE:
        content.push({ command: 'ref', value: int() })
        break

      case CalcCommand.FUNCTION:
        content
        const func = int()
        content.push({ command: 'func', func })
        break

      case CalcCommand.MATH_ADD: content.push({ command: '+' }); break;
      case CalcCommand.MATH_SUB: content.push({ command: '-' }); break;
      case CalcCommand.MATH_MUL: content.push({ command: '*' }); break;
      case CalcCommand.MATH_DIV: content.push({ command: '/' }); break;

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
