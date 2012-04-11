util = require('./lib/util.coffee')

window.jQuery = {active: 0} # passify integration test ajax syncronization

$ = require('jquery-browserify')

mocha.setup('bdd')

$ ->
  require('./test/util.coffee')
  mocha.run()
