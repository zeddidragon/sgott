#!/usr/bin/env node

function spreadSheetIndex(sheet){
	sheetArr = sheet.data
	map = {}
	for(let i = 0; i < sheetArr.length; i++) {
		map[sheetArr[2][i]] = sheetArr[sheetArr.length - 2][i]	
	}
	return map
}

module.exports = spreadSheetIndex