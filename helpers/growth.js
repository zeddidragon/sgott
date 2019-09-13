function growth({ base, zero, exp, lvMin, lvMax, type, algo }) {
  const zeroValue = [21, 25, 29].includes(algo) ? base + base * zero : base * zero
  const growthBase = (base - zeroValue) / Math.pow(5, exp)
  const ret = Array(lvMax).fill(0)
  for(var level = lvMin; level <= lvMax; level++) {
    ret[level] = +(zeroValue + growthBase * Math.pow(level, exp))
    if(type === 'int') ret[level] = Math.ceil(ret[level])
  }

  return ret
}

module.exports = growth
