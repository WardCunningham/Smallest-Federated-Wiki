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

or by setting the environment variable

	FARM_MODE=true

The server will create subdirectories with farm for each virtual host name and locate pages and status directories within that.

Recursive Server Calls
======================

Federated sites hosted in the same farm can cause recursive web requests.
This is an issue for certain rack servers, notably thin, which is widely used in production rack setups.
If you have a standard server configuration, in which all traffic coming to *.my-sfw-farm.org will be handled by
a single server, you can serve page json and favicons in the context of the current request
(instead of generating an additional HTTP request)
by setting the environment variable:

	FARM_DOMAINS=my-sfw-farm.org

Your server can handle multiple domains by comma-separating them:

	FARM_DOMAINS=my-sfw-farm.org,fedwiki.jacksmith.com

With this setup, pages and favicons will be served more efficiently, as well as being friendly to single-threaded servers like thin.

Alternately, you can use webrick, which handles recursive calls out of the box. Launch it with this command:

	bundle exec rackup -s webrick -p 1111

CouchDB
=======

By default, all pages, favicons, and server claims are stored in the server's local filesystem.
If you prefer to use CouchDB for storage, set two environment variables:

	STORE_TYPE=CouchStore
	COUCHDB_URL=https://username:password@some-couchdb-host.com

If you want to run a farm with CouchDB, be sure to set the environment variable

	FARM_MODE=true
