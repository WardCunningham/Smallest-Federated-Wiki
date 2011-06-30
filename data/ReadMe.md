Data Goals
==========

The data stored in these files is sufficient to bootstrap a federated wiki server.
These files can serve as a flat-file database, as-is, or be read into some other store at installation.

Functional tests may depend on this initial data.
Expect changes here to require revisions in these tests.

Helpers for Making Data
=======================

For making random ids, run this and then just paste at will.

	while sleep 1; do perl -e 'print map(substr("0123456789abcdef",rand(15),1),0..15)'|pbcopy; done

Use this to debug json punctuation.

	http://jsonlint.com/