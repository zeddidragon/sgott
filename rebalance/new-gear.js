#!/usr/bin/env node

const fs = require('fs')
const table = require('./originals/_WEAPONTABLE')
const textTable = require('./originals/_WEAPONTEXT')
const blurbs = require('../helpers/blurbs')
const getId = require('../helpers/get-id')
const getNode = require('../helpers/get-node')
const patch = require('../helpers/patch')

const rawSgos = new Map()
const seconds = 60
const minutes = seconds * 60

const added = {}

function Float(v) {
  return {type: 'float', value: v}
}

function Ptr(v) {
  return {type: 'ptr', value: v}
}

function Int(v) {
  return {type: 'int', value: v}
}

function Str(v) {
  return {type: 'string', value: v}
}

function Vector(v) {
  return Ptr(v.map(Float))
}

function acquire(file) {
  return JSON.parse(fs.readFileSync(file))
}

categories = {
  ranger: {
    assault: 0,
    shotguns: 1,
    sniper: 2,
    rocket: 3,
    homing: 4,
    grenade: 5,
    special: 6,
  },
  diver: {
    'short': 10,
    laser: 11,
    electro: 12,
    particle: 13,
    sniper: 14,
    explosive: 15,
    homing: 16,
    special: 17,
  },
  fencer: {
    hammer: 20,
    spear: 21,
    shield: 22,
    auto: 23,
    cannon: 24,
    homing: 25,
    special: 26,
  },
  raider: {
    guide: 30,
    raid: 31,
    support: 32,
    limpet: 33,
    deploy: 34,
    special: 35,
    tank: 36,
    ground: 37,
    heli: 38,
    mech: 39,
  },
}

function add(meta, changes) {
  for(const prop of ['id', 'soldier', 'category', 'level', 'base']) {
    if(!meta[prop]) throw new Error(`No ${prop} specified`)
  }
  if(!categories[meta.soldier]) {
    throw new Error(`
      Unknown soldier: ${meta.soldier}
      Valid soldiers: ${Object.keys(categories).join(', ')}
    `)
  }
  const category = categories[meta.soldier][meta.category]
  if(category == null) {
    throw new Error(`
      Unknown category: ${meta.soldier}: ${meta.category}
      Valid categories: ${Object.keys(categories[meta.soldier]).join(', ')}
    `)
  }
  console.log(`Processing ${meta.id} ...`)
  const weapon = acquire(`./rebalance/originals/${meta.base.toUpperCase()}.json`)

  const name = ['name', {value: [Str(meta.name), Str(meta.name), Str(meta.name)]}]
  for(const [key, value] of Object.entries(changes).concat([name])) {
    var node = getNode(weapon, key)
    if(!node) {
      console.error(`Failed to find node ${key}, adding it...`)
      node = {name: key}
      weapon.variables.push(node)
    }
    if(typeof value === 'object') Object.assign(node, value)
    else if(typeof value === 'function') node.value = value(node.value, node)
    else node.value = value
  }

  const fileName = `${meta.soldier}_${meta.category}_${meta.id}`

  added[fileName] = weapon
  weapon.meta.id = meta.id
  weapon.meta.level = meta.level
  weapon.meta.category = category
  weapon.meta.description = meta.description
  if(meta.stats) weapon.meta.stats = meta.stats
  if(meta.before) weapon.meta.before = meta.before
  else if(meta.after) weapon.meta.after = meta.after
}

const grenade = 'app:/WEAPON/bullet_grenade.rab'

