const getNode = require('./get-node')
const table = require('../data/5/weapons/weapontable').variables[0].value

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
    'missile',
    'grenade',
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
  ammo: 'AmmoCount',
  weapon: 'xgs_scene_object_class',
  damage: 'AmmoDamage',
  speed: 'AmmoSpeed',
  accuracy: 'FireAccuracy',
  life: 'AmmoAlive',
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
  const character = classes[Math.floor(category / 100)]
  const group = categories[character][category % 100]

  const template = require(`../data/5/weapons/${id.toLowerCase()}`)
  function attr(str) {
    return getNode(template, str).value
  }

  const ret = {
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
    if(isArray && value.length === 6) {
      ret[prop] = {
        base: value[0].value,
        algo: value[1].value,
        lvMin: value[2].value,
        lvMax: value[3].value,
        zero: value[4].value,
        exp: value[5].value,
        type: value[0].type,
      }
    } else if (isArray && value.length === 1){
      ret[prop] = value[0].value
    } else if (isArray) {
      ret[prop] = value.map(v => v.value)
    } else {
      ret[prop] = value
    }
  }

  if(ret.energy[0] === -1) ret.energy = -1
  ret.accuracy
  ret.piercing = !!ret.piercing
  ret.credits = ret.credits === 1
  ret.zoom = ret.zoom || 0
  ret.underground = !!ret.underground

  return ret
})

console.log(JSON.stringify(data, null, 2))
