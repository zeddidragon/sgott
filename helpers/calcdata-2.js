const fs = require('fs/promises')

const classes = [
  'ranger',
  'winger',
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
      'name',
      'ammo',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'zoom',
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
    category: 'sniper',
    names: {
      en: 'Sniper Rifles',
      ja: 'スナイパーライフル',
    },
    headers: [
      'checkbox',
      'name',
      'ammo',
      'damage',
      'interval',
      'reload',
      'accuracy',
      'zoom',
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
      'name',
      'ammo',
      'damage',
      'radius',
      'interval',
      'reload',
      'lockRange',
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
      subCategory: 'bound',
      names: {
        en: 'Bound Guns',
        ja: 'バウンドガン・シリーズ',
      },
      headers: [
        'checkbox',
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
      headers: [
        'checkbox',
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
      headers: [
        'checkbox',
        'name',
        'ammo',
        'damage',
        'zoom',
        'total',
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
      'eps',
      'dpe',
    ],
  }, {
    category: 'laser',
    names: {
      en: 'Mid-Rg Lasers',
      ja: '中距離-レーザー',
    },
    headers: [
      'checkbox',
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
      'eps',
      'dpe',
    ],
  }, {
    category: 'electro',
    names: {
      en: 'Mid-Rg Electroshock',
      ja: '中距離-電撃',
    },
    headers: [
      'checkbox',
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
      'eps',
      'dpe',
    ],
  }, {
    category: 'particle',
    names: {
      en: 'Particle Cannons',
      ja: '中距離-粒子砲',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'range',
      'dps',
      'eps',
      'dpe',
    ],
  }, {
    category: 'sniper',
    names: {
      en: 'Sniper Weapons',
      ja: '狙撃兵器',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'range',
      'dps',
      'eps',
      'dpe',
    ],
  }, {
    category: 'plasma',
    names: {
      en: 'Ranged Attacks',
      ja: '範囲攻撃',
    },
    headers: [
      'checkbox',
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
      'eps',
      'dpe',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Homing Weapons',
      ja: 'ホーミング兵器',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'radius',
      'interval',
      'energy',
      'dps',
      'eps',
      'dpe',
    ],
  }, {
    category: 'special',
    names: {
      en: 'Special Weapons',
      ja: '特殊',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'shots',
      'reload',
      'energy',
      'tdps',
      'total',
      'eps',
      'dpe',
    ],
  }],
}

const modes = [{
  name: 'OFF',
  missions: 71,
}]
const difficulties = [
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
]

const dictionary = {
  '接触': 'contact',
  '時間': 'timed',
  'ﾑｽﾞﾑｽﾞ？': 'Itchy?',
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
    } else if(!isNaN(prop)) {
      wpn.damage = +prop
    }
  },
  damageRank: (wpn, prop) => {
    wpn.damageRank = {
      ja: prop,
    }
    const en = dictionary[prop]
    if(en) {
      wpn.damageRank.en = en
    }
  },

  zoom: (wpn, prop) => {
    wpn.zoom = +prop.replace('倍', '')
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
  dps: () => {},
  tdps: () => {},
  remark: () => {},
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
    const path = `data/2/${character}-${category}.tsv`
    const text = await fs.readFile(path, 'utf8')
    const enPath = `data/2/${character}-${category}-en.tsv`
    const enText = await fs.readFile(enPath, 'utf8')

    return {
      character,
      category,
      text,
      enText,
    }
  }))
  return data.flatMap(({ character, category, text, enText }) => {
    const rows = text
        .trim()
        .split('\n')
        .map(row => row.split('\t').map(cell => cell.trim()))
    const enRows = enText
        .split('\n')
        .map(row => row.trim())
    let headers
    return rows
      .reduce((acc, row, i) => {
        if(row.length < 2) {
          return acc
        }
        if(row[0] === 'name') {
          headers = row
          return acc
        }
        const enName = enRows[i]
        const wpn = {
          id: `${character}-${category}-${i}`,
          idx: i,
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
          if(prop.startsWith('--')) {
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
            wpn.subCategory = (() => {
              if(enName.startsWith('Bound')) return 'bound'
              if(enName.startsWith('Repair')) return 'reverser'
              if(enName.startsWith('Insecticide')) return 'reverser'
              if(enName.includes('Firecracker')) return 'firecracker'
              return 'flame'
            })()
          }
        } else if(character === 'winger') {
          if(wpn.name == 'グングニル') {
            delete wpn.rof
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
    ],
    headers,
    weapons,
    modes,
  }
}

module.exports = extractCalcdata
