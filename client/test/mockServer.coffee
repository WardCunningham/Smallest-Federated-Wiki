sinon = require 'sinon'

simulatePageNotFound = ->
  xhrFor404 = {
    status: 404
  }
  sinon.stub(jQuery, "ajax").yieldsTo('error',xhrFor404)

simulatePageFound = (pageToReturn = {})->
  sinon.stub(jQuery, "ajax").yieldsTo('success', pageToReturn)


module.exports = {
  simulatePageNotFound,
  simulatePageFound
}
