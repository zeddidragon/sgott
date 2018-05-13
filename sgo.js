#! /usr/bin/env node
var remainder
var endian

const print = process.stdout.write
const visited = new Set()

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

function StrPointer(buffer, index, size) {
  return Str(buffer.slice(index, index + size * 2))
}

const chomp = {
  header: (state, data, index) => {
    const header = Str(data.slice(index, index + 8))
    endian = header === 'SGO' ? 'LE' : 'BE'
    console.log(`${header} (${endian})`)
    console.log(`=============================================================`)
    state.mode = 'structHeader'
    return index + 12
  },
  structHeader: (state, data, index) => {
    endIndex = UInt(data.slice(index + 16, index + 32))
    state.mode = 'values'
    return index + 32
  },
  values: (state, data, index, depth) => {
    if(visited.has(index)) return index + 12
    visited.add(index)
    const slice = data.slice(index, index + 4)
    const [type, transform, getPointed, renderPointed] = types[UInt(slice)] || []
    if(!type) {
      console.error(`Type not found: `, slice)
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
    return end
  },
  varnames: (state, data, index) => {
    const end = data.indexOf('\0\0', index + 1)
    if(end < 0) {
      state.mode = 'done'
      return
    }
    if(visited.has(index)) return end + 2
    const label = Str(data.slice(index, end + 2))
    if(label.length > 6) console.log([
      '  ',
      index.toString(16).padStart(4),
      label,
    ].join('  '))
    return end + 2
  },
}

function consume(state, data, index = 0, values) {
  size = data.length
  var consumed = 0
  while(state.mode !== 'done' && (values == null || (consumed < values))) {
    if(index >= size) return
    if(consumed >= values) return
    index = chomp[state.mode](state, data, index)
    if(state.mode === 'values' && index >= endIndex) state.mode = 'varnames'
    consumed++
  }
}

process.stdin.on('data', chunk => {
  consume({mode: 'header', depth: 0}, chunk)
})
