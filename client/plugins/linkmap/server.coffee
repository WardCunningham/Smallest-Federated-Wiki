WebSocketServer = require('ws').Server

buildmap = (done) ->
	done {nodes:[], links:[]}
	

startServer = (params) ->
	console.log 'linkmap startServer', (k for k,v of params)

	linkmap = "{}"
	buildmap (map) ->
		linkmap = JSON.stringify(map, null, 2)
		console.log 'linkmap buildmap', linkmap

	socket = new WebSocketServer({server: params.server, path: '/plugin/linkmap'})
	socket.on 'connection', (ws) ->
		console.log 'connection established, ready to send'
		ws.send linkmap, (err) ->
      console.log 'unable to send ws message:', err if err

  # ws.on 'message', (message) ->
  #   console.log 'linkmap client says:', message
  #   ws.send message, (err) ->
  #     console.log 'linkmap unable to send ws message:', err if err

module.exports = {startServer}
