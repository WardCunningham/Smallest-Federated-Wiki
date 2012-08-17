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

  $('body').on 'neighborhood-change', ()->
    $neighborhood.empty()
    _.each neighborhood.listNeighbors(), (neighborDomain)->
      $("<img src='http://#{neighborDomain}/favicon.png'>").appendTo( $neighborhood )
