const fs = require('fs/promises')

const classes = [
  'winger',
]

const headers = {
  winger: [{
    category: 'particle',
    names: {
      en: 'Particle Cannon',
      ja: '中距離-粒子砲',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'dps',
    ],
  }, {
    category: 'short',
    names: {
      en: 'Short-Range',
      ja: '近距離',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'dps',
      'eps',
      'dpe',
    ],
  }, {
    category: 'missile',
    names: {
      en: 'Homing',
      ja: 'ホーミング兵器',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'radius',
      'interval',
      'lockTime',
      'energy',
      'dps',
      'eps',
      'dpe',
    ],
  }, {
    category: 'electro',
    names: {
      en: 'Electroshock',
      ja: '中距離-電撃',
    },
    headers: [
      'checkbox',
      'name',
      'ammo',
      'damage',
      'interval',
      'energy',
      'dps',
      'eps',
      'dpe',
    ],
  }, {
    category: 'laser',
    names: {
      en: 'Laser',
      ja: '中距離-レーザー',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'interval',
      'accuracy',
      'energy',
      'dps',
      'eps',
      'dpe',
    ],
  }, {
    category: 'plasma',
    names: {
      en: 'Ranged',
      ja: '範囲攻撃',
    },
    headers: [
      'checkbox',
      'name',
      'damage',
      'radius',
      'interval',
      'accuracy',
      'energy',
      'dps',
      'eps',
      'dpe',
    ],
  }],
}

const modes = [{
  name: 'OFF',
  missions: 6,
}]
const difficulties = [
  'Easy',
  'Normal',
  'Hard',
  'Hardest',
  'Inferno',
  'Extra',
]

const specialProps = {
  damage: (wpn, prop) => {
    if(prop === '-') {
      return
    } else if(!prop) {
      return
    } else if(prop.includes('x')) {
      const [damage, count] = prop.split('x')
      wpn.damage = +damage
      wpn.count = +count
    } else if(!isNaN(prop)) {
      wpn.damage = +prop
    }
  },
  accuracy: (wpn, prop) => {
    wpn.accuracyRank = prop
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
    const path = `data/wdts/${character}-${category}.csv`
    const text = await fs.readFile(path, 'utf8')

    return {
      character,
      category,
      text,
    }
  }))
  return data.flatMap(({ character, category, text }) => {
    const [headers, ...rows] = text
        .trim()
        .split('\n')
        .map(row => row.split(',').map(cell => cell.trim()))
    return rows
      .reduce((acc, row, i) => {
        if(row.length < 2) {
          return acc
        }
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

        wpn.names = {
          en: wpn.name,
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
    langs: ['en'],
    classes,
    charLabels: [
      'Wing Diver',
    ],
    headers,
    weapons,
    modes,
  }
}

module.exports = extractCalcdata
