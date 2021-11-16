#!/usr/bin/env node
const fs = require('fs')
const deepEqual = require('fast-deep-equal')
const CSON = require('cson')
const sgoToJson = require('./converters/sgo/to-json')
const jsonToSgo = require('./converters/sgo/from-json')
const generateWeaponText = require('./helpers/weapon-text')

const config41 = require('./data/41/config.json')
const weaponTable41 = require('./data/41/weapons/_WEAPONTABLE.json')
const weaponText41 = require('./data/41/weapons/_WEAPONTEXT.json')

const config5 = require('./data/5/config.json')
const weaponTable5 = require('./data/5/weapons/WEAPONTABLE.json')
const weaponText5 = require('./data/5/weapons/WEAPONTEXT.json')

const edfVersion = fs.existsSync('EDF5.exe') ? 5 : 41
const edfName = edfVersion === 5 ? 'EDF5' : 'EDF4.1'

const {
  config,
  weaponTable,
  weaponText,
  weaponTableName,
  weaponTextName,
} = edfVersion === 5 ? {
  config: config5,
  weaponTable: weaponTable5,
  weaponText: weaponText5,
  weaponTableName: 'WEAPONTABLE',
  weaponTextName: 'WEAPONTEXT',
} : {
  config: config41,
  weaponTable: weaponTable41,
  weaponText: weaponText41,
  weaponTableName: '_WEAPONTABLE',
  weaponTextName: '_WEAPONTEXT',
}

const modDir = './SgottMods'
const templateDir = './SgottTemplates'
const saveDir = `\\My Games\\${edfName}_MODSAVES\\`
const weaponModDir = `${modDir}/weapon`
const configPath = `${modDir}/CONFIG.SGO`
const weaponTablePath = `${modDir}/${weaponTableName}.SGO`
const weaponTextPath = `${modDir}/${weaponTextName}.SGO`
const coreTemplateDir = `${templateDir}/core`
const weaponTemplateDir = `${templateDir}/weapon`

const filePath = Symbol('path')
const exists = Symbol('exists')
const touched = Symbol('touched')
const files = {}

function populate(key, path, fallback) {
  if(fs.existsSync(path)) {
    files[key] = sgoToJson.decompiler()(fs.readFileSync(path))
    files[key][exists] = true
  } else {
    files[key] = fallback
  }
  files[key][filePath] = path
}

populate('CONFIG.SGO', configPath, config)
populate(`${weaponTableName}.SGO`, weaponTablePath, weaponTable)
populate(`${weaponTextName}.SGO`, weaponTextPath, weaponText)

function findVar(template, name) {
  return template.variables.find(n => n.name === name)
}

let keepSaves = false
const keepSavesIdx = process.argv.indexOf('--keep-saves')
if(~keepSavesIdx) {
  process.argv.splice(keepSavesIdx, 1)
  keepSaves = true
}

console.log('Patching executable...')
;(function(){
  const exePath = `./EDF${edfVersion}.exe`
  const buffer = fs.readFileSync(exePath)

  const path = `./EDF${edfVersion}-sgott-backup.exe`
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

  function replaceAll(from, to) {
    let index = buffer.indexOf(from, 'utf16le')
    while(~(index = buffer.indexOf(from, 'utf16le'))) {
      buffer[touched] = true
      buffer.write(to + '\0', index, 'utf16le')
    }
  }

  replace('app:/DefaultPackage/config.sgo', configPath)
  if(!keepSaves) replaceAll(`\\My Games\\${edfName}\\SAVE_DATA\\`, saveDir)

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
    if(opts && opts.upsert) {
      console.error(`Upsert not supported with query: ${step}`)
      return false
    }
    const [search, value] = step.slice(1, -1).split('=')
    const searchSteps = search.split(':')
    const nodes = values.filter(v => {
      var current = v
      for(const step of searchSteps) {
        if(!current) return false
        current = current[step]
      }
      return current == value
    })
    var modded = false
    for(const node of nodes) {
      if(patchNode(node, steps, replacement, opts) && !modded) modded = true
    }
    return modded
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

const tableValues = files[`${weaponTableName}.SGO`].variables[0].value
const textValues = files[`${weaponTextName}.SGO`].variables[0].value

function findTableNode(id) {
  return tableValues.find(t => t.value[0].value === id)
}

function insertTableNode(index, tableNode, textNode) {
  files[`${weaponTableName}.SGO`][touched] = true
  files[`${weaponTextName}.SGO`][touched] = true
  tableValues.splice(index, 0, tableNode)
  textValues.splice(index, 0, textNode)
}

const ids = {}
const raw = {}

for(const mod of weaponMods) {
  console.log(`Applying: ${mod}`)
  const template = CSON
    .parse(fs.readFileSync(`${weaponTemplateDir}/${mod}.json`, 'utf8'))

  const {meta} = template
  const path = `${weaponModDir}/${mod}.SGO`
  const {id} = meta
  if(!id) {
    console.log(`No id located, ${mod} will not be added to the weapon table`)
    raw[path] = template
    continue
  } else if(ids[id]) {
    console.log(`Overwriting already modded weapon with ID ${id}. Previous mod marked as failed.`)
    failed++
  }

  const existing = findTableNode(id)
  var before = meta.before && findTableNode(meta.before)
  var after = meta.after && findTableNode(meta.after)

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
        value: generateWeaponText(template, '$AUTOSTATS$A custom weapon made using SGOTT'),
      }, {
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: '使用SGOTT制造',
      }],
    }
  }

  tableNode.value[1].value = path
  if(meta.category != null) tableNode.value[2].value = meta.category
  if(meta.dropRateModifier != null) tableNode.value[3].value = meta.dropRateModifier
  if(meta.level != null) tableNode.value[4].value = meta.level / 25
  if(meta.unlockState != null) tableNode.value[5].value = meta.unlockState
  if(meta.description != null) {
    textNode.value[3].value = generateWeaponText(template, meta.description)
  }
  const name = findVar(template, 'name').value[1].value
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
  files[`${weaponTableName}.SGO`][touched] = true
  files[`${weaponTextName}.SGO`][touched] = true
}

for(const [path, template] of Object.entries(raw)) {
  console.log(`Writing file: ${path}`)
  fs.writeFileSync(path, jsonToSgo.compiler()(template))
}

for(const {path, template} of Object.values(ids)) {
  console.log(`Writing file: ${path}`)
  fs.writeFileSync(path, jsonToSgo.compiler()(template))
}

const coreMods = fs
  .readdirSync(coreTemplateDir)
  .filter(file => /\.json$/.test(file))
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
