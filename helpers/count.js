const countLabels = {}
function count(label) {
  countLabels[label] ??= 0
  return `${label} ${countLabels[label]++}`
}

module.exports = {
  count,
}

