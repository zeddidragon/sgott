const blurbs = require('./blurbs')

function format(pair) {
  if(!pair) return ''
  const [key, value] = pair
  return ('' + key).padStart(18) + ': ' + ('' + value).padEnd(11)
}

function tabulate(pairs) {
  pairs = pairs.filter(p => p)
  var ret = '<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>'
  for(var i = 0; i < 6; i++) {
    const leftPair = pairs[i]
    const rightPair = pairs[i + 6]
    ret += format(leftPair) + format(rightPair) + '\n'
  }
  return ret
}

function weaponText(template, text) {
  const {meta} = template

  function autoStats() {
    const type = findVar('xgs_scene_object_class').value
    const damage = (damageStats[type] || damageStats.gun)()
    const zoom = +findVar('SecondaryFire_Type') === 1 &&
        (+findVar('SeccondaryFire_Parameter').toFixed(1))
    const entries = [
      ['Capacity', findVar('AmmoCount').value],
      ...damage,
    ].filter(a => a)
    const reloadType = findVar('ReloadType').value
    if(reloadType) {
      entries.push([
        'Reload', (+findVar('ReloadTime').value) + 'pt'
      ])
    } else {
      entries.push([
        'Reload Time', (+findVar('ReloadTime').value / 60).toFixed(1) + 'sec'
      ])
    }
    if(zoom) entries.push(['Zoom', `${+zoom}x`])
    return tabulate(entries) +
      '<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\n'
  }

  function findVar(name) {
    return template.variables.find(n => n.name === name)
  }

  const damageStats = {
    gun() {
      const damage = [(+findVar('AmmoDamage').value).toFixed(1)]
      const fireCount = +findVar('FireCount').value
      const burstCount = +findVar('FireBurstCount').value
      if(fireCount > 1) damage.push(fireCount)
      if(burstCount > 1) damage.push(burstCount)
      const rof = 60 / +findVar('FireInterval').value
      const life = findVar('AmmoAlive').value
      const speed = findVar('AmmoSpeed').value
      const blast = findVar('AmmoExplosion').value
      const accuracy = findVar('FireAccuracy').value
      const accuracyRating = [
        ['S++', 0.0005],
        ['S+', 0.0025],
        ['S', 0.005],
        ['A', 0.015],
        ['A-', 0.02],
        ['B+', 0.03],
        ['B', 0.1],
        ['C+', 0.15],
        ['C', 0.2],
        ['C-', 0.25],
        ['D', 0.3],
        ['E', 0.4],
        ['F', 0.5],
        ['G', 0.6],
        ['I', 0.8],
        ['J', 1.0],
        ['K', 1.2],
        ['L', 1.4],
        ['Z', Infinity],
      ].find((rank, value) => accuracy < value)[0]

      return [
        rof < 100 && ['ROF', `${rof.toFixed(1)}/sec`],
        ['Damage', damage.join('×')],
        ['Accuracy', accuracyRating],
        life < 1000 && ['Range', `${Math.floor(life * speed)}m`],
        blast && ['Blast Area', `${blast}m`],
      ]
    },
    Weapon_ImpactHammer() {
      const labels = [
        'Basic',
        'High Voltage',
        'Maximum',
      ]
      const params = findVar('custom_parameter').value
      const damage = +findVar('AmmoDamage').value
      const range = +findVar('AmmoSpeed').value * +findVar('AmmoAlive').value
      const burstCount = +findVar('FireBurstCount').value
      const attacks = params[3].value
        .map(({value}) => value)
        .map((stage, i) => {
          const label = labels[i]
          const type = (stage[6].value || findVar('AmmoClass').value)
            .replace(/[a-z][A-Z].*/, matched => matched[0])
          const dmg = damage * stage[3].value
          const rangeMod = range * stage[5].value
          const count = stage[7] && stage[7].value
          const damageTotal = [+dmg.toFixed(1)]
          if(count > 1) damageTotal.push(count)
          if(burstCount > 1) damageTotal.push(burstCount)
          const typeLabel = type.padEnd(8)
          const damageLabel = `Damage: ${damageTotal.join('x')}`.padEnd(18)
          const rangeLabel = `Range: ${rangeMod}m`
          return [label, `(${typeLabel} ${damageLabel} ${rangeLabel})`]
        })
      if(params[2].value) {
        attacks.push(['Defense', `${Math.round(params[2].value * 100)}%`])
      }
      return attacks
    }
  }

  function semiStats() {
    const entries = (meta.stats || []).map(([key, val]) => {
      const interpolated = val.replace(/\$\{(.*)\}/g, (_, keyword) => {
        return findVar(keyword).value
      })
      return [key, interpolated]
    })
    return tabulate(entries) +
      '<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\n'
  }

  return text
      .replace('$AUTOSTATS$', autoStats())
      .replace('$SEMISTATS$', semiStats())
      .replace('$SMOKEGRENADE$', blurbs.smokeGrenade)
      .replace('$CREDITS$', blurbs.credits)
      .replace('$DASH$', blurbs.dash)
      .replace('$JUMP$', blurbs.jump)
}

module.exports = weaponText
