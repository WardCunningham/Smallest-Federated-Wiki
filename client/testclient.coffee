util = require('./lib/util.coffee')
$ = require('jquery-browserify')

mocha.setup('bdd')

$ ->
  require('./test/util.coffee')
  mocha.run()
