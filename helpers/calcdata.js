const getNode = require('./get-node')
const table = require('../data/41/weapon/_WEAPONTABLE').variables[0].value

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
  reload: 'ReloadTime',
  reloadInit: 'ReloadInit',
  credits: 'ReloadType',
  secondary: 'SecondaryFire_Type',
  zoom: 'SecondaryFire_Parameter',
  underground: 'use_underground',
}

const strikes = [
  'shelling',
  'satellite',
  'bomber',
]

/* eslint-disable complexity */
function processWeapon({ value: node }) {
  const id = node[0].value
  const level = Math.max(0, Math.floor(node[4].value * 25 + 0.0001))
  const category = node[2].value
  const character = classes[Math.floor(category / 10)]
  const group = categories[category]

  const template = require(`../data/41/weapon/${id.toUpperCase()}`)
  const ret = {
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
      ret[prop] = v
    }
  }
  const ammoType = getNode(template, 'AmmoClass').value

  ret.accuracy = +(1 - (ret.accuracy || 0)).toFixed(4)
  if(group === 'support') {
    ret.duration = ret.range
  }
  if(ammoType === 'FlameBullet02') {
    ret.piercing = true
    const custom = getNode(template, 'Ammo_CustomParameter').value
    if(custom[3].value) { // Continous damage type flame
      ret.duration = ret.range
      ret.continous = true
    }
  }
  if(ammoType === 'NapalmBullet01') {
    const custom = getNode(template, 'Ammo_CustomParameter').value
    ret.duration = custom[4].value[2].value * 3
  }
  if(ammoType === 'ClusterBullet01') {
    const custom = getNode(template, 'Ammo_CustomParameter').value
    const shots = custom[5].value[2].value
    const interval = custom[5].value[3].value + 1
    ret.shots = shots
    ret.duration = shots * interval
    if(ret.duration < 10) {
      delete ret.duration
    }
  }
  if(ammoType === 'SupportUnitBullet01') {
    const custom = getNode(template, 'Ammo_CustomParameter').value
    ret.supportType = [
      'life',
      'plasma',
      'power',
      'guard',
    ][custom[0].value]
  }
  if(ammoType === 'GrenadeBullet01') {
    const custom = getNode(template, 'Ammo_CustomParameter').value
    if(custom[0].value === 1) {
      ret.fuse = ret.range
    }
  }
  ret.range = ret.range * ret.speed / Math.max(ret.gravity || 0, 1)
  if(ret.piercing) {
    ret.piercing = true
  }
  if(ret.credits) {
    ret.credits = true
  }
  if(!ret.underground) {
    ret.underground = 'blocked'
  } else {
    delete ret.underground
  }
  if(ret.energy < 0) {
    delete ret.energy
  }
  if(ret.odds === 100) {
    delete ret.odds
  }
  if(ret.burst === 1) {
    delete ret.burst
  }
  if(ret.count === 1) {
    delete ret.count
  }

  if(group === 'raid') {
    const custom = getNode(template, 'Ammo_CustomParameter').value
    let type = strikes[custom[3].value]
    if(ret.name === 'Rule of God') {
      type = 'rog'
      delete ret.radius
      ret.ammo = 2
    }
    if(ret.name === 'Laguna Blaster') {
      delete ret.radius
    }

    ret.strikeType = type

    const strike = custom[4].value
    switch(type) {
      case 'rog': {
        break;
      }
      case 'bomber': {
        ret.bombers = strike[1].value
        ret.shots = strike[10].value[2].value
        break;
      }
      default: { // Shelling
        ret.shots = strike[2].value
        break;
      }
    }
  }

  return ret
}

const data = table.map(processWeapon)
console.log(JSON.stringify(data, null, 2))
