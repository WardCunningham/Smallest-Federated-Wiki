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
    if hosts[req.headers.host]
      bounce(hosts[req.headers.host])
    else
      hosts[req.headers.host] = nextport()
      newargv = {}
      for key, value of argv
        newargv[key] = value
      newargv.p = hosts[req.headers.host]
      newargv.d = path.join(argv.r or path.join(__dirname, '..', '..', '..'), 'data', req.headers.host)
      newargv.u = "http://#{req.headers.host}"
      runningServers.push(server(newargv))
      bounce(hosts[req.headers.host])
  ).listen(argv.p)
