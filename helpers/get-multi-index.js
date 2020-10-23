#!/usr/bin/env node

function getMultiIndex(source, target) {
  for (var i = 0; i < source.length; i++) {
    var index = source[i].indexOf(target);
    if (index > -1) {
      return [i, index];
    }
  }
}

module.exports = getMultiIndex