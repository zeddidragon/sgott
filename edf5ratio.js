#!/usr/bin/env node
const fs = require('fs')
const dir = __dirname
const backup = `${dir}/EDF5.exe.backup`
const file = `${dir}/EDF5.exe`
const buf = fs.readFileSync(file)
if(!fs.existsSync(backup)) {
  console.log(`Creating backup ${backup}`)
  fs.writeFileSync(backup, buf)
}
const res = process.argv[2] || '21x9'
const [width, height] = res.split(/x|:/).map(n => +n)
const ratio = width / height
console.log({ width, height, ratio })
buf.writeFloatLE(ratio, 0xEE4CC4)
buf.writeInt8(0x42, 0x60B57E)
// buf.writeInt8(0x04, 0x4B24BC)
// buf.writeFloatLE(ratio, 0xEE4B50)
// buf.writeFloatLE(-500, 0xEE5190)
fs.writeFileSync(file, buf)
