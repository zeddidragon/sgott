const fs = require('fs')
const getNode = require('./get-node')
const table = require('../sgottstrap/weapontable').variables[0].value

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
  reload: 'ReloadTime',
  reloadInit: 'ReloadInit',
  credits: 'ReloadType',
  secondary: 'SecondaryFire_Type',
  zoom: 'SecondaryFire_Parameter',
  underground: 'use_underground',
}

const data = table.map(({value: node}, i) => {
  const id = node[0].value
  const level = Math.floor(node[4].value * 25)
  const category = node[2].value
  const character = classes[Math.floor(category / 10)]
  const group = categories[category]

  const template = require(`../rebalance/originals/${id.toUpperCase()}`)
  function attr(str) {
    return getNode(template, str).value
  }

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

  ret.accuracy = +(1 - ret.accuracy).toFixed(4)
  ret.range = ret.range * ret.speed / Math.max(ret.gravity, 1)
  ret.piercing = !!ret.piercing
  ret.credits = ret.credits === 1
  ret.zoom = ret.zoom || 0
  ret.underground = !!ret.underground

  return ret
})

fs.writeFileSync('docs/weapons-calc.json', JSON.stringify(data, null, 2))
