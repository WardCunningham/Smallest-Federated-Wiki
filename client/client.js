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
    
    require.define = function (filename, fn) {
        if (require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
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
                process
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process){function filter (xs, fn) {
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

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process){var process = module.exports = {};

process.nextTick = (function () {
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

require.define("vm",function(require,module,exports,__dirname,__filename,process){module.exports = require("vm-browserify")});

require.define("/node_modules/vm-browserify/package.json",function(require,module,exports,__dirname,__filename,process){module.exports = {"main":"index.js"}});

require.define("/node_modules/vm-browserify/index.js",function(require,module,exports,__dirname,__filename,process){var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInNewContext = function (context) {
    if (!context) context = {};
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
     
    if (!win.eval && win.execScript) {
        // win.eval() magically appears when this is called in IE:
        win.execScript('null');
    }
    
    var res = win.eval(this.code);
    
    forEach(Object_keys(win), function (key) {
        context[key] = win[key];
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInContext = function (context) {
    // seems to be just runInNewContext on magical context objects which are
    // otherwise indistinguishable from objects except plain old objects
    // for the parameter segfaults node
    return this.runInNewContext(context);
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    // not really sure what this one does
    // seems to just make a shallow copy
    var copy = {};
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};
});

require.define("/lib/legacy.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
  var active, pageHandler, plugin, refresh, resolveLinks, state, util,
    __slice = [].slice;

  window.wiki = {};

  util = require('./util.coffee');

  pageHandler = wiki.pageHandler = require('./pageHandler.coffee');

  plugin = require('./plugin.coffee');

  state = require('./state.coffee');

  active = require('./active.coffee');

  refresh = require('./refresh.coffee');

  resolveLinks = wiki.resolveLinks = util.resolveLinks;

  Array.prototype.last = function() {
    return this[this.length - 1];
  };

  $(function() {
    var LEFTARROW, RIGHTARROW, addToJournal, createPage, createTextElement, doInternalLink, finishClick, getItem, resolveFrom, textEditor, useLocalStorage;
    window.dialog = $('<div></div>').html('This dialog will show every time!').dialog({
      autoOpen: false,
      title: 'Basic Dialog',
      height: 600,
      width: 800
    });
    wiki.dialog = function(title, html) {
      window.dialog.html(html);
      window.dialog.dialog("option", "title", resolveLinks(title));
      return window.dialog.dialog('open');
    };
    wiki.log = function() {
      var things;
      things = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if ((typeof console !== "undefined" && console !== null ? console.log : void 0) != null) {
        return console.log(things);
      }
    };
    wiki.dump = function() {
      var i, p, _i, _j, _len, _len1, _ref, _ref1;
      _ref = $('.page');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        wiki.log('.page', p);
        _ref1 = $(p).find('.item');
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          i = _ref1[_j];
          wiki.log('.item', i, 'data-item', $(i).data('item'));
        }
      }
      return null;
    };
    wiki.resolutionContext = [];
    resolveFrom = wiki.resolveFrom = function(addition, callback) {
      wiki.resolutionContext.push(addition);
      try {
        return callback();
      } finally {
        wiki.resolutionContext.pop();
      }
    };
    addToJournal = wiki.addToJournal = function(journalElement, action) {
      var actionElement, actionTitle, controls, pageElement, prev;
      pageElement = journalElement.parents('.page:first');
      if (action.type === 'edit') {
        prev = journalElement.find(".edit[data-id=" + (action.id || 0) + "]");
      }
      actionTitle = action.type;
      if (action.date != null) {
        actionTitle += " " + (util.formatElapsedTime(action.date));
      }
      actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type).text(util.symbols[action.type]).attr('title', actionTitle).attr('data-id', action.id || "0").data('action', action);
      controls = journalElement.children('.control-buttons');
      if (controls.length > 0) {
        actionElement.insertBefore(controls);
      } else {
        actionElement.appendTo(journalElement);
      }
      if (action.type === 'fork') {
        return actionElement.css("background-image", "url(//" + action.site + "/favicon.png)").attr("href", "//" + action.site + "/" + (pageElement.attr('id')) + ".html").data("site", action.site).data("slug", pageElement.attr('id'));
      }
    };
    useLocalStorage = wiki.useLocalStorage = function() {
      wiki.log('useLocalStorage', $(".login").length > 0);
      return $(".login").length > 0;
    };
    createTextElement = function(pageElement, beforeElement, initialText) {
      var item, itemBefore, itemElement, sleep;
      item = {
        type: 'paragraph',
        id: util.randomBytes(8),
        text: initialText
      };
      itemElement = $("<div class=\"item paragraph\" data-id=" + item.id + "></div>");
      itemElement.data('item', item).data('pageElement', pageElement);
      beforeElement.after(itemElement);
      plugin["do"](itemElement, item);
      itemBefore = wiki.getItem(beforeElement);
      wiki.textEditor(itemElement, item);
      sleep = function(time, code) {
        return setTimeout(code, time);
      };
      return sleep(500, function() {
        return pageHandler.put(pageElement, {
          item: item,
          id: item.id,
          type: 'add',
          after: itemBefore != null ? itemBefore.id : void 0
        });
      });
    };
    textEditor = wiki.textEditor = function(div, item, caretPos, doubleClicked) {
      var original, textarea, _ref;
      if (div.hasClass('textEditing')) {
        return;
      }
      div.addClass('textEditing');
      textarea = $("<textarea>" + (original = (_ref = item.text) != null ? _ref : '') + "</textarea>").focusout(function() {
        div.removeClass('textEditing');
        if (item.text = textarea.val()) {
          plugin["do"](div.empty(), item);
          if (item.text === original) {
            return;
          }
          pageHandler.put(div.parents('.page:first'), {
            type: 'edit',
            id: item.id,
            item: item
          });
        } else {
          pageHandler.put(div.parents('.page:first'), {
            type: 'remove',
            id: item.id
          });
          div.remove();
        }
        return null;
      }).bind('keydown', function(e) {
        var middle, pageElement, prefix, prevItem, prevTextLen, sel, suffix, text;
        if ((e.altKey || e.ctlKey || e.metaKey) && e.which === 83) {
          textarea.focusout();
          return false;
        }
        if (item.type === 'paragraph') {
          sel = util.getSelectionPos(textarea);
          if (e.which === $.ui.keyCode.BACKSPACE && sel.start === 0 && sel.start === sel.end) {
            prevItem = getItem(div.prev());
            if (prevItem.type !== 'paragraph') {
              return false;
            }
            prevTextLen = prevItem.text.length;
            prevItem.text += textarea.val();
            textarea.val('');
            textEditor(div.prev(), prevItem, prevTextLen);
            return false;
          } else if (e.which === $.ui.keyCode.ENTER && item.type === 'paragraph') {
            if (!sel) {
              return false;
            }
            text = textarea.val();
            prefix = text.substring(0, sel.start);
            if (sel.start !== sel.end) {
              middle = text.substring(sel.start, sel.end);
            }
            suffix = text.substring(sel.end);
            textarea.val(prefix);
            textarea.focusout();
            pageElement = div.parent().parent();
            createTextElement(pageElement, div, suffix);
            if (middle != null) {
              createTextElement(pageElement, div, middle);
            }
            return false;
          }
        }
      });
      div.html(textarea);
      if (caretPos != null) {
        return util.setCaretPosition(textarea, caretPos);
      } else if (doubleClicked) {
        util.setCaretPosition(textarea, textarea.val().length);
        return textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
      } else {
        return textarea.focus();
      }
    };
    getItem = wiki.getItem = function(element) {
      if ($(element).length > 0) {
        return $(element).data("item") || $(element).data('staticItem');
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
    doInternalLink = wiki.doInternalLink = function(name, page) {
      name = util.asSlug(name);
      if (page != null) {
        $(page).nextAll().remove();
      }
      createPage(name).appendTo($('.main')).each(refresh);
      return active.set($('.page').last());
    };
    LEFTARROW = 37;
    RIGHTARROW = 39;
    $(document).keydown(function(event) {
      var direction, newIndex, pages;
      direction = (function() {
        switch (event.which) {
          case LEFTARROW:
            return -1;
          case RIGHTARROW:
            return +1;
        }
      })();
      if (direction && !(event.target.tagName === "TEXTAREA")) {
        pages = $('.page');
        newIndex = pages.index($('.active')) + direction;
        if ((0 <= newIndex && newIndex < pages.length)) {
          return active.set(pages.eq(newIndex));
        }
      }
    });
    createPage = wiki.createPage = function(name, loc) {
      if (loc && (loc !== ('view' || 'my'))) {
        return $("<div/>").attr('id', name).attr('data-site', loc).addClass("page");
      } else {
        return $("<div/>").attr('id', name).addClass("page");
      }
    };
    $(window).on('popstate', state.show);
    $(document).ajaxError(function(event, request, settings) {
      var msg;
      wiki.log('ajax error', event, request, settings);
      msg = "<li class='error'>Error on " + settings.url + ": " + request.responseText + "</li>";
      if (request.status !== 404) {
        return $('.main').prepend(msg);
      }
    });
    finishClick = function(e, name) {
      var page;
      e.preventDefault();
      if (!e.shiftKey) {
        page = $(e.target).parents('.page');
      }
      return doInternalLink(name, page);
    };
    $('.main').delegate('.show-page-source', 'click', function(e) {
      var json, pageElement;
      e.preventDefault();
      pageElement = $(this).parent().parent();
      json = pageElement.data('data');
      return wiki.dialog("JSON for " + json.title, $('<pre/>').text(JSON.stringify(json, null, 2)));
    }).delegate('.page', 'click', function(e) {
      if (!$(e.target).is("a")) {
        return active.set(this);
      }
    }).delegate('.internal', 'click', function(e) {
      var name;
      name = $(e.target).data('pageName');
      pageHandler.context = $(e.target).attr('title').split(' => ');
      return finishClick(e, name);
    }).delegate('.remote', 'click', function(e) {
      var name;
      name = $(e.target).data('slug');
      pageHandler.context = [$(e.target).data('site')];
      return finishClick(e, name);
    }).delegate('.action', 'click', function(e) {
      var data, element, journalEntryIndex, name, page, revUrl, titleUrl;
      e.preventDefault();
      element = $(e.target);
      if (e.shiftKey) {
        return wiki.dialog("" + (element.data('action').type) + " action", $('<pre/>').text(JSON.stringify(element.data('action'), null, 2)));
      }
      if (element.is('.fork')) {
        name = $(e.target).data('slug');
        pageHandler.context = [$(e.target).data('site')];
        return finishClick(e, name);
      } else {
        journalEntryIndex = $(this).parent().children().index(element);
        data = $(this).parent().parent().data('data');
        titleUrl = util.asSlug(data.title);
        revUrl = "" + titleUrl + "_rev" + journalEntryIndex;
        e.preventDefault();
        if (!e.shiftKey) {
          page = $(e.target).parents('.page');
        }
        if (page != null) {
          $(page).nextAll().remove();
        }
        createPage(revUrl).appendTo($('.main')).each(refresh);
        return active.set($('.page').last());
      }
    }).delegate('.fork-page', 'click', function(e) {
      var pageElement, remoteSite;
      pageElement = $(e.target).parents('.page');
      if ((remoteSite = pageElement.data('site')) == null) {
        return;
      }
      return pageHandler.put(pageElement, {
        type: 'fork',
        site: remoteSite
      });
    }).delegate('.action', 'hover', function() {
      var id;
      id = $(this).attr('data-id');
      return $("[data-id=" + id + "]").toggleClass('target');
    }).delegate('.item', 'hover', function() {
      var id;
      id = $(this).attr('data-id');
      return $(".action[data-id=" + id + "]").toggleClass('target');
    });
    $(".provider input").click(function() {
      $("footer input:first").val($(this).attr('data-provider'));
      return $("footer form").submit();
    });
    state.first();
    $('.page').each(refresh);
    return active.set($('.page').last());
  });

}).call(this);
});

require.define("/lib/util.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
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
      wiki.log('resolve', slug, 'context', wiki.resolutionContext.join(' => '));
      return "<a class=\"internal\" href=\"/" + slug + ".html\" data-page-name=\"" + slug + "\" title=\"" + (wiki.resolutionContext.join(' => ')) + "\">" + name + "</a>";
    };
    return string.replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink).replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\">$2</a>");
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
    return "" + wk + " " + mo + " " + day + " " + yr + " " + h + ":" + mi + ":" + sec + " " + am;
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

require.define("/lib/pageHandler.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
  var pageHandler, pushToLocal, pushToServer, revision, state, util;

  util = require('./util');

  state = require('./state');

  revision = require('./revision');

  module.exports = pageHandler = {};

  pageHandler.get = function(pageElement, callback, localContext) {
    var i, json, resource, rev, site, slug, _ref;
    _ref = pageElement.attr('id').split('_rev'), slug = _ref[0], rev = _ref[1];
    site = pageElement.data('site');
    if (pageElement.attr('data-server-generated') === 'true') {
      return callback(null);
    }
    if (wiki.useLocalStorage() && (json = localStorage[slug])) {
      pageElement.addClass("local");
      return callback(JSON.parse(json));
    }
    if (!(pageHandler.context.length > 0)) {
      pageHandler.context = ['origin'];
    }
    if (site) {
      localContext = [];
    } else {
      if (localContext == null) {
        localContext = (function() {
          var _i, _len, _ref1, _results;
          _ref1 = pageHandler.context;
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            i = _ref1[_i];
            _results.push(i);
          }
          return _results;
        })();
      }
      site = localContext.shift();
    }
    resource = site === 'origin' ? (site = null, slug) : "remote/" + site + "/" + slug;
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: "/" + resource + ".json?random=" + (util.randomBytes(4)),
      success: function(page) {
        wiki.log('fetch success', page, site || 'origin');
        $(pageElement).data('site', site);
        if (rev) {
          page = revision.create(rev, page);
        }
        return callback(page);
      },
      error: function(xhr, type, msg) {
        var title;
        if (localContext.length > 0) {
          return pageHandler.get(pageElement, callback, localContext);
        } else {
          site = null;
          title = $("a[href=\"/" + slug + ".html\"]").html();
          title || (title = slug);
          pageHandler.put($(pageElement), {
            type: 'create',
            id: util.randomBytes(8),
            item: {
              title: title
            }
          });
          return callback({
            title: title
          });
        }
      }
    });
  };

  pageHandler.context = [];

  pushToLocal = function(pageElement, action) {
    var page;
    page = localStorage[pageElement.attr("id")];
    if (page) {
      page = JSON.parse(page);
    }
    if (action.type === 'create') {
      page = {
        title: action.item.title
      };
    }
    page || (page = pageElement.data("data"));
    if (page.journal == null) {
      page.journal = [];
    }
    page.journal = page.journal.concat(action);
    page.story = $(pageElement).find(".item").map(function() {
      return $(this).data("item");
    }).get();
    localStorage[pageElement.attr("id")] = JSON.stringify(page);
    return wiki.addToJournal(pageElement.find('.journal'), action);
  };

  pushToServer = function(pageElement, action) {
    return $.ajax({
      type: 'PUT',
      url: "/page/" + (pageElement.attr('id')) + "/action",
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
    var site;
    action.date = (new Date()).getTime();
    if ((site = pageElement.data('site')) != null) {
      pageElement.find('h1 img').attr('src', '/favicon.png');
      pageElement.find('h1 a').attr('href', '/');
      pageElement.data('site', null);
      state.setUrl();
      if (action.type !== 'fork') {
        action.fork = site;
        wiki.addToJournal(pageElement.find('.journal'), {
          type: 'fork',
          site: site,
          date: action.date
        });
      }
    }
    if (wiki.useLocalStorage()) {
      pushToLocal(pageElement, action);
      return pageElement.addClass("local");
    } else {
      return pushToServer(pageElement, action);
    }
  };

}).call(this);
});

