const syncFs = require('fs')
const process = require('process')
const fs = syncFs.promises

const classes = [
  'ranger',
  'winger',
  'bomber',
]

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
      'range',
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
      'piercing',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'range',
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
      'damage',
      'interval',
      'reload',
      'accuracy',
      'range',
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
      'lockRange',
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
        'duration',
        'radius',
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
      subCategory: 'decoy',
      names: {
        en: 'Decoys',
        ja: 'ピュアデコイ・ランチャー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'hp',
        'duration',
        'reload',
      ],
    }, {
      subCategory: 'bound',
      names: {
        en: 'Bound Guns',
        ja: 'バウンドガン・シリーズ',
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
        'dps',
        'tdps',
        'total',
      ],
    }, {
      subCategory: 'flame',
      names: {
        en: 'Flamethrowers',
        ja: '火炎放射器シリーズ',
      },
      appendix: '*Assuming flame hits every frame of duration.',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'interval',
        'reload',
        'range',
      ],
    }, {
      names: {
        en: 'Reversers',
        ja: 'リバーサー',
      },
      subCategory: 'reverser',
      appendix: '*Assuming mist hits every frame of duration.',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'zoom',
      ],
    }, {
      subCategory: 'acid',
      names: {
        en: 'Insecticide Spray',
        ja: '殺虫スプレーEX',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'reload',
        'zoom',
      ],
    }, {
      subCategory: 'firecracker',
      names: {
        en: 'Firecrackers',
        ja: 'かんしゃく玉シリーズ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'damage',
        'radius',
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
        'reload',
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
        'reload',
        'total',
      ],
    }],
  }],
  winger: [{
    category: 'short',
    names: {
      en: 'Short-Range',
      ja: '近距離',
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
      'energy',
      'range',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'laser',
    names: {
      en: 'Mid-Rg Lasers',
      ja: '中距離-レーザー',
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
      'energy',
      'range',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'electro',
    names: {
      en: 'Mid-Rg Electroshock',
      ja: '中距離-電撃',
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
      'energy',
      'range',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'particle',
    names: {
      en: 'Particle Cannons',
      ja: '中距離-粒子砲',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'range',
      'dps',
    ],
  }, {
    category: 'sniper',
    names: {
      en: 'Sniper Weapons',
      ja: '狙撃兵器',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'piercing',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'range',
      'dps',
    ],
  }, {
    category: 'plasma',
    names: {
      en: 'Ranged Attacks',
      ja: '範囲攻撃',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'radius',
      'interval',
      'reload',
      'accuracy',
      'energy',
      'range',
      'dps',
      'tdps',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Homing Weapons',
      ja: 'ホーミング兵器',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'radius',
      'interval',
      'energy',
      'dps',
    ],
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'shots',
      'reload',
      'energy',
      'tdps',
      'total',
    ],
  }],
  bomber: [{
    category: 'artillery',
    names: {
      en: 'Request Artillery Units',
      ja: '砲兵隊',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'reload',
      'total',
    ],
  }, {
    category: 'gunship',
    names: {
      en: 'Request Gunships',
      ja: '攻撃機ホエール',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'reload',
      'tdps',
      'total',
    ],
  }, {
    category: 'planes',
    names: {
      en: 'Request Bombers',
      ja: '爆撃機カロン＆ミッドナイト',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'reload',
      'total',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Request Missiles',
      ja: 'ミサイル',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'credits',
      'reload',
      'tdps',
      'total',
    ],
  }, {
    category: 'satellite',
    names: {
      en: 'Request Satellites',
      ja: '攻撃機ホエール',
    },
    headers: [
      'checkbox',
      'level',
      'name',
      'damage',
      'shots',
      'radius',
      'credits',
      'reload',
      'range',
      'tdps',
      'total',
    ],
  }, {
    category: 'limpet',
    names: {
      en: 'Limpet Guns',
      ja: 'リムペットガン',
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
      'range',
      'dps',
      'tdps',
      'total',
    ],
  }, {
    category: 'deploy',
    names: {
      en: 'Umanned Weapons',
      ja: '設置兵器',
    },
    tables: [{
      subCategory: 'roomba',
      names: {
        en: 'Roller Bombs',
        ja: 'ローラーボム',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'reload',
        'total',
      ],
    }, {
      subCategory: 'patroller',
      names: {
        en: 'Patrollers',
        ja: 'パトローラー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'reload',
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
        'reload',
        'total',
      ],
    }, {
      subCategory: 'beetle',
      names: {
        en: 'Assault Beetles',
        ja: 'アサルトビートル',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'reload',
        'total',
      ],

    }],
  }, {
    category: 'support',
    names: {
      en: 'Support Gear',
      ja: 'サポート装置',
    },
    tables: [{
      subCategory: 'life',
      names: {
        en: 'Life Vendors',
        ja: 'ライフベンダー',
      },
      appendix: '*expending all ammo',
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'dps',
        'dps2',
        'total',
        'total2',
      ],
    }, {
      subCategory: 'plasma',
      names: {
        en: 'Plasma Chargers',
        ja: 'プラズマチャージャー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'reload',
      ],
    }, {
      subCategory: 'power',
      names: {
        en: 'Power Assists',
        ja: 'パワーポスト',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'reload',
      ],
    }, {
      subCategory: 'guard',
      names: {
        en: 'Guard Assists',
        ja: 'ガードポスト',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'radius',
        'duration',
        'reload',
      ],
    }],
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    tables: [{
      subCategory: 'wire',
      names: {
        en: 'Wire Guns',
        ja: 'ワイヤー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'damage',
        'reload',
      ],
    }, {
      subCategory: 'decoy',
      names: {
        en: 'Decoys',
        ja: 'ピュアデコイ・ランチャー',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'hp',
        'duration',
        'reload',
      ],
    }, {
      subCategory: 'defensive',
      names: {
        en: 'Defensive',
        ja: 'トーチカ',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'hp',
        'reload',
      ],
    }],
  }, {
    category: 'guide',
    names: {
      en: 'Guidance Equipment',
      ja: '誘導装置',
    },
    tables: [{
      subCategory: 'laser',
      names: {
        en: 'Laser Guide Kits',
        ja: 'レーザー誘導装置',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'range',
      ],
    }, {
      subCategory: 'beacon',
      names: {
        en: 'Guide Beacon Guns',
        ja: '誘導ビーコンガン',
      },
      headers: [
        'checkbox',
        'level',
        'name',
        'ammo',
        'range',
      ],
    }],
  }],
}

