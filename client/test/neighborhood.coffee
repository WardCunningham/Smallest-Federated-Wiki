neighborhood = require '../lib/neighborhood.coffee'

describe 'neighborhood', ->

  describe 'no neighbors', ->
    it 'should return an empty array for our search', ->
      debugger
      searchResult = neighborhood.search( "query string" )
      expect(searchResult).to.eql( [] )


  describe 'a single neighbor with a few pages', ->
    before ->
      fakeSitemap = [
        { title: 'Page One', slug: 'page-one', date: 'date1' },
        { title: 'Page Two', slug: 'page-two', date: 'date2' },
        { title: 'Page Three' }
      ]

      neighbor = {
        sitemap: fakeSitemap
      }

      wiki.neighborhood = {}
      wiki.neighborhood['my-site'] = neighbor

    it 'returns all pages that match the query', ->
      searchResult = neighborhood.search( "Page" )
      expect( searchResult ).to.have.length(3)

    it 'returns only pages that match the query', ->
      searchResult = neighborhood.search( "Page T" )
      expect( searchResult ).to.have.length(2)

    it 'should package the results in the correct format', ->
      expectedResult = [
        {
          site: 'my-site',
          page: { title: 'Page Two', slug: 'page-two', date: 'date2' },
          rank: 1
        }
      ]
      searchResult = neighborhood.search( "Page Two" )
      expect( searchResult ).to.eql( expectedResult )


    it 'searches both the slug and the title'

  describe 'more than one neighbor', ->
    before ->
      wiki.neighborhood = {}
      wiki.neighborhood['site-one'] = {
        sitemap: [
          { title: 'Page One from Site 1' },
          { title: 'Page Two from Site 1' },
          { title: 'Page Three from Site 1' }
        ]
      }

      wiki.neighborhood['site-two'] = {
        sitemap: [
          { title: 'Page One from Site 2' },
          { title: 'Page Two from Site 2' },
          { title: 'Page Three from Site 2' }
        ]
      }

    it 'returns matching pages from every neighbor', ->
      searchResult = neighborhood.search( "Page Two" )
      expect( searchResult ).to.have.length(2)
      sites = _.pluck( searchResult, 'site' )
      expect( sites.sort() ).to.eql( ['site-one','site-two'].sort() )


  describe 'an unpopulated neighbor', ->
    before ->
      wiki.neighborhood = {}
      wiki.neighborhood['unpopulated-site'] = {}

    it 'gracefully ignores unpopulated neighbors', ->
      searchResult = neighborhood.search( "some search query" )
      expect( searchResult ).to.be.empty()

    it 'should re-populate the neighbor'
