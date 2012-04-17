var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/test/util.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var util;

  util = require('../lib/util.coffee');

  module.exports = describe('util', function() {
    it('should make random bytes', function() {
      var a;
      a = util.randomByte();
      expect(a).to.be.a('string');
      return expect(a.length).to.be(2);
    });
    it('should make random byte strings', function() {
      var s;
      s = util.randomBytes(4);
      expect(s).to.be.a('string');
      return expect(s.length).to.be(8);
    });
    it('should format unix time', function() {
      var s;
      s = util.formatTime(1333843344);
      return expect(s).to.be('5:02 PM<br>7 Apr 2012');
    });
    it('should format javascript time', function() {
      var s;
      s = util.formatTime(1333843344000);
      return expect(s).to.be('5:02 PM<br>7 Apr 2012');
    });
    it('should slug a name', function() {
      var s;
      s = util.asSlug('Welcome Visitors');
      return expect(s).to.be('welcome-visitors');
    });
    it('should make emptyPage page with title, story and journal', function() {
      var page;
      page = util.emptyPage();
      expect(page.title).to.be('empty');
      expect(page.story).to.eql([]);
      return expect(page.journal).to.eql([]);
    });
    return it('should make fresh empty page each call', function() {
      var page;
      page = util.emptyPage();
      page.story.push({
        type: 'junk'
      });
      page = util.emptyPage();
      return expect(page.story).to.eql([]);
    });
  });

}).call(this);

});

require.define("/lib/util.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var util;

  module.exports = util = {};

  util.randomByte = function() {
    return (((1 + Math.random()) * 0x100) | 0).toString(16).substring(1);
  };

  util.randomBytes = function(n) {
    return ((function() {
      var _i, _results;
      _results = [];
      for (_i = 1; 1 <= n ? _i <= n : _i >= n; 1 <= n ? _i++ : _i--) {
        _results.push(util.randomByte());
      }
      return _results;
    })()).join('');
  };

  util.formatTime = function(time) {
    var am, d, h, mi, mo;
    d = new Date((time > 10000000000 ? time : time * 1000));
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    h = d.getHours();
    am = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    return "" + h + ":" + mi + " " + am + "<br>" + (d.getDate()) + " " + mo + " " + (d.getFullYear());
  };

  util.asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  util.emptyPage = function() {
    return {
      title: 'empty',
      story: [],
      journal: []
    };
  };

}).call(this);

});

require.define("/test/active.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var active;

  active = require('../lib/active.coffee');

  describe('active', function() {
    before(function() {
      $('<div id="active1" />').appendTo('body');
      $('<div id="active2" />').appendTo('body');
      return active.set($('#active1'));
    });
    it('should detect the scroll container', function() {
      return expect(active.scrollContainer).to.be.a($);
    });
    it('should set the active div', function() {
      active.set($('#active2'));
      return expect($('#active2').hasClass('active')).to.be["true"];
    });
    return it('should remove previous active class', function() {
      return expect($('#active1').hasClass('active')).to.be["false"];
    });
  });

}).call(this);

});

require.define("/lib/active.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var active, findScrollContainer, scrollTo;

  module.exports = active = {};

  active.scrollContainer = void 0;

  findScrollContainer = function() {
    var scrolled;
    scrolled = $("body, html").filter(function() {
      return $(this).scrollLeft() > 0;
    });
    if (scrolled.length > 0) {
      return scrolled;
    } else {
      return $("body, html").scrollLeft(4).filter(function() {
        return $(this).scrollLeft() > 0;
      }).scrollTop(0);
    }
  };

  scrollTo = function(el) {
    var bodyWidth, contentWidth, maxX, minX, target, width, _ref;
    if ((_ref = active.scrollContainer) == null) {
      active.scrollContainer = findScrollContainer();
    }
    bodyWidth = $("body").width();
    minX = active.scrollContainer.scrollLeft();
    maxX = minX + bodyWidth;
    wiki.log('scrollTo', el, el.position());
    target = el.position().left;
    width = el.outerWidth(true);
    contentWidth = $(".page").outerWidth(true) * $(".page").size();
    if (target < minX) {
      return active.scrollContainer.animate({
        scrollLeft: target
      });
    } else if (target + width > maxX) {
      return active.scrollContainer.animate({
        scrollLeft: target - (bodyWidth - width)
      });
    } else if (maxX > $(".pages").outerWidth()) {
      return active.scrollContainer.animate({
        scrollLeft: Math.min(target, contentWidth - bodyWidth)
      });
    }
  };

  active.set = function(el) {
    el = $(el);
    wiki.log('set active', el);
    $(".active").removeClass("active");
    return scrollTo(el.addClass("active"));
  };

}).call(this);

});

