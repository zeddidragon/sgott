const formulas = {
  8: ({ base, zero, exp, lvMin, lvMax }) => { // Damage algorithm
    const zeroValue = base * zero
    const growthBase = (base - zeroValue) / Math.pow(5, exp)
    const ret = Array(lvMax).fill(0)
    for(var level = lvMin; level <= lvMax; level++) {
      ret[level] = +(zeroValue + growthBase * Math.pow(level, exp))
    }
    
    return ret
  },
}

function growth(stat) {
  return formulas[stat.algo](stat)
}

module.exports = growth
