# txtzyme device uses teensy's usb serial
# http://www.pjrc.com/teensy/usb_serial.html 

WebSocketServer = require('ws').Server
fs = require 'fs'
es = require 'event-stream'

delay = (done) -> setTimeout done, 1000

txtzymeDevice = (done) ->
    result = null
    if process.platform == "win32"
        return done "on windows..." # find com port?
    fs.readdir '/dev', (err, files) ->
        done err if err
        for file in files
            result = file if file.match /^ttyACM/
            result = file if file.match /^cu.usbmodem1234/
        return done null, "/dev/#{result}" if result
        done "can't find txtzyme device"

startServer = (params) ->
	console.log "startServer"
	txtzymeDevice (err, fn) ->
		if err
			console.log err
			delay -> startServer params
			return

		toDevice = fs.createWriteStream fn
		toDevice.on 'error', (err) ->
			console.log "trouble writing txtzyme to #{fn}, err #{err}"
			server.close()
			toDevice.end()
			delay -> startServer params

		rawDevice = fs.createReadStream(fn)
		rawDevice.on 'error', (err) ->
			console.log "trouble reading txtzyme from #{fn}"
		fromDevice = rawDevice.pipe(es.split())

		server = new WebSocketServer({server: params.server, path: '/plugin/txtzyme'})
		server.on 'connection', (socket) ->
			console.log 'connection established, listening'

			fromDevice.on 'data', uplink = (line) ->
				socket.send line, (err) ->
					return console.log 'txtzyme send err', err if err

			socket.on 'message', downlink = (message) ->
				toDevice.write(message)

			socket.on 'close', (code, message) ->
				console.log "txtzyme socket closed, #{code} #{message}"
				fromDevice.removeListener 'data', uplink

module.exports = {startServer}