require.define("/test/fetch.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var fetch;

  fetch = require('../lib/fetch.coffee');

  wiki.useLocalStorage = function() {
    return false;
  };

  wiki.putAction = function() {};

  describe('fetch', function() {
    before(function() {
      return $('<div id="fetch" data-site="foo" />').appendTo('body');
    });
    it('should have an empty context', function() {
      return expect(fetch.context).to.eql([]);
    });
    describe('ajax fails', function() {
      before(function() {
        return sinon.stub(jQuery, "ajax").yieldsTo('error');
      });
      it('should create a page when it can not find it', function(done) {
        return fetch($('#fetch'), function(page) {
          expect(page).to.eql({
            title: 'fetch'
          });
          return done();
        });
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
    describe('ajax, success', function() {
      before(function() {
        return sinon.stub(jQuery, "ajax").yieldsTo('success', 'test');
      });
      it('should fetch a page from specific site', function(done) {
        return fetch($('#fetch'), function(page) {
          expect(jQuery.ajax.calledOnce).to.be["true"];
          expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET');
          expect(jQuery.ajax.args[0][0].url).to.match(/^\/remote\/foo\/fetch\.json\?random=[a-z0-9]{8}$/);
          return done();
        });
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
    return describe('ajax, search', function() {
      before(function() {
        $('<div id="fetch2" />').appendTo('body');
        sinon.stub(jQuery, "ajax").yieldsTo('error');
        return fetch.context = ['origin', 'example.com', 'asdf.test', 'foo.bar'];
      });
      it('should search through the context for a page', function(done) {
        return fetch($('#fetch2'), function(page) {
          expect(jQuery.ajax.args[0][0].url).to.match(/^\/fetch2\.json\?random=[a-z0-9]{8}$/);
          expect(jQuery.ajax.args[1][0].url).to.match(/^\/remote\/example.com\/fetch2\.json\?random=[a-z0-9]{8}$/);
          expect(jQuery.ajax.args[2][0].url).to.match(/^\/remote\/asdf.test\/fetch2\.json\?random=[a-z0-9]{8}$/);
          expect(jQuery.ajax.args[3][0].url).to.match(/^\/remote\/foo.bar\/fetch2\.json\?random=[a-z0-9]{8}$/);
          return done();
        });
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
  });

}).call(this);

});

require.define("/lib/fetch.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var probe, util;

  util = require('./util');

  probe = function(pageElement, callback, localContext) {
    var i, json, resource, site, slug;
    slug = pageElement.attr('id');
    site = pageElement.data('site');
    if (pageElement.attr('data-server-generated') === 'true') callback(null);
    if (wiki.useLocalStorage() && (json = localStorage[slug])) {
      pageElement.addClass("local");
      callback(JSON.parse(json));
    }
    if (!(probe.context.length > 0)) probe.context = ['origin'];
    if (localContext == null) {
      localContext = (function() {
        var _i, _len, _ref, _results;
        _ref = probe.context;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push(i);
        }
        return _results;
      })();
    }
    if (typeof site === 'string') localContext = [site];
    site = localContext.shift();
    resource = site === 'origin' ? (site = null, slug) : "remote/" + site + "/" + slug;
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: "/" + resource + ".json?random=" + (util.randomBytes(4)),
      success: function(page) {
        wiki.log('fetch success', page, site || 'origin');
        $(pageElement).data('site', site);
        return callback(page);
      },
      error: function(xhr, type, msg) {
        var page, title;
        if (localContext.length > 0) {
          return probe(pageElement, callback, localContext);
        } else {
          site = null;
          title = $("a[href=\"/" + slug + ".html\"]").html();
          title || (title = slug);
          page = {
            title: title
          };
          wiki.putAction($(pageElement), {
            type: 'create',
            id: util.randomBytes(8),
            item: page
          });
          return callback(page);
        }
      }
    });
  };

  probe.context = [];

  module.exports = probe;

}).call(this);

});

require.define("/test/refresh.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var refresh;

  refresh = require('../lib/refresh.coffee');

  describe('refresh', function() {
    before(function() {
      sinon.stub(jQuery, "ajax").yieldsTo('success', {
        title: 'asdf'
      });
      return $('<div id="refresh" />').appendTo('body');
    });
    it('should refresh a page', function(done) {
      $('#refresh').each(refresh);
      return setTimeout(function() {
        expect($('#refresh h1').text()).to.be(' asdf');
        return done();
      }, 1000);
    });
    return after(function() {
      return jQuery.ajax.restore();
    });
  });

}).call(this);

});

