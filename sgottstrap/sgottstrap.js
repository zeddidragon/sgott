#!/usr/bin/env node
const fs = require('fs')
const deepEqual = require('deep-equal')
const sgoToJson = require('../sgo-json')
const jsonToSgo = require('../json-sgo')

const config = require('./config')
const weaponTable = require('./weapontable')
const weaponText = require('./weapontext')
const gameText = require('./texttable-steam-en')

const modDir = './SgottMods'
const templateDir = './SgottTemplates'
const weaponModDir = `${modDir}/weapon`
const configPath = `${modDir}/CONFIG.SGO`
const weaponTablePath = `${modDir}/_WEAPONTABLE.SGO`
const weaponTextPath = `${modDir}/_WEAPONTEXT.SGO`
const coreTemplateDir = `${templateDir}/core`
const weaponTemplateDir = `${templateDir}/weapon`
const gameTextPath = `${modDir}/TXT_STEAM_EN.TXT_SGO`

const filePath = Symbol('path')
const exists = Symbol('exists')
const touched = Symbol('touched')
const files = {}

function populate(key, path, fallback) {
  var resource
  if(fs.existsSync(path)) {
    files[key] = sgoToJson.decompiler()(fs.readFileSync(path))
    files[key][exists] = true
  } else {
    files[key] = fallback
  }
  files[key][filePath] = path
}

populate('CONFIG.SGO', configPath, config)
populate('TEXTTABLE_STEAM_EN.TXT_SGO', gameTextPath, gameText)
populate('_WEAPONTABLE.SGO', weaponTablePath, weaponTable)
populate('_WEAPONTEXT.SGO', weaponTextPath, weaponText)

console.log('Patching executable...')
;(function(){
  const exePath = './EDF41.exe'
  const buffer = fs.readFileSync(exePath)

  const path = './EDF41-sgott-backup.exe'
  if(fs.existsSync(path)) {
    console.error('Backup already exists. Skipping backup...')
  } else {
    console.log('Backing up...')
    fs.writeFileSync(path, buffer)
  }

  function replace(from, to) {
    const index = buffer.indexOf(from, 'utf16le')
    if(!~index) return
    buffer[touched] = true
    buffer.write(to + '\0', index, 'utf16le')
  }

  replace('app:/DefaultPackage/config.sgo', configPath)
  replace('app:/etc/TextTable_steam_en.txt_sgo', gameTextPath)

  if(buffer[touched]) {
    fs.writeFileSync(exePath, buffer)
  } else {
    console.log('Default executable not found. Skipping...')
  }
})()

function mkdir(path) {
  if(fs.existsSync(path)) return
  fs.mkdirSync(path)
}

console.log('Ensuring mod config files...')
// Compiled, modded SGO files
mkdir(modDir)
mkdir(weaponModDir)
// JSON templates for modding
mkdir(templateDir)
mkdir(coreTemplateDir)
mkdir(weaponTemplateDir)

function patchNode(node, steps, replacement, opts) {
  if(steps.length) {
    return patchStep(node.value, steps, replacement, opts)
  } else if(deepEqual(node, replacement)) {
    return false
  } else {
    Object.assign(node, replacement)
    return true
  }
}

function patchStep(values, [step, ...steps], replacement, opts) {
  if(/^\[\d+]$/.exec(step)) {
    const [index] = /\d+/.exec(step)
    const node = values[index]
    if(node) {
      return patchNode(node, steps, replacement, opts)
    } else if(opts && opts.upsert) {
      const newNode = {}
      values[index] = newNode
      patchNode(newNode, steps, replacement, opts)
      return true
    } else {
      return false
    }
  } else if(/\{.*=.*\}/.exec(step)) {
    const [search, value] = step.slice(1, -1).split('=')
    const searchSteps = search.split(':')
    const node = values.find(v => {
      var current = v
      for(const step of searchSteps) {
        if(!current) return false
        current = current[step]
      }
      return current == value
    })
    if(node) {
      return patchNode(node, steps, replacement, opts)
    } else if(opts && opts.upsert) {
      console.error(`Upsert not supported with query: ${step}`)
      return false
    } else {
      return false
    }
  } else {
    const node = values.find(n => n.name === step)
    if(node) {
      return patchNode(node, steps, replacement, opts)
    } else if(opts && opts.upsert) {
      const newNode = {type: 'ptr', name: step, value: []}
      values.push(newNode)
      return patchNode(newNode, steps, replacement, opts)
    } else {
      return false
    }
  }
}

