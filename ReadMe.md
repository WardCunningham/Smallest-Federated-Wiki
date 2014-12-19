```
This repository exists as both a historical document and 
a community of interested parties. This is not where you
want to find the current source for Federated Wiki.
```


Smallest Federated Wiki Goals
=============================

The original wiki was written in a week and cloned within a week after that.
The concept was shown to be fruitful while leaving other implementors room to innovate.
When we ask for simple, we are looking for the same kind of simplicity: nothing to distract from our innovation in federation.

We imagined two components:

1. a server component managing page storage and collaboration between peer servers, and,
2. a client component presenting and modifying the server state in server specific ways.

The project is judged successful to the degree that it can:

* Demonstrate that wiki would have been better had it been effectively federated from the beginning.
* Explore federation policies necessary to sustain an open creative community.

This project has been founded within the community assembled in Portland at the Indie Web Camp:

* http://IndieWebCamp.com

Software development continues elsewhere within github:

* https://github.com/fedwiki


Install and Launch
==================

The preferred implementation is distributed as [npm module wiki](https://npmjs.org/package/wiki),
and a corresponding [github repository](https://github.com/fedwiki/wiki-node).

With node/npm installed, install wiki with this command:

    npm install -g wiki

Launch the wiki server with this command:

    wiki -p 3000

Your wiki will now be available as localhost:3000.

If you have a public facing site with a wildcard domain name then you can launch wiki as a virtual hosting site
we call a wiki farm. We'll use the more conventional port 80 assuming you also have root access.

    wiki -p 80 -f

Heavy wiki users will want a farm of their own.

License
=======

You may use the Smallest Federated Wiki under either the
[MIT License](https://github.com/WardCunningham/Smallest-Federated-Wiki/blob/master/mit-license.txt) or the
[GNU General Public License](https://github.com/WardCunningham/Smallest-Federated-Wiki/blob/master/gpl-license.txt) (GPL) Version 2.

