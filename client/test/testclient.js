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

require.define("/lib/util.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var util;

  module.exports = util = {};

  util.symbols = {
    create: '☼',
    add: '+',
    edit: '✎',
    fork: '⚑',
    move: '↕',
    remove: '✕'
  };

  util.resolveLinks = function(string) {
    var renderInternalLink;
    renderInternalLink = function(match, name) {
      var slug;
      slug = util.asSlug(name);
      return "<a class=\"internal\" href=\"/" + slug + ".html\" data-page-name=\"" + slug + "\" title=\"" + (wiki.resolutionContext.join(' => ')) + "\">" + name + "</a>";
    };
    return string.replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink).replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\">$2 <img src=\"/images/external-link-ltr-icon.png\"></a>");
  };

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

  util.formatDate = function(msSinceEpoch) {
    var am, d, day, h, mi, mo, sec, wk, yr;
    d = new Date(msSinceEpoch);
    wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    day = d.getDate();
    yr = d.getFullYear();
    h = d.getHours();
    am = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
    sec = (d.getSeconds() < 10 ? "0" : "") + d.getSeconds();
    return "" + wk + " " + mo + " " + day + ", " + yr + "<br>" + h + ":" + mi + ":" + sec + " " + am;
  };

  util.formatElapsedTime = function(msSinceEpoch) {
    var days, hrs, mins, months, msecs, secs, weeks, years;
    msecs = new Date().getTime() - msSinceEpoch;
    if ((secs = msecs / 1000) < 2) {
      return "" + (Math.floor(msecs)) + " milliseconds ago";
    }
    if ((mins = secs / 60) < 2) return "" + (Math.floor(secs)) + " seconds ago";
    if ((hrs = mins / 60) < 2) return "" + (Math.floor(mins)) + " minutes ago";
    if ((days = hrs / 24) < 2) return "" + (Math.floor(hrs)) + " hours ago";
    if ((weeks = days / 7) < 2) return "" + (Math.floor(days)) + " days ago";
    if ((months = days / 31) < 2) return "" + (Math.floor(weeks)) + " weeks ago";
    if ((years = days / 365) < 2) return "" + (Math.floor(months)) + " months ago";
    return "" + (Math.floor(years)) + " years ago";
  };

  util.asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  if (typeof wiki !== "undefined" && wiki !== null) wiki.asSlug = util.asSlug;

  util.emptyPage = function() {
    return {
      title: 'empty',
      story: [],
      journal: []
    };
  };

  util.getSelectionPos = function(jQueryElement) {
    var el, iePos, sel;
    el = jQueryElement.get(0);
    if (document.selection) {
      el.focus();
      sel = document.selection.createRange();
      sel.moveStart('character', -el.value.length);
      iePos = sel.text.length;
      return {
        start: iePos,
        end: iePos
      };
    } else {
      return {
        start: el.selectionStart,
        end: el.selectionEnd
      };
    }
  };

  util.setCaretPosition = function(jQueryElement, caretPos) {
    var el, range;
    el = jQueryElement.get(0);
    if (el != null) {
      if (el.createTextRange) {
        range = el.createTextRange();
        range.move("character", caretPos);
        range.select();
      } else {
        el.setSelectionRange(caretPos, caretPos);
      }
      return el.focus();
    }
  };

  util.createSynopsis = function(page) {
    var p1, p2, synopsis;
    synopsis = page.synopsis;
    if ((page != null) && (page.story != null)) {
      p1 = page.story[0];
      p2 = page.story[1];
      if (p1 && p1.type === 'paragraph') synopsis || (synopsis = p1.text);
      if (p2 && p2.type === 'paragraph') synopsis || (synopsis = p2.text);
      if (p1) synopsis || (synopsis = p1.text != null);
      if (p2) synopsis || (synopsis = p2.text != null);
      synopsis || (synopsis = (page.story != null) && ("A page with " + page.story.length + " items."));
    } else {
      synopsis = 'A page with no story.';
    }
    return synopsis;
  };

}).call(this);

});

require.define("/test/util.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var timezoneOffset, util;

  util = require('../lib/util.coffee');

  timezoneOffset = function() {
    return (new Date()).getTimezoneOffset() * 60;
  };

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
      s = util.formatTime(1333843344 + timezoneOffset());
      return expect(s).to.be('12:02 AM<br>8 Apr 2012');
    });
    it('should format javascript time', function() {
      var s;
      s = util.formatTime(1333843344000 + timezoneOffset() * 1000);
      return expect(s).to.be('12:02 AM<br>8 Apr 2012');
    });
    it('should format revision date', function() {
      var s;
      s = util.formatDate(1333843344000 + timezoneOffset() * 1000);
      return expect(s).to.be('Sun Apr 8, 2012<br>12:02:24 AM');
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
      return $("body, html").scrollLeft(12).filter(function() {
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
    $(".active").removeClass("active");
    return scrollTo(el.addClass("active"));
  };

}).call(this);

});

require.define("/test/pageHandler.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var mockServer, pageHandler;

  pageHandler = require('../lib/pageHandler.coffee');

  mockServer = require('./mockServer.coffee');

  wiki.useLocalStorage = function() {
    return false;
  };

  wiki.addToJournal = function() {};

  describe('pageHandler.get', function() {
    var genericPageData, genericPageInformation, pageInformationWithoutSite;
    it('should have an empty context', function() {
      return expect(pageHandler.context).to.eql([]);
    });
    pageInformationWithoutSite = {
      wasServerGenerated: false,
      slug: 'slugName',
      rev: 'revName'
    };
    genericPageInformation = _.extend({}, pageInformationWithoutSite, {
      site: 'siteName'
    });
    genericPageData = {
      journal: []
    };
    describe('ajax fails', function() {
      before(function() {
        return mockServer.simulatePageNotFound();
      });
      after(function() {
        return jQuery.ajax.restore();
      });
      it("should tell us when it can't find a page (server specified)", function() {
        var whenGotten, whenNotGotten;
        whenGotten = sinon.spy();
        whenNotGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(genericPageInformation),
          whenGotten: whenGotten,
          whenNotGotten: whenNotGotten
        });
        expect(whenGotten.called).to.be["false"];
        return expect(whenNotGotten.called).to.be["true"];
      });
      return it("should tell us when it can't find a page (server unspecified)", function() {
        var whenGotten, whenNotGotten;
        whenGotten = sinon.spy();
        whenNotGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(pageInformationWithoutSite),
          whenGotten: whenGotten,
          whenNotGotten: whenNotGotten
        });
        expect(whenGotten.called).to.be["false"];
        return expect(whenNotGotten.called).to.be["true"];
      });
    });
    describe('ajax, success', function() {
      before(function() {
        sinon.stub(jQuery, "ajax").yieldsTo('success', genericPageData);
        return $('<div id="pageHandler5" data-site="foo" />').appendTo('body');
      });
      it('should get a page from specific site', function() {
        var whenGotten;
        whenGotten = sinon.spy();
        pageHandler.get({
          pageInformation: _.clone(genericPageInformation),
          whenGotten: whenGotten
        });
        expect(whenGotten.calledOnce).to.be["true"];
        expect(jQuery.ajax.calledOnce).to.be["true"];
        expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET');
        return expect(jQuery.ajax.args[0][0].url).to.match(/^http:\/\/siteName\/slugName\.json\?random=[a-z0-9]{8}$/);
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
    return describe('ajax, search', function() {
      before(function() {
        mockServer.simulatePageNotFound();
        return pageHandler.context = ['view', 'example.com', 'asdf.test', 'foo.bar'];
      });
      it('should search through the context for a page', function() {
        pageHandler.get({
          pageInformation: _.clone(pageInformationWithoutSite),
          whenGotten: sinon.stub(),
          whenNotGotten: sinon.stub()
        });
        expect(jQuery.ajax.args[0][0].url).to.match(/^\/slugName\.json\?random=[a-z0-9]{8}$/);
        expect(jQuery.ajax.args[1][0].url).to.match(/^http:\/\/example.com\/slugName\.json\?random=[a-z0-9]{8}$/);
        expect(jQuery.ajax.args[2][0].url).to.match(/^http:\/\/asdf.test\/slugName\.json\?random=[a-z0-9]{8}$/);
        return expect(jQuery.ajax.args[3][0].url).to.match(/^http:\/\/foo.bar\/slugName\.json\?random=[a-z0-9]{8}$/);
      });
      return after(function() {
        return jQuery.ajax.restore();
      });
    });
  });

  describe('pageHandler.put', function() {
    before(function() {
      $('<div id="pageHandler3" />').appendTo('body');
      return sinon.stub(jQuery, "ajax").yieldsTo('success');
    });
    it('should save an action', function(done) {
      var action;
      action = {
        type: 'edit',
        id: 1,
        item: {
          id: 1
        }
      };
      wiki.addToJournal = function() {
        expect(jQuery.ajax.args[0][0].data).to.eql({
          action: JSON.stringify(action)
        });
        return done();
      };
      return pageHandler.put($('#pageHandler3'), action);
    });
    return after(function() {
      return jQuery.ajax.restore();
    });
  });

}).call(this);

});

