const syncFs = require('fs')
const process = require('process')
const getNode = require('./get-node.js')
const bullets = require('./bullets.js')
const fs = syncFs.promises

bullets.assignGame(3)

function loadJson(path) {
  return fs.readFile(`data/3/${path}.json`).then(data => JSON.parse(data))
}

const classes = [
  'ranger',
]

const categories = {
  ranger: [
    'assault',
    'shotgun',
    'sniper',
    'rocket',
    'missile',
    'grenade',
    'special',
  ],
}

const unlockStates = [
  '',
  'starter',
  'dlc',
  'dlc',
]

const autoProps = {
  type: 'AmmoClass',
  ammo: 'AmmoCount',
  damage: 'AmmoDamage',
  speed: 'AmmoSpeed',
  accuracy: 'FireAccuracy',
  radius: 'AmmoExplosion',
  energy: 'EnergyDrain',
  life: 'AmmoAlive',
  burst: 'FireBurstCount',
  burstRate: 'FireBurstInterval', count: 'FireCount',
  interval: 'FireInterval',
  reload: 'ReloadTime',
  secondary: 'SecondaryFire_Type',
  zoom: 'SecondaryFire_Parameter',
  custom: 'Ammo_CustomParameter',
}

const modes = [{
  name: 'ON',
  missions: 60,
  difficulties: [{
    name: 'Normal',
    weaponLimits: [
      1,
      25
    ],
    armorLimits: [
      400,
      1500,
    ]
  }, {
    name: 'Hard',
    weaponLimits: [
      25,
      50,
    ],
    armorLimits: [
      1500,
      3000,
    ]
  }, {
    name: 'Hardest',
    weaponLimits: [
      50,
      75,
    ],
    armorLimits: [
      3000,
      4000,
    ]
  }, {
    name: 'Inferno',
    weaponLimits: [
      75,
      100,
      null,
      null
    ],
    armorLimits: null
  }],
}]


async function processWeapon({ value: node }, character) {
  const id = node[0].value
  const lvBuffer = new Buffer(4)
  lvBuffer.writeFloatLE(node[3].value * 25)
  const level = Math.floor(lvBuffer.readFloatLE())
  const category = node[1].value
  const group = categories[character][category]

  const template = await loadJson(`weapon/${id}`)
  const name = getNode(template, 'name').value
  const wpn = {
    id: id,
    names: { en: name },
    level: level,
    character: character,
    category: group,
    odds: (Math.floor(node[2].value * 100)),
  }

  for(const [prop, node] of Object.entries(autoProps)) {
    const v = getNode(template, node)?.value
    if(v) {
      wpn[prop] = v
    }
  }

  wpn.accuracy = +(wpn.accuracy || 0).toFixed(4)
  await bullets[wpn.type]?.(wpn)
  groups[group]?.(wpn)

  for(const prop of [
    'burst',
    'count',
  ]) {
    if(wpn[prop] === 1) {
      delete wpn[prop]
    }
  }
  for(const prop of [
    'damage',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = +wpn[prop].toFixed(1)
    }
  }
  for(const prop of [
    'speed',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = +wpn[prop].toFixed(3)
    }
  }

  delete wpn.custom
  delete wpn.wCustom

  return wpn
}

const groups = {
  guide: wpn => {
    wpn.lockTime = +wpn.custom[0].value.toFixed(1)
    wpn.lockRange = +wpn.custom[1].value.toFixed(1)
  },
  support: wpn => {
    wpn.duration = wpn.life
  },
}

async function extractWeaponData(character) {
  const path = 'weapon/WeaponTable'
  const table = await loadJson(path)
  return Promise.all(table.variables[0].value
    .map(v => processWeapon(v, character)))
}
const difficulties = [
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
]
async function processMode({ value: mode }) {
  const key = mode[0].value
  const lvBuffer = Buffer.alloc(4)
  const obj = {
    ...modes[key],
    difficulties: mode[6].value.map(({ value: d }, i) => {
      const { missions } = modes[key]
      const dropsLow = Array(missions)
      const dropsHigh = Array(missions)
      const [start, end] = d[2].value.slice(0, 2).map(v => v.value)
      const spread = d[2].value[2].value
      const range = end - start
      for(let i = 0; i < missions; i++) {
        const pivot = start + (range / (missions - 1)) * i
        lvBuffer.writeFloatLE(pivot - spread)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsLow[i] = Math.floor(lvBuffer.readFloatLE())
        lvBuffer.writeFloatLE(pivot)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsHigh[i] = Math.ceil(lvBuffer.readFloatLE())
      }
      return {
        name: difficulties[i],
        progressScaling: d[0].value.map(v => v.value),
        playerScaling: d[1].value.map(v => +v.value.toFixed(2)),
        drops: d[2].value.slice(0, 2).map(v => +(v.value * 25).toFixed(2)),
        dropSpread: +(d[2].value[2].value * 25).toFixed(2),
        dropsLow,
        dropsHigh,
        weaponLimits: d[6].value ? d[6].value.map(v => {
          if(v.value >= 0) {
            return +(v.value * 25).toFixed(2)
          } else {
            return null
          }
        }) : -1,
        armorLimits: d[7].value ? d[7].value.map(v => v.value) : null,
      }
    }),
  }
  return obj
}
 
async function extractModesData(config) {
  const table = await loadJson(config)
  const modeList = table.variables.find(v => v.name === 'ModeList').value
  return Promise.all(modeList.slice(0, 2).map(processMode))
}

async function extractCalcdata() {
  const [
    weapons,
    pWeapons,
  ] = await Promise.all([
    extractWeaponData('ranger'),
  ])
  return {
    langs: ['en'],
    classes,
    charLabels: [
      'Storm',
    ],
    weapons: [
      ...weapons,
    ],
    modes,
  }
}

extractCalcdata()
  .then(data => {
    console.log(JSON.stringify(data, null, 2))
  })
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
