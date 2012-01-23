Server Goals
============

The server participates in a peer-to-peer exchange of page content and page metadata.
It is expected to be mostly-on so that it can support the needs of peers and anticipate the needs of ux clients of this server.
In summary, the server's peer-to-peer side exists to:

* Encourage the deployment of independently owned content stores.
* Support community among owners through systematic sharing of content.


Customizing your Server
=======================

The distribution contains default files. They will be copied the first time
they're requested, if you don't install your own. These are:

    default-data/pages/welcome-visitors
    default-data/status/favicon.png (unused, see below)

The first is the usual welcome page offered as the server's home page.
The second is a 32x32 png gradient that is used to identify your server
in bookmarks, browser tabs, page headings and journal entries.

You can revise the welcome page by editing your copy here:

    data/pages/welcome-visitors

A suitable random gradient will be generated for you.
You can remove or replace it here:

    data/status/favicon.png


Launching the Server
====================

We're now using Ruby 1.9.2 which we manage with rvm. Launch the server with the following bundler commands:

	rvm 1.9.2
	bundle exec rackup -s thin -p 1111

Hosting a Server Farm
=====================

The server can host separate pages and status directories for a number of virtual hosts. Enable this by creating the subdirectory:

	data/farm

The server will create subdirectories with farm for each virtual host name and locate pages and status directories within that.

The thin web server cannot handle recursive web requests that can happen with federated sites hosted in the same farm. Use webrick instead. Launch it with this command:

	bundle exec rackup -s webrick -p 1111
