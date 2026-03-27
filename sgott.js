#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const json = require('json-stringify-pretty-compact')
const globals = require('./globals.js')
const config = require('./package.json')
const compiler = require('./converters/compiler.js')
const decompiler = require('./converters/decompiler.js')

function isBlocks(obj) {
  if(obj[0]?.type === 'header') return true
  return false
}

function isDsgo(obj) {
  if(/^dsgo$/i.test(obj.format)) return true
  return false
}

function isSgo(obj) {
  if(/^sgo$/i.test(obj.format)) return true
  if(obj.variables) return true
  return false
}

function isRmp(obj) {
  if(/^rmp/i.test(obj.format)) return true
  if(obj.routes) return true
  if(obj.shapes) return true
  if(obj.cameras) return true
  if(obj.spawns) return true
  return false
}

const { compilers, decompilers, blocks } = globals
const transforms = {
  dsgo: (...args) => json(decompilers.dsgo(...args)),
  sgo: (...args) => json(decompilers.sgo(decompiler, ...args)),
  rmp: (...args) => json(decompilers.rmp(decompiler, ...args)),
  json(buffer, state) {
    const parsed = JSON.parse(buffer.toString())
    if(isBlocks(parsed)) {
      if(state.opts.compile) return blocks.toDsgo(parsed)
      if(state.opts.resolve) return json(blocks.toJson(parsed))
      throw new Error('Specify if this should be resolved with --resolve or recompiled with --compile')
    }
    if(isDsgo(parsed)) return compilers.dsgo(parsed, state, globals)
    if(isSgo(parsed)) return compilers.sgo(compiler, parsed, state, globals)
    if(isRmp(parsed)) return compilers.rmp(compiler, parsed, state, globals)
    throw new Error('Unable to recognize JSON format')
  },
}

const flagMap = {
  b: 'blocks',
  d: 'debug',
  h: 'help',
  m: 'mode',
  o: 'offset',
  t: 'type',
  v: 'version',
  x: 'export-extra',
}

const help = `
${config.name} ${config.version}
${config.description}

Usage:
  sgott <infile.sgo> [<outfile.json>]
  sgott <infile.json> [<outfile.sgo>]
  sgott --type=json infile.txt outfile.sgo
  sgott < infile.sgo > outfile.json
  sgott < infile.json > outfile.sgo

Options:
  -t  --type
      Can be "json", "sgo", or "rmp". Override automatically inferred input type.

  -h --help
      Prints this help text, then quits.

  -v --version
      Prints version information, then quits.

  SGO to JSON:

  -d --debug
      inserts debug data in output json.

  -o --offset
      Byte to start reading from.

  -b --blocks
      Parse into a lossless in-between format that describes chunks of data

  -x --export-extra
      Instead of embedding extra files as hex strings in the file, dump them to a seperate file
    
  RMP to JSON:

  -d --debug
      inserts debug data in output json.

`

function parseCli(cb) {
  const state = {
    version: config.version,
    compilers,
    decompilers,
  }
  const args = process.argv.slice(2)
  const opts = {}
  const plain = []

  for(var i = 0; i < args.length; i++) {
    const arg = args[i]
    if(arg[0] !== '-') {
      plain.push(arg)
      continue
    }
    const offset = arg[1] === '-' ? 2 : 1
    const equalIndex = arg.indexOf('=')
    if(~equalIndex) {
      const key = arg.slice(offset, equalIndex)
      const val = arg.slice(equalIndex + 1)
      opts[key] = val
    } else {
      opts[arg.slice(offset)] = true
    }
  }

  for(const [w, word] of Object.entries(flagMap)) {
    if(opts[w] && !opts[word]) opts[word] = opts[w]
  }
  state.opts = opts
  state.debug = opts.debug

  const [readFile, writeFile] = plain
  const readDir = path.dirname(path.resolve(readFile))
  const writeDir = writeFile ? path.dirname(path.resolve(writeFile)) : readDir

  function convertFileName(fileName, target) {
    const dir = path.dirname(fileName)
    const ext1 = path.extname(fileName)
    fileName = path.basename(fileName, ext1)

    // Remove the .blocks in .blocks.json
    const ext2 = path.extname(fileName)
    if(ext2 === '.blocks') {
      fileName = path.basename(fileName, ext2)
    }

    return [dir, fileName].join(path.sep) + '.' + target
  }

  function extraPath(fileName) {
    const baseName = path.basename(readFile, path.extname(readFile))
    return path.join(writeDir, `${baseName}__${fileName}`)
  }
  function writeExtra(fileName, ...args) {
    const filePath = extraPath(fileName)
    fs.writeFileSync(filePath, ...args)
    console.log(filePath)
    return path.basename(filePath)
  }
  function readExtra(fileName) {
    return fs.readFileSync(path.join(readDir, fileName))
  }
  state.writeExtra = writeExtra
  state.readExtra = readExtra

  function write(data, type) {
    let target
    if(opts.blocks)
      target = 'blocks.json'
    else if(opts.resolve)
      target = 'json'
    else if(type === 'json')
      target = (data.format || 'sgo').toUpperCase()
    else
      target = 'json'

    let fileName
    if(writeFile && fs.existsSync(writeFile) && fs.lstatSync(writeFile).isDirectory()) {
      fileName = writeFile + '/' + convertFileName(readFile.split('/').pop(), target)
    } else if(writeFile) {
      fileName = writeFile
    } else if(readFile) {
      fileName = convertFileName(readFile, target)
    } else {
      process.stdout.write(data)
      if(opts['export-external'])
        console.warn('Additional files not supported')
      // TODO: Write out extra files to stdout
      return
    }

    console.log(fileName)
    fs.writeFileSync(fileName, data)
  }

  function inferType(buffer) {
    const ext4 = readFile && readFile.slice(-4)
    if(ext4 === '.rmp') return 'rmp'

    const ext5 = readFile && readFile.slice(-5)
    if(ext5 === '.json') return 'json'
    if(ext5 === '.rmpa') return 'rmp'

    const leader = buffer.slice(0, 4).toString()
    if(leader === 'SGO\0' || leader === '\0OGS') return 'sgo'
    if(leader === 'DSGO' || leader === 'OGSD') return 'dsgo'
    if(leader === 'RMP\0' || leader === '\0PMR') return 'rmp'
    if(leader.replace(/\u0000/g, '').trim()[0] === '{') return 'json'

    throw new Error('Unable to infer format')
  }

  const type = (opts.t || opts.type || '').toLowerCase()
  if(opts.version) {
    console.log(config.name, config.version)
    console.log(config.description)
  } else if(opts.help) {
    console.log(help)
  } else if(readFile) {
    const buffer = fs.readFileSync(readFile)
    cb(buffer, type || inferType(buffer), state, write)
  } else {
    const chunks = []
    process.stdin.on('data', chunk => chunks.push(chunk))
    process.stdin.on('end', () => {
      const buffer = Buffer.concat(chunks)
      cb(Buffer.concat(chunks), type || inferType(buffer), state, write)
    })
  }
}

function handle(buffer, type, state, write) {
  write(transforms[type](buffer, state, globals), type)
}

parseCli(handle)
