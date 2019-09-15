const fs = require('fs')

function allWeapons(cb) {
  const table = require('../data/5/weapons/weapontable.json').variables[0].value
  return table.map(({ value: wpn }) => {
    const id = wpn[0].value
    const weapon = require(`../data/5/weapons/${id.toLowerCase()}.json`)
    return [ weapon, id ]
  })
}

module.exports = allWeapons
