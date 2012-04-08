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

require.define("/lib/legacy.coffee", function (require, module, exports, __dirname, __filename) {
(function() {
  var util;
  var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (__hasProp.call(this, i) && this[i] === item) return i; } return -1; };

  util = require('./util.coffee');

  Array.prototype.last = function() {
    return this[this.length - 1];
  };

  $(function() {
    var LEFTARROW, RIGHTARROW, addToJournal, asSlug, createPage, doInternalLink, doPlugin, findScrollContainer, firstUrlLocs, firstUrlPages, getItem, getPlugin, idx, locsInDom, pagesInDom, pushToLocal, pushToServer, putAction, refresh, resolveFrom, resolveLinks, scripts, scrollContainer, scrollTo, setActive, setUrl, showState, textEditor, urlLocs, urlPage, urlPages, useLocalStorage, _len;
    window.wiki = {};
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
    wiki.resolutionContext = [];
    wiki.fetchContext = [];
    resolveFrom = wiki.resolveFrom = function(addition, callback) {
      wiki.resolutionContext.push(addition);
      try {
        return callback();
      } finally {
        wiki.resolutionContext.pop();
      }
    };
    asSlug = function(name) {
      return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
    };
    resolveLinks = wiki.resolveLinks = function(string) {
      var renderInternalLink;
      renderInternalLink = function(match, name) {
        var slug;
        slug = asSlug(name);
        wiki.log('resolve', slug, 'context', wiki.resolutionContext.join(' => '));
        return "<a class=\"internal\" href=\"/" + slug + ".html\" data-page-name=\"" + slug + "\" title=\"" + (wiki.resolutionContext.join(' => ')) + "\">" + name + "</a>";
      };
      return string.replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink).replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\">$2</a>");
    };
    addToJournal = function(journalElement, action) {
      var actionElement, pageElement;
      pageElement = journalElement.parents('.page:first');
      actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type).text(action.type[0]).attr('title', action.type).data('itemId', action.id || "0").appendTo(journalElement);
      if (action.type === 'fork') {
        return actionElement.css("background-image", "url(//" + action.site + "/favicon.png)").attr("href", "//" + action.site + "/" + (pageElement.attr('id')) + ".html").data("site", action.site).data("slug", pageElement.attr('id'));
      }
    };
    putAction = wiki.putAction = function(pageElement, action) {
      var site;
      if ((site = pageElement.data('site')) != null) {
        action.fork = site;
        pageElement.find('h1 img').attr('src', '/favicon.png');
        pageElement.find('h1 a').attr('href', '/');
        pageElement.data('site', null);
        setUrl();
        addToJournal(pageElement.find('.journal'), {
          type: 'fork',
          site: site
        });
      }
      if (useLocalStorage()) {
        pushToLocal(pageElement, action);
        return pageElement.addClass("local");
      } else {
        return pushToServer(pageElement, action);
      }
    };
    pushToLocal = function(pageElement, action) {
      var page;
      page = localStorage[pageElement.attr("id")];
      if (page) page = JSON.parse(page);
      if (action.type === 'create') page = action.item;
      page || (page = pageElement.data("data"));
      if (page.journal == null) page.journal = [];
      page.journal.concat(action);
      page.story = $(pageElement).find(".item").map(function() {
        return $(this).data("item");
      }).get();
      localStorage[pageElement.attr("id")] = JSON.stringify(page);
      return addToJournal(pageElement.find('.journal'), action);
    };
    pushToServer = function(pageElement, action) {
      return $.ajax({
        type: 'PUT',
        url: "/page/" + (pageElement.attr('id')) + "/action",
        data: {
          'action': JSON.stringify(action)
        },
        success: function() {
          return addToJournal(pageElement.find('.journal'), action);
        },
        error: function(xhr, type, msg) {
          return wiki.log("ajax error callback", type, msg);
        }
      });
    };
    textEditor = wiki.textEditor = function(div, item) {
      var original, textarea, _ref;
      textarea = $("<textarea>" + (original = (_ref = item.text) != null ? _ref : '') + "</textarea>").focusout(function() {
        if (item.text = textarea.val()) {
          doPlugin(div.empty(), item);
          if (item.text === original) return;
          putAction(div.parents('.page:first'), {
            type: 'edit',
            id: item.id,
            item: item
          });
        } else {
          putAction(div.parents('.page:first'), {
            type: 'remove',
            id: item.id
          });
          div.remove();
        }
        return null;
      }).bind('keydown', function(e) {
        if ((e.altKey || e.ctlKey || e.metaKey) && e.which === 83) {
          textarea.focusout();
          return false;
        }
      }).bind('dblclick', function(e) {
        return false;
      });
      div.html(textarea);
      return textarea.focus();
    };
    getItem = function(element) {
      if ($(element).length > 0) {
        return $(element).data("item") || JSON.parse($(element).data('staticItem'));
      }
    };
    wiki.getData = function() {
      var who;
      who = $('.chart,.data,.calculator').last();
      if (who != null) {
        return who.data('item').data;
      } else {
        return {};
      }
    };
    scripts = {};
    wiki.getScript = function(url, callback) {
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
    wiki.dump = function() {
      var i, p, _i, _j, _len, _len2, _ref, _ref2;
      _ref = $('.page');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        wiki.log('.page', p);
        _ref2 = $(p).find('.item');
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          i = _ref2[_j];
          wiki.log('.item', i, 'data-item', $(i).data('item'));
        }
      }
      return null;
    };
    getPlugin = wiki.getPlugin = function(name, callback) {
      var plugin;
      if (plugin = window.plugins[name]) return callback(plugin);
      return wiki.getScript("/plugins/" + name + ".js", function() {
        return callback(window.plugins[name]);
      });
    };
    doPlugin = wiki.doPlugin = function(div, item) {
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
        return getPlugin(item.type, function(plugin) {
          if (plugin == null) {
            throw TypeError("Can't find plugin for '" + item.type + "'");
          }
          try {
            plugin.emit(div, item);
            return plugin.bind(div, item);
          } catch (err) {
            return error(err);
          }
        });
      } catch (err) {
        return error(err);
      }
    };
    doInternalLink = wiki.doInternalLink = function(name, page) {
      name = asSlug(name);
      if (page != null) $(page).nextAll().remove();
      createPage(name).appendTo($('.main')).each(refresh);
      return setActive(name);
    };
    scrollContainer = void 0;
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
      var bodyWidth, contentWidth, maxX, minX, target, width;
      if (scrollContainer == null) scrollContainer = findScrollContainer();
      bodyWidth = $("body").width();
      minX = scrollContainer.scrollLeft();
      maxX = minX + bodyWidth;
      wiki.log('scrollTo', el, el.position());
      target = el.position().left;
      width = el.outerWidth(true);
      contentWidth = $(".page").outerWidth(true) * $(".page").size();
      if (target < minX) {
        return scrollContainer.animate({
          scrollLeft: target
        });
      } else if (target + width > maxX) {
        return scrollContainer.animate({
          scrollLeft: target - (bodyWidth - width)
        });
      } else if (maxX > $(".pages").outerWidth()) {
        return scrollContainer.animate({
          scrollLeft: Math.min(target, contentWidth - bodyWidth)
        });
      }
    };
    window.plugins = {
      paragraph: {
        emit: function(div, item) {
          return div.append("<p>" + (resolveLinks(item.text)) + "</p>");
        },
        bind: function(div, item) {
          return div.dblclick(function() {
            return textEditor(div, item);
          });
        }
      },
      image: {
        emit: function(div, item) {
          item.text || (item.text = item.caption);
          wiki.log('image', item);
          return div.append("<img src=\"" + item.url + "\"> <p>" + (resolveLinks(item.text)) + "</p>");
        },
        bind: function(div, item) {
          div.dblclick(function() {
            return textEditor(div, item);
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
          return captionElement = $('<p />').html(resolveLinks(item.caption)).appendTo(div);
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
    refresh = function() {
      var buildPage, create, fetch, initDragging, json, pageElement, site, slug;
      pageElement = $(this);
      slug = $(pageElement).attr('id');
      site = $(pageElement).data('site');
      pageElement.find(".add-factory").live("click", function(evt) {
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
        doPlugin(itemElement, item);
        beforeElement = itemElement.prev('.item');
        before = getItem(beforeElement);
        return putAction(pageElement, {
          item: item,
          id: item.id,
          type: "add",
          after: before != null ? before.id : void 0
        });
      });
      initDragging = function() {
        var storyElement;
        storyElement = pageElement.find('.story');
        return storyElement.sortable({
          update: function(evt, ui) {
            var action, before, beforeElement, destinationPageElement, equals, item, itemElement, journalElement, moveFromPage, moveToPage, moveWithinPage, order, sourcePageElement, thisPageElement;
            itemElement = ui.item;
            item = getItem(itemElement);
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
            } : moveToPage ? (itemElement.data('pageElement', thisPageElement), beforeElement = itemElement.prev('.item'), before = getItem(beforeElement), {
              type: 'add',
              item: item,
              after: before != null ? before.id : void 0
            }) : void 0;
            action.id = item.id;
            return putAction(pageElement, action);
          },
          connectWith: '.page .story'
        });
      };
      buildPage = function(data) {
        var action, addContext, context, empty, footerElement, journalElement, page, storyElement, _i, _len, _ref, _ref2;
        empty = {
          title: 'empty',
          synopsys: 'empty',
          story: [],
          journal: []
        };
        page = $.extend(empty, data);
        $(pageElement).data("data", data);
        context = ['origin'];
        addContext = function(string) {
          if (string != null) {
            context = _.without(context, string);
            return context.push(string);
          }
        };
        _ref = page.journal;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          action = _ref[_i];
          addContext(action.site);
        }
        addContext(site);
        wiki.log('build', slug, 'context', context.join(' => '));
        wiki.resolutionContext = context;
        if (site != null) {
          $(pageElement).append("<h1><a href=\"//" + site + "\"><img src = \"/remote/" + site + "/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>");
        } else {
          $(pageElement).append($("<h1 />").append($("<a />").attr('href', '/').append($("<img>").error(function(e) {
            return getPlugin('favicon', function(plugin) {
              return plugin.create();
            });
          }).attr('class', 'favicon').attr('src', '/favicon.png').attr('height', '32px')), " " + page.title));
        }
        _ref2 = ['story', 'journal', 'footer'].map(function(className) {
          return $("<div />").addClass(className).appendTo(pageElement);
        }), storyElement = _ref2[0], journalElement = _ref2[1], footerElement = _ref2[2];
        $.each(page.story, function(i, item) {
          var div;
          if ($.isArray(item)) {
            wiki.log('fixing corrupted item', i, item);
            item = item[0];
          }
          div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id);
          storyElement.append(div);
          return doPlugin(div, item);
        });
        $.each(page.journal, function(i, action) {
          return addToJournal(journalElement, action);
        });
        footerElement.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ').append("<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a> . ").append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>");
        return setUrl();
      };
      fetch = function(slug, callback, localContext) {
        var i, resource;
        if (!(wiki.fetchContext.length > 0)) wiki.fetchContext = ['origin'];
        if (localContext == null) {
          localContext = (function() {
            var _i, _len, _ref, _results;
            _ref = wiki.fetchContext;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              i = _ref[_i];
              _results.push(i);
            }
            return _results;
          })();
        }
        site = localContext.shift();
        resource = site === 'origin' ? (site = null, slug) : "remote/" + site + "/" + slug;
        wiki.log('fetch', resource);
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
            if (localContext.length > 0) {
              return fetch(slug, callback, localContext);
            } else {
              site = null;
              return callback(null);
            }
          }
        });
      };
      create = function(slug, callback) {
        var page, title;
        title = $("a[href=\"/" + slug + ".html\"]").html();
        title || (title = slug);
        page = {
          title: title
        };
        putAction($(pageElement), {
          type: 'create',
          id: util.randomBytes(8),
          item: page
        });
        return callback(page);
      };
      if ($(pageElement).attr('data-server-generated') === 'true') {
        initDragging();
        return pageElement.find('.item').each(function(i, each) {
          var div, item;
          div = $(each);
          item = getItem(div);
          return getPlugin(item.type, function(plugin) {
            return plugin.bind(div, item);
          });
        });
      } else {
        if (useLocalStorage() && (json = localStorage[pageElement.attr("id")])) {
          pageElement.addClass("local");
          buildPage(JSON.parse(json));
          return initDragging();
        } else {
          if (site != null) {
            return $.get("/remote/" + site + "/" + slug + ".json?random=" + (util.randomBytes(4)), "", function(page) {
              buildPage(page);
              return initDragging();
            });
          } else {
            return fetch(slug, function(page) {
              if (page != null) {
                buildPage(page);
                return initDragging();
              } else {
                return create(slug, function(page) {
                  buildPage(page);
                  return initDragging();
                });
              }
            });
          }
        }
      }
    };
    setUrl = function() {
      var idx, locs, page, pages, url;
      if (history && history.pushState) {
        locs = locsInDom();
        pages = pagesInDom();
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
    setActive = function(page) {
      wiki.log('set active', page);
      $(".active").removeClass("active");
      return scrollTo($("#" + page).addClass("active"));
    };
    showState = function() {
      var idx, name, newLocs, newPages, oldLocs, oldPages, previousPage, _i, _len, _len2, _ref;
      oldPages = pagesInDom();
      newPages = urlPages();
      oldLocs = locsInDom();
      newLocs = urlLocs();
      wiki.log('showState', oldPages, newPages, oldLocs, newLocs);
      previousPage = newPages;
      if ((newPages === oldPages) && (newLocs === oldLocs)) return;
      for (idx = 0, _len = newPages.length; idx < _len; idx++) {
        name = newPages[idx];
        if (__indexOf.call(oldPages, name) >= 0) {
          delete oldPages[oldPages.indexOf(name)];
        } else {
          createPage(name, newLocs[idx]).insertAfter(previousPage).each(refresh);
        }
        previousPage = $('#' + name);
      }
      for (_i = 0, _len2 = oldPages.length; _i < _len2; _i++) {
        name = oldPages[_i];
        if ((_ref = $('#' + name)) != null) _ref.remove();
      }
      return setActive($('.page').last().attr('id'));
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
        pages = pagesInDom();
        newIndex = pages.indexOf($('.active').attr('id')) + direction;
        if ((0 <= newIndex && newIndex < pages.length)) {
          return setActive(pages[newIndex]);
        }
      }
    });
    pagesInDom = function() {
      return $.makeArray($(".page").map(function(_, el) {
        return el.id;
      }));
    };
    urlPages = function() {
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
    locsInDom = function() {
      return $.makeArray($(".page").map(function(_, el) {
        return $(el).data('site') || 'view';
      }));
    };
    urlLocs = function() {
      var j, _i, _len, _ref, _results, _step;
      _ref = $(location).attr('pathname').split('/').slice(1);
      _results = [];
      for (_i = 0, _len = _ref.length, _step = 2; _i < _len; _i += _step) {
        j = _ref[_i];
        _results.push(j);
      }
      return _results;
    };
    createPage = function(name, loc) {
      if (loc && (loc !== ('view' || 'my'))) {
        return $("<div/>").attr('id', name).attr('data-site', loc).addClass("page");
      } else {
        return $("<div/>").attr('id', name).addClass("page");
      }
    };
    $(window).on('popstate', function(event) {
      wiki.log('popstate', event);
      return showState();
    });
    $(document).ajaxError(function(event, request, settings) {
      var msg;
      wiki.log('ajax error', event, request, settings);
      msg = "<li class='error'>Error on " + settings.url + ": " + request.responseText + "</li>";
      if (request.status !== 404) return $('.main').prepend(msg);
    });
    $('.main').delegate('.show-page-source', 'click', function(e) {
      var json, pageElement;
      e.preventDefault();
      pageElement = $(this).parent().parent();
      json = pageElement.data('data');
      return wiki.dialog("JSON for " + json.title, $('<pre/>').text(JSON.stringify(json, null, 2)));
    }).delegate('.page', 'click', function(e) {
      if (!$(e.target).is("a")) return setActive(this.id);
    }).delegate('.internal', 'click', function(e) {
      var name;
      e.preventDefault();
      name = $(e.target).data('pageName');
      wiki.fetchContext = $(e.target).attr('title').split(' => ');
      wiki.log('click', name, 'context', wiki.fetchContext);
      if (!e.shiftKey) $(e.target).parents('.page').nextAll().remove();
      createPage(name).appendTo('.main').each(refresh);
      return setActive(name);
    }).delegate('.action', 'hover', function() {
      var id;
      id = $(this).data('itemId');
      return $("[data-id=" + id + "]").toggleClass('target');
    }).delegate('.action.fork, .remote', 'click', function(e) {
      var name;
      e.preventDefault();
      name = $(e.target).data('slug');
      wiki.log('click', name, 'site', $(e.target).data('site'));
      if (!e.shiftKey) $(e.target).parents('.page').nextAll().remove();
      createPage(name).data('site', $(e.target).data('site')).appendTo($('.main')).each(refresh);
      return setActive(name);
    });
    useLocalStorage = function() {
      return $(".login").length > 0;
    };
    $(".provider input").click(function() {
      $("footer input:first").val($(this).attr('data-provider'));
      return $("footer form").submit();
    });
    setUrl();
    firstUrlPages = urlPages();
    firstUrlLocs = urlLocs();
    wiki.log('amost createPage', firstUrlPages, firstUrlLocs, pagesInDom());
    for (idx = 0, _len = firstUrlPages.length; idx < _len; idx++) {
      urlPage = firstUrlPages[idx];
      if (!(__indexOf.call(pagesInDom(), urlPage) < 0)) continue;
      wiki.log('createPage', urlPage, idx);
      if (urlPage !== '') createPage(urlPage, firstUrlLocs[idx]).appendTo('.main');
    }
    $('.page').each(refresh);
    return setActive($('.page').last().attr('id'));
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

}).call(this);

});

require.define("/client.coffee", function (require, module, exports, __dirname, __filename) {
    
  require('./lib/legacy.coffee');

});
require("/client.coffee");
