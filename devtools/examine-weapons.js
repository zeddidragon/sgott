const allWeapons = require('./all-weapons')
const getNode = require('../helpers/get-node')

const values = []
for(const weapon of allWeapons()) {
  const dmg = getNode(weapon, 'AmmoDamage')
  const name = getNode(weapon, 'name.en')
  if((dmg && Array.isArray(dmg.value))) {
    if(dmg.value[5].value <= 1) continue
    values.push(dmg.value.map(v => v.value))
    console.log([name.value].concat(dmg.value.map(v => v.value)).join(','))
  }
}

/*
for(var i = 0; i < 6; i++) {
  const vals = values.map(v => v[i])
  if(i === 0) continue
  const set = new Set()
  for(const v of vals) set.add(v)
  console.log([
    `Value ${i}`,
    `Min: ${+Math.min(...vals).toFixed(4)}`,
    `Max: ${+Math.max(...vals).toFixed(4)}`,
    `Set: ${Array.from(set).sort((a, b) => a - b).map(v => +v.toFixed(4)).join(', ')}`
  ].join('\n'))
}
*/
