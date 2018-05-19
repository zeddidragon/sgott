#!/usr/bin/env node
const fs = require('fs')
const sgoToJson = require('../sgo-json')
const jsonToSgo = require('../json-sgo')

const config = require('./config')
const weaponTable = require('./weapontable')
const weaponText = require('./weapontext')

const modDir = './SgottMods'
const templateDir = './SgottTemplates'
const weaponModDir = `${modDir}/weapon`
const configPath = `${modDir}/CONFIG.SGO`
const weaponTablePath = `${modDir}/_WEAPONTABLE.SGO`
const weaponTextPath = `${modDir}/_WEAPONTEXT.SGO`
const weaponTemplateDir = `${templateDir}/weapon`

console.log('Patching executable...')
;(function(){
  const exePath = './EDF41.exe'
  const buffer = fs.readFileSync(exePath)
  const index = buffer.indexOf('app:/DefaultPackage/config.sgo', 'utf16le')
  if(!~index) {
    console.error('Default executable not found. Skipping...')
    return
  }

  const path = './EDF41-sgott-backup.exe'
  if(fs.existsSync(path)) {
    console.error('Backup already exists. Skipping...')
  } else {
    console.log('Backing up...')
    fs.writeFileSync(path, buffer)
  }

  buffer.write(configPath + '\0', index, 'utf16le')
  fs.writeFileSync(exePath, buffer)
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
mkdir(weaponTemplateDir)

if(!fs.existsSync(configPath)) {
  config.variables.find(n => n.name === 'WeaponTable').value = weaponTablePath
  config.variables.find(n => n.name === 'WeaponText').value = weaponTextPath
  fs.writeFileSync(configPath, jsonToSgo.compiler()(config))
}

console.log('Patching weapons tables')
var failed = 0

const mods = fs
  .readdirSync(weaponTemplateDir)
  .filter(name => name.slice(-5).toLowerCase() === '.json')
  .map(name => name.slice(0, -5))

console.log(`Mods found: ${mods.length}`)

const table = fs.existsSync(weaponTablePath)
  ? sgoToJson.decompiler()(fs.readFileSync(weaponTablePath))
  : weaponTable
const tableValues = table.variables[0].value

const text = fs.existsSync(weaponTextPath)
  ? sgoToJson.decompiler()(fs.readFileSync(weaponTextPath))
  : weaponText
const textValues = text.variables[0].value

function findTableNode(id) {
  return tableValues.find(t => t.value[0].value === id)
}

function insertTableNode(index, tableNode, textNode) {
  tableValues.splice(index, 0, tableNode)
  textValues.splice(index, 0, textNode)
}

const ids = {}

function format(pair) {
  if(!pair) return ''.padStart(25)
  const [key, value] = pair
  return ('' + key).padStart(12) + ':' + ('' + value).padEnd(12)
}

function tabulate(pairs) {
  pairs = pairs.filter(p => p)
  var ret = '<font face=%dq%$FixedFont%dq% color=%dq%#ffffff%dq%>'
  for(var i = 0; i < 6; i++) {
    const leftPair = pairs[i]
    const rightPair = pairs[i + 6]
    ret += format(leftPair) + format(rightPair) + '\n'
  }
  return ret +
    '<font face=%dq%$NormalFont%dq% color=%dq%#80c3f5%dq%>\n' +
    'A custom weapon made using SGOTT.'
}

for(const mod of mods) {
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
        value: tabulate([
          ['Capacity', findVar('AmmoCount').value],
          ['ROF', +(60 / +findVar('FireInterval').value).toFixed(1)],
          ['Damage', findVar('AmmoDamage').value],
          ['Reload Time', +(60 / +findVar('ReloadTime')).toFixed(1)],
        ]),
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
  if(meta.description != null) textNode.value[3].value = meta.description
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

for(const {path, template} of Object.values(ids)) {
  console.log(`Writing file: ${path}`)
  fs.writeFileSync(path, jsonToSgo.compiler()(template))
}

console.log(`Writing table file: ${weaponTablePath}`)
fs.writeFileSync(weaponTablePath, jsonToSgo.compiler()(table))
console.log(`Writing text file: ${weaponTextPath}`)
fs.writeFileSync(weaponTextPath, jsonToSgo.compiler()(text))

console.log(`Done, ${Object.keys(ids).length} succeeded and ${failed} failed`)
