util = require('./util.coffee')
module.exports = plugin = {}

# TODO: Remove these methods from wiki object?
#

scripts = {}
getScript = wiki.getScript = (url, callback = () ->) ->
  if scripts[url]?
    callback()
  else
    $.getScript(url, ->
      scripts[url] = true
      callback()
    )

plugin.get = wiki.getPlugin = (name, callback) ->
  return callback(window.plugins[name]) if window.plugins[name]
  getScript "/plugins/#{name}.js", () ->
    callback(window.plugins[name])

plugin.do = wiki.doPlugin = (div, item) ->
  error = (ex) ->
    errorElement = $("<div />").addClass('error')
    errorElement.text(ex.toString())
    div.append(errorElement)

  try
    div.data 'pageElement', div.parents(".page")
    div.data 'item', item
    plugin.get item.type, (script) ->
      throw TypeError("Can't find plugin for '#{item.type}'") unless script?
      try
        script.emit div, item
        script.bind div, item
      catch err
        error(err)
  catch err
    error(err)

# PLUGINS for each story item type

window.plugins =
  paragraph:
    emit: (div, item) -> div.append "<p>#{wiki.resolveLinks(item.text)}</p>"
    bind: (div, item) ->
      div.dblclick -> wiki.textEditor div, item
  image:
    emit: (div, item) ->
      item.text ||= item.caption
      wiki.log 'image', item
      div.append "<img src=\"#{item.url}\"> <p>#{wiki.resolveLinks(item.text)}</p>"
    bind: (div, item) ->
      div.dblclick -> wiki.textEditor div, item
      div.find('img').dblclick -> wiki.dialog item.text, this
  chart:
    emit: (div, item) ->
      chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last())
      captionElement = $('<p />').html(wiki.resolveLinks(item.caption)).appendTo(div)
    bind: (div, item) ->
      div.find('p:first').mousemove (e) ->
        [time, sample] = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]
        $(e.target).text sample.toFixed(1)
        $(e.target).siblings("p").last().html util.formatTime(time)
      .dblclick ->
        wiki.dialog "JSON for #{item.caption}", $('<pre/>').text(JSON.stringify(item.data, null, 2))
  changes:
    emit: (div, item) ->
      div.append ul = $('<ul />').append if localStorage.length then $('<input type="button" value="discard all" />').css('margin-top','10px') else $('<p>empty</p>')
      for i in [0...localStorage.length]
        key = localStorage.key(i)
        a = $('<a class="internal" href="#" />').append(key).data('pageName', key)
        ul.prepend($('<li />').append(a))
    bind: (div, item) ->
      div.find('input').click ->
        localStorage.clear()
        div.find('li').remove()

