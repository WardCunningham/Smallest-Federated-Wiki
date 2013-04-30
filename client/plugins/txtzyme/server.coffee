# txtzyme device uses teensy's usb serial
# http://www.pjrc.com/teensy/usb_serial.html 

WebSocketServer = require('ws').Server
fs = require 'fs'
es = require 'event-stream'
domain = require 'domain'

delay = (done) ->
	# setTimeout done, 1000

txtzymeDevice = (done) ->
    result = null
    if process.platform == "win32"
        return done new Error "on windows..." # find com port?
    fs.readdir '/dev', (err, files) ->
        done err if err
        for file in files
            result = file if file.match /^ttyACM/
            result = file if file.match /^cu.usbmodem1234/
        return done null, "/dev/#{result}" if result
        done new Error "can't find txtzyme device"

waiting = false
startServer = (params) ->
	console.log "startServer"
	d = domain.create()
	d.on 'error', (err) ->
		server.close()
		d.dispose()
		console.log err
		unless waiting
			waiting = true
			delay ->
				waiting = false
				startServer params

	server = new WebSocketServer({server: params.server, path: '/plugin/txtzyme'})
	d.add server

	txtzymeDevice d.intercept (fn) ->

		toDevice = fs.createWriteStream fn
		fromDevice = fs.createReadStream(fn).pipe(es.split())
		d.add toDevice
		d.add fromDevice

		server.on 'connection', (socket) ->
			console.log 'connection established, listening'
			d.add socket

			fromDevice.on 'data', uplink = (line) ->
				socket.send line, (err) ->
					return console.log 'txtzyme send err', err if err

			socket.on 'message', (message) ->
				toDevice.write(message)

			socket.on 'close', (code, message) ->
				console.log "txtzyme socket closed, #{code} #{message}"
				fromDevice.removeListener 'data', uplink

module.exports = {startServer}
