shape = (data) ->
  data.toString()

window.plugins.data =
  emit: (div, item) ->
    $("<p>#{shape(item.data)}</p>").appendTo(div)
  bind: (div, item) ->