// EX (Explosive assault rifles)
for(let i = 0; i < 4; i++) {
  const base = [
    'AssultRifle_18K',
    'Weapon012',
    'Weapon020',
    'Weapon008' // Because the AF16 model is badass
  ][i]
  const after = [
    'AssultRifle_18K',
    'Weapon012',
    'Weapon020',
    'Weapon027'
  ][i]
  const count = Math.pow(2, i + 3)
  const factor = i + 1
  const life = [90, 30, 80, 60][i]
  const speed = [1.3, 5, 2, 4][i]
  add({
    id: `RarEx${factor}`,
    after: after,
    soldier: 'ranger',
    category: 'assault',
    base: base,
    name: `EX${count.toString().padStart(2, '0')}`,
    level: [8, 24, 50, 83][i],
    description: [
      '$AUTOSTATS$An assault rifle that fires exploding rounds.',
      '$AUTOSTATS$An upgrade to the EX08 is generally improved and fires its explosives at an uncontrollable rate. As the explosive payload is larger, fewer bullet has room in the gun.',
      '$AUTOSTATS$An upgrade to the EX16 is further improved, but rate of fire and ammo capacity has suffered. The explosive power is impressive for a small arms weapon.',
      '$AUTOSTATS$The final spec of the EX exploding assault rifle line. By making the weapon bulkier in general, ammo capacity has once again been increased, and the explosive payload has been dramatically enlargened. A terrifying superweapon that can be as deadly to yourself as your enemy.'
    ][i],
  }, {
    AmmoDamage: [24, 32, 150, 400][i],
    AmmoClass: 'GrenadeBullet01',
    AmmoModel: Str(grenade),
    AmmoAlive: life,
    AmmoSpeed: speed,
    AmmoCount: [80, 48, 32, 64][i],
    AmmoExplosion: [4, 5, 8, 12][i],
    AmmoColor: Vector([
      0.3 * factor,
      0.1 * 3 * factor,
      0.6 * 2 * factor,
      1.0,
    ]),
    Ammo_CustomParameter: Ptr([
      Int(1), // Sticky Grenade
      Float(-0.004),
      Float(1 + i),
      Float(0),
      Float(0.12), // Smoke trail speed
      Int(60), // Smoke Lifetime
    ]),
    AmmoHitImpulseAdjust: 1.5 + 0.5 * i,
    Range: life * speed,
    ReloadTime: [2, 1.5, 2, 2.5][i] * seconds,
    FireAccuracy: [0.05, 0.08, 0.03, 0.02][i],
    FireInterval: [8, 2, 6, 5][i],
    resource: v => {
      v.push(Str(grenade))
      return v
    },
  })
}

// CRUMBLE-J and UMA-J
for(let i = 0; i < 2; i++) {
  add({
    id: [
      'RgrCrumblej',
      `RgrUmaj`,
    ][i],
    before: [
      'Weapon146',
      'Weapon149',
    ][i],
    soldier: 'ranger',
    category: 'grenade',
    base: [
      'Weapon143',
      'Weapon150',
    ][i],
    name: [
      'CRUMBLE-J Twin Grenade Launcher',
      'UMA-J Grenade Launcher',
    ][i],
    level: [63, 78][i],
    description: [
      '$AUTOSTATS$For the sake of the user\s safety, CRUMBLE has been fitted with a timer. The power and size of the explosions have been dramatically increased.',
      '$AUTOSTATS$The ultimate in timed grenade launchers features maximal destructive power.',
    ][i],
  }, {
    AmmoDamage: v => v * 1.2,
    AmmoAlive: 240,
    AmmoSpeed: v => v * 0.5,
    AmmoCount: v => v + i,
    AmmoExplosion: [20, 30][i],
    Ammo_CustomParameter: Ptr([
      Int(1), // Bouncy Grenade
      Float(-0.004),
      Float(1),
      Float(0.13), // Bounce dampening
      Float(0.08), // Smoke trail speed
      Int(240), // Smoke Lifetime
    ]),
    AmmoHitImpulseAdjust: v => v * 1.5,
    ReloadTime: v => v * 0.675,
  })
}

