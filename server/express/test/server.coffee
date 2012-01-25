server = require '..'
path = require 'path'
random = require '../lib/random_id'
testid = random()
argv = require('../lib/defaultargs.coffee')({d: path.join('/tmp', 'sfwtests', testid), p: 55555})
fs = require('fs')

describe 'server', ->
  describe '#actionCB()', ->
    runningServer = server(argv)
    routeCB = runningServer.routes.routes.put[0].callbacks[1]
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
        fs.readFile(file, (err, data) ->
          if err then throw err
          test(JSON.parse(data))
          fs.unlink(file, (e) ->
            console.log 'deleted'
            done()
          )
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
        page.story[2].id.should.equal('a5')
      res.send = createSend(test, done)
      routeCB(req, res)

    it 'should remove a paragraph with given id', (done) ->
      req.body.action = JSON.stringify({
        type: 'remove'
        id: 'a2'
      })
      test = (page) ->
        page.story.length.should.equal(3)
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
        page.story[2].text.should.equal('edited')
      res.send = createSend(test, done)
      routeCB(req, res)

    it 'should default to no change', (done) ->
      req.body.action = JSON.stringify({
        type: 'asdf'
      })
      test = (page) ->
        page.story.length.should.equal(4)
        page.story[1].id.should.equal('a2')
        page.story[2].text.should.equal('this is the third paragraph')
      res.send = createSend(test, done)
      routeCB(req, res)

    runningServer.close()
