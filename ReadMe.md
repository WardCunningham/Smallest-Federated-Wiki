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

How to Participate
==================

First you will want to get caught up with some project history. We've been recording screencast videos for as long as we've had something to demo. You should watch them all. They're short:

* http://video.fed.wiki.org

Then you may want to read through the end-user how-to documentation which is itself written in a federated wiki:

* http://fed.wiki.org/how-to-wiki.html


Code contributions are always welcome. We're developing using the `fork and pull request` model supported so well by GitHub. Please read through their excellent help to make sure you know what's expected of you:

* http://help.github.com/send-pull-requests/

You are welcome to join our developer IRC channel, #fedwiki on freenode. We also meet for a Google video chat every Wednesday morning at 10AM Pacific time. The URI will be announced 10 to 15 minutes before at:

* https://twitter.com/WardCunningham
* http://fed.wiki.org/view/frequently-asked-questions

If you'd like to know what we think of your programming idea before you program it, just write up an Issue here on GitHub. You'll save us all some time if you read through open issues first:

* [Open Issues](https://github.com/WardCunningham/Smallest-Federated-Wiki/issues?sort=created&direction=desc&state=open&page=1)

For that matter, there is lots of coding and project philosophy in the comment history of closed issues. Read through the issues with lots of comments. GitHub has good issue search and will sort closed issues by number of comments to make this easy:

* [Closed Issues](https://github.com/WardCunningham/Smallest-Federated-Wiki/issues?sort=comments&direction=desc&state=closed&page=1)

We're proud to be forked frequently. Go ahead and fork this project now. We're glad to have you.


Install and Launch
==================

The preferred implementation is distributed as [npm module wiki](https://npmjs.org/package/wiki),
and a corresponding [github repository](https://github.com/fedwiki/wiki-node).

With node/npm installed, install wiki with this command:

    npm install -g wiki

Launch the wiki server with this command:

    wiki -p 3000

Your wiki will now be available as localhost:3000.


License
=======

You may use the Smallest Federated Wiki under either the
[MIT License](https://github.com/WardCunningham/Smallest-Federated-Wiki/blob/master/mit-license.txt) or the
[GNU General Public License](https://github.com/WardCunningham/Smallest-Federated-Wiki/blob/master/gpl-license.txt) (GPL) Version 2.