// C-Bombs
for(let i = 0; i < 4; i++) {
  const num = [628, 630, 633, 637][i]
  const id = `Weapon${num}`
  add({
    id: `RspBomb${i + 1}`,
    before: 'pRapier01',
    soldier: 'ranger',
    category: 'special',
    base: id,
    name: [
      'C24 Bomb',
      'C25 Special Bomb',
      'C30 Bomb',
      'C70 Bomb',
    ][i],
    level: [16, 33, 46, 66][i],
    description: [
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 5\n            Damage: 1000\n        Blast Area: Radius 20m\n            Reload: 10.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nA bomb designed for very specific tasks. Its blast radius is wide and its power output intense, but due to its weight, it cannot be thrown -- it must be deliberately set in place. Best laid as a trap for unsuspecting foes. Press the attack button to set it and the Zoom/Activate button to detonate it. To defuse the bomb without detonating, simply press the reload button.",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 20\n            Damage: 1500\n        Blast Area: Radius 15m\n            Reload: 15.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nA high-capacity bomb designed for very specific tasks. Has many uses and can be set in large quantities, allowing for untold destructive potential in the hands of an expert. Press the attack button to set it and the Zoom/Activate button to detonate it. To defuse the bomb without detonating, simply press the reload button.",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 5\n            Damage: 6000\n        Blast Area: Radius 30m\n            Reload: 10.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nA high-performance bomb with a very large blast area, so you need to be careful that you're not caught in the blast yourself. Its destructive power is almost frightening. Press the attack button to set it and the Zoom/Activate button to detonate it. To defuse the bomb without detonating, simply press the reload button.",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 10\n            Damage: 12000\n        Blast Area: Radius 40m\n            Reload: 15.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nThe most powerful bomb available. Rumored to have been developed with Ravager technology, but the truth of the matter is unknown. Its incredible power and blast radius make it rather dangerous to use, so careful discretion is highly recommended. Press the attack button to set it and the Zoom/Activate button to detonate it. To defuse the bomb without detonating, simply press the reload button.",
    ][i],
  }, {
    SecondaryFire_Type: 2,
  })
}

