mocha.setup('bdd')

window.wiki = {}

wiki.log = (things...) ->
  console.log things if console?.log?

require('./test/util.coffee')
require('./test/active.coffee')
require('./test/fetch.coffee')
require('./test/refresh.coffee')
require('./test/plugin.coffee')

$ ->
  $('<hr><h2> Testing artifacts:</h2>').appendTo('body')
  mocha.run()

