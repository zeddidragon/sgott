const CSON = require('cson')
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
  'damage',
  'interval',
  'reload',
  'reloadQuick',
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

async function extractGunStats(category) {
  const data = CSON.parse(await readFile(`data/ir/weapon-${category}.cson`))
  return data.weapons.map((wpn, i) => {
    return {
      id: `weapon-${category}-${i + 1}`,
      character: 'weapons',
      level: ['E', 'D', 'C', 'B', 'A', 'AA'].indexOf(wpn.rank),
      category,
      ...wpn,
    }
  })
}

async function extractCalcdata() {
  const categories = headers.weapons.map(h => h.category)
  const weapons = await Promise.all(categories.map(extractGunStats))
  return {
    langs: ['en'],
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
