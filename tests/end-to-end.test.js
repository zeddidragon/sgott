const util = require('util')
const child = require('child_process')
const fs = require('fs/promises')
const path = require('path')
const { describe, it } = require('node:test')
const exec = util.promisify(child.exec)

describe('end-to-end tests', async () => {
  function p(filePath) {
    // Full path relative to this file for consistent testing
    // Node's default behavior is relative to your working directory
    return path.resolve(__dirname, filePath)
  }
  await fs.mkdir(p('./_output'), { recursive: true })

  it('converts a 41 SGO to JSON', async t => {
    await exec(`node sgott.js ${p('../testdata/WEAPON600.SGO')} ${p('./_output/WEAPON600.json')}`)
    const [original, testRun] = await Promise.all([
      fs.readFile(p('../data/41/weapon/WEAPON600.json'), 'utf8'),
      fs.readFile(p('./_output/WEAPON600.json'), 'utf8'),
    ])
    t.assert.deepStrictEqual(JSON.parse(original), JSON.parse(testRun))
  })

  it('converts a 41 JSON to SGO', async t => {
    await exec(`node sgott.js ${p('../data/41/weapon/WEAPON600.json')} ${p('./_output/WEAPON600.SGO')}`)
    const [original, testRun] = await Promise.all([
      fs.readFile(p('../testdata/weapon600-baseline.sgo')), // The real file was a few bytes different, so I use a conversion
      fs.readFile(p('./_output/WEAPON600.SGO')),
    ])
    t.assert.deepStrictEqual(original, testRun)
  })

  it('converts a 2017 SGO to JSON', async t => {
    await exec(`node sgott.js ${p('../testdata/2017-weapon043.SGO')} ${p('./_output/2017-weapon043.json')}`)
    const [original, testRun] = await Promise.all([
      fs.readFile(p('../data/3/weapon/Weapon043.json'), 'utf8'),
      fs.readFile(p('./_output/2017-weapon043.json'), 'utf8'),
    ])
    t.assert.deepStrictEqual(JSON.parse(original), JSON.parse(testRun))
  })

  it('converts a 2017 JSON to SGO', async t => {
    await exec(`node sgott.js ${p('../data/3/weapon/weapon043.json')} ${p('./_output/WEAPON043.SGO')}`)
    const [original, testRun] = await Promise.all([
      fs.readFile(p('../testdata/2017-weapon043.sgo')), // The real file was a few bytes different, so I use a conversion
      fs.readFile(p('./_output/WEAPON043.SGO')),
    ])
    t.assert.deepStrictEqual(original, testRun)
  })

  it('converts a 6 DSGO to JSON', async t => {
    await exec(`node sgott.js ${p('../testdata/E605_SPINNERUFO_BLUE.SGO')} ${p('./_output/E605_SPINNERUFO_BLUE.json')}`)
    const [original, testRun] = await Promise.all([
      fs.readFile(p('../data/6/OBJECT/E605_SPINNERUFO_BLUE.json'), 'utf8'),
      fs.readFile(p('./_output/E605_SPINNERUFO_BLUE.json'), 'utf8'),
    ])
    t.assert.deepStrictEqual(JSON.parse(original), JSON.parse(testRun))
  })

  it('converts a 6 JSON to DSGO', async t => {
    await exec(`node sgott.js ${p('../data/6/OBJECT/E605_SPINNERUFO_BLUE.json')} ${p('./_output/E605_SPINNERUFO_BLUE.SGO')}`)
    const [original, testRun] = await Promise.all([
      fs.readFile(p('../testdata/E605_SPINNERUFO_BLUE-baseline.SGO')), // The real file had a ton of redundant data discarded in conversion
      fs.readFile(p('./_output/E605_SPINNERUFO_BLUE.SGO')),
    ])
    t.assert.deepStrictEqual(original, testRun)
  })

})
