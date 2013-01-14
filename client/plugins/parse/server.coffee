# parse semi-structured text under client-side control

WebSocketServer = require('ws').Server

startServer = (params) ->
	console.log 'parse startServer', (k for k,v of params)
	socket = new WebSocketServer({server: params.server, path: '/plugin/parse'})

	socket.on 'connection', (ws) ->

    ws.on 'message', (message) ->
      console.log 'parse client says:', message
      ws.send message, (err) ->
        console.log 'unable to send ws message:', err if err

module.exports = {startServer}

