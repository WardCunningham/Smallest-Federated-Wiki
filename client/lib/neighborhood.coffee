active = require('./active.coffee')
util = require('./util.coffee')
createSearch = require('./search.coffee')

module.exports = neighborhood = {}


wiki.neighborhood ?= {}
nextAvailableFetch = 0
nextFetchInterval = 2000

populateSiteInfoFor = (site,neighborInfo)->
  return if neighborInfo.sitemapRequestInflight
  neighborInfo.sitemapRequestInflight = true

  fetchMap = ->
    sitemapUrl = "http://#{site}/system/sitemap.json"
    wiki.log 'fetchMap', site
    request = $.ajax
      type: 'GET'
      dataType: 'json'
      url: sitemapUrl
    request
      .always( -> neighborInfo.sitemapRequestInflight = false )
      .done (data)->
        neighborInfo.sitemap = data
      .fail (data)->
        wiki.log( "fetchMap failed", site, data )

  now = Date.now()
  if now > nextAvailableFetch
    nextAvailableFetch = now + nextFetchInterval
    fetchMap()
  else
    wiki.log 'fetchMap delayed', site, nextAvailableFetch - now
    setTimeout fetchMap, nextAvailableFetch - now
    nextAvailableFetch += nextFetchInterval


neighborhood.registerNeighbor = (site)->
  return if wiki.neighborhood[site]?
  neighborInfo = {}
  wiki.neighborhood[site] = neighborInfo
  populateSiteInfoFor( site, neighborInfo )
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


  search = createSearch({neighborhood})

  $('input.search').on 'keypress', (e)->
    return if e.keyCode != 13 # 13 == return
    searchQuery = $(this).val()
    search.performSearch( searchQuery )
