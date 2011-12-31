Setup
=====

to install

	npm install

if you don't have coffeescript installed globally

	npm install -g coffeescript

All user options are contained in the opt object defined at the top of
the file.  Defaults should work in the git repo on port 3000
Debug logging is turned on when in development environment.

Warning: Writes are enabled and the server isn't secured in any way.

tested using node 0.6.x

Launching the Node/Express Server
=================================

To run in the default development mode:

	coffee server.coffee

To run in production mode (don't put this in production yet....):

	NODE_ENV=production coffee server.coffee

# Running specs

* Make sure you have Ruby 1.9.x installed, as well as the 'bundler' gem
* Run `bundle install` in the root
* Start the Express server at port 33333, with the data directory set at {root}/spec/data
	cd server/express/bin && ./server -p 33333 -d '../../../spec/data/'
* Run `TEST_NODE=true bundle exec rspec spec/integration_spec.rb`. This will run the integration specs against the node/express server.
