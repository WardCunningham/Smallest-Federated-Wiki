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

	git clone git@github.com:WardCunningham/Smallest-Federated-Wiki.git
	cd Smallest-Federated-Wiki

The server is a ruby bundle. Get the bundler and then use it to get everything else:

	sudo gem install bundler
	sudo bundle install

We're now using Ruby 1.9.2 which we manage with rvm:

	rvm 1.9.2

Launch the server with this bundle command:

	bundle exec rackup -s thin -p 4567

Now go to your browser and browse your new wiki:

	http://localhost:4567

Looking For Code Bloat
======================

Try this command to see if any code files have grown unpleasantly large.

	wc -l `find . | perl -ne 'next if /jquery/; print if /\.(rb|haml|sass|coffee)$/'`
