WebSocketServer = require('ws').Server
fs = require 'fs'
child = require 'child_process'

fetchPage = (path, done) ->
  text = fs.readFile path, 'utf8', (err, text) ->
    return console.log ['twadio fetchPage error', path, err] if err
    done JSON.parse text

status = {pid: null, freq: 14.042, mode: null}
radio = null

startRadio = (message) ->
	radio = child.spawn '/usr/bin/ruby', [__dirname+'/twadio.rb', status.mode, status.freq, '0', '1', '.5', message]
	status.pid = radio.pid
	console.log "twadio start", radio.pid

	radio.on 'exit', (code, signal) ->
		console.log 'twadio exit', code, signal
		status.mode = null
		status.pid = null
		radio.emit 'update'

startServer = (params) ->

	console.log 'twadio startServer', (k for k,v of params)
	server = new WebSocketServer({server: params.server, path: '/plugin/twadio'})

	server.on 'connection', (socket) ->
		console.log 'connection established, listening'

		update = ->
			socket.send JSON.stringify(status, null, 2), (err) ->
				console.log 'twadio send err:', err if err
		update()

		socket.on 'message', (message) ->
			console.log 'twadio message:', message
			action = JSON.parse message
			switch action.action
				when 'stop'
					status.mode = null
					radio.kill 'SIGTERM'
				when 'send'
					status.mode = 'send'
					startRadio "the quick brown fox jumped over the lazy dogs back"
					radio.once 'update', -> update()
				when 'tune'
					status.mode = 'tune'
					startRadio "30"
					radio.once 'update', -> update()
			update()

module.exports = {startServer}
