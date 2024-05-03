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
  'ammo',
  'piercing',
  'damage',
  'interval',
  'reload',
  'accuracy',
  'zoom',
  'range',
  'speed',
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
    headers: [
      'checkbox',
      'rank',
      'name',
      'remarks',
      'ammo',
      'damage',
      'interval',
      'reload',
      'reloadQuick',
      'accuracy',
      'range',
      'dps',
      'tdps',
      'total',
    ],
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
}

const damageTypes = {
  Physical: 'physical',
  Optics: 'optics',
}

async function extractGunStats(category) {
  const data = JSON.parse(await readFile(`data/ir/${category}.json`))
  const textEn = JSON.parse(await readFile('data/ir/en-Text_Name.json'))
  const textJa = JSON.parse(await readFile('data/ir/ja-Text_Name.json'))
  const dmgs = JSON.parse(await readFile('data/ir/DamageParam.json'))
  return Object.entries(data).map(([id, wpn]) => {
    const ja = textJa[`WPN_1000${id}`]
    const en = textEn[`WPN_1000${id}`]
    if(!en) {
      return
    }
    const {
      m_Name: name,
      m_stCommon: obj,
    } = wpn
    const dmg = dmgs[obj.m_sShot_BulletID]
    if(!dmg) {
      return
    }
    const rank = processRank(obj.m_eRank)
    let category = obj.m_enWeaponType.split('::').pop()
    category = weaponTypes[category] || category
    let dmgType = obj.m_eDamageAttribute?.split('::')?.pop()
    dmgType = damageTypes[dmgType] || 'none'
    return {
      id: `weapon-${id}`,
      names: name && {
        ja: ja.text,
        en: en.text,
      },
      character: 'weapons',
      rank,
      category,
      damage: dmg.fDamageAmount,
      damageType: dmgType,
      ammo: obj.m_sLoadingNum,
      count: voidif(obj.m_sNumShot, 1),
      range: obj.m_fShotRange / 100,
      intervalSeconds: obj.m_fWaitingTime,
      intervalOverdrive: obj.m_fOverdrive_MagWaitingTime,
      reloadSeconds: obj.m_fReloadTime,
      reloadOverdrive: obj.m_fOverdrive_MagReloadTime,
    }
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
