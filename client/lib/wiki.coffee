createSynopsis = require './synopsis.coffee'

wiki = { createSynopsis }

wiki.log = (things...) ->
  console.log things... if console?.log?

wiki.asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()


wiki.useLocalStorage = ->
  $(".login").length > 0

wiki.resolutionContext = []

wiki.resolveFrom = (addition, callback) ->
  wiki.resolutionContext.push addition
  try
    callback()
  finally
    wiki.resolutionContext.pop()

wiki.getData = (vis) ->
  if vis
    idx = $('.item').index(vis)
    who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').last()
    if who? then who.data('item').data else {}
  else
    who = $('.chart,.data,.calculator').last()
    if who? then who.data('item').data else {}

wiki.getDataNodes = (vis) ->
  if vis
    idx = $('.item').index(vis)
    who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').toArray().reverse()
    $(who)
  else
    who = $('.chart,.data,.calculator').toArray().reverse()
    $(who)

wiki.createPage = (name, loc) ->
  if loc and loc isnt 'view'
    $("<div/>").attr('id', name).attr('data-site', loc).addClass("page")
  else
    $("<div/>").attr('id', name).addClass("page")

wiki.getItem = (element) ->
  $(element).data("item") or $(element).data('staticItem') if $(element).length > 0

wiki.resolveLinks = (string) ->
  renderInternalLink = (match, name) ->
    # spaces become 'slugs', non-alpha-num get removed
    slug = wiki.asSlug name
    "<a class=\"internal\" href=\"/#{slug}.html\" data-page-name=\"#{slug}\" title=\"#{wiki.resolutionContext.join(' => ')}\">#{name}</a>"
  string
    .replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink)
    .replace(/\[(http.*?) (.*?)\]/gi, """<a class="external" target="_blank" href="$1" title="$1" rel="nofollow">$2 <img src="/images/external-link-ltr-icon.png"></a>""")

module.exports = wiki

