util = require('./util.coffee')
wiki = require './wiki.coffee'

module.exports = plugin = {}

# TODO: Remove these methods from wiki object?
#

scripts = {}
getScript = wiki.getScript = (url, callback = () ->) ->
  if scripts[url]?
    callback()
  else
    $.getScript(url)
      .done ->
        scripts[url] = true
        callback()
      .fail ->
        callback()

plugin.get = wiki.getPlugin = (name, callback) ->
  return callback(window.plugins[name]) if window.plugins[name]
  getScript "/plugins/#{name}/#{name}.js", () ->
    return callback(window.plugins[name]) if window.plugins[name]
    getScript "/plugins/#{name}.js", () ->
      callback(window.plugins[name])

plugin.do = wiki.doPlugin = (div, item, done=->) ->
  error = (ex) ->
    errorElement = $("<div />").addClass('error')
    errorElement.text(ex.toString())
    div.append(errorElement)

  div.data 'pageElement', div.parents(".page")
  div.data 'item', item
  plugin.get item.type, (script) ->
    try
      throw TypeError("Can't find plugin for '#{item.type}'") unless script?
      if script.emit.length > 2
        script.emit div, item, ->
          script.bind div, item
          done()
      else
        script.emit div, item
        script.bind div, item
        done()
    catch err
      wiki.log 'plugin error', err
      error(err)
      done()

wiki.registerPlugin = (pluginName,pluginFn)->
  window.plugins[pluginName] = pluginFn($)


# PLUGINS for each story item type

window.plugins =
  paragraph:
    emit: (div, item) ->
      for text in item.text.split /\n\n+/
        div.append "<p>#{wiki.resolveLinks(text)}</p>" if text.match /\S/
    bind: (div, item) ->
      div.dblclick -> wiki.textEditor div, item, null, true
  image:
    emit: (div, item) ->
      item.text ||= item.caption
      div.append "<img class=thumbnail src=\"#{item.url}\"> <p>#{wiki.resolveLinks(item.text)}</p>"
    bind: (div, item) ->
      div.dblclick -> wiki.textEditor div, item
      div.find('img').dblclick -> wiki.dialog item.text, this
  future:
    emit: (div, item) ->
      div.append """#{item.text}<br><br><button class="create">create</button> new blank page"""
      if (info = wiki.neighborhood[location.host])? and info.sitemap?
        for item in info.sitemap
          if item.slug.match /-template$/
            div.append """<br><button class="create" data-slug=#{item.slug}>create</button> from #{wiki.resolveLinks "[[#{item.title}]]"}"""
    bind: (div, item) ->
