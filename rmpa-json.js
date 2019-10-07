const fs = require('fs')

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

  function StrPointer(buffer, index, size) {
    const end = index + size * 2 || buffer.length
    const terminator = Math.min(buffer.indexOf('\0', index, 'utf16le'), end)
    console.log({ index, size, terminator })
    return Str(buffer.slice(index, terminator > 0 ? terminator : end))
  }

  function readHeader(buffer) {
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

  function parseRoutes(buffer, index) {
    // 0x00 is amount of elements
    const routeCount = UInt(buffer, index + 0x00)
    // The remainder of the header is irrelevant for now
    // Comments in json-rmpa will go into these
    // 0x04 points us to the start of the data
    index = index + UInt(buffer, index + 0x04)

    const routes = []
    while(routes.length < routeCount) {
      const nodes = []
      const id = UInt(buffer, index + 0x10)
      const name = StrPointer(buffer, index + 0x014)
      const nodeCount = UInt(buffer, index + 0x018)
      console.log({ id, name, nodeCount, index })
      index = index + UInt(buffer, index + 0x01C)
      console.log(`waypoint ${id}`, index)

      for(var i = 0; i < nodeCount; i++) {
        const idx = UInt(buffer, index + 0x00)
        console.log(`node ${idx}`, index)
        index = index + UInt(buffer, 0x3C)
        nodes.push({ idx })
      }

      routes.push({ id, name, nodes })
    }
  }

  return function decompile(buffer) {
    const {
      routesIndex,
      shapesIndex,
      cameraIndex,
      spawnsIndex,
    } = readHeader(buffer)

    return {
      endian,
      routes: routesIndex && parseRoutes(buffer, routesIndex),
    }
  }
}

function decompile(buffer, opts = {}) {
  const data = decompiler(opts)(buffer)
  return data

  return JSON.stringify(data, null, 2)
}

const buffer = fs.readFileSync('testdata/M515/MISSION.RMPA')
console.log(decompile(buffer))
