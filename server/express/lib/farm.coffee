# **farm.coffee *
# The farm module works by putting a bouncy host based proxy
# in front of servers that it creates

path = require 'path'
bouncy = require 'bouncy'
server = require '../'

module.exports = exports = (argv) ->
  hosts = {}
  runningServers = []

  nextport = do ->
    port = argv.F - 1
    -> port += 1

  bouncy( (req, bounce) ->
    unless req.headers?.host
      return
    if req.headers.host[0..3] is "www."
      req.headers.host = req.headers.host[4..]
    if hosts[req.headers.host]
      bounce(hosts[req.headers.host])
    else
      hosts[req.headers.host] = nextport()
      newargv = {}
      for key, value of argv
        newargv[key] = value
      newargv.p = hosts[req.headers.host]
      newargv.d = if argv.d
        path.join(argv.d, req.headers.host)
      else
        path.join(argv.r or path.join(__dirname, '..', '..', '..'), 'data', req.headers.host)
      newargv.u = "http://#{req.headers.host}"
      local = server(newargv)
      runningServers.push(local)
      local.once "ready", ->
        bounce(hosts[req.headers.host])
  ).listen(argv.p)