require.define("/lib/pageHandler.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var pageFromLocalStorage, pageHandler, pushToLocal, pushToServer, recursiveGet, revision, state, util;

  util = require('./util');

  state = require('./state');

  revision = require('./revision');

  module.exports = pageHandler = {};

  pageFromLocalStorage = function(slug) {
    var json;
    if (json = localStorage[slug]) {
      return JSON.parse(json);
    } else {
      return;
    }
  };

  recursiveGet = function(_arg) {
    var localContext, localPage, pageInformation, rev, site, slug, url, whenGotten, whenNotGotten;
    pageInformation = _arg.pageInformation, whenGotten = _arg.whenGotten, whenNotGotten = _arg.whenNotGotten, localContext = _arg.localContext;
    slug = pageInformation.slug, rev = pageInformation.rev, site = pageInformation.site;
    if (site) {
      localContext = [];
    } else {
      site = localContext.shift();
    }
    if (site === 'view') site = null;
    if (site != null) {
      if (site === 'local') {
        if (localPage = pageFromLocalStorage(pageInformation.slug)) {
          return whenGotten(localPage, 'local');
        } else {
          return whenNotGotten();
        }
      } else {
        if (site === 'origin') {
          url = "/" + slug + ".json";
        } else {
          url = "http://" + site + "/" + slug + ".json";
        }
      }
    } else {
      url = "/" + slug + ".json";
    }
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: url + ("?random=" + (util.randomBytes(4))),
      success: function(page) {
        if (rev) page = revision.create(rev, page);
        return whenGotten(page, site);
      },
      error: function(xhr, type, msg) {
        var report;
        if ((xhr.status !== 404) && (xhr.status !== 0)) {
          wiki.log('pageHandler.get error', xhr, xhr.status, type, msg);
          report = {
            'title': "" + xhr.status + " " + msg,
            'story': [
              {
                'type': 'paragraph',
                'id': '928739187243',
                'text': "<pre>" + xhr.responseText
              }
            ]
          };
          return whenGotten(report, 'local');
        }
        if (localContext.length > 0) {
          return recursiveGet({
            pageInformation: pageInformation,
            whenGotten: whenGotten,
            whenNotGotten: whenNotGotten,
            localContext: localContext
          });
        } else {
          return whenNotGotten();
        }
      }
    });
  };

  pageHandler.get = function(_arg) {
    var localPage, pageInformation, whenGotten, whenNotGotten;
    whenGotten = _arg.whenGotten, whenNotGotten = _arg.whenNotGotten, pageInformation = _arg.pageInformation;
    wiki.log('pageHandler.get', pageInformation.site, pageInformation.slug, pageInformation.rev, 'context', pageHandler.context.join(' => '));
    if (pageInformation.wasServerGenerated) return whenGotten(null);
    if (!pageInformation.site) {
      if (localPage = pageFromLocalStorage(pageInformation.slug)) {
        if (pageInformation.rev) {
          localPage = revision.create(pageInformation.rev, localPage);
        }
        return whenGotten(localPage, 'local');
      }
    }
    if (!pageHandler.context.length) pageHandler.context = ['view'];
    return recursiveGet({
      pageInformation: pageInformation,
      whenGotten: whenGotten,
      whenNotGotten: whenNotGotten,
      localContext: _.clone(pageHandler.context)
    });
  };

  pageHandler.context = [];

  pushToLocal = function(pageElement, pagePutInfo, action) {
    var page, site;
    page = pageFromLocalStorage(pagePutInfo.slug);
    if (action.type === 'create') {
      page = {
        title: action.item.title
      };
    }
    page || (page = pageElement.data("data"));
    if (page.journal == null) page.journal = [];
    if ((site = action['fork']) != null) {
      page.journal = page.journal.concat({
        'type': 'fork',
        'site': site
      });
      delete action['fork'];
    }
    page.journal = page.journal.concat(action);
    page.story = $(pageElement).find(".item").map(function() {
      return $(this).data("item");
    }).get();
    localStorage[pagePutInfo.slug] = JSON.stringify(page);
    return wiki.addToJournal(pageElement.find('.journal'), action);
  };

  pushToServer = function(pageElement, pagePutInfo, action) {
    return $.ajax({
      type: 'PUT',
      url: "/page/" + pagePutInfo.slug + "/action",
      data: {
        'action': JSON.stringify(action)
      },
      success: function() {
        return wiki.addToJournal(pageElement.find('.journal'), action);
      },
      error: function(xhr, type, msg) {
        return wiki.log("ajax error callback", type, msg);
      }
    });
  };

  pageHandler.put = function(pageElement, action) {
    var checkedSite, forkFrom, pagePutInfo;
    checkedSite = function() {
      var site;
      switch (site = pageElement.data('site')) {
        case 'origin':
        case 'local':
        case 'view':
          return null;
        case location.host:
          return null;
        default:
          return site;
      }
    };
    pagePutInfo = {
      slug: pageElement.attr('id').split('_rev')[0],
      rev: pageElement.attr('id').split('_rev')[1],
      site: checkedSite(),
      local: pageElement.hasClass('local')
    };
    forkFrom = pagePutInfo.site;
    wiki.log('pageHandler.put', pageElement, action, 'pagePutInfo', pagePutInfo, 'forkFrom', forkFrom);
    if (wiki.useLocalStorage()) {
      if (pagePutInfo.site != null) {
        wiki.log('remote => local');
      } else if (!pagePutInfo.local) {
        wiki.log('origin => local');
        action.site = forkFrom = location.host;
      }
    }
    action.date = (new Date()).getTime();
    if (action.site === 'origin') delete action.site;
    if (forkFrom) {
      pageElement.find('h1 img').attr('src', '/favicon.png');
      pageElement.find('h1 a').attr('href', '/');
      pageElement.data('site', null);
      state.setUrl();
      if (action.type !== 'fork') {
        action.fork = forkFrom;
        wiki.addToJournal(pageElement.find('.journal'), {
          type: 'fork',
          site: forkFrom,
          date: action.date
        });
      }
    }
    if (wiki.useLocalStorage() || pagePutInfo.site === 'local') {
      pushToLocal(pageElement, pagePutInfo, action);
      return pageElement.addClass("local");
    } else {
      return pushToServer(pageElement, pagePutInfo, action);
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
    var idx, locs, page, pages, url, _ref;
    document.title = (_ref = $('.page:last').data('data')) != null ? _ref.title : void 0;
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
        return history.pushState(null, null, url);
      }
    }
  };

  state.show = function(e) {
    var idx, name, newLocs, newPages, old, oldLocs, oldPages, previous, _len, _ref;
    oldPages = state.pagesInDom();
    newPages = state.urlPages();
    oldLocs = state.locsInDom();
    newLocs = state.urlLocs();
    if (!location.pathname || location.pathname === '/') return;
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
    active.set($('.page').last());
    return document.title = (_ref = $('.page:last').data('data')) != null ? _ref.title : void 0;
  };

  state.first = function() {
    var firstUrlLocs, firstUrlPages, idx, oldPages, urlPage, _len, _results;
    state.setUrl();
    firstUrlPages = state.urlPages();
    firstUrlLocs = state.urlLocs();
    oldPages = state.pagesInDom();
    _results = [];
    for (idx = 0, _len = firstUrlPages.length; idx < _len; idx++) {
      urlPage = firstUrlPages[idx];
      if (__indexOf.call(oldPages, urlPage) < 0) {
        if (urlPage !== '') {
          _results.push(wiki.createPage(urlPage, firstUrlLocs[idx]).appendTo('.main'));
        } else {
          _results.push(void 0);
        }
      }
    }
    return _results;
  };

}).call(this);

});

