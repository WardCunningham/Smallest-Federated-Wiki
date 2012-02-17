# Cli for the Smallest-Federated-Wiki express server

path = require 'path'
optimist = require 'optimist'
server = require './server'
bouncy = require 'bouncy'
farm = require './farm'

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
    default   : 3000
    describe  : 'Port'
  )
  .options('r',
    alias     : 'root'
    default   : path.join(__dirname, '..', '..', '..')
    describe  : 'Application root folder'
  )
  .options('f',
    alias     : 'farm'
    boolean   : true
    describe  : 'Turn on the farm?'
  )
  .options('F',
    alias     : 'FarmPort'
    default   : 40000
    describe  : 'Port to start farm servers on.'
  )
  .options('test',
    boolean   : true
    describe  : 'Set server to work with the rspec integration tests'
  )
  .options('id',
    describe  : 'Set the location of the open id file'
  )
  .argv

# If h/help is set print the generated help message and exit.
if argv.h
  optimist.showHelp()
  process.exit()

# If f/farm is set call../lib/farm.coffee with argv object, else call
# ../lib/server.coffee with argv object.
if argv.test
  console.log "WARNING: Server started in testing mode, other options ignored"
  server({p: 33333, d: path.join(argv.r, 'spec', 'data')})
else if argv.f
  farm(argv)
else
  server(argv)
