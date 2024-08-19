#!/usr/bin/env bash
set -x
./sgott.js data/6/config.json tmp/config.sgo
./sgott.js tmp/config.sgo tmp/config.json
./sgott.js data/6/weapon/ASSULTRIFLE01.json tmp/assultrifle01.sgo
./sgott.js tmp/assultrifle01.sgo tmp/assultrifle01.json

