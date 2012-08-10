util = require('./util')
state = require('./state')
revision = require('./revision')

module.exports = pageHandler = {}

simpleGet = (site,slug,errback,callback)->
  if site?
    resource = "remote/#{site}/#{slug}"
  else
    resource = slug
  $.ajax
    type: 'GET'
    dataType: 'json'
    url: "/#{resource}.json?random=#{util.randomBytes(4)}"
    success: (page) ->
      callback(page)
    error: (xhr, type, msg) ->
      errback()

pageFromLocalStorage = (slug)->
  if wiki.useLocalStorage() and json = localStorage[slug]
    JSON.parse(json)
  else
    undefined

createNewPageBasedOnSlug = (slug,pageElement)->
  title = $("""a[href="/#{slug}.html"]""").html()
  title or= slug
  pageHandler.put $(pageElement), {type: 'create', id: util.randomBytes(8), item: {title}}
  {title}

recursiveGet = (params, pageElement, callback, localContext) ->
  {slug,rev,site} = params

  if site
    localContext = []
  else
    site = localContext.shift()

  site = null if site=='origin'


  simpleGet site, slug,
    ->
      if localContext.length > 0
        recursiveGet( params, pageElement, callback, localContext )
      else
        page = createNewPageBasedOnSlug(slug,pageElement)
        callback(page)
    (page)->
      wiki.log 'fetch success', page, site || 'origin'
      page = revision.create rev, page if rev
      return callback(page,site)

fullGet = (pageElement, callback, localContext) ->
  [slug, rev] = pageElement.attr('id').split('_rev')
  pageInformation = {
    slug: slug
    rev: rev
    site: pageElement.data('site')
    wasServerGenerated: pageElement.attr('data-server-generated') == 'true'
  }
  wiki.log( 'pageInformation', pageInformation )

  if pageInformation.wasServerGenerated
    return callback null

  if localPage = pageFromLocalStorage(slug)
    return callback localPage, 'local'

  pageHandler.context = ['origin'] unless pageHandler.context.length > 0

  localContext = _.clone(pageHandler.context)
  recursiveGet( pageInformation, pageElement, callback, localContext )


pageHandler.get = fullGet


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

