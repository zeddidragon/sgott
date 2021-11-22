const fs = require('fs')
const json = require('json-stringify-pretty-compact')
const table = require('../data/41/weapon/_WEAPONTABLE.json')
const textTable = require('../data/41/weapon/_WEAPONTEXT.json')
const config = require('../data/41/CONFIG.json')
const blurbs = require('../helpers/blurbs')
const getId = require('../helpers/get-id')
const getNode = require('../helpers/get-node')
const patch = require('../helpers/patch')

const rawSgos = new Map()
const seconds = 60

const modded = new Set()

const difficulties = getNode(config, 'ModeList')
  .value[0] // Offline mode, arbitrarily
  .value[6] // Difficulty list
  .value
  .slice(1) // Strip Easy from the equation
  .map(node => node.value[0].value.map(n => n.value / 10))

function replaceText(textNode, pattern, replacement) {
  textNode.value[3].value = textNode.value[3].value.replace(pattern, replacement)
}

function pretty(v) {
  if(v < 3) return v.toFixed(2)
  if(v < 8) return v.toFixed(1)
  if(v < 20) return Math.ceil(v)
  if(v < 90) return Math.ceil(v / 5) * 5
  if(v < 750) return Math.ceil(v / 10) * 10
  return Math.ceil(v / 50) * 50
}

const blacklistNames = RegExp([
  'Beacon Gun',
  'Laser Guide',
  'Plasma Charger',
  'Plasma Battery',
  'Plasma Streamer',
  'Guard Post',
  'Guard Assist',
  'Power Assist',
  'Power Post',
  'Zone Protector',
  'Offensive Territory',
  'Speed Star',
].join('|'))

const vehicleMap = {}

for(const node of table.variables[0].value) {
  const id = getId(node)
  const path = `./data/41/weapon/${id.toUpperCase()}.json`
  const data = JSON.parse(fs.readFileSync(path))
  const name = getNode(data, 'name').value[1].value
  const category = node.value[2].value
  const unlockState = node.value[5].value
  if(unlockState === 3) continue // Skip DLC weapons
  const shouldSkip = blacklistNames.test(name) || category == 22
  if(shouldSkip) {
    console.log(`Skipping: ${name}`)
    continue
  }
  const level = node.value[4].value
  if(level >= 4) continue

  const rung = difficulties[Math.floor(level)] || [1, 1]
  const factor = (rung[0] + (rung[1] - rung[0]) * (level % 1))

  const isVehicle = category >= 36 && category <= 39
  if(isVehicle) {
    const customParams = getNode(data, 'Ammo_CustomParameter')
    const vehiclePath = customParams
      .value[4]
      .value[2]
      .value
      .replace(/^app:\/Object/, '')
      .toUpperCase()
      .replace(/\.SGO$/, '.json')
      .replace(/^/, 'data/41/weapon')
    console.log(id)
    const vehicleData = vehicleMap[vehiclePath]
      || (vehicleMap[vehicleMap] = JSON.parse(fs.readFileSync(vehiclePath)))
    //console.log(vehicleData)

    const strengthParameters = customParams
      .value[4]
      .value[3]
      .value[0]
      .value
    const oldDamage = strengthParameters[0].value
    const newDamage = oldDamage / factor
    const oldHp = strengthParameters[1].value
    const newHp = oldHp / factor
    strengthParameters[0].value = newHp
    strengthParameters[1].value = newDamage
    console.log(id, getNode(data, 'name').value[1].value.padEnd(48), `${oldHp} => ${newHp}`)
  } else {
    const damageNode = getNode(data, 'AmmoDamage')
    const oldDamage = damageNode.value
    const newDamage = pretty(oldDamage / factor)
    console.log(getNode(data, 'name').value[1].value.padEnd(48), `${oldDamage} => ${newDamage}`)
  }
}

/*
const outDir = './release/squish41/SgottTemplates/weapon'
fs.mkdirSync(outDir, { recursive: true })
for(const [path, template] of rawSgos) {
  const filename = `${outDir}/${path}.json`
  console.log(`Writing ${filename}` )
  fs.writeFileSync(filename, json(template))
}

for(const node of modded) {
  const id = getId(node)
  const path = `../data/41/weapons/${id.toUpperCase()}`
  const template = require(path)
  const text = textTable.variables[0].value[table.variables[0].value.indexOf(node)]
  template.meta = {
    id: id,
    description: text.value[3].value,
  }
  const name = text.value[2]
    .value
    .replace(/\s+/g, '-')
    .replace(/[^0-9a-zA-Z-]/g, '')
  const filename = `${outDir}/_${id}_${name}.json`
  console.log(`Writing ${filename}` )
  fs.writeFileSync(filename, json(template))
}
*/
console.log('Done!')
