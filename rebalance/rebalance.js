const table = require('./originals/_WEAPONTABLE')
const textTable = require('./originals/_WEAPONTEXT')
const blurbs = require('../helpers/blurbs')
const seconds = 60
const minutes = seconds * 60
const debug = true

const modded = new Set()

function getId(meta) {
  return meta.value[0].value
}

function getNode(template, name) {
  return template.variables.find(n => n.name === name)
}

function patch(template, name, value) {
  const node = getNode(template, name)
  const v = typeof value === 'function' ? value(node.value, node) : value
  node.value = v
}

function replaceText(textNode, pattern, replacement) {
  textNode.value[3].value = textNode.value[3].value.replace(pattern, replacement)
}

function rebalance(query, cb) {
  table.variables[0]
    .value
    .filter(({value: node}, i) => {
      if((query.category != null) && query.category !== node[2].value) {
        return false
      }
      if(query.name) {
        const name = textTable.variables[0].value[i].value[2].value
        if(typeof query.name === 'string' && name !== query.name) return false
        if(query.name.test && !query.name.test(name)) return false
      }
      return true
    })
    .forEach((node, i) => {
      const path = `./originals/${getId(node).toUpperCase()}`
      const template = require(path)
      const text = textTable.variables[0].value[table.variables[0].value.indexOf(node)]
      modded.add(node)
      if(debug) node.value.push(text.value[2].value)
      cb(template, i, node, text)
    })
}

function assign(property, value) {
  return function(template) {
    patch(template, 'AmmoOwnerMove', value)
  }
}

rebalance({category: 0, name: /AF\d\d-ST/}, (template, i, meta, text) => {
  // Add a minor scope.
  patch(template, 'SecondaryFire_Type', 1)
  const zoom =  {
    'AF20-ST': 2.0,
    'AF99-ST': 2.5,
  }[getId(meta)] || 1.5
  patch(template, 'SecondaryFire_Parameter', zoom)

  // Increase clip capacity by 40%.
  var cap
  patch(template, 'AmmoCount', v => {
    cap = Math.ceil(v * 1.4)
    return cap
  })

  replaceText(text, 
    /Capacity: \d+/,
    matched => `Capacity: ${cap}                          Zoom: ${zoom}x`
  )
})

rebalance({category: 0, name: /Fusion Blaster/}, (template, i, meta, text) => {
  // Remove burst-fire gimmick. It's easily circumvented and adds nothing.
  patch(template, 'FireBurstCount', 1)

  replaceText(text, 
    'However, that tremendous energy is difficult to control, so once the trigger is pulled, it will fire at full blast continuously until the wielder switches weapons. Recharging it, too, ',
    'However, recharging it'
  )
})

rebalance({category: 1}, (template, i, meta, text) => {
  // Reduce reload time by 25% on all shotguns.
  patch(template, 'ReloadTime', v => {
    const reload = Math.floor(v * 0.75)
    replaceText(text, 
      /Reload Time: .*sec/,
      `Reload Time: ${(reload / 60).toFixed(1)}sec`
    )
    return v * reload
  })
})

rebalance({category: 2, name: /Nova Buster/}, (template, i, meta, text) => {
  // Make reloadable.
  patch(template, 'ReloadTime', v => {
    const reload = (3 + i) * minutes
    replaceText(text, 
      'Reload Time: ----',
      `Reload Time: ${reload.toFixed(1)}sec`
    )
    return v * reload
  })
  // No reload animation occurs with type 1.
  patch(template, 'ReloadType', 1)
  // Make weapon reload in background.
  patch(template, 'EnergyChargeRequire', 0.0001)

  replaceText(text, 
    'However, the output is so extreme that it melts the body of the weapon when fired, meaning you only get one single shot.',
    'After firing, the weapon\'s built-in generator will start recharging it, but this process is very slow.'
  )
})

rebalance({category: 2, name: 'Lysander Z'}, (template, i, meta, text) => {
  // Increase firerate from 0.3/s to 0.5/s
  patch(template, 'FireInterval', 120)
  replaceText(text, 'ROF: 0.3/sec', 'ROF: 0.5/sec')
})

rebalance({category: 4}, (template, i, meta, text) => {
  // Increase damage because missiles are just too weak
  patch(template, 'AmmoDamage', v => {
    const damage = Math.ceil(v * 0.15) * 10
    replaceText(text, 
      /Damage: \d+ /,
      `Damage: ${(damage + '').padEnd(4)}`
    )
    return damage
  })
})

