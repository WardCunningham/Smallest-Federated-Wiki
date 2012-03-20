window.plugins.data =
  emit: (div, item) ->
    $('<p />').addClass('readout').appendTo(div).text(summary(item))
    $('<p />').html(wiki.resolveLinks(item.text||'data')).appendTo(div)
  bind: (div, item) ->
    div.find('p:first').mousemove (e) ->
      thumb = thumbs(item)[Math.floor(thumbs(item).length * e.offsetX / e.target.offsetWidth)]
      $(e.target).siblings("p").last().html thumb
      $(e.target).text(readout(item.data[thumb])) if item.data.object?
      $(div).triggerHandler('thumb', thumb)

summary = (item) ->
  return "#{item.data.length}x#{item.columns.length}" if item.columns?
  return "#{item.data.nodes.length}/#{item.data.links.length}" if item.data? && item.data.nodes? && item.data.links?
  return "1x#{thumbs(item).length}"
  "data"

readout = (field) ->
  return "#{field.value}" if field.value?
  return "#{field.toFixed 2}" if field.constructor == Number
  "data"

thumbs = (item) ->
  return item.columns if item.columns?
  (key for own key of item.data)

