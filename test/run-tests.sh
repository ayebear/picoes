#!/bin/sh
# ./node_modules/mocha/bin/mocha
istanbul cover _mocha -- -R spec
