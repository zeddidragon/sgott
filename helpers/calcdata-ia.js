const syncFs = require('fs')
const process = require('process')
const fs = syncFs.promises

const classes = {
  TR: 'trooper',
  BA: 'battle',
  JT: 'jet',
  TA: 'tactical',
}

const categories = {
  AR: 'assault',
  SH: 'shotgun',
  RL: 'rocket',
  ML: 'missile',
  GL: 'grenade',
  SR: 'sniper',
}

async function extractCalcdata() {
  const file = await fs.readFile('tmp/ia.csv', 'utf8')
  const [header, ...rows] = file.split('\n').map(row => row.split(/\;/))
  rows.pop()
  const data = rows.map(row => {
    const reload = Math.round(60 * row[9])
    const clipLength = Math.round(60 * row[19])
    const total = reload + clipLength
    return {
      name: row[0],
      character: classes[row[1]],
      category: categories[row[2]],
      tier: +row[3],
      count: row[4] > 1 ? +row[4] : void 0,
      damage: +row[5],
      burst: row[6] > 1 ? +row[6] : void 0,
      rof: Math.round(60 / row[7]),
      ammo: +row[8],
      reload: reload,
      area: row[10] > 0 ? +row[10] : void 0,
    }
  })
  return data
}

extractCalcdata()
  .then(data => {
    console.log(JSON.stringify(data, null, 2))
  })
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
