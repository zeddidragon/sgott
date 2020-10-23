// const fs = require('fs')
// const newDir = `./release/sgottstrap/SgottTemplates/weapon/`
// const baseDir = `../data/41/weapons/`

// var newFiles = {}
// var baseFiles = {}

// function acquire(file) {
//   return JSON.parse(fs.readFileSync(file))
// }

// function readFolder(dir) {
//   fs.readdir(dir, (err, files) => {
//     files.forEach(file => {
//       dict[file] = acquire(`${dir}${file}`)
//     })
//   })
// }

// newFiles = readFolder(newDir)
// baseFiles = readFolder(baseDir)

// console.log(Object.keys(newFiles))
// console.log(Object.keys(baseFiles))



const newDir = `./release/sgottstrap/SgottTemplates/weapon`
const baseDir = `../data/41/weapons`
const fs = require('fs')

var newJSONS = {}
var baseJSONS = {}



function acquire(file) {
    return JSON.parse(fs.readFileSync(file))
  }

function compareValues(a, b) {
    results = {}
    //if a and b aren't the same type, they can't be equal
    if (typeof a !== typeof b) {
        results.TypeCheck = false
    }

    if (typeof a === 'object') {
        var keysA = Object.keys(a).sort(),
            keysB = Object.keys(b).sort();

        //if a and b are objects with different no of keys, unequal
        if (keysA.length !== keysB.length) {
            results.ObjStrutCheck = false
        }

        //if keys aren't all the same, unequal
        if (!keysA.every(function(k, i) { return k === keysB[i];})) {
            results.KeyNameCheck = false
        }

    //for primitives just use a straight up check
    } else {
        results.PrimaCheck = false
    }
    console.log(results)
}

function readFolder(Dir, filesDict){
    fs.readdir(Dir, (err, files) => {
        files.forEach(file => {
            fName = file.files
            jParsed = acquire(file)
        });
    })
}

