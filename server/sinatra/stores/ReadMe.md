We support several wiki page persistence mechanisms called Stores.
Currently the server includes all versions and selects one with
an environment variable.

File Store
==========

Pages are stored in flat files under `data` in the subdirectory
`pages`. File names are the slugs with no suffix.
A second subdirectory, `status`, contains additional metadata
such as the site's favicon.png.

When the server is operated as a wiki site farm,
data and status subdirectories are pushed several levels deeper
in the file hierarchy under `data/farm/*` where * is replaced
with the virtual host domain name.
The existence of the farm subdirectory configures the server
into farm mode.

Couch Store
===========

Pages are stored as Couch documents with fully qualified
names following the conventions established in the File Store.
An environment variable indicates that the server should
be in farm mode.
