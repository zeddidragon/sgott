const fs = require('fs')
const { exec } = require('child_process')

//const from = './sgos/data5/WEAPON'
//const to = './data/5/weapons'

const from = './sgos/data5/DEFAULTPACKAGE'
const to = './data/5'
const files = fs.readdirSync(from)

const sgoRegex = /\.SGO$/
async function convert() {
  for(const file of files) {
    if(!sgoRegex.test(file)) continue
    const fromFile = `${from}/${file}`
    const toFile = `${to}/${file.replace(sgoRegex, '.json').toLowerCase()}`
    await exec(`node sgott.js ${fromFile} ${toFile}`)
  }
}

convert()
