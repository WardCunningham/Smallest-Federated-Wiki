# support server-side plugins

fs = require 'fs'
path = require 'path'

module.exports = exports = (argv) ->

	pluginsdir = path.join argv.c, 'plugins'
	plugins = {}

	# http://stackoverflow.com/questions/10914751/loading-node-js-modules-dynamically-based-on-route

	startServer = (params, plugin) ->
		server = "#{pluginsdir}/#{plugin}/server.js"
		fs.exists server, (exists) ->
			if exists
				console.log 'starting plugin', plugin
				try
					plugins[plugin] = require server
					plugins[plugin].startServer?(params)
				catch e
					console.log 'failed to start plugin', plugin, e?.stack or e

	startServers = (params) ->
		fs.readdir pluginsdir , (e, plugins) ->
			startServer params, plugin for plugin in plugins

	{startServers}