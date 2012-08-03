pluginCtor = require('./changes')

describe 'changes plugin', ->
  $div = undefined
  before ->
    $div = $('<div/>')

  it "renders 'empty' when there are no local changes", ->
    emptyLocalStorage = { length: 0 }
    plugin = pluginCtor($,emptyLocalStorage)
    plugin.emit( $div, {} )
    expect( $div.html() ).to.contain('empty')

  it "lists each page found in the local store"
  it "removes a page from local store"
  it "re-renders the plugin div when a page is removed"

