const fs = require('fs')
const sgo = require('./sgo-json').decompiler
require('util').inspect.defaultOptions.depth = null

// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function decompiler(config = {}) {
  var endian

  function Str(buffer) {
    return (endian === 'LE'
      ? buffer.toString('utf16le')
      : Buffer.from(buffer).swap16().toString('utf16le')
    ).trim()
  }

  function UInt(buffer, offset = 0) {
    return buffer[`readUInt32${endian}`](offset)
  }

  function UInt16(buffer, offset = 0) {
    return buffer[`readUInt16${endian}`](offset)
  }


  function Int16(buffer, offset = 0) {
    return buffer[`readInt16${endian}`](offset)
  }

  function Int(buffer, offset = 0) {
    return buffer[`readInt32${endian}`](offset)
  }

  function Float(buffer, offset = 0) {
    return buffer[`readFloat${endian}`](offset)
  }

  function Pointer(buffer, index, size) {
    if(!size) return null
    return consume(buffer, index, size)
  }

  function StrPointer(buffer, index, base) {
    if(base) {
      const uoffset = UInt16(buffer, index)
      const ioffset = Int16(buffer, index)
      return StrPointer(buffer, base + ioffset)
    }
    const end = buffer.length
    const terminator = Math.min(buffer.indexOf('\0', index, 'utf16le'), end)
    return Str(buffer.slice(index, terminator > 0 ? terminator : end))
  }

  function mainHeader(buffer) {
    // Header of RMP file is 48 bytes, this is the structure as we know it:
    //
    // HHHH HHHH 0000 0001 ROUT ROUT ROUT ROUT
    // SHAP SHAP SHAP SHAP CAMR CAMR CAMR CAMR
    // SPWN SPWN SPWN SPWN ???? ???? ???? ????
    //
    // H is the leader describing the file type
    // It can be one of two strings:
    //  Little endian: "RMP\0"
    //  Big Endian:    "\0PMR"
    const leader = buffer.slice(0, 4).toString()
    endian = leader === 'RMP\0' ? 'LE' : 'BE'

    // The remaining headers are essentially nullable pointers (Bool, Ptr)
    // The Bool is 1 if there is associated data, 0 if not.
    // The Ptr is a relative offset to get the relevant data.
    function headerAt(index) {
      const isData = UInt(buffer, index)
      if(!isData) return null
      return UInt(buffer, index + 4)
    }

    return {
      leader,
      routesIndex: headerAt(0x08), // ROUT, Routes
      shapesIndex: headerAt(0x10), // SHAP, Shapes 
      cameraIndex: headerAt(0x18), // CAMR, Camera paths
      spawnsIndex: headerAt(0x20), // SPWN, Spawn points
    }
  }

  function typeHeader(buffer, index) {
    return {
      count: UInt(buffer, index + 0x00),
      startIndex: index + UInt(buffer, index + 0x04),
      endIndex: index + UInt(buffer, index + 0x0C),
      id: UInt(buffer, index + 0x10),
      name: StrPointer(buffer, index + 0x180, index),
    }
  }

  function subHeader(buffer, index) {
    return {
      unknownFlag: Int16(buffer, index + 0x00),
      endIndex: index + Int(buffer, index + 0x08),
      name: StrPointer(buffer, index + 0x14, index),
      count: UInt(buffer, index + 0x18),
      startIndex: index + Int(buffer, index + 0x1C),
    }
  }

  function parseRoutes(buffer, index) {
    const header = typeHeader(buffer, index)
    index = header.startIndex
    const routes = Array(header.count).fill(null)
    for(var i = 0; i < header.count; i++) {
      routes[i] = parseRoute(buffer, index)
      index += 0x20
    }

    return {
      header,
      routes,
    }
  }

  // TODO: Make individual nodes more elegant, removing redundant data
  // idx can likely be removed, implicit from array position
  // omit `name` if it's empty
  // omit `next2` if it's empty
  // inline `rmpa_float_WayPointWidth`, omit if it's `-1`, omit rest of sgo
  function parseRoute(buffer, index) {
    const header = subHeader(buffer, index)
    const nodes = Array(header.count).fill(null)
    index = header.startIndex
    for(var i = 0; i < header.count; i++) {
      const cfg1 = Int(buffer, index + 0x10)
      const cfg2 = Int(buffer, index + 0x1C)
      const next = Int(buffer, index + 0x08)
      nodes[i] = {
        idx: UInt(buffer, index + 0x00),
        next: UInt(buffer, index + next),
        next2: UInt(buffer, index + next + 0x08),
        config: sgo()(buffer.slice(index + cfg1)),
        id: UInt(buffer, index + 0x14),
        name: StrPointer(buffer, index + 0x24, index),
        x: Float(buffer, index + 0x28),
        y: Float(buffer, index + 0x2C),
        z: Float(buffer, index + 0x30),
      }
      if(cfg1 !== cfg2) {
        nodes[i].config2 = sgo()(buffer.slice(index + cfg2))
      }
      index += 0x3C
    }

    return {
      header: header,
      nodes,
    }
  }

  return function decompile(buffer) {
    const {
      routesIndex,
      shapesIndex,
      cameraIndex,
      spawnsIndex,
    } = mainHeader(buffer)

    return {
      format: 'RMP',
      endian,
      routes: routesIndex && parseRoutes(buffer, routesIndex),
    }
  }
}

function decompile(buffer, opts = {}) {
  const data = decompiler(opts)(buffer)
  return JSON.stringify(data, null, 2)
}

const buffer = fs.readFileSync('testdata/M515/MISSION.RMPA')
console.log(decompile(buffer))
