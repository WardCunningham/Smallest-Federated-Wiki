pluginCtor = require('./changes')

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


describe 'changes plugin', ->
  fakeLocalStore = undefined
  $div = undefined
  
  beforeEach ->
    $div = $('<div/>')
    fakeLocalStore = createFakeLocalStorage()

  makePlugin = -> pluginCtor($,{localStorage: fakeLocalStore})
  installPlugin = -> 
    plugin = makePlugin()
    plugin.emit( $div, {} )
    plugin.bind( $div, {} )

  expectNumberOfPagesToBe = (expectedLength)->
    expect( $div.find('li a').length ).to.be(expectedLength)

  clickDeleteForPageWithSlug = (slug)->
    $div.find("li a[data-page-name='#{slug}']").siblings('button').trigger('click')

  it "renders 'empty' when there are no local changes", ->
    installPlugin()
    expect( $div.html() ).to.contain('empty')
    expectNumberOfPagesToBe(0)

  describe 'some pages in local store', ->
    beforeEach ->
      fakeLocalStore = createFakeLocalStorage(
        page1: JSON.stringify({ title: "A Page" }),
        page2: JSON.stringify({ title: "Another Page" }),
        page3: JSON.stringify({ title: "Page the Third" })
      )

    it "doesn't render 'empty'", ->
      installPlugin()
      expect( $div.html() ).not.to.contain('empty')

    it "lists each page found in the local store", ->
      installPlugin()
      expectNumberOfPagesToBe(3)
      allTitles = $div.find('li a').map( (_,a)-> $(a).html() ).toArray().join('')
      expect( allTitles ).to.contain('A Page')
      expect( allTitles ).to.contain('Another Page')
      expect( allTitles ).to.contain('Page the Third')

    it "removes a page from local store", ->
      installPlugin()
      expect( fakeLocalStore.getItem('page2') ).to.be.ok()
      clickDeleteForPageWithSlug('page2')
      expect( fakeLocalStore.getItem('page2') ).not.to.be.ok()


    it "updates the plugin div when a page is removed", ->
      installPlugin()
      expectNumberOfPagesToBe(3)
      clickDeleteForPageWithSlug('page2')
      expectNumberOfPagesToBe(2)
