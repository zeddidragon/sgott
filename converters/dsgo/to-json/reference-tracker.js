class ReferenceTracker {
  constructor() {
    this.refs = []
    this.processed = []
  }

  add({ address, state, origin }) { // Adds the reference sorted
    let i = 0
    for(; i < this.refs.length; i++) {
      const ref = this.refs[i]
      if(address < ref.address)
        break
    }
    this.refs.splice(i, 0, { address, state, origin })
  }

  peek() {
    return this.refs[0]
  }

  consume() {
    this.processed.push(this.refs.shift())
  }
}

function referenceTracker() {
  return new ReferenceTracker()
}

module.exports = referenceTracker
