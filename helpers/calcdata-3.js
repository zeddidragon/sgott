const fs = require('fs/promises')
const getNode = require('./get-node.js')
const bullets = require('./bullets.js')

bullets.assignGame(3)

function loadJson(path) {
  return fs.readFile(`data/3/${path}.json`).then(data => JSON.parse(data))
}

const classes = [
  'ranger',
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
    'repair',
  ],
}

const unlockStates = [
  '',
  'starter',
  'dlc',
  'dlc',
]

const autoProps = {
  type: 'AmmoClass',
  ammo: 'AmmoCount',
  damage: 'AmmoDamage',
  speed: 'AmmoSpeed',
  accuracy: 'FireAccuracy',
  radius: 'AmmoExplosion',
  energy: 'EnergyDrain',
  life: 'AmmoAlive',
  burst: 'FireBurstCount',
  burstRate: 'FireBurstInterval', count: 'FireCount',
  interval: 'FireInterval',
  reload: 'ReloadTime',
  secondary: 'SecondaryFire_Type',
  zoom: 'SecondaryFire_Parameter',
  custom: 'Ammo_CustomParameter',
}

const modes = [{
  name: 'ON',
  missions: 60,
  difficulties: [{
    name: 'Easy',
    weaponLimits: [
      1,
      25
    ],
    armorLimits: [
      400,
      1500,
    ]
   }, {
    name: 'Normal',
    weaponLimits: [
      1,
      25
    ],
    armorLimits: [
      400,
      1500,
    ]
  }, {
    name: 'Hard',
    weaponLimits: [
      25,
      50,
    ],
    armorLimits: [
      1500,
      3000,
    ]
  }, {
    name: 'Hardest',
    weaponLimits: [
      50,
      75,
    ],
    armorLimits: [
      3000,
      4000,
    ]
  }, {
    name: 'Inferno',
    weaponLimits: [
      75,
      100,
      null,
      null
    ],
    armorLimits: null
  }],
}]

const headers = {
  ranger: [{
    category: 'assault',
    names: {
      en: 'Assault Rifle',
      ja: 'アサルトライフル',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
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
    ],
  }, {
    category: 'shotgun',
    names: {
      en: 'Shotguns',
      ja: 'ショットガン',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'range',
      'speed',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'sniper',
    names: {
      en: 'Sniper Rifles',
      ja: 'スナイパーライフル',
    },
    headers: [
      'checkbox',
      'level',
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
    ],
  }, {
    category: 'rocket',
    names: {
      en: 'Rocket Launchers',
      ja: 'ロケットランチャー',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'reload',
      'accuracy',
      'zoom',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Missile Launchers',
      ja: 'ミサイルランチャー',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'reload',
      'zoom',
      'tdps',
      'total',
    ],
  }, {
    category: 'grenade',
    names: {
      en: 'Grenades',
      ja: 'グレネード',
    },
    tables: [{
      subCategory: 'hg',
      names: {
        en: 'Hand Grenades',
        ja: 'ハンドグレネード',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'radius',
        'duration',
        'interval',
        'tdps',
      ],
    }, {
      subCategory: 'gl',
      names: {
        en: 'Grenade Launchers',
        ja: 'グレネードランチャー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'interval',
        'reload',
        'accuracy',
        'dps',
        'tdps',
        'total',
      ],
    }],
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    tables: [{
      subCategory: 'acid',
      names: {
        en: 'Acid Guns',
        ja: 'アシッドガン・シリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'range',
        'speed',
        'dps',
        'tdps',
        'total',
      ],
    }, {
      names: {
        en: 'Flamethrowers',
        ja: '火炎放射器シリーズ',
      },
      subCategory: 'flame',
      appendix: '*Assuming flame hits every frame of duration.',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'damage2',
        'duration',
        'interval',
        'reload',
        'range',
        'speed',
        'dps',
        'dps2',
        'tdps',
        'tdps2',
        'total',
        'total2',
      ],
    }, {
      subCategory: 'bomb',
      names: {
        en: 'Bombs',
        ja: 'ローラーボムシリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'interval',
        'reload',
        'speed',
        'tdps',
        'total',
      ],
    }, {
      subCategory: 'mine',
      names: {
        en: 'Land Mines',
        ja: 'インパルスシリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'tdps',
        'total',
      ],
    }, {
      subCategory: 'turret',
      names: {
        en: 'Automatic Turrets',
        ja: 'ZE-GUNシリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'shots',
        'radius',
        'interval',
        'reload',
        'dps',
        'tdps',
        'total',
      ],
    }, {
      names: {
        en: 'Firecrackers',
        ja: 'かんしゃく玉シリーズ',
      },
      subCategory: 'firecracker',
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'radius',
        'interval',
        'range',
        'speed',
        'tdps',
        'total',
      ],
    }, {
      names: {
        en: 'Bound Guns',
        ja: 'バウンドガン・シリーズ',
      },
      subCategory: 'bound',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'range',
        'speed',
        'dps',
        'tdps',
        'total',
      ],
    }],
  }],
}

