module.exports = neighborhood = {}

wiki.neighborhood ?= {}

neighborhood.registerNeighbor = (neighborDomain)->
  neighborInfo = {} # nothing to record for now
  wiki.neighborhood[neighborDomain] ||= neighborInfo

  $('body').trigger 'neighborhood-change'

neighborhood.listNeighbors = ()->
  _.keys( wiki.neighborhood )


$ ->
  $neighborhood = $('.neighborhood')

  $('body')
    .on 'neighborhood-change', ()->
      $neighborhood.empty()
      _.each neighborhood.listNeighbors(), (site)->
        $neighborhood.append """<img class="neighbor" src="http://#{site}/favicon.png" title="#{site}">"""

    .delegate '.neighbor', 'click', (e) ->
      wiki.doInternalLink 'welcome-visitors', null, @.title