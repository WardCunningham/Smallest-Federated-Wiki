# Smallest Federated Wiki Node.js Express Server #
## Setup ##

If it is not already, install node v0.6.x: on Linux download the source from
[GitHub](https://github.com/joyent/node), on windows get the installer from
the [main node.js site](http://nodejs.org).  Mac users should be able to
choose either.  Once node is installed come back to this directory and run:

	npm install

Set the production flag to not install the development dependencies.

## Newest Docs ##
The most up to date node server specific documentation is in the source
code, in a way that is best viewed when processed with
[Docco](http://jashkenas.github.com/docco/). This document should eventually
only be an install how to, with most other docs being in the source code
of logically placed files, that is then generated into wiki pages and checked
in to default-data.

## Usage patterns ##
There are two ways to use the node server.
You can either run it from the command line using the executable script
file `server/express/bin/server.js` or you can `require('server/express')`
from another node program, and then call it passing in the options you want to
start the server.  To get started with the first method check out the
command line options:

	./bin/server.js -h

To get started with the second pattern checkout lib/farm.coffee as an example.

## Launching the Node/Express Server ##
To run in the default development mode at localhost:3000 just execute:

	npm start

To run in production mode:

	NODE_ENV=production ./bin/server.js -p 80 -u 'http://example.com'

Debug logging is turned on when in the development environment. Add any options
you want to the call.  A typical usage would be:

	./bin/server.js -p 8080 -fF 22222

And then proxy all hosts that you want pointed at a SFW to port 8080.

You can also specify an optional config file with --config="path/to/conf.json",
specify environment variables with the "wiki\_" prefix, or put options in a
config.json file.


## Goals ##
The main goal of the express port of Smallest Federated Wiki is to create a
SFW server that is fully compatible with the reference server, with a focus
on being practical, easy to install, setup, and maintain.  The end result of this being
a lowered bar to participation, and thus greater numbers in the federation.

We are attempting to stay compatible  with the newest release versions of
node, coffee-script, and express.

## Running specs ##

* The unit tests can be run with a simple:
  `npm test`
* The Integration tests are a bit more involved.
* Make sure you have Ruby 1.9.x installed, as well as the 'bundler' gem
* Run `bundle install` in the root
* Start the Express server in integration testing mode:
  `./server/express/bin/server.js --test`
* Run the integration specs against the node/express server:
  `TEST_NODE=true bundle exec rspec spec/integration_spec.rb`