function patch(table, path, replacement, opts) {
  const steps = path.split('.')
  const patched = patchStep(table.variables, steps, replacement, opts)
  if(patched) table[touched] = true
}

patch(config, 'WeaponTable', {
  type: 'string',
  name: 'WeaponTable',
  value: weaponTablePath,
})
patch(config, 'WeaponText', {
  type: 'string',
  name: 'WeaponText',
  value: weaponTextPath,
})

console.log('Patching weapons tables')
var succeeded = 0
var failed = 0

const weaponMods = fs
  .readdirSync(weaponTemplateDir)
  .filter(name => name.slice(-5).toLowerCase() === '.json')
  .map(name => name.slice(0, -5))

console.log(`Weapon Mods found: ${weaponMods.length}`)

const tableValues = files['_WEAPONTABLE.SGO'].variables[0].value
const textValues = files['_WEAPONTEXT.SGO'].variables[0].value

function findTableNode(id) {
  return tableValues.find(t => t.value[0].value === id)
}

function insertTableNode(index, tableNode, textNode) {
  files['_WEAPONTABLE.SGO'][touched] = true
  files['_WEAPONTEXT.SGO'][touched] = true
  tableValues.splice(index, 0, tableNode)
  textValues.splice(index, 0, textNode)
}

const ids = {}

