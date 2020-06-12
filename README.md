SGO Transformation Tool
=======================

SGOTT is a tool that can parse and write SGO files.

Usage:
```bash
  $ sgott --help

  sgott 1.0.0
  SGO Transformation Tool, SGO to JSON and back.

  Usage:
    sgott infile.sgo outfile.json
    sgott infile.json outfile.sgo
    sgott --type=json infile.txt outfile.sgo
    sgott < infile.sgo > outfile.json
    sgott < infile.json > outfile.sgo

  Options:
    -t  --type
        Can be "json" or "sgo". Override automatically inferred input type.

    -h --help
        Prints this help text, then quits.

    -v --version
        Prints version information, then quits.

    SGO to JSON only:

    -d --debug
        Appends debug data to output JSON.

    -m --mode
        Can be "decompile" or "dumpvalues" .

        decompile:
          Default mode. Create JSON that can be edited and recompiled.
        dumpvalues:
          Array with consecutive values in struct and heap.
          Pointers are not dereferenced.

    -o --offset
        Byte to start reading from.
```