require.define("/lib/revision.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var create;

  create = function(revIndex, data) {
    var afterIndex, editIndex, itemId, items, journal, journalEntry, removeIndex, revJournal, revStory, revStoryIds, revTitle, storyItem, _i, _j, _k, _len, _len2, _len3, _ref;
    journal = data.journal;
    revTitle = data.title;
    revStory = [];
    revJournal = journal.slice(0, (+revIndex) + 1 || 9e9);
    for (_i = 0, _len = revJournal.length; _i < _len; _i++) {
      journalEntry = revJournal[_i];
      revStoryIds = revStory.map(function(storyItem) {
        return storyItem.id;
      });
      switch (journalEntry.type) {
        case 'create':
          if (journalEntry.item.title != null) {
            revTitle = journalEntry.item.title;
            revStory = journalEntry.item.story || [];
          }
          break;
        case 'add':
          if ((afterIndex = revStoryIds.indexOf(journalEntry.after)) !== -1) {
            revStory.splice(afterIndex + 1, 0, journalEntry.item);
          } else {
            revStory.push(journalEntry.item);
          }
          break;
        case 'edit':
          if ((editIndex = revStoryIds.indexOf(journalEntry.id)) !== -1) {
            revStory.splice(editIndex, 1, journalEntry.item);
          } else {
            revStory.push(journalEntry.item);
          }
          break;
        case 'move':
          items = [];
          for (_j = 0, _len2 = revStory.length; _j < _len2; _j++) {
            storyItem = revStory[_j];
            items[storyItem.id] = storyItem;
          }
          revStory = [];
          _ref = journalEntry.order;
          for (_k = 0, _len3 = _ref.length; _k < _len3; _k++) {
            itemId = _ref[_k];
            revStory.push(items[itemId]);
          }
          break;
        case 'remove':
          if ((removeIndex = revStoryIds.indexOf(journalEntry.id)) !== -1) {
            revStory.splice(removeIndex, 1);
          }
      }
    }
    return {
      story: revStory,
      journal: revJournal,
      title: revTitle
    };
  };

  exports.create = create;

}).call(this);

});

require.define("/test/mockServer.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var simulatePageFound, simulatePageNotFound;

  simulatePageNotFound = function() {
    var xhrFor404;
    xhrFor404 = {
      status: 404
    };
    return sinon.stub(jQuery, "ajax").yieldsTo('error', xhrFor404);
  };

  simulatePageFound = function(pageToReturn) {
    if (pageToReturn == null) pageToReturn = {};
    return sinon.stub(jQuery, "ajax").yieldsTo('success', pageToReturn);
  };

  module.exports = {
    simulatePageNotFound: simulatePageNotFound,
    simulatePageFound: simulatePageFound
  };

}).call(this);

});

require.define("/test/refresh.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var mockServer, refresh;

  refresh = require('../lib/refresh.coffee');

  mockServer = require('./mockServer.coffee');

  describe('refresh', function() {
    var $page, simulatePageNotBeingFound;
    simulatePageNotBeingFound = function() {
      return sinon.stub(jQuery, "ajax").yieldsTo('success', {
        title: 'asdf'
      });
    };
    $page = void 0;
    before(function() {
      $page = $('<div id="refresh" />');
      return $page.appendTo('body');
    });
    it("creates a ghost page when page couldn't be found", function() {
      mockServer.simulatePageNotFound();
      $page.each(refresh);
      expect($page.hasClass('ghost')).to.be(true);
      return expect($page.data('data').story[0].type).to.be('future');
    });
    return xit('should refresh a page', function(done) {
      simulatePageFound({
        title: 'asdf'
      });
      $page.each(refresh);
      jQuery.ajax.restore();
      expect($('#refresh h1').text()).to.be(' asdf');
      return done();
    });
  });

}).call(this);

});

