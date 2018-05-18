#! /usr/bin/env node
const fs = require('fs')
const debug = false
const SIZE = 12

// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function decompiler() {
  var endian
  const types = {
    0: ['ptr', Int, Pointer],
    1: ['int', Int],
    2: ['float', Float],
    3: ['string', Int, StrPointer],
    4: ['extra', Int, ExtraPointer],
  }

  function Str(buffer) {
    return (endian === 'LE'
      ? buffer.toString('utf16le')
      : Buffer.from(buffer).swap16().toString('utf16le')
    ).trim()
  }

  function UInt(buffer, offset = 0) {
    return buffer[`readUInt32${endian}`](offset)
  }

  function Int(buffer, offset = 0) {
    return buffer[`readInt32${endian}`](offset)
  }

  function Float(buffer, offset = 0) {
    return buffer[`readFloat${endian}`](offset)
  }

  function Pointer(buffer, index, size) {
    if(!size) return null
    return consume(buffer, index, size)
  }

  function StrPointer(buffer, index, size) {
    const end = index + size * 2 || buffer.length
    const terminator = Math.min(buffer.indexOf('\0', index, 'utf16le'), end)
    return Str(buffer.slice(index, terminator > 0 ? terminator : end))
  }

  function ExtraPointer(buffer, index, size) {
    const leader = buffer.slice(index, index + 4).toString()
    const data = buffer.slice(index, index + size)
    if(['SGO\0', '\0OGS'].includes(leader)) {
      return {
        type: 'SGO',
        data: decompiler()(data),
      }
    } else {
      return {
        type: leader.trim(),
        data: data.toString('base64'),
      }
    }
    return buffer.slice(index, index + size).toString('base64')
  }

  function chomp(data, index) {
    const [type, transform, getPointed] = types[UInt(data, index)] || []
    if(!type) {
      return {
        type: 'unknown',
        value: data.slice(index, index + SIZE).toString('base64'),
      }
    }
    const isPointer = ['ptr', 'string', 'extra'].includes(type)
    const size = UInt(data, index + 4)
    const value = transform(data, index + 8)
    const pointed = getPointed && getPointed(data, index + value, size)

    const payload = {
      type: type,
      value: isPointer ? pointed : pointed || value,
    }
    if(debug) {
      payload.index = index.toString(16)
      if(isPointer) {
        payload.relative = value.toString(16)
        payload.pointer = (index + value).toString(16)
        payload.size = size
      }
    }

    return payload
  }

  function consume(data, index, values) {
    const ret = new Array(values)
    for(var i = 0; i < values; i++) {
      ret[i] = chomp(data, index + i * SIZE)
    }
    return ret
  }

  return function decompile(data) {
    // Header of SGO file is 32 bytes, this is the structure as I know it:
    //
    // HHHH HHHH 0000 0102 CCCC CCCC 0000 0020
    // CCCC CCCC MMMM MMMM 0000 0000 SSSS SSSS
    //
    // Note that 0102 and 0020 will be 0201 and 2000 in little-endian
    // 8 distinct values, each 4 bytes

    // H is the leader describing the file type
    // It can be one of two strings:
    //  Little endian: "SGO\0"
    //  Big Endian:    "\0OGS"
    const leader = data.slice(0, 4).toString()
    endian = leader === 'SGO\0' ? 'LE' : 'BE'
    
    // C is count of variables (not including values in pointed structs)
    // It appears twice for reasons unknown
    const varCount = UInt(data, 8)

    // M is a pointer to an array of tuples (*varname, index)
    const mIndex = UInt(data, 20)

    // S is a pointer to the end of the struct, right after mdata ends
    // We have no particular use for it
    const structEnd = 4 + Int(data, 28)

    // Read C variables from he fixed section, then assign names using the mTable
    const variables = consume(data, 32, varCount)
    for(let i = 0; i < varCount; i++) {
      const index = mIndex + i * 8
      const strIndex = Int(data, index)
      const varIndex = UInt(data, index + 4)
      variables[varIndex].name = StrPointer(data, index + strIndex)
    }

    return {endian, variables}
  }
}

const readFile = process.argv[2]
if(readFile) {
  const buffer = fs.readFileSync(readFile)
  const json = JSON.stringify(decompiler()(buffer), null, 2)
  const writeFile = process.argv[3]
  if(writeFile) {
    fs.writeFileSync(writeFile, json)
  } else {
    console.log(json)
  }
} else {
  process.stdin.on('data', chunk => {
    console.log(JSON.stringify(decompiler()(chunk), null, 2))
  })
}
