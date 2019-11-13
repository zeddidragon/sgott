const sgo = require('../sgo/to-json').decompiler

function padCeil(value, divisor = 0x10) {
  return Math.ceil(value / divisor) * divisor
}

function compile(fullBuffer, config) {
  if(config.index) fullBuffer = fullBuffer.slice(config.index)
  var endian

  function Ptr(cursor, offset) {
    return cursor.copy().move(Int(cursor, offset))
  }

  function Str(cursor, offset = 0x00, length = 0) {
    cursor = Ptr(cursor, offset)
    const terminator = length * 2 || Math.min(
      cursor.buffer.indexOf('\0', cursor.pos, 'utf16le'),
      cursor.buffer.length)
    const buffer = cursor.buffer.slice(cursor.pos, padCeil(terminator))
    return (endian === 'LE'
      ? buffer.toString('utf16le')
      : Buffer.from(buffer).swap16().toString('utf16le')
    ).trim()
  }

  function UInt(cursor, offset = 0x00) {
    return cursor.at(offset)[`readUInt32${endian}`]()
  }
  UInt.size = 0x04

  function Int(cursor, offset = 0x00) {
    return cursor.at(offset)[`readInt32${endian}`]()
  }
  Int.size = 0x04

  function Float(cursor, offset = 0x00) {
    return cursor.at(offset)[`readFloat${endian}`]()
  }
  Float.size = 0x04

  function Hex(cursor, offset = 0x00) {
    return ( cursor
      .at(offset)
      .slice(0x00, 0x04)
      .toString('hex')
    )
  }
  Hex.size = 0x04

  function HexKey(idx) {
    return '0x' + idx.toString(16).padStart(2, '0')
  }

  function Ref(Type) {
    function Deref(cursor, offset = 0x00) {
      const count = UInt(cursor, offset)
      if(!count) return null
      return Type(Ptr(cursor, offset + 0x04), 0x00, count)
    }
    Deref.size = 0x08

    return Deref
  }

  function NullPtr(label) {
    function AssertNullPtr(cursor, offset = 0x00) {
      const count = UInt(cursor, offset)
      if(!count) return null
      if(config.debug) return [count, Hex(cursor, offset + 0x04)]
      console.error(`Expected count at ${HexKey(offset)} \
in ${label} (${HexKey(cursor.pos)}) to be 0, \
but it was ${count}, pointing to ${HexKey(Ptr(cursor, offset + 0x04).pos)}.

Contact the developers of this tool and tell them which file this happened in!
(Use --debug to force this file to parse regardless)`)
      process.exit(1)
    }
    AssertNullPtr.size = 0x08

    return AssertNullPtr
  }

  class Cursor {
    constructor(buffer, pos = 0x00) {
      if(buffer instanceof Cursor) {
        this.buffer = buffer.buffer
        this.pos = buffer.pos
      } else {
        this.buffer = buffer
        this.pos = pos
      }
    }

    at(offset = 0x00) {
      return this.buffer.slice(this.pos + offset)
    }

    move(offset) {
      if(offset == null) throw new Error('No amount specified')
      this.pos += offset
      return this
    }

    copy() {
      return new Cursor(this)
    }
  }

  function Struct(definitions, size) {
    if(!size) throw new Error('Size is not provided!')
    function StructDef(cursor, offset = 0x00) {
      if(offset) {
        cursor = cursor.copy().move(offset)
      }

      var idx = 0x00 
      const obj = {}
      if(config.debug) obj.dbg = { '@': cursor.pos, raw: [], deref: [] }
      while(idx < size) {
        const def = definitions[idx]
        const raw = !def || config.debug
        const hexKey = raw && HexKey(idx)
        const hexVal = raw && Hex(cursor, idx)
        const [key, fn, opts = {}] = def || []
        const value = fn && fn(cursor, idx)

        if(!def && hexVal != '00000000') {
          obj[hexKey] = hexVal
        } else if(def && !opts.ignore) {
          obj[key] = value == null ? null : value
        }

        if(config.debug) {
          obj.dbg.raw.push([hexKey, hexVal])
        }

        idx += fn && fn.size != null ? fn.size : 0x04
      }

      return obj
    }
    StructDef.size = size

    return StructDef
  }

  function Collection(Type) {
    function CollectionDef(cursor, offset = 0x00, count = 0) {
      if(!count) return null
      cursor = cursor.copy().move(offset)
      const size = Type.size || 0x04
      return Array(count).fill(null).map((v, i) => Type(cursor, i * size))
    }

    return CollectionDef
  }

  function SubHeader(Type) {
    return Struct({
      [0x04]: ['nullPtr', NullPtr('SubHeader'), { ignore: true }],
      [0x0C]: ['id', UInt],
      [0x14]: ['name', Str],
      [0x18]: ['nodes', Ref(Collection(Type))],
    }, 0x20)
  }

  function TypeHeader(Type) {
    return Struct({
      [0x00]: ['entries', Ref(Collection(SubHeader(Type)))],
      [0x08]: ['nullPtr', NullPtr('TypeHeader'), { ignore: true }],
      [0x10]: ['id', UInt],
      [0x18]: ['name', Str],
    }, 0x20)
  }

  function SGO(cursor, offset = 0x00, size = 0) {
    if(!size) return null
    return sgo(cursor.at(offset))
  }

  function Leader(cursor) {
    const leader = cursor.at(0x00).slice(0x00, 0x04).toString('ascii')
    endian = leader === 'RMP\0' ? 'LE' : 'BE'
    return endian
  }
  Leader.size = 0x04

  const WayPoint = Struct({
    [0x00]: ['idx', UInt, { ignore: true }],
    [0x04]: ['link', Ref(UInt)],
    [0x0C]: ['nullPtr', NullPtr('WayPoint'), { ignore: true }],
    [0x14]: ['id', UInt],
    [0x18]: ['config', Ref(SGO)],
    [0x24]: ['name', Str],
    [0x28]: ['x', Float],
    [0x2C]: ['y', Float],
    [0x30]: ['z', Float],
  }, 0x3C)

  const RmpHeader = Struct({
    [0x00]: ['endian', Leader],
    [0x08]: ['routes', Ref(TypeHeader(WayPoint))],
    [0x18]: ['cameras', NullPtr('RmpHeader')],
  }, 0x30)

  return JSON.stringify(RmpHeader(new Cursor(fullBuffer)))
}

function compiler(config) {
  return buffer => compile(buffer, config)
}
compile.compiler = compiler
compile.compile = compile

module.exports = compile
