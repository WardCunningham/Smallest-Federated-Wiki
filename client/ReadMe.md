Client Goals
============

A server offers direct restful read/write access to pages it owns and proxy access to pages held elsewhere in federated space.
A page is owned if it was created with the server or has been cloned and edited such that it is believed to be the most authoritative copy of a page previously owned elsewhere.
A server operates as a proxy to the rest of the federated wiki.
In this role it reformats data and metadata providing a unified experience.
It is welcome to collect behavioral statistics in order to improve this experience by anticipating permitted peer-to-peer server operations.

In summary, the server's client side exists to:

* Offer to a user a browsing experience that is independent of any specific server.
* Support writing, editing and curating of one server in a way that offers suitable influence over others.

Working with Browserify
=======================

The client side is written in CoffeeScript, and built with Browserify.
If you are not checking in changes you need not concern yourself with this.
We've checked in the generated Javascript for the client application.

If you do want to check in changes, install node v0.6.x

* On Linux download the source from [GitHub](https://github.com/joyent/node)
* On Windows get the installer from the [main node.js site](http://nodejs.org).
* On Mac you should be able to choose either.

Once node is installed come back to this directory and run:

* `npm install` To install CoffeeScript, Browserify, and all their dependencies.

You can now use:

* `npm start` To build the main client.
* `npm test` To build the test client.

These commands build client.js and test/testclient.js from client.coffee and
testclient.coffee respectively.  They use their entry files to require the
rest of the coffee script they need from the source CS files in /lib.

We also have a cool automated talking (Mac only) Perl build script that uses
a globally installed browserify via `npm install -g browserify`, it watches
for changes, builds the clients automatically, and gives a verbal report
when you have syntax errors.

Testing
=======

All the client tests can be run by visiting /runtests.html on your server
or by running the full ruby test suite. Information about the libraries we
are using for testing can be found at:

* http://visionmedia.github.com/mocha/
* https://github.com/LearnBoost/expect.js
* http://sinonjs.org/

CoffeeScript hints
==================

We recommend taking time to learn the CoffeeScript syntax and the rationale for the Javascript idioms it employs. Start here:

  http://jashkenas.github.com/coffee-script/

We used a Javascript to Coffeescript converter to create the first draft of client.coffee. You may find this converter useful for importing sample codes. 

  http://ricostacruz.com/js2coffee/

