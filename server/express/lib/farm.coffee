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
    # If the incoming request has a host, asign it to incHost
    # otherwise do nothing and return.
    if req.headers?.host
      incHost = req.headers.host
    else
      return
    # If the host starts with "www." treat it the same as if it didn't
    if incHost[0..3] is "www."
      incHost = incHost[4..]
    # if we already have a port for this host, forward the request to it.
    if hosts[incHost]
      bounce(hosts[incHost])
    else
      hosts[incHost] = nextport()
      # Create a new options object, copy over the options used to start the
      # farm, and modify them to make sense for servers spawned from the farm.
      newargv = {}
      for key, value of argv
        newargv[key] = value
      newargv.p = hosts[incHost]
      newargv.d = if argv.d
        path.join(argv.d, incHost)
      else
        path.join(argv.r or path.join(__dirname, '..', '..', '..'), 'data', incHost)
      newargv.u = "http://#{incHost}"
      # Create a new server, add it to the list of servers, and
      # once it's ready send the request to it.
      local = server(newargv)
      runningServers.push(local)
      local.once "listening", ->
        bounce(hosts[incHost])
  ).listen(argv.p)
