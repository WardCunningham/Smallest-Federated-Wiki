(function() {
  var WebSocketServer, asSlug, buildmap, fetchPage, findLinks, fs, linkmap, startServer;

  WebSocketServer = require('ws').Server;

  fs = require('fs');

  linkmap = {};

  asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  fetchPage = function(path, done) {
    var text;
    return text = fs.readFile(path, 'utf8', function(err, text) {
      if (err) return console.log(['linkmap fetchPage error', path, err]);
      return done(JSON.parse(text));
    });
  };

  findLinks = function(page) {
    var item, link, links, match, slug, title, unique, _i, _j, _len, _len2, _ref, _ref2, _results;
    unique = {};
    _ref = page.story || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      links = (function() {
        switch (item != null ? item.type : void 0) {
          case 'paragraph':
            return item.text.match(/\[\[([^\]]+)\]\]/g);
        }
      })();
      if (links) {
        for (_j = 0, _len2 = links.length; _j < _len2; _j++) {
          link = links[_j];
          _ref2 = link.match(/\[\[([^\]]+)\]\]/), match = _ref2[0], title = _ref2[1];
          unique[asSlug(title)] = title;
        }
      }
    }
    _results = [];
    for (slug in unique) {
      title = unique[slug];
      _results.push(slug);
    }
    return _results;
  };

  buildmap = function(pages) {
    return fs.readdir(pages, function(err, names) {
      var slug, _i, _len, _ref, _results;
      _ref = names != null;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        slug = _ref[_i];
        if (slug.match(/^[a-z0-9-]+$/)) {
          _results.push((function(slug) {
            return fetchPage("" + pages + "/" + slug, function(page) {
              return linkmap[slug] = findLinks(page);
            });
          })(slug));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
  };

  startServer = function(params) {
    var k, socket, v;
    console.log('linkmap startServer', (function() {
      var _results;
      _results = [];
      for (k in params) {
        v = params[k];
        _results.push(k);
      }
      return _results;
    })());
    buildmap(params.argv.db);
    socket = new WebSocketServer({
      server: params.server,
      path: '/plugin/linkmap'
    });
    return socket.on('connection', function(ws) {
      console.log('connection established, ready to send');
      return ws.send(JSON.stringify(linkmap, null, 2), function(err) {
        if (err) return console.log('unable to send ws message:', err);
      });
    });
  };

  module.exports = {
    startServer: startServer
  };

}).call(this);
