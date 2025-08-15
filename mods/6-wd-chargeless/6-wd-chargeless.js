// Run this file from roto of the project where package.json is
// The path for this file should. relatively, be ./mods/6-wd-chargeless/6-wd-chargeless.js

// Find all WD weapons that needs charging up, then change them to standard background reload like in EDF2-4
// While this makes the weapons more powerful and more flexible, some players find the new Wing Diver status quo have ruined enjoyment of the class and comfort of the game.

// I dedicate this mod to my friend, Palewing, who requested it.

const root = '../..'
const { readFile, writeFile, mkdir } = require('fs').promises
const getNode = require(root + '/helpers/get-node')
const { compilers } = require(root + '/globals')
const compiler = require(root + '/converters/compiler')

async function readWeapon(path) {
  const text = await readFile(`data/6/weapon/${path.toUpperCase()}.json`)
  return JSON.parse(text)
}


async function main() {
  const table = await readWeapon('weapontable')
  const textTable = await readWeapon('weapontext.en')
  
  const outDir = `./release/6-wd-chargeless/weapon`
  await mkdir(outDir, { recursive: true })

  const weapons = await Promise.all(
    table.variables[0].value
      .map(({ value: [
        { value: name },
        { value: path },
        { value: category }
      ] }) => ({ name, path, category }))
      .filter(({ category }) => Math.floor(category / 100) === 1)
      .map(async ({ name, path, category }) => {
        const id = path.replace('app:/weapon/', '').replace('.sgo', '')
        return {
          id,
          name,
          path,
          category,
          config: await readWeapon(id),
        }
      })
  )
  const wpnClassFrom = 'Weapon_ChargeShoot'
  const wpnClassTo = 'Weapon_PreChargeShoot'
  const writes = weapons
    .filter(({ id, config }) => {
      const wpnClass = getNode(config, 'xgs_scene_object_class')
      if(wpnClass.value !== wpnClassFrom) return false

      wpnClass.value = wpnClassTo
      config.strings.splice(wpnClassFrom, 1, wpnClassTo)
      return true
    })
    .map(({ id, config }) => {
      const compiled = compilers.dsgo(compiler, config)
      const path = `${outDir}/${id}.sgo`
      console.log('writing ' + path + '...')
      return writeFile(path, compiled)
    })
  return Promise.all(writes)
}

main()
  .then(console.log)
  .then(() => {
    console.log('Done')
    process.exit(0)
  })

