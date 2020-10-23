var typeDict = {'undefined':0, 'string':1, 'integer':2, 'float':3}
var targetArray = [typeDict['float'], typeDict['integer'], typeDict[`float`]]
var testArray = [[1.5, 2, 3], [2.5, 3, "Three"], [3.5, 4, 3.1]]

function whatType(item) {
    if (typeof (item) === "undefined") {
        return typeDict['undefined']

    }
    else if (isNaN(item)) {
        //console.log(item + " was not a number... Infact It was a " + typeof (item) + "!")
        return typeDict['string']
    }
    else {
        if (parseInt(item) === item) {
            //console.log("This is a number: " + item + "..." + " Infact It was an integer!")
            return typeDict['integer']
        }
        else {
            //console.log("This is a number: " + item + "..." + "Infact It was a float!")
            return typeDict['float']
        }
    }
}

function checkType(item, targetType) {
    if (item === targetType){
        return true
    }
    else{
        return false
    }
}

function convertToDataType(list) {
    var newList = []
    for (var di = 0; di < list.length; di++) {
        newList[di] = whatType(list[di])
    }
    return newList
}

function getCol(matrix, col) {
    var c = []
    for (var ci = 0; ci < matrix.length; ci++) {
        c.push(matrix[ci][col])
    }
    return c
}

function convertColumns(matrix) {
    newMatrix = []
    for (var mi = 0; mi < matrix.length; mi++) {
        var v = getCol(matrix, mi)
        v = convertToDataType(v)
        newMatrix[mi] = v

    }
    return newMatrix
}

function dataChecker(matrix) {
    var convertedMatrix = convertColumns(matrix)
    
    for (var ci=0; ci<convertedMatrix.length; ci++){
        console.log(`item output: ${convertedMatrix[ci]}`)
        for (var ri=0; ri<convertedMatrix.length; ri++){
            
            console.log(`on column ${ci}, row ${ri}: `+checkType(convertedMatrix[ci][ri], targetArray[ci]))
        }
    }
}

dataChecker(testArray)


