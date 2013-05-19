_ = require 'underscore'

wiki = require './wiki.coffee'
active = require './active.coffee'
util = require './util.coffee'
createSearch = require './search.coffee'

module.exports = neighborhood = {}


wiki.neighborhood ?= {}
nextAvailableFetch = 0
nextFetchInterval = 2000

populateSiteInfoFor = (site,neighborInfo)->
  return if neighborInfo.sitemapRequestInflight
  neighborInfo.sitemapRequestInflight = true

  transition = (site, from, to) ->
    $(""".neighbor[data-site="#{site}"]""")
      .find('div')
      .removeClass(from)
      .addClass(to)

  fetchMap = ->
    sitemapUrl = "http://#{site}/system/sitemap.json"
    transition site, 'wait', 'fetch'
    request = $.ajax
      type: 'GET'
      dataType: 'json'
      url: sitemapUrl
    request
      .always( -> neighborInfo.sitemapRequestInflight = false )
      .done (data)->
        neighborInfo.sitemap = data
        transition site, 'fetch', 'done'
        $('body').trigger 'new-neighbor-done', site
      .fail (data)->
        transition site, 'fetch', 'fail'

  now = Date.now()
  if now > nextAvailableFetch
    nextAvailableFetch = now + nextFetchInterval
    setTimeout fetchMap, 100
  else
    setTimeout fetchMap, nextAvailableFetch - now
    nextAvailableFetch += nextFetchInterval


wiki.registerNeighbor = neighborhood.registerNeighbor = (site)->
  return if wiki.neighborhood[site]?
  neighborInfo = {}
  wiki.neighborhood[site] = neighborInfo
  populateSiteInfoFor( site, neighborInfo )
  $('body').trigger 'new-neighbor', site

neighborhood.listNeighbors = ()->
  _.keys( wiki.neighborhood )

neighborhood.search = (searchQuery)->
  finds = []
  tally = {}

  tick = (key) ->
    if tally[key]? then tally[key]++ else tally[key] = 1

  match = (key, text) ->
    hit = text? and text.toLowerCase().indexOf( searchQuery.toLowerCase() ) >= 0
    tick key if hit
    hit

  start = Date.now()
  for own neighborSite,neighborInfo of wiki.neighborhood
    sitemap = neighborInfo.sitemap
    tick 'sites' if sitemap?
    matchingPages = _.each sitemap, (page)->
      tick 'pages'
      return unless match('title', page.title) or match('text', page.synopsis) or match('slug', page.slug)
      tick 'finds'
      finds.push
        page: page,
        site: neighborSite,
        rank: 1 # HARDCODED FOR NOW
  tally['msec'] = Date.now() - start
  { finds, tally }


$ ->
  $neighborhood = $('.neighborhood')

  flag = (site) ->
    # status class progression: .wait, .fetch, .fail or .done
    """
      <span class="neighbor" data-site="#{site}">
        <div class="wait">
          <img src="http://#{site}/favicon.png" title="#{site}">
        </div>
      </span>
    """

  $('body')
    .on 'new-neighbor', (e, site) ->
      $neighborhood.append flag site
    .delegate '.neighbor img', 'click', (e) ->
      wiki.doInternalLink 'welcome-visitors', null, @.title

  search = createSearch({neighborhood})

  $('input.search').on 'keypress', (e)->
    return if e.keyCode != 13 # 13 == return
    searchQuery = $(this).val()
    search.performSearch( searchQuery )
    $(this).val("")