require.define("/lib/refresh.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var createFactory, emitHeader, handleDragging, initAddButton, initDragging, neighborhood, pageHandler, plugin, refresh, state, util;
  var __slice = Array.prototype.slice;

  util = require('./util.coffee');

  pageHandler = require('./pageHandler.coffee');

  plugin = require('./plugin.coffee');

  state = require('./state.coffee');

  neighborhood = require('./neighborhood.coffee');

  handleDragging = function(evt, ui) {
    var action, before, beforeElement, destinationPageElement, equals, item, itemElement, journalElement, moveFromPage, moveToPage, moveWithinPage, order, sourcePageElement, sourceSite, thisPageElement;
    itemElement = ui.item;
    item = wiki.getItem(itemElement);
    thisPageElement = $(this).parents('.page:first');
    sourcePageElement = itemElement.data('pageElement');
    sourceSite = sourcePageElement.data('site');
    destinationPageElement = itemElement.parents('.page:first');
    journalElement = thisPageElement.find('.journal');
    equals = function(a, b) {
      return a && b && a.get(0) === b.get(0);
    };
    moveWithinPage = !sourcePageElement || equals(sourcePageElement, destinationPageElement);
    moveFromPage = !moveWithinPage && equals(thisPageElement, sourcePageElement);
    moveToPage = !moveWithinPage && equals(thisPageElement, destinationPageElement);
    if (moveFromPage) {
      if (sourcePageElement.hasClass('ghost') || sourcePageElement.attr('id') === destinationPageElement.attr('id')) {
        return;
      }
    }
    action = moveWithinPage ? (order = $(this).children().map(function(_, value) {
      return $(value).attr('data-id');
    }).get(), {
      type: 'move',
      order: order
    }) : moveFromPage ? (wiki.log('drag from', sourcePageElement.find('h1').text()), {
      type: 'remove'
    }) : moveToPage ? (itemElement.data('pageElement', thisPageElement), beforeElement = itemElement.prev('.item'), before = wiki.getItem(beforeElement), {
      type: 'add',
      item: item,
      after: before != null ? before.id : void 0
    }) : void 0;
    action.id = item.id;
    return pageHandler.put(thisPageElement, action);
  };

  initDragging = function(pageElement) {
    var storyElement;
    storyElement = pageElement.find('.story');
    return storyElement.sortable({
      connectWith: '.page .story'
    }).on("sortupdate", handleDragging);
  };

  initAddButton = function(pageElement) {
    return pageElement.find(".add-factory").live("click", function(evt) {
      evt.preventDefault();
      return createFactory(pageElement);
    });
  };

  createFactory = function(pageElement) {
    var before, beforeElement, item, itemElement;
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
    return pageHandler.put(pageElement, {
      item: item,
      id: item.id,
      type: "add",
      after: before != null ? before.id : void 0
    });
  };

  emitHeader = function(pageElement, page) {
    var date, rev, site;
    site = $(pageElement).data('site');
    if ((site != null) && site !== 'local' && site !== 'origin' && site !== 'view') {
      $(pageElement).append("<h1 title=\"" + site + "\"><a href=\"//" + site + "\"><img src = \"http://" + site + "/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>");
    } else {
      $(pageElement).append($("<h1 title=\"" + location.host + "\"/>").append($("<a />").attr('href', '/').append($("<img>").error(function(e) {
        return plugin.get('favicon', function(favicon) {
          return favicon.create();
        });
      }).attr('class', 'favicon').attr('src', '/favicon.png').attr('height', '32px')), " " + page.title));
    }
    if ((rev = pageElement.attr('id').split('_rev')[1]) != null) {
      date = page.journal[page.journal.length - 1].date;
      return $(pageElement).addClass('ghost').data('rev', rev).append($("<h2 class=\"revision\">\n  <span>\n    " + (date != null ? util.formatDate(date) : "Revision " + rev) + "\n  </span>\n</h2>"));
    }
  };

  wiki.buildPage = function(data, siteFound, pageElement) {
    var action, addContext, context, doItem, footerElement, journalElement, page, site, slug, storyElement, _i, _len, _ref, _ref2;
    if (siteFound === 'local') {
      pageElement.addClass('local');
    } else {
      pageElement.data('site', siteFound);
    }
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
      context = ['view'];
      if (site != null) context.push(site);
      addContext = function(site) {
        if ((site != null) && !_.include(context, site)) return context.push(site);
      };
      _ref = page.journal.slice(0).reverse();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        action = _ref[_i];
        addContext(action.site);
      }
      wiki.resolutionContext = context;
      wiki.log('buildPage', slug, 'site', site, 'context', context.join(' => '));
      emitHeader(pageElement, page);
      _ref2 = ['story', 'journal', 'footer'].map(function(className) {
        return $("<div />").addClass(className).appendTo(pageElement);
      }), storyElement = _ref2[0], journalElement = _ref2[1], footerElement = _ref2[2];
      doItem = function(i) {
        var div, item;
        if (i >= page.story.length) return;
        item = page.story[i];
        if ($.isArray(item)) item = item[0];
        div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id);
        storyElement.append(div);
        return plugin["do"](div, item, function() {
          return doItem(i + 1);
        });
      };
      doItem(0);
      $.each(page.journal, function(i, action) {
        return wiki.addToJournal(journalElement, action);
      });
      journalElement.append("<div class=\"control-buttons\">\n  <a href=\"#\" class=\"button fork-page\" title=\"fork this page\">" + util.symbols['fork'] + "</a>\n  <a href=\"#\" class=\"button add-factory\" title=\"add paragraph\">" + util.symbols['add'] + "</a>\n</div>");
      footerElement.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ').append("<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a> . ").append("<a>" + (siteFound || 'origin') + "</a>");
      state.setUrl();
    }
    initDragging(pageElement);
    initAddButton(pageElement);
    return pageElement;
  };

  module.exports = refresh = wiki.refresh = function() {
    var createGhostPage, pageElement, pageInformation, registerNeighbors, rev, slug, whenGotten, _ref;
    pageElement = $(this);
    _ref = pageElement.attr('id').split('_rev'), slug = _ref[0], rev = _ref[1];
    pageInformation = {
      slug: slug,
      rev: rev,
      site: pageElement.data('site'),
      wasServerGenerated: pageElement.attr('data-server-generated') === 'true'
    };
    createGhostPage = function() {
      var heading, hits, info, page, result, site, title, _ref2, _ref3;
      title = $("a[href=\"/" + slug + ".html\"]:last").text() || slug;
      page = {
        'title': title,
        'story': [
          {
            'id': util.randomBytes(8),
            'type': 'future',
            'text': 'We could not find this page.',
            'title': title
          }
        ]
      };
      heading = {
        'type': 'paragraph',
        'id': util.randomBytes(8),
        'text': "We did find the page in your current neighborhood."
      };
      hits = [];
      _ref2 = wiki.neighborhood;
      for (site in _ref2) {
        info = _ref2[site];
        if (info.sitemap != null) {
          result = _.find(info.sitemap, function(each) {
            return each.slug === slug;
          });
          if (result != null) {
            hits.push({
              "type": "reference",
              "id": util.randomBytes(8),
              "site": site,
              "slug": slug,
              "title": result.title || slug,
              "text": result.synopsis || ''
            });
          }
        }
      }
      if (hits.length > 0) {
        (_ref3 = page.story).push.apply(_ref3, [heading].concat(__slice.call(hits)));
        page.story[0].text = 'We could not find this page in the expected context.';
      }
      return wiki.buildPage(page, void 0, pageElement).addClass('ghost');
    };
    registerNeighbors = function(data, site) {
      var action, item, _i, _j, _len, _len2, _ref2, _ref3, _results;
      if (_.include(['local', 'origin', 'view', null, void 0], site)) {
        neighborhood.registerNeighbor(location.host);
      } else {
        neighborhood.registerNeighbor(site);
      }
      _ref2 = data.story || [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        item = _ref2[_i];
        if (item.site != null) neighborhood.registerNeighbor(item.site);
      }
      _ref3 = data.journal || [];
      _results = [];
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        action = _ref3[_j];
        if (action.site != null) {
          _results.push(neighborhood.registerNeighbor(action.site));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    whenGotten = function(data, siteFound) {
      wiki.buildPage(data, siteFound, pageElement);
      return registerNeighbors(data, siteFound);
    };
    return pageHandler.get({
      whenGotten: whenGotten,
      whenNotGotten: createGhostPage,
      pageInformation: pageInformation
    });
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
      return $.getScript(url).done(function() {
        scripts[url] = true;
        return callback();
      }).fail(function() {
        return callback();
      });
    }
  };

  plugin.get = wiki.getPlugin = function(name, callback) {
    if (window.plugins[name]) return callback(window.plugins[name]);
    return getScript("/plugins/" + name + "/" + name + ".js", function() {
      if (window.plugins[name]) return callback(window.plugins[name]);
      return getScript("/plugins/" + name + ".js", function() {
        return callback(window.plugins[name]);
      });
    });
  };

  plugin["do"] = wiki.doPlugin = function(div, item, done) {
    var error;
    if (done == null) done = function() {};
    error = function(ex) {
      var errorElement;
      errorElement = $("<div />").addClass('error');
      errorElement.text(ex.toString());
      return div.append(errorElement);
    };
    div.data('pageElement', div.parents(".page"));
    div.data('item', item);
    return plugin.get(item.type, function(script) {
      try {
        if (script == null) {
          throw TypeError("Can't find plugin for '" + item.type + "'");
        }
        if (script.emit.length > 2) {
          return script.emit(div, item, function() {
            script.bind(div, item);
            return done();
          });
        } else {
          script.emit(div, item);
          script.bind(div, item);
          return done();
        }
      } catch (err) {
        wiki.log('plugin error', err);
        error(err);
        return done();
      }
    });
  };

  wiki.registerPlugin = function(pluginName, pluginFn) {
    return window.plugins[pluginName] = pluginFn($);
  };

  window.plugins = {
    paragraph: {
      emit: function(div, item) {
        return div.append("<p>" + (wiki.resolveLinks(item.text)) + "</p>");
      },
      bind: function(div, item) {
        return div.dblclick(function() {
          return wiki.textEditor(div, item, null, true);
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
    future: {
      emit: function(div, item) {
        var info, _i, _len, _ref, _results;
        div.append("" + item.text + "<br><br><button class=\"create\">create</button> new blank page");
        if (((info = wiki.neighborhood[location.host]) != null) && (info.sitemap != null)) {
          _ref = info.sitemap;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            item = _ref[_i];
            if (item.slug.match(/-template$/)) {
              _results.push(div.append("<br><button class=\"create\" data-slug=" + item.slug + ">create</button> from " + (wiki.resolveLinks("[[" + item.title + "]]"))));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      },
      bind: function(div, item) {}
    }
  };

}).call(this);

});

require.define("/lib/neighborhood.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var active, createSearch, neighborhood, nextAvailableFetch, nextFetchInterval, populateSiteInfoFor, util, _ref;
  var __hasProp = Object.prototype.hasOwnProperty;

  active = require('./active.coffee');

  util = require('./util.coffee');

  createSearch = require('./search.coffee');

  module.exports = neighborhood = {};

  if ((_ref = wiki.neighborhood) == null) wiki.neighborhood = {};

  nextAvailableFetch = 0;

  nextFetchInterval = 2000;

  populateSiteInfoFor = function(site, neighborInfo) {
    var fetchMap, now, transition;
    if (neighborInfo.sitemapRequestInflight) return;
    neighborInfo.sitemapRequestInflight = true;
    transition = function(site, from, to) {
      return $(".neighbor[data-site=\"" + site + "\"]").find('div').removeClass(from).addClass(to);
    };
    fetchMap = function() {
      var request, sitemapUrl;
      sitemapUrl = "http://" + site + "/system/sitemap.json";
      transition(site, 'wait', 'fetch');
      request = $.ajax({
        type: 'GET',
        dataType: 'json',
        url: sitemapUrl
      });
      return request.always(function() {
        return neighborInfo.sitemapRequestInflight = false;
      }).done(function(data) {
        neighborInfo.sitemap = data;
        return transition(site, 'fetch', 'done');
      }).fail(function(data) {
        return transition(site, 'fetch', 'fail');
      });
    };
    now = Date.now();
    if (now > nextAvailableFetch) {
      nextAvailableFetch = now + nextFetchInterval;
      return setTimeout(fetchMap, 100);
    } else {
      setTimeout(fetchMap, nextAvailableFetch - now);
      return nextAvailableFetch += nextFetchInterval;
    }
  };

  wiki.registerNeighbor = neighborhood.registerNeighbor = function(site) {
    var neighborInfo;
    if (wiki.neighborhood[site] != null) return;
    neighborInfo = {};
    wiki.neighborhood[site] = neighborInfo;
    populateSiteInfoFor(site, neighborInfo);
    return $('body').trigger('new-neighbor', site);
  };

  neighborhood.listNeighbors = function() {
    return _.keys(wiki.neighborhood);
  };

  neighborhood.search = function(searchQuery) {
    var finds, match, matchingPages, neighborInfo, neighborSite, sitemap, start, tally, tick, _ref2;
    finds = [];
    tally = {};
    tick = function(key) {
      if (tally[key] != null) {
        return tally[key]++;
      } else {
        return tally[key] = 1;
      }
    };
    match = function(key, text) {
      var hit;
      hit = (text != null) && text.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0;
      if (hit) tick(key);
      return hit;
    };
    start = Date.now();
    _ref2 = wiki.neighborhood;
    for (neighborSite in _ref2) {
      if (!__hasProp.call(_ref2, neighborSite)) continue;
      neighborInfo = _ref2[neighborSite];
      sitemap = neighborInfo.sitemap;
      if (sitemap != null) tick('sites');
      matchingPages = _.each(sitemap, function(page) {
        tick('pages');
        if (!(match('title', page.title) || match('text', page.synopsis) || match('slug', page.slug))) {
          return;
        }
        tick('finds');
        return finds.push({
          page: page,
          site: neighborSite,
          rank: 1
        });
      });
    }
    tally['msec'] = Date.now() - start;
    return {
      finds: finds,
      tally: tally
    };
  };

  $(function() {
    var $neighborhood, flag, search;
    $neighborhood = $('.neighborhood');
    flag = function(site) {
      return "<span class=\"neighbor\" data-site=\"" + site + "\">\n  <div class=\"wait\">\n    <img src=\"http://" + site + "/favicon.png\" title=\"" + site + "\">\n  </div>\n</span>";
    };
    $('body').on('new-neighbor', function(e, site) {
      return $neighborhood.append(flag(site));
    }).delegate('.neighbor img', 'click', function(e) {
      return wiki.doInternalLink('welcome-visitors', null, this.title);
    });
    search = createSearch({
      neighborhood: neighborhood
    });
    return $('input.search').on('keypress', function(e) {
      var searchQuery;
      if (e.keyCode !== 13) return;
      searchQuery = $(this).val();
      search.performSearch(searchQuery);
      return $(this).val("");
    });
  });

}).call(this);

});

