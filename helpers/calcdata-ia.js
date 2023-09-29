const syncFs = require('fs')
const process = require('process')
const fs = syncFs.promises

const classes = {
  TR: 'ranger',
  JT: 'winger',
  BA: 'fencer',
  TA: 'bomber',
}

const categories = {
  AR: 'assault',
  SH: 'shotgun',
  RL: 'rocket',
  ML: 'missile',
  GL: 'grenade',
  SR: 'sniper',
}

const modes = [{
  name: 'ON',
  missions: 15,
  difficulties: [{
    name: 'Easy',
    weaponLimits: [0, 1],
  }, {
    name: 'Normal',
    weaponLimits: [2, 3],
  }, {
    name: 'Hard',
    weaponLimits: [4, 5],
  }, {
    name: 'Hardest',
    weaponLimits: [6, 7],
  }, {
    name: 'Inferno',
  }],
}]

const gunStats = [
  'checkbox',
  'unlock',
  'level',
  'name',
  'ammo',
  'damage',
  'interval',
  'reload',
  'dps',
  'tdps',
  'total',
]

const bombStats = [
  'checkbox',
  'unlock',
  'level',
  'name',
  'ammo',
  'damage',
  'radius',
  'interval',
  'reload',
  'dps',
  'tdps',
  'total',
]

const tacticalStats = [
  'checkbox',
  'level',
  'name',
  'energy',
  'damage',
  'interval',
  'duration',
  'dps',
  'total',
]

const tacticalItems = [{
  level: 1,
  name: 'E-Tac Machine Gun Turret Rank 1',
  energy: 70,
  damage: 10,
  rof: 5,
  duration: 60,
  knockback: true,
}, {
  level: 5,
  name: 'E-Tac Machine Gun Turret Rank 2',
  energy: 70,
  damage: 80,
  rof: 5,
  duration: 90,
  knockback: true,
}, {
  level: 7,
  name: 'E-Tac Machine Gun Turret Rank 3',
  energy: 70,
  damage: 325,
  rof: 5,
  duration: 120,
  knockback: true,
}, {
  level: 1,
  name: 'E-Tac Plasma Gun Turret Rank 1',
  energy: 70,
  damage: 100,
  rof: 0.5,
  duration: 60,
}, {
  level: 5,
  name: 'E-Tac Plasma Gun Turret Rank 1',
  energy: 70,
  damage: 800,
  rof: 0.5,
  duration: 90,
}, {
  level: 7,
  name: 'E-Tac Plasma Gun Turret Rank 1',
  energy: 70,
  damage: 3200,
  rof: 0.5,
  duration: 120,
}, {
  level: 1,
  name: 'Contact Mine Rank 1',
  energy: 10,
  damage: 300,
}, {
  level: 5,
  name: 'Contact Mine Rank 2',
  energy: 10,
  damage: 1600,
}, {
  level: 7,
  name: 'Contact Mine Rank 3',
  energy: 10,
  damage: 6000,
}, {
  level: 3,
  name: 'TP-59 Sscanner',
  energy: 20,
  duration: 120,
}, {
  level: 6,
  name: 'Proximity Mine Rank 1',
  energy: 10,
  damage: 2000,
}, {
  level: 7,
  name: 'Proximity Mine Rank 2',
  energy: 10,
  damage: 8000,
}, {
  level: 5,
  name: 'E-Tac Missile Turret Rank 1',
  energy: 70,
  damage: 500,
  rof: 0.4,
  duration: 75,
}, {
  level: 7,
  name: 'E-Tac Missile Turret Rank 2',
  energy: 70,
  damage: 2000,
  rof: 0.4,
  duration: 105,
}, {
  level: 6,
  name: 'E-Tac Autocannon Turret Rank 1',
  energy: 70,
  damage: 107,
  rof: 7.5,
  duration: 60,
}, {
  level: 7,
  name: 'E-Tac Autocannon Turret Rank 2',
  energy: 70,
  damage: 214,
  rof: 7.5,
  duration: 90,
}, {
  level: 6,
  name: 'E-Tac Rocket Turret Rank 1',
  energy: 70,
  damage: 1200,
  rof: 0.67,
  duration: 60,
}, {
  level: 7,
  name: 'E-Tac Rocket Turret Rank 2',
  energy: 70,
  damage: 2400,
  rof: 0.67,
  duration: 90,
}].map((wpn, i) => {
  if(wpn.duration) {
    const shots = Math.floor(wpn.duration * wpn.rof)
    wpn.total = shots * wpn.damage
  }
  return {
    id: `tactical${i + 1}`,
    character: 'bomber',
    category: 'deploy',
    ...wpn,
    duration: wpn.duration * 60,
  }
})

const missileStats = bombStats

const assault = {
  category: 'assault',
  names: {
    en: 'Assault Rifle',
    ja: 'アサルトライフル',
  },
  headers: gunStats,
}

const shotgun = {
  category: 'shotgun',
  names: {
    en: 'Shotguns',
    ja: 'ショットガン',
  },
  headers: gunStats,
}

const sniper = {
  category: 'sniper',
  names: {
    en: 'Sniper Rifles',
    ja: 'スナイパーライフル',
  },
  headers: gunStats,
}

const rocket = {
  category: 'rocket',
  names: {
    en: 'Rocket Launchers',
    ja: 'ロケットランチャー',
  },
  headers: bombStats,
}

const grenade = {
  category: 'grenade',
  names: {
    en: 'Grenade Launchers',
    ja: 'グレネードランチャー',
  },
  headers: bombStats,
}

const missile = {
  category: 'missile',
  names: {
    en: 'Missile Launchers',
    ja: '戦術アイテム',
  },
  headers: missileStats,
}

const tactical = {
  category: 'deploy',
  names: {
    en: 'Tactical Equipment',
    ja: '戦術アイテム',
  },
  headers: tacticalStats,
}

const headers = {
  ranger: [assault, shotgun, sniper, rocket, grenade, missile],
  winger: [assault, sniper, rocket, grenade, missile],
  fencer: [assault, shotgun, rocket, grenade, missile],
  bomber: [assault, shotgun, rocket, grenade, missile, tactical],
}

async function extractCalcdata() {
  const file = await fs.readFile('data/ia/weapons.csv', 'utf8')
  const [, ...rows] = file.split('\n').map(row => row.split(';'))
  rows.pop()
  const weapons = rows.map((row, i) => {
    const reload = +row[9]
    let name = row[0]
    let unlockState = void 0
    if(name.endsWith('^') || name.endsWith('#')){
      unlockState = 'dlc'
      name = name.slice(0, -1)
    }
    if(name.endsWith('*')) {
      unlockState = 'box'
      name = name.slice(0, -1)
    }
    return {
      id: `weapon${i + 1}`,
      name: name,
      character: classes[row[1]],
      category: categories[row[2]],
      level: +row[3],
      count: row[4] > 1 ? +row[4] : void 0,
      damage: +row[5],
      burst: row[6] > 1 ? +row[6] : void 0,
      rof: +row[7] || 1,
      ammo: +row[8],
      reloadSeconds: reload,
      radius: row[10] > 0 ? +row[10] : void 0,
      unlock: unlockState,
    }
  })
  return {
    langs: ['en'],
    classes: [
      'fencer',
      'winger',
      'bomber',
      'ranger',
    ],
    charLabels: [
      'Battle',
      'Jet',
      'Tactical',
      'Trooper',
    ],
    headers,
    weapons: [...weapons, ...tacticalItems],
    modes,
  }
}

extractCalcdata()
  .then(data => {
    console.log(JSON.stringify(data, null, 2))
  })
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
