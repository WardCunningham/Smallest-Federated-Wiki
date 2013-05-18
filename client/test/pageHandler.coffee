_ = require 'underscore'
expect = require 'expect.js'
sinon = require 'sinon'

wiki = require '../lib/wiki.coffee'
pageHandler = require '../lib/pageHandler.coffee'
mockServer = require './mockServer.coffee'

# Fakes for things still stuck in legacy.coffee
# TODO: Remove these ASAP
wiki.useLocalStorage = -> false

describe 'pageHandler.get', ->

  it 'should have an empty context', ->
    expect(pageHandler.context).to.eql([])

  pageInformationWithoutSite = {
    slug: 'slugName'
    rev: 'revName'
  }

  genericPageInformation = _.extend( {}, pageInformationWithoutSite, {site: 'siteName'} )

  genericPageData = {
    journal: []
  }

  describe 'ajax fails', ->

    before ->
      mockServer.simulatePageNotFound()

    after ->
      jQuery.ajax.restore()

    it "should tell us when it can't find a page (server specified)", ->
      whenGotten = sinon.spy()
      whenNotGotten = sinon.spy()

      pageHandler.get 
        pageInformation: _.clone( genericPageInformation )
        whenGotten: whenGotten
        whenNotGotten: whenNotGotten

      expect( whenGotten.called ).to.be.false
      expect( whenNotGotten.called ).to.be.true

    it "should tell us when it can't find a page (server unspecified)", ->
      whenGotten = sinon.spy()
      whenNotGotten = sinon.spy()

      pageHandler.get 
        pageInformation: _.clone( pageInformationWithoutSite )
        whenGotten: whenGotten
        whenNotGotten: whenNotGotten

      expect( whenGotten.called ).to.be.false
      expect( whenNotGotten.called ).to.be.true

  describe 'ajax, success', ->
    before ->
      sinon.stub(jQuery, "ajax").yieldsTo('success', genericPageData)
      $('<div id="pageHandler5" data-site="foo" />').appendTo('body')

    it 'should get a page from specific site', ->
      whenGotten = sinon.spy()
      pageHandler.get 
        pageInformation: _.clone( genericPageInformation )
        whenGotten: whenGotten

      expect(whenGotten.calledOnce).to.be.true
      expect(jQuery.ajax.calledOnce).to.be.true
      expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET')
      expect(jQuery.ajax.args[0][0].url).to.match(///^http://siteName/slugName\.json\?random=[a-z0-9]{8}$///)

    after ->
      jQuery.ajax.restore()

  describe 'ajax, search', ->
    before ->
      mockServer.simulatePageNotFound()
      pageHandler.context = ['view', 'example.com', 'asdf.test', 'foo.bar']

    it 'should search through the context for a page', ->
      pageHandler.get 
        pageInformation: _.clone( pageInformationWithoutSite )
        whenGotten: sinon.stub()
        whenNotGotten: sinon.stub()

      expect(jQuery.ajax.args[0][0].url).to.match(///^/slugName\.json\?random=[a-z0-9]{8}$///)
      expect(jQuery.ajax.args[1][0].url).to.match(///^http://example.com/slugName\.json\?random=[a-z0-9]{8}$///)
      expect(jQuery.ajax.args[2][0].url).to.match(///^http://asdf.test/slugName\.json\?random=[a-z0-9]{8}$///)
      expect(jQuery.ajax.args[3][0].url).to.match(///^http://foo.bar/slugName\.json\?random=[a-z0-9]{8}$///)

    after ->
      jQuery.ajax.restore()

describe 'pageHandler.put', ->
  before ->
    $('<div id="pageHandler3" />').appendTo('body')
    sinon.stub(jQuery, "ajax").yieldsTo('success')

  it 'should save an action', (done) ->
    action = {type: 'edit', id: 1, item: {id:1}}
    pageHandler.put $('#pageHandler3'), action
    expect(jQuery.ajax.args[0][0].data).to.eql({action: JSON.stringify(action)})
    done()

  after ->
    jQuery.ajax.restore()

