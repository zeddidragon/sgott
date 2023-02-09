import syncFs from 'fs'
const fs = syncFs.promises

function getNode(template, name) {
  return template.variables.find(n => n.name === name)
}

function loadJson(path) {
  return fs.readFile(`data/41/${path}.json`).then(data => JSON.parse(data))
}

const cache = {}
function loadLinked(path) {
  const parts = path.split('/').slice(1)
  parts[1] = parts[1]
    .toUpperCase()
    .replace('.SGO', '')
  if(!cache[path]) {
    cache[path] = loadJson(parts.join('/'))
  }
  return cache[path]
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

  wpn.accuracy = +(1 - (wpn.accuracy || 0)).toFixed(4)
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
  if(wpn.odds === 100) {
    delete wpn.odds
  }

  delete wpn.custom
  delete wpn.wCustom
  if(!wpn.range) {
    delete wpn.range
  }

  return wpn
}

function BlankBullet(wpn) {
  // Laser guide kit
  delete wpn.ammo
}

function BombBullet01(wpn) {
  const payload = wpn.custom[6].value
  if(payload === 1) { // Splendor
    wpn.shots = wpn.custom[7].value[2].value
  }
}

function ClusterBullet01(wpn) {
  const shots = wpn.custom[5].value[2].value
  const interval = wpn.custom[5].value[3].value + 1
  wpn.shots = shots
  wpn.duration = shots * interval
  if(wpn.duration < 10) {
    delete wpn.duration
  }
}

function FlameBullet02(wpn) {
  wpn.piercing = true
  if(wpn.custom[3].value) { // Continous damage type flame
    wpn.duration = wpn.range
    wpn.continous = true
  }
}

function GrenadeBullet01(wpn) {
  if(wpn.custom[0].value === 1) {
    wpn.fuse = wpn.range
  }
}

function PileBunkerBullet01(wpn) {
  if(!Array.isArray(wpn.wCustom[0].value)) return
  const attacks = wpn.wCustom[0].value.map(({ value: atk }, i) => {
    const obj = {
      name: 'Combo',
      damage: Math.round(atk[3].value * wpn.damage),
      range: Math.round(atk[5].value * wpn.range * wpn.speed),
    }
    if(wpn.piercing) {
      obj.piercing = wpn.piercing
    }
    if(wpn.burst > 1) {
      obj.count = wpn.burst
    }
    return obj
  })
  wpn.attacks = attacks
  const low = attacks.shift()
  wpn.damage = low.damage
  wpn.range = low.range
  wpn.radius = low.radius
  if(wpn.burst > 1) {
    wpn.count = wpn.burst
    delete wpn.burst
  }
  if(attacks.length) {
    delete wpn.interval
  }
}

function NapalmBullet01(wpn) {
  wpn.duration = wpn.custom[4].value[2].value * 3
}

function SentryGunBullet01(wpn) {
  wpn.shots = wpn.custom[10].value
  wpn.shotInterval = wpn.custom[11].value
}

const subWeaponProps = {
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
  burst: 'FireBurstCount',
  burstRate: 'FireBurstInterval',
  count: 'FireCount',
  interval: 'FireInterval',
  lockRange: 'LockonRange',
  lockTime: 'LockonTime',
  lockType: 'LockonType',
}

async function ShieldBashBullet01(wpn) {
  wpn.defense = Math.round(wpn.wCustom[0].value * 100)
  wpn.range = Math.round(wpn.wCustom[1].value * 360 / Math.PI)
  wpn.energy = +(wpn.wCustom[2].value * 100).toFixed(1)
  delete wpn.damage
  delete wpn.speed
}

// Hammers and Blades
async function ShockWaveBullet01(wpn) {
  wpn.defense = Math.round(wpn.wCustom[2].value * 100) // Defense
  const attacks = wpn.wCustom[3].value.map(({ value: atk }, i) => {
    return {
      name: ['Low', 'Mid', 'Max'][i],
      charge: atk[0].value,
      type: atk[6].value || wpn.type,
      damage: Math.round(atk[3].value * wpn.damage),
      range: Math.round(atk[5].value * wpn.range * wpn.speed),
      radius: Math.round(atk[4].value * 2),
    }
  })
  wpn.attacks = attacks
  const low = attacks.shift()
  wpn.damage = low.damage
  wpn.range = low.range
  wpn.radius = low.radius
}

async function SmokeCandleBullet01(wpn) {
  if(wpn.category === 'raid') return
  delete wpn.damage
  delete wpn.radius
  delete wpn.accuracy
  delete wpn.speed
  delete wpn.range
  const strengthParameters = wpn.custom[4].value[3].value[0].value
  const hpFactor = strengthParameters[0].value
  const dmgFactor = strengthParameters[1].value

  const vehicle = await loadLinked(wpn.custom[4].value[2].value)

  const hp = getNode(vehicle, 'game_object_durability').value
  wpn.hp = Math.floor(hp * hpFactor + 0.001)

  const setup = wpn
    .custom[4]
    .value[3]
    .value[2]
    .value
    .map(v => v.value[0])
    .map(v => v?.value)
    .filter(v => v)

  const setupVegalta = wpn
    .custom[4]
    .value[3]
    .value[4]
    ?.value
    .map(v => v.value[0])
    .map(v => v?.value)
    .filter(v => v)

  const weapons = await Promise.all([
    ...setup,
    ...(setupVegalta || []),
  ].map(loadLinked))
  wpn.weapons = weapons.map(template => {
    const subWpn = {
      name: getNode(template, 'name').value[1].value,
    }
    for(const [prop, node] of Object.entries(subWeaponProps)) {
      const v = getNode(template, node).value
      if(v) {
        subWpn[prop] = v
      }
    }

    subWpn.damage *= dmgFactor
    subWpn.range *= subWpn.speed
    subWpn.accuracy = +(1 - (subWpn.accuracy || 0)).toFixed(4)
    if(subWpn.type === 'FlameBullet02') {
      subWpn.piercing = true
    }
    for(const prop of [
      'damage',
      'speed',
      'range',
    ]) {
      if(subWpn[prop]) {
        subWpn[prop] = +subWpn[prop].toFixed(1)
      }
    }
    return subWpn
  })
}

function SupportUnitBullet01(wpn) {
  wpn.supportType = [
    'life',
    'plasma',
    'guard',
    'power',
  ][wpn.custom[0].value]
}

const bullets = {
  undefined: BlankBullet,
  BombBullet01,
  BombBullet02: BombBullet01,
  ClusterBullet01,
  FlameBullet02,
  GrenadeBullet01,
  PileBunkerBullet01,
  NapalmBullet01,
  SentryGunBullet01,
  ShieldBashBullet01,
  ShockWaveBullet01,
  SmokeCandleBullet01,
  SupportUnitBullet01,
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
            return -1
          }
        }) : -1,
        armorLimits: d[7].value ? d[7].value.map(v => v.value) : -1,
      }
    }),
  }
  return obj
}
 
async function extractModesData() {
  const table = await loadJson('CONFIG')
  return Promise.all(table.variables[0].value.slice(0, 2).map(processMode))
}

async function extractCalcdata() {
  const [
    weapons,
    modes,
  ] = await Promise.all([
    extractWeaponData(),
    extractModesData(),
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
