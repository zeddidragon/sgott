// # Calc
//
// 
function dsgoCalc(crawler, { calcs, abort }) {
  const label = crawler.setContext('Calc')
  const size = crawler.uint(0x00)
  let offset = crawler.uint(0x04)
  if (offset !== 0x08)
    abort(`Offset expected to be ${0x08} but was ${offset}`)
  crawler.jump(0x08) // Assumes data immediately follows header

  crawler.context = `${label}\t`
  const stack = []

  // TODO
}

module.exports = {
  dsgoCalc,
}
