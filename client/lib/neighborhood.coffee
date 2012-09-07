active = require('./active.coffee')
util = require('./util.coffee')

module.exports = neighborhood = {}

wiki.neighborhood ?= {}

populateSiteInfoFor = (site,neighborInfo)->
  return if neighborInfo.sitemapRequestInflight

  neighborInfo.sitemapRequestInflight = true
  
  sitemapUrl = "http://#{site}/system/sitemap.json"
  request = $.ajax
    type: 'GET'
    dataType: 'json'
    url: sitemapUrl

  request
    .always( -> neighborInfo.sitemapRequestInflight = false )
    .done (data)-> 
      neighborInfo.sitemap = data
    .fail (data)->
      wiki.log( "failed to retrieve sitemap for ", site, data )

neighborhood.registerNeighbor = (site)->
  neighborInfo = {} # nothing to record for now

  populateSiteInfoFor( site, neighborInfo )

  return if wiki.neighborhood[site]?
  wiki.neighborhood[site] = neighborInfo
  $('body').trigger 'new-neighbor', site

neighborhood.listNeighbors = ()->
  _.keys( wiki.neighborhood )

neighborhood.search = (searchQuery)->
  matches = []
  for own neighborSite,neighborInfo of wiki.neighborhood
    sitemap = neighborInfo.sitemap
    matchingPages = _.each sitemap, (page)->
      return if page.title.toLowerCase().indexOf( searchQuery.toLowerCase() ) == -1
      matches.push
        page: page,
        site: neighborSite,
        rank: 1 # HARDCODED FOR NOW
  matches


$ ->
  $neighborhood = $('.neighborhood')

  flag = (site) ->
    """
      <span class="neighbor">
        <img src="http://#{site}/favicon.png" title="#{site}">
      </span>
    """

  $('body')
    .on 'neighborhood-change', ()->
      $neighborhood.empty()
      _.each neighborhood.listNeighbors(), (site)->
        $neighborhood.append flag site

    .on 'new-neighbor', (e, site) ->
      wiki.log 'new-neighbor', site
      $neighborhood.append flag site

    .delegate '.neighbor img', 'click', (e) ->
      wiki.doInternalLink 'welcome-visitors', null, @.title

  $('input.search').on 'keypress', (e)->
    return if e.keyCode != 13 # 13 == return
    searchQuery = $(this).val()
    searchResults = neighborhood.search( searchQuery )
    console.log( 'search results:', searchResults )

    explanatoryPara = {
      type: 'paragraph'
      id: util.randomBytes(8)
      text: "These are the search results for '#{searchQuery}'."
    }
    searchResultReferences = for result in searchResults
      {
        "type": "reference"
        "id": util.randomBytes(8)
        "site": result.site
        "slug": result.page.slug
        "title": result.page.title
        "text": ''
      }
    searchResultPageData = {
      title: "Search Results"
      story: [explanatoryPara].concat(searchResultReferences)
    }
    $searchResultPage = wiki.createPage('search-results')
    wiki.buildPage( searchResultPageData, 'local', $searchResultPage )
    $searchResultPage.appendTo($('.main'))
    active.set($('.page').last())


