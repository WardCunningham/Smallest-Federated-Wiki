util = require('./util.coffee')
state = require('./state.coffee')
revision = require('./revision.coffee')
addToJournal = require('./addToJournal.coffee')

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
        return whenNotGotten()
    else
      if site == 'origin'
        url = "/#{slug}.json"
      else
        url = "http://#{site}/#{slug}.json"
  else
    url = "/#{slug}.json"

  $.ajax
    type: 'GET'
    dataType: 'json'
    url: url + "?random=#{util.randomBytes(4)}"
    success: (page) ->
      page = revision.create rev, page if rev
      return whenGotten(page,site)
    error: (xhr, type, msg) ->
      if (xhr.status != 404) and (xhr.status != 0)
        wiki.log 'pageHandler.get error', xhr, xhr.status, type, msg
        report =
          'title': "#{xhr.status} #{msg}"
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

pushToLocal = (pageElement, pagePutInfo, action) ->
  page = pageFromLocalStorage pagePutInfo.slug
  page = {title: action.item.title} if action.type == 'create'
  page ||= pageElement.data("data")
  page.journal = [] unless page.journal?
  if (site=action['fork'])?
    page.journal = page.journal.concat({'type':'fork','site':site})
    delete action['fork']
  page.journal = page.journal.concat(action)
  page.story = $(pageElement).find(".item").map(-> $(@).data("item")).get()
  localStorage[pagePutInfo.slug] = JSON.stringify(page)
  addToJournal pageElement.find('.journal'), action

pushToServer = (pageElement, pagePutInfo, action) ->
  $.ajax
    type: 'PUT'
    url: "/page/#{pagePutInfo.slug}/action"
    data:
      'action': JSON.stringify(action)
    success: () ->
      addToJournal pageElement.find('.journal'), action
      if action.type == 'fork' # push
        localStorage.removeItem pageElement.attr('id')
        state.setUrl
    error: (xhr, type, msg) ->
      wiki.log "pageHandler.put ajax error callback", type, msg

pageHandler.put = (pageElement, action) ->

  checkedSite = () ->
    switch site = pageElement.data('site')
      when 'origin', 'local', 'view' then null
      when location.host then null
      else site

  # about the page we have
  pagePutInfo = {
    slug: pageElement.attr('id').split('_rev')[0]
    rev: pageElement.attr('id').split('_rev')[1]
    site: checkedSite()
    local: pageElement.hasClass('local')
  }
  forkFrom = pagePutInfo.site
  wiki.log 'pageHandler.put', action, pagePutInfo

  # detect when fork to local storage
  if wiki.useLocalStorage()
    if pagePutInfo.site?
      wiki.log 'remote => local'
    else if !pagePutInfo.local
      wiki.log 'origin => local'
      action.site = forkFrom = location.host
    # else if !pageFromLocalStorage(pagePutInfo.slug)
    #   wiki.log ''
    #   action.site = forkFrom = pagePutInfo.site
    #   wiki.log 'local storage first time', action, 'forkFrom', forkFrom

  # tweek action before saving
  action.date = (new Date()).getTime()
  delete action.site if action.site == 'origin'

  # update dom when forking
  if forkFrom
    # pull remote site closer to us
    pageElement.find('h1 img').attr('src', '/favicon.png')
    pageElement.find('h1 a').attr('href', '/')
    pageElement.data('site', null)
    pageElement.removeClass('remote')
    state.setUrl()
    if action.type != 'fork'
      # bundle implicit fork with next action
      action.fork = forkFrom
      addToJournal pageElement.find('.journal'),
        type: 'fork'
        site: forkFrom
        date: action.date

  # store as appropriate
  if wiki.useLocalStorage() or pagePutInfo.site == 'local'
    pushToLocal(pageElement, pagePutInfo, action)
    pageElement.addClass("local")
  else
    pushToServer(pageElement, pagePutInfo, action)

