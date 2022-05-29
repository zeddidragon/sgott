const recognized = {
  'SGO\0': 'sgo',
  '\0OGS': 'sgo',
  'RMP\0': 'rmp',
  '\0PMR': 'rmp',
  'MAB\0': 'mab',
  '\0BAM': 'mab',
  'BVM\0': 'bvm',
  '\0MVB': 'bvm',
}

function identifyBuffer(buffer) {
  const leader = buffer.slice(0, 4).toString().toUpperCase()
  const match = recognized[leader]
  if(match) return match
  if(leader.replace(/\u0000/g, '').trim()[0] === '{') return 'json'
}

const supported = [
  'sgo',
  'rmp',
]

function decompileBuffer(buffer, size) {
  const type = identifyBuffer(buffer)
  if(size) buffer = buffer.slice(0, size)
  if(supported.includes(type)) {
    return require(`./${type}/decompiler`)(buffer)
  }
  return buffer.toString('base64')
}

function identifyData(obj) {
  if(typeof obj === 'string') return
  if(/^sgo$/i.test(obj.format)) return 'sgo'
  if(obj.variables) return 'sgo'
  if(/^rmp/i.test(obj.format)) return 'rmp'
  if(obj.routes) return 'rmp'
  if(obj.shapes) return 'rmp'
  if(obj.cameras) return 'rmp'
  if(obj.spawns) return 'rmp'
}

function trimBuffer(buf, upTo = 0x10) {
  var end = null
  for(var i = buf.length - upTo; i < buf.length; i++) {
    if(buf[i]) {
      end = null
    } else if(end == null) {
      end = i
    }
  }
  return buf.slice(0x00, end == null ? -1 : end)
}

function compileData(obj) {
  const type = identifyData(obj)
  if(supported.includes(type))  {
    return require(`./${type}/from-json`)(obj)
  }
  return trimBuffer(Buffer.from(obj, 'base64'))
}

module.exports = {
  identifyBuffer,
  decompileBuffer,
  identifyData,
  compileData,
}
