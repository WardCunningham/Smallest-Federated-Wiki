mocha.setup('bdd')

window.wiki = {}

$ ->
  require('./test/util.coffee')
  require('./test/plugin.coffee')
  mocha.run()
