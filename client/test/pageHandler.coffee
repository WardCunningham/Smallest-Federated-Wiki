pageHandler = require '../lib/pageHandler.coffee'

#Fakes for things still stuck in legacy.coffee
wiki.useLocalStorage = -> false
wiki.putAction = ->

describe 'pageHandler.get', ->
  before ->
    $('<div id="pageHandler" data-site="foo" />').appendTo('body')

  it 'should have an empty context', ->
    expect(pageHandler.context).to.eql([])

  describe 'ajax fails', ->
    before ->
      sinon.stub(jQuery, "ajax").yieldsTo('error')

    it 'should create a page when it can not find it', (done) ->
      pageHandler.get $('#pageHandler'), (page) ->
        expect(page).to.eql({title: 'pageHandler'})
        done()

    after ->
      jQuery.ajax.restore()

  describe 'ajax, success', ->
    before ->
      sinon.stub(jQuery, "ajax").yieldsTo('success', 'test')

    it 'should get a page from specific site', (done) ->
      pageHandler.get $('#pageHandler'), (page) ->
        expect(jQuery.ajax.calledOnce).to.be.true
        expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET')
        expect(jQuery.ajax.args[0][0].url).to.match(///^/remote/foo/pageHandler\.json\?random=[a-z0-9]{8}$///)
        done()

    after ->
      jQuery.ajax.restore()

  describe 'ajax, search', ->
    before ->
      $('<div id="pageHandler2" />').appendTo('body')
      sinon.stub(jQuery, "ajax").yieldsTo('error')
      pageHandler.context = ['origin', 'example.com', 'asdf.test', 'foo.bar']

    it 'should search through the context for a page', (done) ->
      pageHandler.get $('#pageHandler2'), (page) ->
        expect(jQuery.ajax.args[0][0].url).to.match(///^/pageHandler2\.json\?random=[a-z0-9]{8}$///)
        expect(jQuery.ajax.args[1][0].url).to.match(///^/remote/example.com/pageHandler2\.json\?random=[a-z0-9]{8}$///)
        expect(jQuery.ajax.args[2][0].url).to.match(///^/remote/asdf.test/pageHandler2\.json\?random=[a-z0-9]{8}$///)
        expect(jQuery.ajax.args[3][0].url).to.match(///^/remote/foo.bar/pageHandler2\.json\?random=[a-z0-9]{8}$///)
        done()

    after ->
      jQuery.ajax.restore()

describe 'pageHandler.put', ->
  before ->
    $('<div id="pageHandler3" />').appendTo('body')
    sinon.stub(jQuery, "ajax").yieldsTo('success')

  it 'should save an action', (done) ->
    action = {type: 'edit', id: 1, item: {id:1}}
    wiki.addToJournal = ->
      expect(jQuery.ajax.args[0][0].data).to.eql({action: JSON.stringify(action)})
      done()
    pageHandler.put $('#pageHandler3'), action

  after ->
    jQuery.ajax.restore()

