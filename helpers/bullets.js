const syncFs = require('fs')
const getNode = require('./get-node.js')
const fs = syncFs.promises

let game
function assignGame(g) {
  game = g
}

function loadJson(path) {
  return fs.readFile(`data/${game}/${path}.json`).then(data => JSON.parse(data))
}

function digValue(node, path) {
  for(let i = 0; i < path.length; i++) {
    const key = path[i]
    if(typeof key === 'number') {
      node = node[key]
    } else {
      node = node.find(n => n.name === key)
    }
    if(node) {
      node = node.value
    } else {
      return
    }
  }
  return node
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

function BarrierBullet01(wpn) {
  wpn.hp = wpn.damage
  delete wpn.damage
}


function BlankBullet(wpn) {
  if(wpn.weapon === 'Weapon_Drone_LaserMarker') {
    return
  }
  if(raidCategories.includes(wpn.category)) {
    return AirRaids(wpn)
  }
  if(wpn.weapon === 'Weapon_Accessory') {
    return Support(wpn)
  }
  // Laser guide kit
  if(wpn.weapon === 'Weapon_LaserMarker'
    && (wpn.category === 'support' || wpn.category === 'special')) {
    return TargetMarkerBullet01(wpn)
  }
}

function BombBullet01(wpn) {
  const payload = wpn.custom[6].value
  if(payload === 1) { // Splendor
    wpn.shots = wpn.custom[7].value[2].value
  }
}

function ClusterBeamAmmo(wpn) {
  const shots = wpn.custom[0].value
  const interval = wpn.custom[4].value || 1
  wpn.shots = shots
  wpn.duration = shots * interval
  if(wpn.duration < 10) {
    delete wpn.duration
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

function DecoyBullet01(wpn) {
  wpn.hp = wpn.damage
  wpn.duration = wpn.life
  delete wpn.damage
}

// Hand grenade?
function EfsBullet(wpn) {
  if(wpn.weapon === 'Weapon_Swing') { // Power Blade
    delete wpn.interval
    wpn.attacks = wpn.wCustom[0].value.map(({ value: atk }, i) => {
      const obj = {
        name: `Blade ${i + 1}`,
        damage: +atk[2].value.toFixed(2),
        speed: +atk[4].value.toFixed(2),
        swing: +atk[1].value.toFixed(2),
      }
      return obj
    })
  }
  const isFuse = digValue(wpn.custom, [
    'bullet',
    'ext',
    'is_vanish_explosion',
  ])
  if(isFuse) {
    wpn.fuse = wpn.life
  }
}

// Sabers
function EfsExposureBullet(wpn) {
  wpn.drain = wpn.burst
  delete wpn.burst
}

function EfsShieldBullet01(wpn) {
  wpn.duration = wpn.life
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
  const grenadeType = wpn.custom[0].value
  switch(grenadeType) {
    case 1: { // Timed grenade
      wpn.fuse = wpn.life
      break
    }
    case 6: { // Temp Shield
      wpn.supportType = 'shield'
      wpn.duration = wpn.damage * 60
      wpn.defense = Math.round(wpn.custom[6].value * 100)
      delete wpn.damage
      break
    }
    case 9: { // Limit booster
      wpn.supportType = 'booster'
      wpn.duration = wpn.damage * 60
      wpn.damage = Math.round(wpn.custom[6].value * 100) / 100
      break
    }
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

function LaserBullet01(wpn) {
  if([
    'Weapon_ChargeShoot',
    'Weapon_PreChargeShoot',
  ].includes(wpn.weapon)) {
    const curveId = wpn.wCustom[6]?.value
    const curve = wpn.wCustom[4]?.value
    if(curveId & 128) { // Phalanx
      return
    }
    if((curveId & 2) && curve) {
      wpn.ammoDamageCurve = curve
    }
    if((curveId & 16) && curve) {
      wpn.ammoCountCurve = curve
    }

    const curveId2 = wpn.wCustom[8]?.value
    const curve2 = wpn.wCustom[7]?.value
    if(curveId2 & 2 && curve2) {
      wpn.ammoDamageCurve = curve2
    }
  }
}

function MissileAmmo01(wpn) {
  const missileType = wpn.custom[0]?.value
  switch(missileType) {
    case 4: { // Rescue drone
      wpn.revive = Math.round(wpn.damage * 100)
      wpn.supportType = 'rescue'
      delete wpn.damage
      break
    }
    case 2: { // Reverse / Killer drone
      wpn.supportType = 'drone'
      break
    }
  }
}

function NapalmBullet01(wpn) {
  const fireCfg = wpn.custom[4].value
  wpn.duration = fireCfg[2].value * fireCfg[3].value
}

function CentryGun01(wpn) {
  wpn.searchRange = wpn.custom[6].value
  wpn.shots = wpn.custom[12].value
  wpn.shotInterval = wpn.custom[13].value
  wpn.speed = wpn.custom[15].value
  wpn.life = wpn.custom[14].value
  wpn.turnRate = wpn.custom[15].value
}

function SentryGunBullet01(wpn) {
  wpn.shots = wpn.custom[10].value
  wpn.shotInterval = wpn.custom[11].value
  wpn.searchRange = wpn.custom[4].value
  wpn.life = wpn.custom[12].value
  wpn.speed = wpn.custom[13].value
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
  'missile',
  'bomber',
  'satellite',
]
async function AirRaids(wpn) {
  let type = strikes[wpn.custom[3].value]
  const name = wpn.name || wpn.names?.en
  if(name === 'Rule of God') {
    type = 'rog'
    delete wpn.radius
    wpn.count = 2
  }
  if(name === 'Laguna Blaster') {
    delete wpn.radius
  }

  wpn.strikeType = type
  let strike = wpn.custom[4]?.value

  if(type === 'satellite' && strike[4]?.value === 'MissileBullet01') {
    type = 'missile'
  }

  if(wpn.weapon === 'Weapon_RadioContact') {
    type = 'bomber'
    strike = wpn.custom[2].value
  }

  switch(type) {
    case 'rog': {
      break
    }
    case 'missile': {
      wpn.shots = strike[2].value
      wpn.radius = strike[9].value
      break
    }
    case 'bomber': {
      let subMunitions
      if(game === 4) {
        subMunitions = wpn.custom[4].value[10].value
      } else if(game === 41) {
        subMunitions = wpn.custom[4].value[10].value
      } else {
        subMunitions = wpn.custom[2].value[10].value
      }
      const ammoType = subMunitions[4]?.value
      wpn.units = strike[1].value
      wpn.shots = strike[10].value[2].value
      wpn.subRadius = subMunitions[9]?.value
      if(ammoType === 'NapalmBullet01') {
        const fireCfg = subMunitions[13].value[4].value
        wpn.duration = fireCfg[2].value * fireCfg[3].value
      }
      break
    }
    default: { // Shelling
      wpn.shots = strike[2].value
      wpn.shotInterval = strike[3].value
      const isSimultaneousShot = strike[19]?.value
      if(isSimultaneousShot) {
        delete wpn.shotInterval
      }
      wpn.subRadius = strike[9].value
    }
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
  202: (wpn, v) => { wpn.flightSpeedHorizontal = +v.toFixed(2) },
  203: (wpn, v) => { wpn.airControl = +v.toFixed(2) },
  204: (wpn, v) => { wpn.flightSpeedVertical = +v.toFixed(2) },
  205: (wpn, v) => { wpn.flightConsumption = +v.toFixed(2) },
  206: (wpn, v) => { wpn.weaponReload = +v.toFixed(2) },
  208: (wpn, v) => { wpn.chargeSpeed = +v.toFixed(2) },
  209: (wpn, v) => { wpn.emergencyChargeSpeed = +v.toFixed(2) },
  210: (wpn, v) => { wpn.dragFactor = +v.toFixed(2) },
  // Fencer
  9: (wpn, v) => { wpn.equipRecoil = +v.toFixed(2) },
  10: (wpn, v) => { wpn.equipWeightTurnReduction = +v.toFixed(2) },
  11: (wpn, v) => { wpn.equipWeightMoveReduction = +v.toFixed(2) },
  300: (wpn, v) => { wpn.dashCount = v },
  301: (wpn, v) => { wpn.dashInterval = +v.toFixed(2) },
  302: (wpn, v) => { wpn.boostCount = v },
  305: (wpn, v) => { wpn.boostSpeed = +v.toFixed(2) },
  306: (wpn, v) => { wpn.boostToDash = !!v },
  307: (wpn, v) => { wpn.dashToBoost = !!v },
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
  const vehicleType = getNode(vehicle, 'xgs_scene_object_class').value

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
    const subWpn = { names: { ja: null, en: null } }
    const namesNode = getNode(template, 'name')
    if(Array.isArray(namesNode?.value)) {
      const [ja, en] = namesNode.value.map(v => v.value)
      subWpn.names = { ja, en }
    } else if(namesNode?.value) {
      subWpn.name = namesNode.value
    } else {
      const ja = getNode(template, 'name.ja').value
      const en = getNode(template, 'name.en').value
      subWpn.names = { ja, en }
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

  if(wpn.weapons[wpn.weapons.length - 1]?.names?.en === 'FUEL') {
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

  if(vehicleType === 'VehicleRescueTank') {
    const [heal, total] = wpn
      .custom[4]
      .value[3]
      .value[2]
      .value
      .map(v => v.value)
    const buffer = Buffer.alloc(4)
    buffer.writeFloatLE(heal)
    wpn.weapons = [{
      names: {
        ja: '医療機器',
        en: 'Medicinal Equipment',
      },
      total,
      damage: buffer.readFloatLE(),
      interval: 1,
    }]
  }
}

function SmokeCandleBullet02(wpn) {
  return AirRaids(wpn)
}

function SolidAmmo01(wpn) {
  const custom = wpn.custom?.[0]?.value
  // 1: Bounces
  // 2: Pierces
  if(custom === 2) {
    wpn.piercing = true
  }
}

function SolidPelletBullet01(wpn) {
  if(wpn.piercing) {
    wpn.piercingLife = wpn.custom[0].value
  }
}

function StunAmmo01(wpn) {
  wpn.duration = wpn.custom[2].value
}

function SupportUnitBullet01(wpn) {
  wpn.supportType = [
    'life',
    'plasma',
    'guard',
    'power',
  ][wpn.custom[0].value]
  wpn.duration = wpn.life
}

function TargetMarkerBullet01(wpn) {
  wpn.lockTime = +wpn.custom[0].value.toFixed(1)
  wpn.lockRange = +wpn.custom[1].value.toFixed(1)
  if(!wpn.ammo) {
    delete wpn.ammo
  }
}

function Weapon_Drone_MarkerShoot(wpn) {
  const formation = digValue(wpn.wCustom, [ 'drone', 'formation'])
  wpn.units = formation?.length
}

function Weapon_Gatling(wpn) {
  wpn.windup = wpn.wCustom[7].value
  if(wpn.xParams) {
    wpn.windup = {
      ...wpn.xParams,
      base: wpn.windup,
    }
  }
}

function Weapon_Drone(wpn) {
  const formation = digValue(wpn.wCustom, [ 'drone', 'formation'])
  const traceCount = digValue(wpn.wCustom, ['drone', 'trace', 'count'])
  wpn.units = traceCount || formation?.length
}

module.exports = {
  assignGame,
  '': BlankBullet,
  undefined: BlankBullet,
  BarrierBullet01,
  BombBullet01,
  BombBullet02: BombBullet01,
  CentryGun01,
  ClusterBeamAmmo,
  ClusterLaserAmmo: ClusterBeamAmmo,
  ClusterLightningAmmo: ClusterBeamAmmo,
  ClusterGenocideAmmo: ClusterBeamAmmo,
  ClusterBullet01,
  DecoyBullet01,
  EfsBullet,
  EfsExposureBullet,
  EfsShieldBullet01,
  FireAmmo01: FlameBullet02,
  FlameBullet02,
  GrenadeAmmo01: GrenadeBullet01,
  GrenadeBullet01,
  PileBunkerBullet01,
  LaserBullet01,
  LaserBullet03: LaserBullet01,
  MissileAmmo01,
  NapalmBullet01,
  RepairAmmo01: FlameBullet02,
  SentryGunBullet01,
  ShieldBashBullet01,
  ShockWaveBullet01,
  SmokeCandleBullet01,
  SmokeCandleBullet02,
  SolidAmmo01,
  SolidPelletBullet01,
  StunAmmo01: StunAmmo01,
  SupportUnitBullet01,
  TargetMarkerBullet01,
  Weapon_Drone_Area: Weapon_Drone,
  Weapon_Drone_MarkerShoot: Weapon_Drone,
  Weapon_Drone_LaserMarker: Weapon_Drone,
  Weapon_Gatling,
  Weapon_SubDrone: Weapon_Drone,

}
