const fs = require('fs/promises')

const classes = [
  'ranger',
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
    }],
  }],
}

const modes = [{
  name: 'OFF',
  missions: 17,
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
}

const specialProps = {
  damage: (wpn, prop) => {
    if(prop === '-') {
      return
    } else if(!prop) {
      return
    } else if(prop.includes('X')) {
      const [damage, count] = prop.split('X')
      wpn.damage = +damage
      wpn.count = +count
    } else if(!isNaN(prop)) {
      wpn.damage = +prop
    }
  },
  zoom: (wpn, prop) => {
    wpn.zoom = +prop.replace('倍', '')
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
    const path = `data/1/${character}-${category}.tsv`
    const text = await fs.readFile(path, 'utf8')
    const enPath = `data/1/${character}-${category}-en.tsv`
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

        if(category === 'grenade') {
          if(!wpn.reloadSeconds) {
            wpn.subCategory = 'hg'
          } else {
            wpn.subCategory = 'gl'
          }
        }

        if(category === 'special') {
          if(enName.startsWith('Bound')) {
            wpn.subCategory = 'bound'
          } else {
            wpn.subCategory = 'flame'
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
    ],
    headers,
    weapons,
    modes,
  }
}

module.exports = extractCalcdata
