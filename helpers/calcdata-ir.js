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

function omit(arr, item) {
  const idx = arr.indexOf(item)
  return [
    ...arr.slice(0, idx),
    ...arr.slice(idx + 1),
  ]
}

const gunStats = [
  'checkbox',
  'rank',
  'name',
  'remarks',
  'ammo',
  'piercing',
  'damage',
  'damageType',
  'interval',
  'intervalOD',
  'reload',
  'reloadQuick',
  'reloadOD',
  'accuracy',
  'zoom',
  'range',
  'speed2',
  'dps',
  'tdps',
  'qrdps',
  'total',
]
const gunStatsNoZoom = omit(gunStats, 'zoom')
const gunStatsNoQr = omit(gunStatsNoZoom, 'qrdps')

const effectStats = [
  'checkbox',
  'rank',
  'name',
  'remarks',
  'ammo',
  'piercing',
  'damage',
  'damageType',
  'effect',
  'interval',
  'intervalOD',
  'reload',
  'reloadQuick',
  'reloadOD',
  'accuracy',
  'range',
  'speed2',
  'dps',
  'tdps',
  'total',
]

const bombStats = [
  'checkbox',
  'rank',
  'name',
  'remarks',
  'ammo',
  'piercing',
  'damage',
  'radius',
  'damageType',
  'interval',
  'intervalOD',
  'reload',
  'reloadQuick',
  'reloadOD',
  'accuracy',
  'range',
  'speed2',
  'dps',
  'tdps',
  'qrdps',
  'total',
]

const missileStats = [
  'checkbox',
  'rank',
  'name',
  'remarks',
  'ammo',
  'piercing',
  'damage',
  'radius',
  'damageType',
  'lockRange',
  'lockTime',
  'interval',
  'intervalOD',
  'reload',
  'reloadQuick',
  'reloadOD',
  'range',
  'speed2',
  'dps',
  'tdps',
  'total',
]

// TODO: Check swords more closely
const swordStats = [
  'checkbox',
  'rank',
  'name',
  'ammo',
  'piercing',
  'damage',
  'damageType',
  'effect',
  'reload',
  'reloadQuick',
  'reloadOD',
  'range',
  'speed2',
  'total',
]

