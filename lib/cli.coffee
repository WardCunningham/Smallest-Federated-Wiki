# **cli.coffee** command line interface for the
# Smallest-Federated-Wiki express server

path = require 'path'
optimist = require 'optimist'
server = require './server'
bouncy = require 'bouncy'
farm = require './farm'
cc = require 'config-chain'

# Handle command line options

argv = optimist
  .usage('Usage: $0')
  .options('u',
    alias     : 'url'
    describe  : 'Important: Your server URL, used as Persona audience during verification'
  )
  .options('p',
    alias     : 'port'
    describe  : 'Port'
  )
  .options('d',
    alias     : 'data'
    describe  : 'location of flat file data'
  )
  .options('r',
    alias     : 'root'
    describe  : 'Application root folder'
  )
  .options('f',
    alias     : 'farm'
    describe  : 'Turn on the farm?'
  )
  .options('F',
    alias     : 'FarmPort'
    describe  : 'Port to start farm servers on.'
  )
  .options('s',
    alias     : 'startSlug'
    describe  : 'The page to go to instead of index.html'
  )
  .options('o',
    alias     : 'host'
    describe  : 'Host to accept connections on, falsy == any'
  )
  .options('id',
    describe  : 'Set the location of the open id file'
  )
  .options('test',
    boolean   : true
    describe  : 'Set server to work with the rspec integration tests'
  )
  .options('h',
    alias     : 'help'
    boolean   : true
    describe  : 'Show this help info and exit'
  )
  .options('config',
    alias     : 'conf'
    describe  : 'Optional config file.'
  )
  .argv

config = cc(argv,
  argv.config,
  cc.env('wiki_'),
  cc.find('config.json'),
    F: 40000
    p: 3000
    r: path.join(__dirname, '..')
    s: 'welcome-visitors'
).store

# If h/help is set print the generated help message and exit.
if argv.h
  optimist.showHelp()
# If f/farm is set call../lib/farm.coffee with argv object, else call
# ../lib/server.coffee with argv object.
else if argv.test
  console.log "WARNING: Server started in testing mode, other options ignored"
  server({p: 33333, d: path.join(argv.r, 'spec', 'data')})
else if config.f
  farm(config)
else
  server(config)