const modes = [{
  name: 'ON',
  missions: 78,
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

const dictionary = {
  Lv: 'level',
  '武器名': 'name',
  '弾数': 'ammo',
  'ダメージ': 'damage',
  '連射速度 (発/sec)': 'rof',
  '爆破範囲 (半径m)': 'radius',
  '爆破範囲 (m)': 'radius',
  '倍率': 'magnification', // Air Raider support tools effect
  '効果範囲 (半径m)': 'radius', // Air Raider support tools radius
  '回復量 (F)': 'recoveryAmount', // Air Raider support tools heal
  '攻撃範囲 (半径m)': 'radius',
  '進入方向': 'raidDirection',
  '飛行隊形': 'raidFormation',
  'リロード (sec)': 'reloadSeconds',
  'チャージ (sec)': 'reloadSeconds', // Palewing bg reload
  'リロード (pts)': 'reloadCredits',
  '起爆時間 (sec)': 'fuseSeconds',
  '起爆時間': 'fuseSeconds',
  '起爆条件': 'fuseType',
  '射程距離 (m)': 'range',
  '誘導距離 (m)': 'lockRange',
  '誘導性能': 'homingRank',
  '精度': 'accuracyRank',
  '集弾率/精度': 'accuracyRank', // Shotgun spread
  'ズーム (倍率)': 'zoom',
  '備考': 'remarks',
  '回復量': 'damage',
  '噴霧数': 'ammo',
  '設置数': 'ammo',
  '耐久度': 'hp',
  '攻撃方向': 'attackDirection',
  '効果時間 (sec)': 'durationSeconds',
  '有効距離 (半径m)': 'range',
  '搭載弾薬 (発)': 'shots',
  '探知距離 (半径m)': 'searchRange', // Ranger mines
  '索敵距離 (m)': 'turretRange', // Air Raider turrets
  '探知距離 (m)': 'patrollerRange',
  '全弾直撃火力': 'shotTotal',
  '発射数': 'shots',
  '消費EN (%)': 'energy',
  '接触': 'contact',
  '時間': 'timed',
  '小': 'Low',
  '小＋': 'Low+',
  '小＋＋': 'Low++',
  '中': 'Middle',
  '中＋': 'Middle+',
  '大': 'High',
  '大＋': 'High+',
  'ムズムズする？': 'Negligible',
  TTFP: 'dps',
  PTFP: 'tdps',
}

const specialProps = {
  damage: (wpn, prop) => {
    if(prop === '-') {
      return
    } else if(!prop) {
      return
    } else if(prop.includes('*')) {
      const [damage, count] = prop.split('*')
      wpn.damage = +damage
      wpn.count = +count
    } else if(isNaN(prop)) {
      wpn.damageRank = {
        ja: prop,
      }
      const en = dictionary[prop]
      if(en) {
        wpn.damageRank.en = en
      }
    } else {
      wpn.damage = +prop
    }
  },
  shots: (wpn, prop) => {
    if(prop.includes('*')) {
      const [shots, count] = prop.split('*')
      wpn.shots = +shots
      wpn.count = +count
    } else {
      return wpn.shots = +prop
    }
  },
  reloadCredits: (wpn, prop) => {
    wpn.credits = true
    wpn.reload = +prop
  },
  magnification: (wpn, prop) => {
    wpn.damage = +prop
  },
  dps: () => {},
  tdps: () => {},
  fuseType: (wpn, prop) => {
    wpn.fuseType = {
      ja: prop,
    }
    const en = dictionary[prop]
    if(en) {
      wpn.fuseType.en = en
    }
  },
}

async function extractWeaponData() {
  const categories = classes.flatMap(ch => {
    return headers[ch].map(cat => {
      return {
        character: ch,
        category: cat.category,
      }
    })
  })
  const data = await Promise.all(categories.map(async c => {
    const {
      character,
      category,
    } = c
    const path = `data/2PV2/${character}-${category}.tsv`
    const text = await fs.readFile(path, 'utf8')
    const enPath = `data/2PV2/${character}-${category}-en.tsv`
    const enText = await fs.readFile(enPath, 'utf8')

    return {
      character,
      category,
      text,
      enText,
    }
  }))
  return data.flatMap(({ character, category, text, enText }) => {
    let headers
    let headerIdx = -1
    const rows = text.split('\n')
    const enRows = enText.split('\n')
    return rows
      .reduce((acc, r, i) => {
        const row = r.split('\t').map(r => r.trim())
        if(row.length < 2) {
          return acc
        }
        const [idxAdjust, enName] = enRows[i].split('\t')
        if(row[0] === 'Lv') {
          headerIdx++
          headers = row.map(h => {
            const translated = dictionary[h]
            return translated || h
          })
          return acc
        }
        const wpn = {
          id: `${character}-${category}-${i}`,
          idx: i,
          idxAdjust,
          character,
          category,
        }
        for(let i = 0; i < headers.length; i++) {
          const h = headers[i]
          const prop = row[i]
          if(!prop) {
            continue
          }
          if(prop === '-') {
            continue
          }
          if(specialProps[h]) {
            specialProps[h](wpn, prop)
            continue
          }
          if(isNaN(prop)) {
            wpn[h] = prop
          } else {
            wpn[h] = +prop
          }
        }

        if(character === 'ranger') {
          if(category === 'grenade') {
            if(!wpn.reloadSeconds) {
              wpn.subCategory = 'hg'
            } else {
              wpn.subCategory = 'gl'
            }
          } else if(category === 'special') {
            wpn.subCategory = [
              'decoy',
              'bound',
              'flame',
              'reverser',
              'reverser',
              'reverser',
              'acid',
              'firecracker',
              'bomb',
              'mine',
            ][headerIdx] || 'reverser'
          }
        } else if(character === 'winger') {
          if(wpn.name == 'グングニル') {
            delete wpn.rof
          }
        } else if(character === 'bomber') {
          if(category === 'support') {
            wpn.subCategory = [
              'life',
              'life',
              'plasma',
              'plasma',
              'power',
              'power',
              'guard',
              'guard',
            ][headerIdx] || 'guard'
          } else if(category === 'deploy') {
            wpn.subCategory = [
              'roomba',
              'patroller',
              'turret',
              'beetle',
            ][headerIdx] || 'guard'
          } else if(category === 'special') {
            wpn.subCategory = [
              'wire',
              'decoy',
              'defensive',
            ][headerIdx] || 'defensive'
          } else if(category === 'guide') {
            wpn.subCategory = [
              'laser',
              'beacon',
            ][headerIdx] || 'beacon'
          }
        }

        wpn.names = {
          en: enName,
          ja: wpn.name,
        }

        delete wpn.name

        acc.push(wpn)
        return acc
      }, [])
    })
    .sort((a, b) => {
      const adjustDiff = a.idxAdjust - b.idxAdjust
      if(adjustDiff) {
        return adjustDiff
      }
      return a.idx - b.idx
    })
}


async function extractCalcdata() {
  const [
    weapons,
  ] = await Promise.all([
    extractWeaponData(),
  ])
  return {
    langs: ['en', 'ja'],
    classes,
    charLabels: [
      'Trooper',
      'Palewing',
      'Air Raider',
    ],
    headers,
    weapons,
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
