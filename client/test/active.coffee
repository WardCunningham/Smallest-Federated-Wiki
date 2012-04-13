active = require '../lib/active.coffee'

describe 'active', ->

  before ->
    $('<div id="active1" />').appendTo('body')
    $('<div id="active2" />').appendTo('body')
    active.set($('#active1'))

  it 'should detect the scroll container', ->
    expect(active.scrollContainer).to.be.a($)

  it 'should set the active div', ->
    active.set($('#active2'))
    expect($('#active2').hasClass('active')).to.be.true

  it 'should remove previous active class', ->
    expect($('#active1').hasClass('active')).to.be.false

