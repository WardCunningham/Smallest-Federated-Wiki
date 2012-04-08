util = require('./util')

module.exports = (params) ->
  {buildPage, pageElement} = params
  slug = $(pageElement).attr('id')
  site = $(pageElement).data('site')

  fetch = (slug, callback, localContext) ->
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
          fetch(slug, callback, localContext)
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
    buildPage(null, site)
    pageElement.find('.item').each (i, each) ->
      div = $(each)
      item = getItem(div)
      wiki.getPlugin item.type, (plugin) ->
        plugin.bind div, item
  else
    if wiki.useLocalStorage() and json = localStorage[pageElement.attr("id")]
      pageElement.addClass("local")
      buildPage JSON.parse(json), site
    else
      if site?
        $.get "/remote/#{site}/#{slug}.json?random=#{util.randomBytes(4)}", "", (page) ->
          buildPage page, site
      else
        fetch slug, (page) ->
          if page?
            buildPage page, site
          else
            create slug, (page) ->
              buildPage page, site

