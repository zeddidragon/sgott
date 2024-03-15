const json = require('json-stringify-pretty-compact')

function extractCalcdata() {
  const game = process.argv[2]
  return require(`./calcdata-${game}.js`)()
}

extractCalcdata()
  .then(data => {
    console.log(json(data, null, 2))
  })
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
