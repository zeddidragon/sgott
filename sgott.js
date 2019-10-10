#!/usr/bin/env node
const fs = require('fs')
const config = require('./package.json')
const sgoToJson = require('./converters/sgo/to-json')
const jsonToSgo = require('./converters/sgo/from-json')

const transforms = {
  sgo: sgoToJson,
  json: jsonToSgo,
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
      Can be "json" or "sgo". Override automatically inferred input type.

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

  function convertFileName(fileName) {
    const format = /\.json$/.exec(fileName) ? 'SGO' : 'json'
    return fileName.replace(/\..*$/, '.' + format)
  }

  function write(data) {
    if(writeFile && fs.existsSync(writeFile) && fs.lstatSync(writeFile).isDirectory()) {
      const path = writeFile + '/' + convertFileName(readFile.split('/').pop())
      fs.writeFileSync(path, data)
    } else if(writeFile) {
      fs.writeFileSync(writeFile, data)
    } else if(readFile) {
      fs.writeFileSync(convertFileName(readFile), data)
    } else {
      process.stdout.write(data)
    }
  }

  var type = (opts.t || opts.type || '').toLowerCase()

  if(opts.version) {
    console.log(config.name, config.version)
    console.log(config.description)
  } else if(opts.help) {
    console.log(help)
  } else if(readFile) {
    if(!type) type = (readFile.slice(-5).toLowerCase() === '.json'
      ? 'json'
      : 'sgo'
    )
    const buffer = fs.readFileSync(readFile)
    cb(buffer, type, opts, write)
  } else {
    const chunks = []
    process.stdin.on('data', chunk => chunks.push(chunk))
    process.stdin.on('end', () => {
      const buffer = Buffer.concat(chunks)
      if(!type) type = buffer.slice(0, 1).toString() === '{'
        ? 'json'
        : 'sgo'
      cb(Buffer.concat(chunks), type, opts, write)
    })
  }
}

function handle(buffer, type, opts, write) {
  write(transforms[type](buffer, opts))
}

parseCli(handle)
