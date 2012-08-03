util = require('./util.coffee')
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

plugin.do = wiki.doPlugin = (div, item) ->
  error = (ex) ->
    errorElement = $("<div />").addClass('error')
    errorElement.text(ex.toString())
    div.append(errorElement)

  div.data 'pageElement', div.parents(".page")
  div.data 'item', item
  plugin.get item.type, (script) ->
    try
      throw TypeError("Can't find plugin for '#{item.type}'") unless script?
      script.emit div, item
      script.bind div, item
    catch err
      error(err)

wiki.registerPlugin = (pluginName,pluginFn)->
  window.plugins[pluginName] = pluginFn($)


# PLUGINS for each story item type

window.plugins =
  paragraph:
    emit: (div, item) -> div.append "<p>#{wiki.resolveLinks(item.text)}</p>"
    bind: (div, item) ->
      div.dblclick -> wiki.textEditor div, item, null, true
  image:
    emit: (div, item) ->
      item.text ||= item.caption
      wiki.log 'image', item
      div.append "<img src=\"#{item.url}\"> <p>#{wiki.resolveLinks(item.text)}</p>"
    bind: (div, item) ->
      div.dblclick -> wiki.textEditor div, item
      div.find('img').dblclick -> wiki.dialog item.text, this
