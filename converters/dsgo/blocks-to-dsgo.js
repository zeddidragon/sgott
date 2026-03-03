function blocksToDsgo(obj) {
  const header = obj[0]
  const size = +Object.entries(obj).find(([address, block]) => block.type === 'END')?.[0]
  if(size === 0) 
    throw new Error('END block not found, cannot determine size')
  console.log({ header, size })
  return new Buffer(size)
}

module.exports = blocksToDsgo
