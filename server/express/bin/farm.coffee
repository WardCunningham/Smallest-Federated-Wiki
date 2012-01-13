#!/usr/bin/env coffee
# server
# cli for the Smallest-Federated-Wiki express server

path = require 'path'
optimist = require 'optimist'
server = require '../'
bouncy = require 'bouncy'


# Handle command line options

argv = optimist
  .usage('Usage: $0')
  .options('d',
    alias     : 'data'
    default   : ''
    describe  : 'location of flat file data'
  )
  .options('h',
    alias     : 'help'
    boolean   : true
    describe  : 'Show this help info and exit'
  )
  .options('o',
    alias     : 'host'
    default   : ''
    describe  : 'Host to accept connections on, falsy == any'
  )
  .options('u',
    alias     : 'url'
    default   : ''
    describe  : 'Url to be used for the realm in openID'
  )
  .options('p',
    alias     : 'port'
    default   : 40000
    describe  : 'Port'
  )
  .options('r',
    alias     : 'root'
    default   : path.join(__dirname, '..', '..', '..')
    describe  : 'Aplication root folder'
  )
  .argv

if argv.h
  optimist.showHelp()
  process.exit()

hosts = {}

nextport = do ->
  port = argv.p
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
    newargv.d = path.join(argv.r, 'data', req.headers.host)
    newargv.u = "http://#{req.headers.host}"
    server(newargv)
    bounce(hosts[req.headers.host])
).listen(argv.p)

# Create an instance of server using command line arguments and defaults.
