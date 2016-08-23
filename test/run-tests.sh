#!/bin/sh
# ./node_modules/mocha/bin/mocha
./node_modules/.bin/istanbul cover _mocha -- -R spec
