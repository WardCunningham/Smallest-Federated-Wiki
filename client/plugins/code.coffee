window.plugins.code =
  emit: (div, item) -> div.append "<pre class='prettyprint'>#{prettyPrintOne(item.text)}</pre>"
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item