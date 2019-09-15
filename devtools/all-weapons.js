const fs = require('fs')

function allWeapons(cb) {
  const table = require('../data/41/weapons/weapontable.json').variables[0].value
  return table.map(({ value: wpn }) => {
    const id = wpn[0].value
    const weapon = require(`../data/41/weapons/${id.toUpperCase()}.json`)
    return [ weapon, id ]
  })
}

module.exports = allWeapons
