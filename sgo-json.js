#! /usr/bin/env node
const fs = require('fs')
const debug = false
var remainder
var endian

const types = {
  0: ['ptr', UInt, Pointer],
  1: ['int', Int],
  2: ['float', Float],
  3: ['string', UInt, StrPointer],
}

function Str(buffer) {
  return buffer.toString().replace(/\0/g, '')
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

function Pointer(buffer, index, size) {
  if(!size) return null
  return consume({mode: 'values'}, buffer, index, size).variables
}

function StrPointer(buffer, index, size) {
  visited.add(index)
  return Str(buffer.slice(index, index + size * 2))
}

const chomp = {
  header: (state, data, index) => {
    const header = Str(data.slice(index, index + 4))
    endian = header === 'SGO' ? 'LE' : 'BE'

    state.structValues = UInt(data.slice(index + 8, index + 12))
    state.structEnd = index + 4 + UInt(data.slice(index + 28, index + 32))

    // m is for 'mystery', but let's pretend 'metadata'
    const mIndex = UInt(data.slice(index + 20, index + 24))
    state.mdata = data.slice(mIndex, state.structEnd).toString('base64')

    state.mode = 'values'
    return index + 32
  },
  values: (state, data, index) => {
    state.consumed++
    const slice = data.slice(index, index + 4)
    const [type, transform, getPointed] = types[UInt(slice)] || []
    if(!type) {
      state.variables.push({
        type: 'unknown',
        value: slice.toString('base64'),
      })
      return index + 12
    }
    const isPointer = type === 'ptr'
    const size = UInt(data.slice(index + 4, index + 8))
    const valueSize = 4
    const end = index + 8 + valueSize
    const valueChunk = data.slice(index + 8, end)
    const value = transform(data.slice(index + 8, end))
    const pointed = getPointed && getPointed(data, index + value, size)

    const payload = {
      type: type,
      value: isPointer ? pointed : pointed || value,
    }
    if(debug) {
      payload.index = index.toString(16)
      if(pointed) payload.pointer = (index + value).toString(16)
    }

    state.variables.push(payload)

    if(state.consumed >= state.structValues) {
      state.mode = 'mabHeader'
      return state.structEnd
    }
    return end
  },
  mabHeader: (state, data ,index) => {
    const header = Str(data.slice(index, index + 4))
    state.mode = 'varnames'
    state.consumed = 0
    if(header !== 'MAB') return index

    // Horrible hack, just jump to what we know is the first variable name
    const varnames = data.indexOf('\0A\0i\0m\0A\0n\0i\0m\0a\0t\0i\0o\0n', index)
    if(!~varnames) throw new Error('AimAnimation not found!')
    state.mab = data.slice(index, varnames).toString('base64')
    return varnames
  },
  varnames: (state, data, index) => {
    const end = data.indexOf('\0\0', index + 1)
    if(visited.has(index)) return end + 2
    if(end < 0) {
      state.mode = 'done'
      return
    }
    const label = Str(data.slice(index, end))
    if(label.length > 3) {
      state.variables[state.consumed].name = label
      state.consumed++
    }
    if(state.consumed >= state.structValues) state.mode = 'done'
    return end + 2
  },
}

function consume(state, data, index = 0, values) {
  size = data.length
  state.consumed = 0
  state.variables = []
  while(state.mode !== 'done' && (values == null || (state.consumed < values))) {
    if(index >= size) return state
    if(state.consumed >= values) return state
    index = chomp[state.mode](state, data, index)
  }
  return state
}

function toJSON(data) {
  const {variables, mab, mdata} = data
  return JSON.stringify({endian, variables, mdata, mab}, null, 2)
}

const readFile = process.argv[2]
if(readFile) {
  const buffer = fs.readFileSync(readFile)
  const json = toJSON(consume({mode: 'header'}, buffer))
  const writeFile = process.argv[3]
  if(writeFile) {
    fs.writeFileSync(writeFile, json)
  } else {
    console.log(json)
  }
} else {
  process.stdin.on('data', chunk => {
    console.log(toJSON(consume({mode: 'header'}, chunk)))
  })
}