function format(pair) {
  if(!pair) return ''.padStart(25)
  const [key, value] = pair
  return ('' + key).padStart(12) + ': ' + ('' + value).padEnd(11)
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

for(const mod of weaponMods) {
  console.log(`Applying: ${mod}`)
  const template = JSON
    .parse(fs.readFileSync(`${weaponTemplateDir}/${mod}.json`, 'utf8'))

  const {meta} = template
  const id = meta.id || mod
  if(ids[id]) {
    console.log(`Overwriting already modded weapon with ID ${id}. Previous mod marked as failed.`)
    failed++
  }

  const existing = findTableNode(id)
  var before = meta.before && findTableNode(meta.before)
  var after = meta.after && findTableNode(meta.after)

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
      return [
        ['ROF', `${rof.toFixed(1)}/sec`],
        ['Damage', damage.join(' x ')],
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
          const [type] = stage[6].value.split(/(?<!^)(?=[A-Z])/)
          const dmg = damage * stage[3].value
          const rangeMod = range * stage[5].value
          const count = stage[7] && stage[7].value
          const damageTotal = [+dmg.toFixed(1)]
          if(count && count > 1) damageTotal.push(count)
          if(burstCount) damageTotal.push(burstCount)
          const typeLabel = type.padEnd(8)
          const damageLabel = `Damage: ${damageTotal.join('x')}`.padEnd(18)
          const rangeLabel = `Range: ${rangeMod}m`
          return [label, `(${typeLabel} ${damageLabel} ${rangeLabel})`]
        })
      if(params[2].value) {
        attacks.push(['Defense', `${params[2].value * 100}%`])
      }
      return attacks
    }
  }

  function autoStats() {
    const type = findVar('xgs_scene_object_class').value
    const damage = (damageStats[type] || damageStats.gun)()
    const zoom = +findVar('SecondaryFire_Type') === 1 &&
        (+findVar('SeccondaryFire_Parameter').toFixed(1))
    const entries = [
      ['Capacity', findVar('AmmoCount').value],
      ...damage,
      ['Reload Time', +(+findVar('ReloadTime').value / 60).toFixed(1) + 'sec'],
    ]
    if(zoom) entries.push(['Zoom', `${+zoom}x`])
    return tabulate(entries) +
      '<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\n' 
  }

  var tableNode, textNode
  if(existing) {
    tableNode = existing
    const index = tableValues.indexOf(existing)
    textNode = textValues[index]
    if(before || after) {
      tableValues.splice(index, 1)
      textValues.splice(index, 1)
    }
  } else {
    tableNode = {
      type: 'ptr',
      value: [{
        type: 'string',
        value: id,
      }, {
        type: 'string',
        value: `${weaponModDir}/${mod}.SGO`,
      }, {
        type: 'int',
        value: 0,
      }, {
        type: 'float',
        value: 1,
      }, {
        type: 'float',
        value: 0,
      }, {
        type: 'int',
        value: 0,
      }],
    }

    textNode = {
      type: 'ptr',
      value: [{
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: 'SGOTTを使って作られた',
      }, {
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: autoStats() + 'A custom weapon made using SGOTT.',
      }, {
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: '使用SGOTT制造',
      }],
    }
  }

  const path = `${weaponModDir}/${mod}.SGO`
  tableNode.value[1].value = path
  if(meta.category != null) tableNode.value[2].value = meta.category
  if(meta.dropRateModifier != null) tableNode.value[3].value = meta.dropRateModifier
  if(meta.level != null) tableNode.value[4].value = meta.level / 25
  if(meta.unlockState != null) tableNode.value[5].value = meta.unlockState
  if(meta.description != null) {
    textNode.value[3].value = meta.description.replace('$AUTOSTATS$', autoStats())
  }
  const name = findVar('name').value[1].value
  if(name !== textNode.value[2].value) {
    textNode.value[0].value = name
    textNode.value[2].value = name
    textNode.value[4].value = name
  }

  if(after) {
    insertTableNode(tableValues.indexOf(after) + 1, tableNode, textNode)
  } else if(before) {
    insertTableNode(tableValues.indexOf(before), tableNode, textNode)
  } else if(!existing) {
    tableValues.push(tableNode)
    textValues.push(textNode)
  }

  ids[id] = {path, template}
}

succeeded = Object.keys(ids).length

if(succeeded) {
  files['_WEAPONTABLE.SGO'][touched] = true
  files['_WEAPONTEXT.SGO'][touched] = true
}

for(const {path, template} of Object.values(ids)) {
  console.log(`Writing file: ${path}`)
  fs.writeFileSync(path, jsonToSgo.compiler()(template))
}

const coreMods = fs
  .readdirSync(coreTemplateDir)
  .filter(name => name.slice(-5).toLowerCase() === '.json')
  .map(name => name.slice(0, -5))

console.log(`Core Mods found: ${coreMods.length}`)

for(const mod of coreMods) {
  console.log(`Applying: ${mod}`)
  const template = JSON
    .parse(fs.readFileSync(`${coreTemplateDir}/${mod}.json`, 'utf8'))

  for(const [path, operations] of Object.entries(template)) {
    const file = files[path]
    if(!file) {
      console.error(`File not found: ${path}, aborting...`)
      continue
    }
    for(const [steps, replacement] of Object.entries(operations.patch || {})) {
      patch(file, steps, replacement)
    }
    for(const [steps, replacement] of Object.entries(operations.upsert || {})) {
      patch(file, steps, replacement, {upsert: true})
    }
  }

  succeeded++
}

for(const file of Object.values(files)) {
  if(file[exists] && !file[touched]) continue
  const path = file[filePath]
  console.log(`Writing file: ${path}`)
  fs.writeFileSync(path, jsonToSgo.compiler()(file))
}

console.log(`Done, ${succeeded} succeeded and ${failed} failed`)
