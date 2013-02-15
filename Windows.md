Windows Notes
=============

These notes will help with installing and running the Smallest Federated Wiki on Windows.

* [Install and Launch (Sinatra)](Windows.md#install-and-launch-sinatra)
* [Install and Launch (Node.js Express)](Windows.md#install-and-launch-nodejs-express)



Install and Launch (Sinatra)
============================

The Sinstra server requires Ruby, this can be installed from [RubyInstaller for Windows](http://rubyinstaller.org/).
As well as the Ruby Installer, you will also need the Development Kit to compile some of the Gem files. These notes 
have been written/tested with Ruby version 1.9.3.

> **N.B.** See [Development Kit](https://github.com/oneclick/rubyinstaller/wiki/Development-Kit) for installation 
> instructions.

Open a command window - ensure that Ruby, the Development Kit, and Git have all been added to the environment (there
are scripts in the ruby and development kit directories if necessary).

The server is a ruby bundle. Get the bundler gem and then use it to get everything else:

	gem install bundler
	bundle update

> It is probably best to use ```bundle update``` rather than ```bundle install``` so that the latest version of the
> gems are installed. There are know problems with eventmachine (0.12.10) not installing, and with in-line code in the PNG (1.2.0) gem 
> this will be seen as an error when the server is started - if the update to the PNG gem has not been release, see [Fixed a misordered block of C code](https://github.com/bensomers/png/commit/eff179b3e5849b287251d0c33435852e8842597e) 
> for the changes needed to the PNG gem code.


Launch the server with this bundle command:

	cd server\sinatra 
	bundle exec rackup -s thin -p 1111

Now go to your browser and browse your new wiki:

	http://localhost:1111


Install and Launch (Node.js Express)
====================================

The express server requires Node.js, if not already installed it is available from [node.js](http://nodejs.org/).
You will also need a Visual C compiler, the current version of the Visual Studio Express is free from 
[Visual Studio Express](www.microsoft.com/express/) - **N.B.** you will want the version for Windows Desktop.

Open a command window - ensure that node, and Visual C are both on path. Also worth checking that windows\system32 is 
not missing from the path, as that causes a know problem.

Run ```npm install``` in the following directories:

	client
	client\plugins
	client\plugins\linkmap
	client\plugins\parse
	server\express

The server is launched by:

	cd server\express
	node bin\server.js

You should not get any error messages when starting, if any new plugins are added that require installing you will get
a message similar to:

	starting plugin xxxxx
	failed to start plugin xxxxx { [Error: Cannot find module 'ws'] code: 'MODULE_NOT_FOUND' }

If that happens you just need to run ```npm install``` in that plugin's directory.

Now got to your browser and browse your new wiki:

	http://localhost:3000