require.define("/lib/search.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var active, createSearch, util;

  util = require('./util');

  active = require('./active');

  require('./dom');

  createSearch = function(_arg) {
    var neighborhood, performSearch;
    neighborhood = _arg.neighborhood;
    performSearch = function(searchQuery) {
      var $searchResultPage, explanatoryPara, result, searchResultPageData, searchResultReferences, searchResults, tally;
      searchResults = neighborhood.search(searchQuery);
      tally = searchResults.tally;
      explanatoryPara = {
        type: 'paragraph',
        id: util.randomBytes(8),
        text: "String '" + searchQuery + "' found on " + (tally.finds || 'none') + " of " + (tally.pages || 'no') + " pages from " + (tally.sites || 'no') + " sites.\nText matched on " + (tally.title || 'no') + " titles, " + (tally.text || 'no') + " paragraphs, and " + (tally.slug || 'no') + " slugs.\nElapsed time " + tally.msec + " milliseconds."
      };
      searchResultReferences = (function() {
        var _i, _len, _ref, _results;
        _ref = searchResults.finds;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          _results.push({
            "type": "reference",
            "id": util.randomBytes(8),
            "site": result.site,
            "slug": result.page.slug,
            "title": result.page.title,
            "text": result.page.synopsis || ''
          });
        }
        return _results;
      })();
      searchResultPageData = {
        title: "Search Results",
        story: [explanatoryPara].concat(searchResultReferences)
      };
      $searchResultPage = wiki.createPage('search-results').addClass('ghost');
      $searchResultPage.appendTo($('.main'));
      wiki.buildPage(searchResultPageData, null, $searchResultPage);
      return active.set($('.page').last());
    };
    return {
      performSearch: performSearch
    };
  };

  module.exports = createSearch;

}).call(this);

});

