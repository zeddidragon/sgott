class Type4Data {
  parse(cursor, types) {
    const origin = cursor.copy()
    function int() {
      const val = types.UInt(cursor)
      cursor.move(0x04)
      return val
    }
    function double() {
      const val = types.Double(cursor)
      cursor.move(0x08)
      return val
    }
    // Write out math equation, push to stack
    function math(token) {
      if(stack.length < 2) {
        throw new Error(`Type 4 math error. Two values not present`)
      }
      const [a, b] = stack.splice(-2)
      push(`${a} ${token} ${b}`)
    }
    function pop(amount = 1) {
      return stack.splice(-amount).join(', ')
    }
    function push(value) {
      stack.push(value)
    }

    const size = int()
    const offset = int()
    const end = cursor.pos + size;
    const stack = [];

    type4:
    while(cursor.pos < end) {
      let type = int();
      switch(type) {
        // End of data
        case 0: break type4;

        // Read values
        case 1: push(double()); break; // Literal
        case 3: push(`#${int()}`); break; // Index

        case 4: { // Command
          const command = int();
          switch(command) {
            case 0x80000005: push(`Limit( ${pop()} )`); break; // Limit
            case 0x80000006: push(`Lerp( ${pop(3)})`); break;
            default: push(`command[${command.toString(16)}/${command}]`); break;
          }
          break;
        }
        
        // Math operations
        case 5: math('+'); break;
        case 6: math('-'); break;
        case 7: math('*'); break;
        case 8: math('/'); break;

        default: throw new Error(`Calc error: Unknown operator "${type}"`); break;
      }
    }

    if(!stack.length) throw new Error('Calc error: No output')
    if(stack.length > 1) {
      console.log(origin);
      throw new Error(`Calc error: Stack unresolved | ${stack.join(', ')}`)
    }

    return stack[0]
  }
}

module.exports = Type4Data;
