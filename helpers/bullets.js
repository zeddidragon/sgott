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

const raidCategories = [
  'raid',
  'artillery',
  'gunship',
  'bomber',
  'missile',
  'satellite',
]
async function SmokeCandleBullet01(wpn) {
  if(raidCategories.includes(wpn.category)) return
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

function SupportUnitBullet01(wpn) {
  wpn.supportType = [
    'life',
    'plasma',
    'guard',
    'power',
  ][wpn.custom[0].value]
}

export default {
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
