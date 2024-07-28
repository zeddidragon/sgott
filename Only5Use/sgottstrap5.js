#!/usr/bin/env node
const fs = require('fs')
const deepEqual = require('fast-deep-equal')
const sgoToJson = require('./converters/sgo/to-json')
const jsonToSgo = require('./converters/sgo/from-json')

const config = require('./config')
const weaponTable = require('./weapontable')
const weaponTextCN = require('./weapontext.CN')
const weaponTextEN = require('./weapontext.EN')
const weaponTextJA = require('./weapontext.JA')
const weaponTextKR = require('./weapontext.KR')
const gameTextCN = require('./TextTable_xbox.CN')
const gameTextEN = require('./TextTable_xbox.EN')
const gameTextJA = require('./TextTable_xbox.JA')
const gameTextKR = require('./TextTable_xbox.KR')
const generateWeaponText = require('../helpers/weapon-text')

const modDir = './edfmod'
const templateDir = './SgottTemplates'
const saveDir = '\\My Games\\EDF5_MODSAVES\\'
const weaponModDir = `${modDir}/weapon`
const configPath = `${modDir}/CONFIG.SGO`
const weaponTablePath = `${modDir}/_WEAPONTABLE.SGO`
const weaponTextCNPath = `${modDir}/_WEAPONTEXT.CN.SGO`
const weaponTextENPath = `${modDir}/_WEAPONTEXT.EN.SGO`
const weaponTextJAPath = `${modDir}/_WEAPONTEXT.JA.SGO`
const weaponTextKRPath = `${modDir}/_WEAPONTEXT.KR.SGO`
const coreTemplateDir = `${templateDir}/core`
const weaponTemplateDir = `${templateDir}/weapon`
const gameTextCNPath = `${modDir}/TextTable_xbox.CN.TXT_SGO`
const gameTextENPath = `${modDir}/TextTable_xbox.EN.TXT_SGO`
const gameTextJAPath = `${modDir}/TextTable_xbox.JA.TXT_SGO`
const gameTextKRPath = `${modDir}/TextTable_xbox.KR.TXT_SGO`
// Logical location, used for in-file links.
const EXEmodDir = './edfmod'
const EXEweaponModDir = `${EXEmodDir}/weapon`
const EXEconfigPath = `${EXEmodDir}/CONFIG.SGO`
const EXEweaponTablePath = `${EXEmodDir}/_WEAPONTABLE.SGO`

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

// Becuase upsert will be written repeatedly, only create original file.
function populatealways(key, path, fallback) {
  files[key] = fallback
  files[key][filePath] = path
}

populate('CONFIG.SGO', configPath, config)
populatealways('TextTable_xbox.CN.TXT_SGO', gameTextCNPath, gameTextCN)
populatealways('TextTable_xbox.EN.TXT_SGO', gameTextENPath, gameTextEN)
populatealways('TextTable_xbox.JA.TXT_SGO', gameTextJAPath, gameTextJA)
populatealways('TextTable_xbox.KR.TXT_SGO', gameTextKRPath, gameTextKR)
populate('_WEAPONTABLE.SGO', weaponTablePath, weaponTable)
populate('_WEAPONTEXT.CN.SGO', weaponTextCNPath, weaponTextCN)
populate('_WEAPONTEXT.EN.SGO', weaponTextENPath, weaponTextEN)
populate('_WEAPONTEXT.JA.SGO', weaponTextJAPath, weaponTextJA)
populate('_WEAPONTEXT.KR.SGO', weaponTextKRPath, weaponTextKR)

