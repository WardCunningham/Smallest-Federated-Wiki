(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

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
            x = path.normalize(x);
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
            var pkgfile = path.normalize(x + '/package.json');
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
        for (var key in obj) res.push(key);
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

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
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

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return window.setImmediate;
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/lib/wiki.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var createSynopsis, wiki,
    __slice = [].slice;

  createSynopsis = require('./synopsis.coffee');

  wiki = {
    createSynopsis: createSynopsis
  };

  wiki.log = function() {
    var things;
    things = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if ((typeof console !== "undefined" && console !== null ? console.log : void 0) != null) {
      return console.log.apply(console, things);
    }
  };

  wiki.asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  wiki.useLocalStorage = function() {
    return $(".login").length > 0;
  };

  wiki.resolutionContext = [];

  wiki.resolveFrom = function(addition, callback) {
    wiki.resolutionContext.push(addition);
    try {
      return callback();
    } finally {
      wiki.resolutionContext.pop();
    }
  };

  wiki.getData = function(vis) {
    var idx, who;
    if (vis) {
      idx = $('.item').index(vis);
      who = $(".item:lt(" + idx + ")").filter('.chart,.data,.calculator').last();
      if (who != null) {
        return who.data('item').data;
      } else {
        return {};
      }
    } else {
      who = $('.chart,.data,.calculator').last();
      if (who != null) {
        return who.data('item').data;
      } else {
        return {};
      }
    }
  };

  wiki.getDataNodes = function(vis) {
    var idx, who;
    if (vis) {
      idx = $('.item').index(vis);
      who = $(".item:lt(" + idx + ")").filter('.chart,.data,.calculator').toArray().reverse();
      return $(who);
    } else {
      who = $('.chart,.data,.calculator').toArray().reverse();
      return $(who);
    }
  };

  wiki.createPage = function(name, loc) {
    if (loc && loc !== 'view') {
      return $("<div/>").attr('id', name).attr('data-site', loc).addClass("page");
    } else {
      return $("<div/>").attr('id', name).addClass("page");
    }
  };

  wiki.getItem = function(element) {
    if ($(element).length > 0) {
      return $(element).data("item") || $(element).data('staticItem');
    }
  };

  wiki.resolveLinks = function(string) {
    var renderInternalLink;
    renderInternalLink = function(match, name) {
      var slug;
      slug = wiki.asSlug(name);
      return "<a class=\"internal\" href=\"/" + slug + ".html\" data-page-name=\"" + slug + "\" title=\"" + (wiki.resolutionContext.join(' => ')) + "\">" + name + "</a>";
    };
    return string.replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink).replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\" title=\"$1\" rel=\"nofollow\">$2 <img src=\"/images/external-link-ltr-icon.png\"></a>");
  };

  module.exports = wiki;

}).call(this);

});

require.define("/lib/synopsis.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {

  module.exports = function(page) {
    var p1, p2, synopsis;
    synopsis = page.synopsis;
    if ((page != null) && (page.story != null)) {
      p1 = page.story[0];
      p2 = page.story[1];
      if (p1 && p1.type === 'paragraph') {
        synopsis || (synopsis = p1.text);
      }
      if (p2 && p2.type === 'paragraph') {
        synopsis || (synopsis = p2.text);
      }
      if (p1 && (p1.text != null)) {
        synopsis || (synopsis = p1.text);
      }
      if (p2 && (p2.text != null)) {
        synopsis || (synopsis = p2.text);
      }
      synopsis || (synopsis = (page.story != null) && ("A page with " + page.story.length + " items."));
    } else {
      synopsis = 'A page with no story.';
    }
    return synopsis;
  };

}).call(this);

});

require.define("/test/util.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var timezoneOffset, util;

  util = require('../lib/util.coffee');

  timezoneOffset = function() {
    return (new Date(1333843344000)).getTimezoneOffset() * 60;
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
      s = wiki.asSlug('Welcome Visitors');
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

require.define("/lib/util.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var util;

  module.exports = wiki.util = util = {};

  util.symbols = {
    create: '☼',
    add: '+',
    edit: '✎',
    fork: '⚑',
    move: '↕',
    remove: '✕'
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
    if ((mins = secs / 60) < 2) {
      return "" + (Math.floor(secs)) + " seconds ago";
    }
    if ((hrs = mins / 60) < 2) {
      return "" + (Math.floor(mins)) + " minutes ago";
    }
    if ((days = hrs / 24) < 2) {
      return "" + (Math.floor(hrs)) + " hours ago";
    }
    if ((weeks = days / 7) < 2) {
      return "" + (Math.floor(days)) + " days ago";
    }
    if ((months = days / 31) < 2) {
      return "" + (Math.floor(weeks)) + " weeks ago";
    }
    if ((years = days / 365) < 2) {
      return "" + (Math.floor(months)) + " months ago";
    }
    return "" + (Math.floor(years)) + " years ago";
  };

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

}).call(this);

});

require.define("/test/active.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/lib/active.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/test/pageHandler.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var mockServer, pageHandler;

  pageHandler = require('../lib/pageHandler.coffee');

  mockServer = require('./mockServer.coffee');

  wiki.useLocalStorage = function() {
    return false;
  };

  describe('pageHandler.get', function() {
    var genericPageData, genericPageInformation, pageInformationWithoutSite;
    it('should have an empty context', function() {
      return expect(pageHandler.context).to.eql([]);
    });
    pageInformationWithoutSite = {
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
      pageHandler.put($('#pageHandler3'), action);
      expect(jQuery.ajax.args[0][0].data).to.eql({
        action: JSON.stringify(action)
      });
      return done();
    });
    return after(function() {
      return jQuery.ajax.restore();
    });
  });

}).call(this);

});