require.define("/lib/refresh.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var emitHeader, fetch, handleDragging, initAddButton, initDragging, plugin, refresh, state, util;

  util = require('./util.coffee');

  fetch = require('./fetch.coffee');

  plugin = require('./plugin.coffee');

  state = require('./state.coffee');

  handleDragging = function(evt, ui) {
    var action, before, beforeElement, destinationPageElement, equals, item, itemElement, journalElement, moveFromPage, moveToPage, moveWithinPage, order, sourcePageElement, thisPageElement;
    itemElement = ui.item;
    item = wiki.getItem(itemElement);
    thisPageElement = $(this).parents('.page:first');
    sourcePageElement = itemElement.data('pageElement');
    destinationPageElement = itemElement.parents('.page:first');
    journalElement = thisPageElement.find('.journal');
    equals = function(a, b) {
      return a && b && a.get(0) === b.get(0);
    };
    moveWithinPage = !sourcePageElement || equals(sourcePageElement, destinationPageElement);
    moveFromPage = !moveWithinPage && equals(thisPageElement, sourcePageElement);
    moveToPage = !moveWithinPage && equals(thisPageElement, destinationPageElement);
    action = moveWithinPage ? (order = $(this).children().map(function(_, value) {
      return $(value).attr('data-id');
    }).get(), {
      type: 'move',
      order: order
    }) : moveFromPage ? {
      type: 'remove'
    } : moveToPage ? (itemElement.data('pageElement', thisPageElement), beforeElement = itemElement.prev('.item'), before = wiki.getItem(beforeElement), {
      type: 'add',
      item: item,
      after: before != null ? before.id : void 0
    }) : void 0;
    action.id = item.id;
    return wiki.putAction(thisPageElement, action);
  };

  initDragging = function(pageElement) {
    var storyElement;
    storyElement = pageElement.find('.story');
    return storyElement.sortable({
      update: handleDragging,
      connectWith: '.page .story'
    });
  };

  initAddButton = function(pageElement) {
    return pageElement.find(".add-factory").live("click", function(evt) {
      var before, beforeElement, item, itemElement;
      evt.preventDefault();
      item = {
        type: "factory",
        id: util.randomBytes(8)
      };
      itemElement = $("<div />", {
        "class": "item factory"
      }).data('item', item).attr('data-id', item.id);
      itemElement.data('pageElement', pageElement);
      pageElement.find(".story").append(itemElement);
      plugin["do"](itemElement, item);
      beforeElement = itemElement.prev('.item');
      before = wiki.getItem(beforeElement);
      return wiki.putAction(pageElement, {
        item: item,
        id: item.id,
        type: "add",
        after: before != null ? before.id : void 0
      });
    });
  };

  emitHeader = function(pageElement, page) {
    var site;
    site = $(pageElement).data('site');
    if (site != null) {
      return $(pageElement).append("<h1><a href=\"//" + site + "\"><img src = \"/remote/" + site + "/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>");
    } else {
      return $(pageElement).append($("<h1 />").append($("<a />").attr('href', '/').append($("<img>").error(function(e) {
        return plugin.get('favicon', function(favicon) {
          return favicon.create();
        });
      }).attr('class', 'favicon').attr('src', '/favicon.png').attr('height', '32px')), " " + page.title));
    }
  };

  module.exports = refresh = wiki.refresh = function() {
    var buildPage, pageElement;
    pageElement = $(this);
    buildPage = function(data) {
      var action, addContext, context, footerElement, journalElement, page, site, slug, storyElement, _i, _len, _ref, _ref2;
      if (!(data != null)) {
        pageElement.find('.item').each(function(i, each) {
          var item;
          item = wiki.getItem($(each));
          return plugin.get(item.type, function(plugin) {
            return plugin.bind($(each), item);
          });
        });
      } else {
        page = $.extend(util.emptyPage(), data);
        $(pageElement).data("data", page);
        slug = $(pageElement).attr('id');
        site = $(pageElement).data('site');
        context = ['origin'];
        if (site != null) context.push(site);
        addContext = function(site) {
          if ((site != null) && !_.include(context, site)) {
            return context.push(site);
          }
        };
        _ref = page.journal.slice(0).reverse();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          action = _ref[_i];
          addContext(action.site);
        }
        wiki.resolutionContext = context;
        wiki.log('build', slug, 'site', site, 'context', context.join(' => '));
        emitHeader(pageElement, page);
        _ref2 = ['story', 'journal', 'footer'].map(function(className) {
          return $("<div />").addClass(className).appendTo(pageElement);
        }), storyElement = _ref2[0], journalElement = _ref2[1], footerElement = _ref2[2];
        $.each(page.story, function(i, item) {
          var div;
          if ($.isArray(item)) item = item[0];
          div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id);
          storyElement.append(div);
          return plugin["do"](div, item);
        });
        $.each(page.journal, function(i, action) {
          return wiki.addToJournal(journalElement, action);
        });
        footerElement.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ').append("<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a> . ").append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>");
        state.setUrl();
      }
      initDragging(pageElement);
      return initAddButton(pageElement);
    };
    return fetch(pageElement, buildPage);
  };

}).call(this);

});

