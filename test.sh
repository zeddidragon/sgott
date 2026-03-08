#!/usr/bin/env bash
set -x
./sgott.js testdata/6/OBJECT/E606_SHELLFISH_ACE.SGO --debug
mv testdata/6/OBJECT/E606_SHELLFISH_ACE.json tmp/shellfish.json
./sgott.js tmp/shellfish.json
