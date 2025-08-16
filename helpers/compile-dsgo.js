const compileDsgo = require('../converters/dsgo/from-json')
const compiler = require('../converters/compiler')

function jsonToDsgo(obj) {
  return compileDsgo(compiler, obj)
}

module.exports = jsonToDsgo
