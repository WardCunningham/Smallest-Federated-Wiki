module.exports = neighborhood = {}

wiki.neighborhood ?= {}

neighborhood.registerNeighbor = (site)->
  neighborInfo = {} # nothing to record for now
  return if wiki.neighborhood[site]?
  wiki.neighborhood[site] = site
  $('body').trigger 'new-neighbor', site

neighborhood.listNeighbors = ()->
  _.keys( wiki.neighborhood )


$ ->
  $neighborhood = $('.neighborhood')

  flag = (site) ->
    """<img class="neighbor" src="http://#{site}/favicon.png" title="#{site}">"""

  $('body')
    .on 'neighborhood-change', ()->
      $neighborhood.empty()
      _.each neighborhood.listNeighbors(), (site)->
        $neighborhood.append flag site

    .on 'new-neighbor', (e, site) ->
      wiki.log 'new-neighbor', site
      $neighborhood.append flag site

    .delegate '.neighbor', 'click', (e) ->
      wiki.doInternalLink 'welcome-visitors', null, @.title