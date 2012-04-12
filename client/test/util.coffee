util = require('../lib/util.coffee')
module.exports = describe 'util', ->
  it 'should make random bytes', ->
    a = util.randomByte()
    expect(a).to.be.a 'string'
    expect(a.length).to.be 2
  it 'should make random byte strings', ->
    s = util.randomBytes(4)
    expect(s).to.be.a 'string'
    expect(s.length).to.be 8

  it 'should format unix time', ->
    s = util.formatTime 1333843344
    expect(s).to.be '5:02 PM<br>7 Apr 2012'
  it 'should format javascript time', ->
    s = util.formatTime 1333843344000
    expect(s).to.be '5:02 PM<br>7 Apr 2012'
  it 'should slug a name', ->
    s = util.asSlug 'Welcome Visitors'
    expect(s).to.be 'welcome-visitors'
  it 'should make emptyPage page with title, story and journal', ->
    page = util.emptyPage()
    expect(page.title).to.be 'empty'
    expect(page.story).to.eql []
    expect(page.journal).to.eql []
  it 'should make fresh empty page each call', ->
    page = util.emptyPage()
    page.story.push {type: 'junk'}
    page = util.emptyPage()
    expect(page.story).to.eql []

