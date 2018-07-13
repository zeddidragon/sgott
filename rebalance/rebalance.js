#!/usr/bin/env node

const fs = require('fs')
const table = require('./originals/_WEAPONTABLE')
const textTable = require('./originals/_WEAPONTEXT')
const blurbs = require('../helpers/blurbs')
const getId = require('../helpers/get-id')
const getNode = require('../helpers/get-node')
const patch = require('../helpers/patch')

const rawSgos = new Map()
const seconds = 60
const minutes = seconds * 60

const modded = new Set()

function replaceText(textNode, pattern, replacement) {
  textNode.value[3].value = textNode.value[3].value.replace(pattern, replacement)
}

function rebalance(query, cb) {
  table.variables[0]
    .value
    .filter(({value: node}, i) => {
      if(query.id && query.id !== node[0].value) return false
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
      cb(template, i, node, text)
    })
}

function assign(property, value) {
  return function(template) {
    patch(template, property, value)
  }
}

rebalance({category: 0, name: /AF\d\d-ST/}, (template, i, meta, text) => {
  // Add a minor scope.
  patch(template, 'SecondaryFire_Type', 1)
  const zoom =  {
    'AF20-ST': 2.0,
    'AF99-ST': 2.5,
  }[getId(meta)] || 1.5
  patch(template, 'SecondaryFire_Parameter', (v, node) => {
    node.type = 'float'
    return zoom
  })

  // Increase clip capacity by 40%.
  var cap
  patch(template, 'AmmoCount', v => {
    cap = Math.ceil(v * 1.4)
    return cap
  })

  replaceText(text,
    /Capacity: \d+/,
    `Capacity: ${cap}                          Zoom: ${zoom}x`
  )
})

rebalance({category: 0, name: /Fusion Blaster/}, (template, i, meta, text) => {
  // Remove burst-fire gimmick. It's easily circumvented and adds nothing.
  patch(template, 'FireBurstCount', 1)

  replaceText(text,
    'However, that tremendous energy is difficult to control, so once the trigger is pulled, it will fire at full blast continuously until the wielder switches weapons. Recharging it, too, ',
    'However, recharging it '
  )
})

rebalance({category: 1}, (template, i, meta, text) => {
  // Reduce reload time by 25% on all shotguns.
  patch(template, 'ReloadTime', v => {
    const reload = Math.floor(v * 0.75)
    replaceText(text,
      /Reload Time: .*sec/,
      `Reload Time: ${(reload / seconds).toFixed(1)}sec`
    )
    return reload
  })
})

