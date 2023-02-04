function sgoJsonToSimple(data) {
  if(Array.isArray(data)) {
    if(data.every(v => v.name)) {
      return Object.fromEntries(data.map(v => [v.name, sgoJsonToSimple(v)]))
    }
    return data.map(sgoJsonToSimple)
  }
  if(data.variables) return sgoJsonToSimple(data.variables)
  if(data.type === 'ptr' && !data.value) return null
  if(data.value != null) return sgoJsonToSimple(data.value)
  return data
}

export default sgoJsonToSimple