require.define("/lib/plugin.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var getScript, plugin, scripts, util;

  util = require('./util.coffee');

  module.exports = plugin = {};

  scripts = {};

  getScript = wiki.getScript = function(url, callback) {
    if (callback == null) callback = function() {};
    if (scripts[url] != null) {
      return callback();
    } else {
      return $.getScript(url, function() {
        scripts[url] = true;
        return callback();
      });
    }
  };

  plugin.get = wiki.getPlugin = function(name, callback) {
    if (window.plugins[name]) return callback(window.plugins[name]);
    return getScript("/plugins/" + name + ".js", function() {
      return callback(window.plugins[name]);
    });
  };

  plugin["do"] = wiki.doPlugin = function(div, item) {
    var error;
    error = function(ex) {
      var errorElement;
      errorElement = $("<div />").addClass('error');
      errorElement.text(ex.toString());
      return div.append(errorElement);
    };
    try {
      div.data('pageElement', div.parents(".page"));
      div.data('item', item);
      return plugin.get(item.type, function(script) {
        if (script == null) {
          throw TypeError("Can't find plugin for '" + item.type + "'");
        }
        try {
          script.emit(div, item);
          return script.bind(div, item);
        } catch (err) {
          return error(err);
        }
      });
    } catch (err) {
      return error(err);
    }
  };

  window.plugins = {
    paragraph: {
      emit: function(div, item) {
        return div.append("<p>" + (wiki.resolveLinks(item.text)) + "</p>");
      },
      bind: function(div, item) {
        return div.dblclick(function() {
          return wiki.textEditor(div, item);
        });
      }
    },
    image: {
      emit: function(div, item) {
        item.text || (item.text = item.caption);
        wiki.log('image', item);
        return div.append("<img src=\"" + item.url + "\"> <p>" + (wiki.resolveLinks(item.text)) + "</p>");
      },
      bind: function(div, item) {
        div.dblclick(function() {
          return wiki.textEditor(div, item);
        });
        return div.find('img').dblclick(function() {
          return wiki.dialog(item.text, this);
        });
      }
    },
    chart: {
      emit: function(div, item) {
        var captionElement, chartElement;
        chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last());
        return captionElement = $('<p />').html(wiki.resolveLinks(item.caption)).appendTo(div);
      },
      bind: function(div, item) {
        return div.find('p:first').mousemove(function(e) {
          var sample, time, _ref;
          _ref = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)], time = _ref[0], sample = _ref[1];
          $(e.target).text(sample.toFixed(1));
          return $(e.target).siblings("p").last().html(util.formatTime(time));
        }).dblclick(function() {
          return wiki.dialog("JSON for " + item.caption, $('<pre/>').text(JSON.stringify(item.data, null, 2)));
        });
      }
    },
    changes: {
      emit: function(div, item) {
        var a, i, key, ul, _ref, _results;
        div.append(ul = $('<ul />').append(localStorage.length ? $('<input type="button" value="discard all" />').css('margin-top', '10px') : $('<p>empty</p>')));
        _results = [];
        for (i = 0, _ref = localStorage.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
          key = localStorage.key(i);
          a = $('<a class="internal" href="#" />').append(key).data('pageName', key);
          _results.push(ul.prepend($('<li />').append(a)));
        }
        return _results;
      },
      bind: function(div, item) {
        return div.find('input').click(function() {
          localStorage.clear();
          return div.find('li').remove();
        });
      }
    }
  };

}).call(this);

});