require.define("/lib/dom.coffee", function (require, module, exports, __dirname, __filename) {

  wiki.createPage = function(name, loc) {
    if (loc && loc !== 'view') {
      return $("<div/>").attr('id', name).attr('data-site', loc).addClass("page");
    } else {
      return $("<div/>").attr('id', name).addClass("page");
    }
  };

});

require.define("/test/plugin.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var plugin;

  plugin = require('../lib/plugin.coffee');

  describe('plugin', function() {
    var fakeDeferred;
    fakeDeferred = void 0;
    before(function() {
      $('<div id="plugin" />').appendTo('body');
      fakeDeferred = {};
      fakeDeferred.done = sinon.mock().returns(fakeDeferred);
      fakeDeferred.fail = sinon.mock().returns(fakeDeferred);
      return sinon.stub(jQuery, 'getScript').returns(fakeDeferred);
    });
    after(function() {
      return jQuery.getScript.restore();
    });
    it('should have default image type', function() {
      return expect(window.plugins).to.have.property('image');
    });
    it('should fetch a plugin script from the right location', function() {
      plugin.get('test');
      expect(jQuery.getScript.calledOnce).to.be(true);
      return expect(jQuery.getScript.args[0][0]).to.be('/plugins/test/test.js');
    });
    return it('should render a plugin', function() {
      var item;
      item = {
        type: 'paragraph',
        text: 'blah [[Link]] asdf'
      };
      plugin["do"]($('#plugin'), item);
      return expect($('#plugin').html()).to.be('<p>blah <a class="internal" href="/link.html" data-page-name="link" title="view">Link</a> asdf</p>');
    });
  });

}).call(this);

});

require.define("/test/revision.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var revision, util;

  util = require('../lib/util.coffee');

  revision = require('../lib/revision.coffee');

  describe('revision', function() {
    var data;
    data = {
      "title": "new-page",
      "story": [
        {
          "type": "paragraph",
          "id": "2b3e1bef708cb8d3",
          "text": "A new paragraph is now in first position"
        }, {
          "type": "paragraph",
          "id": "ee416d431ebf4fb4",
          "text": "Start writing. Read [[How to Wiki]] for more ideas."
        }, {
          "type": "paragraph",
          "id": "5bfaef3699a88622",
          "text": "Some paragraph text"
        }
      ],
      "journal": [
        {
          "type": "create",
          "id": "8311895173802a8e",
          "item": {
            "title": "new-page"
          },
          "date": 1340999639114
        }, {
          "item": {
            "type": "factory",
            "id": "5bfaef3699a88622"
          },
          "id": "5bfaef3699a88622",
          "type": "add",
          "date": 1341191691509
        }, {
          "type": "edit",
          "id": "5bfaef3699a88622",
          "item": {
            "type": "paragraph",
            "id": "5bfaef3699a88622",
            "text": "Some paragraph text"
          },
          "date": 1341191697815
        }, {
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": ""
          },
          "id": "2b3e1bef708cb8d3",
          "type": "add",
          "after": "5bfaef3699a88622",
          "date": 1341191698321
        }, {
          "type": "edit",
          "id": "2b3e1bef708cb8d3",
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph after the first"
          },
          "date": 1341191703725
        }, {
          "type": "add",
          "item": {
            "type": "paragraph",
            "id": "ee416d431ebf4fb4",
            "text": "Start writing. Read [[How to Wiki]] for more ideas."
          },
          "after": "5bfaef3699a88622",
          "id": "ee416d431ebf4fb4",
          "date": 1341193068611
        }, {
          "type": "move",
          "order": ["2b3e1bef708cb8d3", "ee416d431ebf4fb4", "5bfaef3699a88622"],
          "id": "2b3e1bef708cb8d3",
          "date": 1341191714682
        }, {
          "type": "edit",
          "id": "2b3e1bef708cb8d3",
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph is now"
          },
          "date": 1341191723289
        }, {
          "item": {
            "type": "paragraph",
            "id": "2dcb9c5558f21329",
            "text": " first"
          },
          "id": "2dcb9c5558f21329",
          "type": "add",
          "after": "2b3e1bef708cb8d3",
          "date": 1341191723794
        }, {
          "type": "remove",
          "id": "2dcb9c5558f21329",
          "date": 1341191725509
        }, {
          "type": "edit",
          "id": "2b3e1bef708cb8d3",
          "item": {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph is now in first position"
          },
          "date": 1341191748944
        }
      ]
    };
    it('an empty page should look like itself', function() {
      var emptyPage, version;
      emptyPage = util.emptyPage();
      version = revision.create(0, emptyPage);
      return expect(version).to.eql(emptyPage);
    });
    it('should shorten the journal to given revision', function() {
      var version;
      version = revision.create(1, data);
      return expect(version.journal.length).to.be(2);
    });
    it('should recreate story on given revision', function() {
      var version;
      version = revision.create(2, data);
      expect(version.story.length).to.be(1);
      return expect(version.story[0].text).to.be('Some paragraph text');
    });
    it('should accept revision as string', function() {
      var version;
      version = revision.create('1', data);
      return expect(version.journal.length).to.be(2);
    });
    return describe('journal entry types', function() {
      describe('create', function() {
        it('should use original title if item has no title', function() {
          var version;
          version = revision.create(0, data);
          return expect(version.title).to.eql('new-page');
        });
        return it('should define the title of the version', function() {
          var pageWithNewTitle, version;
          pageWithNewTitle = jQuery.extend(true, {}, data);
          pageWithNewTitle.journal[0].item.title = "new-title";
          version = revision.create(0, pageWithNewTitle);
          return expect(version.title).to.eql('new-title');
        });
      });
      describe('add', function() {
        describe('using a factory', function() {
          return it('should recover the factory as last item of the story', function() {
            var version;
            version = revision.create(1, data);
            return expect(version.story[0].type).to.be("factory");
          });
        });
        describe('dragging item from another page', function() {
          it('should place story item on dropped position', function() {
            var version;
            version = revision.create(5, data);
            return expect(version.story[1].text).to.be("Start writing. Read [[How to Wiki]] for more ideas.");
          });
          return it('should place story item at the end if dropped position is not defined', function() {
            var draggedItemWithoutAfter, version;
            draggedItemWithoutAfter = jQuery.extend(true, {}, data);
            delete draggedItemWithoutAfter.journal[5].after;
            version = revision.create(5, draggedItemWithoutAfter);
            return expect(version.story[2].text).to.be("Start writing. Read [[How to Wiki]] for more ideas.");
          });
        });
        return describe('splitting paragraph', function() {
          it('should place paragraphs after each other', function() {
            var version;
            version = revision.create(8, data);
            expect(version.story[0].text).to.be('A new paragraph is now');
            return expect(version.story[1].text).to.be(' first');
          });
          return it('should place new paragraph at the end if split item is not defined', function() {
            var splitParagraphWithoutAfter, version;
            splitParagraphWithoutAfter = jQuery.extend(true, {}, data);
            delete splitParagraphWithoutAfter.journal[8].after;
            version = revision.create(8, splitParagraphWithoutAfter);
            expect(version.story[0].text).to.be('A new paragraph is now');
            return expect(version.story[3].text).to.be(' first');
          });
        });
      });
      describe('edit', function() {
        it('should replace edited story item', function() {
          var version;
          version = revision.create(7, data);
          return expect(version.story[0].text).to.be('A new paragraph is now');
        });
        return it('should place item at the end if edited item is not found', function() {
          var editedItem, pageWithOnlyEdit, version;
          pageWithOnlyEdit = util.emptyPage();
          editedItem = {
            "type": "paragraph",
            "id": "2b3e1bef708cb8d3",
            "text": "A new paragraph"
          };
          pageWithOnlyEdit.journal.push({
            "type": "edit",
            "id": "2b3e1bef708cb8d3",
            "item": editedItem,
            "date": 1341191748944
          });
          version = revision.create(1, pageWithOnlyEdit);
          return expect(version.story[0].text).to.be('A new paragraph');
        });
      });
      describe('move', function() {
        return it('should reorder the story items according to move order', function() {
          var version;
          version = revision.create(5, data);
          expect(version.story[0].text).to.be('Some paragraph text');
          expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          expect(version.story[2].text).to.be('A new paragraph after the first');
          version = revision.create(6, data);
          expect(version.story[0].text).to.be('A new paragraph after the first');
          expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          return expect(version.story[2].text).to.be('Some paragraph text');
        });
      });
      return describe('remove', function() {
        return it('should remove the story item', function() {
          var version;
          version = revision.create(8, data);
          expect(version.story[0].text).to.be('A new paragraph is now');
          expect(version.story[1].text).to.be(' first');
          expect(version.story[2].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          expect(version.story[3].text).to.be('Some paragraph text');
          version = revision.create(9, data);
          expect(version.story[0].text).to.be('A new paragraph is now');
          expect(version.story[1].text).to.be('Start writing. Read [[How to Wiki]] for more ideas.');
          return expect(version.story[2].text).to.be('Some paragraph text');
        });
      });
    });
  });

}).call(this);

});

