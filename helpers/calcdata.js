const json = require('json-stringify-pretty-compact')
const isDebug = process.argv[3] === 'dbg'

const game = process.argv[2]
function extractCalcdata() {
  return require(`./calcdata-${game}.js`)()
}

extractCalcdata()
  .then(data => {
    if(!isDebug) {
        require('fs').writeFileSync(`weapons-${game}.json`, json(data))
    }
  })
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
