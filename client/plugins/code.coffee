window.plugins.code =
  emit: (div, item) -> div.append "<pre>#{item.text}</pre>"
  bind: (div, item) ->
    div.dblclick -> textEditor div, item