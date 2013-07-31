server = require '..'
path = require 'path'
random = require '../lib/random_id'
testid = random()
argv = require('../lib/defaultargs.coffee')({d: path.join('/tmp', 'sfwtests', testid), p: 55555})

describe 'server', ->
  describe '#actionCB()', ->
    runningServer = {}
    routeCB = {}
    before((done) ->
      runningServer = server(argv)
      runningServer.once("listening", ->
        routeCB = runningServer.routes.put[0].callbacks[1]
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
    createSend = (test) ->
      (str) ->
        runningServer.pagehandler.get('asdf-test-page', (e, data) ->
          if e then throw e
          test(data)
        )

    it 'should create a page', (done) ->
      req.body.action = JSON.stringify({
      type: 'create'
      item: {
        title: "Asdf Test Page"
        story: [
          {id: "a1", type: "paragraph", text: "this is the first paragraph"}
          {id: "a2", type: "paragraph", text: "this is the second paragraph"}
          {id: "a3", type: "paragraph", text: "this is the third paragraph"}
          {id: "a4", type: "paragraph", text: "this is the fourth paragraph"}
          ]
        journal: []
      }
      id: 'd5'
      })
      test = (page) ->
        page.title.should.equal('Asdf Test Page')
        page.journal[0].type.should.equal('create')
        page.story[0].id.should.equal('a1')
        done()
      res.send = createSend(test)
      routeCB(req, res)

    it 'should move the paragraphs to the order given ', (done) ->
      req.body.action = '{ "type": "move", "order": [ "a1", "a3", "a2", "a4"] }'
      test = (page) ->
        page.story[1].id.should.equal('a3')
        page.story[1].id.should.not.equal('a2')
        done()
      res.send = createSend(test)
      routeCB(req, res)

    it 'should add a paragraph', (done) ->
      req.body.action = JSON.stringify({
        type: 'add'
        after: 'a2'
        item: {id: 'a5', type: 'paragraph', text: 'this is the NEW paragraph'}
      })
      test = (page) ->
        page.story[3].id.should.equal('a5')
        done()
      res.send = createSend(test)
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
        done()
      res.send = createSend(test)
      routeCB(req, res)

    it 'should edit a paragraph in place', (done) ->
      req.body.action = JSON.stringify({
        type: 'edit'
        item: {id: 'a3', type: 'paragraph', text: 'edited'}
        id: 'a3'
      })
      test = (page) ->
        page.story[1].text.should.equal('edited')
        done()
      res.send = createSend(test)
      routeCB(req, res)

    it 'should default to no change', (done) ->
      req.body.action = JSON.stringify({
        type: 'asdf'
      })
      test = (page) ->
        page.story.length.should.equal(4)
        page.story[1].id.should.equal('a3')
        page.story[3].text.should.equal('this is the fourth paragraph')
        done()
      res.send = createSend(test)
      routeCB(req, res)

    it 'should refuse to create over a page', (done) ->
      req.body.action = JSON.stringify({
        type: 'create'
        item: {
          title: 'Doh'
        }
        id: 'c1'
      })
      test = (page) ->
        page.title.should.not.equal('Doh')
        done()
      res.send = createSend(test)
      routeCB(req, res)

    after( ->
      runningServer.close() if runningServer.close)
