const DsgoType = require('../dsgo-type')

// Resolve the value of nodes pointing at addresses
function resolveDsgo({ header, tables, nodes, strings, extras, calcs }, output) {
  const nodesWithParents = new Set()
  const nodePaths = new Array(nodes.length) // Track path of each node

  function abort(message) {
    throw new Error(message)
  }

  function resolve(node, index = 0, path = []) {
    nodesWithParents.add(node)
    const { type, double, ptr, nameAddress } = node

    // Store paths for all nodes
    // Node names are preferred over indices when available.
    // Some example paths:
    // ["ShellFishSettings", "gun_battery", "_l"]
    // ["ShellFishSettings", "weak_point", "body", 0, "normal", 1]
    const name = strings[nameAddress]
    const topIndex = nodes.indexOf(node)
    if(topIndex < 0)
      throw new Error('Node is not registered')
    path = [...path, name || index]
    nodePaths[topIndex] = path

    const ret = { name }
    switch(type) {
      case DsgoType.DOUBLE: {
        ret.type = 'double'
        ret.value = double
        break
      }

      case DsgoType.STRING: {
        const string = strings[ptr]
        if(string == null)
          abort(`String not found at ${ptr}`)
        ret.type = 'string'
        ret.value = string
        break
      }

      case DsgoType.EXTRA: {
        const extra = extras[ptr]
        if(extra == null)
          abort(`Extra not found at ${ptr}`)
        ret.type = 'extra'
        ret.value = 'extra'
        // TODO: Decompile embedded file
        break
      }

      case DsgoType.DSGO: {
        const table = tables[ptr]
        if(table == null)
          abort(`Table not found at ${ptr}`)
        ret.type = 'ptr'
        ret.value = table.map((n, i) => resolve(n, i, path))
        break
      }

      case DsgoType.CALC: {
        const calc = calcs[ptr]
        if(calc == null)
          abort(`Calc equation not found at ${ptr}`)
        ret.type = 'calc'
        ret.value = calc
        break
      }

      default: {
        abort(`Unhandled node type: ${type} (${double}|${ptr}})`)
      }
    }
    return ret
  }

  const rootNode = nodes.find(n => n.address === header.rootPtr)
  if(!rootNode)
    abort('Root node not found')
  nodesWithParents.add(rootNode)
  const rootTable = tables[rootNode.ptr]
  if(!rootTable)
    abort('Root table not found')

  const variables = resolve(rootNode)
  output.variables = variables

  function resolveCalc(command) {
    const { cmd, values, value } = command
    if (cmd === 'ref') { // Points to node index which we want to resolve
      const path = nodePaths[value]
      console.log('ref')
      if (path) {
        command.value = path
      } else { // The parent of this node is this calc
        command.type = 'embed'
        command.value = resolve(nodes[value], 0)
      }
    } else if(values) {
      for(const command of values) {
        resolveCalc(command)
      }
    }
  }

  const orphans = nodes.filter(n => !nodesWithParents.has(n)) 
  output.orphans = orphans
  console.log(orphans.length)

  for(const command of Object.values(calcs)) {
    resolveCalc(command)
  }
}

module.exports = {
  resolveDsgo,
}
