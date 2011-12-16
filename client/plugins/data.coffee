window.plugins.data =
  emit: (div, item) ->
    $('<p />').addClass('readout').appendTo(div).text("#{item.data.length}x#{item.columns.length}")
    $('<p />').html(wiki.resolveLinks(item.text||'data')).appendTo(div)
  bind: (div, item) ->
    div.find('p:first').mousemove (e) ->
      column = item.columns[Math.floor(item.columns.length * e.offsetX / e.target.offsetWidth)]
      $(e.target).siblings("p").last().html column
