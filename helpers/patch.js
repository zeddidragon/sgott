const getNode = require('./get-node.js')

function patch(template, name, value) {
  const node = getNode(template, name)
  const v = typeof value === 'function' ? value(node.value, node) : value
  node.value = v
}

module.exports = patch