rebalance({category: 4, name: /Prominence/}, (template, i, meta, text) => {
  if(!i) return false // Change won't apply to Prominence M1

  // Give some lockon leniency
  patch(template, 'LockonFailedTime', 30)

  // Split damage and lockons over multiple missiles
  const ammo = i + 1
  patch(template, 'AmmoCount', v => {
    replaceText(text, 
      /Capacity: 1/,
      `Capacity: ${ammo}`
    )

    replaceText(text, 
      /Lock-on: 1000ｍ 1 target/,
      `Lock-on: 1000ｍ ${ammo} targets/`
    )
    return ammo
  })
  patch(template, 'FireBurstCount', ammo)

  patch(template, 'AmmoDamage', v => {
    const damage = Math.ceil(v / ammo)
    replaceText(text, 
      /Damage: \d+/,
      `Damage: ${damage}`
    )
    return damage
  })

  patch(template, 'LockonTime', v => {
    const lockon = Math.ceil(v / ammo)
    replaceText(text, 
      /Lock-on Time: .*sec/,
      `Lock-on Time: ${lockon.toFixed(1)}sec`
    )

    // Hold the lock-on for more than enough to make all lockons
    patch(template, 'LockonHoldTime', lockon * ammo * 2)

    return lockon
  })

  // Increase reload a bit to compensate
  patch(template, 'ReloadTime', v => {
    const reload = v * Math.pow(2, i)
    replaceText(text, 
      /Reload Time: .*sec/,
      `Reload Time: ${reload / seconds).toFixed(1)}sec`
    )
    return reload
  })
})

rebalance({category: 5, name: /Stampede/}, (template, i, meta, text) => {
  // Aim Stampede up a bit
  patch(template, 'AngleAdjust', -0.4)
  patch(template, 'FireVector', [{
    type: 'float',
    value: 0,
  }, {
    type: 'float',
    value: 0.24,
  }, {
    type: 'float',
    value: 0.97,
  }])
})

rebalance({category: 6, name: 'PX50 Bound Shot'}, (template, i, meta, text) => {
  // Remove recoil animation
  patch(template, 'custom_parameter', value => {
    value[0].value = 'assault_recoil1'
    value[1].value = 1
    value[2].value = 0
    return value
  })
})

// Make all lasers penetrate
rebalance({category: 11, name: /LAZR|LARG/}, assign('AmmoIsPenetration', 1))

// Tighten spread on Thunder Bows
rebalance({category: 12, name: /Thunder Bow/}, assign('FireAccuracy', v => v * 0.5))

// Tighten spread a lot on Eclat series
rebalance({category: 12 name: /Eclat/}, assign('FireAccuracy', v => v * 0.2))

// Cut momentum inheritance of all particle cannnons
rebalance({category: 13}, assign('AmmoOwnerMove', v => v * 0.2))
// Halve energy cost of all particle cannons
rebalance({category: 13}, assign('EnergyChargeRequire', v => v * 0.5))

// Make laser snipers penetrate
rebalance({category: 14, name: /LRSL|SIG Sniper/}, assign('AmmoIsPenetration', 1))

// Reduce rate of fire of Monster snipers to make managable
rebalance({category: 14, name: /Monster/}, assign('FireInterval', 6))

rebalance({category: 15}, (template, i, meta, text) => {
  // Increase damage because missiles are just too weak
  patch(template, 'AmmoDamage', v => {
    const damage = Math.ceil(v * 0.15) * 10
    replaceText(text, 
      /Damage: \d+ /,
      `Damage: ${(damage + '').padEnd(4)}`
    )
    return damage
  })

  // Reduce energy cost
  patch(template, 'EnergyChargeRequire', v => {
    const energy = v * 0.75
    replaceText(text, 
      /Energy Cost: .*%/,
      `Energy Cost: ${energy.toFixed(1)}%`
    )
    return energy
  })
})

rebalance({category: 16}, (template, i, meta, text) => {
  // Enable penetration
  patch(template, 'AmmoIsPenetration', 1)

  // Reduce energy cost
  patch(template, 'EnergyChargeRequire', v => {
    const energy = v * 0.5
    replaceText(text, 
      /Energy Cost: .*%/,
      `Energy Cost: ${energy}%`
    )
    return energy
  })
})

