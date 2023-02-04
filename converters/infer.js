import decompileSgo from './sgo/to-json.js'
import decompileRmp from './rmp/to-json.js'
import compileSgo from './sgo/from-json.js'
import compileRmp from './rmp/from-json.js'

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

export function identifyBuffer(buffer) {
  const leader = buffer.slice(0, 4).toString().toUpperCase()
  const match = recognized[leader]
  if(match) return match
  if(leader.replace(/\u0000/g, '').trim()[0] === '{') return 'json'
}

const supported = [
  'sgo',
  'rmp',
]

export function decompileBuffer(buffer, size) {
  const type = identifyBuffer(buffer)
  if(size) buffer = buffer.slice(0, size)
  if(supported.includes(type)) {
    return ({
      sgo: decompileSgo,
      rmp: decompileRmp,
    })(buffer)
  }
  return buffer.toString('base64')
}

export function identifyData(obj) {
  if(typeof obj === 'string') return
  if(/^sgo$/i.test(obj.format)) return 'sgo'
  if(obj.variables) return 'sgo'
  if(/^rmp/i.test(obj.format)) return 'rmp'
  if(obj.routes) return 'rmp'
  if(obj.shapes) return 'rmp'
  if(obj.cameras) return 'rmp'
  if(obj.spawns) return 'rmp'
}

export function compileData(obj) {
  const type = identifyData(obj)
  if(supported.includes(type))  {
    return ({
      sgo: compileSgo,
      rmp: compileRmp,
    })[type](obj)
  }
  return Buffer.from(obj, 'base64')
}

export default {
  identifyBuffer,
  decompileBuffer,
  identifyData,
  compileData,
}
