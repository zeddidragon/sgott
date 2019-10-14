const fs = require('fs')
const sgo = require('../sgo/to-json').decompiler
require('util').inspect.defaultOptions.depth = null

// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function compiler(config = {}) {
  var endian

  function Str(buffer, value, offset = 0) {
    return buffer.write(value, offset)
  }

  function UInt(buffer, value, offset = 0) {
    return buffer[`writeUInt32${endian}`](value, offset)
  }

  function Int(buffer, value, offset = 0) {
    return buffer[`writeInt32${endian}`](value, offset)
  }

  function Float(buffer, value, offset = 0) {
    return buffer[`writeFloat${endian}`](value, offset)
  }
  
  function Hex(buffer, value, offset = 0) {
    return buffer.write(value.padStart(8, '0'), offset, 'hex')
  }

  function Unknowns(buffer, obj, offset = 0)  {
    for(const key of Object.keys(obj)) {
      if(!key.startsWith('0x')) continue
      const pos = parseInt(key.slice(2), 16)
      const value = obj[key]
      Hex(buffer, value, offset + pos)
      buffer.write
    }
  }

  return function compile(obj) {
    endian = obj.endian

    var fixedBufferSize = 0
    const header = Buffer.alloc(0x30)
    Unknowns(header, obj)
    Str(header, endian === 'LE' ? 'RMP\0' : '\0PMR', 0x00)

    function addEntry(prop, offset, subHeaderSize = 0x20) {
      Int(header, header.length + fixedBufferSize, offset + 0x04)
      const count = prop && prop.entries.length
      if(!count) return
      UInt(header, 1, offset)
      fixedBufferSize += prop.entries.reduce((size, entry) => {
        return size + subHeaderSize + entry.nodes.length * (0x3C + 0x70 + 0x10)
      }, 0x20)
    }

    addEntry(obj.routes,  0x08)
    addEntry(obj.shapes,  0x10)
    addEntry(obj.cameras, 0x18)
    addEntry(obj.spawns,  0x20)
    const fixedBuffer = Buffer.alloc(fixedBufferSize)

    return Buffer.concat([
      header,
      //fixedBuffer,
    ])
  }
}

function compile(json, opts = {}) {
  const buffer = compiler(opts)(json)
  return buffer
}

function hexview(buffer) {
  return '           0011 2233   4455 6677   8899 aabb   ccdd eeff\n\n' + (
    buffer
      .toString('hex')
      .match(/.{1,8}/g)
      .map(row => row.match(/.{1,4}/g).join(' '))
      .map(row => row.replace(/0000/g, '\x1b[2m0000\x1b[0m'))
      .reduce((acc, v, i) => {
        if(!(i % 4)) acc.push([])
        acc[acc.length - 1].push(v)
        return acc
      }, [])
      .map(row => row.join('   '))
      .map((row, i) => (i * 0x10).toString(16).padStart(8) + '   ' + row)
      .join('\n')
  )
}

const json = JSON.parse(fs.readFileSync('tmp/m190mission.json', 'utf8'))
const result = compile(json)
console.log('\nReconstructed')
console.log(hexview(result))
const buffer = fs.readFileSync('testdata/M190/MISSION.RMPA')
console.log('\nReal')
console.log(hexview(buffer.slice(0, 0x30)))
