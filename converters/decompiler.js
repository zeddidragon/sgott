const util = require('util')
const kleur = require('kleur')

function padCeil(value, divisor = 0x10) {
  return Math.ceil(value / divisor) * divisor
}

function decompiler(format, fullBuffer, config = {}) {
  if(config.index) fullBuffer = fullBuffer.slice(config.index)
  if(fullBuffer.pos) fullBuffer = fullBuffer.buffer.slice(fullBuffer.pos)
  {
    const length = padCeil(fullBuffer.length)
    if(length !== fullBuffer.length) {
      const buf = Buffer.alloc(length)
      fullBuffer.copy(buf)
      fullBuffer = buf
    }
  }

  function Ptr(cursor, offset) {
    return cursor.copy().move(Int(cursor, offset))
  }

  const strOrder = {}
  function Str(cursor, offset = 0x00, length = 0) {
    cursor = Ptr(cursor, offset)
    const terminator = length * 2 || Math.min(
      cursor.buffer.indexOf('\0', cursor.pos, 'utf16le'),
      cursor.buffer.length)
    const buffer = cursor.buffer.slice(cursor.pos, terminator) 
    const string = (cursor.endian === 'LE'
      ? buffer.toString('utf16le')
      : Buffer.from(buffer).swap16().toString('utf16le')
    ).trim()
    strOrder[string] = cursor.pos
    return string
  }

  function UInt(cursor, offset = 0x00) {
    return cursor.at(offset)[`readUInt32${cursor.endian}`]()
  }
  UInt.size = 0x04

  function BigUInt(cursor, offset = 0x00) {
    return cursor.at(offset)[`readBigUInt64${cursor.endian}`]() }
  BigUInt.size = 0x08

  function Int(cursor, offset = 0x00) {
    return cursor.at(offset)[`readInt32${cursor.endian}`]()
  }
  Int.size = 0x04

  function BigInt(cursor, offset = 0x00) {
    return cursor.at(offset)[`readBigInt64${cursor.endian}`]()
  }
  BigInt.size = 0x08

  function Float(cursor, offset = 0x00) {
    return cursor.at(offset)[`readFloat${cursor.endian}`]()
  }
  Float.size = 0x04

  function Double(cursor, offset = 0x00) {
    return cursor.at(offset)[`readDouble${cursor.endian}`]()
  }
  Double.size = 0x08

  function Tuple(Type, size) {
    const block = Type.size || 0x04
    function TupleDef(cursor, offset = 0x00) {
      return Array(size).fill(0).map((v, i) => Type(cursor, offset + i * block))
    }
    TupleDef.size = size * block
    return TupleDef
  }

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

  function HexInt(cursor, offset = 0x00) {
    return `0x${UInt(cursor, offset).toString(16)}`
  }
  HexInt.size = 0x04

  function HexView(buffer) {
    let bufferView = []
    for(let i = startAt; i < endAt; i += 0x2) {
      if(!(i % 0x10)) {
        bufferView.push([kleur.magenta(`${i.toString(16).padStart(8, 0)}:`)])
      }
      let str = this.buffer.readUInt16BE(i).toString(16).padStart(4, 0)
      if(this.pos === i) {
        str = kleur.yellow(str)
      }
      bufferView[bufferView.length - 1].push(str)
    }
    return `Cursor 0x${this.pos.toString(16)} (${this.endian})
${bufferView.map(r => r.join(' ')).join('\n')}`
  }
  HexInt.size = 0x04

  function Ref(Type, opts = {}) {
    function Deref(cursor, offset = 0x00) {
      const count = UInt(cursor, offset)
      if(!count && !opts.force) return null
      return Type(Ptr(cursor, offset + 0x04), 0x00, count)
    }
    Deref.size = 0x08

    return Deref
  }

  function XRef(Types, opts = {}) {
    function Deref(cursor, offset = 0x00) {
      const count = UInt(cursor, offset)
      if(!count && !opts.force) return null
      return Types.map((Type, i) => {
        const off = offset + 0x04 * (i + 1)
        return Type(Ptr(cursor, off), 0x00, count)
      })
    }
    Deref.size = 0x04 * (1 + Types.length)

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
        this.endian = buffer.endian
      } else {
        this.buffer = buffer
        this.pos = pos
        this.endian = 'LE'
      }
    }

    [util.inspect.custom]() {
      const startAt = Math.max(0, Math.floor((this.pos / 0x10) - 1) * 0x10)
      const endAt = Math.min(startAt + 0x40, this.buffer.length)
      let bufferView = []
      for(let i = startAt; i < endAt; i += 0x2) {
        if(!(i % 0x10)) {
          bufferView.push([kleur.magenta(`${i.toString(16).padStart(8, 0)}:`)])
        }
        let str = this.buffer.readUInt16BE(i).toString(16).padStart(4, 0)
        if(this.pos === i) {
          str = kleur.yellow(str)
        }
        bufferView[bufferView.length - 1].push(str)
      }
      return `Cursor 0x${this.pos.toString(16)} (${this.endian})
${bufferView.map(r => r.join(' ')).join('\n')}`
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

  function Leader(lead) {
    lead = lead.trim().padEnd(0x04, '\0')
    function LeaderDef(cursor) {
      const leader = cursor.at(0x00).slice(0x00, 0x04).toString('ascii')
      cursor.endian = leader === lead ? 'LE' : 'BE'
      return cursor.endian
    }
    LeaderDef.size = 0x04
    return LeaderDef
  }

  function Struct(definitions, size) {
    if(!size) throw new Error('Size is not provided!')
    function StructDef(cursor, offset = 0x00) {
      if(offset) {
        cursor = cursor.copy().move(offset)
      }

      var idx = 0x00 
      const obj = {}
      if(config.debug) obj.dbg = { '@': HexKey(cursor.pos), raw: [], deref: [] }
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
          const setter = typeof key === 'function'
            ? key
            : (obj, val) => (obj[key] = val)
          setter(obj, value == null ? null : value, cursor)
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

  function Union(Types, size) {
    function UnionDef(cursor, offset = 0x00) {
      const type = UInt(cursor, offset)
      if(!Types[type]) {
        throw new Error(`Type definition missing: ${type}`)
      }
      return Types[type](cursor, offset)
    }
    UnionDef.size = size
    return UnionDef
  }

  function Collection(Type, typeSize) {
    function CollectionDef(cursor, offset = 0x00, count = 0) {
      if(!count) return null
      cursor = cursor.copy().move(offset)
      const size = typeSize || Type.size || 0x04
      return Array(count).fill(null).map((v, i) => Type(cursor, i * size))
    }

    return CollectionDef
  }

  function decompile(Entry) {
    const data = Entry(new Cursor(fullBuffer), 0x00)
    const ret = {
      format: format,
      ...data,
    }
    if(format === 'DSGO') {
      ret.strings = Object
        .keys(strOrder)
        .sort((a, b) => strOrder[a] - strOrder[b])
    }
    return ret
  }

  decompile.types = {
    Ptr,
    Str,
    UInt,
    BigUInt,
    Int,
    BigInt,
    Float,
    Double,
    Hex,
    HexKey,
    HexInt,
    Ref,
    XRef,
    NullPtr,
    Tuple,
    Leader,
    Struct,
    Union,
    Collection,
  }
  decompile.decompile = decompile

  return decompile
}

module.exports = decompiler
