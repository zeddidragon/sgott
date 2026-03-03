function hex(value) {
  if(value == null)
    return value
  return `0x${value.toString(16)}`
}

module.exports = { hex }
