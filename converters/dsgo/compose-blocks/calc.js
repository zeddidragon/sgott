const DsgoType = require('../dsgo-type')
const CalcType = require('../calc-type')

const CalcFunctions = {
  'f:limit': 0x80000005,
  'f:lerp': 0x80000006, 
}

const CalcCommands = {
  value: { command: CalcType.READ_VALUE, size: 0x04 + 0x08 },
  nodeId: { command: CalcType.READ_NODE, size: 0x04 + 0x04 },
  'f:limit': { command: CalcType.FUNCTION, size: 0x04 + 0x04 },
  'f:lerp': { command: CalcType.FUNCTION, size: 0x04 + 0x04 },
  '+': { command: CalcType.MATH_ADD, size: 0x04 },
  '-': { command: CalcType.MATH_SUB, size: 0x04 },
  '*': { command: CalcType.MATH_MUL, size: 0x04 },
  '/': { command: CalcType.MATH_DIV, size: 0x04 },
}

function calc({ value }, composer, jsonNodes) {
  const type = DsgoType.CALC

  let blockSize = 0x08 // Header is 8 bytes
  function unrollCalc(cmd) {
    const { command, size } = CalcCommands[cmd.command]
    blockSize += size
    switch(cmd.command) {
      case 'value': {
        return { command, value: cmd.value }
      }

      case 'nodeId': {
        const index = jsonNodes.findIndex(n => n.id === cmd.value)
        if(index === -1)
          throw new Error(`No index found for node ID: "${cmd.value}"`)
        return { command, value: index }
      }

      case 'f:limit':
      case 'f:lerp': {
        return [
          ...cmd.value.flatMap(unrollCalc),
          { command, value: CalcFunctions[cmd.command] },
        ]
      }

      case '+':
      case '-':
      case '*':
      case '/': {
        return [
          ...cmd.value.flatMap(unrollCalc),
          { command },
        ]
      }

      default:
        throw new Error(`Calc command not recognized: "${cmd.command}"`)
    }
  }

  const calcBlock = unrollCalc(value)

  composer.align(0x04)
  const ptr = composer.addBlock(blockSize, 'calc', calcBlock)

  return { type, ptr }
}

module.exports = { calc }
