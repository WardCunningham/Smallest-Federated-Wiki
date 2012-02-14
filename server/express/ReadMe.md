# Smallest Federated Wiki Node.js Express Server #
## Setup ##

To install

	npm install

Set production flag to not install testing framework.
Debug logging is turned on when in the development environment.

## Newest Docs ##
The most up to date node server specific documentation is in the source
code, in a way that is best viewed when processed with 
[Docco](http://jashkenas.github.com/docco/). This document should eventually
only be an install how to, with most other docs being in the source code
of logically placed files, that is then generated into wiki pages and checked
in to default-data.

## Launching the Node/Express Server ##
To run in the default development mode just execute:

	bin/server.js

To run in production mode:

	NODE_ENV=production bin/server.js

## Goals ##
The main goal of the express port of Smallest Federated Wiki is to create a
SFW server that is fully compatible with the reference server, with a focus
on being practical, easy to install, setup, and maintain.  The end result of this being
a lowered bar to participation, and thus greater numbers in the federation.

We are attempting to stay compatible  with the newest release versions of
node, coffee-script, and express.

## Usage patterns ##
There are two patterns that have emerged so far for the node server.
You can either run it from the command line using the executable coffee script
file /server/express/bin/server.js or you can require /server/express from another
node program, and then call it passing in the options you want.
To get started with the first method check out the command line options:
	bin/server.js -h

To get started with the second pattern checkout lib/farm.coffee as an example.

## Running specs ##

* The unit tests can be run with:
		npm test
* Make sure you have Ruby 1.9.x installed, as well as the 'bundler' gem
* Run `bundle install` in the root
* Start the Express server in integration testing mode:
  `server/express/bin/server.js --test`
* Run the integration specs against the node/express server:
  `TEST_NODE=true bundle exec rspec spec/integration_spec.rb` 