require.define("/test/neighborhood.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var neighborhood;

  neighborhood = require('../lib/neighborhood.coffee');

  describe('neighborhood', function() {
    describe('no neighbors', function() {
      return it('should return an empty array for our search', function() {
        var searchResult;
        searchResult = neighborhood.search("query string");
        return expect(searchResult.finds).to.eql([]);
      });
    });
    describe('a single neighbor with a few pages', function() {
      before(function() {
        var fakeSitemap, neighbor;
        fakeSitemap = [
          {
            title: 'Page One',
            slug: 'page-one',
            date: 'date1'
          }, {
            title: 'Page Two',
            slug: 'page-two',
            date: 'date2'
          }, {
            title: 'Page Three'
          }
        ];
        neighbor = {
          sitemap: fakeSitemap
        };
        wiki.neighborhood = {};
        return wiki.neighborhood['my-site'] = neighbor;
      });
      it('returns all pages that match the query', function() {
        var searchResult;
        searchResult = neighborhood.search("Page");
        return expect(searchResult.finds).to.have.length(3);
      });
      it('returns only pages that match the query', function() {
        var searchResult;
        searchResult = neighborhood.search("Page T");
        return expect(searchResult.finds).to.have.length(2);
      });
      it('should package the results in the correct format', function() {
        var expectedResult, searchResult;
        expectedResult = [
          {
            site: 'my-site',
            page: {
              title: 'Page Two',
              slug: 'page-two',
              date: 'date2'
            },
            rank: 1
          }
        ];
        searchResult = neighborhood.search("Page Two");
        return expect(searchResult.finds).to.eql(expectedResult);
      });
      return it('searches both the slug and the title');
    });
    describe('more than one neighbor', function() {
      before(function() {
        wiki.neighborhood = {};
        wiki.neighborhood['site-one'] = {
          sitemap: [
            {
              title: 'Page One from Site 1'
            }, {
              title: 'Page Two from Site 1'
            }, {
              title: 'Page Three from Site 1'
            }
          ]
        };
        return wiki.neighborhood['site-two'] = {
          sitemap: [
            {
              title: 'Page One from Site 2'
            }, {
              title: 'Page Two from Site 2'
            }, {
              title: 'Page Three from Site 2'
            }
          ]
        };
      });
      return it('returns matching pages from every neighbor', function() {
        var searchResult, sites;
        searchResult = neighborhood.search("Page Two");
        expect(searchResult.finds).to.have.length(2);
        sites = _.pluck(searchResult.finds, 'site');
        return expect(sites.sort()).to.eql(['site-one', 'site-two'].sort());
      });
    });
    return describe('an unpopulated neighbor', function() {
      before(function() {
        wiki.neighborhood = {};
        return wiki.neighborhood['unpopulated-site'] = {};
      });
      it('gracefully ignores unpopulated neighbors', function() {
        var searchResult;
        searchResult = neighborhood.search("some search query");
        return expect(searchResult.finds).to.be.empty();
      });
      return it('should re-populate the neighbor');
    });
  });

}).call(this);

});

require.define("/test/search.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var createSearch;

  createSearch = require('../lib/search.coffee');

  describe('search', function() {
    return xit('performs a search on the neighborhood', function() {
      var search, spyNeighborhood;
      spyNeighborhood = {
        search: sinon.stub().returns([])
      };
      search = createSearch({
        neighborhood: spyNeighborhood
      });
      search.performSearch('some search query');
      expect(spyNeighborhood.search.called).to.be(true);
      return expect(spyNeighborhood.search.args[0][0]).to.be('some search query');
    });
  });

}).call(this);

});

