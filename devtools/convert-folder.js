const fs = require('fs')
const { exec } = require('child_process')

//const from = './sgos/data5/WEAPON'
//const to = './data/5/weapons'

const conversions = {
  6: [{
    from: './sgos/data6/DEFAULTPACKAGE',
    to: './data/6/DefaultPackage',
  }, {
    from: './sgos/data6/OBJECT',
    to: './data/6/Object',
  }, {
    from: './sgos/data6/MISSION',
    to: './data/6/Mission',
  }, {
    from: './sgos/data6/WEAPON',
    to: './data/6/weapon',
  }],
}

const sgoRegex = /\.SGO$/
async function convert(from, to) {
  const files = fs.readdirSync(from)
  for(const file of files) {
    if(!sgoRegex.test(file)) continue
    const fromFile = `${from}/${file}`
    const toFile = `${to}/${file.replace(sgoRegex, '.json')}`
    console.log(fromFile, '=>', toFile)
    await exec(`node sgott.js ${fromFile} ${toFile}`)
  }
}

for(const { from, to } of conversions[process.argv[2]]) {
  convert(from, to)
}