const satelliteStats = [
  'checkbox',
  'rank',
  'name',
  'remarks',
  'ammo',
  'piercing',
  'damage',
  'radius',
  'damageType',
  'interval',
  'intervalOD',
  'reload',
  'reloadQuick',
  'reloadOD',
  'accuracy',
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
    appendix: '*Most projectile counts in-game are inflated.',
    names: {
      en: 'Shotgun',
      ja: 'ショットガン',
    },
    headers: [
      ...gunStats.slice(0, gunStats.indexOf('damage') + 1),
      'radius',
      ...gunStats.slice(gunStats.indexOf('damage') + 1),
    ],
  }, {
    category: 'sniper',
    names: {
      en: 'Sniper Rifle',
      ja: 'スナイパーライフル',
    },
    headers: gunStats,
  }, {
    category: 'rocket',
    names: {
      en: 'Rocket Launcher',
      ja: 'ロケットランチャー',
    },
    headers: bombStats,
  }, {
    category: 'missile',
    names: {
      en: 'Missile Launcher',
      ja: 'ミサイルランチャー',
    },
    headers: missileStats,
  }, {
    category: 'laser',
    names: {
      en: 'Laser Rifle',
      ja: 'レーザーライフル',
    },
    headers: gunStatsNoZoom,
  }, {
    category: 'grenade',
    names: {
      en: 'Grenade Launcher',
      ja: 'グレネードランチャー',
    },
    headers: bombStats,
  }, {
    category: 'sword',
    names: {
      en: 'Sword',
      ja: 'ソード',
    },
    headers: swordStats,
    appendix: '*Sword stats are not thoroughly investigated yet.',
  }, {
    category: 'special',
    names: {
      en: 'Special Weapon',
      ja: '特殊兵器',
    },
    headers: gunStatsNoZoom,
  }, {
    category: 'gatling',
    names: {
      en: 'Gatling',
      ja: 'ミニガン',
    },
    headers: gunStatsNoQr,
  }, {
    category: 'thrower',
    names: {
      en: 'Energy Thrower',
      ja: 'エナジースロウワー',
    },
    headers: effectStats,
  }, {
    category: 'railgun',
    names: {
      en: 'Railgun',
      ja: 'レールガン',
    },
    headers: effectStats,
  }, {
    category: 'satellite',
    names: {
      en: 'Satellite Weapons',
      ja: '衛星兵器',
    },
    headers: satelliteStats,
  }, {
    category: 'cannon',
    names: {
      en: 'Laser Cannon',
      ja: 'レーザーカノン',
    },
    headers: gunStatsNoQr,
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

const rexPrecision = /Precision:? (\w+\+?→?\w*\+?)( \(Equipped with scope\))?/i
const rexScattering = /(\w+) scattering/i
const rexGunType = /Type: (.+)/i
const rexBlastRadius = /Blast Radius: (\d+\.?\d*) meters/i
const rexPiercing = /Penetrates through enemies/i
const tagSearches = [
  ['bouncing', /Bouncing bullets/i],
  ['sticky', /Bonding\/Timed/i],
  ['no_move', /Cannot move while firing/i],
  ['no_move_aim', /Cannot move\/aim speed down while firing/i],
  ['slow_aim', /Decreased aim speed while firing/i],
  ['delay_burst', /Delayed burst/i],
  ['delay', /Delayed trigger response/i],
  ['growth_range', /Range increases the longer you fire/i],
  ['growth_range', /Distance increases the longer you fire/i],
  ['growth_damage', /Power increases the longer you fire/i],
  ['pushback', /Pushes enemies back/i],
  ['reload_auto', /Auto Reload/i],
  ['reload_charge', /Recharge ability/i],
  ['recoil', /Recoil/i],
  ['tracer', /Tracer bullets/i],
]

function getEnum(str) {
  return str?.split('::')?.pop()?.toLowerCase()
}

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
    const [, scattering] = rexScattering.exec(stats) || []
    const [, gunType] = rexGunType.exec(stats) || []
    const [, radius] = rexBlastRadius.exec(stats) || []
    const [piercing] = rexPiercing.exec(stats) || []
    if(!en) {
      return
    }
    const {
      m_Name: name,
      m_stCommon: obj,
      m_stCase: obj2,
    } = wpn
    const dmg = dmgs[id]
    const dmg2 = dmgs[(+id) + 1]
    if(!dmg) {
      return
    }
    const rank = processRank(obj.m_eRank)
    let category = obj.m_enWeaponType.split('::').pop()
    category = weaponTypes[category] || category
    if(category === 'sniper') {
      for(const line of (stats?.split('\n').slice(1) || [])) {
        lines.add(line)
      }
    }
    const damageType = voidif(getEnum((dmg2 || dmg).eDamageAttribute), 'none')
    const effect = voidif(getEnum((dmg2 || dmg).eDamageEffect), 'none')
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
      piercing: voidif(+!!piercing, 0),
      damage: dmg.fDamageAmount,
      damage2: dmg2?.fDamageAmount,
      damageType,
      radius: +radius || void 0,
      ammo: obj.m_sLoadingNum,
      burst: voidif(obj.m_sRapidFire, 1),
      count: voidif(obj.m_sNumShot || 1, 1),
      effect,
      range: obj.m_fShotRange / 100,
      speed: obj.m_fShotDistance / 100,
      rof: 1 / Math.max(obj.m_fWaitingTime, 0.05), // 20/sec max for Unreal
      intervalOverdrive: obj.m_fOverdrive_MagWaitingTime,
      reloadSeconds: obj.m_fReloadTime,
      reloadOverdrive: obj.m_fOverdrive_MagReloadTime,
      reloadQuick: voidif(obj.m_fEmergencyRechargeStartRate, 0),
      reloadQuickWindow: voidif(obj.m_fEmergencyRechargeTime, 0),
      accuracyRank: accuracyRank || scattering?.toLowerCase(),
      zoom: !!scope || void 0,
    }
    if(crit > 0) {
      tags.push('roulette')
      ret.critOver = crit
    }
    const isDamage = dmg.bEnableDamageEnemy
    if(!isDamage && category === 'shotgun') { // Puncher line
      tags.push('puncher')
    }
    const mDamage = wpn.fMenuDamageAmount
    if(category === 'shotgun') { // Shotgun stats simply lie
      const mDamage = wpn.fMenuDamageAmount
      const count = Math.round(mDamage / ret.damage)
      const count2 = Math.round(mDamage / ret.damage2)
      if(count >= 3 && count <= 30) {
        ret.count = count
      } else if(count2 >= 3 && count2 <= 30) {
        ret.count = count2
      }
    }
    if(category === 'shotgun' && !ret.accuracyRank) {
      ret.accuracyRank = 'circle'
    }
    if(ret.accuracyRank === 'round') {
      ret.accuracyRank = 'circle'
    }
    const isBomb = [
      'rocket',
      'missile',
      'laser',
      'grenade',
      'special',
      'thrower',
      'satellite',
      'cannon',
      'railgun',
    ].includes(category)
    if(isBomb && !ret.damage) {
      ret.damage = ret.damage2
      delete ret.damage2
    }
    if(isBomb && !ret.damage) { // Gennai DLC Launcher, Sky Rhumba
      const dmg3 = dmgs[(+id) + 2]
      ret.damage = dmg3?.fDamageAmount || 0
    }
    const isLaserCannon = [
      'cannon',
    ].includes(category)
    if(!isLaserCannon && mDamage > ret.damage && !ret.count) { // Other multishot weapons
      ret.count = Math.round(mDamage / ret.damage)
    }
    if(category === 'rocket' && tags.includes('delay_burst')) {
      const idx = tags.indexOf('delay_burst')
      tags[idx] = 'delay_blast'
    }
    if(category === 'missile') {
      ret.lockTimeSeconds = Math.max(
        obj2.m_fFirstLockElapsedTime,
        obj2.m_fLockElapsedTime,
      )
      ret.burst = obj2.m_fLockCount
      ret.lockArea = [obj2.m_fScreenRateX, obj2.m_fScreenRateY]
      ret.lockRange = obj2.m_fLockOnLength
    }
    if(wpn.m_stTimePowerUpArray.length) {
      let lastDmg = dmg
      ret.growth = wpn.m_stTimePowerUpArray.map(step => {
        let sDmg = dmgs[step.sStrikeId] || lastDmg
        lastDmg = sDmg
        return {
          n: step.sPowerUpNum,
          range: step.fShotRange / 100,
          damage: sDmg.fDamageAmount,
        }
      })
    }
    if(tags.length) {
      ret.tags = tags
    }
    return ret
  }).filter(wpn => wpn)
}

async function extractCalcdata() {
  const weapons = await extractGunStats('WeaponParam')
  // return console.log(Array.from(lines).sort().join('\n'))
  return {
    langs: ['en', 'ja'],
    classes: [
      'weapons',
      // 'items',
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
