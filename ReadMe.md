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

How to Participate
==================

First you will want to get caught up with some project history. We've been recording screencast videos for as long as we've had something to demo. You should watch them all. They're short:

* http://wardcunningham.github.com

Then you will want to read through the project roadmap. This and a number of other forward looking pages are kept in the project's GitHub wiki:

* [Project Roadmap](https://github.com/WardCunningham/Smallest-Federated-Wiki/wiki)
* [List of Wiki Pages](https://github.com/WardCunningham/Smallest-Federated-Wiki/wiki/_pages)

When you start reading code you're want to start with the "reference" server implementation. This is coded in ruby as a Sinatra application. There are other server implementations but the ruby code is as close as we have to a specification as to what it means to be a federated wiki server:

* [/server](https://github.com/WardCunningham/Smallest-Federated-Wiki/tree/master/server)

The next code reading stop is the client side javascript which is coded in the punctuation friendly dialect [CoffeeScript](http://jashkenas.github.com/coffee-script/):

* [/client](https://github.com/WardCunningham/Smallest-Federated-Wiki/tree/master/client)

Code contributions are always welcome. We're developing using the `fork and pull request` model supported so well by GitHub. Please read through their excellent help to make sure you know what's expected of you:

* http://help.github.com/send-pull-requests/

If you'd like to know what we think of your programming idea before you program it, just write up an Issue here on GitHub. You're save us all some time if you read through open issues first:

* [Open Issues](https://github.com/WardCunningham/Smallest-Federated-Wiki/issues?sort=created&direction=desc&state=open&page=1)

For that matter, there is lots of coding and project philosophy in the comment history of closed issues. Read through the issues with lots of comments. GitHub will sort closed issues by number of comments to make this easy:

* [Closed Issues](https://github.com/WardCunningham/Smallest-Federated-Wiki/issues?sort=comments&direction=desc&state=closed&page=1)

We're proud to be forked frequently. Go ahead and fork this project now. We're glad to have you. 


Install and Launch
==================

The reference server is distributed as a GitHub repository. You will need a git client. Learn more from GitHub:

	http://help.github.com/

When you have git. Use it to clone the repository:

	git clone git://github.com/WardCunningham/Smallest-Federated-Wiki.git
	cd Smallest-Federated-Wiki

We're using Ruby 1.9.2 which we manage with rvm:

	rvm install 1.9.2
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

