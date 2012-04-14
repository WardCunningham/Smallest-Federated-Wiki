plugin = require('../lib/plugin.coffee')

describe 'plugin', ->
  before ->
    sinon.stub(jQuery, "getScript").yieldsTo()
    $('<div id="plugin" />').appendTo('body')

  it 'should have default image type', ->
    expect(window.plugins).to.have.property('image')

  it 'should get a plugin', (done) ->
    plugin.get 'test', ->
      expect(jQuery.getScript.calledOnce).to.be(true)
      expect(jQuery.getScript.args[0][0]).to.be('/plugins/test.js')
      done()
  it 'should render a plugin', ->
    # TODO: Fails, because it can't resolveLinks, fix when it is seperated.
    item =
      type: 'paragraph'
      text: 'blah [[Link]] asdf'
    plugin.do $('#plugin'), item
    expect($('#plugin').html()).to
      .be('<p>blah <a class="internal" href="/link.html" data-page-name="link" title="origin">Link</a> asdf</p>')

  after ->
    jQuery.getScript.restore()

