refresh = require('../lib/refresh.coffee')

describe 'refresh', ->

  before ->
    sinon.stub(jQuery, "ajax").yieldsTo('success', {title: 'asdf'})
    $('<div id="refresh" />').appendTo('body')

  it 'should refresh a page', (done) ->
    $('#refresh').each refresh
    setTimeout( ->
      expect($('#refresh h1').text()).to.be(' asdf')
      done()
    , 1000
    )

  after ->
    jQuery.ajax.restore()

