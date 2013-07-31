path = require('path')
random = require('../lib/random_id')
testid = random()
argv = require('../lib/defaultargs.coffee')({d: path.join('/tmp', 'sfwtests', testid), r: path.join(__dirname, '..')})
page = require('../lib/page.coffee')(argv)
fs = require('fs')

testpage = {title: 'Asdf'}

describe 'page', ->
  describe '#page.put()', ->
    it 'should save a page', (done) ->
      page.put('asdf', testpage, (e) ->
        done(e)
      )
  describe '#page.get()', ->
    it 'should get a page if it exists', (done) ->
      page.get('asdf', (e, got) ->
        if e then throw e
        got.title.should.equal 'Asdf'
        done()
      )
    it 'should copy a page from default if nonexistant in db', (done) ->
      page.get('welcome-visitors', (e, got) ->
        if e then throw e
        got.title.should.equal 'Welcome Visitors'
        done()
      )
    it 'should copy a page from plugins if nonexistant in db', (done) ->
      page.get('air-temperature', (e, got) ->
        if e then throw e
        got.title.should.equal 'Air Temperature'
        done()
      )
    it 'should create a page if it exists nowhere', (done) ->
      page.get(random(), (e, got) ->
        if e then throw e
        got.should.equal('Page not found')
        done()
      )
    it 'should eventually write the page to disk', (done) ->
      test = ->
        fs.readFile(path.join(argv.db, 'asdf'), (err, data) ->
          if err then throw err
          readPage = JSON.parse(data)
          page.get('asdf', (e, got) ->
            readPage.title.should.equal got.title
            done()
          )
        )
      if page.isWorking()
        page.on('finished', -> test())
      else test()
