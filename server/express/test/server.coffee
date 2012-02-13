server = require '..'
path = require 'path'
random = require '../lib/random_id'
testid = random()
argv = require('../lib/defaultargs.coffee')({d: path.join('/tmp', 'sfwtests', testid), p: 55555})
fs = require('fs')

describe 'server', ->
  describe '#actionCB()', ->
    runningServer = {}
    routeCB = {}
    before((done) ->
      runningServer = server(argv)
      runningServer.once("ready", ->
        routeCB = runningServer.routes.routes.put[0].callbacks[1]
        done()
      )
    )
    req = {
      body: {}
      params: [ "asdf-test-page" ]
    }
    file = path.join(argv.db, "asdf-test-page")
    res = {}
    # TODO: When race conditions are fixed in lib/page.coffee clean up function below.
    createSend = (test, done) ->
      (str) ->
        console.log str
        runningServer.pagehandler.get('asdf-test-page', (data) ->
          test(data)
          done()
        )
    
    it 'should move the paragraphs to the order given ', (done) ->
      req.body.action = '{ "type": "move", "order": [ "a1", "a3", "a2", "a4"] }'
      test = (page) ->
        page.story[1].id.should.equal('a3')
        page.story[1].id.should.not.equal('a2')
      res.send = createSend(test, done)
      routeCB(req, res)

    it 'should add a paragraph', (done) ->
      req.body.action = JSON.stringify({
        type: 'add'
        after: 'a2'
        item: {id: 'a5', type: 'paragraph', text: 'this is the NEW paragraph'}
      })
      test = (page) ->
        page.story[3].id.should.equal('a5')
      res.send = createSend(test, done)
      routeCB(req, res)

    it 'should remove a paragraph with given id', (done) ->
      req.body.action = JSON.stringify({
        type: 'remove'
        id: 'a2'
      })
      test = (page) ->
        page.story.length.should.equal(4)
        page.story[2].id.should.not.equal('a2')
        page.story[1].id.should.not.equal('a2')
      res.send = createSend(test, done)
      routeCB(req, res)

    it 'should edit a paragraph in place', (done) ->
      req.body.action = JSON.stringify({
        type: 'edit'
        item: {id: 'a3', type: 'paragraph', text: 'edited'}
        id: 'a3'
      })
      test = (page) ->
        page.story[1].text.should.equal('edited')
      res.send = createSend(test, done)
      routeCB(req, res)

    it 'should default to no change', (done) ->
      req.body.action = JSON.stringify({
        type: 'asdf'
      })
      test = (page) ->
        page.story.length.should.equal(4)
        page.story[1].id.should.equal('a3')
        page.story[3].text.should.equal('this is the fourth paragraph')
      res.send = createSend(test, done)
      routeCB(req, res)

    it 'should create a page when asked', (done) ->
      req.body.action = JSON.stringify({
        type: 'create'
        item: {
          title: 'thetitle'
        }
        id: 'b1'
      })
      test = (page) ->
        page.story.should.exist
        page.journal.should.exist
      res.send = createSend(test, done)
      routeCB(req, res)




    after( ->
      runningServer.close())
