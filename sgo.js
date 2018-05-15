#! /usr/bin/env node
var remainder
var endian

const types = {
  0: ['ptr', UInt],
  1: ['int', Int],
  2: ['float', Float],
  3: ['string', UInt, StrPointer, str => str],
}

function Str(buffer) {
  return buffer.toString()
}

function UInt(buffer) {
  return buffer[`readUInt32${endian}`]()
}

function Int(buffer) {
  return buffer[`readInt32${endian}`]()
}

function Float(buffer) {
  return buffer[`readFloat${endian}`]()
}

var visited = new Set()
function StrPointer(buffer, index, size) {
  visited.add(index)
  return Str(buffer.slice(index, index + size * 2))
}

const chomp = {
  header: (state, data, index) => {
    const header = Str(data.slice(index, index + 8))
    endian = header === '\0SGO' ? 'LE' : 'BE'
    console.log(`${header} (${endian})`)
    state.structValues = UInt(data.slice(index + 16, index + 20))
    state.structSize = index + 4 + UInt(data.slice(index + 28, index + 32))
    console.log(`values: ${state.structValues}`)
    console.log(`size: ${state.structSize}`)
    console.log(`=============================================================`)
    state.mode = 'values'
    return index + 32
  },
  values: (state, data, index, depth) => {
    state.consumed++
    const slice = data.slice(index, index + 4)
    const [type, transform, getPointed, renderPointed] = types[UInt(slice)] || []
    if(!type) {
      console.error(index.toString(16), `Type not found: `, data.slice(index, index + 12))
      return index + 12
    }
    const isPointer = ['ptr',' struct'].includes(type)
    if(type === 'struct') return index + 12
    const size = UInt(data.slice(index + 4, index + 8))
    const valueSize = 4
    const end = index + 8 + valueSize
    const valueChunk = data.slice(index + 8, end)
    const value = transform(data.slice(index + 8, end))
    const pointed = getPointed && getPointed(data, index + value, size)
    console.log([
      '  '.repeat(state.depth),
      ('' + state.consumed).padStart(4),
      index.toString(16).padStart(4),
      type.padEnd(5),
      `(${size}b)`.padStart(6),
      (type === 'float' ? value.toFixed(2) : (value + '   ')).padStart(16),
      isPointer && !size && 'NULL',
      isPointer && size && '{',
      pointed && `"${renderPointed(pointed)}"`,
    ]
      .filter(piece => piece)
      .join('  ')
    )
    if(isPointer && size) {
      consume({
        mode: 'values',
        depth: state.depth + 1,
      }, data, index + value, size)
      console.log('  '.repeat(state.depth) + '   }')
    }
    if(state.consumed >= state.structValues) {
      state.mode = 'mabHeader'
      return state.structSize
    }
    return end
  },
  mabHeader: (state, data ,index) => {
    const header = Str(data.slice(index, index + 4))
    state.mode = 'varnames'
    console.log(`=============================================================`)
    if(header !== 'MAB\0') return index
    console.log(header)
    console.log(`=============================================================`)
    // Horrible hack, just jump to what we know is the first variable name
    
    const varnames = data.indexOf('\0A\0i\0m\0A\0n\0i\0m\0a\0t\0i\0o\0n', index)
    if(!~varnames) throw new Error('AimAnimation not found!')
    return varnames
  },
  varnames: (state, data, index) => {
    const end = data.indexOf('\0\0', index + 1)
    if(end < 0) {
      state.mode = 'done'
      return
    }
    const label = Str(data.slice(index, end))
    if(label.length > 6) {
        console.log([
        '  ',
        index.toString(16).padStart(4),
        label,
      ].join('  '))
    } else {
      console.log(data.slice(index, end + 2), Str(data.slice(index, end)))
    }
    return end + 2
  },
}

function consume(state, data, index = 0, values) {
  size = data.length
  state.consumed = 0
  state.variables = []
  while(state.mode !== 'done' && (values == null || (state.consumed < values))) {
    if(index >= size) return
    if(state.consumed >= values) return
    index = chomp[state.mode](state, data, index)
  }
  return state.variables
}

process.stdin.on('data', chunk => {
  consume({mode: 'header', depth: 0}, chunk)
})
