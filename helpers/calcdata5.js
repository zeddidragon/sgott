import syncFs from 'fs'
import process from 'process'
import getNode from './get-node.js'
import bullets, { assignGame } from './bullets.js'
const fs = syncFs.promises

assignGame(5)

function loadJson(path) {
  return fs.readFile(`data/5/${path}.json`).then(data => JSON.parse(data))
}

const classes = [
  'ranger',
  'winger',
  'fencer',
  'bomber',
]

const categories = {
  ranger: [
    'assault',
    'shotgun',
    'sniper',
    'rocket',
    'missile', 'grenade',
    'special',
    'equipment',
    'tank',
    'heli',
    'bike',
  ],
  winger: [
    'short',
    'laser',
    'electro',
    'particle',
    'sniper',
    'plasma',
    'missile',
    'special',
    'core',
  ],
  fencer: [
    'hammer',
    'spear',
    'shield',
    'light',
    'heavy',
    'missile',
    'booster',
    'protector',
    'muzzle',
    'exo',
  ],
  bomber: [
    null, // Formerly laser guides
    null, // Formerly air strikes
    'support',
    'limpet',
    'deploy',
    'special',
    'tank',
    'ground',
    'heli',
    'mech',
    'artillery',
    'gunship',
    'bomber',
    'missile',
    'satellite',
    null,
    null,
    null,
    null,
    null,
    'robo',
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
  const level = Math.floor(node[4].value * 25)
  const category = node[2].value
  const character = classes[Math.floor(category / 100)]
  const group = categories[character][category % 100]

  const template = await loadJson(`weapon/${id.toUpperCase()}`)
  const wpn = {
    id: id,
    name: getNode(template, 'name.en').value,
    level: level,
    character: character,
    category: group,
    raw: category,
    odds: unlockStates[node[5].value] || (Math.floor(node[3].value * 100)),
  }

  for(const [prop, node] of Object.entries(autoProps)) {
    const value = getNode(template, node).value
    const isArray = Array.isArray(value)
    const isSubArray = isArray && Array.isArray(value[0]?.value)
    if(['custom', 'wCustom'].includes(prop)) {
      wpn[prop] = value
    } else if(isSubArray && value[0].value.length
      || isArray && value.length === 6
    ) {
      const arr = isSubArray ? value[0].value : value
      wpn[prop] = {
        base:  +arr[0].value.toFixed(2),
        algo:  +arr[1].value.toFixed(2),
        lvMin: +arr[2].value.toFixed(2),
        lvMax: +arr[3].value.toFixed(2),
        zero:  +arr[4].value.toFixed(2),
        exp:   +arr[5].value.toFixed(2),
        type: arr[0].type,
      }
    } else if (isArray && value.length === 1){
      wpn[prop] = value[0].value
    } else if (isArray) {
      wpn[prop] = value.map(v => v.value)
    } else if(typeof value === 'number' && !isNaN(value)) {
      wpn[prop] = +value.toFixed(2)
    } else {
      wpn[prop] = value
    }
  }

  if(wpn.energy[0] === -1) wpn.energy = -1
  await bullets[wpn.type]?.(wpn)
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
    'range',
    'reloadInit',
  ]) {
    if(wpn[prop]?.base) {
      wpn[prop].base = +wpn[prop].base.toFixed(1)
    } else if(wpn[prop]) {
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
  delete wpn.custom
  delete wpn.wCustom

  return wpn
}

async function extractWeaponData() {
  const table = await loadJson('weapon/WEAPONTABLE')
  return Promise.all(table.variables[0].value.map(processWeapon))
}

const modes = {
  GameMode_Scenario: {
    name: 'Offline',
    missions: 111,
  },
  GameMode_OnlineScenario: {
    name: 'Online',
    missions: 110,
  },
  GameMode_Offline_MissionPack01: {
    name: 'DLC1',
    missions: 15,
  },
  GameMode_Online_MissionPack01: {
    name: 'DLC1',
    missions: 15,
  },
  GameMode_Offline_MissionPack02: {
    name: 'DLC2',
    missions: 14,
  },
  GameMode_Online_MissionPack02: {
    name: 'DLC2',
    missions: 14,
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
  return Promise.all([
    ...modeList.slice(0, 3),
    modeList[4],
  ].map(processMode))
}

async function extractCalcdata() {
  const [
    weapons,
    modes,
  ] = await Promise.all([
    extractWeaponData(),
    extractModesData('CONFIG'),
  ])
  return {
    weapons,
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