rebalance({category: 20, name: /Vibro Roller/}, (template, i, meta, text) => {
  // Reduce reload time by 20%
  patch(template, 'ReloadTime', v => {
    const reload = Math.floor(v * 0.8)
    replaceText(text, 
      /Reload: .*sec/,
      `Reload: ${(reload / 60).toFixed(1)}sec`
    )
    return v * reload
  })

  // Make it faster to use
  patch(template, 'custom_parameter', v => {
    v[3].value.forEach(charge => {
      // Reduce charge time by 20%
      charge.value[0].value /= 1.2

      // Double animation speed
      charge.value[2].value *= 2
    })

    return v
  })
})

rebalance({category: 21, name: /Flashing Spear/}, (template, i, meta, text) => {
  // Increase range by 50%
  patch(template, 'AmmoAlive', v => {
    const alive = v * 1.5
    const range = alive * getNode(template, 'AmmoSpeed').value
    replaceText(text,
      /Range: .*m/,
      `Range: ${range.toFixed(1)}m`
  )
    return alive
  })
})

rebalance({category: 21, name: /Spine Driver/}, (template, i, meta, text) => {
  // Increase range by 20%
  patch(template, 'AmmoAlive', v => {
    const alive = v * 1.2
    const range = alive * getNode(template, 'AmmoSpeed').value
    replaceText(text,
      /Range: .*m/,
      `Range: ${range.toFixed(1)}m`
  )
    return alive
  })
})

// Choke spread on Dexter
rebalance({category: 23, name: /Dexter Automatic Shotgun/}, assign('FireAccuracy', v => v * 0.5))

// Choke spread on Cannon Shot
rebalance({category: 24, name: /Cannon Shot/}, assign('FireAccuracy', v => v * 0.5))

rebalance({category: 24, name: /Mortar/}, (template, i, meta, text) => {
  // Increase damage because mortars are super awkward and a bit too weak
  patch(template, 'AmmoDamage', v => {
    const damage = v * 1.25
    replaceText(text, 
      /Damage: \d+ /,
      `Damage: ${(damage + '').padEnd(4)}`
    )
    return damage
  })
})

rebalance({category: 24, name: /Dispersal Mortar/}, (template, i, meta, text) => {
  // Aim dispersal mortars up a bit
  patch(template, 'FireVector', [{
    type: 'float',
    value: 0,
  }, {
    type: 'float',
    value: 0.19,
  }, {
    type: 'float',
    value: 0.98,
  }])
})

rebalance({category: 24, name: /Light Mortar/}, (template, i, meta, text) => {
  // Aim light mortars up a slighter bit
  patch(template, 'FireVector', [{
    type: 'float',
    value: 0,
  }, {
    type: 'float',
    value: 0.04,
  }, {
    type: 'float',
    value: 0.998,
  }])

  // Add jump booster
  patch(template, 'SecondaryFire_Type', 4)
  replaceText(text,
    ' \n\nThis weapon comes fitted with a scope featuring one zoom level.',
    blurbs.jump
  )
})

rebalance({category: 24, name: /Heavy Mortar|Explosive Mortar/}, (template, i, meta, text) => {
  // Aim heavy mortars up the tiniest bit
  patch(template, 'FireVector', [{
    type: 'float',
    value: 0,
  }, {
    type: 'float',
    value: 0.02,
  }, {
    type: 'float',
    value: 0.9996,
  }])
})


rebalance({category: 25, name: /Arm Hound/}, (template, i, meta, text) => {
  // Add dash to Arm Hound
  patch(template, 'SecondaryFire_Type', 5)
  replaceText(text, /$/, blurbs.dash)
})

rebalance({category: 25, name: /Arcane/}, (template, i, meta, text) => {
  // Increase blast radius on Arcane
  patch(template, 'AmmoExplosion', v => {
    const radius = Math.ceil(v * 1.6)
    replaceText(text,
      /Blast Area: Radius \d+m/,
      `Blast Area: Radius ${radius}m`
    )
    return radius
  })
})

rebalance({category: 25, name: /High Altitude Impact Missiles/}, (template, i, meta, text) => {
  // Add jump jets to HAIL
  patch(template, 'SecondaryFire_Type', 4)
  replaceText(text, /$/, blurbs.jump)
})

rebalance({category: 25, name: /Phoenix/}, (template, i, meta, text) => {
  // Make Phoenix independent
  patch(template, 'LockonTargetType', 0)
  replaceText(text, ' [Only with Guide Kit]', '')
  replaceText(text,
    "Launches enormous laser-guided missiles which boast extreme destructive power, but the guidance component necessitates that this weapon not be used on its own: it must be paired with an Air Raider's Laser Guide Kit to establish a viable target lock.",
    'Launches enormous missiles which boast extreme destructive power.'
  )
})

if(debug) console.log(Array.from(modded).map(v => v.value.pop()))
