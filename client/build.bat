@ECHO OFF
::
:: Used on Windows to build client.js as npm start and test don't work!
::

echo "Building client.js"

.\node_modules\.bin\browserify.cmd client.coffee -o client.js
