const DsgoType = require('../dsgo-type')
const CalcType = require('../calc-type')

const CalcFunctions = {
  'f:limit': 0x80000005,
  'f:lerp': 0x80000006, 
}

const CalcOperations = {
  '+': CalcType.MATH_ADD,
  '-': CalcType.MATH_SUB,
  '*': CalcType.MATH_MUL,
  '/': CalcType.MATH_DIV,
}

const CalcCommandSizes = {
  [CalcType.READ_VALUE]: 0x04 + 0x08,
  [CalcType.READ_NODE]: 0x04 + 0x04,
  [CalcType.FUNCTION]: 0x04 + 0x04,
  [CalcType.MATH_ADD]: 0x04,
  [CalcType.MATH_SUB]: 0x04,
  [CalcType.MATH_MUL]: 0x04,
  [CalcType.MATH_DIV]: 0x04,
}

function calc({ value }, composer, jsonNodes) {
  const type = DsgoType.CALC

  function decodeCalc(value) {
    if(!isNaN(value)) {
      const command = CalcType.READ_VALUE
      return { command, value }
    }

    if(value.startsWith('@')) {
      const command = CalcType.READ_NODE
      const nodeId = value.slice(1)
      const index = jsonNodes.findIndex(n => n.id === nodeId)
      return { command, value: index }
    }

    if(value.startsWith('f:')) {
      const command = CalcType.FUNCTION
      const functionId = CalcFunctions[value] || Number.parseInt(value.slice(2), 16) // Hex value of function id
      return { command, value: functionId }
    }


    if(CalcOperations[value]) {
      return { command: CalcOperations[value] }
    }

    throw new Error(`Calc command not recognized: "${value}"`)
  }

  const calcBlock = value.map(decodeCalc)
  const size = calcBlock.reduce((sum, { command }) => sum + CalcCommandSizes[command], 0x08)

  composer.align(0x04)
  const ptr = composer.addBlock(size, 'calc', calcBlock)

  return { type, ptr }
}

module.exports = { calc }