require.define("/lib/pageHandler.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var addToJournal, pageFromLocalStorage, pageHandler, pushToLocal, pushToServer, recursiveGet, revision, state, util;

  util = require('./util.coffee');

  state = require('./state.coffee');

  revision = require('./revision.coffee');

  addToJournal = require('./addToJournal.coffee');

  module.exports = pageHandler = {};

  pageFromLocalStorage = function(slug) {
    var json;
    if (json = localStorage[slug]) {
      return JSON.parse(json);
    } else {
      return void 0;
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
    if (site === 'view') {
      site = null;
    }
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
        if (rev) {
          page = revision.create(rev, page);
        }
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
    if (!pageInformation.site) {
      if (localPage = pageFromLocalStorage(pageInformation.slug)) {
        if (pageInformation.rev) {
          localPage = revision.create(pageInformation.rev, localPage);
        }
        return whenGotten(localPage, 'local');
      }
    }
    if (!pageHandler.context.length) {
      pageHandler.context = ['view'];
    }
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
    if (page.journal == null) {
      page.journal = [];
    }
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
    return addToJournal(pageElement.find('.journal'), action);
  };

  pushToServer = function(pageElement, pagePutInfo, action) {
    return $.ajax({
      type: 'PUT',
      url: "/page/" + pagePutInfo.slug + "/action",
      data: {
        'action': JSON.stringify(action)
      },
      success: function() {
        addToJournal(pageElement.find('.journal'), action);
        if (action.type === 'fork') {
          localStorage.removeItem(pageElement.attr('id'));
          return state.setUrl;
        }
      },
      error: function(xhr, type, msg) {
        return wiki.log("pageHandler.put ajax error callback", type, msg);
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
    wiki.log('pageHandler.put', action, pagePutInfo);
    if (wiki.useLocalStorage()) {
      if (pagePutInfo.site != null) {
        wiki.log('remote => local');
      } else if (!pagePutInfo.local) {
        wiki.log('origin => local');
        action.site = forkFrom = location.host;
      }
    }
    action.date = (new Date()).getTime();
    if (action.site === 'origin') {
      delete action.site;
    }
    if (forkFrom) {
      pageElement.find('h1 img').attr('src', '/favicon.png');
      pageElement.find('h1 a').attr('href', '/');
      pageElement.data('site', null);
      pageElement.removeClass('remote');
      state.setUrl();
      if (action.type !== 'fork') {
        action.fork = forkFrom;
        addToJournal(pageElement.find('.journal'), {
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

require.define("/lib/state.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var active, state,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  active = require('./active.coffee');

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
        var _i, _len, _results;
        _results = [];
        for (idx = _i = 0, _len = pages.length; _i < _len; idx = ++_i) {
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
    var idx, name, newLocs, newPages, old, oldLocs, oldPages, previous, _i, _len, _ref;
    oldPages = state.pagesInDom();
    newPages = state.urlPages();
    oldLocs = state.locsInDom();
    newLocs = state.urlLocs();
    if (!location.pathname || location.pathname === '/') {
      return;
    }
    previous = $('.page').eq(0);
    for (idx = _i = 0, _len = newPages.length; _i < _len; idx = ++_i) {
      name = newPages[idx];
      if (name !== oldPages[idx]) {
        old = $('.page').eq(idx);
        if (old) {
          old.remove();
        }
        wiki.createPage(name, newLocs[idx]).insertAfter(previous).each(wiki.refresh);
      }
      previous = $('.page').eq(idx);
    }
    previous.nextAll().remove();
    active.set($('.page').last());
    return document.title = (_ref = $('.page:last').data('data')) != null ? _ref.title : void 0;
  };

  state.first = function() {
    var firstUrlLocs, firstUrlPages, idx, oldPages, urlPage, _i, _len, _results;
    state.setUrl();
    firstUrlPages = state.urlPages();
    firstUrlLocs = state.urlLocs();
    oldPages = state.pagesInDom();
    _results = [];
    for (idx = _i = 0, _len = firstUrlPages.length; _i < _len; idx = ++_i) {
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

require.define("/lib/revision.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var create;

  create = function(revIndex, data) {
    var afterIndex, editIndex, itemId, items, journal, journalEntry, removeIndex, revJournal, revStory, revStoryIds, revTitle, storyItem, _i, _j, _k, _len, _len1, _len2, _ref;
    journal = data.journal;
    revTitle = data.title;
    revStory = [];
    revJournal = journal.slice(0, +(+revIndex) + 1 || 9e9);
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
          items = {};
          for (_j = 0, _len1 = revStory.length; _j < _len1; _j++) {
            storyItem = revStory[_j];
            items[storyItem.id] = storyItem;
          }
          revStory = [];
          _ref = journalEntry.order;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
            itemId = _ref[_k];
            if (items[itemId] != null) {
              revStory.push(items[itemId]);
            }
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

require.define("/lib/addToJournal.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var util;

  util = require('./util.coffee');

  module.exports = function(journalElement, action) {
    var actionElement, actionTitle, controls, pageElement, prev;
    pageElement = journalElement.parents('.page:first');
    if (action.type === 'edit') {
      prev = journalElement.find(".edit[data-id=" + (action.id || 0) + "]");
    }
    actionTitle = action.type;
    if (action.date != null) {
      actionTitle += " " + (util.formatElapsedTime(action.date));
    }
    actionElement = $("<a href=\"#\" /> ").addClass("action").addClass(action.type).text(util.symbols[action.type]).attr('title', actionTitle).attr('data-id', action.id || "0").data('action', action);
    controls = journalElement.children('.control-buttons');
    if (controls.length > 0) {
      actionElement.insertBefore(controls);
    } else {
      actionElement.appendTo(journalElement);
    }
    if (action.type === 'fork' && (action.site != null)) {
      return actionElement.css("background-image", "url(//" + action.site + "/favicon.png)").attr("href", "//" + action.site + "/" + (pageElement.attr('id')) + ".html").data("site", action.site).data("slug", pageElement.attr('id'));
    }
  };

}).call(this);

});

require.define("/test/mockServer.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var simulatePageFound, simulatePageNotFound;

  simulatePageNotFound = function() {
    var xhrFor404;
    xhrFor404 = {
      status: 404
    };
    return sinon.stub(jQuery, "ajax").yieldsTo('error', xhrFor404);
  };

  simulatePageFound = function(pageToReturn) {
    if (pageToReturn == null) {
      pageToReturn = {};
    }
    return sinon.stub(jQuery, "ajax").yieldsTo('success', pageToReturn);
  };

  module.exports = {
    simulatePageNotFound: simulatePageNotFound,
    simulatePageFound: simulatePageFound
  };

}).call(this);

});

require.define("/test/refresh.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/lib/refresh.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var addToJournal, buildPageHeader, createFactory, emitHeader, emitTwins, handleDragging, initAddButton, initDragging, neighborhood, pageHandler, plugin, refresh, renderPageIntoPageElement, state, util, wiki,
    __slice = [].slice;

  util = require('./util.coffee');

  pageHandler = require('./pageHandler.coffee');

  plugin = require('./plugin.coffee');

  state = require('./state.coffee');

  neighborhood = require('./neighborhood.coffee');

  addToJournal = require('./addToJournal.coffee');

  wiki = require('./wiki.coffee');

  handleDragging = function(evt, ui) {
    var action, before, beforeElement, destinationPageElement, equals, item, itemElement, moveFromPage, moveToPage, moveWithinPage, order, sourcePageElement, sourceSite, thisPageElement;
    itemElement = ui.item;
    item = wiki.getItem(itemElement);
    thisPageElement = $(this).parents('.page:first');
    sourcePageElement = itemElement.data('pageElement');
    sourceSite = sourcePageElement.data('site');
    destinationPageElement = itemElement.parents('.page:first');
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

  initDragging = function($page) {
    var $story;
    $story = $page.find('.story');
    return $story.sortable({
      connectWith: '.page .story'
    }).on("sortupdate", handleDragging);
  };

  initAddButton = function($page) {
    return $page.find(".add-factory").live("click", function(evt) {
      if ($page.hasClass('ghost')) {
        return;
      }
      evt.preventDefault();
      return createFactory($page);
    });
  };

  createFactory = function($page) {
    var before, beforeElement, item, itemElement;
    item = {
      type: "factory",
      id: util.randomBytes(8)
    };
    itemElement = $("<div />", {
      "class": "item factory"
    }).data('item', item).attr('data-id', item.id);
    itemElement.data('pageElement', $page);
    $page.find(".story").append(itemElement);
    plugin["do"](itemElement, item);
    beforeElement = itemElement.prev('.item');
    before = wiki.getItem(beforeElement);
    return pageHandler.put($page, {
      item: item,
      id: item.id,
      type: "add",
      after: before != null ? before.id : void 0
    });
  };

  buildPageHeader = function(_arg) {
    var favicon_src, header_href, title, tooltip;
    title = _arg.title, tooltip = _arg.tooltip, header_href = _arg.header_href, favicon_src = _arg.favicon_src;
    return "<h1 title=\"" + tooltip + "\"><a href=\"" + header_href + "\"><img src=\"" + favicon_src + "\" height=\"32px\" class=\"favicon\"></a> " + title + "</h1>";
  };

  emitHeader = function($header, $page, page) {
    var date, header, isRemotePage, pageHeader, rev, site, viewHere;
    site = $page.data('site');
    isRemotePage = (site != null) && site !== 'local' && site !== 'origin' && site !== 'view';
    header = '';
    viewHere = wiki.asSlug(page.title) === 'welcome-visitors' ? "" : "/view/" + (wiki.asSlug(page.title));
    pageHeader = isRemotePage ? buildPageHeader({
      tooltip: site,
      header_href: "//" + site + "/view/welcome-visitors" + viewHere,
      favicon_src: "http://" + site + "/favicon.png",
      title: page.title
    }) : buildPageHeader({
      tooltip: location.host,
      header_href: "/view/welcome-visitors" + viewHere,
      favicon_src: "/favicon.png",
      title: page.title
    });
    $header.append(pageHeader);
    if (!isRemotePage) {
      $('img.favicon', $page).error(function(e) {
        return plugin.get('favicon', function(favicon) {
          return favicon.create();
        });
      });
    }
    if ($page.attr('id').match(/_rev/)) {
      rev = page.journal.length - 1;
      date = page.journal[rev].date;
      $page.addClass('ghost').data('rev', rev);
      return $header.append($("<h2 class=\"revision\">\n  <span>\n    " + (date != null ? util.formatDate(date) : "Revision " + rev) + "\n  </span>\n</h2>"));
    }
  };

  emitTwins = wiki.emitTwins = function($page) {
    var actions, bin, bins, flags, i, info, item, legend, page, remoteSite, site, slug, twins, viewing, _i, _len, _ref, _ref1, _ref2, _ref3;
    page = $page.data('data');
    site = $page.data('site') || window.location.host;
    if (site === 'view' || site === 'origin') {
      site = window.location.host;
    }
    slug = wiki.asSlug(page.title);
    if (((actions = (_ref = page.journal) != null ? _ref.length : void 0) != null) && ((viewing = (_ref1 = page.journal[actions - 1]) != null ? _ref1.date : void 0) != null)) {
      viewing = Math.floor(viewing / 1000) * 1000;
      bins = {
        newer: [],
        same: [],
        older: []
      };
      _ref2 = wiki.neighborhood;
      for (remoteSite in _ref2) {
        info = _ref2[remoteSite];
        if (remoteSite !== site && (info.sitemap != null)) {
          _ref3 = info.sitemap;
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            item = _ref3[_i];
            if (item.slug === slug) {
              bin = item.date > viewing ? bins.newer : item.date < viewing ? bins.older : bins.same;
              bin.push({
                remoteSite: remoteSite,
                item: item
              });
            }
          }
        }
      }
      twins = [];
      for (legend in bins) {
        bin = bins[legend];
        if (!bin.length) {
          continue;
        }
        bin.sort(function(a, b) {
          return a.item.date < b.item.date;
        });
        flags = (function() {
          var _j, _len1, _ref4, _results;
          _results = [];
          for (i = _j = 0, _len1 = bin.length; _j < _len1; i = ++_j) {
            _ref4 = bin[i], remoteSite = _ref4.remoteSite, item = _ref4.item;
            if (i >= 8) {
              break;
            }
            _results.push("<img class=\"remote\"\nsrc=\"http://" + remoteSite + "/favicon.png\"\ndata-slug=\"" + slug + "\"\ndata-site=\"" + remoteSite + "\"\ntitle=\"" + remoteSite + "\">");
          }
          return _results;
        })();
        twins.push("" + (flags.join('&nbsp;')) + " " + legend);
      }
      if (twins) {
        return $page.find('.twins').html("<p>" + (twins.join(", ")) + "</p>");
      }
    }
  };

  renderPageIntoPageElement = function(pageData, $page, siteFound) {
    var $footer, $header, $journal, $story, $twins, action, addContext, context, emitItem, page, site, slug, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    page = $.extend(util.emptyPage(), pageData);
    $page.data("data", page);
    slug = $page.attr('id');
    site = $page.data('site');
    context = ['view'];
    if (site != null) {
      context.push(site);
    }
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
    _ref1 = ['twins', 'header', 'story', 'journal', 'footer'].map(function(className) {
      return $("<div />").addClass(className).appendTo($page);
    }), $twins = _ref1[0], $header = _ref1[1], $story = _ref1[2], $journal = _ref1[3], $footer = _ref1[4];
    emitHeader($header, $page, page);
    emitItem = function(i) {
      var $item, item;
      if (i >= page.story.length) {
        return;
      }
      item = page.story[i];
      if ((item != null ? item.type : void 0) && (item != null ? item.id : void 0)) {
        $item = $("<div class=\"item " + item.type + "\" data-id=\"" + item.id + "\">");
        $story.append($item);
        return plugin["do"]($item, item, function() {
          return emitItem(i + 1);
        });
      } else {
        $story.append($("<div><p class=\"error\">Can't make sense of story[" + i + "]</p></div>"));
        return emitItem(i + 1);
      }
    };
    emitItem(0);
    _ref2 = page.journal;
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      action = _ref2[_j];
      addToJournal($journal, action);
    }
    emitTwins($page);
    $journal.append("<div class=\"control-buttons\">\n  <a href=\"#\" class=\"button fork-page\" title=\"fork this page\">" + util.symbols['fork'] + "</a>\n  <a href=\"#\" class=\"button add-factory\" title=\"add paragraph\">" + util.symbols['add'] + "</a>\n</div>");
    return $footer.append("<a id=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/\">CC BY-SA 3.0</a> .\n<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a> .\n<a>" + (siteFound || 'origin') + "</a>");
  };

  wiki.buildPage = function(data, siteFound, $page) {
    if (siteFound === 'local') {
      $page.addClass('local');
    } else if (siteFound) {
      if (siteFound === window.location.host) {
        siteFound = 'origin';
      }
      if (siteFound !== 'view' && siteFound !== 'origin') {
        $page.addClass('remote');
      }
      $page.data('site', siteFound);
    }
    renderPageIntoPageElement(data, $page, siteFound);
    state.setUrl();
    initDragging($page);
    initAddButton($page);
    return $page;
  };

  module.exports = refresh = wiki.refresh = function() {
    var $page, createGhostPage, pageInformation, registerNeighbors, rev, slug, whenGotten, _ref;
    $page = $(this);
    _ref = $page.attr('id').split('_rev'), slug = _ref[0], rev = _ref[1];
    pageInformation = {
      slug: slug,
      rev: rev,
      site: $page.data('site')
    };
    createGhostPage = function() {
      var heading, hits, info, page, result, site, title, _ref1, _ref2;
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
      _ref1 = wiki.neighborhood;
      for (site in _ref1) {
        info = _ref1[site];
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
        (_ref2 = page.story).push.apply(_ref2, [heading].concat(__slice.call(hits)));
        page.story[0].text = 'We could not find this page in the expected context.';
      }
      return wiki.buildPage(page, void 0, $page).addClass('ghost');
    };
    registerNeighbors = function(data, site) {
      var action, item, _i, _j, _len, _len1, _ref1, _ref2, _results;
      if (_.include(['local', 'origin', 'view', null, void 0], site)) {
        neighborhood.registerNeighbor(location.host);
      } else {
        neighborhood.registerNeighbor(site);
      }
      _ref1 = data.story || [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        item = _ref1[_i];
        if (item.site != null) {
          neighborhood.registerNeighbor(item.site);
        }
      }
      _ref2 = data.journal || [];
      _results = [];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        action = _ref2[_j];
        if (action.site != null) {
          _results.push(neighborhood.registerNeighbor(action.site));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    whenGotten = function(data, siteFound) {
      wiki.buildPage(data, siteFound, $page);
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

require.define("/lib/plugin.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var getScript, plugin, scripts, util;

  util = require('./util.coffee');

  module.exports = plugin = {};

  scripts = {};

  getScript = wiki.getScript = function(url, callback) {
    if (callback == null) {
      callback = function() {};
    }
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
    if (window.plugins[name]) {
      return callback(window.plugins[name]);
    }
    return getScript("/plugins/" + name + "/" + name + ".js", function() {
      if (window.plugins[name]) {
        return callback(window.plugins[name]);
      }
      return getScript("/plugins/" + name + ".js", function() {
        return callback(window.plugins[name]);
      });
    });
  };

  plugin["do"] = wiki.doPlugin = function(div, item, done) {
    var error;
    if (done == null) {
      done = function() {};
    }
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
        var text, _i, _len, _ref, _results;
        _ref = item.text.split(/\n\n+/);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          text = _ref[_i];
          if (text.match(/\S/)) {
            _results.push(div.append("<p>" + (wiki.resolveLinks(text)) + "</p>"));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
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
        return div.append("<img class=thumbnail src=\"" + item.url + "\"> <p>" + (wiki.resolveLinks(item.text)) + "</p>");
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

require.define("/lib/neighborhood.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var active, createSearch, neighborhood, nextAvailableFetch, nextFetchInterval, populateSiteInfoFor, util, _ref,
    __hasProp = {}.hasOwnProperty;

  active = require('./active.coffee');

  util = require('./util.coffee');

  createSearch = require('./search.coffee');

  module.exports = neighborhood = {};

  if ((_ref = wiki.neighborhood) == null) {
    wiki.neighborhood = {};
  }

  nextAvailableFetch = 0;

  nextFetchInterval = 2000;

  populateSiteInfoFor = function(site, neighborInfo) {
    var fetchMap, now, transition;
    if (neighborInfo.sitemapRequestInflight) {
      return;
    }
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
        transition(site, 'fetch', 'done');
        return $('body').trigger('new-neighbor-done', site);
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
    if (wiki.neighborhood[site] != null) {
      return;
    }
    neighborInfo = {};
    wiki.neighborhood[site] = neighborInfo;
    populateSiteInfoFor(site, neighborInfo);
    return $('body').trigger('new-neighbor', site);
  };

  neighborhood.listNeighbors = function() {
    return _.keys(wiki.neighborhood);
  };

  neighborhood.search = function(searchQuery) {
    var finds, match, matchingPages, neighborInfo, neighborSite, sitemap, start, tally, tick, _ref1;
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
      if (hit) {
        tick(key);
      }
      return hit;
    };
    start = Date.now();
    _ref1 = wiki.neighborhood;
    for (neighborSite in _ref1) {
      if (!__hasProp.call(_ref1, neighborSite)) continue;
      neighborInfo = _ref1[neighborSite];
      sitemap = neighborInfo.sitemap;
      if (sitemap != null) {
        tick('sites');
      }
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
      if (e.keyCode !== 13) {
        return;
      }
      searchQuery = $(this).val();
      search.performSearch(searchQuery);
      return $(this).val("");
    });
  });

}).call(this);

});

require.define("/lib/search.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var active, createSearch, util;

  util = require('./util.coffee');

  active = require('./active.coffee');

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

require.define("/test/plugin.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/test/revision.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/test/neighborhood.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/test/search.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
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

require.define("/plugins/calendar/calendar.js",function(require,module,exports,__dirname,__filename,process,global){// Generated by CoffeeScript 1.4.0
(function() {
  var apply, bind, emit, format, months, parse, show, span, spans;

  months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  spans = ['EARLY', 'LATE', 'DECADE', 'DAY', 'MONTH', 'YEAR'];

  span = function(result, span) {
    var m;
    if ((m = spans.indexOf(result.span)) < 0) {
      return result.span = span;
    } else if ((spans.indexOf(span)) < m) {
      return result.span = span;
    }
  };

  parse = function(text) {
    var i, line, m, result, rows, word, words, _i, _j, _len, _len1, _ref;
    rows = [];
    _ref = text.split(/\n/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      result = {};
      words = line.match(/\S+/g);
      for (i = _j = 0, _len1 = words.length; _j < _len1; i = ++_j) {
        word = words[i];
        if (word.match(/^\d\d\d\d$/)) {
          result.year = +word;
          span(result, 'YEAR');
        } else if (m = word.match(/^(\d0)S$/)) {
          result.year = +m[1] + 1900;
          span(result, 'DECADE');
        } else if ((m = spans.indexOf(word)) >= 0) {
          result.span = spans[m];
        } else if ((m = months.indexOf(word.slice(0, 3))) >= 0) {
          result.month = m + 1;
          span(result, 'MONTH');
        } else if (m = word.match(/^([1-3]?[0-9])$/)) {
          result.day = +m[1];
          span(result, 'DAY');
        } else {
          result.label = words.slice(i, 1000).join(' ');
          break;
        }
      }
      rows.push(result);
    }
    return rows;
  };

  apply = function(input, output, date, rows) {
    var result, row, _i, _len, _ref, _ref1;
    result = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      if (((_ref = input[row.label]) != null ? _ref.date : void 0) != null) {
        date = input[row.label].date;
      }
      if (((_ref1 = output[row.label]) != null ? _ref1.date : void 0) != null) {
        date = output[row.label].date;
      }
      if (row.year != null) {
        date = new Date(row.year, 1 - 1);
      }
      if (row.month != null) {
        date = new Date(date.getYear() + 1900, row.month - 1);
      }
      if (row.day != null) {
        date = new Date(date.getYear() + 1900, date.getMonth(), row.day);
      }
      if (row.label != null) {
        output[row.label] = {
          date: date
        };
        if (row.span != null) {
          output[row.label].span = row.span;
        }
      }
      row.date = date;
      result.push(row);
    }
    return result;
  };

  show = function(date, span) {
    switch (span) {
      case 'YEAR':
        return date.getFullYear();
      case 'DECADE':
        return "" + (date.getFullYear()) + "'S";
      case 'EARLY':
        return "Early " + (date.getFullYear()) + "'S";
      case 'LATE':
        return "Late " + (date.getFullYear()) + "'S";
      case 'MONTH':
        return "" + months[date.getMonth()] + " " + (date.getFullYear());
      default:
        return "" + (date.getDate()) + " " + months[date.getMonth()] + " " + (date.getFullYear());
    }
  };

  format = function(rows) {
    var row, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      _results.push("<tr><td>" + (show(row.date, row.span)) + "<td>" + row.label);
    }
    return _results;
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      parse: parse,
      apply: apply,
      format: format
    };
  }

  emit = function(div, item) {
    var results, rows;
    rows = parse(item.text);
    wiki.log('calendar rows', rows);
    results = apply({}, {}, new Date(), rows);
    wiki.log('calendar results', results);
    return div.append("<table style=\"width:100%; background:#eee; padding:.8em; margin-bottom:5px;\">" + (format(results).join('')) + "</table>");
  };

  bind = function(div, item) {
    return div.dblclick(function() {
      return wiki.textEditor(div, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.calendar = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);

});

require.define("/plugins/changes/changes.js",function(require,module,exports,__dirname,__filename,process,global){// Generated by CoffeeScript 1.4.0
(function() {
  var constructor, listItemHtml, pageBundle;

  listItemHtml = function(slug, page) {
    return "<li><a class=\"internal\" href=\"#\" title=\"local\" data-page-name=\"" + slug + "\" data-site=\"local\">" + page.title + "</a> <button class=\"delete\">✕</button></li>";
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

require.define("/plugins/efficiency/efficiency.js",function(require,module,exports,__dirname,__filename,process,global){// Generated by CoffeeScript 1.4.0
(function() {

  window.plugins.efficiency = {
    emit: function(div, item) {
      div.addClass('data');
      $('<p />').addClass('readout').appendTo(div).text("0%");
      return $('<p />').html(wiki.resolveLinks(item.text || 'efficiency')).appendTo(div);
    },
    bind: function(div, item) {
      var calculate, calculatePercentage, display, getImageData, lastThumb, locate;
      lastThumb = null;
      div.find('p:first').dblclick(function(e) {
        return wiki.dialog("JSON for " + item.text, $('<pre/>').text("something good"));
      });
      div.find('p:last').dblclick(function() {
        return wiki.textEditor(div, item);
      });
      locate = function() {
        var idx;
        idx = $('.item').index(div);
        return $(".item:lt(" + idx + ")").filter('.image:last');
      };
      calculate = function(div) {
        return calculatePercentage(getImageData(div));
      };
      display = function(value) {
        return div.find('p:first').text("" + (value.toFixed(1)) + "%");
      };
      getImageData = function(div) {
        var c, d, h, imageData, img, w;
        img = new Image;
        img.src = $(div).data('item').url;
        w = img.width;
        h = img.height;
        c = $('<canvas id="myCanvas" width="#{w}" height="#{h}">');
        d = c.get(0).getContext("2d");
        d.drawImage(img, 0, 0);
        imageData = d.getImageData(0, 0, w, h);
        return imageData.data;
      };
      calculatePercentage = function(data) {
        var lumas;
        lumas = window.plugins.efficiency.getGrayLumaFromRGBT(data);
        return window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      };
      return display(calculate(locate()));
    },
    getGrayLumaFromRGBT: function(rgbt) {
      var B, G, R, i, lumas, numPix, _i, _ref;
      numPix = rgbt.length / 4;
      lumas = [];
      for (i = _i = 0, _ref = numPix - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        R = rgbt[i * 4 + 0];
        G = rgbt[i * 4 + 1];
        B = rgbt[i * 4 + 2];
        lumas[i] = (0.30 * R) + (0.60 * G) + (0.10 * B);
      }
      return lumas;
    },
    calculateStrategy_GrayBinary: function(lumas) {
      var l, lumaHighCount, lumaLowCount, lumaMax, lumaMid, lumaMin, numLumas, percentage, _i, _len;
      lumaMin = Math.min.apply(Math, lumas);
      lumaMax = Math.max.apply(Math, lumas);
      numLumas = lumas.length;
      lumaMid = (lumaMax - lumaMin) / 2.0 + lumaMin;
      lumaLowCount = 0;
      lumaHighCount = 0;
      for (_i = 0, _len = lumas.length; _i < _len; _i++) {
        l = lumas[_i];
        if (l <= lumaMid) {
          lumaLowCount++;
        } else {
          lumaHighCount++;
        }
      }
      percentage = lumaHighCount / numLumas * 100;
      return percentage;
    },
    calculateStrategy_GrayIterativeClustering: function(lumas) {
      var MAX_TRIES, THRESHOLD_CONVERGENCE_GOAL, high, l, low, lumaAvgHigh, lumaAvgLow, lumaHighCount, lumaHighTotal, lumaLowCount, lumaLowTotal, lumaMax, lumaMin, lumasHigh, lumasLow, numLumas, numPix, numTries, percentage, threshold, thresholdDiff, thresholdInitial, _i, _j, _k, _len, _len1, _len2;
      THRESHOLD_CONVERGENCE_GOAL = 5;
      MAX_TRIES = 10;
      lumaMin = Math.min.apply(Math, lumas);
      lumaMax = Math.max.apply(Math, lumas);
      numLumas = lumas.length;
      numPix = numLumas;
      thresholdInitial = (lumaMax - lumaMin) / 2 + lumaMin;
      threshold = thresholdInitial;
      lumaHighCount = 0;
      numTries = 0;
      while (numTries < MAX_TRIES) {
        numTries++;
        lumasLow = [];
        lumasHigh = [];
        lumaLowCount = 0;
        lumaHighCount = 0;
        for (_i = 0, _len = lumas.length; _i < _len; _i++) {
          l = lumas[_i];
          if (l <= threshold) {
            lumasLow.push(l);
            lumaLowCount++;
          } else {
            if (l !== NaN) {
              lumasHigh.push(l);
              lumaHighCount++;
            }
          }
        }
        lumaLowTotal = 0;
        for (_j = 0, _len1 = lumasLow.length; _j < _len1; _j++) {
          low = lumasLow[_j];
          if (!isNaN(low)) {
            lumaLowTotal += low;
          } else {

          }
        }
        lumaAvgLow = 0;
        if (lumaLowCount > 0) {
          lumaAvgLow = lumaLowTotal / lumaLowCount;
        }
        lumaHighTotal = 0;
        for (_k = 0, _len2 = lumasHigh.length; _k < _len2; _k++) {
          high = lumasHigh[_k];
          if (!isNaN(high)) {
            lumaHighTotal += high;
          } else {

          }
        }
        lumaAvgHigh = 0;
        if (lumaHighCount > 0) {
          lumaAvgHigh = lumaHighTotal / lumaHighCount;
        }
        threshold = (lumaAvgHigh - lumaAvgLow) / 2 + lumaAvgLow;
        thresholdDiff = Math.abs(threshold - thresholdInitial);
        if (thresholdDiff <= THRESHOLD_CONVERGENCE_GOAL || numTries > MAX_TRIES) {
          break;
        } else {
          thresholdInitial = threshold;
        }
      }
      percentage = lumaHighCount / numPix * 100;
      if (percentage > 100.0) {
        percentage = 100;
      }
      return percentage;
    }
  };

}).call(this);

});

require.define("/plugins/report/report.js",function(require,module,exports,__dirname,__filename,process,global){// Generated by CoffeeScript 1.4.0
(function() {
  var advance, bind, emit, enumerate, explain, hours, human, intervals, months, parse, primAdvance, soon, summarize, wdays,
    __slice = [].slice;

  enumerate = function() {
    var i, k, keys, obj, _i, _len;
    keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    obj = {
      keys: keys
    };
    for (i = _i = 0, _len = keys.length; _i < _len; i = ++_i) {
      k = keys[i];
      obj[k] = i + 1;
    }
    return obj;
  };

  intervals = enumerate('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

  hours = enumerate('MIDNIGHT', 'MORNING', 'NOON', 'EVENING');

  wdays = enumerate('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

  months = enumerate('JANUARY', 'FEBUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER');

  parse = function(text) {
    var issue, schedule, word, _i, _len, _ref;
    schedule = [];
    issue = null;
    _ref = text.match(/\S+/g) || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      word = _ref[_i];
      try {
        if (intervals[word]) {
          schedule.push(issue = {
            interval: word,
            recipients: [],
            offsets: []
          });
        } else if (months[word] || wdays[word] || hours[word]) {
          issue.offsets.push(word);
        } else if (word.match(/@/)) {
          issue.recipients.push(word);
        } else {
          schedule.push({
            trouble: word
          });
        }
      } catch (e) {
        schedule.push({
          trouble: e.message
        });
      }
    }
    return schedule;
  };

  human = function(msecs) {
    var days, hrs, mins, secs, weeks, years;
    if ((secs = msecs / 1000) < 2) {
      return "" + (Math.floor(msecs)) + " milliseconds";
    }
    if ((mins = secs / 60) < 2) {
      return "" + (Math.floor(secs)) + " seconds";
    }
    if ((hrs = mins / 60) < 2) {
      return "" + (Math.floor(mins)) + " minutes";
    }
    if ((days = hrs / 24) < 2) {
      return "" + (Math.floor(hrs)) + " hours";
    }
    if ((weeks = days / 7) < 2) {
      return "" + (Math.floor(days)) + " days";
    }
    if ((months = days / 30.5) < 2) {
      return "" + (Math.floor(weeks)) + " weeks";
    }
    if ((years = days / 365) < 2) {
      return "" + (Math.floor(months)) + " months";
    }
    return "" + (Math.floor(years)) + " years";
  };

  primAdvance = function(date, issue, count) {
    var d, h, m, offset, result, y, _i, _len, _ref, _ref1, _ref2;
    _ref = [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()], y = _ref[0], m = _ref[1], d = _ref[2], h = _ref[3];
    result = (function() {
      switch (issue.interval) {
        case 'HOURLY':
          return new Date(y, m, d, h + count);
        case 'DAILY':
          return new Date(y, m, d + count);
        case 'WEEKLY':
          return new Date(y, m, d - date.getDay() + 7 * count);
        case 'MONTHLY':
          return new Date(y, m + count);
        case 'YEARLY':
          return new Date(y + count, 0);
      }
    })();
    _ref1 = issue.offsets;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      offset = _ref1[_i];
      _ref2 = [result.getFullYear(), result.getMonth(), result.getDate(), result.getHours()], y = _ref2[0], m = _ref2[1], d = _ref2[2], h = _ref2[3];
      result = months[offset] ? new Date(y, months[offset] - 1, d, h) : wdays[offset] ? new Date(y, m, d + (7 - result.getDay() + wdays[offset] - 1) % 7, h) : hours[offset] ? new Date(y, m, d, h + 6 * (hours[offset] - 1)) : void 0;
    }
    return result;
  };

  advance = function(date, issue, count) {
    var prim;
    prim = primAdvance(date, issue, 0);
    if (prim > date) {
      return primAdvance(date, issue, count - 1);
    } else {
      return primAdvance(date, issue, count);
    }
  };

  soon = function(issue) {
    var next, now;
    now = new Date();
    next = advance(now, issue, 1);
    return human(next.getTime() - now.getTime());
  };

  explain = function(issue) {
    if (issue.interval != null) {
      return "reporting " + issue.interval + " for " + issue.recipients.length + " recipients in " + (soon(issue));
    } else if (issue.trouble != null) {
      return "don't expect: <span class=error>" + issue.trouble + "</span>";
    } else {
      return "trouble";
    }
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      intervals: intervals,
      parse: parse,
      explain: explain,
      advance: advance
    };
  }

  summarize = function(schedule) {
    var issue;
    return ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = schedule.length; _i < _len; _i++) {
        issue = schedule[_i];
        _results.push(explain(issue));
      }
      return _results;
    })()).join("<br>");
  };

  emit = function($item, item) {
    return $item.append($("<p>" + (summarize(parse(item.text))) + "</p>"));
  };

  bind = function($item, item) {
    return $item.dblclick(function() {
      return wiki.textEditor($item, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.report = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);

});

require.define("/plugins/txtzyme/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"txtzyme.js"}
});

require.define("/plugins/txtzyme/txtzyme.js",function(require,module,exports,__dirname,__filename,process,global){// Generated by CoffeeScript 1.4.0
(function() {
  var apply, bind, emit, parse, report, value;

  parse = function(text) {
    var defn, line, prev, word, words, _i, _j, _len, _len1, _ref, _ref1;
    defn = {};
    _ref = text.split(/\n+/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      words = line.split(/\s+/);
      if (words[0]) {
        defn[words[0]] = prev = words.slice(1, 1000);
      } else {
        _ref1 = words.slice(1, 1000);
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          word = _ref1[_j];
          prev.push(word);
        }
      }
    }
    return defn;
  };

  value = function(type, number, arg) {
    var string;
    switch (type) {
      case 'A':
        if (number.length) {
          return arg[+number];
        } else {
          return arg;
        }
        break;
      case 'B':
        return 1 & (arg >> (number || 0));
      case 'C':
        string = arg.toString();
        if (number < string.length) {
          return string.charCodeAt(number);
        } else {
          return 32;
        }
        break;
      case 'D':
        return 48 + Math.floor(+arg / (Math.pow(10, number)) % 10);
      case '':
        return number;
    }
  };

  apply = function(defn, call, arg, emit) {
    var words, _ref;
    if (!(words = (_ref = defn[call]) != null ? _ref.slice(0) : void 0)) {
      return;
    }
    return (function(stack, result) {
      var next, send;
      send = function() {
        var text;
        if (!result.length) {
          return;
        }
        text = "" + (result.join(' ')) + "\n";
        result = [];
        return emit(text, stack, next);
      };
      next = function() {
        var m, word, _ref1, _ref2, _ref3;
        if (!stack.length) {
          return;
        }
        word = (_ref1 = stack[stack.length - 1]) != null ? _ref1.words.shift() : void 0;
        arg = (_ref2 = stack[stack.length - 1]) != null ? _ref2.arg : void 0;
        if (word === void 0) {
          stack.pop();
        } else if (word === 'NL') {
          return send();
        } else if (m = word.match(/^([ABCD])([0-9]*)$/)) {
          result.push(value(m[1], m[2], arg));
        } else if (m = word.match(/^([A-Z][A-Z0-9]*)(\/([ABCD]?)([0-9]*))?$/)) {
          if (stack.length < 10 && (words = (_ref3 = defn[m[1]]) != null ? _ref3.slice(0) : void 0)) {
            if (m[2]) {
              arg = value(m[3], m[4], arg);
            }
            stack.push({
              call: word,
              arg: arg,
              words: words
            });
          }
        } else {
          result.push(word);
        }
        if (stack.length) {
          return next();
        } else {
          return send();
        }
      };
      if (words.length) {
        return next();
      }
    })([
      {
        call: call,
        arg: arg,
        words: words
      }
    ], []);
  };

  report = function(defn) {
    var key, word, words, _i, _len;
    report = [];
    for (key in defn) {
      words = defn[key];
      report.push("<li class=\"" + key + "\"><span>" + key + "</span>");
      for (_i = 0, _len = words.length; _i < _len; _i++) {
        word = words[_i];
        report.push("<span>" + word + "</span>");
      }
    }
    return report.join(' ');
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      parse: parse,
      apply: apply
    };
  }

  emit = function($item, item) {
    return $item.append("<div style=\"width:93%; background:#eee; padding:.8em; margin-bottom:5px;\">\n  <p class=\"report\" style=\"white-space: pre; white-space: pre-wrap;\">" + item.text + "</p>\n  <p class=\"caption\">status here</p>\n</div>");
  };

  bind = function($item, item) {
    var $page, defn, frame, host, progress, rcvd, response, rrept, sent, socket, srept, startTicking, tick, timer, trigger;
    defn = parse(item.text);
    $page = $item.parents('.page:first');
    host = $page.data('site') || location.host;
    if (host === 'origin' || host === 'local') {
      host = location.host;
    }
    socket = new WebSocket("ws://" + host + "/plugin/txtzyme");
    sent = rcvd = 0;
    srept = rrept = "";
    response = [];
    if (item.text.replace(/_.*?_/g, '').match(/p/)) {
      $item.addClass('sequence-source');
      $item.get(0).getSequenceData = function() {
        return response;
      };
    }
    frame = 0;
    tick = function() {
      var arg, now;
      frame = frame % 40 + 1;
      now = new Date();
      arg = [frame, now.getSeconds(), now.getMinutes(), now.getHours()];
      trigger('FRAME', arg);
      if (frame !== 1) {
        return;
      }
      arg.shift();
      trigger('SECOND', arg);
      if (arg[0]) {
        return;
      }
      trigger('MINUTE', arg);
      if (arg[1]) {
        return;
      }
      trigger('HOUR', arg);
      if (arg[2]) {
        return;
      }
      return trigger('DAY', arg);
    };
    timer = null;
    startTicking = function() {
      timer = setInterval(tick, 25);
      return tick();
    };
    setTimeout(startTicking, 1000 - (new Date().getMilliseconds()));
    $item.dblclick(function() {
      clearInterval(timer);
      if (socket != null) {
        socket.close();
      }
      return wiki.textEditor($item, item);
    });
    $(".main").on('thumb', function(evt, thumb) {
      return trigger('THUMB', thumb);
    });
    $item.delegate('.rcvd', 'click', function() {
      return wiki.dialog("Txtzyme Responses", "<pre>" + (response.join("\n")));
    });
    trigger = function(word, arg) {
      if (arg == null) {
        arg = 0;
      }
      return apply(defn, word, arg, function(message, stack, done) {
        var call, todo, words;
        todo = ((function() {
          var _i, _len, _ref, _results;
          _results = [];
          for (_i = 0, _len = stack.length; _i < _len; _i++) {
            _ref = stack[_i], call = _ref.call, words = _ref.words;
            _results.push("" + call + " " + (words.join(' ')) + "<br>");
          }
          return _results;
        })()).join('');
        $item.find('p.report').html("" + todo + message);
        if (socket) {
          progress((srept = " " + (++sent) + " sent ") + rrept);
          if (response.length) {
            window.dialog.html("<pre>" + (response.join("\n")));
            $item.trigger('sequence', [response]);
          }
          response = [];
          socket.send(message);
        }
        return setTimeout(done, 200);
      });
    };
    progress = function(m) {
      return $item.find('p.caption').html(m);
    };
    socket.onopen = function() {
      progress("opened");
      return trigger('OPEN');
    };
    socket.onmessage = function(e) {
      var line, _i, _len, _ref, _results;
      _ref = e.data.split(/\r?\n/);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        if (line) {
          progress(srept + (rrept = "<span class=rcvd> " + (++rcvd) + " rcvd " + line + " </span>"));
          _results.push(response.push(line));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    return socket.onclose = function() {
      progress("closed");
      return socket = null;
    };
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.txtzyme = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);

});

require.define("/testclient.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {

  mocha.setup('bdd');

  window.wiki = require('./lib/wiki.coffee');

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

require.define("/plugins/calendar/test.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var report;

  report = require('./calendar');

  describe('calendar plugin', function() {
    describe('parsing', function() {
      it('recognizes decades', function() {
        expect(report.parse("1960 DECADE")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
        expect(report.parse("DECADE 1960")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
        return expect(report.parse("60S")).to.eql([
          {
            year: 1960,
            span: 'DECADE'
          }
        ]);
      });
      it('recognizes half decades', function() {
        expect(report.parse("60S EARLY")).to.eql([
          {
            year: 1960,
            span: 'EARLY'
          }
        ]);
        expect(report.parse("EARLY 60S")).to.eql([
          {
            year: 1960,
            span: 'EARLY'
          }
        ]);
        return expect(report.parse("LATE 60S")).to.eql([
          {
            year: 1960,
            span: 'LATE'
          }
        ]);
      });
      it('recognizes years', function() {
        return expect(report.parse("1960")).to.eql([
          {
            year: 1960,
            span: 'YEAR'
          }
        ]);
      });
      it('recognizes months', function() {
        expect(report.parse("1960 MAR")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
        expect(report.parse("MAR 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
        return expect(report.parse("MARCH 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            span: 'MONTH'
          }
        ]);
      });
      it('recognizes days', function() {
        expect(report.parse("MAR 5 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
        expect(report.parse("1960 MAR 5")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
        return expect(report.parse("5 MAR 1960")).to.eql([
          {
            year: 1960,
            month: 3,
            day: 5,
            span: 'DAY'
          }
        ]);
      });
      return it('recognizes labels', function() {
        expect(report.parse("Ward's CHM Interview")).to.eql([
          {
            label: "Ward's CHM Interview"
          }
        ]);
        expect(report.parse("APRIL 24 2006 Ward's CHM Interview")).to.eql([
          {
            year: 2006,
            month: 4,
            day: 24,
            span: 'DAY',
            label: "Ward's CHM Interview"
          }
        ]);
        return expect(report.parse(" APRIL  24  2006\tWard's  CHM  Interview  ")).to.eql([
          {
            year: 2006,
            month: 4,
            day: 24,
            span: 'DAY',
            label: "Ward's CHM Interview"
          }
        ]);
      });
    });
    return describe('applying', function() {
      var interview, today;
      today = new Date(2013, 2 - 1, 3);
      interview = new Date(2006, 4 - 1, 24);
      it('recalls input', function() {
        var input, output, rows;
        input = {
          interview: {
            date: interview
          }
        };
        output = {};
        rows = report.parse("interview");
        return expect(report.apply(input, output, today, rows)).to.eql([
          {
            date: interview,
            label: 'interview'
          }
        ]);
      });
      return it('extends today', function() {
        var input, output, results, rows;
        input = {};
        output = {};
        rows = report.parse("APRIL 1 April Fools Day");
        results = report.apply(input, output, today, rows);
        expect(results).to.eql([
          {
            date: new Date(2013, 4 - 1),
            month: 4,
            day: 1,
            span: 'DAY',
            label: 'April Fools Day'
          }
        ]);
        return expect(output).to.eql({
          'April Fools Day': {
            date: new Date(2013, 4 - 1),
            span: 'DAY'
          }
        });
      });
    });
  });

}).call(this);

});
require("/plugins/calendar/test.coffee");

require.define("/plugins/changes/test.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var createFakeLocalStorage, pluginCtor;

  pluginCtor = require('./changes');

  createFakeLocalStorage = function(initialContents) {
    var fake, getStoreSize, keys, store;
    if (initialContents == null) {
      initialContents = {};
    }
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
require("/plugins/changes/test.coffee");

require.define("/plugins/efficiency/test.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var expectArraysEqual;

  require('./efficiency');

  expectArraysEqual = function(a1, a2, accuracy) {
    var diff, i, isItGood, length, _i, _ref, _results;
    if (accuracy == null) {
      accuracy = 0.1;
    }
    expect(a1.length).to.equal(a2.length);
    length = a1.length;
    _results = [];
    for (i = _i = 0, _ref = length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
      diff = Math.abs(a1[i] - a2[i]);
      isItGood = diff <= accuracy;
      _results.push(expect(isItGood).to.be.ok());
    }
    return _results;
  };

  describe('efficiency plugin', function() {
    var actual, actualArray, expected, expectedLuma, rgbt;
    it("max & min of array", function() {
      expect(6).to.equal(Math.max.apply(Math, [1, 2, 3, 4, 5, 6]));
      return expect(1).to.equal(Math.min.apply(Math, [1, 2, 3, 4, 5, 6]));
    });
    it("Get gray luma from 4-byte RGBT data. Two values", function() {});
    rgbt = [1, 1, 1, 1, 2, 2, 2, 2];
    expectedLuma = [1.0, 2.0];
    actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt);
    expected = JSON.stringify(expectedLuma);
    actual = JSON.stringify(actualArray);
    expectArraysEqual(expectedLuma, actualArray);
    it("Get gray luma from 4-byte RGBT data. Three values", function() {});
    rgbt = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
    expectedLuma = [1.0, 2.0, 3.0];
    actualArray = window.plugins.efficiency.getGrayLumaFromRGBT(rgbt);
    expected = JSON.stringify(expectedLuma);
    actual = JSON.stringify(actualArray);
    expectArraysEqual(expectedLuma, actualArray);
    it("calculateStrategy_GrayBinary 50% binary data", function() {
      var lumas, output;
      lumas = [0, 0, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayBinary 50% linear data", function() {
      var lumas, output;
      lumas = [1, 2, 3, 4];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayBinary 75% binary data", function() {
      var lumas, output;
      lumas = [0, 255, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayBinary(lumas);
      return expect('75.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayIterativeClustering 50% binary data", function() {
      var lumas, output;
      lumas = [0, 0, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    it("calculateStrategy_GrayIterativeClustering 50% linear data", function() {
      var lumas, output;
      lumas = [1, 2, 3, 4];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('50.0').to.equal(output.toFixed(1));
    });
    return it("calculateStrategy_GrayIterativeClustering 75% binary data", function() {
      var lumas, output;
      lumas = [0, 255, 255, 255];
      output = window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas);
      return expect('75.0').to.equal(output.toFixed(1));
    });
  });

}).call(this);

});
require("/plugins/efficiency/test.coffee");

require.define("/plugins/report/test.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var report;

  report = require('./report');

  describe('report plugin', function() {
    describe('parsing', function() {
      it('returns an array', function() {
        var schedule;
        schedule = report.parse("");
        return expect(schedule).to.eql([]);
      });
      it('parses intervals', function() {
        var issue;
        issue = report.parse("DAILY ward@example.com")[0];
        return expect(issue.interval).to.be('DAILY');
      });
      it('parses offsets', function() {
        var issue;
        issue = report.parse("WEEKLY TUESDAY NOON")[0];
        return expect(issue.offsets).to.eql(['TUESDAY', 'NOON']);
      });
      it('parses recipients', function() {
        var issue;
        issue = report.parse("DAILY ward@c2.com root@c2.com")[0];
        return expect(issue.recipients).to.eql(['ward@c2.com', 'root@c2.com']);
      });
      return it('parses multiple issues', function() {
        var schedule;
        schedule = report.parse("WEEKLY MONTHLY YEARLY");
        return expect(schedule).to.have.length(3);
      });
    });
    return describe('advancing', function() {
      it('handles weeks', function() {
        var count, date, issue;
        issue = report.parse("WEEKLY")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2012, 12 - 1, 16));
        expect(count(0)).to.eql(new Date(2012, 12 - 1, 23));
        expect(count(1)).to.eql(new Date(2012, 12 - 1, 30));
        return expect(count(2)).to.eql(new Date(2013, 1 - 1, 6));
      });
      it('handles weeks with offsets (noon > now)', function() {
        var count, date, issue;
        issue = report.parse("WEEKLY TUESDAY NOON")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2012, 12 - 1, 11, 12));
        expect(count(0)).to.eql(new Date(2012, 12 - 1, 18, 12));
        expect(count(1)).to.eql(new Date(2012, 12 - 1, 25, 12));
        return expect(count(2)).to.eql(new Date(2013, 1 - 1, 1, 12));
      });
      it('handles years with offsets (march < now)', function() {
        var count, date, issue;
        issue = report.parse("YEARLY MARCH FRIDAY EVENING")[0];
        date = new Date(2012, 12 - 1, 25, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2011, 3 - 1, 4, 18));
        expect(count(0)).to.eql(new Date(2012, 3 - 1, 2, 18));
        expect(count(1)).to.eql(new Date(2013, 3 - 1, 1, 18));
        return expect(count(2)).to.eql(new Date(2014, 3 - 1, 7, 18));
      });
      return it('handles election day (election > now)', function() {
        var count, date, issue;
        issue = report.parse("YEARLY NOVEMBER MONDAY TUESDAY MORNING")[0];
        date = new Date(2016, 1, 2, 3, 4, 5);
        count = function(i) {
          return report.advance(date, issue, i);
        };
        expect(count(-1)).to.eql(new Date(2014, 11 - 1, 4, 6));
        expect(count(0)).to.eql(new Date(2015, 11 - 1, 3, 6));
        expect(count(1)).to.eql(new Date(2016, 11 - 1, 8, 6));
        return expect(count(2)).to.eql(new Date(2017, 11 - 1, 7, 6));
      });
    });
  });

}).call(this);

});
require("/plugins/report/test.coffee");

require.define("/plugins/txtzyme/test.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var txtzyme;

  txtzyme = require('./txtzyme');

  console.log(txtzyme);

  describe('txtzyme plugin', function() {
    describe('parsing', function() {
      it('recognizes definitions', function() {
        return expect(txtzyme.parse("SECOND 1o500m0o")).to.eql({
          SECOND: ['1o500m0o']
        });
      });
      it('handles empty definitions', function() {
        return expect(txtzyme.parse("SECOND")).to.eql({
          SECOND: []
        });
      });
      it('recognizes multiple definitions', function() {
        return expect(txtzyme.parse("SECOND BLINK BLINK\nBLINK 1o500m0o500m")).to.eql({
          SECOND: ['BLINK', 'BLINK'],
          BLINK: ['1o500m0o500m']
        });
      });
      it('ignores blank line separator', function() {
        return expect(txtzyme.parse("SECOND BLINK BLINK\n\nBLINK 1o500m0o500m")).to.eql({
          SECOND: ['BLINK', 'BLINK'],
          BLINK: ['1o500m0o500m']
        });
      });
      return it('treates indented lines as continuations', function() {
        return expect(txtzyme.parse("SECOND BLINK\n BLINK\n\nBLINK\n 1o500m0o500m")).to.eql({
          SECOND: ['BLINK', 'BLINK'],
          BLINK: ['1o500m0o500m']
        });
      });
    });
    return describe('applying', function() {
      var apply;
      apply = function(text, arg) {
        var defn, result;
        result = "";
        defn = txtzyme.parse(text);
        txtzyme.apply(defn, 'TEST', arg, function(message, stack, done) {
          result += message;
          return done();
        });
        return result;
      };
      it('recognizes definitions', function() {
        return expect(apply("TEST 1o")).to.eql("1o\n");
      });
      it('calls definitions', function() {
        return expect(apply("TEST FOO\nFOO 0o")).to.eql("0o\n");
      });
      it('merges results', function() {
        return expect(apply("TEST 1o FOO 0o\nFOO 10m")).to.eql("1o 10m 0o\n");
      });
      it('limits call depth', function() {
        return expect(apply("TEST o TEST")).to.eql("o o o o o o o o o o\n");
      });
      it('handles empty definitions', function() {
        return expect(apply("TEST")).to.eql("");
      });
      it('handles missing definitions', function() {
        return expect(apply("TEST FOO")).to.eql("");
      });
      it('recognizes NL as newline', function() {
        return expect(apply("TEST 100m NL 200m")).to.eql("100m\n200m\n");
      });
      it('recognizes A as argument', function() {
        return expect(apply("TEST A", 123)).to.eql("123\n");
      });
      it('recognizes A0, A1, A2 as accessor', function() {
        return expect(apply("TEST _ A1 A0 _", ['zero', 'one'])).to.eql("_ one zero _\n");
      });
      it('recognizes B0, B1 as accessor', function() {
        return expect(apply("TEST B4 B3 B2 B1 B0", 6)).to.eql("0 0 1 1 0\n");
      });
      it('recognizes C0, C1, C2 as accessor', function() {
        return expect(apply("TEST C0 C1 C2 C3", 'ABC')).to.eql("65 66 67 32\n");
      });
      it('recognizes D0, D1, D2 as accessor', function() {
        return expect(apply("TEST D3 D2 D1 D0", 123)).to.eql("48 49 50 51\n");
      });
      it('recognizes numeric parameter', function() {
        return expect(apply("TEST IT/25\nIT A", 123)).to.eql("25\n");
      });
      return it('recognizes accessor as parameter', function() {
        return expect(apply("TEST IT/A1\nIT A", [123, 456])).to.eql("456\n");
      });
    });
  });

}).call(this);

});
require("/plugins/txtzyme/test.coffee");
})();
