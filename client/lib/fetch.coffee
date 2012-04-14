util = require('./util')

probe = (pageElement, callback, localContext) ->
  slug = pageElement.attr('id')
  site = pageElement.data('site')
  if pageElement.attr('data-server-generated') == 'true'
    callback null
  if wiki.useLocalStorage() and json = localStorage[slug]
    pageElement.addClass("local")
    callback JSON.parse(json)
  probe.context = ['origin'] unless probe.context.length > 0
  localContext ?= (i for own i in probe.context)
  if typeof site is 'string'
    localContext = [site]
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
      callback(page)
    error: (xhr, type, msg) ->
      if localContext.length > 0
        probe pageElement, callback, localContext
      else
        site = null
        title = $("""a[href="/#{slug}.html"]""").html()
        title or= slug
        page = {title}
        wiki.putAction $(pageElement), {type: 'create', id: util.randomBytes(8), item: page}
        callback page

probe.context = []

module.exports = probe