rebalance({category: 2, name: /Nova Buster/}, (template, i, meta, text) => {
  // Make reloadable.
  patch(template, 'ReloadTime', v => {
    const reload = 1 * minutes + (i * 20) * seconds
    replaceText(text,
      'Reload Time: ----',
      `Reload Time: ${Math.floor(reload / 60)}sec`
    )
    return reload
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
  // Increase firerate from 0.3/s to 0.5/s.
  patch(template, 'FireInterval', 120)
  replaceText(text, 'ROF: 0.3/sec', 'ROF: 0.5/sec')
})

rebalance({category: 4}, (template, i, meta, text) => {
  // Increase damage because missiles are just too weak.
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
  if(!i) return false // Change won't apply to Prominence M1.

  // Give some lockon leniency:
  patch(template, 'LockonFailedTime', 30)

  // Split damage and lockons over multiple missiles.
  const ammo = i + 1
  patch(template, 'AmmoCount', v => {
    replaceText(text,
      /Capacity: 1/,
      `Capacity: ${ammo}`
    )

    replaceText(text,
      /Lock-on: 1000ｍ 1 target/,
      `Lock-on: 1000ｍ ${ammo} targets`
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
      `Lock-on Time: ${(lockon / seconds).toFixed(1)}sec`
    )

    // Hold the lock-on for more than enough to make all lockons.
    patch(template, 'LockonHoldTime', lockon * ammo * 2)

    return lockon
  })

  // Increase reload a bit to compensate.
  patch(template, 'ReloadTime', v => {
    const reload = v * Math.pow(2, i)
    replaceText(text,
      /Reload Time: .*sec/,
      `Reload Time: ${(reload / seconds).toFixed(1)}sec`
    )
    return reload
  })
})

rebalance({category: 5, name: /Stampede/}, (template, i, meta, text) => {
  // Aim Stampede up a bit.
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

rebalance({category: 5, name: /UMA[XZ]/}, (template, i, meta, text) => {
  // Increase clip capacity by 1
  patch(template, 'AmmoCount', v => {
    const cap = v + 1
    replaceText(text,
      /Capacity: \d/,
      `Capacity: ${cap}`
    )
    return cap
  })

  if(!i) return
  // Increase damage by 500 for UMAZ
  patch(template, 'AmmoDamage', v => {
    const damage = v + 500
    replaceText(text,
      /Damage: \d+/,
      `Damage: ${(damage + '')}`
    )
    return damage
  })
})

rebalance({category: 6, name: 'PX50 Bound Shot'}, (template, i, meta, text) => {
  // Remove recoil animation.
  patch(template, 'custom_parameter', value => {
    value[0].value = 'assault_recoil1'
    value[1].value = 1
    value[2].value = 0
    return value
  })

  // Reduce reload time because it is a shotgun.
  patch(template, 'ReloadTime', v => {
    const reload = Math.floor(v * 0.75)
    replaceText(text,
      /Reload Time: .*sec/,
      `Reload Time: ${(reload / seconds).toFixed(1)}sec`
    )
    return reload
  })
})

// Make all lasers penetrate.
rebalance({category: 11, name: /LAZR|LARG|Cyclone/}, assign('AmmoIsPenetration', 1))

// Tighten spread on Thunder Bows.
rebalance({category: 12, name: /Thunder Bow/}, assign('FireAccuracy', v => v * 0.7))

rebalance({category: 13}, (template, i, meta, text) => {
  // Cut momentum inheritance of all particle cannnons.
  patch(template, 'AmmoOwnerMove', v => v * 0.2)

  // Reduce energy cost.
  patch(template, 'EnergyChargeRequire', v => {
    const energy = v * 0.75
    replaceText(text,
      /Energy Cost: .*%/,
      `Energy Cost: ${energy.toFixed(1)}%`
    )
    return energy
  })
})

// Make laser snipers penetrate.
rebalance({category: 14, name: /LRSL|SIG Sniper/}, assign('AmmoIsPenetration', 1))

rebalance({category: 15, name: 'Plasma Grenade Σ'}, (template, i, meta, text) => {
  // Reduce energy cost.
  patch(template, 'EnergyChargeRequire', 0.001)
  replaceText(text, /Energy Cost: .*%/, '')
})

rebalance({category: 14, name: /Monster/}, (template, i, meta, text) => {
  // Reduce rate of fire of Monster snipers to make managable.
  patch(template, 'ReloadTime', 2)
  patch(template, 'FireInterval', 2)
})

rebalance({category: 16}, (template, i, meta, text) => {
  // Increase damage because missiles are just too weak.
  patch(template, 'AmmoDamage', v => {
    const damage = Math.ceil(v * 0.15) * 10
    replaceText(text,
      /Damage: \d+/,
      `Damage: ${damage}`
    )
    return damage
  })

  // Reduce energy cost.
  patch(template, 'EnergyChargeRequire', v => {
    const energy = v * 0.75
    replaceText(text,
      /Energy Cost: .*%/,
      `Energy Cost: ${energy.toFixed(1)}%`
    )
    return energy
  })
})

// Increase lifetime of projectiles because they tend not to reach.
rebalance({category: 16, name: 'Ghost Chaser'}, assign('AmmoAlive', v => v * 2))

// All special weapons
rebalance({category: 17}, (template, i, meta, text) => {
  // Reduce energy cost.
  patch(template, 'EnergyChargeRequire', v => {
    const energy = v * 0.5
    replaceText(text,
      /Energy Cost: .*%/,
      `Energy Cost: ${energy.toFixed(1)}%`
    )
    return energy
  })
})

rebalance({category: 20, name: /Vibro Roller/}, (template, i, meta, text) => {
  // Reduce reload time by 20%.
  patch(template, 'ReloadTime', v => {
    const reload = Math.floor(v * 0.8)
    replaceText(text,
      /Reload: .*sec/,
      `Reload: ${(reload / seconds).toFixed(1)}sec`
    )
    return reload
  })

  // Make it faster to use
  patch(template, 'custom_parameter', v => {
    v[3].value.forEach(charge => {
      // Reduce charge time by 20%.
      charge.value[0].value /= 1.2

      // Double animation speed.
      charge.value[2].value *= 2
    })

    return v
  })
})

rebalance({category: 21, name: /Flashing Spear/}, (template, i, meta, text) => {
  // Increase range by 50%.
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
  // Increase range by 20%.
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

// Choke spread on Dexter.
rebalance({category: 23, name: /Dexter Automatic Shotgun/}, assign('FireAccuracy', v => v * 0.7))

// Choke spread on Cannon Shot.
rebalance({category: 24, name: /Cannon Shot/}, assign('FireAccuracy', v => v * 0.85))

rebalance({category: 24, name: /Mortar/}, (template, i, meta, text) => {
  // Increase damage because mortars are super awkward and a bit too weak.
  patch(template, 'AmmoDamage', v => {
    const damage = v * 1.25
    replaceText(text,
      /Damage: \d+/,
      `Damage: ${(damage + '')}`
    )
    return damage
  })
})

rebalance({category: 24, name: /Dispersal Mortar/}, (template, i, meta, text) => {
  // Aim dispersal mortars up a bit.
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
  // Aim light mortars up a slighter bit.
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

  // Add jump booster.
  patch(template, 'SecondaryFire_Type', 4)
  replaceText(text,
    ' \n\nThis weapon comes fitted with a scope featuring one zoom level.',
    blurbs.jump
  )
})

rebalance({category: 24, name: /Heavy Mortar|Explosive Mortar/}, (template, i, meta, text) => {
  // Aim heavy mortars up the tiniest bit.
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
  // Add dash to Arm Hound.
  patch(template, 'SecondaryFire_Type', 5)
  replaceText(text, /$/, blurbs.dash)
})

rebalance({category: 25, name: /Arcane/}, (template, i, meta, text) => {
  // Increase blast radius on Arcane.
  patch(template, 'AmmoExplosion', v => {
    const radius = Math.ceil(v * 1.6)
    replaceText(text,
      /Blast Area: Radius \d+m/,
      `Blast Area: Radius ${radius}m`
    )
    return radius
  })
})

rebalance({category: 25, name: /High Altitude Impact/}, (template, i, meta, text) => {
  // Add jump jets to HAIL.
  patch(template, 'SecondaryFire_Type', 4)
  replaceText(text, /$/, blurbs.jump)
})

rebalance({category: 32, name: /Charger|Streamer|Post|Territory|Zone/}, (template, i, meta, text) => {
  // No reload animation occurs with type 1.
  patch(template, 'ReloadType', 1)
  // Make posts reload in the background.
  patch(template, 'EnergyChargeRequire', 0.0001)

  replaceText(text,
    /$/,
    '\n\nWhen depleted, the posts\' internal engine will reload it even when not actively wielded by the user.'
  )
})

rebalance({category: 32, name: /Post|Territory|Zone/}, (template, i, meta, text) => {
  // Reduce reload time by 50% on all Guard and Power posts.
  patch(template, 'ReloadTime', v => {
    const reload = Math.floor(v * 0.5)
    replaceText(text,
      /Reload: .*sec/,
      `Reload: ${(reload / seconds).toFixed(1)}sec`
    )
    return reload
  })
})

rebalance({category: 31, name: /Cannon.*Artillery/}, (template, i, meta, text) => {
  // Start fully reloaded.
  patch(template, 'ReloadInit', 1)
  // Reduce interval and summon delay.
  patch(template, 'Ammo_CustomParameter', values => {
    const summonDelay = values[2]
    summonDelay.value *= 0.25
    const summonCustomParameter = values[4]
    const artilleryInterval = summonCustomParameter.value[3]
    artilleryInterval.value = 2
    return values
  })
})

rebalance({category: 31, name: /Attack Whale/}, (template, i, meta, text) => {
  // Make background reloadable.
  patch(template, 'EnergyChargeRequire', 0.0001)

  // Change times.
  patch(template, 'ReloadTime', v => {
    const reload = Math.floor(v * (100 - i * 2.5) / 100)
    replaceText(text,
      /Reload: \d+pt/,
      `Reload: ${(reload / seconds).toFixed(1)}sec`
    )
    return reload
  })

  // Add zoom.
  patch(template, 'SecondaryFire_Type', 1)
  patch(template, 'SecondaryFire_Parameter', (v, node) => {
    node.type = 'float'
    return 4
  })
})

rebalance({category: 31, name: /Rule of God/}, (template, i, meta, text) => {
  // Amp up damage.
  patch(template, 'AmmoDamage', v => {
    const damage = v * 2
    replaceText(text,
      /Damage: \d+/,
      `Damage: ${damage}`
    )
    return damage
  })
})

// Make remote explosives able to detonate without forcing a reload.
rebalance({category: 33}, assign('SecondaryFire_Type', 2))
rebalance({category: 34, name: /Bomb|Beetle/}, assign('SecondaryFire_Type', 2))
rebalance({category: 34, id: 'Weapon656'}, (template, i, meta, text) => {
  patch(template, 'custom_parameter', v => {
    v[0].value = 'throw_recoil2'
    v[2].value = 0
    return v
  })
  patch(template, 'Ammo_CustomParameter', v => {
    v[5].value = 0.05
    return v
  })
})

rebalance({category: 35, name: /Bunker|Shelter|Prison|Wall|Border|^Decoy/}, (template, i, meta, text) => {
  // No reload animation occurs with type 1.
  patch(template, 'ReloadType', 1)
  // Make special devices reload in the background.
  patch(template, 'EnergyChargeRequire', 0.0001)

  replaceText(text,
    /$/,
    '\n\nWhen depleted, the device\'s internal engine will reload it even when not actively wielded by the user.'
  )
})

rebalance({category: 35, name: /Wire/}, (template, i, meta, text) => {
  // Increase amount of wires a lot because wire damage got nerfed by 2/3 since 2025.
  patch(template, 'FireCount', v => {
    const damage = getNode(template, 'AmmoDamage').value
    const count = v * 2
    replaceText(text, /Damage.*\n/, `Damage: ${damage.toFixed(1)}×${count}\n`)
    return count
  })
})

rebalance({category: 36, name: /Titan/}, (template, i, meta, text) => {
  // Start more reloaded to make up for being weak compared to other forts.
  patch(template, 'ReloadInit', v => 1 - (1 - v) * 0.5)
  // Increase shot speed of Titan's Requiem Gun.
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const hardpointParameters = vehicleParameters.value[2]
    const mainCannon = hardpointParameters.value[0]
    const mainCannonConfig = mainCannon.value[0]

    const path = './SgottMods/weapon/v_404bigtank_mainCannon'
    mainCannonConfig.value = path + '.SGO'
    const mainCannonTemplate = require('./originals/V_404BIGTANK_MAINCANNON')
    patch(mainCannonTemplate, 'AmmoAlive', 240)
    patch(mainCannonTemplate, 'AmmoSpeed', 20)
    rawSgos.set(path.split(/\//).pop(), mainCannonTemplate)
    return values
  })

  // Increase durability for Titan
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 2.5
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 2.5}`
  )
})

rebalance({category: 37, name: /SDL1/}, (template, i, meta, text) => {
  // Increase grip and weight of all bikes
  patch(template, 'Ammo_CustomParameter', values => {
    const summonDelay = values[2]
    // Instant appearance
    summonDelay.value = 0
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const mobilityParameters = vehicleParameters.value[1]
    const grip = mobilityParameters.value[0]
    grip.value *= 3
    const weight = mobilityParameters.value[2]
    weight.value *= 1.5
    return values
  })
})

rebalance({category: 37, name: /Grape/}, (template, i, meta, text) => {
  // Add full rotation to grape's cannon
  const path = './SgottMods/weapon/vehicle401_striker'
  const vehicleTemplate = require('./originals/VEHICLE401_STRIKER.json')
  const cannonControl = getNode(vehicleTemplate, 'striker_cannon_ctrl')
  cannonControl.value[2].value = 60
  rawSgos.set(path.split(/\//).pop(), vehicleTemplate)

  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleConfig = summonParameters.value[2]
    vehicleConfig.value = path + '.SGO'
    return values
  })

  patch(template, 'resource', values => {
    const original = values.find(node => node.value === 'app:/Object/Vehicle401_Striker.sgo')
    if(!original) throw new Error('Original resource node not found!')
    original.value = path + '.SGO'
  })
})

rebalance({category: 39}, (template, i, meta, text) => {
  // Increase durability of all power suits
  patch(template, 'Ammo_CustomParameter', values => {
    const summonParameters = values[4]
    const vehicleParameters = summonParameters.value[3]
    const strengthParameters = vehicleParameters.value[0]
    const healthFactor = strengthParameters.value[0]
    healthFactor.value *= 2
    return values
  })
  replaceText(text,
    /Durability: (\d+)/,
    (match, hp) => `Durability: ${hp * 2}`
  )
})

function json(obj) {
  return JSON.stringify(obj, null, 2)
}

const outDir = './release/sgottstrap/SgottTemplates/weapon'
for(const [path, template] of rawSgos) {
  const filename = `${outDir}/${path}.json`
  console.log(`Writing ${filename}` )
  fs.writeFileSync(filename, json(template))
}

for(const node of modded) {
  const id = getId(node)
  const path = `./originals/${id.toUpperCase()}`
  const template = require(path)
  const text = textTable.variables[0].value[table.variables[0].value.indexOf(node)]
  template.meta = {
    id: id,
    description: text.value[3].value,
  }
  const name = text.value[2]
    .value
    .replace(/\s+/g, '-')
    .replace(/[^0-9a-zA-Z-]/g, '')
  const filename = `${outDir}/_${id}_${name}.json`
  console.log(`Writing ${filename}` )
  fs.writeFileSync(filename, json(template))
}

console.log('Done!')
