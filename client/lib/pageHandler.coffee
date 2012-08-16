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
      localPage = revision.create pageInformation.rev, localPage if pageInformation.rev
      return whenGotten( localPage, 'local' )

  pageHandler.context = ['view'] unless pageHandler.context.length

  recursiveGet
    pageInformation: pageInformation
    whenGotten: whenGotten
    whenNotGotten: whenNotGotten
    localContext: _.clone(pageHandler.context)


pageHandler.context = []

pushToLocal = (pageElement, pageInformation, action) ->
  page = pageFromLocalStorage pageInformation.slug
  page = {title: action.item.title} if action.type == 'create'
  page ||= pageElement.data("data")
  page.journal = [] unless page.journal?
  if (site=action['fork'])?
    page.journal = page.journal.concat({'type':'fork','site':site})
    delete action['fork']
  page.journal = page.journal.concat(action)
  page.story = $(pageElement).find(".item").map(-> $(@).data("item")).get()
  localStorage[pageInformation.slug] = JSON.stringify(page)
  wiki.addToJournal pageElement.find('.journal'), action

pushToServer = (pageElement, pageInformation, action) ->
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

  # about the page we have
  [slug, rev] = pageElement.attr('id').split('_rev')
  pageInformation = {
    slug: slug
    rev: rev
    site: pageElement.data('site')
    wasServerGenerated: pageElement.attr('data-server-generated') == 'true'
  }
  forkFrom = pageInformation.site
  forkfrom = null if forkFrom == 'origin' or forkFrom == 'local' or forkFrom == 'view'
  wiki.log 'pageHandler.put', pageElement, action, 'pageInformation', pageInformation, 'forkFrom', forkFrom

  # detect when fork to local storage
  if wiki.useLocalStorage()
    if pageInformation.site == 'origin'
      action.site = forkFrom = location.host
      wiki.log 'local storage from origin', action, 'forkFrom', forkFrom
    if !pageFromLocalStorage(pageInformation.slug)?
      action.site = forkFrom = pageInformation.site
      wiki.log 'local storage first time', action, 'forkFrom', forkFrom

  # tweek action before saving
  action.date = (new Date()).getTime()
  delete action.site if action.site == 'origin'

  # update dom when forking
  if forkFrom
    # pull remote site closer to us
    pageElement.find('h1 img').attr('src', '/favicon.png')
    pageElement.find('h1 a').attr('href', '/')
    pageElement.data('site', null)
    state.setUrl()
    if action.type != 'fork'
      # bundle implicit fork with next action
      action.fork = forkFrom
      wiki.addToJournal pageElement.find('.journal'),
        type: 'fork'
        site: forkFrom
        date: action.date

  # store as appropriate
  if wiki.useLocalStorage() or pageInformation.site == 'local'
    pushToLocal(pageElement, pageInformation, action)
    pageElement.addClass("local")
  else
    pushToServer(pageElement, pageInformation, action)

