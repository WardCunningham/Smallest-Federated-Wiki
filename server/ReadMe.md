Server Goals
============

The server participates in a peer-to-peer exchange of page content and page metadata.
It is expected to be mostly-on so that it can support the needs of peers and anticipate the needs of ux clients of this server.
In summary, the server's peer-to-peer side exists to:

* Encourage the deployment of independently owned content stores.
* Support community among owners through systematic sharing of content.

Customizing your Server
=======================

The distribution contains default files that will be installed if you don't install your own.
These are:

  data/pages/default-welcome-visitors

This is the usual welcome page offered as the server's home page.
It becomes welcome-visitors unless that file already exists.
You can revise it at your leisure.

  client/default-favicon.png

This is a 32x32 png gradient that is used to identify your server in bookmarks,
browser tabs, page headings and journal entries.
You're encouraged to create a distinctive gradient file to identify your server.
Try generating something fun at http://tools.dynamicdrive.com/gradient/
Save the result as client/favicon.png.

We found another very simple gradient generator which has the advantage of being written in ruby.
Read the blog post, http://blog.jpoz.net/2009/07/27/ruby-gradients.html, or run the generator, http://gradient.jpoz.net/

Launching the Server
====================

We're now using Ruby 1.9.2 which we manage with rvm. Launch the server with the following bundler commands:

	rvm 1.9.2
	bundle exec rackup -s thin -p 1111


Notes On Using Bundler
======================

From: 	Jesse Hallett <hallettj@gmail.com>
Subject: 	[pdxruby] Meeting notes, August 2011
Date: 	August 3, 2011 12:35:53 AM PDT

List project dependencies in a file called "Gemfile" in your project
root.  Then you can use the bundle command to resolve any dependencies
and install the gems for you.

   gem 'gemname', '4.2.3', :require => 'vpim/calendar'

   group :development
       # more gems here
   end

You can specify the exact gem versions that you want.  This helps
avoid a situation where another gem requires an older version than
would be loaded by default if you had not specified a version.

If you install graphviz and the ruby-graphviz gem you can get a visual
representation of your gem dependency graph:

   bundle viz

You can use the `:require => false` option with Facets so that you can
load just the facets components that you need where you need them.
This helps to prevent Facets from clobbering ActiveSupport.  Or you
can pass a path to a specific subcomponent of the gem instead of
`false`.  The :require option is also necessary if the name of the gem
is not the same as the string that you have to give to `require` to
load the thing.

The Gemfile is itself a ruby script.  You can do something like add
code to load more gem declarations from a "Gemfile.local" file that is
not checked into version control.  Or you can sniff a database.yaml
file to determine which database gem to require.

Instead of referencing a gem repository, you can load a library from a
git repository or a filesystem path with thr :git => repo_url or :path
=> some_path options.  With git you can add a :ref => committish
option to target a specific tag, branch, or commit hash.

Pessimistic version numbers, like '~> 3.1.2', indicate specific
requirements for the major and minor number and a minimum value for
the patch level.  Similarly, '~> 2.0' fixes the major number but
allows any minor number and patch level to be used.

Markus Roberts asks, why is there no index that lets Bundler figure
out a working combination of version numbers on its own?  So that you
don't have to pin an older version of some gem by hand just because
another gem you are using will not work with the latest version.  Sam
Livingston-Gray suggests that not every gem lists all of its
dependecies with precise version numbers.

When Bundler runs it produces a "Gemfile.lock" file that lists the
specific version of of the listed gems and their dependencies that
Bundler has determined to be the latest version that matches your
specifications.  Should you check Gemfile.lock into version control?
If your Gemfile does any dymanic calculation then different instances
of the project are likely to require different sets of gems - so don't
check it in in that case.

Reid Beels mentions a gem called bundle_outdated, which provides a
command that examines your Gemfile and suggests newer versions for
gems that have updates available.

Specify RAILS_ENV at the shell level in your build scripts if your
Gemfile references that value.

   bundle check || bundle install --local || bundle install --without
development --without test

Igal recently updated the pdxruby website with a new Gemfile that you
can look at as an example.  The code is at
https://github.com/igal/pdxruby2.  Another example to look at is
https://github.com/reidab/citizenry.

   RAILS_ENV = bundle exec rake  # runs the version of rake specified
in Gemfile

Or you can run:

   bundle install --binstubs

to install executables for the appropriate versions of each gem into a
bin/ directory in your project tree.

Do not list Bundler itself as a dependency in your Gemfile!

Kyle Drake mentions that it is possible to combine RVM with Bundler to
specify which Ruby version to use to run your project.  You can create
a .rvmrc file in your project to do this.  If you are working under a
directory that contains a .rvmrc file RVM will automatically switch
Ruby versions to match the settings in that file.

Kyle also tells us that Bundler can place gem code into a vendor/
directory.  You can check this code into your project if you want to.
But this does not work with git sources.  If you have proprietary code
to include in your project and you want to deploy to Heroku, or to a
similar platform, you pretty much have to vendorize that code.

You can specify that certain gems or versions should be conditionally
included depending on the specific Ruby platform that is being used to
run your application.  For example:

   gem 'some_gem', :platforms => [:ruby_18, :mri_19, :rbx]


