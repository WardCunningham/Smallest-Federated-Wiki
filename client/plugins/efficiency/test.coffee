pluginCtor = require('./efficiency')
thePlugin = null

createFakeLocalStorage = (initialContents={})->
  store = initialContents

  keys = -> (k for k,_ of store)
  getStoreSize = -> keys().length

  fake = 
    setItem: (k,v)-> store[k] = v
    getItem: (k)-> store[k]
    key: (i) -> keys()[i]
    removeItem: (k) -> delete store[k]

  Object.defineProperty( fake, 'length', { get: getStoreSize } )
  fake


describe 'efficiency plugin', ->
  fakeLocalStore = undefined
  $div = undefined
  
  beforeEach ->
    $div = $('<div/>')
    fakeLocalStore = createFakeLocalStorage()

  ###
  #makePlugin = -> pluginCtor($,{localStorage: fakeLocalStore})
  makePlugin = new window.plugins.efficiency
  installPlugin = -> 
    plugin = makePlugin()
    wiki.log 'plugin ', plugin
    plugin.emit( $div, {} )
    plugin.bind( $div, {} )
    thePlugin = plugin
  ###

  expectNumberOfPagesToBe = (expectedLength)->
    expect( $div.find('li a').length ).to.be(expectedLength)


  it "calcs 10%", ->
     #installPlugin()
     wiki.log '10%'
     wiki.log 'window.plugins.efficiency ', window.plugins.efficiency
     expect(10).to.equal 10
     expect(5).to.equal window.plugins.efficiency.doAdd(2, 3)


  it "calcs 50%", ->
     #installPlugin()
     wiki.log '50%'
     expect(50).to.equal 50





  
