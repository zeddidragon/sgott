#!/usr/bin/env node
const fs = require('fs')
const config = require('./package.json')
const sgoToJson = require('./converters/sgo/to-json')
const jsonToSgo = require('./converters/sgo/from-json')
const rmpToJson = require('./converters/rmp/to-json')
const jsonToRmp = require('./converters/rmp/from-json')

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

const transforms = {
  sgo: sgoToJson,
  rmp: rmpToJson,
  json(buffer, opts) {
    const parsed = JSON.parse(buffer.toString())
    if(isSgo(parsed)) return jsonToSgo.compiler(opts)(parsed)
    if(isRmp(parsed)) return jsonToRmp.compile(parsed, opts)
    throw new Error('Unable to recognize JSON format')
  },
}

const flagMap = {
  t: 'type',
  d: 'debug',
  m: 'mode',
  o: 'offset',
  v: 'version',
  h: 'help',
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

  SGO to JSON only:

  -d --debug
      Appends debug data to output JSON.

  -m --mode
      Can be "decompile" or "dumpvalues" .

      decompile:
        Default mode. Create JSON that can be edited and recompiled.
      dumpvalues:
        Array with consecutive values in struct and heap.
        Pointers are not dereferenced.

  -o --offset
      Byte to start reading from.
    
`

function parseCli(cb) {
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

  const [readFile, writeFile] = plain

  function convertFileName(fileName, target) {
    const format = /\.json$/.exec(fileName) ? 'SGO' : 'json'
    return fileName.replace(/\..*$/, '.' + target)
  }

  function write(data, type) {
    const target = type === 'json'
      ? (data.format || 'sgo').toUpperCase()
      : 'json'
    if(writeFile && fs.existsSync(writeFile) && fs.lstatSync(writeFile).isDirectory()) {
      const path = writeFile + '/' + convertFileName(readFile.split('/').pop(), target)
      fs.writeFileSync(path, data)
      console.log(path)
    } else if(writeFile) {
      fs.writeFileSync(writeFile, data)
      console.log(writeFile)
    } else if(readFile) {
      const path = convertFileName(readFile, target)
      fs.writeFileSync(path, data)
      console.log(path)
    } else {
      process.stdout.write(data)
    }
  }

  function inferType(buffer) {
    const ext4 = readFile && readFile.slice(-4)
    if(ext4 === '.sgo') return 'sgo'
    if(ext4 === '.rmp') return 'rmp'

    const ext5 = readFile && readFile.slice(-5)
    if(ext5 === '.json') return 'json'
    if(ext5 === '.rmpa') return 'rmp'

    const leader = buffer.slice(0, 4).toString()
    if(leader === 'SGO\0' || leader === '\0OGS') return 'sgo'
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
    cb(buffer, type || inferType(buffer), opts, write)
  } else {
    const chunks = []
    process.stdin.on('data', chunk => chunks.push(chunk))
    process.stdin.on('end', () => {
      const buffer = Buffer.concat(chunks)
      cb(Buffer.concat(chunks), type || inferType(buffer), opts, write)
    })
  }
}

function handle(buffer, type, opts, write) {
  write(transforms[type](buffer, opts), type)
}

parseCli(handle)
