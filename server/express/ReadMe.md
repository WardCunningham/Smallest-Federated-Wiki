## Setup

To install

	npm install

Debug logging is turned on when in the development environment.
Currently there are some none node dependencies brought in from
node-canvas.  For now, please see node-canvas to install.

## Newest Docs
The most up to date node server specific documentation is in the source
code, in a way that is best viewed when processed with 
[Docco](http://jashkenas.github.com/docco/). This document should eventually
only be an install how to, with most other docs being in the source code
of logically placed files.

## Launching the Node/Express Server

To run in the default development mode just execute:

	bin/server

To run in production mode (don't put this in production yet....):

	NODE_ENV=production server

## Goals
The main goal of the express port of Smallest Federated Wiki is to create a
SFW server that is fully compatible with the reference server, with a focus
on being easy to install, setup, and maintain.  The end result of this being
a lowered bar to participation, and thus greater numbers in the federation.

We are attempting to stay compatible  with the newest release versions of
node, coffee-script, and express.

## Usage patterns
There are two patterns that have emerged so far for the node server.
You can either run it from the command line using the executable coffee script
file /server/express/bin/server or you can require /server/express from another
node program, and then call it passing in the options you want.

The everything is still changing rapidly, and more use cases will be explored,
but for now both of these should be supported.

## Running specs

* Make sure you have Ruby 1.9.x installed, as well as the 'bundler' gem
* Run `bundle install` in the root
* Start the Express server at port 33333, with the data directory set at {root}/spec/data
	server/express/bin/server -p 33333 -d '../../../spec/data/'
* Run `TEST_NODE=true bundle exec rspec spec/integration_spec.rb`. This will run the integration specs against the node/express server.
