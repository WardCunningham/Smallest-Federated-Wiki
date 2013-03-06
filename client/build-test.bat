@ECHO OFF
::
:: Used on Windows to build testclient.js as npm start and test don't work!
::

:: Build testclient.js - need to expand .\plugins\*\test.coffee as wildcard does not work on Windows

echo "Building test\testclient.js"

.\node_modules\.bin\browserify.cmd testclient.coffee .\plugins\calendar\test.coffee .\plugins\changes\test.coffee .\plugins\efficiency\test.coffee .\plugins\report\test.coffee .\plugins\txtzyme\test.coffee -o test\testclient.js