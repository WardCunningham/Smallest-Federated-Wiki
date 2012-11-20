escape = (str) ->
	String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')

class window.plugins.code
  load = (callback) ->
    wiki.getScript '/plugins/code/prettify.js', callback
    $('<style type="text/css"></style>')
      .html('@import url("/plugins/code/prettify.css")')
      .appendTo("head");

  @emit: (div, item) ->
    load -> div.append "<pre class='prettyprint'>#{prettyPrintOne(escape(item.text))}</pre>"
  @bind: (div, item) ->
    load -> div.dblclick -> wiki.textEditor div, item

