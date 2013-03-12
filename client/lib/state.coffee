active = require('./active.coffee')

module.exports = state = {}

# FUNCTIONS and HANDLERS to manage location bar and back button

state.pagesInDom = ->
  $.makeArray $(".page").map (_, el) -> el.id

state.urlPages = ->
  (i for i in $(location).attr('pathname').split('/') by 2)[1..]

state.locsInDom = ->
  $.makeArray $(".page").map (_, el) ->
    $(el).data('site') or 'view'

state.urlLocs = ->
  (j for j in $(location).attr('pathname').split('/')[1..] by 2)

state.setUrl = ->
  document.title = $('.page:last').data('data')?.title
  if history and history.pushState
    locs = state.locsInDom()
    pages = state.pagesInDom()
    url = ("/#{locs?[idx] or 'view'}/#{page}" for page, idx in pages).join('')
    unless url is $(location).attr('pathname')
      history.pushState(null, null, url)

state.show = (e) ->
  oldPages = state.pagesInDom()
  newPages = state.urlPages()
  oldLocs = state.locsInDom()
  newLocs = state.urlLocs()

  return if (!location.pathname or location.pathname is '/')

  previous = $('.page').eq(0)

  for name, idx in newPages
    unless name is oldPages[idx]
      old = $('.page').eq(idx)
      old.remove() if old
      wiki.createPage(name, newLocs[idx]).insertAfter(previous).each wiki.refresh
    previous = $('.page').eq(idx)

  previous.nextAll().remove()

  active.set($('.page').last())
  document.title = $('.page:last').data('data')?.title

state.first = ->
  state.setUrl()
  firstUrlPages = state.urlPages()
  firstUrlLocs = state.urlLocs()
  oldPages = state.pagesInDom()
  for urlPage, idx in firstUrlPages when urlPage not in oldPages
    wiki.createPage(urlPage, firstUrlLocs[idx]).appendTo('.main') unless urlPage is ''

