// Run this file from root of the project where package.json is
// The path for this file should. relatively, be ./mods/6-easy-mode/6-easy-mode.js

// - Sets online multipliers 1, so enemies are no stronger online than offline
// - Raise the weapon limits online by 12.5 levels
// - Increase armour limits by 100%

const root = '../..'
const { readFile, writeFile, mkdir } = require('fs').promises
const { compilers } = require(root + '/globals')
const compiler = require(root + '/converters/compiler')
const compileSgo = require(root + '/helpers/compile-sgo')

const difficulties = [ // Debug text
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
]

function findMode({ value: nodes }, name) {
  return nodes.find(n => access(n, 0) === name).value
}

function processDefault(row) {
  return accessMap(row, v => v.toFixed(2)).join(' - ')
}

function processMissionScaling(row) {
  const [from, to] = accessMap(row, v => v)
  return `${from} -> ${to}`
}

function processWeaponLevel(row) {
  return accessMap(row, v => (v * 25).toFixed(1)).join(' -> ')
}

function processWeaponDrops(row) {
  const [from, to, spread] = accessMap(row, v => (v * 25).toFixed(1))
  return `${from} -> ${to} (-${spread})`
}

function processEntityScaling(row) {
  const [hp, dmg] = accessMap(row, v => v.toFixed(1))
  return `HP: ${hp}  Dmg: ${dmg}`
}

const rowDefs = [
  { idx: 0, label: 'Mission Scaling', processor: processMissionScaling },
  { idx: 1, label: 'Player Scaling' },
  { idx: 2, label: 'Weapon Drops', processor: processWeaponDrops },
  { idx: 3, label: 'Enemy Scaling', processor: processEntityScaling },
  { idx: 4, label: 'NPC Scaling', processor: processEntityScaling },
  { idx: 5, label: 'Vehicle Scaling', processor: processEntityScaling },
  { idx: 6, label: 'Weapon Limit', processor: processWeaponLevel },
  { idx: 7, label: 'Armor Limit', processor: processMissionScaling },
]

function access(node, ...address) {
  let ret = Array.isArray(node) ? node : node.value
  for(const idx of address) {
    if(ret?.[idx]?.value == null) {
      console.error('About to access invalid address:', node, address, ret, idx)
      throw new Error('Invalid access address')
    }
    ret = ret[idx].value
  }
  return ret
}

function accessMap(node, cb) {
  let arr = Array.isArray(node) ? node : node.value
  return arr.map(v => cb(v.value))
}

function splat(node, values) {
  const arr = Array.isArray(node) ? node : node.value
  for(let i = 0; i < arr.length; i++) {
    arr[i].value = values[i]
  }
}

function splatMap(node, cb) {
  const arr = Array.isArray(node) ? node : node.value
  for(let i = 0; i < arr.length; i++) {
    arr[i].value = cb(arr[i].value)
  }
}

function writeValues(mode, header) {
  console.log(`# ${header}`)
  let i = 0
  for(const difficulty of access(mode, 7)) {
    console.log(`\n=== ${difficulties[i++]} ===`)
    let j = 0
    for(const row of access(difficulty)) {
      const {
        label = '???',
        processor = processDefault,
      } = rowDefs[j++] || {}
      if(!row.value) continue
      console.log(`${label.padEnd(16)}: ${processor(row)}`)
    }
  }
  console.log('\n')
}

async function main() {
  const config  = JSON.parse(await readFile(`data/6/config.json`))
  const modes = config.variables[0]
  const offline = access(modes, 0)
  const online = findMode(modes, 'GameMode_OnlineScenario')
  const dlc1 = findMode(modes, 'GameMode_Online_MissionPack01')
  const dlc2 = findMode(modes, 'GameMode_Online_MissionPack02')

  // writeValues(offline, 'Offline')
  // writeValues(online, 'Online (Before)')

  for(const mode of [online, dlc1, dlc2]) {
    for(const diff of access(mode, 7)) {
      // Slight changes to player scaling
      // Two players remains as if playing split screen
      // 3-4 players enemies get a bit harder
      splat(access(diff, 1), [1.0, 1.0, 1.2, 1.2])

      // Remove enemy scaling entirely. Remains as if offline.
      splat(access(diff, 3), [1.0, 1.0, 1.0])

      // Increase weapon limits by 12.5, but leave -1 limits untouched
      splatMap(access(diff, 6), v => v > 0 ? v + 0.5 : v)

      // Triple armor limits
      splatMap(access(diff, 7), v => v * 2.0)
    }
  }
  writeValues(online, 'Online (After)')
  writeValues(dlc1, 'DLC1 Online (After)')
  writeValues(dlc2, 'DLC2 Online (After)')

  const outDir = `./release/6-easy-mode/defaultpackage`
  await mkdir(outDir, { recursive: true })

  const compiled = compileSgo(config)

  return writeFile(`${outDir}/config.sgo`, compiled)
}

main()
  .then(() => {
    console.log('Done')
    process.exit(0)
  })