require.define("/lib/state.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
  var active, state,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
        var _i, _len, _results;
        _results = [];
        for (idx = _i = 0, _len = pages.length; _i < _len; idx = ++_i) {
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
    var idx, name, newLocs, newPages, old, oldLocs, oldPages, previous, _i, _len;
    wiki.log('popstate', e);
    oldPages = state.pagesInDom();
    newPages = state.urlPages();
    oldLocs = state.locsInDom();
    newLocs = state.urlLocs();
    if (!location.pathname || location.pathname === '/') {
      return;
    }
    wiki.log('showState', oldPages, newPages, oldLocs, newLocs);
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
    return active.set($('.page').last());
  };

  state.first = function() {
    var firstUrlLocs, firstUrlPages, idx, oldPages, urlPage, _i, _len, _results;
    state.setUrl();
    firstUrlPages = state.urlPages();
    firstUrlLocs = state.urlLocs();
    oldPages = state.pagesInDom();
    wiki.log('amost createPage', firstUrlPages, firstUrlLocs, oldPages);
    _results = [];
    for (idx = _i = 0, _len = firstUrlPages.length; _i < _len; idx = ++_i) {
      urlPage = firstUrlPages[idx];
      if (!(__indexOf.call(oldPages, urlPage) < 0)) {
        continue;
      }
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

require.define("/lib/active.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
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

require.define("/lib/revision.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
  var create;

  create = function(revIndex, data) {
    var afterIndex, editIndex, itemId, items, journal, journalEntry, removeIndex, revJournal, revStory, revStoryIds, revTitle, storyItem, _i, _j, _k, _len, _len1, _len2, _ref;
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
          for (_j = 0, _len1 = revStory.length; _j < _len1; _j++) {
            storyItem = revStory[_j];
            items[storyItem.id] = storyItem;
          }
          revStory = [];
          _ref = journalEntry.order;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
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

require.define("/lib/plugin.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
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

  plugin["do"] = wiki.doPlugin = function(div, item) {
    var error;
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
        script.emit(div, item);
        return script.bind(div, item);
      } catch (err) {
        return error(err);
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
    }
  };

}).call(this);
});

require.define("/lib/refresh.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
  var createFactory, emitHeader, handleDragging, initAddButton, initDragging, pageHandler, plugin, refresh, state, util;

  util = require('./util.coffee');

  pageHandler = require('./pageHandler.coffee');

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
    return pageHandler.put(thisPageElement, action);
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
    if (site != null) {
      $(pageElement).append("<h1><a href=\"//" + site + "\"><img src = \"/remote/" + site + "/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>");
    } else {
      $(pageElement).append($("<h1 />").append($("<a />").attr('href', '/').append($("<img>").error(function(e) {
        return plugin.get('favicon', function(favicon) {
          return favicon.create();
        });
      }).attr('class', 'favicon').attr('src', '/favicon.png').attr('height', '32px')), " " + page.title));
    }
    if ((rev = pageElement.attr('id').split('_rev')[1]) != null) {
      date = page.journal[page.journal.length - 1].date;
      $(pageElement).append($('<h4 class="revision"/>').html(date != null ? util.formatDate(date) : "Revision " + rev));
      return $(pageElement).addClass('ghost');
    }
  };

  module.exports = refresh = wiki.refresh = function() {
    var buildPage, pageElement;
    pageElement = $(this);
    buildPage = function(data) {
      var action, addContext, context, footerElement, journalElement, page, site, slug, storyElement, _i, _len, _ref, _ref1;
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
        wiki.log('build', slug, 'site', site, 'context', context.join(' => '));
        emitHeader(pageElement, page);
        _ref1 = ['story', 'journal', 'footer'].map(function(className) {
          return $("<div />").addClass(className).appendTo(pageElement);
        }), storyElement = _ref1[0], journalElement = _ref1[1], footerElement = _ref1[2];
        $.each(page.story, function(i, item) {
          var div;
          if ($.isArray(item)) {
            item = item[0];
          }
          div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id);
          storyElement.append(div);
          return plugin["do"](div, item);
        });
        $.each(page.journal, function(i, action) {
          return wiki.addToJournal(journalElement, action);
        });
        journalElement.append("<div class=\"control-buttons\">\n  <a href=\"#\" class=\"button fork-page\" title=\"fork this page\">" + util.symbols['fork'] + "</a>\n  <a href=\"#\" class=\"button add-factory\" title=\"add paragraph\">" + util.symbols['add'] + "</a>\n</div>");
        footerElement.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ').append("<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a>");
        state.setUrl();
      }
      initDragging(pageElement);
      return initAddButton(pageElement);
    };
    return pageHandler.get(pageElement, buildPage);
  };

}).call(this);
});

require.define("/client.coffee",function(require,module,exports,__dirname,__filename,process){(function() {

  require('./lib/legacy.coffee');

}).call(this);
});
require("/client.coffee");
})();
