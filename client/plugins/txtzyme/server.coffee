# txtzyme device uses teensy's usb serial
# http://www.pjrc.com/teensy/usb_serial.html 

WebSocketServer = require('ws').Server
fs = require 'fs'
es = require 'event-stream'

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

	server = new WebSocketServer({server: params.server, path: '/plugin/txtzyme'})

	txtzymeDevice (err, fn) ->
		return console.log err if err

		toDevice = fs.createWriteStream fn
		toDevice.on 'error', (err) ->
			console.log "trouble writing txtzyme to #{fn}"

		rawDevice = fs.createReadStream(fn)
		rawDevice.on 'error', (err) ->
			console.log "trouble reading txtzyme from #{fn}"
		fromDevice = rawDevice.pipe(es.split())

		server.on 'connection', (socket) ->
			console.log 'connection established, listening'

			fromDevice.on 'data', (line) ->
				socket.send line, (err) ->
					return console.log 'txtzyme send err', err if err

			socket.on 'message', (message) ->
				toDevice.write(message)

module.exports = {startServer}
