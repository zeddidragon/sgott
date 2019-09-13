const allWeapons = require('./all-weapons')
const getNode = require('../helpers/get-node')

console.log('name, minLv, maxLv, minDmg, 5*, maxDmg')
const precision = 1
for(const weapon of allWeapons()) {
  const dmg = getNode(weapon, 'AmmoDamage')
  const name = getNode(weapon, 'name.en')

  if((dmg && Array.isArray(dmg.value))) {
    const [
      base,
      _,
      minLevel,
      maxLevel,
      zeroFactor,
      growth,
    ] = dmg.value.map(v => v.value)
    const zeroDamage = base * zeroFactor
    const growthBase = (base - zeroDamage) / Math.pow(5, growth)
    const minDmg = (zeroDamage + growthBase * Math.pow(minLevel, growth)).toFixed(precision)
    const maxDmg = (zeroDamage + growthBase * Math.pow(maxLevel, growth)).toFixed(precision)
    console.log([
      name.value,
      minLevel,
      maxLevel,
      minDmg,
      base.toFixed(precision),
      maxDmg,
    ].join(', '))
  }
}
