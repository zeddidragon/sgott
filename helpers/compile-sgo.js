const compileSgo = require('../converters/sgo/from-json')
const compiler = require('../converters/compiler')

function jsonToDsgo(obj) {
  return compileSgo(compiler, obj)
}

module.exports = jsonToDsgo