// Y-Mines
for(let i = 0; i < 9; i++) {
  const num = 642 + i
  const id = `Weapon${num}`
  add({
    id: `RspClaymore${i + 1}`,
    before: 'pRapier01',
    soldier: 'ranger',
    category: 'special',
    base: id,
    name: [
      'Y10 Impulse',
      'Y10 Anti-Aircraft Impulse',
      'Y10 Wide Impulse',
      'Y11 Impulse',
      'Y11-Anti-Aircraft Impulse',
      'Y20 Impulse',
      'YDX Anti-Aircraft Impulse',
      'YDX Strike Impulse',
      'Y21 Impulse',
    ][i],
    level: [7,  13, 21,  30, 44, 48, 63, 71, 76][i],
    description: [
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 12\n            Damage: 15×40\n             Range: 75m              Search Distance: 45m\n            Reload: 13.3sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nSet by pressing the fire button, then detonate with the Zoom/Activate button. Boasts better performance compared to the Y9, as well as improved capacity. Will also detonate automatically if an enemy enters its effective range. Spews out a large number of ball bearings, devastating whosoever they may strike. Can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 9\n            Damage: 22×20\n             Range: 300m             Search Distance: 100m\n            Reload: 10.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nA multi-directional impulse landmine customized for use against aircraft. Both the ejection tube for the ball bearings and the enemy detection sensor point diagonally upward in order to target and attack airborne foes. Will also detonate automatically if an enemy enters its effective range. Spews out a large number of ball bearings, devastating whosoever they may strike. Can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 8\n            Damage: 17×40\n             Range: 60m              Search Distance: 45m\n            Reload: 9.3sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nAn upgraded Y10 Impulse mine. Scatters ball bearings over a wider horizontal area, affecting a greater range of enemies. Will also detonate automatically if an enemy enters its effective range. The large number of ball bearings it ejects will devastate whosoever they strike. Can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 15\n            Damage: 20×40\n             Range: 80m              Search Distance: 60m\n            Reload: 15.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nAn upgraded Y10 Impulse mine. Boasts improved firepower and allows for more mines to be set at once. Will also detonate automatically if an enemy enters its effective range. The large number of ball bearings it ejects will devastate whosoever they strike. Can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 15\n            Damage: 40×40\n             Range: 400m             Search Distance: 120m\n            Reload: 10.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nA multi-directional impulse landmine customized for use against aircraft. Both the ejection tube for the ball bearings and the enemy detection sensor point diagonally upward in order to target and attack airborne foes. The sensor detection range is greater, making it much better at detecting flying bogeys. Will detonate automatically if an enemy enters its effective range. Spews out a large number of ball bearings, devastating whosoever they may strike. Can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 20\n            Damage: 20×40\n             Range: 90m              Search Distance: 60m\n            Reload: 15.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nAn upgraded Y11 Impulse model. The number of mines that can be set before detonation is higher than ever, allowing for broader applications in battle. Will detonate automatically if an enemy enters its effective range. The large number of ball bearings it ejects will devastate whosoever they strike. Can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 10\n            Damage: 120×40\n             Range: 500m             Search Distance: 150m\n            Reload: 11.0sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nThe ultimate anti-aircraft Impulse mine, boasting a greatly improved sensor. Can now target enemies even when they're flying at high altitudes. Scatters large ball bearings which, despite being few in number, are known to cause massive damage. Will also detonate automatically if enemies enter their effective range. Can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 8\n            Damage: 80×40\n             Range: 600m             Search Distance: 100m\n            Reload: 9.3sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nA highly upgraded directional landmine that spreads out enormous ball bearings. Despite being few in number, these are known to cause massive damage, and they also discharge forward in a focused, deadly beam. Though the attack area is small, the damage inflicted by this weapon is extraordinary. The scope of its sensor data is also much greater, allowing for accurate close-range and long-range telemetry alike. Will detonate automatically if an enemy enters its effective range, and can be reloaded by pressing the reload button (complicated, I know!).",
      "<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>            Number: 20\n            Damage: 125×40\n             Range: 120m             Search Distance: 80m\n            Reload: 13.3sec\n<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\nThe final form of the Impulse series, with its firepower pushed to the absolute limit and a much greater area of effect. Will detonate automatically if an enemy enters its effective range, and scatter a large number of ball bearings far and wide. Can be reloaded by pressing the reload button (complicated, I know!).",
    ][i],
  }, {
    BaseAnimation: 'throw',
    ChangeAnimation: 'throw_change1',
    ReloadAnimation: 'throw_reload1',
    custom_parameter: v => {
      v[0].value = 'throw_recoil2'
      return v
    },
  })
}

// Personal Guide Kit (Guide kits for Fencer)
const laserGuide = {
  AmmoAlive: 1,
  AmmoCount: 1,
  AmmoClass: '',
  AmmoDamage: 0,
  AmmoModel: Int(0),
  FireAccuracy: 0,
  FireBurstCount: 1,
  FireInterval: 0,
  FireSe: Ptr([
    Int(1),
    Str('weapon_Engineer_LM_laserMark'),
    Float(0.7),
    Float(1),
    Float(1),
    Float(25),
  ]),
  ReloadTime: 0,
  SecondaryFire_Type: 1,
  SecondaryFire_Parameter: Float(3),
  xgs_scene_object_class: 'Weapon_LaserMarker',
}

