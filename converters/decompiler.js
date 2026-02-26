const util = require('util')
const kleur = require('kleur')

function HexKey(idx) {
  return '0x' + idx.toString(16).padStart(2, '0')
}

// Used to track chunks of bytes read to track where differences
// in input buffer and output buffer might occur
class ReadTally {
  constructor(buffer) {
    this.buffer = buffer
    this.tally = []
  }

  add(Type, cursor, offset = 0x00, name, data) {
    const pos = cursor.pos + offset
    this.tally.push({
      type: Type,
      pos,
      size: Type.size,
      name,
      data,
    })
  }

  summary() {
    let dupedTotal = 0

    this.tally.sort((a, b) => (a.pos - b.pos) || (b.size - a.size))
    let total = 0
    let idx = 0
    const tally = []
    const buffer = this.buffer

    function addGap(from, to) {
      tally.push({
        from, to, type: '[GAP]',
        data: buffer.slice(from, to).toString('hex'),
      })
    }

    for(const t of this.tally) {
      const { pos, size, type, name, data } = t

      if(pos > idx) {
        addGap(idx, pos)
        idx = pos
      } else if(pos < idx && pos + size <= idx) {
        dupedTotal += size
        continue
      }
      if(pos < idx) {
        dupedTotal += idx - pos
      }

      const to = pos + size
      total += Math.min((pos - idx) + size)
      tally.push({
        from: pos,
        to,
        type: name || type.name,
        overlap: idx > pos ? '[OVERLAP]' : void 0,
        data,
      })
      idx = to
    }
    if(idx < buffer.length) {
      addGap(idx, buffer.length)
    }

    const breakdown = {}
    for(const { type, from, to } of tally) {
      if(from > to) {
        console.error('invalid tally:', tally)
      }
      if(!breakdown[type]) {
        breakdown[type] = { count: 0, size: 0 }
      }
      const counter = breakdown[type]
      counter.count++
      counter.size += to - from
    }

    return {
      tally,
      size: total,
      dupedSize: dupedTotal,
      bufferSize: buffer.length,
      breakdown,
    }
  }
}


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

  let tally = new ReadTally(fullBuffer)
  function Ptr(cursor, offset) {
    return cursor.copy().move(Int(cursor, offset))
  }
  Ptr.size = 0x04

  function StrType() {} // For tallying
  const strOrder = {}
  function Str(cursor, offset = 0x00, length = 0) {
    cursor = Ptr(cursor, offset)
    const terminator = length * 2 || Math.min(
      cursor.buffer.indexOf('\0', cursor.pos, 'utf16le') + 0x02,
      cursor.buffer.length)
    const buffer = cursor.buffer.slice(cursor.pos, terminator - 0x02) 
    const string = (cursor.endian === 'LE'
      ? buffer.toString('utf16le')
      : Buffer.from(buffer).swap16().toString('utf16le')
    ).trim().replace(/\u0000$/, '')
    strOrder[string] = cursor.pos
    StrType.size = buffer.length + 0x02
    tally.add(StrType, cursor, 0, null, string)
    return string
  }

  function UInt(cursor, offset = 0x00) {
    tally.add(UInt, cursor, offset)
    return cursor.at(offset)[`readUInt32${cursor.endian}`]()
  }
  UInt.size = 0x04

  function BigUInt(cursor, offset = 0x00) {
    tally.add(BigUInt, cursor, offset)
    return cursor.at(offset)[`readBigUInt64${cursor.endian}`]() }
  BigUInt.size = 0x08

  function Int(cursor, offset = 0x00) {
    tally.add(Int, cursor, offset)
    return cursor.at(offset)[`readInt32${cursor.endian}`]()
  }
  Int.size = 0x04

  function BigInt(cursor, offset = 0x00) {
    tally.add(BigInt, cursor, offset)
    return cursor.at(offset)[`readBigInt64${cursor.endian}`]()
  }
  BigInt.size = 0x08

  function Float(cursor, offset = 0x00) {
    tally.add(Float, cursor, offset)
    return cursor.at(offset)[`readFloat${cursor.endian}`]()
  }
  Float.size = 0x04

  function Double(cursor, offset = 0x00) {
    tally.add(Double, cursor, offset)
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
  NullPtr.size = 0x04

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
      const endAt = Math.min(startAt + 0x80, this.buffer.length)
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
    function LeaderDef(cursor, offset = 0x00) {
      tally.add(LeaderDef, cursor, offset)
      const leader = cursor.at(offset).slice(offset, offset + 0x04).toString('ascii')
      cursor.endian = leader === lead ? 'LE' : 'BE'
      return cursor.endian
    }
    LeaderDef.size = 0x04
    return LeaderDef
  }

  function NoDef() {} // For tallying
  NoDef.size = 0x04

  function Struct(definitions, size, name) {
    if(!size) throw new Error('Size is not provided!')
    function StructDef(cursor, offset = 0x00) {
      tally.add(StructDef, cursor, offset, name)
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

        if(!def) {
          tally.add(NoDef, cursor, offset)
        }
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

  function Collection(Type, typeSize, name) {
    function CollectionDef(cursor, offset = 0x00, count = 0) {
      if(!count) return null
      cursor = cursor.copy().move(offset)
      const size = typeSize || Type.size || 0x04
      CollectionDef.size = count * size
      tally.add(CollectionDef, cursor, offset, name || `Collection(${Type.name})`)
      return Array(count).fill(null).map((v, i) => Type(cursor, i * size))
    }

    return CollectionDef
  }

  function FilePadding() {}
  FilePadding.size = 0x04

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
    if(config.debug) {
      ret.tally = tally.summary()
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
    tally,
  }
  decompile.decompile = decompile

  return decompile
}

module.exports = decompiler
