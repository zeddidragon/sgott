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

const data = table.map(({value: node}, i) => {
  const id = node[0].value
  const level = Math.floor(node[4].value * 25)
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
    raw: category,
    odds: unlockStates[node[5].value] || (Math.floor(node[3].value * 100)),
  }

  for(const [prop, node] of Object.entries(autoProps)) {
    ret[prop] = getNode(template, node).value
  }
  const ammoType = getNode(template, 'AmmoClass').value

  ret.accuracy = +(1 - ret.accuracy).toFixed(4)
  if(group === 'support') {
    ret.duration = ret.range
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
      ret.duration = ret.range
    }
  }
  ret.range = ret.range * ret.speed / Math.max(ret.gravity, 1)
  ret.piercing = !!ret.piercing
  ret.credits = ret.credits === 1
  ret.zoom = ret.zoom || 0
  ret.underground = !!ret.underground

  if(group === 'raid') {
    const custom = getNode(template, 'Ammo_CustomParameter').value
    let type = strikes[custom[3].value]
    if(ret.name === 'Rule of God') {
      type = 'rog'
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
})

console.log(JSON.stringify(data, null, 2))
