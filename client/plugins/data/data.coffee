# lots of cases, ward will try these
# http://nmsi.localhost:1111/view/cotton-in-the-field/view/tier-1-material-summary/cotton.localhost:1111/talk-about-wool/view/cotton-fabric

window.plugins.data =
  emit: (div, item) ->
    $('<p />').addClass('readout').appendTo(div).text(summary(item))
    $('<p />').html(wiki.resolveLinks(item.text||'data')).appendTo(div)
  bind: (div, item) ->
    lastThumb = null
    div.find('p:first')
      .mousemove (e) ->
        thumb = thumbs(item)[Math.floor(thumbs(item).length * e.offsetX / e.target.offsetWidth)]
        return if thumb == lastThumb || null == (lastThumb = thumb)
        $(e.target).siblings("p").last().html label(thumb)
        $(e.target).text(readout(thumb))
        $(div).triggerHandler('thumb', thumb)
      .dblclick (e) ->
        wiki.dialog "JSON for #{item.text}",  $('<pre/>').text(JSON.stringify(item, null, 2))
    div.find('p:last')
      .dblclick ->
        wiki.textEditor div, item

    value = (obj) ->
      return NaN unless obj?
      switch obj.constructor
        when Number then obj
        when String then +obj
        when Array then value(obj[0])
        when Object then value(obj.value)
        when Function then obj()
        else NaN

    average = (thumb) ->
      values = _.map(item.data, (obj) -> value(obj[thumb]))
      values = _.reject(values, (obj) -> isNaN obj)
      result = _.reduce(values, ((m,n) -> m+n), 0) / values.length
      if values.length > 1 then result.toFixed 2 else result

    readout = (thumb) ->
      return average(thumb) if item.columns?
      return summary(item) unless item.data.object?
      field = item.data[thumb]
      return "#{field.value}" if field.value?
      return "#{field.toFixed 2}" if field.constructor == Number
      NaN

    label = (thumb) ->
      return "Averaged:<br>#{thumb}" if item.columns? && item.data.length > 1
      thumb


summary = (item) ->
  return "#{item.data.length}x#{item.columns.length}" if item.columns?
  return "#{item.data.nodes.length}/#{item.data.links.length}" if item.data? && item.data.nodes? && item.data.links?
  return "1x#{thumbs(item).length}"
  "data"

thumbs = (item) ->
  return item.columns if item.columns?
  (key for own key of item.data)
