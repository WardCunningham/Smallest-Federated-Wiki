
emit = ($item, item) ->
	$item.append """<p>Hello Linkmap</p>"""

bind = ($item, item) ->

	socket = new WebSocket('ws://'+window.document.location.host+'/plugin/linkmap')

	progress = (m) ->
	  wiki.log 'linkmap', m

	socket.onopen = ->
	  progress "opened"

	socket.onmessage = (e) ->
	  progress e.data
	  socket.close()

	socket.onclose = ->
	  progress "closed"


window.plugins.linkmap = {emit, bind}