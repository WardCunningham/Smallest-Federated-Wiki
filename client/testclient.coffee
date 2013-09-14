mocha.setup('bdd')

window.wiki = require('wiki-client/lib/wiki')

require('wiki-client/test/util')
require('wiki-client/test/active')
require('wiki-client/test/pageHandler')
require('wiki-client/test/refresh')
require('wiki-client/test/plugin')
require('wiki-client/test/revision')
require('wiki-client/test/neighborhood')
require('wiki-client/test/search')

$ ->
  $('<hr><h2> Testing artifacts:</h2>').appendTo('body')
  mocha.run()

