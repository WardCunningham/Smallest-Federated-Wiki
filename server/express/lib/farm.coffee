# farm.coffee

path = require 'path'
server = require '../'
bouncy = require 'bouncy'

module.exports = exports = (argv) ->
  hosts = {}
  
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
      server(newargv)
      bounce(hosts[req.headers.host])
  ).listen(argv.p)

# Create an instance of server using command line arguments and defaults.
