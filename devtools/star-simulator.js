import allWeapons from './all-weapons'
import getNode from '../helpers/get-node'
import render from './star-simulator-render'

const maxDmg = {}
const processed = []
for(const [ weapon, meta ] of allWeapons.each()) {
  const dmg = getNode(weapon, 'AmmoDamage')
  const name = getNode(weapon, 'name.en')
  const category = meta[2].value

  if(!dmg) continue
  const wpn = { name: name.value, category }
  if(Array.isArray(dmg.value)) {
    const [
      base,
      ,
      minLevel,
      maxLevel,
      zeroFactor,
      growth,
    ] = dmg.value.map(v => v.value)
    const zeroDamage = base * zeroFactor
    const growthBase = (base - zeroDamage) / Math.pow(5, growth)
    const damages = {
      minLevel,
      maxLevel,
      base,
      values: Array(maxLevel).fill(0),
    }
    for(var i = minLevel; i <= maxLevel; i++) {
      damages.values[i] = (zeroDamage + growthBase * Math.pow(i, growth))
    }
    wpn.damage = damages
    maxDmg[category] = Math.max(maxDmg[category] || 0, damages.values[maxLevel - 1])
  } else if(dmg.value) {
    maxDmg[category] = Math.max(maxDmg[category] || 0, dmg.value)
  }

  processed.push(wpn)
}


render(processed, maxDmg)
