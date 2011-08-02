Server Goals
============

The server participates in a peer-to-peer exchange of page content and page metadata.
It is expected to be mostly-on so that it can support the needs of peers and anticipate the needs of ux clients of this server.
In summary, the server's peer-to-peer side exists to:

* Encourage the deployment of independently owned content stores.
* Support community among owners through systematic sharing of content.

Launching the Server
====================

We're now using Ruby 1.9.2 which we manage with rvm. Launch the server with the following bundler commands:

	rvm 1.9.2
	bundle exec rackup -s thin -p 4567