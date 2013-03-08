mocha.setup('bdd')

window.wiki = require('./lib/wiki.coffee')

require('./test/util.coffee')
require('./test/active.coffee')
require('./test/pageHandler.coffee')
require('./test/refresh.coffee')
require('./test/plugin.coffee')
require('./test/revision.coffee')
require('./test/neighborhood.coffee')
require('./test/search.coffee')

$ ->
  $('<hr><h2> Testing artifacts:</h2>').appendTo('body')
  mocha.run()

