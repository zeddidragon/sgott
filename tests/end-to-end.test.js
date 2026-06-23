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

  async function compareFiles(t, fileA, fileB) {
    fileA = p(fileA)
    fileB = p(fileB)
    const [a, b] = await Promise.all([
      fs.readFile(fileA, 'utf8'),
      fs.readFile(fileB, 'utf8'),
    ])
    try {
      t.assert.deepStrictEqual(a, b)
    } catch {
      throw new Error(`Expected the two files to be equal but they weren't:\n${fileA} ${fileB}`)
    }
  }

  async function compareJson(t, fileA, fileB) {
    const [a, b] = await Promise.all([
      fs.readFile(p(fileA), 'utf8'),
      fs.readFile(p(fileB), 'utf8'),
    ])
    const aObj = JSON.parse(a)
    const bObj = JSON.parse(b)
    delete aObj.sgott // No need to test version matching
    delete bObj.sgott
    t.assert.deepStrictEqual(aObj, bObj)
  }

  it('converts a 41 SGO to JSON', async t => {
    await exec(`node sgott.js ${p('../testdata/WEAPON600.SGO')} ${p('./_output/WEAPON600.json')}`)
    await compareJson(t, '../data/41/weapon/WEAPON600.json', './_output/WEAPON600.json')
  })

  it('converts a 41 JSON to SGO', async t => {
    await exec(`node sgott.js ${p('../data/41/weapon/WEAPON600.json')} ${p('./_output/WEAPON600.SGO')}`)
    await compareFiles(t, '../testdata/weapon600-baseline.sgo', './_output/WEAPON600.SGO')
  })

  it('converts a 2017 SGO to JSON', async t => {
    await exec(`node sgott.js ${p('../testdata/2017-weapon043.SGO')} ${p('./_output/2017-weapon043.json')}`)
    await compareJson(t, '../data/3/weapon/Weapon043.json', './_output/2017-weapon043.json')
  })

  it('converts a 2017 JSON to SGO', async t => {
    await exec(`node sgott.js ${p('../data/3/weapon/weapon043.json')} ${p('./_output/WEAPON043.SGO')}`)
    await compareFiles(t,
      '../testdata/2017-weapon043.sgo', // The real file was a few bytes different, so I use a conversion
      './_output/WEAPON043.SGO')
  })

  it.skip('converts a 6 DSGO to JSON', async t => {
    await exec(`node sgott.js ${p('../testdata/E605_SPINNERUFO_BLUE.SGO')} ${p('./_output/E605_SPINNERUFO_BLUE.json')}`)
    await compareJson(t, '../data/6/OBJECT/E605_SPINNERUFO_BLUE.json', './_output/E605_SPINNERUFO_BLUE.json')
  })

  it('converts a 6 JSON to DSGO', async t => {
    await exec(`node sgott.js ${p('../data/6/OBJECT/E605_SPINNERUFO_BLUE.json')} ${p('./_output/E605_SPINNERUFO_BLUE.SGO')}`)
    await compareFiles(t,
      '../testdata/E605_SPINNERUFO_BLUE-baseline.SGO', // The real file had a ton of redundant data discarded in conversion
      './_output/E605_SPINNERUFO_BLUE.SGO')
  })

  it.skip('converts a converteded file back', async t => {
    await exec(`node sgott.js ${p('../testdata/E616_SHIELD2.SGO')} ${p('./_output/E616_SHIELD2.json')}`)
    await exec(`node sgott.js ${p('./_output/E616_SHIELD2.json')} ${p('./_output/E616_SHIELD2-bnf-test.SGO')}`)
    await exec(`node sgott.js ${p('./_output/E616_SHIELD2-bnf-test.SGO')} ${p('./_output/E616_SHIELD2-bnf-test-forth.json')}`)
    await compareFiles(t, './_output/E616_SHIELD2-bnf-test.SGO', '../testdata/E616_SHIELD2.SGO')
    await compareJson(t, './_output/E616_SHIELD2-bnf-test.json', './_output/E616_SHIELD2-bnf-test-forth.json')
  })

  it('exports embedded files when configured to', async t => {
    await exec(`node sgott.js ${p('../testdata/E605_SPINNERUFO_BLUE.SGO')} --export-extra ${p('./_output/E605_SPINNERUFO_BLUE_EXPORT.json')}`)
    await compareJson(t, '../testdata/E605_SPINNERUFO_BLUE_EXPORT.json', './_output/E605_SPINNERUFO_BLUE_EXPORT.json')

    const fileNames = [
      'E605_SPINNERUFO_BLUE__extra_35.bin',
      'E605_SPINNERUFO_BLUE__extra_380.bin',
      'E605_SPINNERUFO_BLUE__extra_383.bin',
      'E605_SPINNERUFO_BLUE__extra_386.bin',
      'E605_SPINNERUFO_BLUE__extra_389.bin',
      'E605_SPINNERUFO_BLUE__extra_82.bin',
      'E605_SPINNERUFO_BLUE__extra_85.bin',
      'E605_SPINNERUFO_BLUE__extra_88.bin',
      'E605_SPINNERUFO_BLUE__extra_91.bin',
      'E605_SPINNERUFO_BLUE__extra_97.json',
    ]
    const testExtras = fileNames.map(fileName => fs.readFile(p(`./_output/${fileName}`)))
    const baselines = fileNames.map(fileName => fs.readFile(p(`../testdata/${fileName}`)))
    t.assert.deepStrictEqual(await Promise.all(testExtras), await Promise.all(baselines))
  })
})