console.log('Patching executable...')
;(function(){
  const exePath = './EDF5.exe'
  const buffer = fs.readFileSync(exePath)

  const path = './EDF5-sgott-backup.exe'
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

  replace('app:/DefaultPackage/config.sgo', EXEconfigPath)
  //Todo: Actualy cound how many references and do this in a cleaner, more rational way
  replace('\\My Games\\EDF5\\SAVE_DATA\\', saveDir)
  replace('\\My Games\\EDF5\\SAVE_DATA\\', saveDir)
  replace('\\My Games\\EDF5\\SAVE_DATA\\', saveDir)
  replace('\\My Games\\EDF5\\SAVE_DATA\\', saveDir)
  replace('\\My Games\\EDF5\\SAVE_DATA\\', saveDir)
  replace('app:/etc/TextTable_xbox.%LOCALE%.txt_sgo', `${EXEmodDir}/TextTable_xbox.%LOCALE%.TXT_SGO`)
  //Todo: UP to 256 boxes in map 
  buffer.writeIntLE(256, 0x197999, 0x4)
  //Todo: fix to mission list error
  buffer.write("448B52F84439D172044831C0C367488D0C49488D048A486348084801C1486341084801C8C3", 0x64660, 0x37, "hex")
  buffer.write("418BCCE8C1EFB0FF4885C00F84CE00000090904C8BC0", 0x555697, 0x22, "hex")

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
  value: EXEweaponTablePath,
})
patch(config, 'WeaponText', {
  type: 'string',
  name: 'WeaponText',
  value: `${EXEmodDir}/_WEAPONTEXT.%LOCALE%.SGO`,
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
const textCNValues = files['_WEAPONTEXT.CN.SGO'].variables[0].value
const textENValues = files['_WEAPONTEXT.EN.SGO'].variables[0].value
const textJAValues = files['_WEAPONTEXT.JA.SGO'].variables[0].value
const textKRValues = files['_WEAPONTEXT.KR.SGO'].variables[0].value

function findTableNode(id) {
  return tableValues.find(t => t.value[0].value === id)
}

function insertTableNode(index, tableNode, textCNNode, textENNode, textJANode, textKRNode) {
  files['_WEAPONTABLE.SGO'][touched] = true
  files['_WEAPONTEXT.CN.SGO'][touched] = true
  files['_WEAPONTEXT.EN.SGO'][touched] = true
  files['_WEAPONTEXT.JA.SGO'][touched] = true
  files['_WEAPONTEXT.KR.SGO'][touched] = true
  tableValues.splice(index, 0, tableNode)
  textCNValues.splice(index, 0, textCNNode)
  textENValues.splice(index, 0, textENNode)
  textJAValues.splice(index, 0, textJANode)
  textKRValues.splice(index, 0, textKRNode)
}

const ids = {}
const raw = {}

function format(pair) {
  if(!pair) return ''
  const [key, value] = pair
  return ('' + key).padStart(18) + ': ' + ('' + value).padEnd(11)
}

for(const mod of weaponMods) {
  console.log(`Applying: ${mod}`)
  const template = JSON
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

  function findVar(name) {
    return template.variables.find(n => n.name === name)
  }

  var tableNode, textCNNode, textENNode, textJANode, textKRNode
  if(existing) {
    tableNode = existing
    const index = tableValues.indexOf(existing)
    textCNNode = textCNValues[index]
    textENNode = textENValues[index]
    textJANode = textJAValues[index]
    textKRNode = textKRValues[index]
    if(before || after) {
      tableValues.splice(index, 1)
      textCNValues.splice(index, 1)
      textENValues.splice(index, 1)
      textJAValues.splice(index, 1)
      textKRValues.splice(index, 1)
    }
  } else {
    tableNode = {
      type: 'ptr',
      value: [{
        type: 'string',
        value: id,
      }, {
        type: 'string',
        value: `${EXEweaponModDir}/${mod}.SGO`,
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
      }, {
        type: 'ptr',
        value: null,
      },
      {
        type: 'int',
        value: 0,
      }],
    }

    textCNNode = {
      type: 'ptr',
      value: [{
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: '使用SGOTT制造的定制武器',
      }, {
        type: 'ptr',
        value: null,
      }],
    }

    textENNode = {
      type: 'ptr',
      value: [{
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: 'A custom weapon made using SGOTT',
      }, {
        type: 'ptr',
        value: null,
      }],
    }

    textJANode = {
      type: 'ptr',
      value: [{
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: 'SGOTTを使用して作られたカスタム武器',
      }, {
        type: 'ptr',
        value: null,
      }],
    }

    textKRNode = {
      type: 'ptr',
      value: [{
        type: 'string',
        value: '',
      }, {
        type: 'string',
        value: 'KR A custom weapon made using SGOTT',
      }, {
        type: 'ptr',
        value: null,
      }],
    }
  }

  tableNode.value[1].value = path
  if(meta.category != null) tableNode.value[2].value = meta.category
  if(meta.dropRateModifier != null) tableNode.value[3].value = meta.dropRateModifier
  if(meta.level != null) tableNode.value[4].value = meta.level / 25
  if(meta.unlockState != null) tableNode.value[5].value = meta.unlockState
  if(meta.StarRating != null) tableNode.value[6].value = meta.StarRating
  if(meta.DLCWeapon != null) tableNode.value[7].value = meta.DLCWeapon

  if(meta.TextDescCN != null) {
    textCNNode.value[1].value = generateWeaponText(template, meta.TextDescCN)
  }
  if(meta.TextDescEN != null) {
    textENNode.value[1].value = generateWeaponText(template, meta.TextDescEN)
  }
  if(meta.TextDescJA != null) {
    textJANode.value[1].value = generateWeaponText(template, meta.TextDescJA)
  }
  if(meta.TextDescKR != null) {
    textKRNode.value[1].value = generateWeaponText(template, meta.TextDescKR)
  }

  if(meta.AbilityDescCN != null) {
    textCNNode.value[2].value = meta.AbilityDescCN
  }
  if(meta.AbilityDescEN != null) {
    textENNode.value[2].value = meta.AbilityDescEN
  }
  if(meta.AbilityDescJA != null) {
    textJANode.value[2].value = meta.AbilityDescJA
  }
  if(meta.AbilityDescKR != null) {
    textKRNode.value[2].value = meta.AbilityDescKR
  }

  const namecn = findVar('name.cn').value
  if(namecn !== textCNNode.value[0].value) {
    textCNNode.value[0].value = namecn
  }
  const nameen = findVar('name.en').value
  if(nameen !== textENNode.value[0].value) {
    textENNode.value[0].value = nameen
  }
  const nameja = findVar('name.ja').value
  if(nameja !== textJANode.value[0].value) {
    textJANode.value[0].value = nameja
  }
  const namekr = findVar('name.kr').value
  if(namekr !== textKRNode.value[0].value) {
    textKRNode.value[0].value = namekr
  }

  if(after) {
    insertTableNode(tableValues.indexOf(after) + 1, tableNode, textCNNode, textENNode, textJANode, textKRNode)
  } else if(before) {
    insertTableNode(tableValues.indexOf(before), tableNode, textCNNode, textENNode, textJANode, textKRNode)
  } else if(!existing) {
    tableValues.push(tableNode)
    textCNValues.push(textCNNode)
    textENValues.push(textENNode)
    textJAValues.push(textJANode)
    textKRValues.push(textKRNode)
  }

  ids[id] = {path, template}
}

succeeded = Object.keys(ids).length

if(succeeded) {
  files['_WEAPONTABLE.SGO'][touched] = true
  files['_WEAPONTEXT.CN.SGO'][touched] = true
  files['_WEAPONTEXT.EN.SGO'][touched] = true
  files['_WEAPONTEXT.JA.SGO'][touched] = true
  files['_WEAPONTEXT.KR.SGO'][touched] = true
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
