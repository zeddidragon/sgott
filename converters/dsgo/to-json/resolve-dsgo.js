const DsgoType = require('../dsgo-type')

// Resolve the value of nodes pointing at addresses
function resolveDsgo({ header, tables, nodes, strings, extras, calcs }) {
  const stack = []
  const nodePaths = new WeakMap() // Track path of each node

  function abort(message) {
    console.log(stack)
    throw new Error(message)
  }

  function stackNode(node) {
    stack.push(node)
  }

  function popNode(node) {
    stack.pop(node)
  }

  function resolve(node, index) {
    const { type, double, ptr, nameAddress } = node
    const name = strings[nameAddress]
    switch(type) {
      case DsgoType.DOUBLE: {
        return { type: 'double', value: double }
      }

      case DsgoType.STRING: {
        const string = strings[ptr]
        if(string == null)
          abort(`String not found at ${ptr}`)
        return { type: 'string', value: string }
      }

      case DsgoType.EXTRA: {
        const extra = extras[ptr]
        if(extra == null)
          abort(`Extra not found at ${ptr}`)
        return { type: 'extra', value: extra }
      }

      case DsgoType.DSGO: {
        const table = tables[ptr]
        if(table == null)
          abort(`Table not found at ${ptr}`)
        stackNode(node, index)
        const variables = table.map(resolve)
        popNode(node)
        return { type: 'ptr', value: variables }
      }

      case DsgoType.CALC: {
        const calc = calcs[ptr]
        if(calc == null)
          abort(`Calc equation not found at ${ptr}`)
        return { type: 'calc', value: calc }
      }

      default: {
        abort(`Unhandled node type: ${type} (${double}|${ptr}})`)
      }
    }
  }

  const rootNode = nodes.find(n => n.address === header.rootPtr)
  if(!rootNode)
    abort('Root node not found')
  const rootTable = tables[rootNode.ptr]
  if(!rootTable)
    abort('Root table not found')
  stack.push(rootTable)

  return rootTable.map(resolve)
}

module.exports = {
  resolveDsgo,
}
