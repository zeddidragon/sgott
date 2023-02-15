import syncFs from 'fs'
import getNode from './get-node.js'
const fs = syncFs.promises

let game

export function assignGame(g) {
  game = g
}

function loadJson(path) {
  return fs.readFile(`data/${game}/${path}.json`).then(data => JSON.parse(data))
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

function BlankBullet(wpn) {
  if(raidCategories.includes(wpn.category)) {
    return AirRaids(wpn)
  }
  if(wpn.weapon === 'Weapon_Accessory') {
    return Support(wpn)
  }
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
  const isContinous = wpn.custom[0].value || wpn.custom[3].value
  if(isContinous) { // Continous damage type flame
    wpn.duration = wpn.life
    wpn.continous = true
  }
  if(!wpn.interval) {
    wpn.interval = 1
  }
}

function GrenadeBullet01(wpn) {
  if(wpn.custom[0].value === 1) {
    wpn.fuse = wpn.life
  }
}

function PileBunkerBullet01(wpn) {
  if(!Array.isArray(wpn.wCustom[0].value)) return
  const attacks = wpn.wCustom[0].value.map(({ value: atk }) => {
    const obj = {
      name: 'Combo',
      damage: +atk[2].value.toFixed(2),
      speed: +atk[4].value.toFixed(2),
      swing: +atk[1].value.toFixed(2),
    }
    return obj
  })
  wpn.attacks = attacks
  if(wpn.burst > 1) {
    wpn.count = wpn.burst
    delete wpn.burst
  }
  if(attacks.length > 1) {
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
  life: 'AmmoAlive',
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

function ShieldBashBullet01(wpn) {
  wpn.defense = Math.round(wpn.wCustom[0].value * 100)
  wpn.range = Math.round(wpn.wCustom[1].value * 360 / Math.PI)
  wpn.energy = +(wpn.wCustom[2].value * 100).toFixed(1)
  delete wpn.damage
  delete wpn.speed
}

// Hammers and Blades
function ShockWaveBullet01(wpn) {
  wpn.defense = Math.round(wpn.wCustom[2].value * 100) // Defense
  const attacks = wpn.wCustom[3].value.map(({ value: atk }, i) => {
    return {
      name: ['Low', 'Mid', 'Max'][i],
      charge: atk[0].value,
      type: atk[6].value || wpn.type,
      damage: +atk[3].value.toFixed(2),
      speed: +atk[5].value.toFixed(2),
      radius: Math.round(atk[4].value * 2),
    }
  })
  wpn.attacks = attacks
}

const raidCategories = [
  'raid',
  'planes',
  'artillery',
  'gunship',
  'bomber',
  'missile',
  'satellite',
]

const strikes = [
  'shelling',
  'satellite',
  'bomber',
]
async function AirRaids(wpn) {
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
  let strike = wpn.custom[4]?.value

  if(wpn.weapon === 'Weapon_RadioContact') {
    type = 'bomber'
    strike = wpn.custom[2].value
  }

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
}

const SupportProps = {
  // Ranger
  0: (wpn, v) => { wpn.allyRecovery = +v.toFixed(2) },
  1: (wpn, v) => { wpn.itemRange = +v.toFixed(2) },
  2: (wpn, v) => { wpn.hitSlowdown = +v.toFixed(2) },
  15: (wpn, v) => { wpn.walkSpeed = +v.toFixed(2) },
  14: (wpn, v) => { wpn.isKnockImmune = !!v },
  100: (wpn, v) => { wpn.sprintSpeed = +v.toFixed(2) },
  101: (wpn, v) => { wpn.sprintSwirl = +v.toFixed(2) },
  102: (wpn, v) => { wpn.sprintAcceleration = +v.toFixed(2) },
  103: (wpn, v) => { wpn.sprintDestruction = !!v },
  104: (wpn, v) => { wpn.sprintHitSlowdown = +v.toFixed(2) },
  12: (wpn, v) => { wpn.isMultiLock = !!v },
  13: (wpn, v) => { wpn.lockTime = +v.toFixed(2) },
  16: (wpn, v) => { wpn.lockRange = +v.toFixed(2) },
  // Wing Diver
  200: (wpn, v) => {
    const [side, forward, rear] = v.map(sv => +sv.value.toFixed(2))
    wpn.boostForward = forward
    wpn.boostSide = side
    wpn.boostRear = rear
  },
  201: (wpn, v) => { wpn.boostConsumption = +v.toFixed(2) },
  202: (wpn, v) => { wpn.flightSpeedUp = +v.toFixed(2) },
  205: (wpn, v) => { wpn.flightConsumption = +v.toFixed(2) },
  206: (wpn, v) => { wpn.weaponReload = +v.toFixed(2) },
  208: (wpn, v) => { wpn.chargeSpeed = +v.toFixed(2) },
  209: (wpn, v) => { wpn.emergencyChargeSpeed = +v.toFixed(2) },
  203: (wpn, v) => { wpn.prop203 = +v.toFixed(2) },
  204: (wpn, v) => { wpn.prop204 = +v.toFixed(2) },
  210: (wpn, v) => { wpn.maxAltitude = +v.toFixed(2) },
  // Fencer
  9: (wpn, v) => { wpn.equipRecoil = +v.toFixed(2) },
  10: (wpn, v) => { wpn.equipWeightTurnReduction = +v.toFixed(2) },
  11: (wpn, v) => { wpn.equipWeightMoveReduction = +v.toFixed(2) },
  300: (wpn, v) => { wpn.dashCount = v },
  301: (wpn, v) => { wpn.dashInterval = +v.toFixed(2) },
  302: (wpn, v) => { wpn.boostCount = v },
  305: (wpn, v) => { wpn.boostSpeed = +v.toFixed(2) },
  3: (wpn, v) => { wpn.shieldDurability = +v.toFixed(2) },
  4: (wpn, v) => { wpn.shieldConsumption = +v.toFixed(2) },
  5: (wpn, v) => { wpn.shieldDeflectConsumption = +v.toFixed(2) },
  6: (wpn, v) => { wpn.shieldDamageReduction = +v.toFixed(2) },
  7: (wpn, v) => { wpn.shieldKnockback = +v.toFixed(2) },
  8: (wpn, v) => { wpn.isBarricade = !!v },
  17: (wpn, v) => { wpn.shieldAngle = Math.round(v * 360 / Math.PI) },
  500: (wpn, v) => { wpn.walkSpeed = +v.toFixed(2) },
}

function Support(wpn) {
  if(!wpn.wCustom) {
    return
  }
  for(const { value: props } of wpn.wCustom[0].value) {
    const [{ value: propId }, { value }] = props
    const propFunc = SupportProps[propId]
    if(propFunc) {
      propFunc(wpn, value)
    } else {
      console.log('missing prop', {
        id: wpn.id,
        name: wpn.name,
        propId,
        value,
      })
    }
  }
}

async function SmokeCandleBullet01(wpn) {
  if(raidCategories.includes(wpn.category)) {
    return AirRaids(wpn)
  }
  delete wpn.damage
  delete wpn.radius
  delete wpn.accuracy
  delete wpn.speed
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
    ?.map(v => v.value[0])
    .map(v => v?.value)
    .filter(v => v)

  const setupBikes = wpn
    .custom[4]
    .value[3]
    .value[3]
    ?.value
    .map(v => v.value[0])
    .map(v => v?.value)
    .filter(v => typeof v === 'string' && v.endsWith('.sgo'))

  const setupVegalta = wpn
    .custom[4]
    .value[3]
    .value[4]
    ?.value
    .map(v => v.value[0])
    .map(v => v?.value)
    .filter(v => v)

  const weapons = await Promise.all([
    ...(setup || []),
    ...(setupBikes || []),
    ...(setupVegalta || []),
  ].map(loadLinked))
  wpn.weapons = weapons.map(template => {
    let subWpn
    const nameNode = getNode(template, 'name.en')
      || getNode(template, 'name').value[1]
    subWpn = {
      name: nameNode.value,
    }
    for(const [prop, node] of Object.entries(subWeaponProps)) {
      const v = getNode(template, node).value
      if(v) {
        subWpn[prop] = v
      }
    }

    subWpn.damage *= dmgFactor
    subWpn.accuracy = +(subWpn.accuracy || 0).toFixed(2)
    if(subWpn.type === 'FlameBullet02') {
      subWpn.piercing = true
    }
    for(const prop of [
      'damage',
      'speed',
      'accuracy',
    ]) {
      if(subWpn[prop]) {
        subWpn[prop] = +subWpn[prop].toFixed(2)
      }
    }
    return subWpn
  })

  if(wpn.weapons[wpn.weapons.length - 1]?.name === 'FUEL') {
    const [fuel, usage] = wpn.custom
      .find(n => n.type === 'ptr')
      .value
      .find(n => n.type === 'ptr')
      .value[2]
      .value
      .map(v => v.value)
    wpn.fuel = fuel
    wpn.fuelUsage = +usage.toFixed(2)
    wpn.weapons.pop()
  }
}

async function SmokeCandleBullet02(wpn) {
  return AirRaids(wpn)
}

function SupportUnitBullet01(wpn) {
  wpn.supportType = [
    'life',
    'plasma',
    'guard',
    'power',
  ][wpn.custom[0].value]
}

export default {
  '': BlankBullet,
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
  SmokeCandleBullet02,
  SupportUnitBullet01,
}