async function processWeapon({ value: node }, character) {
  const id = node[0].value
  const lvBuffer = new Buffer(4)
  lvBuffer.writeFloatLE(node[3].value * 25)
  const level = Math.floor(lvBuffer.readFloatLE())
  const category = node[1].value
  const group = categories[character][category]

  const template = await loadJson(`weapon/${id}`)
  const name = getNode(template, 'name').value
  const wpn = {
    id: id,
    names: { en: name },
    level: level,
    character: character,
    category: group,
    odds: (Math.floor(node[2].value * 100)),
  }

  for(const [prop, node] of Object.entries(autoProps)) {
    const v = getNode(template, node)?.value
    if(v) {
      wpn[prop] = v
    }
  }

  wpn.accuracy = +(wpn.accuracy || 0).toFixed(4)
  await bullets[wpn.type]?.(wpn)
  groups[group]?.(wpn)

  for(const prop of [
    'burst',
    'count',
  ]) {
    if(wpn[prop] === 1) {
      delete wpn[prop]
    }
  }
  for(const prop of [
    'damage',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = +wpn[prop].toFixed(1)
    }
  }
  for(const prop of [
    'speed',
  ]) {
    if(wpn[prop]) {
      wpn[prop] = +wpn[prop].toFixed(3)
    }
  }

  if(wpn.character === 'ranger') {
    if(wpn.category === 'grenade') {
      if(!wpn.reload) {
        wpn.subCategory = 'hg'
      } else {
        wpn.subCategory = 'gl'
      }
    } else if(wpn.category === 'special') {
      if(wpn.type === 'AcidAmmo01') {
        wpn.subCategory = 'acid'
      } else if(wpn.type === 'FireAmmo01') {
        wpn.subCategory = 'flame'
      } else if(wpn.type === 'CentryGun01') {
        wpn.subCategory = 'turret'
      } else if(wpn.names.en.endsWith('Impulse')) {
        wpn.subCategory = 'mine'
      } else if(wpn.type === 'BombAmmo01') {
        wpn.subCategory = 'bomb'
      } else if(wpn.type === 'GrenadeAmmo01') {
        wpn.subCategory = 'firecracker'
      } else {
        wpn.subCategory = 'bound'
      }
    }
  }

  delete wpn.custom
  delete wpn.wCustom

  return wpn
}

const groups = {
  guide: wpn => {
    wpn.lockTime = +wpn.custom[0].value.toFixed(1)
    wpn.lockRange = +wpn.custom[1].value.toFixed(1)
  },
  support: wpn => {
    wpn.duration = wpn.life
  },
}

async function extractWeaponData(character) {
  const path = 'weapon/WeaponTable'
  const table = await loadJson(path)
  return Promise.all(table.variables[0].value
    .map(v => processWeapon(v, character)))
}
const difficulties = [
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
]
async function processMode({ value: mode }) {
  const key = mode[0].value
  const lvBuffer = Buffer.alloc(4)
  const obj = {
    ...modes[key],
    difficulties: mode[6].value.map(({ value: d }, i) => {
      const { missions } = modes[key]
      const dropsLow = Array(missions)
      const dropsHigh = Array(missions)
      const [start, end] = d[2].value.slice(0, 2).map(v => v.value)
      const spread = d[2].value[2].value
      const range = end - start
      for(let i = 0; i < missions; i++) {
        const pivot = start + (range / (missions - 1)) * i
        lvBuffer.writeFloatLE(pivot - spread)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsLow[i] = Math.floor(lvBuffer.readFloatLE())
        lvBuffer.writeFloatLE(pivot)
        lvBuffer.writeFloatLE(lvBuffer.readFloatLE() * 25)
        dropsHigh[i] = Math.ceil(lvBuffer.readFloatLE())
      }
      return {
        name: difficulties[i],
        progressScaling: d[0].value.map(v => v.value),
        playerScaling: d[1].value.map(v => +v.value.toFixed(2)),
        drops: d[2].value.slice(0, 2).map(v => +(v.value * 25).toFixed(2)),
        dropSpread: +(d[2].value[2].value * 25).toFixed(2),
        dropsLow,
        dropsHigh,
        weaponLimits: d[6].value ? d[6].value.map(v => {
          if(v.value >= 0) {
            return +(v.value * 25).toFixed(2)
          } else {
            return null
          }
        }) : -1,
        armorLimits: d[7].value ? d[7].value.map(v => v.value) : null,
      }
    }),
  }
  return obj
}
 
async function extractCalcdata() {
  const [
    weapons,
    pWeapons,
  ] = await Promise.all([
    extractWeaponData('ranger'),
  ])
  return {
    langs: ['en'],
    classes,
    charLabels: [
      'Storm',
    ],
    headers,
    weapons: [
      ...weapons,
    ],
    modes,
  }
}

module.exports = extractCalcdata
