::
:: Used on Windows to build client.js and testclient.js as npm start and test don't work!
::

:: Build client.js

echo "Building client.js"

.\node_modules\.bin\browserify.cmd client.coffee -o client.js

:: Build testclient.js - need to expand .\plugins\*\test.coffee as wildcard does not work on Windows

echo "Building test\testclient.js"

.\node_modules\.bin\browserify.cmd testclient.coffee .\plugins\claendar\test.coffee .\plugins\changes\test.coffee .\plugins\efficiency\test.coffee .\plugins\report\test.coffee .\plugins\txtzyme\test.coffee -o test\testclient.js