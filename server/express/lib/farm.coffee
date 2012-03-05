# **farm.coffee**
# The farm module works by putting a bouncy host based proxy
# in front of servers that it creates

path = require 'path'
bouncy = require 'bouncy'
server = require '../'

module.exports = exports = (argv) ->
  # Map incoming hosts to their wiki's port
  hosts = {}
  # Keep an array of servers that are currently active
  runningServers = []

  # Get the next available port.
  nextport = do ->
    # Start port as farm port -1 so it returns the original farm
    # port the first time it is used.
    # TODO: Call out to the os to make sure we return an open and valid port.
    port = argv.F - 1
    -> port += 1

  # Bouncy watches for incoming requests on the listen port at the bottom,
  # and passes them to the callback it's called with,
  # redirecting the requests at the port specified when
  # the bounce function is called.
  bouncy( (req, bounce) ->
    # Don't do anything for requests without a host header.
    unless req.headers?.host
      return
    # If the host starts with "www." treat it the same as if it didn't
    if req.headers.host[0..3] is "www."
      req.headers.host = req.headers.host[4..]
    # if we already have a port for this host, forward the request to it.
    if hosts[req.headers.host]
      bounce(hosts[req.headers.host])
    else
      hosts[req.headers.host] = nextport()
      # Create a new options object, copy over the options used to start the
      # farm, and modify them to make sense for servers spawned from the farm.
      newargv = {}
      for key, value of argv
        newargv[key] = value
      newargv.p = hosts[req.headers.host]
      newargv.d = if argv.d
        path.join(argv.d, req.headers.host)
      else
        path.join(argv.r or path.join(__dirname, '..', '..', '..'), 'data', req.headers.host)
      newargv.u = "http://#{req.headers.host}"
      # Create a new server, add it to the list of servers, and
      # once it's ready send the request to it.
      local = server(newargv)
      runningServers.push(local)
      local.once "ready", ->
        bounce(hosts[req.headers.host])
  ).listen(argv.p)
