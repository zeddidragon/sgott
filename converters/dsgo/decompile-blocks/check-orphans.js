function checkOrphans(blocks) {
  const indices = new Set()

  for(const block of Object.values(blocks).filter(b => b.type === 'table')) {
    for(const index of block.content.table) {
      indices.add(index)
    }
  }

  for(const block of Object.values(blocks).filter(b => b.type === 'calc')) {
    for(const { value } of block.content.filter(cmd => cmd.command == 3)) {
      if(!indices.has(value))
        console.warn('Node index in calc but not a table: ', value)
      indices.add(value)
    }
  }

  const nodes = blocks[0].content.nodes
  indices.add(blocks[0].content.rootIndex)

  let orphaned = 0
  for(let i = 0; i < nodes.length; i++) {
    if(!indices.has(i)) {
      // console.log('Orpan:', i, nodes[i])
      orphaned++
    }
  }

  if(orphaned)
    console.warn(`Orphan nodes counted: ${orphaned}/${nodes.length}`)
}

module.exports = {
  checkOrphans,
}
