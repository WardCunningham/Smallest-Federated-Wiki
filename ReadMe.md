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

* http://IndieWebCamp.com

How to Participate
==================

First you will want to get caught up with some project history. We've been recording screencast videos for as long as we've had something to demo. You should watch them all. They're short:

* http://wardcunningham.github.com

Then you may want to read through the end-user how-to documentation which is itself written in a federated wiki:

* http://fed.wiki.org/how-to-wiki.html

Once you know where we are and how we got there, you could peruse the project roadmap. This and a number of other forward looking pages are kept in the project's GitHub wiki:

* [Project Roadmap](https://github.com/WardCunningham/Smallest-Federated-Wiki/wiki)
* [List of Wiki Pages](https://github.com/WardCunningham/Smallest-Federated-Wiki/wiki/_pages)

When you start reading code you'll want to start with the "reference" server implementation. This is coded in Ruby as a Sinatra application. There are other server implementations but the Ruby code is as close as we have to a specification as to what it means to be a federated wiki server:

* [/server/sinatra](https://github.com/WardCunningham/Smallest-Federated-Wiki/tree/master/server/sinatra)

The next code reading stop is the client side javascript which is coded in the punctuation friendly dialect [CoffeeScript](http://jashkenas.github.com/coffee-script/):

* [/client](https://github.com/WardCunningham/Smallest-Federated-Wiki/tree/master/client)

Code contributions are always welcome. We're developing using the `fork and pull request` model supported so well by GitHub. Please read through their excellent help to make sure you know what's expected of you:

* http://help.github.com/send-pull-requests/

You are welcome to join our developer IRC channel, #fedwiki on freenode. We also meet for a google video chat every Wednesday morning at 10am Pacific time.

* http://bit.ly/SFWhangout

If you'd like to know what we think of your programming idea before you program it, just write up an Issue here on GitHub. You'll save us all some time if you read through open issues first:

* [Open Issues](https://github.com/WardCunningham/Smallest-Federated-Wiki/issues?sort=created&direction=desc&state=open&page=1)

For that matter, there is lots of coding and project philosophy in the comment history of closed issues. Read through the issues with lots of comments. GitHub has good issue search and will sort closed issues by number of comments to make this easy:

* [Closed Issues](https://github.com/WardCunningham/Smallest-Federated-Wiki/issues?sort=comments&direction=desc&state=closed&page=1)

We're proud to be forked frequently. Go ahead and fork this project now. We're glad to have you.


Install and Launch
==================

*For help installing and running on Windows, refer to the [Windows Notes](Windows.md).*

The project is distributed as a GitHub repository. You will need a git client. Learn more from GitHub:

* http://help.github.com/

When you have git. Use it to clone the repository:

	git clone git://github.com/WardCunningham/Smallest-Federated-Wiki.git
	cd Smallest-Federated-Wiki

We have several server implementations that share the same client code.
Our reference implementation is in Sinatra.
We're using Ruby 1.9.2 which we manage with rvm.

To install rvm: 

	curl -L https://get.rvm.io | bash -s stable --ruby

Then install Ruby, from one of the following versions:

	Mac-Specific note: On the latest OS X versions, you first need the gcc compiler. 
	One way is to install XCode from Apple Store. (Free)
	The Command Line Tools must be installed. See the Downloads section of Xcode's preferences.

	rvm install 1.9.2
	rvm use 1.9.2
	
	Mac-Specific note: If you see an error message such as the following on latest versions of OS X,
		"The provided compiler '/usr/bin/gcc' is LLVM based, it is not yet
		fully supported by ruby and gems, please read `rvm requirements`."
		try:
			rvm install 1.9.2 --with-gcc=clang
			rvm use 1.9.2

The software has been known to run trouble-free under version 1.8.5 so long as appropriate gem versions are installed. The latest releases of OSX work better with 1.9.3.

For latest versions of OS X: 

	rvm install 1.9.3 --with-gcc=clang
	rvm use 1.9.3

The server is a ruby bundle. Get the bundler gem and then use it to get everything else:

	gem install bundler
	bundle install

Launch the server with this bundle command:

	cd server/sinatra
	bundle exec rackup -s thin -p 1111

Now go to your browser and browse your new wiki:

	http://localhost:1111

Running specs
=============

The acceptance test suite is written using RSpec 2 and utilizes Selenium heavily. You must have a recent version of Firefox installed to run the test suite.

The spec files are kept in the /spec folder.

To run an individual spec, run

	bundle exec rspec spec/[spec name].rb
	
Where the [spec name].rb can be

    spec/favicon_spec.rb 
    spec/integration_spec.rb 
    spec/page_spec.rb 
    spec/server_helpers_spec.rb 
    spec/server_spec.rb 
    spec/stores/couch_spec.rb

To run all specs, run

	bundle exec rake spec

Running coffeescript tests
=============

Client-side unit and integration tests are written using [mocha](http://visionmedia.github.com/mocha/). The test runner is an HTML page (runtests.html) which is self-served by the wiki server itself. 

If your server is running at http:///localhost:9292 then you can run your tests by invoking http://localhost:9292/runtests.html. 

**Note**: The test runner page must be accessed via a server. loading the page in a browser directly from your filesystem will not work correctly.

Looking For Code Bloat
======================

Try this command to see if any code files have grown unpleasantly large.

	wc -l `find * | perl -ne 'next if /jquery/; print if /\.(rb|haml|sass|coffee)$/'` | sort -rgb

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

