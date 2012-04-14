mocha.setup('bdd')

window.wiki = {}

wiki.log = (things...) ->
  console.log things if console?.log?

$ ->
  require('./test/util.coffee')
  require('./test/active.coffee')
  require('./test/fetch.coffee')
  require('./test/plugin.coffee')
  mocha.run()

