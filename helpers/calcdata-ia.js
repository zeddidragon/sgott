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

async function extractCalcdata() {
  const file = await fs.readFile('tmp/ia.csv', 'utf8')
  const [, ...rows] = file.split('\n').map(row => row.split(';'))
  rows.pop()
  const weapons = rows.map(row => {
    const reload = +row[9]
    let name = row[0]
    let unlockState = void 0
    if(name.endsWith('^') || name.endsWith('#')){
      unlockState = 'dlc'
      name = name.slice(0, -1)
    }
    return {
      name: name,
      character: classes[row[1]],
      category: categories[row[2]],
      level: +row[3],
      count: row[4] > 1 ? +row[4] : void 0,
      damage: +row[5],
      burst: row[6] > 1 ? +row[6] : void 0,
      rof: Math.round(60 / row[7]),
      ammo: +row[8],
      reloadSeconds: reload,
      radius: row[10] > 0 ? +row[10] : void 0,
      odds: unlockState,
    }
  })
  return {
    langs: ['en'],
    classes: [
      'ranger',
      'winger',
      'fencer',
      'bomber',
    ],
    charLabels: [
      'Trooper',
      'Jet',
      'Battle',
      'Tactical',
    ],
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
