util = require('./util')

module.exports = (params) ->
  {buildPage, putAction, pageElement} = params
  slug = $(pageElement).attr('id')
  site = $(pageElement).data('site')

  probe = (slug, callback, localContext) ->
    wiki.fetchContext = ['origin'] unless wiki.fetchContext.length > 0
    localContext ?= (i for own i in wiki.fetchContext)
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
          probe slug, callback, localContext
        else
          site = null
          callback(null)

  create = (slug, callback) ->
    title = $("""a[href="/#{slug}.html"]""").html()
    title or= slug
    page = {title}
    putAction $(pageElement), {type: 'create', id: util.randomBytes(8), item: page}
    callback page

  if $(pageElement).attr('data-server-generated') == 'true'
    buildPage null
  else
    if wiki.useLocalStorage() and json = localStorage[pageElement.attr("id")]
      pageElement.addClass("local")
      buildPage JSON.parse(json)
    else
      if site?
        $.get "/remote/#{site}/#{slug}.json?random=#{util.randomBytes(4)}", "", (page) ->
          buildPage page
      else
        probe slug, (page) ->
          if page?
            buildPage page
          else
            create slug, (page) ->
              buildPage page
