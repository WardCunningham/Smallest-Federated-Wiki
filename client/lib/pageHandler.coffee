util = require('./util')
state = require('./state')
revision = require('./revision')

module.exports = pageHandler = {}

pageHandler.get = (pageElement, callback, localContext) ->
  [slug, rev] = pageElement.attr('id').split('_rev')
  site = pageElement.data('site')
  if pageElement.attr('data-server-generated') == 'true'
    return callback null
  if wiki.useLocalStorage() and json = localStorage[slug]
    pageElement.addClass("local")
    return callback JSON.parse(json)
  pageHandler.context = ['origin'] unless pageHandler.context.length > 0
  if site
    localContext = []
  else
    localContext ?= (i for own i in pageHandler.context)
    site = localContext.shift()
  resource = if site=='origin'
    site = null
    slug
  else
    "remote/#{site}/#{slug}"

  $.ajax
    type: 'GET'
    dataType: 'json'
    url: "/#{resource}.json?random=#{util.randomBytes(4)}"
    success: (page) ->
      wiki.log 'fetch success', page, site || 'origin'
      $(pageElement).data('site', site)
      page = revision.create rev, page if rev
      return callback(page)
    error: (xhr, type, msg) ->
      if localContext.length > 0
        pageHandler.get pageElement, callback, localContext
      else
        site = null
        title = $("""a[href="/#{slug}.html"]""").html()
        title or= slug
        pageHandler.put $(pageElement), {type: 'create', id: util.randomBytes(8), item: {title}}
        callback {title}

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

