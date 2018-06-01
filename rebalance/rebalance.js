const seconds = 60
const minutes = seconds * 60

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
  text.value[3].value = text.value[3].value.replace(pattern, replacement)
}

rebalance({category: 0, name: /AF.*-ST/}, (template, i, meta, text) => {
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
  patch(template, 'FirstBurstCount', 1)

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
      /Reload Time: .*sec/
      `Reload Time: ${(reload / 60).toFixed(1)}sec`
    )
    return v * reload
  })
})

rebalance({category: 2, name: /Nova Buster/}, (template, i, meta, text) => {
  // Make reloadable.
  patch(template, 'ReloadTime', v => {
    const reload = [20, 150, 180] * seconds
    replaceText(text, 
      'Reload Time: ----'
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
  replaceText(text, 'ROF: 0.3/sec' 'ROF: 0.5/sec')
})
