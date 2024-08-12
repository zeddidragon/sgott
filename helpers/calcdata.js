const json = require('json-stringify-pretty-compact')
const isDebug = process.argv[3] === 'dbg'

function extractCalcdata() {
  const game = process.argv[2]
  return require(`./calcdata-${game}.js`)()
}

extractCalcdata()
  .then(data => {
    if(!isDebug) {
      console.log(json(data, null, 2))
    }
  })
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
