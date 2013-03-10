WebSocketServer = require('ws').Server
fs = require 'fs'
child = require 'child_process'
events = require 'events'

fetchPage = (path, done) ->
  text = fs.readFile path, 'utf8', (err, text) ->
    return console.log ['twadio fetchPage error', path, err] if err
    done JSON.parse text

status = {pid: null, freq: 14.042, mode: null}
radio = new events.EventEmitter()

job = null

stopJob = ->
	job.kill 'SIGTERM' if job

startJob = (text) ->
	job = child.spawn '/usr/bin/ruby', [__dirname+'/twadio.rb', status.mode, status.freq, '0', '1', '.5', text]
	status.pid = job.pid
	console.log "twadio start", job.pid
	radio.emit 'update'

	job.on 'exit', (code, signal) ->
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

		radio.on 'update', update
		socket.on 'close', -> radio.removeListener 'update', update

		socket.on 'message', (message) ->
			console.log 'twadio message:', message
			action = JSON.parse message
			switch action.action
				when 'stop'
					stopJob()
				when 'send'
					status.mode = 'send'
					startJob action.text
				when 'tune'
					status.mode = 'tune'
					startJob "30"

module.exports = {startServer}