for(let i = 0; i < 3; i++) {
  const range = 300 + 50 * i
  const distance = [0.2, 0.5, 1][i]
  const speed = [0.2, 0.5, 0.8][i]

  add({
    id: `FspLaserGuide${i + 1}`,
    after: [
      'Weapon507',
      'FspLaserGuide1',
      'FspLaserGuide2',
    ][i],
    soldier: 'fencer',
    category: 'special',
    base: 'Weapon431',
    name: `Personal Guide Kit` + (i ? ` M${i + 1}` : ''),
    level: [20, 60, 76][i],
    stats: [
      ['Laser Range', `${range}m`],
      ['Lock-On Distance', `${distance}x`],
      ['Lock-On Speed', `${speed}x`],
      ['Zoom', '3x'],
    ],
    description: [
      '$SEMISTATS$A shoulder-mounted laser guide Fencers can use to guide their own missiles.',
      'Being shoulder-mounted, the laser is not as stable as the dedicated pointers used by Air Raiders, as such the targets will be more difficult than usual to lock on for missiles.',
    ].join('\n\n'),
  }, Object.assign({}, laserGuide, {
    AmmoColor: Vector([0.25, 1.0, 0.25, 1.0]),
    AmmoSpeed: range,
    Ammo_CustomParameter: Vector([speed, distance]),
    Range: range,
    SecondaryFire_Parameter: Float(3),
  }))
}

add({
  id: 'FspLaserGuideA',
  after: 'FspLaserGuide1',
  soldier: 'fencer',
  category: 'special',
  base: 'Weapon431',
  name: 'Focus Pointer',
  level: 28,
  stats: [
    ['Laser Range', '160m'],
    ['Lock-On Distance', '0.5x'],
    ['Lock-On Speed', '2x'],
  ],
  description: [
    '$SEMISTATS$A shoulder-mounted laser guide Fencers can use to guide their own missiles.',
    'The problem of instability has been solved by using multiple lasers and triangulating the positions between them, but the range suffers, and the missile launcher must be used from very close by.',
  ].join('\n\n'),
}, Object.assign({}, laserGuide, {
  AmmoColor: Vector([1.0, 0.25, 0.25, 1.0]),
  AmmoSpeed: 160,
  Ammo_CustomParameter: Vector([2, 0.5]),
  Range: 160,
  SecondaryFire_Parameter: Float(3),
}))

const beaconGuide = {
  AmmoClass: 'TargetMarkerBullet01',
  AmmoHitSe: Ptr([
    Int(0),
    Str('weapon_Engineer_LM_set'),
    Float(0.7),
    Float(1),
    Float(1),
    Float(35),
  ]),
  AmmoModel: Str('app:/WEAPON/bullet_marker.rab'),
  AmmoGravityFactor: 1,
  resource: (v, node) => {
    node.type = 'ptr'
    if(!v) {
      node.value = []
      v = node.value
    }
    v.push(Str('app:/WEAPON/bullet_marker.rab'))
    return v
  },
}

// Personal Guide Beacon (Fencer)
for(let i = 0; i < 3; i++) {
  const life = 400
  const speed = 1 + i * 0.25
  const rangeMod = [0.5, 0.6, 1][i]
  const speedMod = [0.3, 0.4, 1][i]
  const range = speed * life

  add({
    id: `FspSphereGuide${i + 1}`,
    after: [
      'FspLaserGuide3',
      'FspSphereGuide1',
      'FspSphereGuide2',
    ][i],
    soldier: 'fencer',
    category: 'special',
    base: 'Weapon474',
    name: `Personal Guide Beacon` + (i ? ` M${i + 1}` : ''),
    level: [4, 24, 82][i],
    stats: [
      ['Range', `${range}m`],
      ['Lock-On Distance', `${rangeMod}x`],
      ['Lock-On Speed', `${speedMod}x`],
      ['Reload', '8sec'],
    ],
    description: [
      '$SEMISTATS$A shoulder-mounted guide beacon launcher Fencers can use to guide their own missiles.',
      'As the size of the beacons had to be reduced, they\'re not as strong as Air Raider\'s beacons.',
      blurbs.jump,
    ].join('\n\n'),
  }, Object.assign({}, beaconGuide, {
    AmmoAlive: life,
    AmmoColor: Vector([0.0, 1.0, 0.0, 1.0]),
    AmmoSpeed: speed,
    AmmoSize: 0.05,
    AmmoCount: 3,
    Ammo_CustomParameter: Vector([speedMod, rangeMod, 1]),
    FireAccuracy: 0.12 - i * 0.03,
    MuzzleFlash: '',
    MuzzleFlash_CustomParameter: Ptr(null),
    Range: range,
    ReloadTime: 8 * seconds,
    SecondaryFire_Type: 4
  }))
}

