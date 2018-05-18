const SIZE = 12

// Cheapo(tm) debugging
function abort() {
  throw new Error('abort')
}

function compiler(config) {
  var endian
  const types = {
    ptr: 0,
    int: 1,
    float: 2,
    string: 3,
    extra: 4,
  }

  function stringCompare(a, b) {
    return a > b ? 1 : -1
  }

  function stringBytes(string) {
    // SGO uses wide chars for strings
    return Buffer.byteLength(string, 'utf16le')
  }

  function Str(buffer, value, offset = 0) {
    return buffer.write(value, offset)
  }

  function UInt(buffer, value, offset = 0) {
    return buffer[`writeUInt32${endian}`](value, offset)
  }

  function Int(buffer, value, offset = 0) {
    return buffer[`writeInt32${endian}`](value, offset)
  }

  function Float(buffer, value, offset = 0) {
    return buffer[`writeFloat${endian}`](value, offset)
  }

  return function bufferize(json) {
    endian = json.endian
    const header = Buffer.alloc(32)

    // Header of SGO file is 32 bytes, this is the structure as I know it:
    //
    // HHHH HHHH 0000 0102 CCCC CCCC 0000 0020
    // CCCC CCCC MMMM MMMM 0000 0000 SSSS SSSS
    //
    // 8 distinct values, each 4 bytes

    // H is the leader describing the file type
    // It can be one of two strings:
    //  Little endian: "\0SGO"
    //  Big Endian:    "\0OGS"
    Str(header, endian === 'LE' ? 'SGO\0' : '\0OGS')

    // As far as I know, these values are identical in all files
    UInt(header, 0x0102, 0x4)
    UInt(header, 0x0020, 0xc)

    // C is count of variables (not including values in pointed structs)
    // It appears twice for reasons unknown
    const varCount = json.variables.length
    UInt(header, varCount, 0x8)
    UInt(header, varCount, 0x10)

    const heap = []
    const deferred = new Map()
    const deferredStrings = new Map()
    const deferredStringData = {}
    const deferredExtra = []

    function defer(block, pointed) {
      deferred.set(block, pointed)
    }

    var stringId = varCount
    function deferString(block, string) {
      string = string.trim() + '\0'
      const stringData =
        deferredStringData[string] ||
        [string, stringBytes(string), ++stringId]
      deferredStringData[string] = stringData
      deferredStrings.set(block, stringData)
    }

    function deferExtra(block, {type, data}) {
      const buffer = type === 'SGO'
        ? compiler()(data)
        : Buffer.from(data, 'base64')
      deferredExtra.push([block, buffer])
      return buffer
    }

    function process(node) {
      const name = node.name

      // An SGO value consists of three distinct 4-byte parts
      // TTTT TTTT SSSS SSSS VVVV VVVV

      // T is the type. Four distinct values are currently known
      // 0000 0000 means pointer to a struct
      // 0000 0001 means integer
      // 0000 0002 means float
      // 0000 0003 means pointer to a string
      const type = node.type

      // S is the size.
      // For struct pointers it enumerates amount of values. (0 for null pointer)
      // For strings it enumerates amount of characters (including terminator \0)
      // Otherwise the value is almost always 4.
      const size
        = node.value == null
          ? 0
        : type === 'ptr'
          ? node.value.length
        : type === 'string'
          ? node.value.trim().length
          : 4

      // V is the value
      // For pointers (and string pointers) the value is the offset from the start
      // of the value definition to get to the payload.
      // For example, if it pointed to the very next value, it'd be 0000 00c0 (12)
      const block = {name, type, size}
      switch(type) {
        case 'ptr':
          if(node.value) {
            defer(block, node.value)
          } else {
            block.value = 0
          }
          break
        case 'string':
          deferString(block, node.value)
          break
        case 'extra':
          block.size = deferExtra(block, node.value).length
        default:
          block.value = node.value
      }

      return block
    }

    function unroll() {
      // Unroll pointed values into the heap
      // Since unrolled values can also have pointers, many passes might be needed
      while(deferred.size) {
        const pass = new Map(deferred)
        deferred.clear()
        for(const [block, pointed] of pass) {
          block.value = heap.length
          heap.push(...pointed.map(process))
        }
      }
    }

    const values = json.variables
      .sort((a, b) => stringCompare(a.name.trim(), b.name.trim()))
      .map(node => {
        const value = process(node)
        unroll()
        return value
      })

    // Unroll strings into the string heap
    // In SGOs, the string heap is sorted
    // It is unknown if this is a requirement of the format
    const stringIndices = {}
    const strings = Object.values(deferredStringData)
      .concat(json.variables.map((block, index) => {
        const string = (block.name || '').trim() + '\0'
        return [string, stringBytes(string), index]
      }))
      .sort(([a], [b]) => stringCompare(a, b))
    var stringIndex = 0
    for(const [_, bytes, id] of strings) {
      stringIndices[id] = stringIndex
      stringIndex += bytes
    }

    for(const [block, [string, _, id]] of deferredStrings) {
      block.value = stringIndices[id]
    }

    const fixedBuffer = Buffer.alloc(values.length * SIZE)
    const heapBuffer = Buffer.alloc(heap.length * SIZE)
    const stringBuffer = Buffer.alloc(stringIndex)
    const mTable = Buffer.alloc(varCount * 8 + 4)

    var extraIndex = 0
    const extraBuffer = Buffer.concat(deferredExtra.map(([block, buffer]) => {
      block.value = extraIndex
      extraIndex += buffer.length
      return buffer
    }))

    for(let varIndex = 0; varIndex < varCount; varIndex++) {
      const mIndex = varIndex * 8
      const strIndex = stringIndices[varIndex]
      const pointer = strIndex + mTable.length + extraBuffer.length - mIndex
      Int(mTable, pointer, mIndex)
      UInt(mTable, varIndex, mIndex + 4)
    }

    function writeValue(buffer, block, index, isHeap) {
      if(block.type === 'unknown') {
        buffer.write(block.value, index, 'base64')
        return
      }

      const type = types[block.type]
      const {size, value} = block
      if(type == null) throw new Error(`Unknown type: ${block.type}`)
      UInt(buffer, type, index)
      UInt(buffer, size, index + 4)
      const valueIndex = index + 8
      switch(block.type) {
        case 'int':
          Int(buffer, value, valueIndex)
          break
        case 'float':
          Float(buffer, value, valueIndex)
          break
        case 'ptr': {
          // Pointers always point to the heap
          // If we're not in the heap, we want to add the distance to the heap
          // Null pointers should point to the start of the heap
          const pointer = (isHeap ? 0 : fixedBuffer.length)
            - index
            + value * SIZE
          UInt(buffer, Math.max(0, pointer), valueIndex)
          break
        }
        case 'extra': {
          // Extra files are right after the struct definition
          const pointer = (isHeap ? 0 : fixedBuffer.length)
            + heapBuffer.length
            + mTable.length
            - index
            + value
          UInt(buffer, Math.max(0, pointer), valueIndex)
          break
        }
        case 'string': {
          // Strings are dead last in the file
          // after the mTable and the extra buffer
          // If we're not in the heap we need to add distance to the heap
          // then also skip the heap
          const pointer = (isHeap ? 0 : fixedBuffer.length)
            + heapBuffer.length
            - index
            + mTable.length
            + extraBuffer.length
            + value
          UInt(buffer, pointer, valueIndex)
          break
        }

        default:
          UInt(buffer, value, valueIndex)
      }
    }

    for(let index = 0; index < values.length; index++) {
      writeValue(fixedBuffer, values[index], index * SIZE)
    }
    for(let index = 0; index < heap.length; index++) {
      writeValue(heapBuffer, heap[index], index * SIZE, true)
    }

    stringIndex = 0
    for(const [string, bytes] of strings) {
      stringBuffer.write(string, stringIndex, 'utf16le')
      stringIndex += bytes
    }
    if(endian !== 'LE') stringBuffer.swap16()

    const size = fixedBuffer.length + heapBuffer.length
    // M is pointer to mTable
    // Equal to the size of every value (and pointed structs)
    // + sizeof header
    UInt(header, size + 32, 0x14)

    // S is total size of the class
    // Equal to size of every value (and pointed structs)
    // + size of mystery data
    // + size of header
    UInt(header, size + 32 + mTable.length, 0x1c)

    return Buffer.concat([
      header,
      fixedBuffer,
      heapBuffer,
      mTable,
      extraBuffer,
      stringBuffer,
    ])
  }
}

function compile(buffer, opts) {
  return compiler(opts)(JSON.parse(buffer.toString()))
}

module.exports = compile
