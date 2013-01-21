# parse semi-structured text under client-side control

WebSocketServer = require('ws').Server
fs = require 'fs'


readTally = (path, done) ->
	fs.readFile path, 'utf8', (err, data) ->
		return console.log err if err
		tally = {}
		for line in data.split /\n/
			if p = line.match /"(.+?)" -> "(.+?)"/
				if q = line.match /label = "(\d+)"/
					tally["#{p[1]}->#{p[2]}"] = +q[1]
		done tally

startServer = (params) ->
	console.log 'parse startServer', (k for k,v of params)
	socket = new WebSocketServer({server: params.server, path: '/plugin/parse'})

	socket.on 'connection', (ws) ->
		do (count=10) ->
			ws.on 'message', (message) ->
				console.log 'parse client says:', message

			tick = ->
				path = "#{params.argv.c}/plugins/parse/runs/1234/tally.dot"
				readTally path, (tally) ->
					message = JSON.stringify {action: 'tick', count: count++, tally}, null, 2
					console.log message
					ws.send message, (err) ->
						if err
							console.log 'unable to send ws message:', err
						else if count <= 4*60
							setTimeout tick, 1000
						else
							ws.close()

			console.log 'start ticking'
			tick()

module.exports = {startServer}