// Trap Mortar
for(let i = 0; i < 3; i++) {
  const fuse = i + 2
  const ammo = [10, 3, 5][i]
  const radius = [15, 30, 40][i]
  const damage = [1200, 4500, 9000][i]
  const factor = i + 1
  add({
    id: `FspTrapMortar${factor}`,
    after: [
      'FspLaserGuide3',
      'FspTrapMortar1',
      'FspTrapMortar2',
    ][i],
    soldier: 'fencer',
    category: 'special',
    base: 'Weapon457',
    name: `Trap Mortar B${[15, 24, 60][i]}`,
    level: [33, 46, 66][i],
    stats: [
      ['Capacity', `${ammo}`],
      ['Damage', `${damage}`],
      ['Blast Radius', `${radius}m`],
      ['Detonation Time', `${fuse}sec`],
      ['Reload Time', `10sec`],
    ],
    description: [
      '$SEMISTATS$A device that leaves powerful, timed bombs at the user\'s position. Designed to help the user escape giant from insects.',
      'After planting, it\'s important to leave the blast area as fast as possible.',
      blurbs.dash,
    ].join('\n\n'),
  }, {
    AmmoDamage: damage,
    AmmoClass: 'GrenadeBullet01',
    AmmoModel: Str(grenade),
    AmmoAlive: fuse * seconds,
    AmmoSpeed: 0,
    AmmoCount: ammo,
    AmmoExplosion: radius,
    AmmoColor: Vector([
      0.1 * 3 * factor,
      0.6 * 2 * factor,
      0.3 * factor,
      1.0,
    ]),
    Ammo_CustomParameter: Ptr([
      Int(1), // Sticky Grenade
      Float(-0.004),
      Float(1 + i),
      Float(0.2),
      Float(0.3), // Smoke trail speed
      Int(60), // Smoke Lifetime
    ]),
    AmmoHitImpulseAdjust: 3 + i * 2,
    AmmoGravityFactor: 2,
    Range: 1000,
    ReloadTime: 8 * seconds,
    FireAccuracy: 0.2,
    FireInterval: 45,
    FireVector: Vector([0, -1, 0]),
    SecondaryFire_Type: 5,
    resource: (v, node) => {
      node.type = 'ptr'
      if(!v) {
        node.value = []
        v = node.value
      }
      v.push(Str(grenade))
      return v
    },
  })
}

// Precision Gatling
for(let i = 0; i < 4; i++) {
  const base = [
    'hGatling01',
    'Weapon432',
    'Weapon440',
    'Weapon451',
  ][i]
  add({
    id: `FatPrecGat${i + 1}`,
    after: base,
    soldier: 'fencer',
    category: 'auto',
    base: base,
    name: `SG${[7, 9, 10, 'Z'][i]} Precision Gatling`,
    level: [1, 28, 54, 81][i],
    description: '$AUTOSTATS$A steadier Hand Gatling for precision use. The shots are highy accurate and the gatling completely absorbs recoil.',
  }, {
    AmmoDamage: v => v * 1.2,
    AmmoAlive: v => Math.floor(v * 0.7),
    AmmoSpeed: v => v * 1.6,
    AmmoCount: v => Math.floor(v * 0.4),
    FireAccuracy: v => v * 0.2,
    FireInterval: v => Math.floor(v * 2.4),
    FireRecoil: 0,
    custom_parameter: v => {
      v[4].value[0].value = 0
      v[7].value = Math.floor(v[7].value * 0.5)
      return v
    },
  })
}

