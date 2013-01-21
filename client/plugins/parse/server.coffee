# parse semi-structured text under client-side control

WebSocketServer = require('ws').Server

startServer = (params) ->
	console.log 'parse startServer', (k for k,v of params)
	socket = new WebSocketServer({server: params.server, path: '/plugin/parse'})

	socket.on 'connection', (ws) ->
		do (count=10) ->
			ws.on 'message', (message) ->
				console.log 'parse client says:', message

			tick = ->
				message = """{"action": "tick", "count": #{count++}}"""
				console.log message
				ws.send message, (err) ->
					if err
						console.log 'unable to send ws message:', err
					else if count <= 100
						setTimeout tick, 1000
					else
						ws.close()

			console.log 'start ticking'
			tick()

module.exports = {startServer}

