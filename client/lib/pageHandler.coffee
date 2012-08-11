util = require('./util')
state = require('./state')
revision = require('./revision')

module.exports = pageHandler = {}

pageFromLocalStorage = (slug)->
  if wiki.useLocalStorage() and json = localStorage[slug]
    JSON.parse(json)
  else
    undefined

recursiveGet = ({pageInformation, whenGotten, whenNotGotten, localContext}) ->
  {slug,rev,site} = pageInformation

  if site
    localContext = []
  else
    site = localContext.shift()
  site = null if site=='origin'

  resource = if site? then "remote/#{site}/#{slug}" else slug 
  pageUrl = "/#{resource}.json?random=#{util.randomBytes(4)}"

  $.ajax
    type: 'GET'
    dataType: 'json'
    url: pageUrl
    success: (page) ->
      wiki.log 'fetch success', page, site || 'origin'
      page = revision.create rev, page if rev
      return whenGotten(page,site)
    error: (xhr, type, msg) ->
      if localContext.length > 0
        recursiveGet( {pageInformation, whenGotten, whenNotGotten, localContext} )
      else
        whenNotGotten()

pageHandler.get = ({whenGotten,whenNotGotten,pageInformation}  ) ->
  if pageInformation.wasServerGenerated
    return whenGotten( null )

  if localPage = pageFromLocalStorage(pageInformation.slug)
    return whenGotten( localPage, 'local' )

  pageHandler.context = ['origin'] unless pageHandler.context.length

  recursiveGet
    pageInformation: pageInformation
    whenGotten: whenGotten
    whenNotGotten: whenNotGotten
    localContext: _.clone(pageHandler.context)


pageHandler.context = []

pushToLocal = (pageElement, action) ->
  page = localStorage[pageElement.attr("id")]
  page = JSON.parse(page) if page
  page = {title: action.item.title} if action.type == 'create'
  page ||= pageElement.data("data")
  page.journal = [] unless page.journal?
  page.journal = page.journal.concat(action)
  page.story = $(pageElement).find(".item").map(-> $(@).data("item")).get()
  localStorage[pageElement.attr("id")] = JSON.stringify(page)
  wiki.addToJournal pageElement.find('.journal'), action

pushToServer = (pageElement, action) ->
  $.ajax
    type: 'PUT'
    url: "/page/#{pageElement.attr('id')}/action"
    data:
      'action': JSON.stringify(action)
    success: () ->
      wiki.addToJournal pageElement.find('.journal'), action
    error: (xhr, type, msg) ->
      wiki.log "ajax error callback", type, msg

pageHandler.put = (pageElement, action) ->
  action.date = (new Date()).getTime()
  if (site = pageElement.data('site'))?
    pageElement.find('h1 img').attr('src', '/favicon.png')
    pageElement.find('h1 a').attr('href', '/')
    pageElement.data('site', null)
    state.setUrl()
    if action.type != 'fork'
      # bundle implicit fork with next action
      action.fork = site
      wiki.addToJournal pageElement.find('.journal'),
        type: 'fork'
        site: site
        date: action.date
  if wiki.useLocalStorage()
    pushToLocal(pageElement, action)
    pageElement.addClass("local")
  else
    pushToServer(pageElement, action)