require.define("/lib/state.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var active, state;
  var __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (__hasProp.call(this, i) && this[i] === item) return i; } return -1; };

  active = require('./active');

  module.exports = state = {};

  state.pagesInDom = function() {
    return $.makeArray($(".page").map(function(_, el) {
      return el.id;
    }));
  };

  state.urlPages = function() {
    var i;
    return ((function() {
      var _i, _len, _ref, _results, _step;
      _ref = $(location).attr('pathname').split('/');
      _results = [];
      for (_i = 0, _len = _ref.length, _step = 2; _i < _len; _i += _step) {
        i = _ref[_i];
        _results.push(i);
      }
      return _results;
    })()).slice(1);
  };

  state.locsInDom = function() {
    return $.makeArray($(".page").map(function(_, el) {
      return $(el).data('site') || 'view';
    }));
  };

  state.urlLocs = function() {
    var j, _i, _len, _ref, _results, _step;
    _ref = $(location).attr('pathname').split('/').slice(1);
    _results = [];
    for (_i = 0, _len = _ref.length, _step = 2; _i < _len; _i += _step) {
      j = _ref[_i];
      _results.push(j);
    }
    return _results;
  };

  state.setUrl = function() {
    var idx, locs, page, pages, url;
    if (history && history.pushState) {
      locs = state.locsInDom();
      pages = state.pagesInDom();
      url = ((function() {
        var _len, _results;
        _results = [];
        for (idx = 0, _len = pages.length; idx < _len; idx++) {
          page = pages[idx];
          _results.push("/" + ((locs != null ? locs[idx] : void 0) || 'view') + "/" + page);
        }
        return _results;
      })()).join('');
      if (url !== $(location).attr('pathname')) {
        wiki.log('set state', locs, pages);
        return history.pushState(null, null, url);
      }
    }
  };

  state.show = function(e) {
    var idx, name, newLocs, newPages, old, oldLocs, oldPages, previous, _len;
    wiki.log('popstate', e);
    oldPages = state.pagesInDom();
    newPages = state.urlPages();
    oldLocs = state.locsInDom();
    newLocs = state.urlLocs();
    if (!location.pathname || location.pathname === '/') return;
    wiki.log('showState', oldPages, newPages, oldLocs, newLocs);
    previous = $('.page').eq(0);
    for (idx = 0, _len = newPages.length; idx < _len; idx++) {
      name = newPages[idx];
      if (name !== oldPages[idx]) {
        old = $('.page').eq(idx);
        if (old) old.remove();
        wiki.createPage(name, newLocs[idx]).insertAfter(previous).each(wiki.refresh);
      }
      previous = $('.page').eq(idx);
    }
    previous.nextAll().remove();
    return active.set($('.page').last());
  };

  state.first = function() {
    var firstUrlLocs, firstUrlPages, idx, oldPages, urlPage, _len, _results;
    state.setUrl();
    firstUrlPages = state.urlPages();
    firstUrlLocs = state.urlLocs();
    oldPages = state.pagesInDom();
    wiki.log('amost createPage', firstUrlPages, firstUrlLocs, oldPages);
    _results = [];
    for (idx = 0, _len = firstUrlPages.length; idx < _len; idx++) {
      urlPage = firstUrlPages[idx];
      if (!(__indexOf.call(oldPages, urlPage) < 0)) continue;
      wiki.log('createPage', urlPage, idx);
      if (urlPage !== '') {
        _results.push(wiki.createPage(urlPage, firstUrlLocs[idx]).appendTo('.main'));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

}).call(this);

});

require.define("/test/plugin.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var plugin;

  plugin = require('../lib/plugin.coffee');

  describe('plugin', function() {
    before(function() {
      sinon.stub(jQuery, "getScript").yieldsTo();
      return $('<div id="plugin" />').appendTo('body');
    });
    it('should have default image type', function() {
      return expect(window.plugins).to.have.property('image');
    });
    it('should get a plugin', function(done) {
      return plugin.get('test', function() {
        expect(jQuery.getScript.calledOnce).to.be(true);
        expect(jQuery.getScript.args[0][0]).to.be('/plugins/test.js');
        return done();
      });
    });
    it('should render a plugin', function() {
      var item;
      item = {
        type: 'paragraph',
        text: 'blah [[Link]] asdf'
      };
      plugin["do"]($('#plugin'), item);
      return expect($('#plugin').html()).to.be('<p>blah <a class="internal" href="/link.html" data-page-name="link" title="origin">Link</a> asdf</p>');
    });
    return after(function() {
      return jQuery.getScript.restore();
    });
  });

}).call(this);

});

require.define("/testclient.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var __slice = Array.prototype.slice;

  mocha.setup('bdd');

  window.wiki = {};

  wiki.log = function() {
    var things;
    things = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if ((typeof console !== "undefined" && console !== null ? console.log : void 0) != null) {
      return console.log(things);
    }
  };

  require('./test/util.coffee');

  require('./test/active.coffee');

  require('./test/fetch.coffee');

  require('./test/refresh.coffee');

  require('./test/plugin.coffee');

  $(function() {
    $('<hr><h2> Testing artifacts:</h2>').appendTo('body');
    return mocha.run();
  });

}).call(this);

});
require("/testclient.coffee");
