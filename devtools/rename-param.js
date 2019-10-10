const fs = require('fs')
const allWeapons = require('./all-weapons')
const getNode = require('../helpers/get-node')
const meta = require('../converters/sgo/meta').names.ammoClasses.SentryGunBullet01

for(const [ weapon, id ] of allWeapons()) {
  const type = getNode(weapon, 'AmmoClass').value
  if(type !== 'SentryGunBullet01') continue
  const custom = getNode(weapon, 'Ammo_CustomParameter')
  if(!custom.value) {
    console.log(getNode(weapon, 'name'))
  }
  for(var i = 0; i < meta.length; i++) {
    const node = custom.value[i]
    const label = meta[i]
    if(node.options) delete node.options
    if(label) {
      node.name = label
    } else if(node.name) {
      delete node.name
    }
    console.log(id)
    console.log(custom.value.map(v => [v.name, v.type, v.value]))
  }
  fs.writeFileSync(`data/5/weapons/${id.toLowerCase()}.json`, JSON.stringify(weapon, null, 2))
}
