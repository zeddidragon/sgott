function growth({ base, zero, exp, lvMin, lvMax, type, algo }) {
  const zeroValue = [21, 25, 29].includes(algo) ? base + base * zero : base * zero
  const rounding = [4].includes(algo) ? Math.round : Math.ceil
  const growthBase = (base - zeroValue) / Math.pow(5, exp)
  const ret = Array(lvMax).fill(0)
  for(var level = lvMin; level <= lvMax; level++) {
    ret[level] = +(zeroValue + growthBase * Math.pow(level, exp))
    if(type === 'int') ret[level] = rounding(ret[level])
  }

  return ret
}

export default growth
