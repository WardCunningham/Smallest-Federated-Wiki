Client Plugin development
=========================

The client side plugins are written in CoffeeScript.
We check in the generated Javascript to simplify useage.

If you do want to check in changes, install node v0.6.x

* On Linux download the source from [GitHub](https://github.com/joyent/node)
* On Windows get the installer from the [main node.js site](http://nodejs.org).
* On Mac you should be able to choose either.

Once node is installed come back to this directory and run:

* `npm install` To install CoffeeScript, and all its dependencies.

You can now use:

* `npm start` To compile the CoffeeScript to Javascript.
* `npm test` (not defined atm)

Creating a new Plugin
=====================

If you create a new plugin, you will need to have a compiled Javascript file and then re-start the server, as the server detects plugins on startup.

The simplest plugin is just a single coffescript file creating a new element (PLUGINNAME), that defines an _emit_ and _bind_ function.

    window.plugins.>>PLUGINNAME<< =
      emit: (div, item) ->
        wiki.log 'lists', item
        pre = $('<pre style="font-size: 16px;"/>').text item.text
        div.append pre
      bind: (div, item) ->
        div.dblclick -> wiki.textEditor div, item


CoffeeScript hints
==================

We recommend taking time to learn the CoffeeScript syntax and the rationale for the Javascript idioms it employs. Start here:

  http://jashkenas.github.com/coffee-script/

We used a Javascript to Coffeescript converter to create the first draft of client.coffee. You may find this converter useful for importing sample codes. 

  http://ricostacruz.com/js2coffee/

