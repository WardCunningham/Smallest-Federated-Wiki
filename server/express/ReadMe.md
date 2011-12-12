Setup
=====

If you don't have your own data, copy ../../default-data to ../../data.

All user options are contained in the opt object defined at the top of
the file.  Defaults should work in the git repo on port 3000
Debug logging is turned on when in development environment.

Warning: Writes are enabled and the server isn't secured in any way.

Launching the Node/Express Server
=================================

To run in the default development mode:

	coffee server.coffee

To run in production mode (don't put this in production yet....):

	NODE_ENV=production coffee server.coffee