require.define("/changes.js", function (require, module, exports, __dirname, __filename) {
// Generated by CoffeeScript 1.3.3
(function() {
  var constructor, listItemHtml, pageBundle;

  listItemHtml = function(slug, page) {
    return "<li>\n  <a class=\"internal\" href=\"#\" title=\"local\" data-page-name=\"" + slug + "\" data-site=\"local\">\n    " + page.title + "\n  </a> \n  <button class=\"delete\">✕</button>\n</li>";
  };

  pageBundle = function() {
    var bundle, i, length, slug, _i;
    bundle = {};
    length = localStorage.length;
    for (i = _i = 0; 0 <= length ? _i < length : _i > length; i = 0 <= length ? ++_i : --_i) {
      slug = localStorage.key(i);
      bundle[slug] = JSON.parse(localStorage.getItem(slug));
    }
    return bundle;
  };

  constructor = function($, dependencies) {
    var bind, emit, localStorage;
    if (dependencies == null) {
      dependencies = {};
    }
    localStorage = dependencies.localStorage || window.localStorage;
    emit = function($div, item) {
      var i, page, slug, ul, _i, _ref;
      if (localStorage.length === 0) {
        $div.append('<ul><p>empty</p></ul>');
        return;
      }
      $div.append(ul = $('<ul />'));
      for (i = _i = 0, _ref = localStorage.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        slug = localStorage.key(i);
        page = JSON.parse(localStorage.getItem(slug));
        ul.append(listItemHtml(slug, page));
      }
      if (item.submit != null) {
        return ul.append("<button class=\"submit\">Submit Changes</button>");
      }
    };
    bind = function($div, item) {
      $div.on('click', '.delete', function() {
        var slug;
        slug = $(this).siblings('a.internal').data('pageName');
        localStorage.removeItem(slug);
        return emit($div.empty(), item);
      });
      $div.on('click', '.submit', function() {
        return $.ajax({
          type: 'PUT',
          url: "/submit",
          data: {
            'bundle': JSON.stringify(pageBundle())
          },
          success: function(citation, textStatus, jqXHR) {
            var before, beforeElement, itemElement, pageElement;
            wiki.log("ajax submit success", citation, textStatus, jqXHR);
            if (!(citation.type && citation.site)) {
              throw new Exception("Incomplete Submission");
            }
            pageElement = $div.parents('.page:first');
            itemElement = $("<div />", {
              "class": "item " + citation.type
            }).data('item', citation).attr('data-id', citation.id);
            itemElement.data('pageElement', pageElement);
            pageElement.find(".story").append(itemElement);
            wiki.doPlugin(itemElement, citation);
            beforeElement = itemElement.prev('.item');
            before = wiki.getItem(beforeElement);
            return wiki.pageHandler.put(pageElement, {
              item: citation,
              id: citation.id,
              type: "add",
              after: before != null ? before.id : void 0
            });
          },
          error: function(xhr, type, msg) {
            return wiki.log("ajax error callback", type, msg);
          }
        });
      });
      return $div.dblclick(function() {
        var bundle, count;
        bundle = pageBundle();
        count = _.size(bundle);
        return wiki.dialog("JSON bundle for " + count + " pages", $('<pre/>').text(JSON.stringify(bundle, null, 2)));
      });
    };
    return {
      emit: emit,
      bind: bind
    };
  };

  wiki.registerPlugin('changes', constructor);

  if (typeof module !== "undefined" && module !== null) {
    module.exports = constructor;
  }

}).call(this);

});

require.define("/testclient.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var util;
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

  util = require('./lib/util.coffee');

  wiki.resolveLinks = util.resolveLinks;

  wiki.resolutionContext = ['view'];

  require('./test/util.coffee');

  require('./test/active.coffee');

  require('./test/pageHandler.coffee');

  require('./test/refresh.coffee');

  require('./test/plugin.coffee');

  require('./test/revision.coffee');

  require('./test/neighborhood.coffee');

  require('./test/search.coffee');

  $(function() {
    $('<hr><h2> Testing artifacts:</h2>').appendTo('body');
    return mocha.run();
  });

}).call(this);

});
require("/testclient.coffee");

require.define("/test.coffee", function (require, module, exports, __dirname, __filename) {
    (function() {
  var createFakeLocalStorage, pluginCtor;

  pluginCtor = require('./changes');

  createFakeLocalStorage = function(initialContents) {
    var fake, getStoreSize, keys, store;
    if (initialContents == null) initialContents = {};
    store = initialContents;
    keys = function() {
      var k, _, _results;
      _results = [];
      for (k in store) {
        _ = store[k];
        _results.push(k);
      }
      return _results;
    };
    getStoreSize = function() {
      return keys().length;
    };
    fake = {
      setItem: function(k, v) {
        return store[k] = v;
      },
      getItem: function(k) {
        return store[k];
      },
      key: function(i) {
        return keys()[i];
      },
      removeItem: function(k) {
        return delete store[k];
      }
    };
    Object.defineProperty(fake, 'length', {
      get: getStoreSize
    });
    return fake;
  };

  describe('changes plugin', function() {
    var $div, clickDeleteForPageWithSlug, expectNumberOfPagesToBe, fakeLocalStore, installPlugin, makePlugin;
    fakeLocalStore = void 0;
    $div = void 0;
    beforeEach(function() {
      $div = $('<div/>');
      return fakeLocalStore = createFakeLocalStorage();
    });
    makePlugin = function() {
      return pluginCtor($, {
        localStorage: fakeLocalStore
      });
    };
    installPlugin = function() {
      var plugin;
      plugin = makePlugin();
      plugin.emit($div, {});
      return plugin.bind($div, {});
    };
    expectNumberOfPagesToBe = function(expectedLength) {
      return expect($div.find('li a').length).to.be(expectedLength);
    };
    clickDeleteForPageWithSlug = function(slug) {
      return $div.find("li a[data-page-name='" + slug + "']").siblings('button').trigger('click');
    };
    it("renders 'empty' when there are no local changes", function() {
      installPlugin();
      expect($div.html()).to.contain('empty');
      return expectNumberOfPagesToBe(0);
    });
    return describe('some pages in local store', function() {
      beforeEach(function() {
        return fakeLocalStore = createFakeLocalStorage({
          page1: JSON.stringify({
            title: "A Page"
          }),
          page2: JSON.stringify({
            title: "Another Page"
          }),
          page3: JSON.stringify({
            title: "Page the Third"
          })
        });
      });
      it("doesn't render 'empty'", function() {
        installPlugin();
        return expect($div.html()).not.to.contain('empty');
      });
      it("lists each page found in the local store", function() {
        var allTitles;
        installPlugin();
        expectNumberOfPagesToBe(3);
        allTitles = $div.find('li a').map(function(_, a) {
          return $(a).html();
        }).toArray().join('');
        expect(allTitles).to.contain('A Page');
        expect(allTitles).to.contain('Another Page');
        return expect(allTitles).to.contain('Page the Third');
      });
      it("removes a page from local store", function() {
        installPlugin();
        expect(fakeLocalStore.getItem('page2')).to.be.ok();
        clickDeleteForPageWithSlug('page2');
        return expect(fakeLocalStore.getItem('page2')).not.to.be.ok();
      });
      return it("updates the plugin div when a page is removed", function() {
        installPlugin();
        expectNumberOfPagesToBe(3);
        clickDeleteForPageWithSlug('page2');
        return expectNumberOfPagesToBe(2);
      });
    });
  });

}).call(this);

});
require("/test.coffee");
