WebSocketServer = require('ws').Server
fs = require 'fs'

linkmap = {}

asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

fetchPage = (path, done) ->
  text = fs.readFile path, 'utf8', (err, text) ->
    return console.log ['linkmap fetchPage error', path, err] if err
    done JSON.parse text

findLinks = (page) ->
	unique = {}
	for item in page.story || []
		links = switch item?.type
			when 'paragraph' then item.text.match /\[\[([^\]]+)\]\]/g
		if links
			for link in links
				[match, title] = link.match /\[\[([^\]]+)\]\]/
				unique[asSlug title] = title
	slug for slug, title of unique

buildmap = (pages) ->
	fs.readdir pages, (err, names) ->
		return if err or !names?.length
		for slug in names
			if slug.match /^[a-z0-9-]+$/
				do (slug) ->
					fetchPage "#{pages}/#{slug}", (page) ->
						linkmap[slug] = findLinks page
	

startServer = (params) ->
	console.log 'linkmap startServer', (k for k,v of params)

	buildmap params.argv.db

	socket = new WebSocketServer({server: params.server, path: '/plugin/linkmap'})
	socket.on 'connection', (ws) ->
		console.log 'connection established, ready to send'
		ws.send JSON.stringify(linkmap, null, 2), (err) ->
			console.log 'unable to send ws message:', err if err

module.exports = {startServer}
