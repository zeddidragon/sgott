import fs from 'fs'

function allWeapons() {
  return Array.from(eachWeapon())
}

function eachWeapon() {
  const table = require('../data/5/weapons/weapontable.json').variables[0].value

  const weaponIterator = {
    *[Symbol.iterator]() {
      for(const { value: wpn } of table) {
        const id = wpn[0].value
        yield [ require(`../data/5/weapons/${id.toLowerCase()}.json`), wpn ]
      }
    },
  }

  return weaponIterator
}

allWeapons.each = eachWeapon

export default allWeapons
