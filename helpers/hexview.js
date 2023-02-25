const kleur = require('kleur')
const { underline, dim } = kleur
kleur.enabled = process.stdout.isTTY

function hexview(buffer, cfg={}) {
  const rulers = cfg.rulers == null ? process.stdout.isTTY : cfg.rulers
  const header = rulers
    ? '     ' + underline('      0011 2233   4455 6677   8899 aabb   ccdd eeff\n')
    : ''
  return header + (
    buffer
      .toString('hex')
      .match(/.{1,8}/g)
      .map(row => row.match(/.{1,4}/g).join(' '))
      .map(row => row.replace(/0000/g, dim('0000')))
      .reduce((acc, v, i) => {
        if(!(i % 4)) acc.push([])
        acc[acc.length - 1].push(v)
        return acc
      }, [])
      .map(row => row.join('   '))
      .map((row, i) => {
        if(!rulers) return row
        return (i * 0x10).toString(16).padStart(8) + ' ║ ' + row
      })
      .join('\n')
  )
}

module.exports = hexview
