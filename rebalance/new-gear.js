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
    const node = getNode(weapon, key)
    if(!node) throw new Error(`Failed to find node ${key}, adding it...`)
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
  if(meta.before) weapon.meta.before = meta.before
  else if(meta.after) weapon.meta.after = meta.after
}

const grenade = 'app:/WEAPON/bullet_grenade.rab'
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

function json(obj) {
  return JSON.stringify(obj, null, 2)
}

const outDir = './release/sgottstrap/SgottTemplates/weapon'
for(const [fileName, template] of Object.entries(added)) {
  const path = `${outDir}/${fileName}.json`
  console.log(`Writing ${path}`)
  fs.writeFileSync(path, json(template))
}