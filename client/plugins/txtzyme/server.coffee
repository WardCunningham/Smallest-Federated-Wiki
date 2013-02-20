WebSocketServer = require('ws').Server
fs = require 'fs'
tz = null

sock = null

txtzymeDevice = (done) ->
	result = null
	fs.readdir '/dev', (err, files) ->
		done err if err
		for file in files
			result = file if file.match /^ttyACM/
			result = file if file.match /^cu.usbmodem1234/
		return done null, "/dev/#{result}" if result
		done "can't find txtzyme device"

startServer = (params) ->

	console.log 'txtzyme startServer', (k for k,v of params)
	txtzymeDevice (err, fn) ->
		return console.log err if err
		fs.open fn, 'r+', (err, fd) ->
			return console.log 'txtzyme open error: ', err if err
			tz = {fd, fn}
			console.log tz

			readbuf = new Buffer 128
			copybuf = new Buffer 128
			read = (remains) ->
				fs.read tz.fd, readbuf, remains, readbuf.length-remains, null, (err, bytesRead, buffer) ->
					return console.log 'txtzyme read err ', err if err
					have = bytesRead + remains
					for i in [have-1..0]
						if buffer[i] is 10
							take = buffer.toString 'ascii', 0, (tail = i+1)
							if sock
								sock.send take, (err) ->
									return console.log 'txtzyme send err', err if err
							# console.log take
							remains = have - tail
							if remains
								buffer.copy copybuf, 0, tail, have
								copybuf.copy readbuf, 0, 0, remains
							return read remains
					read have

			read 0


	server = new WebSocketServer({server: params.server, path: '/plugin/txtzyme'})

	server.on 'connection', (socket) ->
		console.log 'connection established, listening'
		sock = socket

		socket.on 'message', (message) ->
			buf = new Buffer "#{message}\n", 'utf8'
			return unless tz?
			fs.write tz.fd, buf, 0, buf.length, -1, (err, written, buffer) ->
				console.log 'txtzyme write error: ', err if err
				fs.fsync tz.fd


		# ws.send JSON.stringify(linkmap, null, 2), (err) ->
		# 	console.log 'unable to send ws message:', err if err

module.exports = {startServer}
