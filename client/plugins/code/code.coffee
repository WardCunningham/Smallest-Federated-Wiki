class window.plugins.code
  load = (callback) ->
    wiki.getScript '/js/google-code-prettify/prettify.js', callback
    $('<style type="text/css"></style>')
      .html('@import url("/js/google-code-prettify/prettify.css")')
      .appendTo("head");
   
  @emit: (div, item) ->
    load -> div.append "<pre class='prettyprint'>#{prettyPrintOne(item.text)}</pre>"
  @bind: (div, item) ->
    load -> div.dblclick -> wiki.textEditor div, item

