util = require('./util')
state = require('./state')
revision = require('./revision')

module.exports = pageHandler = {}

pageFromLocalStorage = (slug)->
  if json = localStorage[slug]
    JSON.parse(json)
  else
    undefined

recursiveGet = ({pageInformation, whenGotten, whenNotGotten, localContext}) ->
  {slug,rev,site} = pageInformation

  if site
    localContext = []
  else
    site = localContext.shift()

  site = null if site=='view'

  if site?
    if site == 'local'
      if localPage = pageFromLocalStorage(pageInformation.slug)
        return whenGotten( localPage, 'local' )
      else
    else
      if site == 'origin'
        resource = slug
      else
        resource = "remote/#{site}/#{slug}"
  else
    resource = slug

  pageUrl = "/#{resource}.json?random=#{util.randomBytes(4)}"

  $.ajax
    type: 'GET'
    dataType: 'json'
    url: pageUrl
    success: (page) ->
      page = revision.create rev, page if rev
      return whenGotten(page,site)
    error: (xhr, type, msg) ->
      if xhr.status != 404
        wiki.log 'pageHandler.get error', xhr, xhr.status, type, msg
        report =
          'title': msg
          'story': [
            'type': 'paragraph'
            'id': '928739187243'
            'text': "<pre>#{xhr.responseText}"
          ]
        return whenGotten report, 'local'
      if localContext.length > 0
        recursiveGet( {pageInformation, whenGotten, whenNotGotten, localContext} )
      else
        whenNotGotten()

pageHandler.get = ({whenGotten,whenNotGotten,pageInformation}  ) ->

  wiki.log 'pageHandler.get', pageInformation.site, pageInformation.slug, pageInformation.rev, 'context', pageHandler.context.join ' => '

  if pageInformation.wasServerGenerated
    return whenGotten( null )

  unless pageInformation.site
    if localPage = pageFromLocalStorage(pageInformation.slug)
      return whenGotten( localPage, 'local' )

  pageHandler.context = ['view'] unless pageHandler.context.length

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
  wiki.log 'pageHandler.put', pageElement, action, 'pageElement-site', pageElement.data('site')
  action.date = (new Date()).getTime()
  delete action.site if action.site == 'origin'
  if (site = pageElement.data('site'))? and site != 'origin' and site != 'local'
    # pull remote site closer to us
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
  if wiki.useLocalStorage() or site == 'local'
    pushToLocal(pageElement, action)
    pageElement.addClass("local")
  else
    pushToServer(pageElement, action)

