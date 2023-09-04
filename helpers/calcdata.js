const syncFs = require('fs')
const process = require('process')
const getNode = require('./get-node.js')
const bullets = require('./bullets.js')
const fs = syncFs.promises

bullets.assignGame(41)

function loadJson(path) {
  return fs.readFile(`data/41/${path}.json`).then(data => JSON.parse(data))
}

const classes = [
  'ranger',
  'winger',
  'fencer',
  'bomber',
]

const categories = [
  'assault',
  'shotgun',
  'sniper',
  'rocket',
  'missile',
  'grenade',
  'special',
  null,
  null,
  null,
  'short',
  'laser',
  'electro',
  'particle',
  'sniper',
  'plasma',
  'missile',
  'special',
  null,
  null,
  'hammer',
  'spear',
  'shield',
  'light',
  'heavy',
  'missile',
  null,
  null,
  null,
  null,
  'guide',
  'raid',
  'support',
  'limpet',
  'deploy',
  'special',
  'tank',
  'ground',
  'heli',
  'mech',
]

const unlockStates = [
  '',
  'starter',
  'dlc',
  'dlc',
]

const autoProps = {
  type: 'AmmoClass',
  ammo: 'AmmoCount',
  weapon: 'xgs_scene_object_class',
  damage: 'AmmoDamage',
  speed: 'AmmoSpeed',
  accuracy: 'FireAccuracy',
  radius: 'AmmoExplosion',
  gravity: 'AmmoGravityFactor',
  piercing: 'AmmoIsPenetration',
  energy: 'EnergyChargeRequire',
  life: 'AmmoAlive',
  burst: 'FireBurstCount',
  burstRate: 'FireBurstInterval',
  count: 'FireCount',
  interval: 'FireInterval',
  lockRange: 'LockonRange',
  lockTime: 'LockonTime',
  lockType: 'LockonType',
  lockDist: 'Lockon_DistributionType',
  reload: 'ReloadTime',
  credits: 'ReloadType',
  secondary: 'SecondaryFire_Type',
  zoom: 'SecondaryFire_Parameter',
  underground: 'use_underground',
  custom: 'Ammo_CustomParameter',
  wCustom: 'custom_parameter',
}

async function processWeapon({ value: node }) {
  const id = node[0].value
  const lvBuffer = new Buffer(4)
  lvBuffer.writeFloatLE(node[4].value * 25)
  const level = Math.floor(lvBuffer.readFloatLE())
  const category = node[2].value
  const character = classes[Math.floor(category / 10)]
  const group = categories[category]

  const template = await loadJson(`weapon/${id.toUpperCase()}`)
  const names = getNode(template, 'name').value
  const [jp, en] = names.map(v => v.value)
  const wpn = {
    id: id,
    names: { jp, en },
    level: level,
    character: character,
    category: group,
    odds: unlockStates[node[5].value] || (Math.floor(node[3].value * 100)),
  }

  for(const [prop, node] of Object.entries(autoProps)) {
    const v = getNode(template, node).value
    if(v) {
      wpn[prop] = v
    }
  }

  wpn.accuracy = +(wpn.accuracy || 0).toFixed(4)
  await bullets[wpn.type]?.(wpn)
  groups[group]?.(wpn)

  for(const prop of [
    'piercing',
    'credits',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = true
    } else {
      delete wpn[prop]
    }
  }
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
    'speed',
    'reloadInit',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = +wpn[prop].toFixed(1)
    }
  }
  if(!wpn.underground) {
    wpn.underground = 'blocked'
  } else {
    delete wpn.underground
  }
  if(wpn.energy < 0) {
    delete wpn.energy
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

async function extractWeaponData() {
  const table = await loadJson('weapon/_WEAPONTABLE')
  return Promise.all(table.variables[0].value.map(processWeapon))
}

const modes = {
  GameMode_Scenario: {
    name: 'OFF',
    missions: 89,
  },
  GameMode_OnlineScenario: {
    name: 'ON',
    missions: 98,
  },
  GameMode_Versus: {
    name: 'Versus',
  },
  MissionPack01_ScenarioMode: {
    name: 'DLC1',
    missions: 26,
  },
  MissionPack01_OnlineScenarioMode: {
    name: 'DLC1',
    missions: 26,
  },
  MissionPack02_ScenarioMode: {
    name: 'DLC2',
    missions: 23,
  },
  MissionPack02_OnlineScenarioMode: {
    name: 'DLC2',
    missions: 23,
  },
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
    modes,
    dlc1,
    dlc2,
  ] = await Promise.all([
    extractWeaponData(),
    extractModesData('CONFIG'),
    extractModesData('PACKAGE1'),
    extractModesData('PACKAGE2'),
  ])
  return {
    weapons,
    modes: [
      ...modes,
      dlc1[1],
      dlc2[1],
    ],
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
