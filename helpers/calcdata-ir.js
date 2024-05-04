const { readFile } = require('fs/promises')

const modes = [{
  name: 'ON',
  missions: 52,
  difficulties: [{
    name: 'Easy',
  }, {
    name: 'Normal',
  }, {
    name: 'Hard',
  }, {
    name: 'Hardest',
  }, {
    name: 'Inferno',
  }],
}]

const gunStats = [
  'checkbox',
  'rank',
  'name',
  'remarks',
  'ammo',
  'piercing',
  'damage',
  'interval',
  'reload',
  'reloadQuick',
  'accuracy',
  'zoom',
  'range',
  'dps',
  'tdps',
  'total',
]

const headers = {
  weapons: [{
    category: 'assault',
    names: {
      en: 'Assault Rifle',
      ja: 'アサルトライフル',
    },
    headers: gunStats,
  }, {
    category: 'shotgun',
    names: {
      en: 'Shotgun',
      ja: 'ショットガン',
    },
    headers: gunStats,
  }],
}

function voidif(v, cmp) {
  if(v === cmp) {
    return void 0
  }
  return v
}

const ranks = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA']
function processRank(str) {
  const key = str.split('::').pop()
  const idx = ranks.indexOf(key)
  if(!idx) {
    return void 0
  }
  return ranks[idx - 1]
}

const weaponTypes = {
  AssaultRifle: 'assault',
  Shotgun: 'shotgun',
  SniperRifle: 'sniper',
  RocketLauncher: 'rocket',
  MissileLauncher: 'missile',
  LaserRifle: 'laser',
  GrenadeLauncher: 'grenade',
  Sword: 'sword',
  Submachinegun: 'special',
  Gatling: 'gatling',
  EnergyThrower: 'thrower',
  RailGun: 'railgun',
  RequestSupport: 'satellite',
  LaserCannon: 'cannon',
}

const damageTypes = {
  Physical: 'physical',
  Optics: 'optics',
}

const rexPrecision = /Precision: (\w+)( \(Equipped with scope\))?/
const rexGunType = /Type: (.+)/
const tagSearches = [
  ['bouncing', /Bouncing bullets/],
  ['sticky', /Bonding\/Timed/],
  ['no_move', /Cannot move while firing/],
  ['no_move_aim', /Cannot move\/aim speed down while firing/],
  ['reload_none', /Cannot reload/],
  ['slow_aim', /Decreased aim speed while firing/],
  ['delay_burst', /Delayed burst/],
  ['delay', /Delayed trigger response/],
  ['scatter_down', /Downward scattering/],
  ['growth_range', /Range increases the longer you fire/],
  ['growth_range', /Distance increases the longer you fire/],
  ['pushback', /Pushes enemies back/],
  ['reload_auto', /Auto Reload/],
]


let lines = new Set()
async function extractGunStats(category) {
  const data = JSON.parse(await readFile(`data/ir/${category}.json`))
  const textEn = JSON.parse(await readFile('data/ir/en-Text_Name.json'))
  const textJa = JSON.parse(await readFile('data/ir/ja-Text_Name.json'))
  const dmgs = JSON.parse(await readFile('data/ir/DamageParam.json'))
  return Object.entries(data).map(([id, wpn]) => {

    const key =  id.padStart(6, 0)
    let isDLC = false
    const nameKey = `WPN_10${key}`
    let { text: ja } = textJa[nameKey] || {}
    let { text: en } = textEn[nameKey] || {}
    const { text: stats } = textEn[`WPN_13${key}`] || {}
    const [, accuracyRank, scope] = rexPrecision.exec(stats) || []
    const [, gunType] = rexGunType.exec(stats) || []
    if(!en) {
      return
    }
    const {
      m_Name: name,
      m_stCommon: obj,
      m_stCase: obj2,
    } = wpn
    const dmg = dmgs[obj.m_sShot_BulletID]
    const dmg2 = dmgs[obj.m_sShot_BulletID + 1]
    if(!dmg) {
      return
    }
    const rank = processRank(obj.m_eRank)
    let category = obj.m_enWeaponType.split('::').pop()
    category = weaponTypes[category] || category
    for(const line of (stats?.split('\n').slice(1) || [])) {
      lines.add(line)
    }
    let dmgType = obj.m_eDamageAttribute?.split('::')?.pop()
    dmgType = damageTypes[dmgType] || 'none'
    const crit = obj2.m_sLuckyBulletProbability
    const tags = tagSearches
      .filter(([tag, search]) => search.exec(stats))
      .map(([tag]) => tag)
    const ret = {
      id: `weapon-${id}`,
      names: name && { en, ja },
      character: 'weapons',
      gunType,
      rank,
      category,
      damage: dmg.fDamageAmount,
      damageType: dmgType,
      ammo: obj.m_sLoadingNum,
      count: voidif(obj.m_sNumShot, 1),
      range: obj.m_fShotRange / 100,
      rof: 1 / obj.m_fWaitingTime,
      intervalOverdrive: obj.m_fOverdrive_MagWaitingTime,
      reloadSeconds: obj.m_fReloadTime,
      reloadOverdrive: obj.m_fOverdrive_MagReloadTime,
      accuracyRank,
      zoom: !!scope || void 0,
    }
    if(crit > 0) {
      tags.push('roulette')
      ret.critOver = crit
      ret.critDamage = dmg2.fDamageAmount
    }
    if(tags.length) {
      ret.tags = tags
    }
    return ret
  }).filter(wpn => wpn)
}

async function extractCalcdata() {
  const weapons = await extractGunStats('WeaponParam')
  return {
    langs: ['en', 'ja'],
    classes: [
      'weapons',
      'items',
    ],
    charLabels: [
      'Weapons',
      'Items',
    ],
    headers,
    weapons: [...weapons.flat()],
    modes,
  }
}

module.exports = extractCalcdata
