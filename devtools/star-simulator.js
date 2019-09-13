{
  console.log('Simulated growth for Air Tortoise ME')
  const known = [
    2000,
    2179,
    null,
    null,
    null,
    4000,
    null,
    5313,
    null,
    null,
    7656.9
  ]
  console.log('Rate\tExtrapolated\tKnown')
  for(var i = 0; i <= 10; i++) {
    console.log([
      `${i}*:`,
      (2000 + 178.885 * Math.pow(i, 1.5)).toFixed(1),
      known[i] || ''
    ].join('\t'))
  }
}

{
  console.log('Simulated growth for PA-11')
  const known = [
    7.5,
    null,
    null,
    null,
    null,
    15.0,
    null,
    null,
    17.0,
  ]
  console.log('Lv\tExtrap.\tKnown')
  for(var i = 0; i <= 8; i++) {
    console.log([
      `${i}*:`,
      (7.5 + 3.3541 * Math.pow(i, 0.5)).toFixed(1),
      known[i] || ''
    ].join('\t'))
  }
}
