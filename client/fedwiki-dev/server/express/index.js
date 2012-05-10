// **index.js**
// Simple file so that if you require this directory
// in node it instead requires ./lib/server.coffee
// with coffee-script already loaded.
require('coffee-script');
module.exports = require('./lib/server');
