import syncFs from 'fs'
import process from 'process'
import bullets, { assignGame } from './bullets.js'
const fs = syncFs.promises

assignGame(41)

function getNode(template, name) {
  return template.variables.find(n => n.name === name)
}

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
  range: 'AmmoAlive',
  radius: 'AmmoExplosion',
  gravity: 'AmmoGravityFactor',
  piercing: 'AmmoIsPenetration',
  energy: 'EnergyChargeRequire',
  burst: 'FireBurstCount',
  burstRate: 'FireBurstInterval',
  count: 'FireCount',
  interval: 'FireInterval',
  lockRange: 'LockonRange',
  lockTime: 'LockonTime',
  lockType: 'LockonType',
  lockDist: 'Lockon_DistributionType',
  reload: 'ReloadTime',
  reloadInit: 'ReloadInit',
  credits: 'ReloadType',
  secondary: 'SecondaryFire_Type',
  zoom: 'SecondaryFire_Parameter',
  underground: 'use_underground',
  custom: 'Ammo_CustomParameter',
  wCustom: 'custom_parameter',
}

const strikes = [
  'shelling',
  'satellite',
  'bomber',
]

async function processWeapon({ value: node }) {
  const id = node[0].value
  const level = Math.max(0, Math.floor(node[4].value * 25 + 0.0001))
  const category = node[2].value
  const character = classes[Math.floor(category / 10)]
  const group = categories[category]

  const template = await loadJson(`weapon/${id.toUpperCase()}`)
  const wpn = {
    id: id,
    name: getNode(template, 'name').value[1].value,
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
  if(wpn.range && wpn.speed) {
    wpn.range *= wpn.speed
  }

  for(const prop of [
    'piercing',
    'credits',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = true
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
    'range',
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
  if(!wpn.range) {
    delete wpn.range
  }

  return wpn
}

const groups = {
  guide: wpn => {
    wpn.guideSpeed = +wpn.custom[0].value.toFixed(1)
    wpn.guideRange = +wpn.custom[1].value.toFixed(1)
  },
  support: wpn => {
    wpn.duration = wpn.range
  },
  raid: wpn => {
    let type = strikes[wpn.custom[3].value]
    if(wpn.name === 'Rule of God') {
      type = 'rog'
      delete wpn.radius
      wpn.count = 2
    }
    if(wpn.name === 'Laguna Blaster') {
      delete wpn.radius
    }

    wpn.strikeType = type

    const strike = wpn.custom[4].value
    switch(type) {
    case 'rog':
      break
    case 'bomber':
      wpn.units = strike[1].value
      wpn.shots = strike[10].value[2].value
      break
    default: // Shelling
      wpn.shots = strike[2].value
    }
  },
}

async function extractWeaponData() {
  const table = await loadJson('weapon/_WEAPONTABLE')
  return Promise.all(table.variables[0].value.map(processWeapon))
}

const modes = {
  GameMode_Scenario: {
    name: 'Offline',
    missions: 89,
  },
  GameMode_OnlineScenario: {
    name: 'Online',
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
  const obj = {
    ...modes[key],
    difficulties: mode[6].value.map(({ value: d }, i) => {
      return {
        name: difficulties[i],
        progressScaling: d[0].value.map(v => v.value),
        playerScaling: d[1].value.map(v => +v.value.toFixed(2)),
        drops: d[2].value.slice(0, 2).map(v => +(v.value * 25).toFixed(2)),
        dropSpread: +(d[2].value[2].value * 25).toFixed(2),
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
