const sgoToJson = require('./converters/sgo/to-json.js')
const dsgoToJson = require('./converters/dsgo/to-json.js')
const rmpToJson = require('./converters/rmp/to-json.js')
const jsonToSgo = require('./converters/sgo/from-json.js')
const jsonToDsgo = require('./converters/dsgo/from-json.js')
const jsonToRmp = require('./converters/rmp/from-json.js')

module.exports = {
  compilers: {
    dsgo: jsonToDsgo,
    sgo: jsonToSgo,
    rmp: jsonToRmp,
  },
  decompilers: {
    dsgo: dsgoToJson,
    sgo: sgoToJson,
    rmp: rmpToJson,
  },
}
