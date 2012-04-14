fetch = require '../lib/fetch.coffee'

#Fakes for things still stuck in legacy.coffee
wiki.useLocalStorage = -> false
wiki.putAction = ->

describe 'fetch', ->
  before ->
    $('<div id="fetch" data-site="foo" />').appendTo('body')

  it 'should have an empty context', ->
    expect(fetch.context).to.eql([])

  describe 'ajax fails', ->
    before ->
      sinon.stub(jQuery, "ajax").yieldsTo('error')

    it 'should create a page when it can not find it', (done) ->
      fetch $('#fetch'), (page) ->
        expect(page).to.eql({title: 'fetch'})
        done()

    after ->
      jQuery.ajax.restore()

  describe 'ajax, success', ->
    before ->
      sinon.stub(jQuery, "ajax").yieldsTo('success', 'test')

    it 'should fetch a page from specific site', (done) ->
      fetch $('#fetch'), (page) ->
        expect(jQuery.ajax.calledOnce).to.be.true
        expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET')
        expect(jQuery.ajax.args[0][0].url).to.match(///^/remote/foo/fetch\.json\?random=[a-z0-9]{8}$///)
        done()

    after ->
      jQuery.ajax.restore()

  describe 'ajax, search', ->
    before ->
      $('<div id="fetch2" />').appendTo('body')
      sinon.stub(jQuery, "ajax").yieldsTo('error')
      fetch.context = ['origin', 'example.com', 'asdf.test', 'foo.bar']

    it 'should search through the context for a page', (done) ->
      fetch $('#fetch2'), (page) ->
        expect(jQuery.ajax.args[0][0].url).to.match(///^/fetch2\.json\?random=[a-z0-9]{8}$///)
        expect(jQuery.ajax.args[1][0].url).to.match(///^/remote/example.com/fetch2\.json\?random=[a-z0-9]{8}$///)
        expect(jQuery.ajax.args[2][0].url).to.match(///^/remote/asdf.test/fetch2\.json\?random=[a-z0-9]{8}$///)
        expect(jQuery.ajax.args[3][0].url).to.match(///^/remote/foo.bar/fetch2\.json\?random=[a-z0-9]{8}$///)
        done()

    after ->
      jQuery.ajax.restore()


