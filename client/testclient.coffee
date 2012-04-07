mocha = require('mocha')
expect = require('expect.js')
util = require('./lib/util.coffee')
$ = require('jquery-browserify')

mocha.setup('bdd')

$(-> mocha.run())
