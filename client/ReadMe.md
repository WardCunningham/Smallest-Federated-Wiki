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

Working with CoffeeScript
==========================

The client side is written in CoffeeScript. If you are not checking in changes you need not concern yourself with this. We've checked in the generated Javascript for the client application.

Should you modify the CoffeeScript you will need to translate it to JavaScript. The easy way to do this is to launch the coffee translator as follows:

	cd client
	coffee -wc .

The `-wc` option asks coffee not terminate, watch the source files and recompile as you make changes.

We recommend taking time to learn the CoffeeScript syntax and the rationale for the Javascript idioms it employes. Start here:

  http://jashkenas.github.com/coffee-script/

We used a Javascript to Coffeescript converter to create the first draft of client.coffee. You may find this converter useful for importing sample codes. 

  http://ricostacruz.com/js2coffee/

CoffeeScript hints
==================
The coffee translator is a node.js package, so you'll need to install a recent version from http://nodejs.org/#download
and then the npm package manager from http://npmjs.org/
and then install coffee http://jashkenas.github.com/coffee-script/
