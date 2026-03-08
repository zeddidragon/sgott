// For storing state somewhere globally without passing everything around
// Doesn't do anything to check for safety
// Basically this is crappy redis that does not persist
const storage = {}

function set(namespace, item) {
  storage[namespace] = item
}

function get(namespace) {
  return storage[namespace]
}

function push(namespace, item) {
  if(storage[namespace] == null)
    storage[namespace] = []
  storage[namespace].push(item)
}

function pop(namespace) {
  if(!storage[namespace])
    return
  return storage[namespace].pop()
}

module.exports = {
  set,
  get,
  push,
  pop,
}
