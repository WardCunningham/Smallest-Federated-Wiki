;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  window.wiki = require('./lib/wiki.coffee');

  require('./lib/legacy.coffee');

}).call(this);


},{"./lib/wiki.coffee":2,"./lib/legacy.coffee":3}],2:[function(require,module,exports){
(function() {
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
    var $page, site;

    if (loc && loc !== 'view') {
      site = loc;
    }
    $page = $("<div class=\"page\" id=\"" + name + "\">\n  <div class=\"twins\"> <p> </p> </div>\n  <div class=\"header\">\n    <h1> <img class=\"favicon\" src=\"" + (site ? "//" + site : "") + "/favicon.png\" height=\"32px\"> " + name + " </h1>\n  </div>\n</div>");
    if (site) {
      $page.find('.page').attr('data-site', site);
    }
    return $page;
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


},{"./synopsis.coffee":4}],3:[function(require,module,exports){
(function() {
  var active, pageHandler, plugin, refresh, state, util, wiki;

  wiki = require('./wiki.coffee');

  util = require('./util.coffee');

  pageHandler = wiki.pageHandler = require('./pageHandler.coffee');

  plugin = require('./plugin.coffee');

  state = require('./state.coffee');

  active = require('./active.coffee');

  refresh = require('./refresh.coffee');

  Array.prototype.last = function() {
    return this[this.length - 1];
  };

  $(function() {
    var LEFTARROW, RIGHTARROW, createTextElement, doInternalLink, finishClick, getTemplate, sleep, textEditor;

    window.dialog = $('<div></div>').html('This dialog will show every time!').dialog({
      autoOpen: false,
      title: 'Basic Dialog',
      height: 600,
      width: 800
    });
    wiki.dialog = function(title, html) {
      window.dialog.html(html);
      window.dialog.dialog("option", "title", wiki.resolveLinks(title));
      return window.dialog.dialog('open');
    };
    sleep = function(time, done) {
      return setTimeout(done, time);
    };
    wiki.removeItem = function($item, item) {
      pageHandler.put($item.parents('.page:first'), {
        type: 'remove',
        id: item.id
      });
      return $item.remove();
    };
    wiki.createItem = function($page, $before, item) {
      var $item, before;

      if ($page == null) {
        $page = $before.parents('.page');
      }
      item.id = util.randomBytes(8);
      $item = $("<div class=\"item " + item.type + "\" data-id=\"" + "\"</div>");
      $item.data('item', item).data('pageElement', $page);
      if ($before != null) {
        $before.after($item);
      } else {
        $page.find('.story').append($item);
      }
      plugin["do"]($item, item);
      before = wiki.getItem($before);
      sleep(500, function() {
        return pageHandler.put($page, {
          item: item,
          id: item.id,
          type: 'add',
          after: before != null ? before.id : void 0
        });
      });
      return $item;
    };
    createTextElement = function(pageElement, beforeElement, initialText) {
      var item, itemBefore, itemElement;

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
        var middle, page, pageElement, prefix, prevItem, prevTextLen, sel, suffix, text;

        if ((e.altKey || e.ctlKey || e.metaKey) && e.which === 83) {
          textarea.focusout();
          return false;
        }
        if ((e.altKey || e.ctlKey || e.metaKey) && e.which === 73) {
          e.preventDefault();
          if (!e.shiftKey) {
            page = $(e.target).parents('.page');
          }
          doInternalLink("about " + item.type + " plugin", page);
          return false;
        }
        if (item.type === 'paragraph') {
          sel = util.getSelectionPos(textarea);
          if (e.which === $.ui.keyCode.BACKSPACE && sel.start === 0 && sel.start === sel.end) {
            prevItem = wiki.getItem(div.prev());
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
            if (prefix === '') {
              textarea.val(' ');
            } else {
              textarea.val(prefix);
            }
            textarea.focusout();
            pageElement = div.parent().parent();
            createTextElement(pageElement, div, suffix);
            if (middle != null) {
              createTextElement(pageElement, div, middle);
            }
            if (prefix === '') {
              createTextElement(pageElement, div, '');
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
    doInternalLink = wiki.doInternalLink = function(name, page, site) {
      if (site == null) {
        site = null;
      }
      name = wiki.asSlug(name);
      if (page != null) {
        $(page).nextAll().remove();
      }
      wiki.createPage(name, site).appendTo($('.main')).each(refresh);
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
    $(window).on('popstate', state.show);
    $(document).ajaxError(function(event, request, settings) {
      if (request.status === 0 || request.status === 404) {
        return;
      }
      wiki.log('ajax error', event, request, settings);
      return $('.main').prepend("<li class='error'>\n  Error on " + settings.url + ": " + request.responseText + "\n</li>");
    });
    getTemplate = function(slug, done) {
      if (!slug) {
        return done(null);
      }
      wiki.log('getTemplate', slug);
      return pageHandler.get({
        whenGotten: function(data, siteFound) {
          return done(data.story);
        },
        whenNotGotten: function() {
          return done(null);
        },
        pageInformation: {
          slug: slug
        }
      });
    };
    finishClick = function(e, name) {
      var page;

      e.preventDefault();
      if (!e.shiftKey) {
        page = $(e.target).parents('.page');
      }
      doInternalLink(name, page, $(e.target).data('site'));
      return false;
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
    }).delegate('img.remote', 'click', function(e) {
      var name;

      name = $(e.target).data('slug');
      pageHandler.context = [$(e.target).data('site')];
      return finishClick(e, name);
    }).delegate('.revision', 'dblclick', function(e) {
      var $page, action, json, page, rev;

      e.preventDefault();
      $page = $(this).parents('.page');
      page = $page.data('data');
      rev = page.journal.length - 1;
      action = page.journal[rev];
      json = JSON.stringify(action, null, 2);
      return wiki.dialog("Revision " + rev + ", " + action.type + " action", $('<pre/>').text(json));
    }).delegate('.action', 'click', function(e) {
      var $action, $page, name, rev, slug;

      e.preventDefault();
      $action = $(e.target);
      if ($action.is('.fork') && ((name = $action.data('slug')) != null)) {
        pageHandler.context = [$action.data('site')];
        return finishClick(e, (name.split('_'))[0]);
      } else {
        $page = $(this).parents('.page');
        slug = wiki.asSlug($page.data('data').title);
        rev = $(this).parent().children().index($action);
        if (!e.shiftKey) {
          $page.nextAll().remove();
        }
        wiki.createPage("" + slug + "_rev" + rev, $page.data('site')).appendTo($('.main')).each(refresh);
        return active.set($('.page').last());
      }
    }).delegate('.fork-page', 'click', function(e) {
      var item, pageElement, remoteSite;

      pageElement = $(e.target).parents('.page');
      if (pageElement.hasClass('local')) {
        if (!wiki.useLocalStorage()) {
          item = pageElement.data('data');
          pageElement.removeClass('local');
          return pageHandler.put(pageElement, {
            type: 'fork',
            item: item
          });
        }
      } else {
        if ((remoteSite = pageElement.data('site')) != null) {
          return pageHandler.put(pageElement, {
            type: 'fork',
            site: remoteSite
          });
        }
      }
    }).delegate('.action', 'hover', function() {
      var id;

      id = $(this).attr('data-id');
      $("[data-id=" + id + "]").toggleClass('target');
      return $('.main').trigger('rev');
    }).delegate('.item', 'hover', function() {
      var id;

      id = $(this).attr('data-id');
      return $(".action[data-id=" + id + "]").toggleClass('target');
    }).delegate('button.create', 'click', function(e) {
      return getTemplate($(e.target).data('slug'), function(story) {
        var $page, page;

        $page = $(e.target).parents('.page:first');
        $page.removeClass('ghost');
        page = $page.data('data');
        page.story = story || [];
        pageHandler.put($page, {
          type: 'create',
          id: page.id,
          item: {
            title: page.title,
            story: story || void 0
          }
        });
        return wiki.buildPage(page, null, $page.empty());
      });
    }).delegate('.ghost', 'rev', function(e) {
      var $item, $page, position;

      wiki.log('rev', e);
      $page = $(e.target).parents('.page:first');
      $item = $page.find('.target');
      position = $item.offset().top + $page.scrollTop() - $page.height() / 2;
      wiki.log('scroll', $page, $item, position);
      return $page.stop().animate({
        scrollTop: postion
      }, 'slow');
    }).delegate('.score', 'hover', function(e) {
      return $('.main').trigger('thumb', $(e.target).data('thumb'));
    });
    $(".provider input").click(function() {
      $("footer input:first").val($(this).attr('data-provider'));
      return $("footer form").submit();
    });
    $('body').on('new-neighbor-done', function(e, neighbor) {
      return $('.page').each(function(index, element) {
        return wiki.emitTwins($(element));
      });
    });
    return $(function() {
      state.first();
      $('.page').each(refresh);
      return active.set($('.page').last());
    });
  });

}).call(this);


},{"./wiki.coffee":2,"./util.coffee":5,"./pageHandler.coffee":6,"./plugin.coffee":7,"./state.coffee":8,"./active.coffee":9,"./refresh.coffee":10}],4:[function(require,module,exports){
(function() {
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


},{}],9:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
(function() {
  var util, wiki;

  wiki = require('./wiki.coffee');

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


},{"./wiki.coffee":2}],7:[function(require,module,exports){
(function() {
  var getScript, plugin, scripts, util, wiki;

  util = require('./util.coffee');

  wiki = require('./wiki.coffee');

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
      var err;

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
      } catch (_error) {
        err = _error;
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


},{"./util.coffee":5,"./wiki.coffee":2}],8:[function(require,module,exports){
(function() {
  var active, state, wiki,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  wiki = require('./wiki.coffee');

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
      var _i, _len, _ref, _results;

      _ref = $(location).attr('pathname').split('/');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i += 2) {
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
    var j, _i, _len, _ref, _results;

    _ref = $(location).attr('pathname').split('/').slice(1);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i += 2) {
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


},{"./wiki.coffee":2,"./active.coffee":9}],6:[function(require,module,exports){
(function() {
  var addToJournal, pageFromLocalStorage, pageHandler, pushToLocal, pushToServer, recursiveGet, revision, state, util, wiki, _;

  _ = require('underscore');

  wiki = require('./wiki.coffee');

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


},{"./wiki.coffee":2,"./util.coffee":5,"./state.coffee":8,"./revision.coffee":11,"./addToJournal.coffee":12,"underscore":13}],10:[function(require,module,exports){
(function() {
  var addToJournal, buildPageHeader, createFactory, emitHeader, emitTwins, handleDragging, initAddButton, initDragging, neighborhood, pageHandler, plugin, refresh, renderPageIntoPageElement, state, util, wiki, _,
    __slice = [].slice;

  _ = require('underscore');

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
    var favicon_src, header_href, page, tooltip;

    page = _arg.page, tooltip = _arg.tooltip, header_href = _arg.header_href, favicon_src = _arg.favicon_src;
    if (page.plugin) {
      tooltip += "\n" + page.plugin + " plugin";
    }
    return "<h1 title=\"" + tooltip + "\"><a href=\"" + header_href + "\"><img src=\"" + favicon_src + "\" height=\"32px\" class=\"favicon\"></a> " + page.title + "</h1>";
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
      page: page
    }) : buildPageHeader({
      tooltip: location.host,
      header_href: "/view/welcome-visitors" + viewHere,
      favicon_src: "/favicon.png",
      page: page
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
    $page.empty();
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
    return $footer.append("<a id=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/\">CC BY-SA 3.0</a> .\n<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a> .\n<a href= \"//" + (siteFound || location.host) + "/" + slug + ".html\">" + (siteFound || location.host) + "</a>");
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
    if (data.plugin != null) {
      $page.addClass('plugin');
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


},{"./util.coffee":5,"./pageHandler.coffee":6,"./plugin.coffee":7,"./state.coffee":8,"./neighborhood.coffee":14,"./addToJournal.coffee":12,"./wiki.coffee":2,"underscore":13}],11:[function(require,module,exports){
(function() {
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


},{}],13:[function(require,module,exports){
(function(){//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

})()
},{}],12:[function(require,module,exports){
(function() {
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


},{"./util.coffee":5}],14:[function(require,module,exports){
(function() {
  var active, createSearch, neighborhood, nextAvailableFetch, nextFetchInterval, populateSiteInfoFor, util, wiki, _, _ref,
    __hasProp = {}.hasOwnProperty;

  _ = require('underscore');

  wiki = require('./wiki.coffee');

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


},{"./wiki.coffee":2,"./active.coffee":9,"./util.coffee":5,"./search.coffee":15,"underscore":13}],15:[function(require,module,exports){
(function() {
  var active, createSearch, util, wiki;

  wiki = require('./wiki.coffee');

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


},{"./wiki.coffee":2,"./util.coffee":5,"./active.coffee":9}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2NsaWVudC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi93aWtpLmNvZmZlZSIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2xlZ2FjeS5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9zeW5vcHNpcy5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9hY3RpdmUuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvdXRpbC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9wbHVnaW4uY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc3RhdGUuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcGFnZUhhbmRsZXIuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcmVmcmVzaC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9yZXZpc2lvbi5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9hZGRUb0pvdXJuYWwuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvbmVpZ2hib3Job29kLmNvZmZlZSIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3NlYXJjaC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTtDQUFBLENBQUEsQ0FBYyxDQUFkLEVBQU0sQ0FBUSxZQUFBOztDQUFkLENBQ0EsS0FBQSxjQUFBO0NBREE7Ozs7O0FDQUE7Q0FBQSxLQUFBLGNBQUE7S0FBQSxhQUFBOztDQUFBLENBQUEsQ0FBaUIsSUFBQSxPQUFqQixLQUFpQjs7Q0FBakIsQ0FFQSxDQUFPLENBQVA7Q0FBTyxDQUFFLEVBQUEsVUFBRjtDQUZQLEdBQUE7O0NBQUEsQ0FJQSxDQUFBLENBQUksS0FBTztDQUNULEtBQUEsRUFBQTs7Q0FBQSxHQURVLG1EQUNWO0NBQUEsR0FBQSwrRUFBQTtDQUFRLEVBQVIsR0FBQSxDQUFPLE1BQVAsR0FBWTtNQURIO0NBSlgsRUFJVzs7Q0FKWCxDQU9BLENBQWMsQ0FBVixFQUFKLEdBQWU7Q0FDUixDQUFlLENBQXBCLENBQUksQ0FBSixFQUFBLElBQUEsS0FBQTtDQVJGLEVBT2M7O0NBUGQsQ0FXQSxDQUF1QixDQUFuQixLQUFtQixNQUF2QjtDQUNFLEVBQXFCLEdBQXJCLEVBQUEsR0FBQTtDQVpGLEVBV3VCOztDQVh2QixDQWNBLENBQXlCLENBQXJCLGFBQUo7O0NBZEEsQ0FnQkEsQ0FBbUIsQ0FBZixJQUFlLENBQUMsRUFBcEI7Q0FDRSxHQUFBLElBQUEsU0FBc0I7Q0FDdEI7Q0FDRSxPQUFBLEtBQUE7TUFERjtDQUdFLEVBQUEsQ0FBSSxFQUFKLFdBQXNCO01BTFA7Q0FoQm5CLEVBZ0JtQjs7Q0FoQm5CLENBdUJBLENBQWUsQ0FBWCxH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QWdDQSxVQUFPO0NBQUEsQ0FBUSxHQUFQLENBQUEsRUFBRDtDQUFBLENBQTJCLElBQVQsQ0FBQSxHQUFsQjtDQUFBLENBQThDLEdBQVAsQ0FBQSxFQUF2QztDQWpDQSxLQWlDUDtDQWpDRixFQUFTOztDQUFULENBbUNBLENBQWlCLEdBQWpCLENBQU87Q0FuQ1A7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDM3NDQTtD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Yi93aWtpLmNvZmZlZScpXG5yZXF1aXJlKCcuL2xpYi9sZWdhY3kuY29mZmVlJylcblxuIiwiY3JlYXRlU3lub3BzaXMgPSByZXF1aXJlICcuL3N5bm9wc2lzLmNvZmZlZSdcblxud2lraSA9IHsgY3JlYXRlU3lub3BzaXMgfVxuXG53aWtpLmxvZyA9ICh0aGluZ3MuLi4pIC0+XG4gIGNvbnNvbGUubG9nIHRoaW5ncy4uLiBpZiBjb25zb2xlPy5sb2c/XG5cbndpa2kuYXNTbHVnID0gKG5hbWUpIC0+XG4gIG5hbWUucmVwbGFjZSgvXFxzL2csICctJykucmVwbGFjZSgvW15BLVphLXowLTktXS9nLCAnJykudG9Mb3dlckNhc2UoKVxuXG5cbndpa2kudXNlTG9jYWxTdG9yYWdlID0gLT5cbiAgJChcIi5sb2dpblwiKS5sZW5ndGggPiAwXG5cbndpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBbXVxuXG53aWtpLnJlc29sdmVGcm9tID0gKGFkZGl0aW9uLCBjYWxsYmFjaykgLT5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wdXNoIGFkZGl0aW9uXG4gIHRyeVxuICAgIGNhbGxiYWNrKClcbiAgZmluYWxseVxuICAgIHdpa2kucmVzb2x1dGlvbkNvbnRleHQucG9wKClcblxud2lraS5nZXREYXRhID0gKHZpcykgLT5cbiAgaWYgdmlzXG4gICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpXG4gICAgd2hvID0gJChcIi5pdGVtOmx0KCN7aWR4fSlcIikuZmlsdGVyKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KClcbiAgICBpZiB3aG8/IHRoZW4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhIGVsc2Uge31cbiAgZWxzZVxuICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKVxuICAgIGlmIHdobz8gdGhlbiB3aG8uZGF0YSgnaXRlbScpLmRhdGEgZWxzZSB7fVxuXG53aWtpLmdldERhdGFOb2RlcyA9ICh2aXMpIC0+XG4gIGlmIHZpc1xuICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKVxuICAgIHdobyA9ICQoXCIuaXRlbTpsdCgje2lkeH0pXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuICBlbHNlXG4gICAgd2hvID0gJCgnLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuXG53aWtpLmNyZWF0ZVBhZ2UgPSAobmFtZSwgbG9jKSAtPlxuICBzaXRlID0gbG9jIGlmIGxvYyBhbmQgbG9jIGlzbnQgJ3ZpZXcnXG4gICRwYWdlID0gJCBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwicGFnZVwiIGlkPVwiI3tuYW1lfVwiPlxuICAgICAgPGRpdiBjbGFzcz1cInR3aW5zXCI+IDxwPiA8L3A+IDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICA8aDE+IDxpbWcgY2xhc3M9XCJmYXZpY29uXCIgc3JjPVwiI3sgaWYgc2l0ZSB0aGVuIFwiLy8je3NpdGV9XCIgZWxzZSBcIlwiIH0vZmF2aWNvbi5wbmdcIiBoZWlnaHQ9XCIzMnB4XCI+ICN7bmFtZX0gPC9oMT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICBcIlwiXCJcbiAgJHBhZ2UuZmluZCgnLnBhZ2UnKS5hdHRyKCdkYXRhLXNpdGUnLCBzaXRlKSBpZiBzaXRlXG4gICRwYWdlXG5cbndpa2kuZ2V0SXRlbSA9IChlbGVtZW50KSAtPlxuICAkKGVsZW1lbnQpLmRhdGEoXCJpdGVtXCIpIG9yICQoZWxlbWVudCkuZGF0YSgnc3RhdGljSXRlbScpIGlmICQoZWxlbWVudCkubGVuZ3RoID4gMFxuXG53aWtpLnJlc29sdmVMaW5rcyA9IChzdHJpbmcpIC0+XG4gIHJlbmRlckludGVybmFsTGluayA9IChtYXRjaCwgbmFtZSkgLT5cbiAgICAjIHNwYWNlcyBiZWNvbWUgJ3NsdWdzJywgbm9uLWFscGhhLW51bSBnZXQgcmVtb3ZlZFxuICAgIHNsdWcgPSB3aWtpLmFzU2x1ZyBuYW1lXG4gICAgXCI8YSBjbGFzcz1cXFwiaW50ZXJuYWxcXFwiIGhyZWY9XFxcIi8je3NsdWd9Lmh0bWxcXFwiIGRhdGEtcGFnZS1uYW1lPVxcXCIje3NsdWd9XFxcIiB0aXRsZT1cXFwiI3t3aWtpLnJlc29sdXRpb25Db250ZXh0LmpvaW4oJyA9PiAnKX1cXFwiPiN7bmFtZX08L2E+XCJcbiAgc3RyaW5nXG4gICAgLnJlcGxhY2UoL1xcW1xcWyhbXlxcXV0rKVxcXVxcXS9naSwgcmVuZGVySW50ZXJuYWxMaW5rKVxuICAgIC5yZXBsYWNlKC9cXFsoaHR0cC4qPykgKC4qPylcXF0vZ2ksIFwiXCJcIjxhIGNsYXNzPVwiZXh0ZXJuYWxcIiB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJDFcIiB0aXRsZT1cIiQxXCIgcmVsPVwibm9mb2xsb3dcIj4kMiA8aW1nIHNyYz1cIi9pbWFnZXMvZXh0ZXJuYWwtbGluay1sdHItaWNvbi5wbmdcIj48L2E+XCJcIlwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdpa2lcblxuIiwid2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbnBhZ2VIYW5kbGVyID0gd2lraS5wYWdlSGFuZGxlciA9IHJlcXVpcmUgJy4vcGFnZUhhbmRsZXIuY29mZmVlJ1xucGx1Z2luID0gcmVxdWlyZSAnLi9wbHVnaW4uY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcbmFjdGl2ZSA9IHJlcXVpcmUgJy4vYWN0aXZlLmNvZmZlZSdcbnJlZnJlc2ggPSByZXF1aXJlICcuL3JlZnJlc2guY29mZmVlJ1xuXG5BcnJheTo6bGFzdCA9IC0+XG4gIHRoaXNbQGxlbmd0aCAtIDFdXG5cbiQgLT5cbiMgRUxFTUVOVFMgdXNlZCBmb3IgZGV0YWlscyBwb3B1cFxuXG4gICMgIyBleHRlbnNpb24gZnJvbSBodHRwOi8vd3d3LmRyb3B0b2ZyYW1lLmNvbS8/cD0zNVxuICAjICAgIyAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItdHJhbnNmZXJ7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgcmlnaHQ6IDIzcHg7IHRvcDogNTAlOyB3aWR0aDogMTlweDsgbWFyZ2luOiAtMTBweCAwIDAgMDsgcGFkZGluZzogMXB4OyBoZWlnaHQ6IDE4cHg7IH1cbiAgIyAgICMgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyIHNwYW4geyBkaXNwbGF5OiBibG9jazsgbWFyZ2luOiAxcHg7IH1cbiAgIyAgICMgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyOmhvdmVyLCAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItbWluOmZvY3VzIHsgcGFkZGluZzogMDsgfVxuICAjIF9pbml0ID0gJC51aS5kaWFsb2cucHJvdG90eXBlLl9pbml0XG4gICMgX3VpRGlhbG9nVGl0bGViYXIgPSBudWxsXG4gICMgJC51aS5kaWFsb2cucHJvdG90eXBlLl9pbml0ID0gLT5cbiAgIyAgIHNlbGYgPSB0aGlzXG4gICMgICBfaW5pdC5hcHBseSB0aGlzLCBhcmd1bWVudHNcbiAgIyAgIHVpRGlhbG9nVGl0bGViYXIgPSB0aGlzLnVpRGlhbG9nVGl0bGViYXJcbiAgIyAgIHVpRGlhbG9nVGl0bGViYXIuYXBwZW5kICc8YSBocmVmPVwiI1wiIGlkPVwiZGlhbG9nLXRyYW5zZmVyXCIgY2xhc3M9XCJkaWFsb2ctdHJhbnNmZXIgdWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyXCI+PHNwYW4gY2xhc3M9XCJ1aS1pY29uIHVpLWljb24tdHJhbnNmZXJ0aGljay1lLXdcIj48L3NwYW4+PC9hPidcbiAgIyAkLmV4dGVuZCAkLnVpLmRpYWxvZy5wcm90b3R5cGUsIC0+XG4gICMgICAkKCcuZGlhbG9nLXRyYW5zZmVyJywgdGhpcy51aURpYWxvZ1RpdGxlYmFyKVxuICAjICAgICAuaG92ZXIgLT4gJCh0aGlzKS50b2dnbGVDbGFzcygndWktc3RhdGUtaG92ZXInKVxuICAjICAgICAuY2xpY2soKSAtPlxuICAjICAgICAgIHNlbGYudHJhbnNmZXIoKVxuICAjICAgICAgIHJldHVybiBmYWxzZVxuICB3aW5kb3cuZGlhbG9nID0gJCgnPGRpdj48L2Rpdj4nKVxuXHQgIC5odG1sKCdUaGlzIGRpYWxvZyB3aWxsIHNob3cgZXZlcnkgdGltZSEnKVxuXHQgIC5kaWFsb2cgeyBhdXRvT3BlbjogZmFsc2UsIHRpdGxlOiAnQmFzaWMgRGlhbG9nJywgaGVpZ2h0OiA2MDAsIHdpZHRoOiA4MDAgfVxuICB3aWtpLmRpYWxvZyA9ICh0aXRsZSwgaHRtbCkgLT5cbiAgICB3aW5kb3cuZGlhbG9nLmh0bWwgaHRtbFxuICAgIHdpbmRvdy5kaWFsb2cuZGlhbG9nIFwib3B0aW9uXCIsIFwidGl0bGVcIiwgd2lraS5yZXNvbHZlTGlua3ModGl0bGUpXG4gICAgd2luZG93LmRpYWxvZy5kaWFsb2cgJ29wZW4nXG5cbiMgRlVOQ1RJT05TIHVzZWQgYnkgcGx1Z2lucyBhbmQgZWxzZXdoZXJlXG5cbiAgc2xlZXAgPSAodGltZSwgZG9uZSkgLT4gc2V0VGltZW91dCBkb25lLCB0aW1lXG5cbiAgd2lraS5yZW1vdmVJdGVtID0gKCRpdGVtLCBpdGVtKSAtPlxuICAgIHBhZ2VIYW5kbGVyLnB1dCAkaXRlbS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7dHlwZTogJ3JlbW92ZScsIGlkOiBpdGVtLmlkfVxuICAgICRpdGVtLnJlbW92ZSgpXG5cbiAgd2lraS5jcmVhdGVJdGVtID0gKCRwYWdlLCAkYmVmb3JlLCBpdGVtKSAtPlxuICAgICRwYWdlID0gJGJlZm9yZS5wYXJlbnRzKCcucGFnZScpIHVubGVzcyAkcGFnZT9cbiAgICBpdGVtLmlkID0gdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICRpdGVtID0gJCBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCJpdGVtICN7aXRlbS50eXBlfVwiIGRhdGEtaWQ9XCIje31cIjwvZGl2PlxuICAgIFwiXCJcIlxuICAgICRpdGVtXG4gICAgICAuZGF0YSgnaXRlbScsIGl0ZW0pXG4gICAgICAuZGF0YSgncGFnZUVsZW1lbnQnLCAkcGFnZSlcbiAgICBpZiAkYmVmb3JlP1xuICAgICAgJGJlZm9yZS5hZnRlciAkaXRlbVxuICAgIGVsc2VcbiAgICAgICRwYWdlLmZpbmQoJy5zdG9yeScpLmFwcGVuZCAkaXRlbVxuICAgIHBsdWdpbi5kbyAkaXRlbSwgaXRlbVxuICAgIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbSAkYmVmb3JlXG4gICAgc2xlZXAgNTAwLCAtPlxuICAgICAgcGFnZUhhbmRsZXIucHV0ICRwYWdlLCB7aXRlbSwgaWQ6IGl0ZW0uaWQsIHR5cGU6ICdhZGQnLCBhZnRlcjogYmVmb3JlPy5pZH1cbiAgICAkaXRlbVxuXG4gIGNyZWF0ZVRleHRFbGVtZW50ID0gKHBhZ2VFbGVtZW50LCBiZWZvcmVFbGVtZW50LCBpbml0aWFsVGV4dCkgLT5cbiAgICBpdGVtID1cbiAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnXG4gICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgdGV4dDogaW5pdGlhbFRleHRcbiAgICBpdGVtRWxlbWVudCA9ICQgXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbSBwYXJhZ3JhcGhcIiBkYXRhLWlkPSN7aXRlbS5pZH0+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgIGl0ZW1FbGVtZW50XG4gICAgICAuZGF0YSgnaXRlbScsIGl0ZW0pXG4gICAgICAuZGF0YSgncGFnZUVsZW1lbnQnLCBwYWdlRWxlbWVudClcbiAgICBiZWZvcmVFbGVtZW50LmFmdGVyIGl0ZW1FbGVtZW50XG4gICAgcGx1Z2luLmRvIGl0ZW1FbGVtZW50LCBpdGVtXG4gICAgaXRlbUJlZm9yZSA9IHdpa2kuZ2V0SXRlbSBiZWZvcmVFbGVtZW50XG4gICAgd2lraS50ZXh0RWRpdG9yIGl0ZW1FbGVtZW50LCBpdGVtXG4gICAgc2xlZXAgNTAwLCAtPiBwYWdlSGFuZGxlci5wdXQgcGFnZUVsZW1lbnQsIHtpdGVtOiBpdGVtLCBpZDogaXRlbS5pZCwgdHlwZTogJ2FkZCcsIGFmdGVyOiBpdGVtQmVmb3JlPy5pZH1cblxuICB0ZXh0RWRpdG9yID0gd2lraS50ZXh0RWRpdG9yID0gKGRpdiwgaXRlbSwgY2FyZXRQb3MsIGRvdWJsZUNsaWNrZWQpIC0+XG4gICAgcmV0dXJuIGlmIGRpdi5oYXNDbGFzcyAndGV4dEVkaXRpbmcnXG4gICAgZGl2LmFkZENsYXNzICd0ZXh0RWRpdGluZydcbiAgICB0ZXh0YXJlYSA9ICQoXCI8dGV4dGFyZWE+I3tvcmlnaW5hbCA9IGl0ZW0udGV4dCA/ICcnfTwvdGV4dGFyZWE+XCIpXG4gICAgICAuZm9jdXNvdXQgLT5cbiAgICAgICAgZGl2LnJlbW92ZUNsYXNzICd0ZXh0RWRpdGluZydcbiAgICAgICAgaWYgaXRlbS50ZXh0ID0gdGV4dGFyZWEudmFsKClcbiAgICAgICAgICBwbHVnaW4uZG8gZGl2LmVtcHR5KCksIGl0ZW1cbiAgICAgICAgICByZXR1cm4gaWYgaXRlbS50ZXh0ID09IG9yaWdpbmFsXG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IGRpdi5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7dHlwZTogJ2VkaXQnLCBpZDogaXRlbS5pZCwgaXRlbTogaXRlbX1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dCBkaXYucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge3R5cGU6ICdyZW1vdmUnLCBpZDogaXRlbS5pZH1cbiAgICAgICAgICBkaXYucmVtb3ZlKClcbiAgICAgICAgbnVsbFxuICAgICAgIyAuYmluZCAncGFzdGUnLCAoZSkgLT5cbiAgICAgICMgICB3aWtpLmxvZyAndGV4dGVkaXQgcGFzdGUnLCBlXG4gICAgICAjICAgd2lraS5sb2cgZS5vcmlnaW5hbEV2ZW50LmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dCcpXG4gICAgICAuYmluZCAna2V5ZG93bicsIChlKSAtPlxuICAgICAgICBpZiAoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSBhbmQgZS53aGljaCA9PSA4MyAjYWx0LXNcbiAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChlLmFsdEtleSB8fCBlLmN0bEtleSB8fCBlLm1ldGFLZXkpIGFuZCBlLndoaWNoID09IDczICNhbHQtaVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpIHVubGVzcyBlLnNoaWZ0S2V5XG4gICAgICAgICAgZG9JbnRlcm5hbExpbmsgXCJhYm91dCAje2l0ZW0udHlwZX0gcGx1Z2luXCIsIHBhZ2VcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgIyBwcm92aWRlcyBhdXRvbWF0aWMgbmV3IHBhcmFncmFwaHMgb24gZW50ZXIgYW5kIGNvbmNhdGVuYXRpb24gb24gYmFja3NwYWNlXG4gICAgICAgIGlmIGl0ZW0udHlwZSBpcyAncGFyYWdyYXBoJyBcbiAgICAgICAgICBzZWwgPSB1dGlsLmdldFNlbGVjdGlvblBvcyh0ZXh0YXJlYSkgIyBwb3NpdGlvbiBvZiBjYXJldCBvciBzZWxlY3RlZCB0ZXh0IGNvb3Jkc1xuICAgICAgICAgIGlmIGUud2hpY2ggaXMgJC51aS5rZXlDb2RlLkJBQ0tTUEFDRSBhbmQgc2VsLnN0YXJ0IGlzIDAgYW5kIHNlbC5zdGFydCBpcyBzZWwuZW5kIFxuICAgICAgICAgICAgcHJldkl0ZW0gPSB3aWtpLmdldEl0ZW0oZGl2LnByZXYoKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJldkl0ZW0udHlwZSBpcyAncGFyYWdyYXBoJ1xuICAgICAgICAgICAgcHJldlRleHRMZW4gPSBwcmV2SXRlbS50ZXh0Lmxlbmd0aFxuICAgICAgICAgICAgcHJldkl0ZW0udGV4dCArPSB0ZXh0YXJlYS52YWwoKVxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKCcnKSAjIE5lZWQgY3VycmVudCB0ZXh0IGFyZWEgdG8gYmUgZW1wdHkuIEl0ZW0gdGhlbiBnZXRzIGRlbGV0ZWQuXG4gICAgICAgICAgICAjIGNhcmV0IG5lZWRzIHRvIGJlIGJldHdlZW4gdGhlIG9sZCB0ZXh0IGFuZCB0aGUgbmV3IGFwcGVuZGVkIHRleHRcbiAgICAgICAgICAgIHRleHRFZGl0b3IgZGl2LnByZXYoKSwgcHJldkl0ZW0sIHByZXZUZXh0TGVuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICBlbHNlIGlmIGUud2hpY2ggaXMgJC51aS5rZXlDb2RlLkVOVEVSIGFuZCBpdGVtLnR5cGUgaXMgJ3BhcmFncmFwaCdcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3Mgc2VsXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dGFyZWEudmFsKClcbiAgICAgICAgICAgIHByZWZpeCA9IHRleHQuc3Vic3RyaW5nIDAsIHNlbC5zdGFydFxuICAgICAgICAgICAgbWlkZGxlID0gdGV4dC5zdWJzdHJpbmcoc2VsLnN0YXJ0LCBzZWwuZW5kKSBpZiBzZWwuc3RhcnQgaXNudCBzZWwuZW5kXG4gICAgICAgICAgICBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhzZWwuZW5kKVxuICAgICAgICAgICAgaWYgcHJlZml4IGlzICcnXG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnICcpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbChwcmVmaXgpXG4gICAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpXG4gICAgICAgICAgICBwYWdlRWxlbWVudCA9IGRpdi5wYXJlbnQoKS5wYXJlbnQoKVxuICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgc3VmZml4KVxuICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgbWlkZGxlKSBpZiBtaWRkbGU/XG4gICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCAnJykgaWYgcHJlZml4IGlzICcnXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICBkaXYuaHRtbCB0ZXh0YXJlYVxuICAgIGlmIGNhcmV0UG9zP1xuICAgICAgdXRpbC5zZXRDYXJldFBvc2l0aW9uIHRleHRhcmVhLCBjYXJldFBvc1xuICAgIGVsc2UgaWYgZG91YmxlQ2xpY2tlZCAjIHdlIHdhbnQgdGhlIGNhcmV0IHRvIGJlIGF0IHRoZSBlbmRcbiAgICAgIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbiB0ZXh0YXJlYSwgdGV4dGFyZWEudmFsKCkubGVuZ3RoXG4gICAgICAjc2Nyb2xscyB0byBib3R0b20gb2YgdGV4dCBhcmVhXG4gICAgICB0ZXh0YXJlYS5zY3JvbGxUb3AodGV4dGFyZWFbMF0uc2Nyb2xsSGVpZ2h0IC0gdGV4dGFyZWEuaGVpZ2h0KCkpXG4gICAgZWxzZVxuICAgICAgdGV4dGFyZWEuZm9jdXMoKVxuXG4gIGRvSW50ZXJuYWxMaW5rID0gd2lraS5kb0ludGVybmFsTGluayA9IChuYW1lLCBwYWdlLCBzaXRlPW51bGwpIC0+XG4gICAgbmFtZSA9IHdpa2kuYXNTbHVnKG5hbWUpXG4gICAgJChwYWdlKS5uZXh0QWxsKCkucmVtb3ZlKCkgaWYgcGFnZT9cbiAgICB3aWtpLmNyZWF0ZVBhZ2UobmFtZSxzaXRlKVxuICAgICAgLmFwcGVuZFRvKCQoJy5tYWluJykpXG4gICAgICAuZWFjaCByZWZyZXNoXG4gICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcblxuICBMRUZUQVJST1cgPSAzN1xuICBSSUdIVEFSUk9XID0gMzlcblxuICAkKGRvY3VtZW50KS5rZXlkb3duIChldmVudCkgLT5cbiAgICBkaXJlY3Rpb24gPSBzd2l0Y2ggZXZlbnQud2hpY2hcbiAgICAgIHdoZW4gTEVGVEFSUk9XIHRoZW4gLTFcbiAgICAgIHdoZW4gUklHSFRBUlJPVyB0aGVuICsxXG4gICAgaWYgZGlyZWN0aW9uICYmIG5vdCAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgaXMgXCJURVhUQVJFQVwiKVxuICAgICAgcGFnZXMgPSAkKCcucGFnZScpXG4gICAgICBuZXdJbmRleCA9IHBhZ2VzLmluZGV4KCQoJy5hY3RpdmUnKSkgKyBkaXJlY3Rpb25cbiAgICAgIGlmIDAgPD0gbmV3SW5kZXggPCBwYWdlcy5sZW5ndGhcbiAgICAgICAgYWN0aXZlLnNldChwYWdlcy5lcShuZXdJbmRleCkpXG5cbiMgSEFORExFUlMgZm9yIGpRdWVyeSBldmVudHNcblxuICAkKHdpbmRvdykub24gJ3BvcHN0YXRlJywgc3RhdGUuc2hvd1xuXG4gICQoZG9jdW1lbnQpXG4gICAgLmFqYXhFcnJvciAoZXZlbnQsIHJlcXVlc3QsIHNldHRpbmdzKSAtPlxuICAgICAgcmV0dXJuIGlmIHJlcXVlc3Quc3RhdHVzID09IDAgb3IgcmVxdWVzdC5zdGF0dXMgPT0gNDA0XG4gICAgICB3aWtpLmxvZyAnYWpheCBlcnJvcicsIGV2ZW50LCByZXF1ZXN0LCBzZXR0aW5nc1xuICAgICAgJCgnLm1haW4nKS5wcmVwZW5kIFwiXCJcIlxuICAgICAgICA8bGkgY2xhc3M9J2Vycm9yJz5cbiAgICAgICAgICBFcnJvciBvbiAje3NldHRpbmdzLnVybH06ICN7cmVxdWVzdC5yZXNwb25zZVRleHR9XG4gICAgICAgIDwvbGk+XG4gICAgICBcIlwiXCJcblxuICBnZXRUZW1wbGF0ZSA9IChzbHVnLCBkb25lKSAtPlxuICAgIHJldHVybiBkb25lKG51bGwpIHVubGVzcyBzbHVnXG4gICAgd2lraS5sb2cgJ2dldFRlbXBsYXRlJywgc2x1Z1xuICAgIHBhZ2VIYW5kbGVyLmdldFxuICAgICAgd2hlbkdvdHRlbjogKGRhdGEsc2l0ZUZvdW5kKSAtPiBkb25lKGRhdGEuc3RvcnkpXG4gICAgICB3aGVuTm90R290dGVuOiAtPiBkb25lKG51bGwpXG4gICAgICBwYWdlSW5mb3JtYXRpb246IHtzbHVnOiBzbHVnfVxuXG4gIGZpbmlzaENsaWNrID0gKGUsIG5hbWUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlJykgdW5sZXNzIGUuc2hpZnRLZXlcbiAgICBkb0ludGVybmFsTGluayBuYW1lLCBwYWdlLCAkKGUudGFyZ2V0KS5kYXRhKCdzaXRlJylcbiAgICByZXR1cm4gZmFsc2VcblxuICAkKCcubWFpbicpXG4gICAgLmRlbGVnYXRlICcuc2hvdy1wYWdlLXNvdXJjZScsICdjbGljaycsIChlKSAtPlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBwYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50KCkucGFyZW50KClcbiAgICAgIGpzb24gPSBwYWdlRWxlbWVudC5kYXRhKCdkYXRhJylcbiAgICAgIHdpa2kuZGlhbG9nIFwiSlNPTiBmb3IgI3tqc29uLnRpdGxlfVwiLCAgJCgnPHByZS8+JykudGV4dChKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKSlcblxuICAgIC5kZWxlZ2F0ZSAnLnBhZ2UnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGFjdGl2ZS5zZXQgdGhpcyB1bmxlc3MgJChlLnRhcmdldCkuaXMoXCJhXCIpXG5cbiAgICAuZGVsZWdhdGUgJy5pbnRlcm5hbCcsICdjbGljaycsIChlKSAtPlxuICAgICAgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEgJ3BhZ2VOYW1lJ1xuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9ICQoZS50YXJnZXQpLmF0dHIoJ3RpdGxlJykuc3BsaXQoJyA9PiAnKVxuICAgICAgZmluaXNoQ2xpY2sgZSwgbmFtZVxuXG4gICAgLmRlbGVnYXRlICdpbWcucmVtb3RlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBuYW1lID0gJChlLnRhcmdldCkuZGF0YSgnc2x1ZycpXG4gICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyQoZS50YXJnZXQpLmRhdGEoJ3NpdGUnKV1cbiAgICAgIGZpbmlzaENsaWNrIGUsIG5hbWVcblxuICAgIC5kZWxlZ2F0ZSAnLnJldmlzaW9uJywgJ2RibGNsaWNrJywgKGUpIC0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpXG4gICAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpXG4gICAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoLTFcbiAgICAgIGFjdGlvbiA9IHBhZ2Uuam91cm5hbFtyZXZdXG4gICAgICBqc29uID0gSlNPTi5zdHJpbmdpZnkoYWN0aW9uLCBudWxsLCAyKVxuICAgICAgd2lraS5kaWFsb2cgXCJSZXZpc2lvbiAje3Jldn0sICN7YWN0aW9uLnR5cGV9IGFjdGlvblwiLCAkKCc8cHJlLz4nKS50ZXh0KGpzb24pXG5cbiAgICAuZGVsZWdhdGUgJy5hY3Rpb24nLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgJGFjdGlvbiA9ICQoZS50YXJnZXQpXG4gICAgICBpZiAkYWN0aW9uLmlzKCcuZm9yaycpIGFuZCAobmFtZSA9ICRhY3Rpb24uZGF0YSgnc2x1ZycpKT9cbiAgICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFskYWN0aW9uLmRhdGEoJ3NpdGUnKV1cbiAgICAgICAgZmluaXNoQ2xpY2sgZSwgKG5hbWUuc3BsaXQgJ18nKVswXVxuICAgICAgZWxzZVxuICAgICAgICAkcGFnZSA9ICQodGhpcykucGFyZW50cygnLnBhZ2UnKVxuICAgICAgICBzbHVnID0gd2lraS5hc1NsdWcoJHBhZ2UuZGF0YSgnZGF0YScpLnRpdGxlKVxuICAgICAgICByZXYgPSAkKHRoaXMpLnBhcmVudCgpLmNoaWxkcmVuKCkuaW5kZXgoJGFjdGlvbilcbiAgICAgICAgJHBhZ2UubmV4dEFsbCgpLnJlbW92ZSgpIHVubGVzcyBlLnNoaWZ0S2V5XG4gICAgICAgIHdpa2kuY3JlYXRlUGFnZShcIiN7c2x1Z31fcmV2I3tyZXZ9XCIsICRwYWdlLmRhdGEoJ3NpdGUnKSlcbiAgICAgICAgICAuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICAgICAgICAuZWFjaCByZWZyZXNoXG4gICAgICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG5cbiAgICAuZGVsZWdhdGUgJy5mb3JrLXBhZ2UnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIHBhZ2VFbGVtZW50ID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKVxuICAgICAgaWYgcGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2xvY2FsJylcbiAgICAgICAgdW5sZXNzIHdpa2kudXNlTG9jYWxTdG9yYWdlKClcbiAgICAgICAgICBpdGVtID0gcGFnZUVsZW1lbnQuZGF0YSgnZGF0YScpXG4gICAgICAgICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2xvY2FsJylcbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQgcGFnZUVsZW1lbnQsIHt0eXBlOiAnZm9yaycsIGl0ZW19ICMgcHVzaFxuICAgICAgZWxzZVxuICAgICAgICBpZiAocmVtb3RlU2l0ZSA9IHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKSk/XG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IHBhZ2VFbGVtZW50LCB7dHlwZTonZm9yaycsIHNpdGU6IHJlbW90ZVNpdGV9ICMgcHVsbFxuXG4gICAgLmRlbGVnYXRlICcuYWN0aW9uJywgJ2hvdmVyJywgLT5cbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJylcbiAgICAgICQoXCJbZGF0YS1pZD0je2lkfV1cIikudG9nZ2xlQ2xhc3MoJ3RhcmdldCcpXG4gICAgICAkKCcubWFpbicpLnRyaWdnZXIoJ3JldicpXG5cbiAgICAuZGVsZWdhdGUgJy5pdGVtJywgJ2hvdmVyJywgLT5cbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJylcbiAgICAgICQoXCIuYWN0aW9uW2RhdGEtaWQ9I3tpZH1dXCIpLnRvZ2dsZUNsYXNzKCd0YXJnZXQnKVxuXG4gICAgLmRlbGVnYXRlICdidXR0b24uY3JlYXRlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBnZXRUZW1wbGF0ZSAkKGUudGFyZ2V0KS5kYXRhKCdzbHVnJyksIChzdG9yeSkgLT5cbiAgICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gICAgICAgICRwYWdlLnJlbW92ZUNsYXNzICdnaG9zdCdcbiAgICAgICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKVxuICAgICAgICBwYWdlLnN0b3J5ID0gc3Rvcnl8fFtdXG4gICAgICAgIHBhZ2VIYW5kbGVyLnB1dCAkcGFnZSwge3R5cGU6ICdjcmVhdGUnLCBpZDogcGFnZS5pZCwgaXRlbToge3RpdGxlOnBhZ2UudGl0bGUsIHN0b3J5OiBzdG9yeXx8dW5kZWZpbmVkfX1cbiAgICAgICAgd2lraS5idWlsZFBhZ2UgcGFnZSwgbnVsbCwgJHBhZ2UuZW1wdHkoKVxuXG4gICAgLmRlbGVnYXRlICcuZ2hvc3QnLCAncmV2JywgKGUpIC0+XG4gICAgICB3aWtpLmxvZyAncmV2JywgZVxuICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gICAgICAkaXRlbSA9ICRwYWdlLmZpbmQoJy50YXJnZXQnKVxuICAgICAgcG9zaXRpb24gPSAkaXRlbS5vZmZzZXQoKS50b3AgKyAkcGFnZS5zY3JvbGxUb3AoKSAtICRwYWdlLmhlaWdodCgpLzJcbiAgICAgIHdpa2kubG9nICdzY3JvbGwnLCAkcGFnZSwgJGl0ZW0sIHBvc2l0aW9uXG4gICAgICAkcGFnZS5zdG9wKCkuYW5pbWF0ZSB7c2Nyb2xsVG9wOiBwb3N0aW9ufSwgJ3Nsb3cnXG5cbiAgICAuZGVsZWdhdGUgJy5zY29yZScsICdob3ZlcicsIChlKSAtPlxuICAgICAgJCgnLm1haW4nKS50cmlnZ2VyICd0aHVtYicsICQoZS50YXJnZXQpLmRhdGEoJ3RodW1iJylcblxuICAkKFwiLnByb3ZpZGVyIGlucHV0XCIpLmNsaWNrIC0+XG4gICAgJChcImZvb3RlciBpbnB1dDpmaXJzdFwiKS52YWwgJCh0aGlzKS5hdHRyKCdkYXRhLXByb3ZpZGVyJylcbiAgICAkKFwiZm9vdGVyIGZvcm1cIikuc3VibWl0KClcblxuICAkKCdib2R5Jykub24gJ25ldy1uZWlnaGJvci1kb25lJywgKGUsIG5laWdoYm9yKSAtPlxuICAgICQoJy5wYWdlJykuZWFjaCAoaW5kZXgsIGVsZW1lbnQpIC0+XG4gICAgICB3aWtpLmVtaXRUd2lucyAkKGVsZW1lbnQpXG5cbiAgJCAtPlxuICAgIHN0YXRlLmZpcnN0KClcbiAgICAkKCcucGFnZScpLmVhY2ggcmVmcmVzaFxuICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gKHBhZ2UpIC0+XG4gIHN5bm9wc2lzID0gcGFnZS5zeW5vcHNpc1xuICBpZiBwYWdlPyAmJiBwYWdlLnN0b3J5P1xuICAgIHAxID0gcGFnZS5zdG9yeVswXVxuICAgIHAyID0gcGFnZS5zdG9yeVsxXVxuICAgIHN5bm9wc2lzIHx8PSBwMS50ZXh0IGlmIHAxICYmIHAxLnR5cGUgPT0gJ3BhcmFncmFwaCdcbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50eXBlID09ICdwYXJhZ3JhcGgnXG4gICAgc3lub3BzaXMgfHw9IHAxLnRleHQgaWYgcDEgJiYgcDEudGV4dD9cbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50ZXh0P1xuICAgIHN5bm9wc2lzIHx8PSBwYWdlLnN0b3J5PyAmJiBcIkEgcGFnZSB3aXRoICN7cGFnZS5zdG9yeS5sZW5ndGh9IGl0ZW1zLlwiXG4gIGVsc2VcbiAgICBzeW5vcHNpcyA9ICdBIHBhZ2Ugd2l0aCBubyBzdG9yeS4nXG4gIHJldHVybiBzeW5vcHNpc1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFjdGl2ZSA9IHt9XG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIHRoZSBhY3RpdmUgcGFnZSwgYW5kIHNjcm9sbCB2aWV3cG9ydCB0byBzaG93IGl0XG5cbmFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSB1bmRlZmluZWRcbmZpbmRTY3JvbGxDb250YWluZXIgPSAtPlxuICBzY3JvbGxlZCA9ICQoXCJib2R5LCBodG1sXCIpLmZpbHRlciAtPiAkKHRoaXMpLnNjcm9sbExlZnQoKSA+IDBcbiAgaWYgc2Nyb2xsZWQubGVuZ3RoID4gMFxuICAgIHNjcm9sbGVkXG4gIGVsc2VcbiAgICAkKFwiYm9keSwgaHRtbFwiKS5zY3JvbGxMZWZ0KDEyKS5maWx0ZXIoLT4gJCh0aGlzKS5zY3JvbGxMZWZ0KCkgPiAwKS5zY3JvbGxUb3AoMClcblxuc2Nyb2xsVG8gPSAoZWwpIC0+XG4gIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPz0gZmluZFNjcm9sbENvbnRhaW5lcigpXG4gIGJvZHlXaWR0aCA9ICQoXCJib2R5XCIpLndpZHRoKClcbiAgbWluWCA9IGFjdGl2ZS5zY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCgpXG4gIG1heFggPSBtaW5YICsgYm9keVdpZHRoXG4gIHRhcmdldCA9IGVsLnBvc2l0aW9uKCkubGVmdFxuICB3aWR0aCA9IGVsLm91dGVyV2lkdGgodHJ1ZSlcbiAgY29udGVudFdpZHRoID0gJChcIi5wYWdlXCIpLm91dGVyV2lkdGgodHJ1ZSkgKiAkKFwiLnBhZ2VcIikuc2l6ZSgpXG5cbiAgaWYgdGFyZ2V0IDwgbWluWFxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiB0YXJnZXRcbiAgZWxzZSBpZiB0YXJnZXQgKyB3aWR0aCA+IG1heFhcbiAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUgc2Nyb2xsTGVmdDogdGFyZ2V0IC0gKGJvZHlXaWR0aCAtIHdpZHRoKVxuICBlbHNlIGlmIG1heFggPiAkKFwiLnBhZ2VzXCIpLm91dGVyV2lkdGgoKVxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiBNYXRoLm1pbih0YXJnZXQsIGNvbnRlbnRXaWR0aCAtIGJvZHlXaWR0aClcblxuYWN0aXZlLnNldCA9IChlbCkgLT5cbiAgZWwgPSAkKGVsKVxuICAkKFwiLmFjdGl2ZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICBzY3JvbGxUbyBlbC5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuXG4iLCJ3aWtpID0gcmVxdWlyZSAnLi93aWtpLmNvZmZlZSdcbm1vZHVsZS5leHBvcnRzID0gd2lraS51dGlsID0gdXRpbCA9IHt9XG5cbnV0aWwuc3ltYm9scyA9XG4gIGNyZWF0ZTogJ+KYvCdcbiAgYWRkOiAnKydcbiAgZWRpdDogJ+KcjidcbiAgZm9yazogJ+KakSdcbiAgbW92ZTogJ+KGlSdcbiAgcmVtb3ZlOiAn4pyVJ1xuXG51dGlsLnJhbmRvbUJ5dGUgPSAtPlxuICAoKCgxK01hdGgucmFuZG9tKCkpKjB4MTAwKXwwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpXG5cbnV0aWwucmFuZG9tQnl0ZXMgPSAobikgLT5cbiAgKHV0aWwucmFuZG9tQnl0ZSgpIGZvciBbMS4ubl0pLmpvaW4oJycpXG5cbiMgZm9yIGNoYXJ0IHBsdWctaW5cbnV0aWwuZm9ybWF0VGltZSA9ICh0aW1lKSAtPlxuICBkID0gbmV3IERhdGUgKGlmIHRpbWUgPiAxMDAwMDAwMDAwMCB0aGVuIHRpbWUgZWxzZSB0aW1lKjEwMDApXG4gIG1vID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddW2QuZ2V0TW9udGgoKV1cbiAgaCA9IGQuZ2V0SG91cnMoKVxuICBhbSA9IGlmIGggPCAxMiB0aGVuICdBTScgZWxzZSAnUE0nXG4gIGggPSBpZiBoID09IDAgdGhlbiAxMiBlbHNlIGlmIGggPiAxMiB0aGVuIGggLSAxMiBlbHNlIGhcbiAgbWkgPSAoaWYgZC5nZXRNaW51dGVzKCkgPCAxMCB0aGVuIFwiMFwiIGVsc2UgXCJcIikgKyBkLmdldE1pbnV0ZXMoKVxuICBcIiN7aH06I3ttaX0gI3thbX08YnI+I3tkLmdldERhdGUoKX0gI3ttb30gI3tkLmdldEZ1bGxZZWFyKCl9XCJcblxuIyBmb3Igam91cm5hbCBtb3VzZS1vdmVycyBhbmQgcG9zc2libHkgZm9yIGRhdGUgaGVhZGVyXG51dGlsLmZvcm1hdERhdGUgPSAobXNTaW5jZUVwb2NoKSAtPlxuICBkID0gbmV3IERhdGUobXNTaW5jZUVwb2NoKVxuICB3ayA9IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J11bZC5nZXREYXkoKV1cbiAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXVxuICBkYXkgPSBkLmdldERhdGUoKTtcbiAgeXIgPSBkLmdldEZ1bGxZZWFyKCk7XG4gIGggPSBkLmdldEhvdXJzKClcbiAgYW0gPSBpZiBoIDwgMTIgdGhlbiAnQU0nIGVsc2UgJ1BNJ1xuICBoID0gaWYgaCA9PSAwIHRoZW4gMTIgZWxzZSBpZiBoID4gMTIgdGhlbiBoIC0gMTIgZWxzZSBoXG4gIG1pID0gKGlmIGQuZ2V0TWludXRlcygpIDwgMTAgdGhlbiBcIjBcIiBlbHNlIFwiXCIpICsgZC5nZXRNaW51dGVzKClcbiAgc2VjID0gKGlmIGQuZ2V0U2Vjb25kcygpIDwgMTAgdGhlbiBcIjBcIiBlbHNlIFwiXCIpICsgZC5nZXRTZWNvbmRzKClcbiAgXCIje3drfSAje21vfSAje2RheX0sICN7eXJ9PGJyPiN7aH06I3ttaX06I3tzZWN9ICN7YW19XCJcblxudXRpbC5mb3JtYXRFbGFwc2VkVGltZSA9IChtc1NpbmNlRXBvY2gpIC0+XG4gIG1zZWNzID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbXNTaW5jZUVwb2NoKVxuICByZXR1cm4gXCIje01hdGguZmxvb3IgbXNlY3N9IG1pbGxpc2Vjb25kcyBhZ29cIiBpZiAoc2VjcyA9IG1zZWNzLzEwMDApIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3Igc2Vjc30gc2Vjb25kcyBhZ29cIiBpZiAobWlucyA9IHNlY3MvNjApIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgbWluc30gbWludXRlcyBhZ29cIiBpZiAoaHJzID0gbWlucy82MCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBocnN9IGhvdXJzIGFnb1wiIGlmIChkYXlzID0gaHJzLzI0KSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIGRheXN9IGRheXMgYWdvXCIgaWYgKHdlZWtzID0gZGF5cy83KSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIHdlZWtzfSB3ZWVrcyBhZ29cIiBpZiAobW9udGhzID0gZGF5cy8zMSkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBtb250aHN9IG1vbnRocyBhZ29cIiBpZiAoeWVhcnMgPSBkYXlzLzM2NSkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciB5ZWFyc30geWVhcnMgYWdvXCJcblxuIyBERUZBVUxUUyBmb3IgcmVxdWlyZWQgZmllbGRzXG5cbnV0aWwuZW1wdHlQYWdlID0gKCkgLT5cbiAgdGl0bGU6ICdlbXB0eSdcbiAgc3Rvcnk6IFtdXG4gIGpvdXJuYWw6IFtdXG5cblxuIyBJZiB0aGUgc2VsZWN0aW9uIHN0YXJ0IGFuZCBzZWxlY3Rpb24gZW5kIGFyZSBib3RoIHRoZSBzYW1lLFxuIyB0aGVuIHlvdSBoYXZlIHRoZSBjYXJldCBwb3NpdGlvbi4gSWYgdGhlcmUgaXMgc2VsZWN0ZWQgdGV4dCwgXG4jIHRoZSBicm93c2VyIHdpbGwgbm90IHRlbGwgeW91IHdoZXJlIHRoZSBjYXJldCBpcywgYnV0IGl0IHdpbGwgXG4jIGVpdGhlciBiZSBhdCB0aGUgYmVnaW5uaW5nIG9yIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvbiBcbiMoZGVwZW5kaW5nIG9uIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHNlbGVjdGlvbikuXG51dGlsLmdldFNlbGVjdGlvblBvcyA9IChqUXVlcnlFbGVtZW50KSAtPiBcbiAgZWwgPSBqUXVlcnlFbGVtZW50LmdldCgwKSAjIGdldHMgRE9NIE5vZGUgZnJvbSBmcm9tIGpRdWVyeSB3cmFwcGVyXG4gIGlmIGRvY3VtZW50LnNlbGVjdGlvbiAjIElFXG4gICAgZWwuZm9jdXMoKVxuICAgIHNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpXG4gICAgc2VsLm1vdmVTdGFydCAnY2hhcmFjdGVyJywgLWVsLnZhbHVlLmxlbmd0aFxuICAgIGllUG9zID0gc2VsLnRleHQubGVuZ3RoXG4gICAge3N0YXJ0OiBpZVBvcywgZW5kOiBpZVBvc31cbiAgZWxzZVxuICAgIHtzdGFydDogZWwuc2VsZWN0aW9uU3RhcnQsIGVuZDogZWwuc2VsZWN0aW9uRW5kfVxuXG51dGlsLnNldENhcmV0UG9zaXRpb24gPSAoalF1ZXJ5RWxlbWVudCwgY2FyZXRQb3MpIC0+XG4gIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMClcbiAgaWYgZWw/XG4gICAgaWYgZWwuY3JlYXRlVGV4dFJhbmdlICMgSUVcbiAgICAgIHJhbmdlID0gZWwuY3JlYXRlVGV4dFJhbmdlKClcbiAgICAgIHJhbmdlLm1vdmUgXCJjaGFyYWN0ZXJcIiwgY2FyZXRQb3NcbiAgICAgIHJhbmdlLnNlbGVjdCgpXG4gICAgZWxzZSAjIHJlc3Qgb2YgdGhlIHdvcmxkXG4gICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSBjYXJldFBvcywgY2FyZXRQb3NcbiAgICBlbC5mb2N1cygpXG5cbiIsInV0aWwgPSByZXF1aXJlKCcuL3V0aWwuY29mZmVlJylcbndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBsdWdpbiA9IHt9XG5cbiMgVE9ETzogUmVtb3ZlIHRoZXNlIG1ldGhvZHMgZnJvbSB3aWtpIG9iamVjdD9cbiNcblxuc2NyaXB0cyA9IHt9XG5nZXRTY3JpcHQgPSB3aWtpLmdldFNjcmlwdCA9ICh1cmwsIGNhbGxiYWNrID0gKCkgLT4pIC0+XG4gIGlmIHNjcmlwdHNbdXJsXT9cbiAgICBjYWxsYmFjaygpXG4gIGVsc2VcbiAgICAkLmdldFNjcmlwdCh1cmwpXG4gICAgICAuZG9uZSAtPlxuICAgICAgICBzY3JpcHRzW3VybF0gPSB0cnVlXG4gICAgICAgIGNhbGxiYWNrKClcbiAgICAgIC5mYWlsIC0+XG4gICAgICAgIGNhbGxiYWNrKClcblxucGx1Z2luLmdldCA9IHdpa2kuZ2V0UGx1Z2luID0gKG5hbWUsIGNhbGxiYWNrKSAtPlxuICByZXR1cm4gY2FsbGJhY2sod2luZG93LnBsdWdpbnNbbmFtZV0pIGlmIHdpbmRvdy5wbHVnaW5zW25hbWVdXG4gIGdldFNjcmlwdCBcIi9wbHVnaW5zLyN7bmFtZX0vI3tuYW1lfS5qc1wiLCAoKSAtPlxuICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSkgaWYgd2luZG93LnBsdWdpbnNbbmFtZV1cbiAgICBnZXRTY3JpcHQgXCIvcGx1Z2lucy8je25hbWV9LmpzXCIsICgpIC0+XG4gICAgICBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSlcblxucGx1Z2luLmRvID0gd2lraS5kb1BsdWdpbiA9IChkaXYsIGl0ZW0sIGRvbmU9LT4pIC0+XG4gIGVycm9yID0gKGV4KSAtPlxuICAgIGVycm9yRWxlbWVudCA9ICQoXCI8ZGl2IC8+XCIpLmFkZENsYXNzKCdlcnJvcicpXG4gICAgZXJyb3JFbGVtZW50LnRleHQoZXgudG9TdHJpbmcoKSlcbiAgICBkaXYuYXBwZW5kKGVycm9yRWxlbWVudClcblxuICBkaXYuZGF0YSAncGFnZUVsZW1lbnQnLCBkaXYucGFyZW50cyhcIi5wYWdlXCIpXG4gIGRpdi5kYXRhICdpdGVtJywgaXRlbVxuICBwbHVnaW4uZ2V0IGl0ZW0udHlwZSwgKHNjcmlwdCkgLT5cbiAgICB0cnlcbiAgICAgIHRocm93IFR5cGVFcnJvcihcIkNhbid0IGZpbmQgcGx1Z2luIGZvciAnI3tpdGVtLnR5cGV9J1wiKSB1bmxlc3Mgc2NyaXB0P1xuICAgICAgaWYgc2NyaXB0LmVtaXQubGVuZ3RoID4gMlxuICAgICAgICBzY3JpcHQuZW1pdCBkaXYsIGl0ZW0sIC0+XG4gICAgICAgICAgc2NyaXB0LmJpbmQgZGl2LCBpdGVtXG4gICAgICAgICAgZG9uZSgpXG4gICAgICBlbHNlXG4gICAgICAgIHNjcmlwdC5lbWl0IGRpdiwgaXRlbVxuICAgICAgICBzY3JpcHQuYmluZCBkaXYsIGl0ZW1cbiAgICAgICAgZG9uZSgpXG4gICAgY2F0Y2ggZXJyXG4gICAgICB3aWtpLmxvZyAncGx1Z2luIGVycm9yJywgZXJyXG4gICAgICBlcnJvcihlcnIpXG4gICAgICBkb25lKClcblxud2lraS5yZWdpc3RlclBsdWdpbiA9IChwbHVnaW5OYW1lLHBsdWdpbkZuKS0+XG4gIHdpbmRvdy5wbHVnaW5zW3BsdWdpbk5hbWVdID0gcGx1Z2luRm4oJClcblxuXG4jIFBMVUdJTlMgZm9yIGVhY2ggc3RvcnkgaXRlbSB0eXBlXG5cbndpbmRvdy5wbHVnaW5zID1cbiAgcGFyYWdyYXBoOlxuICAgIGVtaXQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBmb3IgdGV4dCBpbiBpdGVtLnRleHQuc3BsaXQgL1xcblxcbisvXG4gICAgICAgIGRpdi5hcHBlbmQgXCI8cD4je3dpa2kucmVzb2x2ZUxpbmtzKHRleHQpfTwvcD5cIiBpZiB0ZXh0Lm1hdGNoIC9cXFMvXG4gICAgYmluZDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGRpdi5kYmxjbGljayAtPiB3aWtpLnRleHRFZGl0b3IgZGl2LCBpdGVtLCBudWxsLCB0cnVlXG4gIGltYWdlOlxuICAgIGVtaXQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBpdGVtLnRleHQgfHw9IGl0ZW0uY2FwdGlvblxuICAgICAgZGl2LmFwcGVuZCBcIjxpbWcgY2xhc3M9dGh1bWJuYWlsIHNyYz1cXFwiI3tpdGVtLnVybH1cXFwiPiA8cD4je3dpa2kucmVzb2x2ZUxpbmtzKGl0ZW0udGV4dCl9PC9wPlwiXG4gICAgYmluZDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGRpdi5kYmxjbGljayAtPiB3aWtpLnRleHRFZGl0b3IgZGl2LCBpdGVtXG4gICAgICBkaXYuZmluZCgnaW1nJykuZGJsY2xpY2sgLT4gd2lraS5kaWFsb2cgaXRlbS50ZXh0LCB0aGlzXG4gIGZ1dHVyZTpcbiAgICBlbWl0OiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmFwcGVuZCBcIlwiXCIje2l0ZW0udGV4dH08YnI+PGJyPjxidXR0b24gY2xhc3M9XCJjcmVhdGVcIj5jcmVhdGU8L2J1dHRvbj4gbmV3IGJsYW5rIHBhZ2VcIlwiXCJcbiAgICAgIGlmIChpbmZvID0gd2lraS5uZWlnaGJvcmhvb2RbbG9jYXRpb24uaG9zdF0pPyBhbmQgaW5mby5zaXRlbWFwP1xuICAgICAgICBmb3IgaXRlbSBpbiBpbmZvLnNpdGVtYXBcbiAgICAgICAgICBpZiBpdGVtLnNsdWcubWF0Y2ggLy10ZW1wbGF0ZSQvXG4gICAgICAgICAgICBkaXYuYXBwZW5kIFwiXCJcIjxicj48YnV0dG9uIGNsYXNzPVwiY3JlYXRlXCIgZGF0YS1zbHVnPSN7aXRlbS5zbHVnfT5jcmVhdGU8L2J1dHRvbj4gZnJvbSAje3dpa2kucmVzb2x2ZUxpbmtzIFwiW1sje2l0ZW0udGl0bGV9XV1cIn1cIlwiXCJcbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuIiwid2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSB7fVxuXG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIGxvY2F0aW9uIGJhciBhbmQgYmFjayBidXR0b25cblxuc3RhdGUucGFnZXNJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPiBlbC5pZFxuXG5zdGF0ZS51cmxQYWdlcyA9IC0+XG4gIChpIGZvciBpIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKSBieSAyKVsxLi5dXG5cbnN0YXRlLmxvY3NJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPlxuICAgICQoZWwpLmRhdGEoJ3NpdGUnKSBvciAndmlldydcblxuc3RhdGUudXJsTG9jcyA9IC0+XG4gIChqIGZvciBqIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKVsxLi5dIGJ5IDIpXG5cbnN0YXRlLnNldFVybCA9IC0+XG4gIGRvY3VtZW50LnRpdGxlID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKT8udGl0bGVcbiAgaWYgaGlzdG9yeSBhbmQgaGlzdG9yeS5wdXNoU3RhdGVcbiAgICBsb2NzID0gc3RhdGUubG9jc0luRG9tKClcbiAgICBwYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICAgIHVybCA9IChcIi8je2xvY3M/W2lkeF0gb3IgJ3ZpZXcnfS8je3BhZ2V9XCIgZm9yIHBhZ2UsIGlkeCBpbiBwYWdlcykuam9pbignJylcbiAgICB1bmxlc3MgdXJsIGlzICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJylcbiAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIHVybClcblxuc3RhdGUuc2hvdyA9IChlKSAtPlxuICBvbGRQYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICBuZXdQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgb2xkTG9jcyA9IHN0YXRlLmxvY3NJbkRvbSgpXG4gIG5ld0xvY3MgPSBzdGF0ZS51cmxMb2NzKClcblxuICByZXR1cm4gaWYgKCFsb2NhdGlvbi5wYXRobmFtZSBvciBsb2NhdGlvbi5wYXRobmFtZSBpcyAnLycpXG5cbiAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKDApXG5cbiAgZm9yIG5hbWUsIGlkeCBpbiBuZXdQYWdlc1xuICAgIHVubGVzcyBuYW1lIGlzIG9sZFBhZ2VzW2lkeF1cbiAgICAgIG9sZCA9ICQoJy5wYWdlJykuZXEoaWR4KVxuICAgICAgb2xkLnJlbW92ZSgpIGlmIG9sZFxuICAgICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsIG5ld0xvY3NbaWR4XSkuaW5zZXJ0QWZ0ZXIocHJldmlvdXMpLmVhY2ggd2lraS5yZWZyZXNoXG4gICAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKGlkeClcblxuICBwcmV2aW91cy5uZXh0QWxsKCkucmVtb3ZlKClcblxuICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuICBkb2N1bWVudC50aXRsZSA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJyk/LnRpdGxlXG5cbnN0YXRlLmZpcnN0ID0gLT5cbiAgc3RhdGUuc2V0VXJsKClcbiAgZmlyc3RVcmxQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgZmlyc3RVcmxMb2NzID0gc3RhdGUudXJsTG9jcygpXG4gIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpXG4gIGZvciB1cmxQYWdlLCBpZHggaW4gZmlyc3RVcmxQYWdlcyB3aGVuIHVybFBhZ2Ugbm90IGluIG9sZFBhZ2VzXG4gICAgd2lraS5jcmVhdGVQYWdlKHVybFBhZ2UsIGZpcnN0VXJsTG9jc1tpZHhdKS5hcHBlbmRUbygnLm1haW4nKSB1bmxlc3MgdXJsUGFnZSBpcyAnJ1xuXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcblxud2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbnN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZS5jb2ZmZWUnXG5yZXZpc2lvbiA9IHJlcXVpcmUgJy4vcmV2aXNpb24uY29mZmVlJ1xuYWRkVG9Kb3VybmFsID0gcmVxdWlyZSAnLi9hZGRUb0pvdXJuYWwuY29mZmVlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhZ2VIYW5kbGVyID0ge31cblxucGFnZUZyb21Mb2NhbFN0b3JhZ2UgPSAoc2x1ZyktPlxuICBpZiBqc29uID0gbG9jYWxTdG9yYWdlW3NsdWddXG4gICAgSlNPTi5wYXJzZShqc29uKVxuICBlbHNlXG4gICAgdW5kZWZpbmVkXG5cbnJlY3Vyc2l2ZUdldCA9ICh7cGFnZUluZm9ybWF0aW9uLCB3aGVuR290dGVuLCB3aGVuTm90R290dGVuLCBsb2NhbENvbnRleHR9KSAtPlxuICB7c2x1ZyxyZXYsc2l0ZX0gPSBwYWdlSW5mb3JtYXRpb25cblxuICBpZiBzaXRlXG4gICAgbG9jYWxDb250ZXh0ID0gW11cbiAgZWxzZVxuICAgIHNpdGUgPSBsb2NhbENvbnRleHQuc2hpZnQoKVxuXG4gIHNpdGUgPSBudWxsIGlmIHNpdGU9PSd2aWV3J1xuXG4gIGlmIHNpdGU/XG4gICAgaWYgc2l0ZSA9PSAnbG9jYWwnXG4gICAgICBpZiBsb2NhbFBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlSW5mb3JtYXRpb24uc2x1ZylcbiAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4oIGxvY2FsUGFnZSwgJ2xvY2FsJyApXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB3aGVuTm90R290dGVuKClcbiAgICBlbHNlXG4gICAgICBpZiBzaXRlID09ICdvcmlnaW4nXG4gICAgICAgIHVybCA9IFwiLyN7c2x1Z30uanNvblwiXG4gICAgICBlbHNlXG4gICAgICAgIHVybCA9IFwiaHR0cDovLyN7c2l0ZX0vI3tzbHVnfS5qc29uXCJcbiAgZWxzZVxuICAgIHVybCA9IFwiLyN7c2x1Z30uanNvblwiXG5cbiAgJC5hamF4XG4gICAgdHlwZTogJ0dFVCdcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgdXJsOiB1cmwgKyBcIj9yYW5kb209I3t1dGlsLnJhbmRvbUJ5dGVzKDQpfVwiXG4gICAgc3VjY2VzczogKHBhZ2UpIC0+XG4gICAgICBwYWdlID0gcmV2aXNpb24uY3JlYXRlIHJldiwgcGFnZSBpZiByZXZcbiAgICAgIHJldHVybiB3aGVuR290dGVuKHBhZ2Usc2l0ZSlcbiAgICBlcnJvcjogKHhociwgdHlwZSwgbXNnKSAtPlxuICAgICAgaWYgKHhoci5zdGF0dXMgIT0gNDA0KSBhbmQgKHhoci5zdGF0dXMgIT0gMClcbiAgICAgICAgd2lraS5sb2cgJ3BhZ2VIYW5kbGVyLmdldCBlcnJvcicsIHhociwgeGhyLnN0YXR1cywgdHlwZSwgbXNnXG4gICAgICAgIHJlcG9ydCA9XG4gICAgICAgICAgJ3RpdGxlJzogXCIje3hoci5zdGF0dXN9ICN7bXNnfVwiXG4gICAgICAgICAgJ3N0b3J5JzogW1xuICAgICAgICAgICAgJ3R5cGUnOiAncGFyYWdyYXBoJ1xuICAgICAgICAgICAgJ2lkJzogJzkyODczOTE4NzI0MydcbiAgICAgICAgICAgICd0ZXh0JzogXCI8cHJlPiN7eGhyLnJlc3BvbnNlVGV4dH1cIlxuICAgICAgICAgIF1cbiAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4gcmVwb3J0LCAnbG9jYWwnXG4gICAgICBpZiBsb2NhbENvbnRleHQubGVuZ3RoID4gMFxuICAgICAgICByZWN1cnNpdmVHZXQoIHtwYWdlSW5mb3JtYXRpb24sIHdoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW4sIGxvY2FsQ29udGV4dH0gKVxuICAgICAgZWxzZVxuICAgICAgICB3aGVuTm90R290dGVuKClcblxucGFnZUhhbmRsZXIuZ2V0ID0gKHt3aGVuR290dGVuLHdoZW5Ob3RHb3R0ZW4scGFnZUluZm9ybWF0aW9ufSAgKSAtPlxuXG4gIHVubGVzcyBwYWdlSW5mb3JtYXRpb24uc2l0ZVxuICAgIGlmIGxvY2FsUGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VJbmZvcm1hdGlvbi5zbHVnKVxuICAgICAgbG9jYWxQYWdlID0gcmV2aXNpb24uY3JlYXRlIHBhZ2VJbmZvcm1hdGlvbi5yZXYsIGxvY2FsUGFnZSBpZiBwYWdlSW5mb3JtYXRpb24ucmV2XG4gICAgICByZXR1cm4gd2hlbkdvdHRlbiggbG9jYWxQYWdlLCAnbG9jYWwnIClcblxuICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyd2aWV3J10gdW5sZXNzIHBhZ2VIYW5kbGVyLmNvbnRleHQubGVuZ3RoXG5cbiAgcmVjdXJzaXZlR2V0XG4gICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cbiAgICB3aGVuR290dGVuOiB3aGVuR290dGVuXG4gICAgd2hlbk5vdEdvdHRlbjogd2hlbk5vdEdvdHRlblxuICAgIGxvY2FsQ29udGV4dDogXy5jbG9uZShwYWdlSGFuZGxlci5jb250ZXh0KVxuXG5cbnBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbXVxuXG5wdXNoVG9Mb2NhbCA9IChwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbikgLT5cbiAgcGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlIHBhZ2VQdXRJbmZvLnNsdWdcbiAgcGFnZSA9IHt0aXRsZTogYWN0aW9uLml0ZW0udGl0bGV9IGlmIGFjdGlvbi50eXBlID09ICdjcmVhdGUnXG4gIHBhZ2UgfHw9IHBhZ2VFbGVtZW50LmRhdGEoXCJkYXRhXCIpXG4gIHBhZ2Uuam91cm5hbCA9IFtdIHVubGVzcyBwYWdlLmpvdXJuYWw/XG4gIGlmIChzaXRlPWFjdGlvblsnZm9yayddKT9cbiAgICBwYWdlLmpvdXJuYWwgPSBwYWdlLmpvdXJuYWwuY29uY2F0KHsndHlwZSc6J2ZvcmsnLCdzaXRlJzpzaXRlfSlcbiAgICBkZWxldGUgYWN0aW9uWydmb3JrJ11cbiAgcGFnZS5qb3VybmFsID0gcGFnZS5qb3VybmFsLmNvbmNhdChhY3Rpb24pXG4gIHBhZ2Uuc3RvcnkgPSAkKHBhZ2VFbGVtZW50KS5maW5kKFwiLml0ZW1cIikubWFwKC0+ICQoQCkuZGF0YShcIml0ZW1cIikpLmdldCgpXG4gIGxvY2FsU3RvcmFnZVtwYWdlUHV0SW5mby5zbHVnXSA9IEpTT04uc3RyaW5naWZ5KHBhZ2UpXG4gIGFkZFRvSm91cm5hbCBwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCBhY3Rpb25cblxucHVzaFRvU2VydmVyID0gKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKSAtPlxuICAkLmFqYXhcbiAgICB0eXBlOiAnUFVUJ1xuICAgIHVybDogXCIvcGFnZS8je3BhZ2VQdXRJbmZvLnNsdWd9L2FjdGlvblwiXG4gICAgZGF0YTpcbiAgICAgICdhY3Rpb24nOiBKU09OLnN0cmluZ2lmeShhY3Rpb24pXG4gICAgc3VjY2VzczogKCkgLT5cbiAgICAgIGFkZFRvSm91cm5hbCBwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCBhY3Rpb25cbiAgICAgIGlmIGFjdGlvbi50eXBlID09ICdmb3JrJyAjIHB1c2hcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0gcGFnZUVsZW1lbnQuYXR0cignaWQnKVxuICAgICAgICBzdGF0ZS5zZXRVcmxcbiAgICBlcnJvcjogKHhociwgdHlwZSwgbXNnKSAtPlxuICAgICAgd2lraS5sb2cgXCJwYWdlSGFuZGxlci5wdXQgYWpheCBlcnJvciBjYWxsYmFja1wiLCB0eXBlLCBtc2dcblxucGFnZUhhbmRsZXIucHV0ID0gKHBhZ2VFbGVtZW50LCBhY3Rpb24pIC0+XG5cbiAgY2hlY2tlZFNpdGUgPSAoKSAtPlxuICAgIHN3aXRjaCBzaXRlID0gcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpXG4gICAgICB3aGVuICdvcmlnaW4nLCAnbG9jYWwnLCAndmlldycgdGhlbiBudWxsXG4gICAgICB3aGVuIGxvY2F0aW9uLmhvc3QgdGhlbiBudWxsXG4gICAgICBlbHNlIHNpdGVcblxuICAjIGFib3V0IHRoZSBwYWdlIHdlIGhhdmVcbiAgcGFnZVB1dEluZm8gPSB7XG4gICAgc2x1ZzogcGFnZUVsZW1lbnQuYXR0cignaWQnKS5zcGxpdCgnX3JldicpWzBdXG4gICAgcmV2OiBwYWdlRWxlbWVudC5hdHRyKCdpZCcpLnNwbGl0KCdfcmV2JylbMV1cbiAgICBzaXRlOiBjaGVja2VkU2l0ZSgpXG4gICAgbG9jYWw6IHBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdsb2NhbCcpXG4gIH1cbiAgZm9ya0Zyb20gPSBwYWdlUHV0SW5mby5zaXRlXG4gIHdpa2kubG9nICdwYWdlSGFuZGxlci5wdXQnLCBhY3Rpb24sIHBhZ2VQdXRJbmZvXG5cbiAgIyBkZXRlY3Qgd2hlbiBmb3JrIHRvIGxvY2FsIHN0b3JhZ2VcbiAgaWYgd2lraS51c2VMb2NhbFN0b3JhZ2UoKVxuICAgIGlmIHBhZ2VQdXRJbmZvLnNpdGU/XG4gICAgICB3aWtpLmxvZyAncmVtb3RlID0+IGxvY2FsJ1xuICAgIGVsc2UgaWYgIXBhZ2VQdXRJbmZvLmxvY2FsXG4gICAgICB3aWtpLmxvZyAnb3JpZ2luID0+IGxvY2FsJ1xuICAgICAgYWN0aW9uLnNpdGUgPSBmb3JrRnJvbSA9IGxvY2F0aW9uLmhvc3RcbiAgICAjIGVsc2UgaWYgIXBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VQdXRJbmZvLnNsdWcpXG4gICAgIyAgIHdpa2kubG9nICcnXG4gICAgIyAgIGFjdGlvbi5zaXRlID0gZm9ya0Zyb20gPSBwYWdlUHV0SW5mby5zaXRlXG4gICAgIyAgIHdpa2kubG9nICdsb2NhbCBzdG9yYWdlIGZpcnN0IHRpbWUnLCBhY3Rpb24sICdmb3JrRnJvbScsIGZvcmtGcm9tXG5cbiAgIyB0d2VlayBhY3Rpb24gYmVmb3JlIHNhdmluZ1xuICBhY3Rpb24uZGF0ZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKClcbiAgZGVsZXRlIGFjdGlvbi5zaXRlIGlmIGFjdGlvbi5zaXRlID09ICdvcmlnaW4nXG5cbiAgIyB1cGRhdGUgZG9tIHdoZW4gZm9ya2luZ1xuICBpZiBmb3JrRnJvbVxuICAgICMgcHVsbCByZW1vdGUgc2l0ZSBjbG9zZXIgdG8gdXNcbiAgICBwYWdlRWxlbWVudC5maW5kKCdoMSBpbWcnKS5hdHRyKCdzcmMnLCAnL2Zhdmljb24ucG5nJylcbiAgICBwYWdlRWxlbWVudC5maW5kKCdoMSBhJykuYXR0cignaHJlZicsICcvJylcbiAgICBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJywgbnVsbClcbiAgICBwYWdlRWxlbWVudC5yZW1vdmVDbGFzcygncmVtb3RlJylcbiAgICBzdGF0ZS5zZXRVcmwoKVxuICAgIGlmIGFjdGlvbi50eXBlICE9ICdmb3JrJ1xuICAgICAgIyBidW5kbGUgaW1wbGljaXQgZm9yayB3aXRoIG5leHQgYWN0aW9uXG4gICAgICBhY3Rpb24uZm9yayA9IGZvcmtGcm9tXG4gICAgICBhZGRUb0pvdXJuYWwgcGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSxcbiAgICAgICAgdHlwZTogJ2ZvcmsnXG4gICAgICAgIHNpdGU6IGZvcmtGcm9tXG4gICAgICAgIGRhdGU6IGFjdGlvbi5kYXRlXG5cbiAgIyBzdG9yZSBhcyBhcHByb3ByaWF0ZVxuICBpZiB3aWtpLnVzZUxvY2FsU3RvcmFnZSgpIG9yIHBhZ2VQdXRJbmZvLnNpdGUgPT0gJ2xvY2FsJ1xuICAgIHB1c2hUb0xvY2FsKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKVxuICAgIHBhZ2VFbGVtZW50LmFkZENsYXNzKFwibG9jYWxcIilcbiAgZWxzZVxuICAgIHB1c2hUb1NlcnZlcihwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbilcblxuIiwiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUnXG5cbnV0aWwgPSByZXF1aXJlICcuL3V0aWwuY29mZmVlJ1xucGFnZUhhbmRsZXIgPSByZXF1aXJlICcuL3BhZ2VIYW5kbGVyLmNvZmZlZSdcbnBsdWdpbiA9IHJlcXVpcmUgJy4vcGx1Z2luLmNvZmZlZSdcbnN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZS5jb2ZmZWUnXG5uZWlnaGJvcmhvb2QgPSByZXF1aXJlICcuL25laWdoYm9yaG9vZC5jb2ZmZWUnXG5hZGRUb0pvdXJuYWwgPSByZXF1aXJlICcuL2FkZFRvSm91cm5hbC5jb2ZmZWUnXG53aWtpID0gcmVxdWlyZSgnLi93aWtpLmNvZmZlZScpXG5cbmhhbmRsZURyYWdnaW5nID0gKGV2dCwgdWkpIC0+XG4gIGl0ZW1FbGVtZW50ID0gdWkuaXRlbVxuXG4gIGl0ZW0gPSB3aWtpLmdldEl0ZW0oaXRlbUVsZW1lbnQpXG4gIHRoaXNQYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50cygnLnBhZ2U6Zmlyc3QnKVxuICBzb3VyY2VQYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JylcbiAgc291cmNlU2l0ZSA9IHNvdXJjZVBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKVxuXG4gIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIGVxdWFscyA9IChhLCBiKSAtPiBhIGFuZCBiIGFuZCBhLmdldCgwKSA9PSBiLmdldCgwKVxuXG4gIG1vdmVXaXRoaW5QYWdlID0gbm90IHNvdXJjZVBhZ2VFbGVtZW50IG9yIGVxdWFscyhzb3VyY2VQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudClcbiAgbW92ZUZyb21QYWdlID0gbm90IG1vdmVXaXRoaW5QYWdlIGFuZCBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBzb3VyY2VQYWdlRWxlbWVudClcbiAgbW92ZVRvUGFnZSA9IG5vdCBtb3ZlV2l0aGluUGFnZSBhbmQgZXF1YWxzKHRoaXNQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudClcblxuICBpZiBtb3ZlRnJvbVBhZ2VcbiAgICBpZiBzb3VyY2VQYWdlRWxlbWVudC5oYXNDbGFzcygnZ2hvc3QnKSBvclxuICAgICAgc291cmNlUGFnZUVsZW1lbnQuYXR0cignaWQnKSA9PSBkZXN0aW5hdGlvblBhZ2VFbGVtZW50LmF0dHIoJ2lkJylcbiAgICAgICAgIyBzdGVtIHRoZSBkYW1hZ2UsIGJldHRlciBpZGVhcyBoZXJlOlxuICAgICAgICAjIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzkxNjA4OS9qcXVlcnktdWktc29ydGFibGVzLWNvbm5lY3QtbGlzdHMtY29weS1pdGVtc1xuICAgICAgICByZXR1cm5cblxuICBhY3Rpb24gPSBpZiBtb3ZlV2l0aGluUGFnZVxuICAgIG9yZGVyID0gJCh0aGlzKS5jaGlsZHJlbigpLm1hcCgoXywgdmFsdWUpIC0+ICQodmFsdWUpLmF0dHIoJ2RhdGEtaWQnKSkuZ2V0KClcbiAgICB7dHlwZTogJ21vdmUnLCBvcmRlcjogb3JkZXJ9XG4gIGVsc2UgaWYgbW92ZUZyb21QYWdlXG4gICAgd2lraS5sb2cgJ2RyYWcgZnJvbScsIHNvdXJjZVBhZ2VFbGVtZW50LmZpbmQoJ2gxJykudGV4dCgpXG4gICAge3R5cGU6ICdyZW1vdmUnfVxuICBlbHNlIGlmIG1vdmVUb1BhZ2VcbiAgICBpdGVtRWxlbWVudC5kYXRhICdwYWdlRWxlbWVudCcsIHRoaXNQYWdlRWxlbWVudFxuICAgIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpXG4gICAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpXG4gICAge3R5cGU6ICdhZGQnLCBpdGVtOiBpdGVtLCBhZnRlcjogYmVmb3JlPy5pZH1cbiAgYWN0aW9uLmlkID0gaXRlbS5pZFxuICBwYWdlSGFuZGxlci5wdXQgdGhpc1BhZ2VFbGVtZW50LCBhY3Rpb25cblxuaW5pdERyYWdnaW5nID0gKCRwYWdlKSAtPlxuICAkc3RvcnkgPSAkcGFnZS5maW5kKCcuc3RvcnknKVxuICAkc3Rvcnkuc29ydGFibGUoY29ubmVjdFdpdGg6ICcucGFnZSAuc3RvcnknKS5vbihcInNvcnR1cGRhdGVcIiwgaGFuZGxlRHJhZ2dpbmcpXG5cblxuaW5pdEFkZEJ1dHRvbiA9ICgkcGFnZSkgLT5cbiAgJHBhZ2UuZmluZChcIi5hZGQtZmFjdG9yeVwiKS5saXZlIFwiY2xpY2tcIiwgKGV2dCkgLT5cbiAgICByZXR1cm4gaWYgJHBhZ2UuaGFzQ2xhc3MgJ2dob3N0J1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY3JlYXRlRmFjdG9yeSgkcGFnZSlcblxuY3JlYXRlRmFjdG9yeSA9ICgkcGFnZSkgLT5cbiAgaXRlbSA9XG4gICAgdHlwZTogXCJmYWN0b3J5XCJcbiAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICBpdGVtRWxlbWVudCA9ICQoXCI8ZGl2IC8+XCIsIGNsYXNzOiBcIml0ZW0gZmFjdG9yeVwiKS5kYXRhKCdpdGVtJyxpdGVtKS5hdHRyKCdkYXRhLWlkJywgaXRlbS5pZClcbiAgaXRlbUVsZW1lbnQuZGF0YSAncGFnZUVsZW1lbnQnLCAkcGFnZVxuICAkcGFnZS5maW5kKFwiLnN0b3J5XCIpLmFwcGVuZChpdGVtRWxlbWVudClcbiAgcGx1Z2luLmRvIGl0ZW1FbGVtZW50LCBpdGVtXG4gIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpXG4gIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KVxuICBwYWdlSGFuZGxlci5wdXQgJHBhZ2UsIHtpdGVtOiBpdGVtLCBpZDogaXRlbS5pZCwgdHlwZTogXCJhZGRcIiwgYWZ0ZXI6IGJlZm9yZT8uaWR9XG5cbmJ1aWxkUGFnZUhlYWRlciA9ICh7cGFnZSx0b29sdGlwLGhlYWRlcl9ocmVmLGZhdmljb25fc3JjfSktPlxuICB0b29sdGlwICs9IFwiXFxuI3twYWdlLnBsdWdpbn0gcGx1Z2luXCIgaWYgcGFnZS5wbHVnaW5cbiAgXCJcIlwiPGgxIHRpdGxlPVwiI3t0b29sdGlwfVwiPjxhIGhyZWY9XCIje2hlYWRlcl9ocmVmfVwiPjxpbWcgc3JjPVwiI3tmYXZpY29uX3NyY31cIiBoZWlnaHQ9XCIzMnB4XCIgY2xhc3M9XCJmYXZpY29uXCI+PC9hPiAje3BhZ2UudGl0bGV9PC9oMT5cIlwiXCJcblxuZW1pdEhlYWRlciA9ICgkaGVhZGVyLCAkcGFnZSwgcGFnZSkgLT5cbiAgc2l0ZSA9ICRwYWdlLmRhdGEoJ3NpdGUnKVxuICBpc1JlbW90ZVBhZ2UgPSBzaXRlPyBhbmQgc2l0ZSAhPSAnbG9jYWwnIGFuZCBzaXRlICE9ICdvcmlnaW4nIGFuZCBzaXRlICE9ICd2aWV3J1xuICBoZWFkZXIgPSAnJ1xuXG4gIHZpZXdIZXJlID0gaWYgd2lraS5hc1NsdWcocGFnZS50aXRsZSkgaXMgJ3dlbGNvbWUtdmlzaXRvcnMnIHRoZW4gXCJcIlxuICBlbHNlIFwiL3ZpZXcvI3t3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKX1cIlxuICBwYWdlSGVhZGVyID0gaWYgaXNSZW1vdGVQYWdlXG4gICAgYnVpbGRQYWdlSGVhZGVyXG4gICAgICB0b29sdGlwOiBzaXRlXG4gICAgICBoZWFkZXJfaHJlZjogXCIvLyN7c2l0ZX0vdmlldy93ZWxjb21lLXZpc2l0b3JzI3t2aWV3SGVyZX1cIlxuICAgICAgZmF2aWNvbl9zcmM6IFwiaHR0cDovLyN7c2l0ZX0vZmF2aWNvbi5wbmdcIlxuICAgICAgcGFnZTogcGFnZVxuICBlbHNlXG4gICAgYnVpbGRQYWdlSGVhZGVyXG4gICAgICB0b29sdGlwOiBsb2NhdGlvbi5ob3N0XG4gICAgICBoZWFkZXJfaHJlZjogXCIvdmlldy93ZWxjb21lLXZpc2l0b3JzI3t2aWV3SGVyZX1cIlxuICAgICAgZmF2aWNvbl9zcmM6IFwiL2Zhdmljb24ucG5nXCJcbiAgICAgIHBhZ2U6IHBhZ2VcblxuICAkaGVhZGVyLmFwcGVuZCggcGFnZUhlYWRlciApXG4gIFxuICB1bmxlc3MgaXNSZW1vdGVQYWdlXG4gICAgJCgnaW1nLmZhdmljb24nLCRwYWdlKS5lcnJvciAoZSktPlxuICAgICAgcGx1Z2luLmdldCAnZmF2aWNvbicsIChmYXZpY29uKSAtPlxuICAgICAgICBmYXZpY29uLmNyZWF0ZSgpXG5cbiAgaWYgJHBhZ2UuYXR0cignaWQnKS5tYXRjaCAvX3Jldi9cbiAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoLTFcbiAgICBkYXRlID0gcGFnZS5qb3VybmFsW3Jldl0uZGF0ZVxuICAgICRwYWdlLmFkZENsYXNzKCdnaG9zdCcpLmRhdGEoJ3JldicscmV2KVxuICAgICRoZWFkZXIuYXBwZW5kICQgXCJcIlwiXG4gICAgICA8aDIgY2xhc3M9XCJyZXZpc2lvblwiPlxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAje2lmIGRhdGU/IHRoZW4gdXRpbC5mb3JtYXREYXRlKGRhdGUpIGVsc2UgXCJSZXZpc2lvbiAje3Jldn1cIn1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9oMj5cbiAgICBcIlwiXCJcblxuZW1pdFR3aW5zID0gd2lraS5lbWl0VHdpbnMgPSAoJHBhZ2UpIC0+XG4gIHBhZ2UgPSAkcGFnZS5kYXRhICdkYXRhJ1xuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpIG9yIHdpbmRvdy5sb2NhdGlvbi5ob3N0XG4gIHNpdGUgPSB3aW5kb3cubG9jYXRpb24uaG9zdCBpZiBzaXRlIGluIFsndmlldycsICdvcmlnaW4nXVxuICBzbHVnID0gd2lraS5hc1NsdWcgcGFnZS50aXRsZVxuICBpZiAoYWN0aW9ucyA9IHBhZ2Uuam91cm5hbD8ubGVuZ3RoKT8gYW5kICh2aWV3aW5nID0gcGFnZS5qb3VybmFsW2FjdGlvbnMtMV0/LmRhdGUpP1xuICAgIHZpZXdpbmcgPSBNYXRoLmZsb29yKHZpZXdpbmcvMTAwMCkqMTAwMFxuICAgIGJpbnMgPSB7bmV3ZXI6W10sIHNhbWU6W10sIG9sZGVyOltdfVxuICAgICMge2ZlZC53aWtpLm9yZzogW3tzbHVnOiBcImhhcHBlbmluZ3NcIiwgdGl0bGU6IFwiSGFwcGVuaW5nc1wiLCBkYXRlOiAxMzU4OTc1MzAzMDAwLCBzeW5vcHNpczogXCJDaGFuZ2VzIGhlcmUgLi4uXCJ9XX1cbiAgICBmb3IgcmVtb3RlU2l0ZSwgaW5mbyBvZiB3aWtpLm5laWdoYm9yaG9vZFxuICAgICAgaWYgcmVtb3RlU2l0ZSAhPSBzaXRlIGFuZCBpbmZvLnNpdGVtYXA/XG4gICAgICAgIGZvciBpdGVtIGluIGluZm8uc2l0ZW1hcFxuICAgICAgICAgIGlmIGl0ZW0uc2x1ZyA9PSBzbHVnXG4gICAgICAgICAgICBiaW4gPSBpZiBpdGVtLmRhdGUgPiB2aWV3aW5nIHRoZW4gYmlucy5uZXdlclxuICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmRhdGUgPCB2aWV3aW5nIHRoZW4gYmlucy5vbGRlclxuICAgICAgICAgICAgZWxzZSBiaW5zLnNhbWVcbiAgICAgICAgICAgIGJpbi5wdXNoIHtyZW1vdGVTaXRlLCBpdGVtfVxuICAgIHR3aW5zID0gW11cbiAgICAjIHtuZXdlcjpbcmVtb3RlU2l0ZTogXCJmZWQud2lraS5vcmdcIiwgaXRlbToge3NsdWc6IC4uLiwgZGF0ZTogLi4ufSwgLi4uXX1cbiAgICBmb3IgbGVnZW5kLCBiaW4gb2YgYmluc1xuICAgICAgY29udGludWUgdW5sZXNzIGJpbi5sZW5ndGhcbiAgICAgIGJpbi5zb3J0IChhLGIpIC0+XG4gICAgICAgIGEuaXRlbS5kYXRlIDwgYi5pdGVtLmRhdGVcbiAgICAgIGZsYWdzID0gZm9yIHtyZW1vdGVTaXRlLCBpdGVtfSwgaSBpbiBiaW5cbiAgICAgICAgYnJlYWsgaWYgaSA+PSA4XG4gICAgICAgIFwiXCJcIjxpbWcgY2xhc3M9XCJyZW1vdGVcIlxuICAgICAgICAgIHNyYz1cImh0dHA6Ly8je3JlbW90ZVNpdGV9L2Zhdmljb24ucG5nXCJcbiAgICAgICAgICBkYXRhLXNsdWc9XCIje3NsdWd9XCJcbiAgICAgICAgICBkYXRhLXNpdGU9XCIje3JlbW90ZVNpdGV9XCJcbiAgICAgICAgICB0aXRsZT1cIiN7cmVtb3RlU2l0ZX1cIj5cbiAgICAgICAgXCJcIlwiXG4gICAgICB0d2lucy5wdXNoIFwiI3tmbGFncy5qb2luICcmbmJzcDsnfSAje2xlZ2VuZH1cIlxuICAgICRwYWdlLmZpbmQoJy50d2lucycpLmh0bWwgXCJcIlwiPHA+I3t0d2lucy5qb2luIFwiLCBcIn08L3A+XCJcIlwiIGlmIHR3aW5zXG5cbnJlbmRlclBhZ2VJbnRvUGFnZUVsZW1lbnQgPSAocGFnZURhdGEsJHBhZ2UsIHNpdGVGb3VuZCkgLT5cbiAgcGFnZSA9ICQuZXh0ZW5kKHV0aWwuZW1wdHlQYWdlKCksIHBhZ2VEYXRhKVxuICAkcGFnZS5kYXRhKFwiZGF0YVwiLCBwYWdlKVxuICBzbHVnID0gJHBhZ2UuYXR0cignaWQnKVxuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpXG5cbiAgY29udGV4dCA9IFsndmlldyddXG4gIGNvbnRleHQucHVzaCBzaXRlIGlmIHNpdGU/XG4gIGFkZENvbnRleHQgPSAoc2l0ZSkgLT4gY29udGV4dC5wdXNoIHNpdGUgaWYgc2l0ZT8gYW5kIG5vdCBfLmluY2x1ZGUgY29udGV4dCwgc2l0ZVxuICBhZGRDb250ZXh0IGFjdGlvbi5zaXRlIGZvciBhY3Rpb24gaW4gcGFnZS5qb3VybmFsLnNsaWNlKDApLnJldmVyc2UoKVxuXG4gIHdpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBjb250ZXh0XG5cbiAgJHBhZ2UuZW1wdHkoKVxuICBbJHR3aW5zLCAkaGVhZGVyLCAkc3RvcnksICRqb3VybmFsLCAkZm9vdGVyXSA9IFsndHdpbnMnLCAnaGVhZGVyJywgJ3N0b3J5JywgJ2pvdXJuYWwnLCAnZm9vdGVyJ10ubWFwIChjbGFzc05hbWUpIC0+XG4gICAgJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoY2xhc3NOYW1lKS5hcHBlbmRUbygkcGFnZSlcblxuICBlbWl0SGVhZGVyICRoZWFkZXIsICRwYWdlLCBwYWdlXG5cbiAgZW1pdEl0ZW0gPSAoaSkgLT5cbiAgICByZXR1cm4gaWYgaSA+PSBwYWdlLnN0b3J5Lmxlbmd0aFxuICAgIGl0ZW0gPSBwYWdlLnN0b3J5W2ldXG4gICAgaWYgaXRlbT8udHlwZSBhbmQgaXRlbT8uaWRcbiAgICAgICRpdGVtID0gJCBcIlwiXCI8ZGl2IGNsYXNzPVwiaXRlbSAje2l0ZW0udHlwZX1cIiBkYXRhLWlkPVwiI3tpdGVtLmlkfVwiPlwiXCJcIlxuICAgICAgJHN0b3J5LmFwcGVuZCAkaXRlbVxuICAgICAgcGx1Z2luLmRvICRpdGVtLCBpdGVtLCAtPiBlbWl0SXRlbSBpKzFcbiAgICBlbHNlXG4gICAgICAkc3RvcnkuYXBwZW5kICQgXCJcIlwiPGRpdj48cCBjbGFzcz1cImVycm9yXCI+Q2FuJ3QgbWFrZSBzZW5zZSBvZiBzdG9yeVsje2l9XTwvcD48L2Rpdj5cIlwiXCJcbiAgICAgIGVtaXRJdGVtIGkrMVxuICBlbWl0SXRlbSAwXG5cbiAgZm9yIGFjdGlvbiBpbiBwYWdlLmpvdXJuYWxcbiAgICBhZGRUb0pvdXJuYWwgJGpvdXJuYWwsIGFjdGlvblxuXG4gIGVtaXRUd2lucyAkcGFnZVxuXG4gICRqb3VybmFsLmFwcGVuZCBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwiY29udHJvbC1idXR0b25zXCI+XG4gICAgICA8YSBocmVmPVwiI1wiIGNsYXNzPVwiYnV0dG9uIGZvcmstcGFnZVwiIHRpdGxlPVwiZm9yayB0aGlzIHBhZ2VcIj4je3V0aWwuc3ltYm9sc1snZm9yayddfTwvYT5cbiAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidXR0b24gYWRkLWZhY3RvcnlcIiB0aXRsZT1cImFkZCBwYXJhZ3JhcGhcIj4je3V0aWwuc3ltYm9sc1snYWRkJ119PC9hPlxuICAgIDwvZGl2PlxuICBcIlwiXCJcblxuICAkZm9vdGVyLmFwcGVuZCBcIlwiXCJcbiAgICA8YSBpZD1cImxpY2Vuc2VcIiBocmVmPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL1wiPkNDIEJZLVNBIDMuMDwvYT4gLlxuICAgIDxhIGNsYXNzPVwic2hvdy1wYWdlLXNvdXJjZVwiIGhyZWY9XCIvI3tzbHVnfS5qc29uP3JhbmRvbT0je3V0aWwucmFuZG9tQnl0ZXMoNCl9XCIgdGl0bGU9XCJzb3VyY2VcIj5KU09OPC9hPiAuXG4gICAgPGEgaHJlZj0gXCIvLyN7c2l0ZUZvdW5kIHx8IGxvY2F0aW9uLmhvc3R9LyN7c2x1Z30uaHRtbFwiPiN7c2l0ZUZvdW5kIHx8IGxvY2F0aW9uLmhvc3R9PC9hPlxuICBcIlwiXCJcblxuXG53aWtpLmJ1aWxkUGFnZSA9IChkYXRhLHNpdGVGb3VuZCwkcGFnZSkgLT5cblxuICBpZiBzaXRlRm91bmQgPT0gJ2xvY2FsJ1xuICAgICRwYWdlLmFkZENsYXNzKCdsb2NhbCcpXG4gIGVsc2UgaWYgc2l0ZUZvdW5kXG4gICAgc2l0ZUZvdW5kID0gJ29yaWdpbicgaWYgc2l0ZUZvdW5kIGlzIHdpbmRvdy5sb2NhdGlvbi5ob3N0XG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ3JlbW90ZScpIHVubGVzcyBzaXRlRm91bmQgaW4gWyd2aWV3JywgJ29yaWdpbiddXG4gICAgJHBhZ2UuZGF0YSgnc2l0ZScsIHNpdGVGb3VuZClcbiAgaWYgZGF0YS5wbHVnaW4/XG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ3BsdWdpbicpXG5cbiAgI1RPRE86IGF2b2lkIHBhc3Npbmcgc2l0ZUZvdW5kXG4gIHJlbmRlclBhZ2VJbnRvUGFnZUVsZW1lbnQoIGRhdGEsICRwYWdlLCBzaXRlRm91bmQgKVxuXG4gIHN0YXRlLnNldFVybCgpXG5cbiAgaW5pdERyYWdnaW5nICRwYWdlXG4gIGluaXRBZGRCdXR0b24gJHBhZ2VcbiAgJHBhZ2VcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2ggPSB3aWtpLnJlZnJlc2ggPSAtPlxuICAkcGFnZSA9ICQodGhpcylcblxuICBbc2x1ZywgcmV2XSA9ICRwYWdlLmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVxuICBwYWdlSW5mb3JtYXRpb24gPSB7XG4gICAgc2x1Zzogc2x1Z1xuICAgIHJldjogcmV2XG4gICAgc2l0ZTogJHBhZ2UuZGF0YSgnc2l0ZScpXG4gIH1cblxuICBjcmVhdGVHaG9zdFBhZ2UgPSAtPlxuICAgIHRpdGxlID0gJChcIlwiXCJhW2hyZWY9XCIvI3tzbHVnfS5odG1sXCJdOmxhc3RcIlwiXCIpLnRleHQoKSBvciBzbHVnXG4gICAgcGFnZSA9XG4gICAgICAndGl0bGUnOiB0aXRsZVxuICAgICAgJ3N0b3J5JzogW1xuICAgICAgICAnaWQnOiB1dGlsLnJhbmRvbUJ5dGVzIDhcbiAgICAgICAgJ3R5cGUnOiAnZnV0dXJlJ1xuICAgICAgICAndGV4dCc6ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UuJ1xuICAgICAgICAndGl0bGUnOiB0aXRsZVxuICAgICAgXVxuICAgIGhlYWRpbmcgPVxuICAgICAgJ3R5cGUnOiAncGFyYWdyYXBoJ1xuICAgICAgJ2lkJzogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgJ3RleHQnOiBcIldlIGRpZCBmaW5kIHRoZSBwYWdlIGluIHlvdXIgY3VycmVudCBuZWlnaGJvcmhvb2QuXCJcbiAgICBoaXRzID0gW11cbiAgICBmb3Igc2l0ZSwgaW5mbyBvZiB3aWtpLm5laWdoYm9yaG9vZFxuICAgICAgaWYgaW5mby5zaXRlbWFwP1xuICAgICAgICByZXN1bHQgPSBfLmZpbmQgaW5mby5zaXRlbWFwLCAoZWFjaCkgLT5cbiAgICAgICAgICBlYWNoLnNsdWcgPT0gc2x1Z1xuICAgICAgICBpZiByZXN1bHQ/XG4gICAgICAgICAgaGl0cy5wdXNoXG4gICAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIlxuICAgICAgICAgICAgXCJpZFwiOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAgICAgICBcInNpdGVcIjogc2l0ZVxuICAgICAgICAgICAgXCJzbHVnXCI6IHNsdWdcbiAgICAgICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnRpdGxlIHx8IHNsdWdcbiAgICAgICAgICAgIFwidGV4dFwiOiByZXN1bHQuc3lub3BzaXMgfHwgJydcbiAgICBpZiBoaXRzLmxlbmd0aCA+IDBcbiAgICAgIHBhZ2Uuc3RvcnkucHVzaCBoZWFkaW5nLCBoaXRzLi4uXG4gICAgICBwYWdlLnN0b3J5WzBdLnRleHQgPSAnV2UgY291bGQgbm90IGZpbmQgdGhpcyBwYWdlIGluIHRoZSBleHBlY3RlZCBjb250ZXh0LidcblxuICAgIHdpa2kuYnVpbGRQYWdlKCBwYWdlLCB1bmRlZmluZWQsICRwYWdlICkuYWRkQ2xhc3MoJ2dob3N0JylcblxuICByZWdpc3Rlck5laWdoYm9ycyA9IChkYXRhLCBzaXRlKSAtPlxuICAgIGlmIF8uaW5jbHVkZSBbJ2xvY2FsJywgJ29yaWdpbicsICd2aWV3JywgbnVsbCwgdW5kZWZpbmVkXSwgc2l0ZVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgbG9jYXRpb24uaG9zdFxuICAgIGVsc2VcbiAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yIHNpdGVcbiAgICBmb3IgaXRlbSBpbiAoZGF0YS5zdG9yeSB8fCBbXSlcbiAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yIGl0ZW0uc2l0ZSBpZiBpdGVtLnNpdGU/XG4gICAgZm9yIGFjdGlvbiBpbiAoZGF0YS5qb3VybmFsIHx8IFtdKVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgYWN0aW9uLnNpdGUgaWYgYWN0aW9uLnNpdGU/XG5cbiAgd2hlbkdvdHRlbiA9IChkYXRhLHNpdGVGb3VuZCkgLT5cbiAgICB3aWtpLmJ1aWxkUGFnZSggZGF0YSwgc2l0ZUZvdW5kLCAkcGFnZSApXG4gICAgcmVnaXN0ZXJOZWlnaGJvcnMoIGRhdGEsIHNpdGVGb3VuZCApXG5cbiAgcGFnZUhhbmRsZXIuZ2V0XG4gICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlblxuICAgIHdoZW5Ob3RHb3R0ZW46IGNyZWF0ZUdob3N0UGFnZVxuICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uXG5cbiIsIiMgKipyZXZpc2lvbi5jb2ZmZWUqKlxuIyBUaGlzIG1vZHVsZSBnZW5lcmF0ZXMgYSBwYXN0IHJldmlzaW9uIG9mIGEgZGF0YSBmaWxlIGFuZCBjYWNoZXMgaXQgaW4gJ2RhdGEvcmV2Jy5cbiNcbiMgVGhlIHNhdmVkIGZpbGUgaGFzIHRoZSBuYW1lIG9mIHRoZSBpZCBvZiB0aGUgcG9pbnQgaW4gdGhlIGpvdXJuYWwncyBoaXN0b3J5XG4jIHRoYXQgdGhlIHJldmlzaW9uIHJlcHJlc2VudHMuXG5cbmNyZWF0ZSA9IChyZXZJbmRleCwgZGF0YSkgLT5cbiAgam91cm5hbCA9IGRhdGEuam91cm5hbFxuICByZXZUaXRsZSA9IGRhdGEudGl0bGVcbiAgcmV2U3RvcnkgPSBbXVxuICByZXZKb3VybmFsID0gam91cm5hbFswLi4oK3JldkluZGV4KV1cbiAgZm9yIGpvdXJuYWxFbnRyeSBpbiByZXZKb3VybmFsXG4gICAgcmV2U3RvcnlJZHMgPSByZXZTdG9yeS5tYXAgKHN0b3J5SXRlbSkgLT4gc3RvcnlJdGVtLmlkXG4gICAgc3dpdGNoIGpvdXJuYWxFbnRyeS50eXBlXG4gICAgICB3aGVuICdjcmVhdGUnXG4gICAgICAgIGlmIGpvdXJuYWxFbnRyeS5pdGVtLnRpdGxlP1xuICAgICAgICAgIHJldlRpdGxlID0gam91cm5hbEVudHJ5Lml0ZW0udGl0bGVcbiAgICAgICAgICByZXZTdG9yeSA9IGpvdXJuYWxFbnRyeS5pdGVtLnN0b3J5IHx8IFtdXG4gICAgICB3aGVuICdhZGQnXG4gICAgICAgIGlmIChhZnRlckluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuYWZ0ZXIpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGFmdGVySW5kZXgrMSwwLGpvdXJuYWxFbnRyeS5pdGVtKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV2U3RvcnkucHVzaCBqb3VybmFsRW50cnkuaXRlbVxuICAgICAgd2hlbiAnZWRpdCdcbiAgICAgICAgaWYgKGVkaXRJbmRleCA9IHJldlN0b3J5SWRzLmluZGV4T2Ygam91cm5hbEVudHJ5LmlkKSAhPSAtMVxuICAgICAgICAgIHJldlN0b3J5LnNwbGljZShlZGl0SW5kZXgsMSxqb3VybmFsRW50cnkuaXRlbSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldlN0b3J5LnB1c2ggam91cm5hbEVudHJ5Lml0ZW1cbiAgICAgIHdoZW4gJ21vdmUnXG4gICAgICAgIGl0ZW1zID0ge31cbiAgICAgICAgZm9yIHN0b3J5SXRlbSBpbiByZXZTdG9yeVxuICAgICAgICAgIGl0ZW1zW3N0b3J5SXRlbS5pZF0gPSBzdG9yeUl0ZW1cbiAgICAgICAgcmV2U3RvcnkgPSBbXVxuICAgICAgICBmb3IgaXRlbUlkIGluIGpvdXJuYWxFbnRyeS5vcmRlclxuICAgICAgICAgIHJldlN0b3J5LnB1c2goaXRlbXNbaXRlbUlkXSkgaWYgaXRlbXNbaXRlbUlkXT9cbiAgICAgIHdoZW4gJ3JlbW92ZSdcbiAgICAgICAgaWYgKHJlbW92ZUluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuaWQpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKHJlbW92ZUluZGV4LDEpXG4gICAgICAjd2hlbiAnZm9yaycgICAjIGRvIG5vdGhpbmcgd2hlbiBmb3JrXG4gIHJldHVybiB7c3Rvcnk6IHJldlN0b3J5LCBqb3VybmFsOiByZXZKb3VybmFsLCB0aXRsZTogcmV2VGl0bGV9XG5cbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlIiwiKGZ1bmN0aW9uKCl7Ly8gICAgIFVuZGVyc2NvcmUuanMgMS40LjRcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIEluYy5cbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGdsb2JhbGAgb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyIHB1c2ggICAgICAgICAgICAgPSBBcnJheVByb3RvLnB1c2gsXG4gICAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICAgIGNvbmNhdCAgICAgICAgICAgPSBBcnJheVByb3RvLmNvbmNhdCxcbiAgICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS40LjQnO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoXy5oYXMob2JqLCBrZXkpKSB7XG4gICAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleV0sIGtleSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0b3IgdG8gZWFjaCBlbGVtZW50LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbWFwYCBpZiBhdmFpbGFibGUuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlTWFwICYmIG9iai5tYXAgPT09IG5hdGl2ZU1hcCkgcmV0dXJuIG9iai5tYXAoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIHZhciByZWR1Y2VFcnJvciA9ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJztcblxuICAvLyAqKlJlZHVjZSoqIGJ1aWxkcyB1cCBhIHNpbmdsZSByZXN1bHQgZnJvbSBhIGxpc3Qgb2YgdmFsdWVzLCBha2EgYGluamVjdGAsXG4gIC8vIG9yIGBmb2xkbGAuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2UgJiYgb2JqLnJlZHVjZSA9PT0gbmF0aXZlUmVkdWNlKSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlKGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2UoaXRlcmF0b3IpO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IHZhbHVlO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBUaGUgcmlnaHQtYXNzb2NpYXRpdmUgdmVyc2lvbiBvZiByZWR1Y2UsIGFsc28ga25vd24gYXMgYGZvbGRyYC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZVJpZ2h0YCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlUmlnaHQgJiYgb2JqLnJlZHVjZVJpZ2h0ID09PSBuYXRpdmVSZWR1Y2VSaWdodCkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvcik7XG4gICAgfVxuICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggIT09ICtsZW5ndGgpIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaW5kZXggPSBrZXlzID8ga2V5c1stLWxlbmd0aF0gOiAtLWxlbmd0aDtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gb2JqW2luZGV4XTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCBvYmpbaW5kZXhdLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQ7XG4gICAgYW55KG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmaWx0ZXJgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgc2VsZWN0YC5cbiAgXy5maWx0ZXIgPSBfLnNlbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZUZpbHRlciAmJiBvYmouZmlsdGVyID09PSBuYXRpdmVGaWx0ZXIpIHJldHVybiBvYmouZmlsdGVyKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoXSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuICFpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgfSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgYWxsIG9mIHRoZSBlbGVtZW50cyBtYXRjaCBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBldmVyeWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVFdmVyeSAmJiBvYmouZXZlcnkgPT09IG5hdGl2ZUV2ZXJ5KSByZXR1cm4gb2JqLmV2ZXJ5KGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIShyZXN1bHQgPSByZXN1bHQgJiYgaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgb2JqZWN0IG1hdGNoZXMgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgc29tZWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbnlgLlxuICB2YXIgYW55ID0gXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlU29tZSAmJiBvYmouc29tZSA9PT0gbmF0aXZlU29tZSkgcmV0dXJuIG9iai5zb21lKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocmVzdWx0IHx8IChyZXN1bHQgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiB2YWx1ZSAodXNpbmcgYD09PWApLlxuICAvLyBBbGlhc2VkIGFzIGBpbmNsdWRlYC5cbiAgXy5jb250YWlucyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgdGFyZ2V0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgb2JqLmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBvYmouaW5kZXhPZih0YXJnZXQpICE9IC0xO1xuICAgIHJldHVybiBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSB0YXJnZXQ7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiAoaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXSkuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuIHZhbHVlW2tleV07IH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbHRlcmA6IHNlbGVjdGluZyBvbmx5IG9iamVjdHNcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy53aGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMsIGZpcnN0KSB7XG4gICAgaWYgKF8uaXNFbXB0eShhdHRycykpIHJldHVybiBmaXJzdCA/IG51bGwgOiBbXTtcbiAgICByZXR1cm4gX1tmaXJzdCA/ICdmaW5kJyA6ICdmaWx0ZXInXShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKGF0dHJzW2tleV0gIT09IHZhbHVlW2tleV0pIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8ud2hlcmUob2JqLCBhdHRycywgdHJ1ZSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgb3IgKGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICAvLyBDYW4ndCBvcHRpbWl6ZSBhcnJheXMgb2YgaW50ZWdlcnMgbG9uZ2VyIHRoYW4gNjUsNTM1IGVsZW1lbnRzLlxuICAvLyBTZWU6IGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MDc5N1xuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gLUluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiAtSW5maW5pdHksIHZhbHVlOiAtSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA+PSByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluLmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiBJbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogSW5maW5pdHksIHZhbHVlOiBJbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkIDwgcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gU2h1ZmZsZSBhbiBhcnJheS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZSA6IHZhbHVlLFxuICAgICAgICBpbmRleCA6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYSA6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IDwgcmlnaHQuaW5kZXggPyAtMSA6IDE7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCwgYmVoYXZpb3IpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUgfHwgXy5pZGVudGl0eSk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBvYmopO1xuICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gZ3JvdXAob2JqLCB2YWx1ZSwgY29udGV4dCwgZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgICAoXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0gOiAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGdyb3VwKG9iaiwgdmFsdWUsIGNvbnRleHQsIGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgICBpZiAoIV8uaGFzKHJlc3VsdCwga2V5KSkgcmVzdWx0W2tleV0gPSAwO1xuICAgICAgcmVzdWx0W2tleV0rKztcbiAgICB9KTtcbiAgfTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY29udmVydCBhbnl0aGluZyBpdGVyYWJsZSBpbnRvIGEgcmVhbCwgbGl2ZSBhcnJheS5cbiAgXy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybiBbXTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHJldHVybiBzbGljZS5jYWxsKG9iaik7XG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBvYmplY3QuXG4gIF8uc2l6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICByZXR1cm4gKG4gIT0gbnVsbCkgJiYgIWd1YXJkID8gc2xpY2UuY2FsbChhcnJheSwgMCwgbikgOiBhcnJheVswXTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBsYXN0IGVudHJ5IG9mIHRoZSBhcnJheS4gRXNwZWNpYWxseSB1c2VmdWwgb25cbiAgLy8gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gYWxsIHRoZSB2YWx1ZXMgaW5cbiAgLy8gdGhlIGFycmF5LCBleGNsdWRpbmcgdGhlIGxhc3QgTi4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoXG4gIC8vIGBfLm1hcGAuXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBhcnJheS5sZW5ndGggLSAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbikpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmICgobiAhPSBudWxsKSAmJiAhZ3VhcmQpIHtcbiAgICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBNYXRoLm1heChhcnJheS5sZW5ndGggLSBuLCAwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29tcGxldGVseSBmbGF0dGVuZWQgdmVyc2lvbiBvZiBhbiBhcnJheS5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgW10pO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHZlcnNpb24gb2YgdGhlIGFycmF5IHRoYXQgZG9lcyBub3QgY29udGFpbiB0aGUgc3BlY2lmaWVkIHZhbHVlKHMpLlxuICBfLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmRpZmZlcmVuY2UoYXJyYXksIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhIGR1cGxpY2F0ZS1mcmVlIHZlcnNpb24gb2YgdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGFscmVhZHlcbiAgLy8gYmVlbiBzb3J0ZWQsIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgdXNpbmcgYSBmYXN0ZXIgYWxnb3JpdGhtLlxuICAvLyBBbGlhc2VkIGFzIGB1bmlxdWVgLlxuICBfLnVuaXEgPSBfLnVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5LCBpc1NvcnRlZCwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdG9yO1xuICAgICAgaXRlcmF0b3IgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHZhciBpbml0aWFsID0gaXRlcmF0b3IgPyBfLm1hcChhcnJheSwgaXRlcmF0b3IsIGNvbnRleHQpIDogYXJyYXk7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGVhY2goaW5pdGlhbCwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICBpZiAoaXNTb3J0ZWQgPyAoIWluZGV4IHx8IHNlZW5bc2Vlbi5sZW5ndGggLSAxXSAhPT0gdmFsdWUpIDogIV8uY29udGFpbnMoc2VlbiwgdmFsdWUpKSB7XG4gICAgICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG4gICAgICAgIHJlc3VsdHMucHVzaChhcnJheVtpbmRleF0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgdW5pb246IGVhY2ggZGlzdGluY3QgZWxlbWVudCBmcm9tIGFsbCBvZlxuICAvLyB0aGUgcGFzc2VkLWluIGFycmF5cy5cbiAgXy51bmlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuaXEoY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIGFyZ3VtZW50cykpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyBldmVyeSBpdGVtIHNoYXJlZCBiZXR3ZWVuIGFsbCB0aGVcbiAgLy8gcGFzc2VkLWluIGFycmF5cy5cbiAgXy5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBfLmZpbHRlcihfLnVuaXEoYXJyYXkpLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gXy5ldmVyeShyZXN0LCBmdW5jdGlvbihvdGhlcikge1xuICAgICAgICByZXR1cm4gXy5pbmRleE9mKG90aGVyLCBpdGVtKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7IH0pO1xuICB9O1xuXG4gIC8vIFppcCB0b2dldGhlciBtdWx0aXBsZSBsaXN0cyBpbnRvIGEgc2luZ2xlIGFycmF5IC0tIGVsZW1lbnRzIHRoYXQgc2hhcmVcbiAgLy8gYW4gaW5kZXggZ28gdG9nZXRoZXIuXG4gIF8uemlwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgdmFyIGxlbmd0aCA9IF8ubWF4KF8ucGx1Y2soYXJncywgJ2xlbmd0aCcpKTtcbiAgICB2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdHNbaV0gPSBfLnBsdWNrKGFyZ3MsIFwiXCIgKyBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaXN0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXN1bHRbbGlzdFtpXV0gPSB2YWx1ZXNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbbGlzdFtpXVswXV0gPSBsaXN0W2ldWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcGx5IHVzIHdpdGggaW5kZXhPZiAoSSdtIGxvb2tpbmcgYXQgeW91LCAqKk1TSUUqKiksXG4gIC8vIHdlIG5lZWQgdGhpcyBmdW5jdGlvbi4gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhblxuICAvLyBpdGVtIGluIGFuIGFycmF5LCBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgaW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlzU29ydGVkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaSA9IDAsIGwgPSBhcnJheS5sZW5ndGg7XG4gICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICBpZiAodHlwZW9mIGlzU29ydGVkID09ICdudW1iZXInKSB7XG4gICAgICAgIGkgPSAoaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBsYXN0SW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICBfLmxhc3RJbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGZyb20pIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBoYXNJbmRleCA9IGZyb20gIT0gbnVsbDtcbiAgICBpZiAobmF0aXZlTGFzdEluZGV4T2YgJiYgYXJyYXkubGFzdEluZGV4T2YgPT09IG5hdGl2ZUxhc3RJbmRleE9mKSB7XG4gICAgICByZXR1cm4gaGFzSW5kZXggPyBhcnJheS5sYXN0SW5kZXhPZihpdGVtLCBmcm9tKSA6IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0pO1xuICAgIH1cbiAgICB2YXIgaSA9IChoYXNJbmRleCA/IGZyb20gOiBhcnJheS5sZW5ndGgpO1xuICAgIHdoaWxlIChpLS0pIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBhcmd1bWVudHNbMl0gfHwgMTtcblxuICAgIHZhciBsZW4gPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgdmFyIHJhbmdlID0gbmV3IEFycmF5KGxlbik7XG5cbiAgICB3aGlsZShpZHggPCBsZW4pIHtcbiAgICAgIHJhbmdlW2lkeCsrXSA9IHN0YXJ0O1xuICAgICAgc3RhcnQgKz0gc3RlcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH07XG5cbiAgLy8gRnVuY3Rpb24gKGFoZW0pIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICBpZiAoZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kICYmIG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBQYXJ0aWFsbHkgYXBwbHkgYSBmdW5jdGlvbiBieSBjcmVhdGluZyBhIHZlcnNpb24gdGhhdCBoYXMgaGFkIHNvbWUgb2YgaXRzXG4gIC8vIGFyZ3VtZW50cyBwcmUtZmlsbGVkLCB3aXRob3V0IGNoYW5naW5nIGl0cyBkeW5hbWljIGB0aGlzYCBjb250ZXh0LlxuICBfLnBhcnRpYWwgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBCaW5kIGFsbCBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXRcbiAgLy8gYWxsIGNhbGxiYWNrcyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBmdW5jcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBpZiAoZnVuY3MubGVuZ3RoID09PSAwKSBmdW5jcyA9IF8uZnVuY3Rpb25zKG9iaik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCB0aW1lb3V0LCByZXN1bHQ7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gbmV3IERhdGU7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGU7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCByZXN1bHQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBpZiAoIWltbWVkaWF0ZSkgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH07XG4gICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIGlmIChjYWxsTm93KSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBmdW5jID0gbnVsbDtcbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgZnVuY3Rpb24gcGFzc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSBzZWNvbmQsXG4gIC8vIGFsbG93aW5nIHlvdSB0byBhZGp1c3QgYXJndW1lbnRzLCBydW4gY29kZSBiZWZvcmUgYW5kIGFmdGVyLCBhbmRcbiAgLy8gY29uZGl0aW9uYWxseSBleGVjdXRlIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cbiAgXy53cmFwID0gZnVuY3Rpb24oZnVuYywgd3JhcHBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gW2Z1bmNdO1xuICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBmb3IgKHZhciBpID0gZnVuY3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXJncyA9IFtmdW5jc1tpXS5hcHBseSh0aGlzLCBhcmdzKV07XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJnc1swXTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBhZnRlciBiZWluZyBjYWxsZWQgTiB0aW1lcy5cbiAgXy5hZnRlciA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgaWYgKHRpbWVzIDw9IDApIHJldHVybiBmdW5jKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBPYmplY3QgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYE9iamVjdC5rZXlzYFxuICBfLmtleXMgPSBuYXRpdmVLZXlzIHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogIT09IE9iamVjdChvYmopKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIG9iamVjdCcpO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkga2V5c1trZXlzLmxlbmd0aF0gPSBrZXk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSB2YWx1ZXMucHVzaChvYmpba2V5XSk7XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBwYWlycyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHBhaXJzLnB1c2goW2tleSwgb2JqW2tleV1dKTtcbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXN1bHRbb2JqW2tleV1dID0ga2V5O1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IG9ubHkgY29udGFpbmluZyB0aGUgd2hpdGVsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5waWNrID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5IGluIG9iaikgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKCFfLmNvbnRhaW5zKGtleXMsIGtleSkpIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIGlmIChvYmpbcHJvcF0gPT0gbnVsbCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBIYXJtb255IGBlZ2FsYCBwcm9wb3NhbDogaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsLlxuICAgIGlmIChhID09PSBiKSByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuIGEgPT0gU3RyaW5nKGIpO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS4gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvclxuICAgICAgICAvLyBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuIGEgIT0gK2EgPyBiICE9ICtiIDogKGEgPT0gMCA/IDEgLyBhID09IDEgLyBiIDogYSA9PSArYik7XG4gICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWVyaWMgcHJpbWl0aXZlIHZhbHVlcy4gRGF0ZXMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyXG4gICAgICAgIC8vIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9ucy4gTm90ZSB0aGF0IGludmFsaWQgZGF0ZXMgd2l0aCBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnNcbiAgICAgICAgLy8gb2YgYE5hTmAgYXJlIG5vdCBlcXVpdmFsZW50LlxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb21wYXJlZCBieSB0aGVpciBzb3VyY2UgcGF0dGVybnMgYW5kIGZsYWdzLlxuICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgcmV0dXJuIGEuc291cmNlID09IGIuc291cmNlICYmXG4gICAgICAgICAgICAgICBhLmdsb2JhbCA9PSBiLmdsb2JhbCAmJlxuICAgICAgICAgICAgICAgYS5tdWx0aWxpbmUgPT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PSBiO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiAoYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcikpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgZm9yICh2YXIga2V5IGluIGEpIHtcbiAgICAgICAgaWYgKF8uaGFzKGEsIGtleSkpIHtcbiAgICAgICAgICAvLyBDb3VudCB0aGUgZXhwZWN0ZWQgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlci5cbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBfLmhhcyhiLCBrZXkpICYmIGVxKGFba2V5XSwgYltrZXldLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGZvciAoa2V5IGluIGIpIHtcbiAgICAgICAgICBpZiAoXy5oYXMoYiwga2V5KSAmJiAhKHNpemUtLSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9ICFzaXplO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IG9iamVjdCBmcm9tIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucG9wKCk7XG4gICAgYlN0YWNrLnBvcCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUGVyZm9ybSBhIGRlZXAgY29tcGFyaXNvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWwuXG4gIF8uaXNFcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXEoYSwgYiwgW10sIFtdKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIGFycmF5LCBzdHJpbmcsIG9yIG9iamVjdCBlbXB0eT9cbiAgLy8gQW4gXCJlbXB0eVwiIG9iamVjdCBoYXMgbm8gZW51bWVyYWJsZSBvd24tcHJvcGVydGllcy5cbiAgXy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICB9O1xuXG4gIC8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzOiBpc0FyZ3VtZW50cywgaXNGdW5jdGlvbiwgaXNTdHJpbmcsIGlzTnVtYmVyLCBpc0RhdGUsIGlzUmVnRXhwLlxuICBlYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIERlZmluZSBhIGZhbGxiYWNrIHZlcnNpb24gb2YgdGhlIG1ldGhvZCBpbiBicm93c2VycyAoYWhlbSwgSUUpLCB3aGVyZVxuICAvLyB0aGVyZSBpc24ndCBhbnkgaW5zcGVjdGFibGUgXCJBcmd1bWVudHNcIiB0eXBlLlxuICBpZiAoIV8uaXNBcmd1bWVudHMoYXJndW1lbnRzKSkge1xuICAgIF8uaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAhIShvYmogJiYgXy5oYXMob2JqLCAnY2FsbGVlJykpO1xuICAgIH07XG4gIH1cblxuICAvLyBPcHRpbWl6ZSBgaXNGdW5jdGlvbmAgaWYgYXBwcm9wcmlhdGUuXG4gIGlmICh0eXBlb2YgKC8uLykgIT09ICdmdW5jdGlvbicpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xuICAgIH07XG4gIH1cblxuICAvLyBJcyBhIGdpdmVuIG9iamVjdCBhIGZpbml0ZSBudW1iZXI/XG4gIF8uaXNGaW5pdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaXNGaW5pdGUob2JqKSAmJiAhaXNOYU4ocGFyc2VGbG9hdChvYmopKTtcbiAgfTtcblxuICAvLyBJcyB0aGUgZ2l2ZW4gdmFsdWUgYE5hTmA/IChOYU4gaXMgdGhlIG9ubHkgbnVtYmVyIHdoaWNoIGRvZXMgbm90IGVxdWFsIGl0c2VsZikuXG4gIF8uaXNOYU4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXy5pc051bWJlcihvYmopICYmIG9iaiAhPSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdG9ycy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnLFxuICAgICAgJy8nOiAnJiN4MkY7J1xuICAgIH1cbiAgfTtcbiAgZW50aXR5TWFwLnVuZXNjYXBlID0gXy5pbnZlcnQoZW50aXR5TWFwLmVzY2FwZSk7XG5cbiAgLy8gUmVnZXhlcyBjb250YWluaW5nIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbGlzdGVkIGltbWVkaWF0ZWx5IGFib3ZlLlxuICB2YXIgZW50aXR5UmVnZXhlcyA9IHtcbiAgICBlc2NhcGU6ICAgbmV3IFJlZ0V4cCgnWycgKyBfLmtleXMoZW50aXR5TWFwLmVzY2FwZSkuam9pbignJykgKyAnXScsICdnJyksXG4gICAgdW5lc2NhcGU6IG5ldyBSZWdFeHAoJygnICsgXy5rZXlzKGVudGl0eU1hcC51bmVzY2FwZSkuam9pbignfCcpICsgJyknLCAnZycpXG4gIH07XG5cbiAgLy8gRnVuY3Rpb25zIGZvciBlc2NhcGluZyBhbmQgdW5lc2NhcGluZyBzdHJpbmdzIHRvL2Zyb20gSFRNTCBpbnRlcnBvbGF0aW9uLlxuICBfLmVhY2goWydlc2NhcGUnLCAndW5lc2NhcGUnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgX1ttZXRob2RdID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBpZiAoc3RyaW5nID09IG51bGwpIHJldHVybiAnJztcbiAgICAgIHJldHVybiAoJycgKyBzdHJpbmcpLnJlcGxhY2UoZW50aXR5UmVnZXhlc1ttZXRob2RdLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZW50aXR5TWFwW21ldGhvZF1bbWF0Y2hdO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gSWYgdGhlIHZhbHVlIG9mIHRoZSBuYW1lZCBwcm9wZXJ0eSBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0O1xuICAvLyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChfLmZ1bmN0aW9ucyhvYmopLCBmdW5jdGlvbihuYW1lKXtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuXG59KSgpIiwidXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gKGpvdXJuYWxFbGVtZW50LCBhY3Rpb24pIC0+XG4gIHBhZ2VFbGVtZW50ID0gam91cm5hbEVsZW1lbnQucGFyZW50cygnLnBhZ2U6Zmlyc3QnKVxuICBwcmV2ID0gam91cm5hbEVsZW1lbnQuZmluZChcIi5lZGl0W2RhdGEtaWQ9I3thY3Rpb24uaWQgfHwgMH1dXCIpIGlmIGFjdGlvbi50eXBlID09ICdlZGl0J1xuICBhY3Rpb25UaXRsZSA9IGFjdGlvbi50eXBlXG4gIGFjdGlvblRpdGxlICs9IFwiICN7dXRpbC5mb3JtYXRFbGFwc2VkVGltZShhY3Rpb24uZGF0ZSl9XCIgaWYgYWN0aW9uLmRhdGU/XG4gIGFjdGlvbkVsZW1lbnQgPSAkKFwiXCJcIjxhIGhyZWY9XCIjXCIgLz4gXCJcIlwiKS5hZGRDbGFzcyhcImFjdGlvblwiKS5hZGRDbGFzcyhhY3Rpb24udHlwZSlcbiAgICAudGV4dCh1dGlsLnN5bWJvbHNbYWN0aW9uLnR5cGVdKVxuICAgIC5hdHRyKCd0aXRsZScsYWN0aW9uVGl0bGUpXG4gICAgLmF0dHIoJ2RhdGEtaWQnLCBhY3Rpb24uaWQgfHwgXCIwXCIpXG4gICAgLmRhdGEoJ2FjdGlvbicsIGFjdGlvbilcbiAgY29udHJvbHMgPSBqb3VybmFsRWxlbWVudC5jaGlsZHJlbignLmNvbnRyb2wtYnV0dG9ucycpXG4gIGlmIGNvbnRyb2xzLmxlbmd0aCA+IDBcbiAgICBhY3Rpb25FbGVtZW50Lmluc2VydEJlZm9yZShjb250cm9scylcbiAgZWxzZVxuICAgIGFjdGlvbkVsZW1lbnQuYXBwZW5kVG8oam91cm5hbEVsZW1lbnQpXG4gIGlmIGFjdGlvbi50eXBlID09ICdmb3JrJyBhbmQgYWN0aW9uLnNpdGU/XG4gICAgYWN0aW9uRWxlbWVudFxuICAgICAgLmNzcyhcImJhY2tncm91bmQtaW1hZ2VcIiwgXCJ1cmwoLy8je2FjdGlvbi5zaXRlfS9mYXZpY29uLnBuZylcIilcbiAgICAgIC5hdHRyKFwiaHJlZlwiLCBcIi8vI3thY3Rpb24uc2l0ZX0vI3twYWdlRWxlbWVudC5hdHRyKCdpZCcpfS5odG1sXCIpXG4gICAgICAuZGF0YShcInNpdGVcIiwgYWN0aW9uLnNpdGUpXG4gICAgICAuZGF0YShcInNsdWdcIiwgcGFnZUVsZW1lbnQuYXR0cignaWQnKSlcblxuIiwiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUnXG5cbndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xuYWN0aXZlID0gcmVxdWlyZSAnLi9hY3RpdmUuY29mZmVlJ1xudXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5jcmVhdGVTZWFyY2ggPSByZXF1aXJlICcuL3NlYXJjaC5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gbmVpZ2hib3Job29kID0ge31cblxuXG53aWtpLm5laWdoYm9yaG9vZCA/PSB7fVxubmV4dEF2YWlsYWJsZUZldGNoID0gMFxubmV4dEZldGNoSW50ZXJ2YWwgPSAyMDAwXG5cbnBvcHVsYXRlU2l0ZUluZm9Gb3IgPSAoc2l0ZSxuZWlnaGJvckluZm8pLT5cbiAgcmV0dXJuIGlmIG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0XG4gIG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0ID0gdHJ1ZVxuXG4gIHRyYW5zaXRpb24gPSAoc2l0ZSwgZnJvbSwgdG8pIC0+XG4gICAgJChcIlwiXCIubmVpZ2hib3JbZGF0YS1zaXRlPVwiI3tzaXRlfVwiXVwiXCJcIilcbiAgICAgIC5maW5kKCdkaXYnKVxuICAgICAgLnJlbW92ZUNsYXNzKGZyb20pXG4gICAgICAuYWRkQ2xhc3ModG8pXG5cbiAgZmV0Y2hNYXAgPSAtPlxuICAgIHNpdGVtYXBVcmwgPSBcImh0dHA6Ly8je3NpdGV9L3N5c3RlbS9zaXRlbWFwLmpzb25cIlxuICAgIHRyYW5zaXRpb24gc2l0ZSwgJ3dhaXQnLCAnZmV0Y2gnXG4gICAgcmVxdWVzdCA9ICQuYWpheFxuICAgICAgdHlwZTogJ0dFVCdcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgIHVybDogc2l0ZW1hcFVybFxuICAgIHJlcXVlc3RcbiAgICAgIC5hbHdheXMoIC0+IG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0ID0gZmFsc2UgKVxuICAgICAgLmRvbmUgKGRhdGEpLT5cbiAgICAgICAgbmVpZ2hib3JJbmZvLnNpdGVtYXAgPSBkYXRhXG4gICAgICAgIHRyYW5zaXRpb24gc2l0ZSwgJ2ZldGNoJywgJ2RvbmUnXG4gICAgICAgICQoJ2JvZHknKS50cmlnZ2VyICduZXctbmVpZ2hib3ItZG9uZScsIHNpdGVcbiAgICAgIC5mYWlsIChkYXRhKS0+XG4gICAgICAgIHRyYW5zaXRpb24gc2l0ZSwgJ2ZldGNoJywgJ2ZhaWwnXG5cbiAgbm93ID0gRGF0ZS5ub3coKVxuICBpZiBub3cgPiBuZXh0QXZhaWxhYmxlRmV0Y2hcbiAgICBuZXh0QXZhaWxhYmxlRmV0Y2ggPSBub3cgKyBuZXh0RmV0Y2hJbnRlcnZhbFxuICAgIHNldFRpbWVvdXQgZmV0Y2hNYXAsIDEwMFxuICBlbHNlXG4gICAgc2V0VGltZW91dCBmZXRjaE1hcCwgbmV4dEF2YWlsYWJsZUZldGNoIC0gbm93XG4gICAgbmV4dEF2YWlsYWJsZUZldGNoICs9IG5leHRGZXRjaEludGVydmFsXG5cblxud2lraS5yZWdpc3Rlck5laWdoYm9yID0gbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgPSAoc2l0ZSktPlxuICByZXR1cm4gaWYgd2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0/XG4gIG5laWdoYm9ySW5mbyA9IHt9XG4gIHdpa2kubmVpZ2hib3Job29kW3NpdGVdID0gbmVpZ2hib3JJbmZvXG4gIHBvcHVsYXRlU2l0ZUluZm9Gb3IoIHNpdGUsIG5laWdoYm9ySW5mbyApXG4gICQoJ2JvZHknKS50cmlnZ2VyICduZXctbmVpZ2hib3InLCBzaXRlXG5cbm5laWdoYm9yaG9vZC5saXN0TmVpZ2hib3JzID0gKCktPlxuICBfLmtleXMoIHdpa2kubmVpZ2hib3Job29kIClcblxubmVpZ2hib3Job29kLnNlYXJjaCA9IChzZWFyY2hRdWVyeSktPlxuICBmaW5kcyA9IFtdXG4gIHRhbGx5ID0ge31cblxuICB0aWNrID0gKGtleSkgLT5cbiAgICBpZiB0YWxseVtrZXldPyB0aGVuIHRhbGx5W2tleV0rKyBlbHNlIHRhbGx5W2tleV0gPSAxXG5cbiAgbWF0Y2ggPSAoa2V5LCB0ZXh0KSAtPlxuICAgIGhpdCA9IHRleHQ/IGFuZCB0ZXh0LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggc2VhcmNoUXVlcnkudG9Mb3dlckNhc2UoKSApID49IDBcbiAgICB0aWNrIGtleSBpZiBoaXRcbiAgICBoaXRcblxuICBzdGFydCA9IERhdGUubm93KClcbiAgZm9yIG93biBuZWlnaGJvclNpdGUsbmVpZ2hib3JJbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgc2l0ZW1hcCA9IG5laWdoYm9ySW5mby5zaXRlbWFwXG4gICAgdGljayAnc2l0ZXMnIGlmIHNpdGVtYXA/XG4gICAgbWF0Y2hpbmdQYWdlcyA9IF8uZWFjaCBzaXRlbWFwLCAocGFnZSktPlxuICAgICAgdGljayAncGFnZXMnXG4gICAgICByZXR1cm4gdW5sZXNzIG1hdGNoKCd0aXRsZScsIHBhZ2UudGl0bGUpIG9yIG1hdGNoKCd0ZXh0JywgcGFnZS5zeW5vcHNpcykgb3IgbWF0Y2goJ3NsdWcnLCBwYWdlLnNsdWcpXG4gICAgICB0aWNrICdmaW5kcydcbiAgICAgIGZpbmRzLnB1c2hcbiAgICAgICAgcGFnZTogcGFnZSxcbiAgICAgICAgc2l0ZTogbmVpZ2hib3JTaXRlLFxuICAgICAgICByYW5rOiAxICMgSEFSRENPREVEIEZPUiBOT1dcbiAgdGFsbHlbJ21zZWMnXSA9IERhdGUubm93KCkgLSBzdGFydFxuICB7IGZpbmRzLCB0YWxseSB9XG5cblxuJCAtPlxuICAkbmVpZ2hib3Job29kID0gJCgnLm5laWdoYm9yaG9vZCcpXG5cbiAgZmxhZyA9IChzaXRlKSAtPlxuICAgICMgc3RhdHVzIGNsYXNzIHByb2dyZXNzaW9uOiAud2FpdCwgLmZldGNoLCAuZmFpbCBvciAuZG9uZVxuICAgIFwiXCJcIlxuICAgICAgPHNwYW4gY2xhc3M9XCJuZWlnaGJvclwiIGRhdGEtc2l0ZT1cIiN7c2l0ZX1cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndhaXRcIj5cbiAgICAgICAgICA8aW1nIHNyYz1cImh0dHA6Ly8je3NpdGV9L2Zhdmljb24ucG5nXCIgdGl0bGU9XCIje3NpdGV9XCI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zcGFuPlxuICAgIFwiXCJcIlxuXG4gICQoJ2JvZHknKVxuICAgIC5vbiAnbmV3LW5laWdoYm9yJywgKGUsIHNpdGUpIC0+XG4gICAgICAkbmVpZ2hib3Job29kLmFwcGVuZCBmbGFnIHNpdGVcbiAgICAuZGVsZWdhdGUgJy5uZWlnaGJvciBpbWcnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIHdpa2kuZG9JbnRlcm5hbExpbmsgJ3dlbGNvbWUtdmlzaXRvcnMnLCBudWxsLCBALnRpdGxlXG5cbiAgc2VhcmNoID0gY3JlYXRlU2VhcmNoKHtuZWlnaGJvcmhvb2R9KVxuXG4gICQoJ2lucHV0LnNlYXJjaCcpLm9uICdrZXlwcmVzcycsIChlKS0+XG4gICAgcmV0dXJuIGlmIGUua2V5Q29kZSAhPSAxMyAjIDEzID09IHJldHVyblxuICAgIHNlYXJjaFF1ZXJ5ID0gJCh0aGlzKS52YWwoKVxuICAgIHNlYXJjaC5wZXJmb3JtU2VhcmNoKCBzZWFyY2hRdWVyeSApXG4gICAgJCh0aGlzKS52YWwoXCJcIilcbiIsIndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xudXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG5cbmNyZWF0ZVNlYXJjaCA9ICh7bmVpZ2hib3Job29kfSktPlxuICBwZXJmb3JtU2VhcmNoID0gKHNlYXJjaFF1ZXJ5KS0+XG4gICAgc2VhcmNoUmVzdWx0cyA9IG5laWdoYm9yaG9vZC5zZWFyY2goc2VhcmNoUXVlcnkpXG4gICAgdGFsbHkgPSBzZWFyY2hSZXN1bHRzLnRhbGx5XG5cblxuICAgIGV4cGxhbmF0b3J5UGFyYSA9IHtcbiAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnXG4gICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIFN0cmluZyAnI3tzZWFyY2hRdWVyeX0nIGZvdW5kIG9uICN7dGFsbHkuZmluZHN8fCdub25lJ30gb2YgI3t0YWxseS5wYWdlc3x8J25vJ30gcGFnZXMgZnJvbSAje3RhbGx5LnNpdGVzfHwnbm8nfSBzaXRlcy5cbiAgICAgICAgVGV4dCBtYXRjaGVkIG9uICN7dGFsbHkudGl0bGV8fCdubyd9IHRpdGxlcywgI3t0YWxseS50ZXh0fHwnbm8nfSBwYXJhZ3JhcGhzLCBhbmQgI3t0YWxseS5zbHVnfHwnbm8nfSBzbHVncy5cbiAgICAgICAgRWxhcHNlZCB0aW1lICN7dGFsbHkubXNlY30gbWlsbGlzZWNvbmRzLlxuICAgICAgXCJcIlwiXG4gICAgfVxuICAgIHNlYXJjaFJlc3VsdFJlZmVyZW5jZXMgPSBmb3IgcmVzdWx0IGluIHNlYXJjaFJlc3VsdHMuZmluZHNcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwicmVmZXJlbmNlXCJcbiAgICAgICAgXCJpZFwiOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAgIFwic2l0ZVwiOiByZXN1bHQuc2l0ZVxuICAgICAgICBcInNsdWdcIjogcmVzdWx0LnBhZ2Uuc2x1Z1xuICAgICAgICBcInRpdGxlXCI6IHJlc3VsdC5wYWdlLnRpdGxlXG4gICAgICAgIFwidGV4dFwiOiByZXN1bHQucGFnZS5zeW5vcHNpcyB8fCAnJ1xuICAgICAgfVxuICAgIHNlYXJjaFJlc3VsdFBhZ2VEYXRhID0ge1xuICAgICAgdGl0bGU6IFwiU2VhcmNoIFJlc3VsdHNcIlxuICAgICAgc3Rvcnk6IFtleHBsYW5hdG9yeVBhcmFdLmNvbmNhdChzZWFyY2hSZXN1bHRSZWZlcmVuY2VzKVxuICAgIH1cbiAgICAkc2VhcmNoUmVzdWx0UGFnZSA9IHdpa2kuY3JlYXRlUGFnZSgnc2VhcmNoLXJlc3VsdHMnKS5hZGRDbGFzcygnZ2hvc3QnKVxuICAgICRzZWFyY2hSZXN1bHRQYWdlLmFwcGVuZFRvKCQoJy5tYWluJykpXG4gICAgd2lraS5idWlsZFBhZ2UoIHNlYXJjaFJlc3VsdFBhZ2VEYXRhLCBudWxsLCAkc2VhcmNoUmVzdWx0UGFnZSApXG4gICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcblxuXG4gIHtcbiAgICBwZXJmb3JtU2VhcmNoXG4gIH1cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2VhcmNoXG4iXX0=
;