// Spritefall Pulse
for(let i = 0; i < 3; i++) {
  const base = 'Weapon' + [586, 589, 591][i]
  add({
    id: `AraSpritefallBeta${i + 1}`,
    after: base,
    soldier: 'raider',
    category: 'raid',
    base: base,
    name: [
      'Spritefall Pulse',
      'Spritefall Blink',
      'Spritefall Zero',
    ][i],
    level: [30, 66, 78][i],
    description: '$AUTOSTATS$A variant of Spritefall that calls a single, highly concentrated laser burst.' + [
      '',
      'With upgrades in the EDF network system, the satellite is able to respond faster',
      'Through unknown means, the laser travels faster than light itself.',
    ][i],
  }, {
    AmmoDamage: [2000, 4000, 8000][i],
    AmmoExplosion: 0,
    AmmoSize: [12, 20, 20][i],
    Ammo_CustomParameter: v => {
      v[0].value = 50 - 30 * i // Summon delay
      v[4].value[2].value = 1 // Laser count
      return v
    },
    custom_parameter: v => {
      v[0].value = 30 // Call-in time
      return v
    },
    ReloadTime: 100,
  })
}

// Personal Defense Shotgun for Air Raider
for(let i = 0; i < 4; i++) {
  add({
    id: `AspShotgun${i + 1}`,
    before: 'Weaponn674',
    soldier: 'raider',
    category: 'special',
    base: 'Weapon032',
    name: [
      'Buckdeer 12Y',
      'Buckdeer 15Y',
      'Buckdeer 18Y',
      'Buckdeer XY',
    ][i],
    level: [2, 26, 50, 90][i],
    description: '$AUTOSTATS$A personal self-defense shotgun that\'s easy to handle for an untrained soldier. Handy for escaping the clutches of giant insects or finishing off what remains after the air raids have scorched the battlefield.',
  }, {
    AmmoAlive: Math.floor(10 - i * 1.5),
    AmmoDamage: [20, 40, 100, 200][i],
    AmmoCount: 2,
    AmmoSpeed: 3 * (i + 1),
    BaseAnimation: 'assault',
    ChangeAnimation: 'assault_change1',
    FireAccuracy: 0.3,
    FireCount: [20, 26, 32, 48][i],
    FireInterval: 45,
    FireSpreadType: 0,
    ReloadAnimation: 'assault_reload1',
    ReloadTime: 240,
  })
}

add({
  id: `AraWarHammer1`,
  before: 'Weapon580',
  soldier: 'raider',
  category: 'raid',
  base: 'Weapon582',
  name: 'Tungsten Tempest',
  level: 51,
  description: '$AUTOSTATS$This experimental kinetic orbital bombardment cruise missile was developed to fight giant robots. With speed accumulated from traveling from space combined with raw mass, it can obliterate anything you can manage to steer it into.',
}, {
  AmmoDamage: 80000,
  AmmoExplosion: 4,
  Ammo_CustomParameter: v => {
    v[0].value = 240 // Summon  delay
    v[4].value[1].value[1].value = 800 // Missile spawn height
    v[4].value[5].value = 5 // Missile Speed
    v[4].value[7].value = 50 // Missile Size
    v[4].value[9].value = 0 // Explosive radius
    // Looking for ways to make meaningfully faster
    v[4].value[10].value /= 2
    v[4].value[13].value[2].value /= 4
    v[4].value[13].value[8].value /= 4
    return v
  },
  ReloadTime: 2000,
  custom_parameter: v => {
    v[0].value = 30 // Summon time
    return v
  },
})

function json(obj) {
  return JSON.stringify(obj, null, 2)
}

const outDir = './release/sgottstrap/SgottTemplates/weapon'
for(const [fileName, template] of Object.entries(added)) {
  const path = `${outDir}/${fileName}.json`
  console.log(`Writing ${path}`)
  fs.writeFileSync(path, json(template))
}
