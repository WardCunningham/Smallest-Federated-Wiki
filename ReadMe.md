Smallest Federated Wiki Goals
=============================

The original wiki was written in a week and cloned within a week after that.
The concept was shown to be fruitful while leaving other implementors room to innovate.
When we ask for simple, we are looking for the same kind of simplicity: nothing to distract from our innovation in federation.

We imagine two components:

1. a server component managing page storage and collaboration between peer servers, and,
2. a client component presenting and modifying the server state in server specific ways.

This project should be judged by the degree that it can:

* Demonstrate that wiki would have been better had it been effectively federated from the beginning.
* Explore federation policies necessary to sustain an open creative community.

This project has been founded within the community assembled in Portland at the Indie Web Camp:

* [http://IndieWebCamp.com]

Install and Launch
==================

The server is distributed as a GitHub repository. The server distributes a web client to any visitor. You will need a git client. Learn more from GitHub:

	http://help.github.com/

When you have git. Use it to clone the repository:

	git clone git://github.com/WardCunningham/Smallest-Federated-Wiki.git
	cd Smallest-Federated-Wiki

We're using Ruby 1.9.2 which we manage with rvm:

	rvm 1.9.2

The server is a ruby bundle. Get the bundler and then use it to get everything else:

	sudo gem install bundler
	sudo bundle install

Launch the server with this bundle command:

	bundle exec rackup -s thin -p 1111

Now go to your browser and browse your new wiki:

	http://localhost:1111

Looking For Code Bloat
======================

Try this command to see if any code files have grown unpleasantly large.

	wc -l `find . | perl -ne 'next if /jquery/; print if /\.(rb|haml|sass|coffee)$/'`

License
=======

You may use the Smallest Federated Wiki under either the
[MIT License](https://github.com/WardCunningham/Smallest-Federated-Wiki/blob/master/mit-license.txt) or the
[GNU General Public License](https://github.com/WardCunningham/Smallest-Federated-Wiki/blob/master/gpl-license.txt) (GPL) Version 2.

Debian Squeeze quick hints 
==========================
for those not using Ruby much, but using Debian:

    sudo apt-get install ruby1.9.1 rubygems ruby1.9.1-examples debian-keyring ri1.9.1 ruby1.9.1-dev rubygems-doc 
    sudo gem install bundle
    sudo /var/lib/gems/1.8/bin/bundle install
    rvm 1.9.2
    /var/lib/gems/1.8/bin/bundle exec rackup -s thin -p 1111

