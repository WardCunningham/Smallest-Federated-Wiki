mocha.setup('bdd')

window.wiki = {}

wiki.log = (things...) ->
  console.log things if console?.log?

util = require('./lib/util.coffee')
wiki.resolveLinks = util.resolveLinks

require('./test/util.coffee')
require('./test/active.coffee')
require('./test/pageHandler.coffee')
require('./test/refresh.coffee')
require('./test/plugin.coffee')
require('./test/revision.coffee')

$ ->
  $('<hr><h2> Testing artifacts:</h2>').appendTo('body')
  mocha.run()

