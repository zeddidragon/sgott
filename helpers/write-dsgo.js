const compileDsgo = require(root + '/converts/dsgo/from-json')
const compiler = require(root + '/converters/compiler')

function jsonToDsgo(obj) {
  return compileDsgo(compiler)
}
