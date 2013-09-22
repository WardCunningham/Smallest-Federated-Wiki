;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
window.wiki = require('wiki-client/lib/wiki');

require('wiki-client/lib/legacy');


},{"wiki-client/lib/legacy":3,"wiki-client/lib/wiki":2}],2:[function(require,module,exports){
(function() {
  var createSynopsis, wiki,
    __slice = [].slice;

  createSynopsis = require('./synopsis');

  wiki = {
    createSynopsis: createSynopsis
  };

  wiki.persona = require('./persona');

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

},{"./persona":5,"./synopsis":4}],3:[function(require,module,exports){
(function() {
  var active, pageHandler, plugin, refresh, state, util, wiki;

  wiki = require('./wiki');

  util = require('./util');

  pageHandler = wiki.pageHandler = require('./pageHandler');

  plugin = require('./plugin');

  state = require('./state');

  active = require('./active');

  refresh = require('./refresh');

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

},{"./active":10,"./pageHandler":7,"./plugin":8,"./refresh":11,"./state":9,"./util":6,"./wiki":2}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
(function() {
  module.exports = function(owner) {
    $("#user-email").hide();
    $("#persona-login-btn").hide();
    $("#persona-logout-btn").hide();
    navigator.id.watch({
      loggedInUser: owner,
      onlogin: function(assertion) {
        return $.post("/persona_login", {
          assertion: assertion
        }, function(verified) {
          verified = JSON.parse(verified);
          if ("okay" === verified.status) {
            return window.location = "/";
          } else {
            navigator.id.logout();
            if ("wrong-address" === verified.status) {
              return window.location = "/oops";
            }
          }
        });
      },
      onlogout: function() {
        return $.post("/persona_logout", function() {
          return window.location = "/";
        });
      },
      onready: function() {
        if (owner) {
          $("#persona-login-btn").hide();
          return $("#persona-logout-btn").show();
        } else {
          $("#persona-login-btn").show();
          return $("#persona-logout-btn").hide();
        }
      }
    });
    $("#persona-login-btn").click(function(e) {
      e.preventDefault();
      return navigator.id.request({});
    });
    return $("#persona-logout-btn").click(function(e) {
      e.preventDefault();
      return navigator.id.logout();
    });
  };

}).call(this);

},{}],10:[function(require,module,exports){
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
    var bodyWidth, contentWidth, maxX, minX, target, width;
    if (active.scrollContainer == null) {
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

},{}],6:[function(require,module,exports){
(function() {
  var util, wiki;

  wiki = require('./wiki');

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

},{"./wiki":2}],8:[function(require,module,exports){
(function() {
  var getScript, plugin, scripts, util, wiki;

  util = require('./util');

  wiki = require('./wiki');

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

},{"./util":6,"./wiki":2}],9:[function(require,module,exports){
(function() {
  var active, state, wiki,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  wiki = require('./wiki');

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

},{"./active":10,"./wiki":2}],12:[function(require,module,exports){
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
(function() {
  var util;

  util = require('./util');

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

},{"./util":6}],7:[function(require,module,exports){
(function() {
  var addToJournal, pageFromLocalStorage, pageHandler, pushToLocal, pushToServer, recursiveGet, revision, state, util, wiki, _;

  _ = require('underscore');

  wiki = require('./wiki');

  util = require('./util');

  state = require('./state');

  revision = require('./revision');

  addToJournal = require('./addToJournal');

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

},{"./addToJournal":13,"./revision":12,"./state":9,"./util":6,"./wiki":2,"underscore":14}],11:[function(require,module,exports){
(function() {
  var addToJournal, buildPageHeader, createFactory, emitHeader, emitTwins, handleDragging, initAddButton, initDragging, neighborhood, pageHandler, plugin, refresh, renderPageIntoPageElement, state, util, wiki, _,
    __slice = [].slice;

  _ = require('underscore');

  util = require('./util');

  pageHandler = require('./pageHandler');

  plugin = require('./plugin');

  state = require('./state');

  neighborhood = require('./neighborhood');

  addToJournal = require('./addToJournal');

  wiki = require('./wiki');

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

},{"./addToJournal":13,"./neighborhood":15,"./pageHandler":7,"./plugin":8,"./state":9,"./util":6,"./wiki":2,"underscore":14}],14:[function(require,module,exports){
(function(){//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
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
  _.VERSION = '1.5.2';

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
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
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
      results.push(iterator.call(context, value, index, list));
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
      if (iterator.call(context, value, index, list)) results.push(value);
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
    if (_.isEmpty(attrs)) return first ? void 0 : [];
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
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
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

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
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

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
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
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

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

  // Safely create a real, live array from anything iterable.
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
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
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
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
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
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
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
    return _.uniq(_.flatten(arguments, true));
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
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
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
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
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

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
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
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
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
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
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
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
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
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
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
          if (obj[prop] === void 0) obj[prop] = source[prop];
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
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
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
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
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
    var accum = Array(Math.max(0, n));
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
      "'": '&#x27;'
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

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
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
},{}],16:[function(require,module,exports){
(function() {
  var active, createSearch, util, wiki;

  wiki = require('./wiki');

  util = require('./util');

  active = require('./active');

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

},{"./active":10,"./util":6,"./wiki":2}],15:[function(require,module,exports){
(function() {
  var active, createSearch, neighborhood, nextAvailableFetch, nextFetchInterval, populateSiteInfoFor, util, wiki, _,
    __hasProp = {}.hasOwnProperty;

  _ = require('underscore');

  wiki = require('./wiki');

  active = require('./active');

  util = require('./util');

  createSearch = require('./search');

  module.exports = neighborhood = {};

  if (wiki.neighborhood == null) {
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
    var finds, match, matchingPages, neighborInfo, neighborSite, sitemap, start, tally, tick, _ref;
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
    _ref = wiki.neighborhood;
    for (neighborSite in _ref) {
      if (!__hasProp.call(_ref, neighborSite)) continue;
      neighborInfo = _ref[neighborSite];
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

},{"./active":10,"./search":16,"./util":6,"./wiki":2,"underscore":14}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2NsaWVudC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvd2lraS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9sZWdhY3kuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvc3lub3BzaXMuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvcGVyc29uYS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9hY3RpdmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvdXRpbC5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9wbHVnaW4uanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvc3RhdGUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvcmV2aXNpb24uanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvYWRkVG9Kb3VybmFsLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3BhZ2VIYW5kbGVyLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3JlZnJlc2guanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvc2VhcmNoLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL25laWdoYm9yaG9vZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsQ0FBTyxFQUFPLENBQWQsRUFBTSxDQUFRLGVBQUE7O0FBQ2QsQ0FEQSxNQUNBLGlCQUFBOzs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsid2luZG93Lndpa2kgPSByZXF1aXJlKCd3aWtpLWNsaWVudC9saWIvd2lraScpXG5yZXF1aXJlKCd3aWtpLWNsaWVudC9saWIvbGVnYWN5JylcblxuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgY3JlYXRlU3lub3BzaXMsIHdpa2ksXG4gICAgX19zbGljZSA9IFtdLnNsaWNlO1xuXG4gIGNyZWF0ZVN5bm9wc2lzID0gcmVxdWlyZSgnLi9zeW5vcHNpcycpO1xuXG4gIHdpa2kgPSB7XG4gICAgY3JlYXRlU3lub3BzaXM6IGNyZWF0ZVN5bm9wc2lzXG4gIH07XG5cbiAgd2lraS5wZXJzb25hID0gcmVxdWlyZSgnLi9wZXJzb25hJyk7XG5cbiAgd2lraS5sb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGhpbmdzO1xuICAgIHRoaW5ncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IF9fc2xpY2UuY2FsbChhcmd1bWVudHMsIDApIDogW107XG4gICAgaWYgKCh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjb25zb2xlICE9PSBudWxsID8gY29uc29sZS5sb2cgOiB2b2lkIDApICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCB0aGluZ3MpO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLmFzU2x1ZyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKC9cXHMvZywgJy0nKS5yZXBsYWNlKC9bXkEtWmEtejAtOS1dL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuICB9O1xuXG4gIHdpa2kudXNlTG9jYWxTdG9yYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICQoXCIubG9naW5cIikubGVuZ3RoID4gMDtcbiAgfTtcblxuICB3aWtpLnJlc29sdXRpb25Db250ZXh0ID0gW107XG5cbiAgd2lraS5yZXNvbHZlRnJvbSA9IGZ1bmN0aW9uKGFkZGl0aW9uLCBjYWxsYmFjaykge1xuICAgIHdpa2kucmVzb2x1dGlvbkNvbnRleHQucHVzaChhZGRpdGlvbik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB3aWtpLnJlc29sdXRpb25Db250ZXh0LnBvcCgpO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLmdldERhdGEgPSBmdW5jdGlvbih2aXMpIHtcbiAgICB2YXIgaWR4LCB3aG87XG4gICAgaWYgKHZpcykge1xuICAgICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpO1xuICAgICAgd2hvID0gJChcIi5pdGVtOmx0KFwiICsgaWR4ICsgXCIpXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykubGFzdCgpO1xuICAgICAgaWYgKHdobyAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB3aG8uZGF0YSgnaXRlbScpLmRhdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKTtcbiAgICAgIGlmICh3aG8gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB3aWtpLmdldERhdGFOb2RlcyA9IGZ1bmN0aW9uKHZpcykge1xuICAgIHZhciBpZHgsIHdobztcbiAgICBpZiAodmlzKSB7XG4gICAgICBpZHggPSAkKCcuaXRlbScpLmluZGV4KHZpcyk7XG4gICAgICB3aG8gPSAkKFwiLml0ZW06bHQoXCIgKyBpZHggKyBcIilcIikuZmlsdGVyKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS50b0FycmF5KCkucmV2ZXJzZSgpO1xuICAgICAgcmV0dXJuICQod2hvKTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2hvID0gJCgnLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKTtcbiAgICAgIHJldHVybiAkKHdobyk7XG4gICAgfVxuICB9O1xuXG4gIHdpa2kuY3JlYXRlUGFnZSA9IGZ1bmN0aW9uKG5hbWUsIGxvYykge1xuICAgIHZhciAkcGFnZSwgc2l0ZTtcbiAgICBpZiAobG9jICYmIGxvYyAhPT0gJ3ZpZXcnKSB7XG4gICAgICBzaXRlID0gbG9jO1xuICAgIH1cbiAgICAkcGFnZSA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJwYWdlXFxcIiBpZD1cXFwiXCIgKyBuYW1lICsgXCJcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwidHdpbnNcXFwiPiA8cD4gPC9wPiA8L2Rpdj5cXG4gIDxkaXYgY2xhc3M9XFxcImhlYWRlclxcXCI+XFxuICAgIDxoMT4gPGltZyBjbGFzcz1cXFwiZmF2aWNvblxcXCIgc3JjPVxcXCJcIiArIChzaXRlID8gXCIvL1wiICsgc2l0ZSA6IFwiXCIpICsgXCIvZmF2aWNvbi5wbmdcXFwiIGhlaWdodD1cXFwiMzJweFxcXCI+IFwiICsgbmFtZSArIFwiIDwvaDE+XFxuICA8L2Rpdj5cXG48L2Rpdj5cIik7XG4gICAgaWYgKHNpdGUpIHtcbiAgICAgICRwYWdlLmZpbmQoJy5wYWdlJykuYXR0cignZGF0YS1zaXRlJywgc2l0ZSk7XG4gICAgfVxuICAgIHJldHVybiAkcGFnZTtcbiAgfTtcblxuICB3aWtpLmdldEl0ZW0gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKCQoZWxlbWVudCkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuICQoZWxlbWVudCkuZGF0YShcIml0ZW1cIikgfHwgJChlbGVtZW50KS5kYXRhKCdzdGF0aWNJdGVtJyk7XG4gICAgfVxuICB9O1xuXG4gIHdpa2kucmVzb2x2ZUxpbmtzID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdmFyIHJlbmRlckludGVybmFsTGluaztcbiAgICByZW5kZXJJbnRlcm5hbExpbmsgPSBmdW5jdGlvbihtYXRjaCwgbmFtZSkge1xuICAgICAgdmFyIHNsdWc7XG4gICAgICBzbHVnID0gd2lraS5hc1NsdWcobmFtZSk7XG4gICAgICByZXR1cm4gXCI8YSBjbGFzcz1cXFwiaW50ZXJuYWxcXFwiIGhyZWY9XFxcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIiBkYXRhLXBhZ2UtbmFtZT1cXFwiXCIgKyBzbHVnICsgXCJcXFwiIHRpdGxlPVxcXCJcIiArICh3aWtpLnJlc29sdXRpb25Db250ZXh0LmpvaW4oJyA9PiAnKSkgKyBcIlxcXCI+XCIgKyBuYW1lICsgXCI8L2E+XCI7XG4gICAgfTtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1xcW1xcWyhbXlxcXV0rKVxcXVxcXS9naSwgcmVuZGVySW50ZXJuYWxMaW5rKS5yZXBsYWNlKC9cXFsoaHR0cC4qPykgKC4qPylcXF0vZ2ksIFwiPGEgY2xhc3M9XFxcImV4dGVybmFsXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgaHJlZj1cXFwiJDFcXFwiIHRpdGxlPVxcXCIkMVxcXCIgcmVsPVxcXCJub2ZvbGxvd1xcXCI+JDIgPGltZyBzcmM9XFxcIi9pbWFnZXMvZXh0ZXJuYWwtbGluay1sdHItaWNvbi5wbmdcXFwiPjwvYT5cIik7XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3aWtpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBwYWdlSGFuZGxlciwgcGx1Z2luLCByZWZyZXNoLCBzdGF0ZSwgdXRpbCwgd2lraTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIHBhZ2VIYW5kbGVyID0gd2lraS5wYWdlSGFuZGxlciA9IHJlcXVpcmUoJy4vcGFnZUhhbmRsZXInKTtcblxuICBwbHVnaW4gPSByZXF1aXJlKCcuL3BsdWdpbicpO1xuXG4gIHN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZScpO1xuXG4gIGFjdGl2ZSA9IHJlcXVpcmUoJy4vYWN0aXZlJyk7XG5cbiAgcmVmcmVzaCA9IHJlcXVpcmUoJy4vcmVmcmVzaCcpO1xuXG4gIEFycmF5LnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXNbdGhpcy5sZW5ndGggLSAxXTtcbiAgfTtcblxuICAkKGZ1bmN0aW9uKCkge1xuICAgIHZhciBMRUZUQVJST1csIFJJR0hUQVJST1csIGNyZWF0ZVRleHRFbGVtZW50LCBkb0ludGVybmFsTGluaywgZmluaXNoQ2xpY2ssIGdldFRlbXBsYXRlLCBzbGVlcCwgdGV4dEVkaXRvcjtcbiAgICB3aW5kb3cuZGlhbG9nID0gJCgnPGRpdj48L2Rpdj4nKS5odG1sKCdUaGlzIGRpYWxvZyB3aWxsIHNob3cgZXZlcnkgdGltZSEnKS5kaWFsb2coe1xuICAgICAgYXV0b09wZW46IGZhbHNlLFxuICAgICAgdGl0bGU6ICdCYXNpYyBEaWFsb2cnLFxuICAgICAgaGVpZ2h0OiA2MDAsXG4gICAgICB3aWR0aDogODAwXG4gICAgfSk7XG4gICAgd2lraS5kaWFsb2cgPSBmdW5jdGlvbih0aXRsZSwgaHRtbCkge1xuICAgICAgd2luZG93LmRpYWxvZy5odG1sKGh0bWwpO1xuICAgICAgd2luZG93LmRpYWxvZy5kaWFsb2coXCJvcHRpb25cIiwgXCJ0aXRsZVwiLCB3aWtpLnJlc29sdmVMaW5rcyh0aXRsZSkpO1xuICAgICAgcmV0dXJuIHdpbmRvdy5kaWFsb2cuZGlhbG9nKCdvcGVuJyk7XG4gICAgfTtcbiAgICBzbGVlcCA9IGZ1bmN0aW9uKHRpbWUsIGRvbmUpIHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGRvbmUsIHRpbWUpO1xuICAgIH07XG4gICAgd2lraS5yZW1vdmVJdGVtID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICAgIHBhZ2VIYW5kbGVyLnB1dCgkaXRlbS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7XG4gICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gJGl0ZW0ucmVtb3ZlKCk7XG4gICAgfTtcbiAgICB3aWtpLmNyZWF0ZUl0ZW0gPSBmdW5jdGlvbigkcGFnZSwgJGJlZm9yZSwgaXRlbSkge1xuICAgICAgdmFyICRpdGVtLCBiZWZvcmU7XG4gICAgICBpZiAoJHBhZ2UgPT0gbnVsbCkge1xuICAgICAgICAkcGFnZSA9ICRiZWZvcmUucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgIH1cbiAgICAgIGl0ZW0uaWQgPSB1dGlsLnJhbmRvbUJ5dGVzKDgpO1xuICAgICAgJGl0ZW0gPSAkKFwiPGRpdiBjbGFzcz1cXFwiaXRlbSBcIiArIGl0ZW0udHlwZSArIFwiXFxcIiBkYXRhLWlkPVxcXCJcIiArIFwiXFxcIjwvZGl2PlwiKTtcbiAgICAgICRpdGVtLmRhdGEoJ2l0ZW0nLCBpdGVtKS5kYXRhKCdwYWdlRWxlbWVudCcsICRwYWdlKTtcbiAgICAgIGlmICgkYmVmb3JlICE9IG51bGwpIHtcbiAgICAgICAgJGJlZm9yZS5hZnRlcigkaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZS5maW5kKCcuc3RvcnknKS5hcHBlbmQoJGl0ZW0pO1xuICAgICAgfVxuICAgICAgcGx1Z2luW1wiZG9cIl0oJGl0ZW0sIGl0ZW0pO1xuICAgICAgYmVmb3JlID0gd2lraS5nZXRJdGVtKCRiZWZvcmUpO1xuICAgICAgc2xlZXAoNTAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dCgkcGFnZSwge1xuICAgICAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICAgICAgYWZ0ZXI6IGJlZm9yZSAhPSBudWxsID8gYmVmb3JlLmlkIDogdm9pZCAwXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gJGl0ZW07XG4gICAgfTtcbiAgICBjcmVhdGVUZXh0RWxlbWVudCA9IGZ1bmN0aW9uKHBhZ2VFbGVtZW50LCBiZWZvcmVFbGVtZW50LCBpbml0aWFsVGV4dCkge1xuICAgICAgdmFyIGl0ZW0sIGl0ZW1CZWZvcmUsIGl0ZW1FbGVtZW50O1xuICAgICAgaXRlbSA9IHtcbiAgICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpLFxuICAgICAgICB0ZXh0OiBpbml0aWFsVGV4dFxuICAgICAgfTtcbiAgICAgIGl0ZW1FbGVtZW50ID0gJChcIjxkaXYgY2xhc3M9XFxcIml0ZW0gcGFyYWdyYXBoXFxcIiBkYXRhLWlkPVwiICsgaXRlbS5pZCArIFwiPjwvZGl2PlwiKTtcbiAgICAgIGl0ZW1FbGVtZW50LmRhdGEoJ2l0ZW0nLCBpdGVtKS5kYXRhKCdwYWdlRWxlbWVudCcsIHBhZ2VFbGVtZW50KTtcbiAgICAgIGJlZm9yZUVsZW1lbnQuYWZ0ZXIoaXRlbUVsZW1lbnQpO1xuICAgICAgcGx1Z2luW1wiZG9cIl0oaXRlbUVsZW1lbnQsIGl0ZW0pO1xuICAgICAgaXRlbUJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KTtcbiAgICAgIHdpa2kudGV4dEVkaXRvcihpdGVtRWxlbWVudCwgaXRlbSk7XG4gICAgICByZXR1cm4gc2xlZXAoNTAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dChwYWdlRWxlbWVudCwge1xuICAgICAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICAgICAgYWZ0ZXI6IGl0ZW1CZWZvcmUgIT0gbnVsbCA/IGl0ZW1CZWZvcmUuaWQgOiB2b2lkIDBcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHRleHRFZGl0b3IgPSB3aWtpLnRleHRFZGl0b3IgPSBmdW5jdGlvbihkaXYsIGl0ZW0sIGNhcmV0UG9zLCBkb3VibGVDbGlja2VkKSB7XG4gICAgICB2YXIgb3JpZ2luYWwsIHRleHRhcmVhLCBfcmVmO1xuICAgICAgaWYgKGRpdi5oYXNDbGFzcygndGV4dEVkaXRpbmcnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBkaXYuYWRkQ2xhc3MoJ3RleHRFZGl0aW5nJyk7XG4gICAgICB0ZXh0YXJlYSA9ICQoXCI8dGV4dGFyZWE+XCIgKyAob3JpZ2luYWwgPSAoX3JlZiA9IGl0ZW0udGV4dCkgIT0gbnVsbCA/IF9yZWYgOiAnJykgKyBcIjwvdGV4dGFyZWE+XCIpLmZvY3Vzb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBkaXYucmVtb3ZlQ2xhc3MoJ3RleHRFZGl0aW5nJyk7XG4gICAgICAgIGlmIChpdGVtLnRleHQgPSB0ZXh0YXJlYS52YWwoKSkge1xuICAgICAgICAgIHBsdWdpbltcImRvXCJdKGRpdi5lbXB0eSgpLCBpdGVtKTtcbiAgICAgICAgICBpZiAoaXRlbS50ZXh0ID09PSBvcmlnaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQoZGl2LnBhcmVudHMoJy5wYWdlOmZpcnN0JyksIHtcbiAgICAgICAgICAgIHR5cGU6ICdlZGl0JyxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dChkaXYucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge1xuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZScsXG4gICAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGRpdi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0pLmJpbmQoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBtaWRkbGUsIHBhZ2UsIHBhZ2VFbGVtZW50LCBwcmVmaXgsIHByZXZJdGVtLCBwcmV2VGV4dExlbiwgc2VsLCBzdWZmaXgsIHRleHQ7XG4gICAgICAgIGlmICgoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSAmJiBlLndoaWNoID09PSA4Mykge1xuICAgICAgICAgIHRleHRhcmVhLmZvY3Vzb3V0KCk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSAmJiBlLndoaWNoID09PSA3Mykge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBpZiAoIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkb0ludGVybmFsTGluayhcImFib3V0IFwiICsgaXRlbS50eXBlICsgXCIgcGx1Z2luXCIsIHBhZ2UpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbS50eXBlID09PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgIHNlbCA9IHV0aWwuZ2V0U2VsZWN0aW9uUG9zKHRleHRhcmVhKTtcbiAgICAgICAgICBpZiAoZS53aGljaCA9PT0gJC51aS5rZXlDb2RlLkJBQ0tTUEFDRSAmJiBzZWwuc3RhcnQgPT09IDAgJiYgc2VsLnN0YXJ0ID09PSBzZWwuZW5kKSB7XG4gICAgICAgICAgICBwcmV2SXRlbSA9IHdpa2kuZ2V0SXRlbShkaXYucHJldigpKTtcbiAgICAgICAgICAgIGlmIChwcmV2SXRlbS50eXBlICE9PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2VGV4dExlbiA9IHByZXZJdGVtLnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgcHJldkl0ZW0udGV4dCArPSB0ZXh0YXJlYS52YWwoKTtcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnJyk7XG4gICAgICAgICAgICB0ZXh0RWRpdG9yKGRpdi5wcmV2KCksIHByZXZJdGVtLCBwcmV2VGV4dExlbik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIGlmIChlLndoaWNoID09PSAkLnVpLmtleUNvZGUuRU5URVIgJiYgaXRlbS50eXBlID09PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgICAgaWYgKCFzZWwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGV4dCA9IHRleHRhcmVhLnZhbCgpO1xuICAgICAgICAgICAgcHJlZml4ID0gdGV4dC5zdWJzdHJpbmcoMCwgc2VsLnN0YXJ0KTtcbiAgICAgICAgICAgIGlmIChzZWwuc3RhcnQgIT09IHNlbC5lbmQpIHtcbiAgICAgICAgICAgICAgbWlkZGxlID0gdGV4dC5zdWJzdHJpbmcoc2VsLnN0YXJ0LCBzZWwuZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1ZmZpeCA9IHRleHQuc3Vic3RyaW5nKHNlbC5lbmQpO1xuICAgICAgICAgICAgaWYgKHByZWZpeCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgdGV4dGFyZWEudmFsKCcgJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0ZXh0YXJlYS52YWwocHJlZml4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHRhcmVhLmZvY3Vzb3V0KCk7XG4gICAgICAgICAgICBwYWdlRWxlbWVudCA9IGRpdi5wYXJlbnQoKS5wYXJlbnQoKTtcbiAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsIHN1ZmZpeCk7XG4gICAgICAgICAgICBpZiAobWlkZGxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgbWlkZGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcmVmaXggPT09ICcnKSB7XG4gICAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGl2Lmh0bWwodGV4dGFyZWEpO1xuICAgICAgaWYgKGNhcmV0UG9zICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbih0ZXh0YXJlYSwgY2FyZXRQb3MpO1xuICAgICAgfSBlbHNlIGlmIChkb3VibGVDbGlja2VkKSB7XG4gICAgICAgIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbih0ZXh0YXJlYSwgdGV4dGFyZWEudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLnNjcm9sbFRvcCh0ZXh0YXJlYVswXS5zY3JvbGxIZWlnaHQgLSB0ZXh0YXJlYS5oZWlnaHQoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGV4dGFyZWEuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGRvSW50ZXJuYWxMaW5rID0gd2lraS5kb0ludGVybmFsTGluayA9IGZ1bmN0aW9uKG5hbWUsIHBhZ2UsIHNpdGUpIHtcbiAgICAgIGlmIChzaXRlID09IG51bGwpIHtcbiAgICAgICAgc2l0ZSA9IG51bGw7XG4gICAgICB9XG4gICAgICBuYW1lID0gd2lraS5hc1NsdWcobmFtZSk7XG4gICAgICBpZiAocGFnZSAhPSBudWxsKSB7XG4gICAgICAgICQocGFnZSkubmV4dEFsbCgpLnJlbW92ZSgpO1xuICAgICAgfVxuICAgICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsIHNpdGUpLmFwcGVuZFRvKCQoJy5tYWluJykpLmVhY2gocmVmcmVzaCk7XG4gICAgICByZXR1cm4gYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSk7XG4gICAgfTtcbiAgICBMRUZUQVJST1cgPSAzNztcbiAgICBSSUdIVEFSUk9XID0gMzk7XG4gICAgJChkb2N1bWVudCkua2V5ZG93bihmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGRpcmVjdGlvbiwgbmV3SW5kZXgsIHBhZ2VzO1xuICAgICAgZGlyZWN0aW9uID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBzd2l0Y2ggKGV2ZW50LndoaWNoKSB7XG4gICAgICAgICAgY2FzZSBMRUZUQVJST1c6XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgY2FzZSBSSUdIVEFSUk9XOlxuICAgICAgICAgICAgcmV0dXJuICsxO1xuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgICAgaWYgKGRpcmVjdGlvbiAmJiAhKGV2ZW50LnRhcmdldC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpKSB7XG4gICAgICAgIHBhZ2VzID0gJCgnLnBhZ2UnKTtcbiAgICAgICAgbmV3SW5kZXggPSBwYWdlcy5pbmRleCgkKCcuYWN0aXZlJykpICsgZGlyZWN0aW9uO1xuICAgICAgICBpZiAoKDAgPD0gbmV3SW5kZXggJiYgbmV3SW5kZXggPCBwYWdlcy5sZW5ndGgpKSB7XG4gICAgICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQocGFnZXMuZXEobmV3SW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgICQod2luZG93KS5vbigncG9wc3RhdGUnLCBzdGF0ZS5zaG93KTtcbiAgICAkKGRvY3VtZW50KS5hamF4RXJyb3IoZnVuY3Rpb24oZXZlbnQsIHJlcXVlc3QsIHNldHRpbmdzKSB7XG4gICAgICBpZiAocmVxdWVzdC5zdGF0dXMgPT09IDAgfHwgcmVxdWVzdC5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB3aWtpLmxvZygnYWpheCBlcnJvcicsIGV2ZW50LCByZXF1ZXN0LCBzZXR0aW5ncyk7XG4gICAgICByZXR1cm4gJCgnLm1haW4nKS5wcmVwZW5kKFwiPGxpIGNsYXNzPSdlcnJvcic+XFxuICBFcnJvciBvbiBcIiArIHNldHRpbmdzLnVybCArIFwiOiBcIiArIHJlcXVlc3QucmVzcG9uc2VUZXh0ICsgXCJcXG48L2xpPlwiKTtcbiAgICB9KTtcbiAgICBnZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKHNsdWcsIGRvbmUpIHtcbiAgICAgIGlmICghc2x1Zykge1xuICAgICAgICByZXR1cm4gZG9uZShudWxsKTtcbiAgICAgIH1cbiAgICAgIHdpa2kubG9nKCdnZXRUZW1wbGF0ZScsIHNsdWcpO1xuICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLmdldCh7XG4gICAgICAgIHdoZW5Hb3R0ZW46IGZ1bmN0aW9uKGRhdGEsIHNpdGVGb3VuZCkge1xuICAgICAgICAgIHJldHVybiBkb25lKGRhdGEuc3RvcnkpO1xuICAgICAgICB9LFxuICAgICAgICB3aGVuTm90R290dGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZG9uZShudWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgcGFnZUluZm9ybWF0aW9uOiB7XG4gICAgICAgICAgc2x1Zzogc2x1Z1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGZpbmlzaENsaWNrID0gZnVuY3Rpb24oZSwgbmFtZSkge1xuICAgICAgdmFyIHBhZ2U7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBpZiAoIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlJyk7XG4gICAgICB9XG4gICAgICBkb0ludGVybmFsTGluayhuYW1lLCBwYWdlLCAkKGUudGFyZ2V0KS5kYXRhKCdzaXRlJykpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgJCgnLm1haW4nKS5kZWxlZ2F0ZSgnLnNob3ctcGFnZS1zb3VyY2UnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIganNvbiwgcGFnZUVsZW1lbnQ7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBwYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50KCkucGFyZW50KCk7XG4gICAgICBqc29uID0gcGFnZUVsZW1lbnQuZGF0YSgnZGF0YScpO1xuICAgICAgcmV0dXJuIHdpa2kuZGlhbG9nKFwiSlNPTiBmb3IgXCIgKyBqc29uLnRpdGxlLCAkKCc8cHJlLz4nKS50ZXh0KEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpKSk7XG4gICAgfSkuZGVsZWdhdGUoJy5wYWdlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgaWYgKCEkKGUudGFyZ2V0KS5pcyhcImFcIikpIHtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQodGhpcyk7XG4gICAgICB9XG4gICAgfSkuZGVsZWdhdGUoJy5pbnRlcm5hbCcsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBuYW1lO1xuICAgICAgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEoJ3BhZ2VOYW1lJyk7XG4gICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gJChlLnRhcmdldCkuYXR0cigndGl0bGUnKS5zcGxpdCgnID0+ICcpO1xuICAgICAgcmV0dXJuIGZpbmlzaENsaWNrKGUsIG5hbWUpO1xuICAgIH0pLmRlbGVnYXRlKCdpbWcucmVtb3RlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIG5hbWU7XG4gICAgICBuYW1lID0gJChlLnRhcmdldCkuZGF0YSgnc2x1ZycpO1xuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFskKGUudGFyZ2V0KS5kYXRhKCdzaXRlJyldO1xuICAgICAgcmV0dXJuIGZpbmlzaENsaWNrKGUsIG5hbWUpO1xuICAgIH0pLmRlbGVnYXRlKCcucmV2aXNpb24nLCAnZGJsY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJHBhZ2UsIGFjdGlvbiwganNvbiwgcGFnZSwgcmV2O1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgJHBhZ2UgPSAkKHRoaXMpLnBhcmVudHMoJy5wYWdlJyk7XG4gICAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpO1xuICAgICAgcmV2ID0gcGFnZS5qb3VybmFsLmxlbmd0aCAtIDE7XG4gICAgICBhY3Rpb24gPSBwYWdlLmpvdXJuYWxbcmV2XTtcbiAgICAgIGpzb24gPSBKU09OLnN0cmluZ2lmeShhY3Rpb24sIG51bGwsIDIpO1xuICAgICAgcmV0dXJuIHdpa2kuZGlhbG9nKFwiUmV2aXNpb24gXCIgKyByZXYgKyBcIiwgXCIgKyBhY3Rpb24udHlwZSArIFwiIGFjdGlvblwiLCAkKCc8cHJlLz4nKS50ZXh0KGpzb24pKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLmFjdGlvbicsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkYWN0aW9uLCAkcGFnZSwgbmFtZSwgcmV2LCBzbHVnO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgJGFjdGlvbiA9ICQoZS50YXJnZXQpO1xuICAgICAgaWYgKCRhY3Rpb24uaXMoJy5mb3JrJykgJiYgKChuYW1lID0gJGFjdGlvbi5kYXRhKCdzbHVnJykpICE9IG51bGwpKSB7XG4gICAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJGFjdGlvbi5kYXRhKCdzaXRlJyldO1xuICAgICAgICByZXR1cm4gZmluaXNoQ2xpY2soZSwgKG5hbWUuc3BsaXQoJ18nKSlbMF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2UgPSAkKHRoaXMpLnBhcmVudHMoJy5wYWdlJyk7XG4gICAgICAgIHNsdWcgPSB3aWtpLmFzU2x1ZygkcGFnZS5kYXRhKCdkYXRhJykudGl0bGUpO1xuICAgICAgICByZXYgPSAkKHRoaXMpLnBhcmVudCgpLmNoaWxkcmVuKCkuaW5kZXgoJGFjdGlvbik7XG4gICAgICAgIGlmICghZS5zaGlmdEtleSkge1xuICAgICAgICAgICRwYWdlLm5leHRBbGwoKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB3aWtpLmNyZWF0ZVBhZ2UoXCJcIiArIHNsdWcgKyBcIl9yZXZcIiArIHJldiwgJHBhZ2UuZGF0YSgnc2l0ZScpKS5hcHBlbmRUbygkKCcubWFpbicpKS5lYWNoKHJlZnJlc2gpO1xuICAgICAgICByZXR1cm4gYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSk7XG4gICAgICB9XG4gICAgfSkuZGVsZWdhdGUoJy5mb3JrLXBhZ2UnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgaXRlbSwgcGFnZUVsZW1lbnQsIHJlbW90ZVNpdGU7XG4gICAgICBwYWdlRWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlJyk7XG4gICAgICBpZiAocGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2xvY2FsJykpIHtcbiAgICAgICAgaWYgKCF3aWtpLnVzZUxvY2FsU3RvcmFnZSgpKSB7XG4gICAgICAgICAgaXRlbSA9IHBhZ2VFbGVtZW50LmRhdGEoJ2RhdGEnKTtcbiAgICAgICAgICBwYWdlRWxlbWVudC5yZW1vdmVDbGFzcygnbG9jYWwnKTtcbiAgICAgICAgICByZXR1cm4gcGFnZUhhbmRsZXIucHV0KHBhZ2VFbGVtZW50LCB7XG4gICAgICAgICAgICB0eXBlOiAnZm9yaycsXG4gICAgICAgICAgICBpdGVtOiBpdGVtXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICgocmVtb3RlU2l0ZSA9IHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKSkgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQocGFnZUVsZW1lbnQsIHtcbiAgICAgICAgICAgIHR5cGU6ICdmb3JrJyxcbiAgICAgICAgICAgIHNpdGU6IHJlbW90ZVNpdGVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLmRlbGVnYXRlKCcuYWN0aW9uJywgJ2hvdmVyJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaWQ7XG4gICAgICBpZCA9ICQodGhpcykuYXR0cignZGF0YS1pZCcpO1xuICAgICAgJChcIltkYXRhLWlkPVwiICsgaWQgKyBcIl1cIikudG9nZ2xlQ2xhc3MoJ3RhcmdldCcpO1xuICAgICAgcmV0dXJuICQoJy5tYWluJykudHJpZ2dlcigncmV2Jyk7XG4gICAgfSkuZGVsZWdhdGUoJy5pdGVtJywgJ2hvdmVyJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaWQ7XG4gICAgICBpZCA9ICQodGhpcykuYXR0cignZGF0YS1pZCcpO1xuICAgICAgcmV0dXJuICQoXCIuYWN0aW9uW2RhdGEtaWQ9XCIgKyBpZCArIFwiXVwiKS50b2dnbGVDbGFzcygndGFyZ2V0Jyk7XG4gICAgfSkuZGVsZWdhdGUoJ2J1dHRvbi5jcmVhdGUnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gZ2V0VGVtcGxhdGUoJChlLnRhcmdldCkuZGF0YSgnc2x1ZycpLCBmdW5jdGlvbihzdG9yeSkge1xuICAgICAgICB2YXIgJHBhZ2UsIHBhZ2U7XG4gICAgICAgICRwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICAgICAgJHBhZ2UucmVtb3ZlQ2xhc3MoJ2dob3N0Jyk7XG4gICAgICAgIHBhZ2UgPSAkcGFnZS5kYXRhKCdkYXRhJyk7XG4gICAgICAgIHBhZ2Uuc3RvcnkgPSBzdG9yeSB8fCBbXTtcbiAgICAgICAgcGFnZUhhbmRsZXIucHV0KCRwYWdlLCB7XG4gICAgICAgICAgdHlwZTogJ2NyZWF0ZScsXG4gICAgICAgICAgaWQ6IHBhZ2UuaWQsXG4gICAgICAgICAgaXRlbToge1xuICAgICAgICAgICAgdGl0bGU6IHBhZ2UudGl0bGUsXG4gICAgICAgICAgICBzdG9yeTogc3RvcnkgfHwgdm9pZCAwXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHdpa2kuYnVpbGRQYWdlKHBhZ2UsIG51bGwsICRwYWdlLmVtcHR5KCkpO1xuICAgICAgfSk7XG4gICAgfSkuZGVsZWdhdGUoJy5naG9zdCcsICdyZXYnLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGl0ZW0sICRwYWdlLCBwb3NpdGlvbjtcbiAgICAgIHdpa2kubG9nKCdyZXYnLCBlKTtcbiAgICAgICRwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICAgICRpdGVtID0gJHBhZ2UuZmluZCgnLnRhcmdldCcpO1xuICAgICAgcG9zaXRpb24gPSAkaXRlbS5vZmZzZXQoKS50b3AgKyAkcGFnZS5zY3JvbGxUb3AoKSAtICRwYWdlLmhlaWdodCgpIC8gMjtcbiAgICAgIHdpa2kubG9nKCdzY3JvbGwnLCAkcGFnZSwgJGl0ZW0sIHBvc2l0aW9uKTtcbiAgICAgIHJldHVybiAkcGFnZS5zdG9wKCkuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogcG9zdGlvblxuICAgICAgfSwgJ3Nsb3cnKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLnNjb3JlJywgJ2hvdmVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuICQoJy5tYWluJykudHJpZ2dlcigndGh1bWInLCAkKGUudGFyZ2V0KS5kYXRhKCd0aHVtYicpKTtcbiAgICB9KTtcbiAgICAkKFwiLnByb3ZpZGVyIGlucHV0XCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgJChcImZvb3RlciBpbnB1dDpmaXJzdFwiKS52YWwoJCh0aGlzKS5hdHRyKCdkYXRhLXByb3ZpZGVyJykpO1xuICAgICAgcmV0dXJuICQoXCJmb290ZXIgZm9ybVwiKS5zdWJtaXQoKTtcbiAgICB9KTtcbiAgICAkKCdib2R5Jykub24oJ25ldy1uZWlnaGJvci1kb25lJywgZnVuY3Rpb24oZSwgbmVpZ2hib3IpIHtcbiAgICAgIHJldHVybiAkKCcucGFnZScpLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHdpa2kuZW1pdFR3aW5zKCQoZWxlbWVudCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICQoZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0ZS5maXJzdCgpO1xuICAgICAgJCgnLnBhZ2UnKS5lYWNoKHJlZnJlc2gpO1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIH0pO1xuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwYWdlKSB7XG4gICAgdmFyIHAxLCBwMiwgc3lub3BzaXM7XG4gICAgc3lub3BzaXMgPSBwYWdlLnN5bm9wc2lzO1xuICAgIGlmICgocGFnZSAhPSBudWxsKSAmJiAocGFnZS5zdG9yeSAhPSBudWxsKSkge1xuICAgICAgcDEgPSBwYWdlLnN0b3J5WzBdO1xuICAgICAgcDIgPSBwYWdlLnN0b3J5WzFdO1xuICAgICAgaWYgKHAxICYmIHAxLnR5cGUgPT09ICdwYXJhZ3JhcGgnKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAxLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHAyICYmIHAyLnR5cGUgPT09ICdwYXJhZ3JhcGgnKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAyLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHAxICYmIChwMS50ZXh0ICE9IG51bGwpKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAxLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHAyICYmIChwMi50ZXh0ICE9IG51bGwpKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAyLnRleHQpO1xuICAgICAgfVxuICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gKHBhZ2Uuc3RvcnkgIT0gbnVsbCkgJiYgKFwiQSBwYWdlIHdpdGggXCIgKyBwYWdlLnN0b3J5Lmxlbmd0aCArIFwiIGl0ZW1zLlwiKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN5bm9wc2lzID0gJ0EgcGFnZSB3aXRoIG5vIHN0b3J5Lic7XG4gICAgfVxuICAgIHJldHVybiBzeW5vcHNpcztcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvd25lcikge1xuICAgICQoXCIjdXNlci1lbWFpbFwiKS5oaWRlKCk7XG4gICAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5oaWRlKCk7XG4gICAgJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuaGlkZSgpO1xuICAgIG5hdmlnYXRvci5pZC53YXRjaCh7XG4gICAgICBsb2dnZWRJblVzZXI6IG93bmVyLFxuICAgICAgb25sb2dpbjogZnVuY3Rpb24oYXNzZXJ0aW9uKSB7XG4gICAgICAgIHJldHVybiAkLnBvc3QoXCIvcGVyc29uYV9sb2dpblwiLCB7XG4gICAgICAgICAgYXNzZXJ0aW9uOiBhc3NlcnRpb25cbiAgICAgICAgfSwgZnVuY3Rpb24odmVyaWZpZWQpIHtcbiAgICAgICAgICB2ZXJpZmllZCA9IEpTT04ucGFyc2UodmVyaWZpZWQpO1xuICAgICAgICAgIGlmIChcIm9rYXlcIiA9PT0gdmVyaWZpZWQuc3RhdHVzKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uID0gXCIvXCI7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5hdmlnYXRvci5pZC5sb2dvdXQoKTtcbiAgICAgICAgICAgIGlmIChcIndyb25nLWFkZHJlc3NcIiA9PT0gdmVyaWZpZWQuc3RhdHVzKSB7XG4gICAgICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24gPSBcIi9vb3BzXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBvbmxvZ291dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkLnBvc3QoXCIvcGVyc29uYV9sb2dvdXRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbiA9IFwiL1wiO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBvbnJlYWR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKG93bmVyKSB7XG4gICAgICAgICAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5oaWRlKCk7XG4gICAgICAgICAgcmV0dXJuICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLnNob3coKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLnNob3coKTtcbiAgICAgICAgICByZXR1cm4gJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm4gbmF2aWdhdG9yLmlkLnJlcXVlc3Qoe30pO1xuICAgIH0pO1xuICAgIHJldHVybiAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm4gbmF2aWdhdG9yLmlkLmxvZ291dCgpO1xuICAgIH0pO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBmaW5kU2Nyb2xsQ29udGFpbmVyLCBzY3JvbGxUbztcblxuICBtb2R1bGUuZXhwb3J0cyA9IGFjdGl2ZSA9IHt9O1xuXG4gIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSB2b2lkIDA7XG5cbiAgZmluZFNjcm9sbENvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzY3JvbGxlZDtcbiAgICBzY3JvbGxlZCA9ICQoXCJib2R5LCBodG1sXCIpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkKHRoaXMpLnNjcm9sbExlZnQoKSA+IDA7XG4gICAgfSk7XG4gICAgaWYgKHNjcm9sbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBzY3JvbGxlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICQoXCJib2R5LCBodG1sXCIpLnNjcm9sbExlZnQoMTIpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICQodGhpcykuc2Nyb2xsTGVmdCgpID4gMDtcbiAgICAgIH0pLnNjcm9sbFRvcCgwKTtcbiAgICB9XG4gIH07XG5cbiAgc2Nyb2xsVG8gPSBmdW5jdGlvbihlbCkge1xuICAgIHZhciBib2R5V2lkdGgsIGNvbnRlbnRXaWR0aCwgbWF4WCwgbWluWCwgdGFyZ2V0LCB3aWR0aDtcbiAgICBpZiAoYWN0aXZlLnNjcm9sbENvbnRhaW5lciA9PSBudWxsKSB7XG4gICAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyID0gZmluZFNjcm9sbENvbnRhaW5lcigpO1xuICAgIH1cbiAgICBib2R5V2lkdGggPSAkKFwiYm9keVwiKS53aWR0aCgpO1xuICAgIG1pblggPSBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQoKTtcbiAgICBtYXhYID0gbWluWCArIGJvZHlXaWR0aDtcbiAgICB0YXJnZXQgPSBlbC5wb3NpdGlvbigpLmxlZnQ7XG4gICAgd2lkdGggPSBlbC5vdXRlcldpZHRoKHRydWUpO1xuICAgIGNvbnRlbnRXaWR0aCA9ICQoXCIucGFnZVwiKS5vdXRlcldpZHRoKHRydWUpICogJChcIi5wYWdlXCIpLnNpemUoKTtcbiAgICBpZiAodGFyZ2V0IDwgbWluWCkge1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbExlZnQ6IHRhcmdldFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0YXJnZXQgKyB3aWR0aCA+IG1heFgpIHtcbiAgICAgIHJldHVybiBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxMZWZ0OiB0YXJnZXQgLSAoYm9keVdpZHRoIC0gd2lkdGgpXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG1heFggPiAkKFwiLnBhZ2VzXCIpLm91dGVyV2lkdGgoKSkge1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbExlZnQ6IE1hdGgubWluKHRhcmdldCwgY29udGVudFdpZHRoIC0gYm9keVdpZHRoKVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGFjdGl2ZS5zZXQgPSBmdW5jdGlvbihlbCkge1xuICAgIGVsID0gJChlbCk7XG4gICAgJChcIi5hY3RpdmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgcmV0dXJuIHNjcm9sbFRvKGVsLmFkZENsYXNzKFwiYWN0aXZlXCIpKTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIHV0aWwsIHdpa2k7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gd2lraS51dGlsID0gdXRpbCA9IHt9O1xuXG4gIHV0aWwuc3ltYm9scyA9IHtcbiAgICBjcmVhdGU6ICfimLwnLFxuICAgIGFkZDogJysnLFxuICAgIGVkaXQ6ICfinI4nLFxuICAgIGZvcms6ICfimpEnLFxuICAgIG1vdmU6ICfihpUnLFxuICAgIHJlbW92ZTogJ+KclSdcbiAgfTtcblxuICB1dGlsLnJhbmRvbUJ5dGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDApIHwgMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcbiAgfTtcblxuICB1dGlsLnJhbmRvbUJ5dGVzID0gZnVuY3Rpb24obikge1xuICAgIHJldHVybiAoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF9pLCBfcmVzdWx0cztcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMTsgMSA8PSBuID8gX2kgPD0gbiA6IF9pID49IG47IDEgPD0gbiA/IF9pKysgOiBfaS0tKSB7XG4gICAgICAgIF9yZXN1bHRzLnB1c2godXRpbC5yYW5kb21CeXRlKCkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH0pKCkpLmpvaW4oJycpO1xuICB9O1xuXG4gIHV0aWwuZm9ybWF0VGltZSA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICB2YXIgYW0sIGQsIGgsIG1pLCBtbztcbiAgICBkID0gbmV3IERhdGUoKHRpbWUgPiAxMDAwMDAwMDAwMCA/IHRpbWUgOiB0aW1lICogMTAwMCkpO1xuICAgIG1vID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddW2QuZ2V0TW9udGgoKV07XG4gICAgaCA9IGQuZ2V0SG91cnMoKTtcbiAgICBhbSA9IGggPCAxMiA/ICdBTScgOiAnUE0nO1xuICAgIGggPSBoID09PSAwID8gMTIgOiBoID4gMTIgPyBoIC0gMTIgOiBoO1xuICAgIG1pID0gKGQuZ2V0TWludXRlcygpIDwgMTAgPyBcIjBcIiA6IFwiXCIpICsgZC5nZXRNaW51dGVzKCk7XG4gICAgcmV0dXJuIFwiXCIgKyBoICsgXCI6XCIgKyBtaSArIFwiIFwiICsgYW0gKyBcIjxicj5cIiArIChkLmdldERhdGUoKSkgKyBcIiBcIiArIG1vICsgXCIgXCIgKyAoZC5nZXRGdWxsWWVhcigpKTtcbiAgfTtcblxuICB1dGlsLmZvcm1hdERhdGUgPSBmdW5jdGlvbihtc1NpbmNlRXBvY2gpIHtcbiAgICB2YXIgYW0sIGQsIGRheSwgaCwgbWksIG1vLCBzZWMsIHdrLCB5cjtcbiAgICBkID0gbmV3IERhdGUobXNTaW5jZUVwb2NoKTtcbiAgICB3ayA9IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J11bZC5nZXREYXkoKV07XG4gICAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXTtcbiAgICBkYXkgPSBkLmdldERhdGUoKTtcbiAgICB5ciA9IGQuZ2V0RnVsbFllYXIoKTtcbiAgICBoID0gZC5nZXRIb3VycygpO1xuICAgIGFtID0gaCA8IDEyID8gJ0FNJyA6ICdQTSc7XG4gICAgaCA9IGggPT09IDAgPyAxMiA6IGggPiAxMiA/IGggLSAxMiA6IGg7XG4gICAgbWkgPSAoZC5nZXRNaW51dGVzKCkgPCAxMCA/IFwiMFwiIDogXCJcIikgKyBkLmdldE1pbnV0ZXMoKTtcbiAgICBzZWMgPSAoZC5nZXRTZWNvbmRzKCkgPCAxMCA/IFwiMFwiIDogXCJcIikgKyBkLmdldFNlY29uZHMoKTtcbiAgICByZXR1cm4gXCJcIiArIHdrICsgXCIgXCIgKyBtbyArIFwiIFwiICsgZGF5ICsgXCIsIFwiICsgeXIgKyBcIjxicj5cIiArIGggKyBcIjpcIiArIG1pICsgXCI6XCIgKyBzZWMgKyBcIiBcIiArIGFtO1xuICB9O1xuXG4gIHV0aWwuZm9ybWF0RWxhcHNlZFRpbWUgPSBmdW5jdGlvbihtc1NpbmNlRXBvY2gpIHtcbiAgICB2YXIgZGF5cywgaHJzLCBtaW5zLCBtb250aHMsIG1zZWNzLCBzZWNzLCB3ZWVrcywgeWVhcnM7XG4gICAgbXNlY3MgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG1zU2luY2VFcG9jaDtcbiAgICBpZiAoKHNlY3MgPSBtc2VjcyAvIDEwMDApIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihtc2VjcykpICsgXCIgbWlsbGlzZWNvbmRzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKG1pbnMgPSBzZWNzIC8gNjApIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihzZWNzKSkgKyBcIiBzZWNvbmRzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKGhycyA9IG1pbnMgLyA2MCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKG1pbnMpKSArIFwiIG1pbnV0ZXMgYWdvXCI7XG4gICAgfVxuICAgIGlmICgoZGF5cyA9IGhycyAvIDI0KSA8IDIpIHtcbiAgICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IoaHJzKSkgKyBcIiBob3VycyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKCh3ZWVrcyA9IGRheXMgLyA3KSA8IDIpIHtcbiAgICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IoZGF5cykpICsgXCIgZGF5cyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKChtb250aHMgPSBkYXlzIC8gMzEpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcih3ZWVrcykpICsgXCIgd2Vla3MgYWdvXCI7XG4gICAgfVxuICAgIGlmICgoeWVhcnMgPSBkYXlzIC8gMzY1KSA8IDIpIHtcbiAgICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IobW9udGhzKSkgKyBcIiBtb250aHMgYWdvXCI7XG4gICAgfVxuICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IoeWVhcnMpKSArIFwiIHllYXJzIGFnb1wiO1xuICB9O1xuXG4gIHV0aWwuZW1wdHlQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiAnZW1wdHknLFxuICAgICAgc3Rvcnk6IFtdLFxuICAgICAgam91cm5hbDogW11cbiAgICB9O1xuICB9O1xuXG4gIHV0aWwuZ2V0U2VsZWN0aW9uUG9zID0gZnVuY3Rpb24oalF1ZXJ5RWxlbWVudCkge1xuICAgIHZhciBlbCwgaWVQb3MsIHNlbDtcbiAgICBlbCA9IGpRdWVyeUVsZW1lbnQuZ2V0KDApO1xuICAgIGlmIChkb2N1bWVudC5zZWxlY3Rpb24pIHtcbiAgICAgIGVsLmZvY3VzKCk7XG4gICAgICBzZWwgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKTtcbiAgICAgIHNlbC5tb3ZlU3RhcnQoJ2NoYXJhY3RlcicsIC1lbC52YWx1ZS5sZW5ndGgpO1xuICAgICAgaWVQb3MgPSBzZWwudGV4dC5sZW5ndGg7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGFydDogaWVQb3MsXG4gICAgICAgIGVuZDogaWVQb3NcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiBlbC5zZWxlY3Rpb25TdGFydCxcbiAgICAgICAgZW5kOiBlbC5zZWxlY3Rpb25FbmRcbiAgICAgIH07XG4gICAgfVxuICB9O1xuXG4gIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGpRdWVyeUVsZW1lbnQsIGNhcmV0UG9zKSB7XG4gICAgdmFyIGVsLCByYW5nZTtcbiAgICBlbCA9IGpRdWVyeUVsZW1lbnQuZ2V0KDApO1xuICAgIGlmIChlbCAhPSBudWxsKSB7XG4gICAgICBpZiAoZWwuY3JlYXRlVGV4dFJhbmdlKSB7XG4gICAgICAgIHJhbmdlID0gZWwuY3JlYXRlVGV4dFJhbmdlKCk7XG4gICAgICAgIHJhbmdlLm1vdmUoXCJjaGFyYWN0ZXJcIiwgY2FyZXRQb3MpO1xuICAgICAgICByYW5nZS5zZWxlY3QoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlKGNhcmV0UG9zLCBjYXJldFBvcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWwuZm9jdXMoKTtcbiAgICB9XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBnZXRTY3JpcHQsIHBsdWdpbiwgc2NyaXB0cywgdXRpbCwgd2lraTtcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gcGx1Z2luID0ge307XG5cbiAgc2NyaXB0cyA9IHt9O1xuXG4gIGdldFNjcmlwdCA9IHdpa2kuZ2V0U2NyaXB0ID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgIGlmIChjYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICAgIGlmIChzY3JpcHRzW3VybF0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAkLmdldFNjcmlwdCh1cmwpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNjcmlwdHNbdXJsXSA9IHRydWU7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgfSkuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgcGx1Z2luLmdldCA9IHdpa2kuZ2V0UGx1Z2luID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZiAod2luZG93LnBsdWdpbnNbbmFtZV0pIHtcbiAgICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSk7XG4gICAgfVxuICAgIHJldHVybiBnZXRTY3JpcHQoXCIvcGx1Z2lucy9cIiArIG5hbWUgKyBcIi9cIiArIG5hbWUgKyBcIi5qc1wiLCBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh3aW5kb3cucGx1Z2luc1tuYW1lXSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sod2luZG93LnBsdWdpbnNbbmFtZV0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdldFNjcmlwdChcIi9wbHVnaW5zL1wiICsgbmFtZSArIFwiLmpzXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sod2luZG93LnBsdWdpbnNbbmFtZV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgcGx1Z2luW1wiZG9cIl0gPSB3aWtpLmRvUGx1Z2luID0gZnVuY3Rpb24oZGl2LCBpdGVtLCBkb25lKSB7XG4gICAgdmFyIGVycm9yO1xuICAgIGlmIChkb25lID09IG51bGwpIHtcbiAgICAgIGRvbmUgPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgICBlcnJvciA9IGZ1bmN0aW9uKGV4KSB7XG4gICAgICB2YXIgZXJyb3JFbGVtZW50O1xuICAgICAgZXJyb3JFbGVtZW50ID0gJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoJ2Vycm9yJyk7XG4gICAgICBlcnJvckVsZW1lbnQudGV4dChleC50b1N0cmluZygpKTtcbiAgICAgIHJldHVybiBkaXYuYXBwZW5kKGVycm9yRWxlbWVudCk7XG4gICAgfTtcbiAgICBkaXYuZGF0YSgncGFnZUVsZW1lbnQnLCBkaXYucGFyZW50cyhcIi5wYWdlXCIpKTtcbiAgICBkaXYuZGF0YSgnaXRlbScsIGl0ZW0pO1xuICAgIHJldHVybiBwbHVnaW4uZ2V0KGl0ZW0udHlwZSwgZnVuY3Rpb24oc2NyaXB0KSB7XG4gICAgICB2YXIgZXJyO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHNjcmlwdCA9PSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgZmluZCBwbHVnaW4gZm9yICdcIiArIGl0ZW0udHlwZSArIFwiJ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NyaXB0LmVtaXQubGVuZ3RoID4gMikge1xuICAgICAgICAgIHJldHVybiBzY3JpcHQuZW1pdChkaXYsIGl0ZW0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2NyaXB0LmJpbmQoZGl2LCBpdGVtKTtcbiAgICAgICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2NyaXB0LmVtaXQoZGl2LCBpdGVtKTtcbiAgICAgICAgICBzY3JpcHQuYmluZChkaXYsIGl0ZW0pO1xuICAgICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICBlcnIgPSBfZXJyb3I7XG4gICAgICAgIHdpa2kubG9nKCdwbHVnaW4gZXJyb3InLCBlcnIpO1xuICAgICAgICBlcnJvcihlcnIpO1xuICAgICAgICByZXR1cm4gZG9uZSgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHdpa2kucmVnaXN0ZXJQbHVnaW4gPSBmdW5jdGlvbihwbHVnaW5OYW1lLCBwbHVnaW5Gbikge1xuICAgIHJldHVybiB3aW5kb3cucGx1Z2luc1twbHVnaW5OYW1lXSA9IHBsdWdpbkZuKCQpO1xuICB9O1xuXG4gIHdpbmRvdy5wbHVnaW5zID0ge1xuICAgIHBhcmFncmFwaDoge1xuICAgICAgZW1pdDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHZhciB0ZXh0LCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZWYgPSBpdGVtLnRleHQuc3BsaXQoL1xcblxcbisvKTtcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgdGV4dCA9IF9yZWZbX2ldO1xuICAgICAgICAgIGlmICh0ZXh0Lm1hdGNoKC9cXFMvKSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChkaXYuYXBwZW5kKFwiPHA+XCIgKyAod2lraS5yZXNvbHZlTGlua3ModGV4dCkpICsgXCI8L3A+XCIpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9LFxuICAgICAgYmluZDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHJldHVybiBkaXYuZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHdpa2kudGV4dEVkaXRvcihkaXYsIGl0ZW0sIG51bGwsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGltYWdlOiB7XG4gICAgICBlbWl0OiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgICAgaXRlbS50ZXh0IHx8IChpdGVtLnRleHQgPSBpdGVtLmNhcHRpb24pO1xuICAgICAgICByZXR1cm4gZGl2LmFwcGVuZChcIjxpbWcgY2xhc3M9dGh1bWJuYWlsIHNyYz1cXFwiXCIgKyBpdGVtLnVybCArIFwiXFxcIj4gPHA+XCIgKyAod2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0KSkgKyBcIjwvcD5cIik7XG4gICAgICB9LFxuICAgICAgYmluZDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIGRpdi5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKGRpdiwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGl2LmZpbmQoJ2ltZycpLmRibGNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhpdGVtLnRleHQsIHRoaXMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGZ1dHVyZToge1xuICAgICAgZW1pdDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHZhciBpbmZvLCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIGRpdi5hcHBlbmQoXCJcIiArIGl0ZW0udGV4dCArIFwiPGJyPjxicj48YnV0dG9uIGNsYXNzPVxcXCJjcmVhdGVcXFwiPmNyZWF0ZTwvYnV0dG9uPiBuZXcgYmxhbmsgcGFnZVwiKTtcbiAgICAgICAgaWYgKCgoaW5mbyA9IHdpa2kubmVpZ2hib3Job29kW2xvY2F0aW9uLmhvc3RdKSAhPSBudWxsKSAmJiAoaW5mby5zaXRlbWFwICE9IG51bGwpKSB7XG4gICAgICAgICAgX3JlZiA9IGluZm8uc2l0ZW1hcDtcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgICAgaXRlbSA9IF9yZWZbX2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0uc2x1Zy5tYXRjaCgvLXRlbXBsYXRlJC8pKSB7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goZGl2LmFwcGVuZChcIjxicj48YnV0dG9uIGNsYXNzPVxcXCJjcmVhdGVcXFwiIGRhdGEtc2x1Zz1cIiArIGl0ZW0uc2x1ZyArIFwiPmNyZWF0ZTwvYnV0dG9uPiBmcm9tIFwiICsgKHdpa2kucmVzb2x2ZUxpbmtzKFwiW1tcIiArIGl0ZW0udGl0bGUgKyBcIl1dXCIpKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBiaW5kOiBmdW5jdGlvbihkaXYsIGl0ZW0pIHt9XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBzdGF0ZSwgd2lraSxcbiAgICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgYWN0aXZlID0gcmVxdWlyZSgnLi9hY3RpdmUnKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHN0YXRlID0ge307XG5cbiAgc3RhdGUucGFnZXNJbkRvbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkLm1ha2VBcnJheSgkKFwiLnBhZ2VcIikubWFwKGZ1bmN0aW9uKF8sIGVsKSB7XG4gICAgICByZXR1cm4gZWwuaWQ7XG4gICAgfSkpO1xuICB9O1xuXG4gIHN0YXRlLnVybFBhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGk7XG4gICAgcmV0dXJuICgoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX2ksIF9sZW4sIF9yZWYsIF9yZXN1bHRzO1xuICAgICAgX3JlZiA9ICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKTtcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pICs9IDIpIHtcbiAgICAgICAgaSA9IF9yZWZbX2ldO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKGkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH0pKCkpLnNsaWNlKDEpO1xuICB9O1xuXG4gIHN0YXRlLmxvY3NJbkRvbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkLm1ha2VBcnJheSgkKFwiLnBhZ2VcIikubWFwKGZ1bmN0aW9uKF8sIGVsKSB7XG4gICAgICByZXR1cm4gJChlbCkuZGF0YSgnc2l0ZScpIHx8ICd2aWV3JztcbiAgICB9KSk7XG4gIH07XG5cbiAgc3RhdGUudXJsTG9jcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBqLCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgX3JlZiA9ICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKS5zbGljZSgxKTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2kgKz0gMikge1xuICAgICAgaiA9IF9yZWZbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChqKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG4gIHN0YXRlLnNldFVybCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpZHgsIGxvY3MsIHBhZ2UsIHBhZ2VzLCB1cmwsIF9yZWY7XG4gICAgZG9jdW1lbnQudGl0bGUgPSAoX3JlZiA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJykpICE9IG51bGwgPyBfcmVmLnRpdGxlIDogdm9pZCAwO1xuICAgIGlmIChoaXN0b3J5ICYmIGhpc3RvcnkucHVzaFN0YXRlKSB7XG4gICAgICBsb2NzID0gc3RhdGUubG9jc0luRG9tKCk7XG4gICAgICBwYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKTtcbiAgICAgIHVybCA9ICgoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoaWR4ID0gX2kgPSAwLCBfbGVuID0gcGFnZXMubGVuZ3RoOyBfaSA8IF9sZW47IGlkeCA9ICsrX2kpIHtcbiAgICAgICAgICBwYWdlID0gcGFnZXNbaWR4XTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKFwiL1wiICsgKChsb2NzICE9IG51bGwgPyBsb2NzW2lkeF0gOiB2b2lkIDApIHx8ICd2aWV3JykgKyBcIi9cIiArIHBhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCkpLmpvaW4oJycpO1xuICAgICAgaWYgKHVybCAhPT0gJChsb2NhdGlvbikuYXR0cigncGF0aG5hbWUnKSkge1xuICAgICAgICByZXR1cm4gaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgdXJsKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgc3RhdGUuc2hvdyA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgaWR4LCBuYW1lLCBuZXdMb2NzLCBuZXdQYWdlcywgb2xkLCBvbGRMb2NzLCBvbGRQYWdlcywgcHJldmlvdXMsIF9pLCBfbGVuLCBfcmVmO1xuICAgIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpO1xuICAgIG5ld1BhZ2VzID0gc3RhdGUudXJsUGFnZXMoKTtcbiAgICBvbGRMb2NzID0gc3RhdGUubG9jc0luRG9tKCk7XG4gICAgbmV3TG9jcyA9IHN0YXRlLnVybExvY3MoKTtcbiAgICBpZiAoIWxvY2F0aW9uLnBhdGhuYW1lIHx8IGxvY2F0aW9uLnBhdGhuYW1lID09PSAnLycpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKDApO1xuICAgIGZvciAoaWR4ID0gX2kgPSAwLCBfbGVuID0gbmV3UGFnZXMubGVuZ3RoOyBfaSA8IF9sZW47IGlkeCA9ICsrX2kpIHtcbiAgICAgIG5hbWUgPSBuZXdQYWdlc1tpZHhdO1xuICAgICAgaWYgKG5hbWUgIT09IG9sZFBhZ2VzW2lkeF0pIHtcbiAgICAgICAgb2xkID0gJCgnLnBhZ2UnKS5lcShpZHgpO1xuICAgICAgICBpZiAob2xkKSB7XG4gICAgICAgICAgb2xkLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHdpa2kuY3JlYXRlUGFnZShuYW1lLCBuZXdMb2NzW2lkeF0pLmluc2VydEFmdGVyKHByZXZpb3VzKS5lYWNoKHdpa2kucmVmcmVzaCk7XG4gICAgICB9XG4gICAgICBwcmV2aW91cyA9ICQoJy5wYWdlJykuZXEoaWR4KTtcbiAgICB9XG4gICAgcHJldmlvdXMubmV4dEFsbCgpLnJlbW92ZSgpO1xuICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIHJldHVybiBkb2N1bWVudC50aXRsZSA9IChfcmVmID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKSkgIT0gbnVsbCA/IF9yZWYudGl0bGUgOiB2b2lkIDA7XG4gIH07XG5cbiAgc3RhdGUuZmlyc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZmlyc3RVcmxMb2NzLCBmaXJzdFVybFBhZ2VzLCBpZHgsIG9sZFBhZ2VzLCB1cmxQYWdlLCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgc3RhdGUuc2V0VXJsKCk7XG4gICAgZmlyc3RVcmxQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKCk7XG4gICAgZmlyc3RVcmxMb2NzID0gc3RhdGUudXJsTG9jcygpO1xuICAgIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChpZHggPSBfaSA9IDAsIF9sZW4gPSBmaXJzdFVybFBhZ2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBpZHggPSArK19pKSB7XG4gICAgICB1cmxQYWdlID0gZmlyc3RVcmxQYWdlc1tpZHhdO1xuICAgICAgaWYgKF9faW5kZXhPZi5jYWxsKG9sZFBhZ2VzLCB1cmxQYWdlKSA8IDApIHtcbiAgICAgICAgaWYgKHVybFBhZ2UgIT09ICcnKSB7XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaCh3aWtpLmNyZWF0ZVBhZ2UodXJsUGFnZSwgZmlyc3RVcmxMb2NzW2lkeF0pLmFwcGVuZFRvKCcubWFpbicpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgY3JlYXRlO1xuXG4gIGNyZWF0ZSA9IGZ1bmN0aW9uKHJldkluZGV4LCBkYXRhKSB7XG4gICAgdmFyIGFmdGVySW5kZXgsIGVkaXRJbmRleCwgaXRlbUlkLCBpdGVtcywgam91cm5hbCwgam91cm5hbEVudHJ5LCByZW1vdmVJbmRleCwgcmV2Sm91cm5hbCwgcmV2U3RvcnksIHJldlN0b3J5SWRzLCByZXZUaXRsZSwgc3RvcnlJdGVtLCBfaSwgX2osIF9rLCBfbGVuLCBfbGVuMSwgX2xlbjIsIF9yZWY7XG4gICAgam91cm5hbCA9IGRhdGEuam91cm5hbDtcbiAgICByZXZUaXRsZSA9IGRhdGEudGl0bGU7XG4gICAgcmV2U3RvcnkgPSBbXTtcbiAgICByZXZKb3VybmFsID0gam91cm5hbC5zbGljZSgwLCArKCtyZXZJbmRleCkgKyAxIHx8IDllOSk7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSByZXZKb3VybmFsLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBqb3VybmFsRW50cnkgPSByZXZKb3VybmFsW19pXTtcbiAgICAgIHJldlN0b3J5SWRzID0gcmV2U3RvcnkubWFwKGZ1bmN0aW9uKHN0b3J5SXRlbSkge1xuICAgICAgICByZXR1cm4gc3RvcnlJdGVtLmlkO1xuICAgICAgfSk7XG4gICAgICBzd2l0Y2ggKGpvdXJuYWxFbnRyeS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgICAgaWYgKGpvdXJuYWxFbnRyeS5pdGVtLnRpdGxlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldlRpdGxlID0gam91cm5hbEVudHJ5Lml0ZW0udGl0bGU7XG4gICAgICAgICAgICByZXZTdG9yeSA9IGpvdXJuYWxFbnRyeS5pdGVtLnN0b3J5IHx8IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYWRkJzpcbiAgICAgICAgICBpZiAoKGFmdGVySW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mKGpvdXJuYWxFbnRyeS5hZnRlcikpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGFmdGVySW5kZXggKyAxLCAwLCBqb3VybmFsRW50cnkuaXRlbSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldlN0b3J5LnB1c2goam91cm5hbEVudHJ5Lml0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgaWYgKChlZGl0SW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mKGpvdXJuYWxFbnRyeS5pZCkpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGVkaXRJbmRleCwgMSwgam91cm5hbEVudHJ5Lml0ZW0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXZTdG9yeS5wdXNoKGpvdXJuYWxFbnRyeS5pdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vdmUnOlxuICAgICAgICAgIGl0ZW1zID0ge307XG4gICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gcmV2U3RvcnkubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgICBzdG9yeUl0ZW0gPSByZXZTdG9yeVtfal07XG4gICAgICAgICAgICBpdGVtc1tzdG9yeUl0ZW0uaWRdID0gc3RvcnlJdGVtO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXZTdG9yeSA9IFtdO1xuICAgICAgICAgIF9yZWYgPSBqb3VybmFsRW50cnkub3JkZXI7XG4gICAgICAgICAgZm9yIChfayA9IDAsIF9sZW4yID0gX3JlZi5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICAgIGl0ZW1JZCA9IF9yZWZbX2tdO1xuICAgICAgICAgICAgaWYgKGl0ZW1zW2l0ZW1JZF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXZTdG9yeS5wdXNoKGl0ZW1zW2l0ZW1JZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVtb3ZlJzpcbiAgICAgICAgICBpZiAoKHJlbW92ZUluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZihqb3VybmFsRW50cnkuaWQpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldlN0b3J5LnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgc3Rvcnk6IHJldlN0b3J5LFxuICAgICAgam91cm5hbDogcmV2Sm91cm5hbCxcbiAgICAgIHRpdGxlOiByZXZUaXRsZVxuICAgIH07XG4gIH07XG5cbiAgZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGU7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciB1dGlsO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGpvdXJuYWxFbGVtZW50LCBhY3Rpb24pIHtcbiAgICB2YXIgYWN0aW9uRWxlbWVudCwgYWN0aW9uVGl0bGUsIGNvbnRyb2xzLCBwYWdlRWxlbWVudCwgcHJldjtcbiAgICBwYWdlRWxlbWVudCA9IGpvdXJuYWxFbGVtZW50LnBhcmVudHMoJy5wYWdlOmZpcnN0Jyk7XG4gICAgaWYgKGFjdGlvbi50eXBlID09PSAnZWRpdCcpIHtcbiAgICAgIHByZXYgPSBqb3VybmFsRWxlbWVudC5maW5kKFwiLmVkaXRbZGF0YS1pZD1cIiArIChhY3Rpb24uaWQgfHwgMCkgKyBcIl1cIik7XG4gICAgfVxuICAgIGFjdGlvblRpdGxlID0gYWN0aW9uLnR5cGU7XG4gICAgaWYgKGFjdGlvbi5kYXRlICE9IG51bGwpIHtcbiAgICAgIGFjdGlvblRpdGxlICs9IFwiIFwiICsgKHV0aWwuZm9ybWF0RWxhcHNlZFRpbWUoYWN0aW9uLmRhdGUpKTtcbiAgICB9XG4gICAgYWN0aW9uRWxlbWVudCA9ICQoXCI8YSBocmVmPVxcXCIjXFxcIiAvPiBcIikuYWRkQ2xhc3MoXCJhY3Rpb25cIikuYWRkQ2xhc3MoYWN0aW9uLnR5cGUpLnRleHQodXRpbC5zeW1ib2xzW2FjdGlvbi50eXBlXSkuYXR0cigndGl0bGUnLCBhY3Rpb25UaXRsZSkuYXR0cignZGF0YS1pZCcsIGFjdGlvbi5pZCB8fCBcIjBcIikuZGF0YSgnYWN0aW9uJywgYWN0aW9uKTtcbiAgICBjb250cm9scyA9IGpvdXJuYWxFbGVtZW50LmNoaWxkcmVuKCcuY29udHJvbC1idXR0b25zJyk7XG4gICAgaWYgKGNvbnRyb2xzLmxlbmd0aCA+IDApIHtcbiAgICAgIGFjdGlvbkVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbnRyb2xzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWN0aW9uRWxlbWVudC5hcHBlbmRUbyhqb3VybmFsRWxlbWVudCk7XG4gICAgfVxuICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ2ZvcmsnICYmIChhY3Rpb24uc2l0ZSAhPSBudWxsKSkge1xuICAgICAgcmV0dXJuIGFjdGlvbkVsZW1lbnQuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLCBcInVybCgvL1wiICsgYWN0aW9uLnNpdGUgKyBcIi9mYXZpY29uLnBuZylcIikuYXR0cihcImhyZWZcIiwgXCIvL1wiICsgYWN0aW9uLnNpdGUgKyBcIi9cIiArIChwYWdlRWxlbWVudC5hdHRyKCdpZCcpKSArIFwiLmh0bWxcIikuZGF0YShcInNpdGVcIiwgYWN0aW9uLnNpdGUpLmRhdGEoXCJzbHVnXCIsIHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykpO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFkZFRvSm91cm5hbCwgcGFnZUZyb21Mb2NhbFN0b3JhZ2UsIHBhZ2VIYW5kbGVyLCBwdXNoVG9Mb2NhbCwgcHVzaFRvU2VydmVyLCByZWN1cnNpdmVHZXQsIHJldmlzaW9uLCBzdGF0ZSwgdXRpbCwgd2lraSwgXztcblxuICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4gIHdpa2kgPSByZXF1aXJlKCcuL3dpa2knKTtcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlJyk7XG5cbiAgcmV2aXNpb24gPSByZXF1aXJlKCcuL3JldmlzaW9uJyk7XG5cbiAgYWRkVG9Kb3VybmFsID0gcmVxdWlyZSgnLi9hZGRUb0pvdXJuYWwnKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHBhZ2VIYW5kbGVyID0ge307XG5cbiAgcGFnZUZyb21Mb2NhbFN0b3JhZ2UgPSBmdW5jdGlvbihzbHVnKSB7XG4gICAgdmFyIGpzb247XG4gICAgaWYgKGpzb24gPSBsb2NhbFN0b3JhZ2Vbc2x1Z10pIHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGpzb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgfTtcblxuICByZWN1cnNpdmVHZXQgPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgdmFyIGxvY2FsQ29udGV4dCwgbG9jYWxQYWdlLCBwYWdlSW5mb3JtYXRpb24sIHJldiwgc2l0ZSwgc2x1ZywgdXJsLCB3aGVuR290dGVuLCB3aGVuTm90R290dGVuO1xuICAgIHBhZ2VJbmZvcm1hdGlvbiA9IF9hcmcucGFnZUluZm9ybWF0aW9uLCB3aGVuR290dGVuID0gX2FyZy53aGVuR290dGVuLCB3aGVuTm90R290dGVuID0gX2FyZy53aGVuTm90R290dGVuLCBsb2NhbENvbnRleHQgPSBfYXJnLmxvY2FsQ29udGV4dDtcbiAgICBzbHVnID0gcGFnZUluZm9ybWF0aW9uLnNsdWcsIHJldiA9IHBhZ2VJbmZvcm1hdGlvbi5yZXYsIHNpdGUgPSBwYWdlSW5mb3JtYXRpb24uc2l0ZTtcbiAgICBpZiAoc2l0ZSkge1xuICAgICAgbG9jYWxDb250ZXh0ID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHNpdGUgPSBsb2NhbENvbnRleHQuc2hpZnQoKTtcbiAgICB9XG4gICAgaWYgKHNpdGUgPT09ICd2aWV3Jykge1xuICAgICAgc2l0ZSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChzaXRlICE9IG51bGwpIHtcbiAgICAgIGlmIChzaXRlID09PSAnbG9jYWwnKSB7XG4gICAgICAgIGlmIChsb2NhbFBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlSW5mb3JtYXRpb24uc2x1ZykpIHtcbiAgICAgICAgICByZXR1cm4gd2hlbkdvdHRlbihsb2NhbFBhZ2UsICdsb2NhbCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB3aGVuTm90R290dGVuKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzaXRlID09PSAnb3JpZ2luJykge1xuICAgICAgICAgIHVybCA9IFwiL1wiICsgc2x1ZyArIFwiLmpzb25cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cmwgPSBcImh0dHA6Ly9cIiArIHNpdGUgKyBcIi9cIiArIHNsdWcgKyBcIi5qc29uXCI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdXJsID0gXCIvXCIgKyBzbHVnICsgXCIuanNvblwiO1xuICAgIH1cbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgIHVybDogdXJsICsgKFwiP3JhbmRvbT1cIiArICh1dGlsLnJhbmRvbUJ5dGVzKDQpKSksXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihwYWdlKSB7XG4gICAgICAgIGlmIChyZXYpIHtcbiAgICAgICAgICBwYWdlID0gcmV2aXNpb24uY3JlYXRlKHJldiwgcGFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4ocGFnZSwgc2l0ZSk7XG4gICAgICB9LFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhociwgdHlwZSwgbXNnKSB7XG4gICAgICAgIHZhciByZXBvcnQ7XG4gICAgICAgIGlmICgoeGhyLnN0YXR1cyAhPT0gNDA0KSAmJiAoeGhyLnN0YXR1cyAhPT0gMCkpIHtcbiAgICAgICAgICB3aWtpLmxvZygncGFnZUhhbmRsZXIuZ2V0IGVycm9yJywgeGhyLCB4aHIuc3RhdHVzLCB0eXBlLCBtc2cpO1xuICAgICAgICAgIHJlcG9ydCA9IHtcbiAgICAgICAgICAgICd0aXRsZSc6IFwiXCIgKyB4aHIuc3RhdHVzICsgXCIgXCIgKyBtc2csXG4gICAgICAgICAgICAnc3RvcnknOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAndHlwZSc6ICdwYXJhZ3JhcGgnLFxuICAgICAgICAgICAgICAgICdpZCc6ICc5Mjg3MzkxODcyNDMnLFxuICAgICAgICAgICAgICAgICd0ZXh0JzogXCI8cHJlPlwiICsgeGhyLnJlc3BvbnNlVGV4dFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gd2hlbkdvdHRlbihyZXBvcnQsICdsb2NhbCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhbENvbnRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiByZWN1cnNpdmVHZXQoe1xuICAgICAgICAgICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb24sXG4gICAgICAgICAgICB3aGVuR290dGVuOiB3aGVuR290dGVuLFxuICAgICAgICAgICAgd2hlbk5vdEdvdHRlbjogd2hlbk5vdEdvdHRlbixcbiAgICAgICAgICAgIGxvY2FsQ29udGV4dDogbG9jYWxDb250ZXh0XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHdoZW5Ob3RHb3R0ZW4oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHBhZ2VIYW5kbGVyLmdldCA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgbG9jYWxQYWdlLCBwYWdlSW5mb3JtYXRpb24sIHdoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW47XG4gICAgd2hlbkdvdHRlbiA9IF9hcmcud2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbiA9IF9hcmcud2hlbk5vdEdvdHRlbiwgcGFnZUluZm9ybWF0aW9uID0gX2FyZy5wYWdlSW5mb3JtYXRpb247XG4gICAgaWYgKCFwYWdlSW5mb3JtYXRpb24uc2l0ZSkge1xuICAgICAgaWYgKGxvY2FsUGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VJbmZvcm1hdGlvbi5zbHVnKSkge1xuICAgICAgICBpZiAocGFnZUluZm9ybWF0aW9uLnJldikge1xuICAgICAgICAgIGxvY2FsUGFnZSA9IHJldmlzaW9uLmNyZWF0ZShwYWdlSW5mb3JtYXRpb24ucmV2LCBsb2NhbFBhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3aGVuR290dGVuKGxvY2FsUGFnZSwgJ2xvY2FsJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghcGFnZUhhbmRsZXIuY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJ3ZpZXcnXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY3Vyc2l2ZUdldCh7XG4gICAgICBwYWdlSW5mb3JtYXRpb246IHBhZ2VJbmZvcm1hdGlvbixcbiAgICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW4sXG4gICAgICB3aGVuTm90R290dGVuOiB3aGVuTm90R290dGVuLFxuICAgICAgbG9jYWxDb250ZXh0OiBfLmNsb25lKHBhZ2VIYW5kbGVyLmNvbnRleHQpXG4gICAgfSk7XG4gIH07XG5cbiAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFtdO1xuXG4gIHB1c2hUb0xvY2FsID0gZnVuY3Rpb24ocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pIHtcbiAgICB2YXIgcGFnZSwgc2l0ZTtcbiAgICBwYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZVB1dEluZm8uc2x1Zyk7XG4gICAgaWYgKGFjdGlvbi50eXBlID09PSAnY3JlYXRlJykge1xuICAgICAgcGFnZSA9IHtcbiAgICAgICAgdGl0bGU6IGFjdGlvbi5pdGVtLnRpdGxlXG4gICAgICB9O1xuICAgIH1cbiAgICBwYWdlIHx8IChwYWdlID0gcGFnZUVsZW1lbnQuZGF0YShcImRhdGFcIikpO1xuICAgIGlmIChwYWdlLmpvdXJuYWwgPT0gbnVsbCkge1xuICAgICAgcGFnZS5qb3VybmFsID0gW107XG4gICAgfVxuICAgIGlmICgoc2l0ZSA9IGFjdGlvblsnZm9yayddKSAhPSBudWxsKSB7XG4gICAgICBwYWdlLmpvdXJuYWwgPSBwYWdlLmpvdXJuYWwuY29uY2F0KHtcbiAgICAgICAgJ3R5cGUnOiAnZm9yaycsXG4gICAgICAgICdzaXRlJzogc2l0ZVxuICAgICAgfSk7XG4gICAgICBkZWxldGUgYWN0aW9uWydmb3JrJ107XG4gICAgfVxuICAgIHBhZ2Uuam91cm5hbCA9IHBhZ2Uuam91cm5hbC5jb25jYXQoYWN0aW9uKTtcbiAgICBwYWdlLnN0b3J5ID0gJChwYWdlRWxlbWVudCkuZmluZChcIi5pdGVtXCIpLm1hcChmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkKHRoaXMpLmRhdGEoXCJpdGVtXCIpO1xuICAgIH0pLmdldCgpO1xuICAgIGxvY2FsU3RvcmFnZVtwYWdlUHV0SW5mby5zbHVnXSA9IEpTT04uc3RyaW5naWZ5KHBhZ2UpO1xuICAgIHJldHVybiBhZGRUb0pvdXJuYWwocGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwgYWN0aW9uKTtcbiAgfTtcblxuICBwdXNoVG9TZXJ2ZXIgPSBmdW5jdGlvbihwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbikge1xuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgdHlwZTogJ1BVVCcsXG4gICAgICB1cmw6IFwiL3BhZ2UvXCIgKyBwYWdlUHV0SW5mby5zbHVnICsgXCIvYWN0aW9uXCIsXG4gICAgICBkYXRhOiB7XG4gICAgICAgICdhY3Rpb24nOiBKU09OLnN0cmluZ2lmeShhY3Rpb24pXG4gICAgICB9LFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFkZFRvSm91cm5hbChwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCBhY3Rpb24pO1xuICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdmb3JrJykge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykpO1xuICAgICAgICAgIHJldHVybiBzdGF0ZS5zZXRVcmw7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oeGhyLCB0eXBlLCBtc2cpIHtcbiAgICAgICAgcmV0dXJuIHdpa2kubG9nKFwicGFnZUhhbmRsZXIucHV0IGFqYXggZXJyb3IgY2FsbGJhY2tcIiwgdHlwZSwgbXNnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBwYWdlSGFuZGxlci5wdXQgPSBmdW5jdGlvbihwYWdlRWxlbWVudCwgYWN0aW9uKSB7XG4gICAgdmFyIGNoZWNrZWRTaXRlLCBmb3JrRnJvbSwgcGFnZVB1dEluZm87XG4gICAgY2hlY2tlZFNpdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzaXRlO1xuICAgICAgc3dpdGNoIChzaXRlID0gcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpKSB7XG4gICAgICAgIGNhc2UgJ29yaWdpbic6XG4gICAgICAgIGNhc2UgJ2xvY2FsJzpcbiAgICAgICAgY2FzZSAndmlldyc6XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGNhc2UgbG9jYXRpb24uaG9zdDpcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gc2l0ZTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHBhZ2VQdXRJbmZvID0ge1xuICAgICAgc2x1ZzogcGFnZUVsZW1lbnQuYXR0cignaWQnKS5zcGxpdCgnX3JldicpWzBdLFxuICAgICAgcmV2OiBwYWdlRWxlbWVudC5hdHRyKCdpZCcpLnNwbGl0KCdfcmV2JylbMV0sXG4gICAgICBzaXRlOiBjaGVja2VkU2l0ZSgpLFxuICAgICAgbG9jYWw6IHBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdsb2NhbCcpXG4gICAgfTtcbiAgICBmb3JrRnJvbSA9IHBhZ2VQdXRJbmZvLnNpdGU7XG4gICAgd2lraS5sb2coJ3BhZ2VIYW5kbGVyLnB1dCcsIGFjdGlvbiwgcGFnZVB1dEluZm8pO1xuICAgIGlmICh3aWtpLnVzZUxvY2FsU3RvcmFnZSgpKSB7XG4gICAgICBpZiAocGFnZVB1dEluZm8uc2l0ZSAhPSBudWxsKSB7XG4gICAgICAgIHdpa2kubG9nKCdyZW1vdGUgPT4gbG9jYWwnKTtcbiAgICAgIH0gZWxzZSBpZiAoIXBhZ2VQdXRJbmZvLmxvY2FsKSB7XG4gICAgICAgIHdpa2kubG9nKCdvcmlnaW4gPT4gbG9jYWwnKTtcbiAgICAgICAgYWN0aW9uLnNpdGUgPSBmb3JrRnJvbSA9IGxvY2F0aW9uLmhvc3Q7XG4gICAgICB9XG4gICAgfVxuICAgIGFjdGlvbi5kYXRlID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICBpZiAoYWN0aW9uLnNpdGUgPT09ICdvcmlnaW4nKSB7XG4gICAgICBkZWxldGUgYWN0aW9uLnNpdGU7XG4gICAgfVxuICAgIGlmIChmb3JrRnJvbSkge1xuICAgICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgaW1nJykuYXR0cignc3JjJywgJy9mYXZpY29uLnBuZycpO1xuICAgICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgYScpLmF0dHIoJ2hyZWYnLCAnLycpO1xuICAgICAgcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScsIG51bGwpO1xuICAgICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3JlbW90ZScpO1xuICAgICAgc3RhdGUuc2V0VXJsKCk7XG4gICAgICBpZiAoYWN0aW9uLnR5cGUgIT09ICdmb3JrJykge1xuICAgICAgICBhY3Rpb24uZm9yayA9IGZvcmtGcm9tO1xuICAgICAgICBhZGRUb0pvdXJuYWwocGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwge1xuICAgICAgICAgIHR5cGU6ICdmb3JrJyxcbiAgICAgICAgICBzaXRlOiBmb3JrRnJvbSxcbiAgICAgICAgICBkYXRlOiBhY3Rpb24uZGF0ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdpa2kudXNlTG9jYWxTdG9yYWdlKCkgfHwgcGFnZVB1dEluZm8uc2l0ZSA9PT0gJ2xvY2FsJykge1xuICAgICAgcHVzaFRvTG9jYWwocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pO1xuICAgICAgcmV0dXJuIHBhZ2VFbGVtZW50LmFkZENsYXNzKFwibG9jYWxcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwdXNoVG9TZXJ2ZXIocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFkZFRvSm91cm5hbCwgYnVpbGRQYWdlSGVhZGVyLCBjcmVhdGVGYWN0b3J5LCBlbWl0SGVhZGVyLCBlbWl0VHdpbnMsIGhhbmRsZURyYWdnaW5nLCBpbml0QWRkQnV0dG9uLCBpbml0RHJhZ2dpbmcsIG5laWdoYm9yaG9vZCwgcGFnZUhhbmRsZXIsIHBsdWdpbiwgcmVmcmVzaCwgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCwgc3RhdGUsIHV0aWwsIHdpa2ksIF8sXG4gICAgX19zbGljZSA9IFtdLnNsaWNlO1xuXG4gIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIHBhZ2VIYW5kbGVyID0gcmVxdWlyZSgnLi9wYWdlSGFuZGxlcicpO1xuXG4gIHBsdWdpbiA9IHJlcXVpcmUoJy4vcGx1Z2luJyk7XG5cbiAgc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlJyk7XG5cbiAgbmVpZ2hib3Job29kID0gcmVxdWlyZSgnLi9uZWlnaGJvcmhvb2QnKTtcblxuICBhZGRUb0pvdXJuYWwgPSByZXF1aXJlKCcuL2FkZFRvSm91cm5hbCcpO1xuXG4gIHdpa2kgPSByZXF1aXJlKCcuL3dpa2knKTtcblxuICBoYW5kbGVEcmFnZ2luZyA9IGZ1bmN0aW9uKGV2dCwgdWkpIHtcbiAgICB2YXIgYWN0aW9uLCBiZWZvcmUsIGJlZm9yZUVsZW1lbnQsIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQsIGVxdWFscywgaXRlbSwgaXRlbUVsZW1lbnQsIG1vdmVGcm9tUGFnZSwgbW92ZVRvUGFnZSwgbW92ZVdpdGhpblBhZ2UsIG9yZGVyLCBzb3VyY2VQYWdlRWxlbWVudCwgc291cmNlU2l0ZSwgdGhpc1BhZ2VFbGVtZW50O1xuICAgIGl0ZW1FbGVtZW50ID0gdWkuaXRlbTtcbiAgICBpdGVtID0gd2lraS5nZXRJdGVtKGl0ZW1FbGVtZW50KTtcbiAgICB0aGlzUGFnZUVsZW1lbnQgPSAkKHRoaXMpLnBhcmVudHMoJy5wYWdlOmZpcnN0Jyk7XG4gICAgc291cmNlUGFnZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5kYXRhKCdwYWdlRWxlbWVudCcpO1xuICAgIHNvdXJjZVNpdGUgPSBzb3VyY2VQYWdlRWxlbWVudC5kYXRhKCdzaXRlJyk7XG4gICAgZGVzdGluYXRpb25QYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnBhcmVudHMoJy5wYWdlOmZpcnN0Jyk7XG4gICAgZXF1YWxzID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgcmV0dXJuIGEgJiYgYiAmJiBhLmdldCgwKSA9PT0gYi5nZXQoMCk7XG4gICAgfTtcbiAgICBtb3ZlV2l0aGluUGFnZSA9ICFzb3VyY2VQYWdlRWxlbWVudCB8fCBlcXVhbHMoc291cmNlUGFnZUVsZW1lbnQsIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQpO1xuICAgIG1vdmVGcm9tUGFnZSA9ICFtb3ZlV2l0aGluUGFnZSAmJiBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBzb3VyY2VQYWdlRWxlbWVudCk7XG4gICAgbW92ZVRvUGFnZSA9ICFtb3ZlV2l0aGluUGFnZSAmJiBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KTtcbiAgICBpZiAobW92ZUZyb21QYWdlKSB7XG4gICAgICBpZiAoc291cmNlUGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2dob3N0JykgfHwgc291cmNlUGFnZUVsZW1lbnQuYXR0cignaWQnKSA9PT0gZGVzdGluYXRpb25QYWdlRWxlbWVudC5hdHRyKCdpZCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgYWN0aW9uID0gbW92ZVdpdGhpblBhZ2UgPyAob3JkZXIgPSAkKHRoaXMpLmNoaWxkcmVuKCkubWFwKGZ1bmN0aW9uKF8sIHZhbHVlKSB7XG4gICAgICByZXR1cm4gJCh2YWx1ZSkuYXR0cignZGF0YS1pZCcpO1xuICAgIH0pLmdldCgpLCB7XG4gICAgICB0eXBlOiAnbW92ZScsXG4gICAgICBvcmRlcjogb3JkZXJcbiAgICB9KSA6IG1vdmVGcm9tUGFnZSA/ICh3aWtpLmxvZygnZHJhZyBmcm9tJywgc291cmNlUGFnZUVsZW1lbnQuZmluZCgnaDEnKS50ZXh0KCkpLCB7XG4gICAgICB0eXBlOiAncmVtb3ZlJ1xuICAgIH0pIDogbW92ZVRvUGFnZSA/IChpdGVtRWxlbWVudC5kYXRhKCdwYWdlRWxlbWVudCcsIHRoaXNQYWdlRWxlbWVudCksIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpLCBiZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudCksIHtcbiAgICAgIHR5cGU6ICdhZGQnLFxuICAgICAgaXRlbTogaXRlbSxcbiAgICAgIGFmdGVyOiBiZWZvcmUgIT0gbnVsbCA/IGJlZm9yZS5pZCA6IHZvaWQgMFxuICAgIH0pIDogdm9pZCAwO1xuICAgIGFjdGlvbi5pZCA9IGl0ZW0uaWQ7XG4gICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dCh0aGlzUGFnZUVsZW1lbnQsIGFjdGlvbik7XG4gIH07XG5cbiAgaW5pdERyYWdnaW5nID0gZnVuY3Rpb24oJHBhZ2UpIHtcbiAgICB2YXIgJHN0b3J5O1xuICAgICRzdG9yeSA9ICRwYWdlLmZpbmQoJy5zdG9yeScpO1xuICAgIHJldHVybiAkc3Rvcnkuc29ydGFibGUoe1xuICAgICAgY29ubmVjdFdpdGg6ICcucGFnZSAuc3RvcnknXG4gICAgfSkub24oXCJzb3J0dXBkYXRlXCIsIGhhbmRsZURyYWdnaW5nKTtcbiAgfTtcblxuICBpbml0QWRkQnV0dG9uID0gZnVuY3Rpb24oJHBhZ2UpIHtcbiAgICByZXR1cm4gJHBhZ2UuZmluZChcIi5hZGQtZmFjdG9yeVwiKS5saXZlKFwiY2xpY2tcIiwgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICBpZiAoJHBhZ2UuaGFzQ2xhc3MoJ2dob3N0JykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm4gY3JlYXRlRmFjdG9yeSgkcGFnZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgY3JlYXRlRmFjdG9yeSA9IGZ1bmN0aW9uKCRwYWdlKSB7XG4gICAgdmFyIGJlZm9yZSwgYmVmb3JlRWxlbWVudCwgaXRlbSwgaXRlbUVsZW1lbnQ7XG4gICAgaXRlbSA9IHtcbiAgICAgIHR5cGU6IFwiZmFjdG9yeVwiLFxuICAgICAgaWQ6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICB9O1xuICAgIGl0ZW1FbGVtZW50ID0gJChcIjxkaXYgLz5cIiwge1xuICAgICAgXCJjbGFzc1wiOiBcIml0ZW0gZmFjdG9yeVwiXG4gICAgfSkuZGF0YSgnaXRlbScsIGl0ZW0pLmF0dHIoJ2RhdGEtaWQnLCBpdGVtLmlkKTtcbiAgICBpdGVtRWxlbWVudC5kYXRhKCdwYWdlRWxlbWVudCcsICRwYWdlKTtcbiAgICAkcGFnZS5maW5kKFwiLnN0b3J5XCIpLmFwcGVuZChpdGVtRWxlbWVudCk7XG4gICAgcGx1Z2luW1wiZG9cIl0oaXRlbUVsZW1lbnQsIGl0ZW0pO1xuICAgIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpO1xuICAgIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KTtcbiAgICByZXR1cm4gcGFnZUhhbmRsZXIucHV0KCRwYWdlLCB7XG4gICAgICBpdGVtOiBpdGVtLFxuICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICB0eXBlOiBcImFkZFwiLFxuICAgICAgYWZ0ZXI6IGJlZm9yZSAhPSBudWxsID8gYmVmb3JlLmlkIDogdm9pZCAwXG4gICAgfSk7XG4gIH07XG5cbiAgYnVpbGRQYWdlSGVhZGVyID0gZnVuY3Rpb24oX2FyZykge1xuICAgIHZhciBmYXZpY29uX3NyYywgaGVhZGVyX2hyZWYsIHBhZ2UsIHRvb2x0aXA7XG4gICAgcGFnZSA9IF9hcmcucGFnZSwgdG9vbHRpcCA9IF9hcmcudG9vbHRpcCwgaGVhZGVyX2hyZWYgPSBfYXJnLmhlYWRlcl9ocmVmLCBmYXZpY29uX3NyYyA9IF9hcmcuZmF2aWNvbl9zcmM7XG4gICAgaWYgKHBhZ2UucGx1Z2luKSB7XG4gICAgICB0b29sdGlwICs9IFwiXFxuXCIgKyBwYWdlLnBsdWdpbiArIFwiIHBsdWdpblwiO1xuICAgIH1cbiAgICByZXR1cm4gXCI8aDEgdGl0bGU9XFxcIlwiICsgdG9vbHRpcCArIFwiXFxcIj48YSBocmVmPVxcXCJcIiArIGhlYWRlcl9ocmVmICsgXCJcXFwiPjxpbWcgc3JjPVxcXCJcIiArIGZhdmljb25fc3JjICsgXCJcXFwiIGhlaWdodD1cXFwiMzJweFxcXCIgY2xhc3M9XFxcImZhdmljb25cXFwiPjwvYT4gXCIgKyBwYWdlLnRpdGxlICsgXCI8L2gxPlwiO1xuICB9O1xuXG4gIGVtaXRIZWFkZXIgPSBmdW5jdGlvbigkaGVhZGVyLCAkcGFnZSwgcGFnZSkge1xuICAgIHZhciBkYXRlLCBoZWFkZXIsIGlzUmVtb3RlUGFnZSwgcGFnZUhlYWRlciwgcmV2LCBzaXRlLCB2aWV3SGVyZTtcbiAgICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpO1xuICAgIGlzUmVtb3RlUGFnZSA9IChzaXRlICE9IG51bGwpICYmIHNpdGUgIT09ICdsb2NhbCcgJiYgc2l0ZSAhPT0gJ29yaWdpbicgJiYgc2l0ZSAhPT0gJ3ZpZXcnO1xuICAgIGhlYWRlciA9ICcnO1xuICAgIHZpZXdIZXJlID0gd2lraS5hc1NsdWcocGFnZS50aXRsZSkgPT09ICd3ZWxjb21lLXZpc2l0b3JzJyA/IFwiXCIgOiBcIi92aWV3L1wiICsgKHdpa2kuYXNTbHVnKHBhZ2UudGl0bGUpKTtcbiAgICBwYWdlSGVhZGVyID0gaXNSZW1vdGVQYWdlID8gYnVpbGRQYWdlSGVhZGVyKHtcbiAgICAgIHRvb2x0aXA6IHNpdGUsXG4gICAgICBoZWFkZXJfaHJlZjogXCIvL1wiICsgc2l0ZSArIFwiL3ZpZXcvd2VsY29tZS12aXNpdG9yc1wiICsgdmlld0hlcmUsXG4gICAgICBmYXZpY29uX3NyYzogXCJodHRwOi8vXCIgKyBzaXRlICsgXCIvZmF2aWNvbi5wbmdcIixcbiAgICAgIHBhZ2U6IHBhZ2VcbiAgICB9KSA6IGJ1aWxkUGFnZUhlYWRlcih7XG4gICAgICB0b29sdGlwOiBsb2NhdGlvbi5ob3N0LFxuICAgICAgaGVhZGVyX2hyZWY6IFwiL3ZpZXcvd2VsY29tZS12aXNpdG9yc1wiICsgdmlld0hlcmUsXG4gICAgICBmYXZpY29uX3NyYzogXCIvZmF2aWNvbi5wbmdcIixcbiAgICAgIHBhZ2U6IHBhZ2VcbiAgICB9KTtcbiAgICAkaGVhZGVyLmFwcGVuZChwYWdlSGVhZGVyKTtcbiAgICBpZiAoIWlzUmVtb3RlUGFnZSkge1xuICAgICAgJCgnaW1nLmZhdmljb24nLCAkcGFnZSkuZXJyb3IoZnVuY3Rpb24oZSkge1xuICAgICAgICByZXR1cm4gcGx1Z2luLmdldCgnZmF2aWNvbicsIGZ1bmN0aW9uKGZhdmljb24pIHtcbiAgICAgICAgICByZXR1cm4gZmF2aWNvbi5jcmVhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCRwYWdlLmF0dHIoJ2lkJykubWF0Y2goL19yZXYvKSkge1xuICAgICAgcmV2ID0gcGFnZS5qb3VybmFsLmxlbmd0aCAtIDE7XG4gICAgICBkYXRlID0gcGFnZS5qb3VybmFsW3Jldl0uZGF0ZTtcbiAgICAgICRwYWdlLmFkZENsYXNzKCdnaG9zdCcpLmRhdGEoJ3JldicsIHJldik7XG4gICAgICByZXR1cm4gJGhlYWRlci5hcHBlbmQoJChcIjxoMiBjbGFzcz1cXFwicmV2aXNpb25cXFwiPlxcbiAgPHNwYW4+XFxuICAgIFwiICsgKGRhdGUgIT0gbnVsbCA/IHV0aWwuZm9ybWF0RGF0ZShkYXRlKSA6IFwiUmV2aXNpb24gXCIgKyByZXYpICsgXCJcXG4gIDwvc3Bhbj5cXG48L2gyPlwiKSk7XG4gICAgfVxuICB9O1xuXG4gIGVtaXRUd2lucyA9IHdpa2kuZW1pdFR3aW5zID0gZnVuY3Rpb24oJHBhZ2UpIHtcbiAgICB2YXIgYWN0aW9ucywgYmluLCBiaW5zLCBmbGFncywgaSwgaW5mbywgaXRlbSwgbGVnZW5kLCBwYWdlLCByZW1vdGVTaXRlLCBzaXRlLCBzbHVnLCB0d2lucywgdmlld2luZywgX2ksIF9sZW4sIF9yZWYsIF9yZWYxLCBfcmVmMiwgX3JlZjM7XG4gICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKTtcbiAgICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpIHx8IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgIGlmIChzaXRlID09PSAndmlldycgfHwgc2l0ZSA9PT0gJ29yaWdpbicpIHtcbiAgICAgIHNpdGUgPSB3aW5kb3cubG9jYXRpb24uaG9zdDtcbiAgICB9XG4gICAgc2x1ZyA9IHdpa2kuYXNTbHVnKHBhZ2UudGl0bGUpO1xuICAgIGlmICgoKGFjdGlvbnMgPSAoX3JlZiA9IHBhZ2Uuam91cm5hbCkgIT0gbnVsbCA/IF9yZWYubGVuZ3RoIDogdm9pZCAwKSAhPSBudWxsKSAmJiAoKHZpZXdpbmcgPSAoX3JlZjEgPSBwYWdlLmpvdXJuYWxbYWN0aW9ucyAtIDFdKSAhPSBudWxsID8gX3JlZjEuZGF0ZSA6IHZvaWQgMCkgIT0gbnVsbCkpIHtcbiAgICAgIHZpZXdpbmcgPSBNYXRoLmZsb29yKHZpZXdpbmcgLyAxMDAwKSAqIDEwMDA7XG4gICAgICBiaW5zID0ge1xuICAgICAgICBuZXdlcjogW10sXG4gICAgICAgIHNhbWU6IFtdLFxuICAgICAgICBvbGRlcjogW11cbiAgICAgIH07XG4gICAgICBfcmVmMiA9IHdpa2kubmVpZ2hib3Job29kO1xuICAgICAgZm9yIChyZW1vdGVTaXRlIGluIF9yZWYyKSB7XG4gICAgICAgIGluZm8gPSBfcmVmMltyZW1vdGVTaXRlXTtcbiAgICAgICAgaWYgKHJlbW90ZVNpdGUgIT09IHNpdGUgJiYgKGluZm8uc2l0ZW1hcCAhPSBudWxsKSkge1xuICAgICAgICAgIF9yZWYzID0gaW5mby5zaXRlbWFwO1xuICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBfcmVmM1tfaV07XG4gICAgICAgICAgICBpZiAoaXRlbS5zbHVnID09PSBzbHVnKSB7XG4gICAgICAgICAgICAgIGJpbiA9IGl0ZW0uZGF0ZSA+IHZpZXdpbmcgPyBiaW5zLm5ld2VyIDogaXRlbS5kYXRlIDwgdmlld2luZyA/IGJpbnMub2xkZXIgOiBiaW5zLnNhbWU7XG4gICAgICAgICAgICAgIGJpbi5wdXNoKHtcbiAgICAgICAgICAgICAgICByZW1vdGVTaXRlOiByZW1vdGVTaXRlLFxuICAgICAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0d2lucyA9IFtdO1xuICAgICAgZm9yIChsZWdlbmQgaW4gYmlucykge1xuICAgICAgICBiaW4gPSBiaW5zW2xlZ2VuZF07XG4gICAgICAgIGlmICghYmluLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJpbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gYS5pdGVtLmRhdGUgPCBiLml0ZW0uZGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZsYWdzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBfaiwgX2xlbjEsIF9yZWY0LCBfcmVzdWx0cztcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoaSA9IF9qID0gMCwgX2xlbjEgPSBiaW4ubGVuZ3RoOyBfaiA8IF9sZW4xOyBpID0gKytfaikge1xuICAgICAgICAgICAgX3JlZjQgPSBiaW5baV0sIHJlbW90ZVNpdGUgPSBfcmVmNC5yZW1vdGVTaXRlLCBpdGVtID0gX3JlZjQuaXRlbTtcbiAgICAgICAgICAgIGlmIChpID49IDgpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKFwiPGltZyBjbGFzcz1cXFwicmVtb3RlXFxcIlxcbnNyYz1cXFwiaHR0cDovL1wiICsgcmVtb3RlU2l0ZSArIFwiL2Zhdmljb24ucG5nXFxcIlxcbmRhdGEtc2x1Zz1cXFwiXCIgKyBzbHVnICsgXCJcXFwiXFxuZGF0YS1zaXRlPVxcXCJcIiArIHJlbW90ZVNpdGUgKyBcIlxcXCJcXG50aXRsZT1cXFwiXCIgKyByZW1vdGVTaXRlICsgXCJcXFwiPlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgICB9KSgpO1xuICAgICAgICB0d2lucy5wdXNoKFwiXCIgKyAoZmxhZ3Muam9pbignJm5ic3A7JykpICsgXCIgXCIgKyBsZWdlbmQpO1xuICAgICAgfVxuICAgICAgaWYgKHR3aW5zKSB7XG4gICAgICAgIHJldHVybiAkcGFnZS5maW5kKCcudHdpbnMnKS5odG1sKFwiPHA+XCIgKyAodHdpbnMuam9pbihcIiwgXCIpKSArIFwiPC9wPlwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCA9IGZ1bmN0aW9uKHBhZ2VEYXRhLCAkcGFnZSwgc2l0ZUZvdW5kKSB7XG4gICAgdmFyICRmb290ZXIsICRoZWFkZXIsICRqb3VybmFsLCAkc3RvcnksICR0d2lucywgYWN0aW9uLCBhZGRDb250ZXh0LCBjb250ZXh0LCBlbWl0SXRlbSwgcGFnZSwgc2l0ZSwgc2x1ZywgX2ksIF9qLCBfbGVuLCBfbGVuMSwgX3JlZiwgX3JlZjEsIF9yZWYyO1xuICAgIHBhZ2UgPSAkLmV4dGVuZCh1dGlsLmVtcHR5UGFnZSgpLCBwYWdlRGF0YSk7XG4gICAgJHBhZ2UuZGF0YShcImRhdGFcIiwgcGFnZSk7XG4gICAgc2x1ZyA9ICRwYWdlLmF0dHIoJ2lkJyk7XG4gICAgc2l0ZSA9ICRwYWdlLmRhdGEoJ3NpdGUnKTtcbiAgICBjb250ZXh0ID0gWyd2aWV3J107XG4gICAgaWYgKHNpdGUgIT0gbnVsbCkge1xuICAgICAgY29udGV4dC5wdXNoKHNpdGUpO1xuICAgIH1cbiAgICBhZGRDb250ZXh0ID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgICAgaWYgKChzaXRlICE9IG51bGwpICYmICFfLmluY2x1ZGUoY29udGV4dCwgc2l0ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQucHVzaChzaXRlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIF9yZWYgPSBwYWdlLmpvdXJuYWwuc2xpY2UoMCkucmV2ZXJzZSgpO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgYWN0aW9uID0gX3JlZltfaV07XG4gICAgICBhZGRDb250ZXh0KGFjdGlvbi5zaXRlKTtcbiAgICB9XG4gICAgd2lraS5yZXNvbHV0aW9uQ29udGV4dCA9IGNvbnRleHQ7XG4gICAgJHBhZ2UuZW1wdHkoKTtcbiAgICBfcmVmMSA9IFsndHdpbnMnLCAnaGVhZGVyJywgJ3N0b3J5JywgJ2pvdXJuYWwnLCAnZm9vdGVyJ10ubWFwKGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICAgICAgcmV0dXJuICQoXCI8ZGl2IC8+XCIpLmFkZENsYXNzKGNsYXNzTmFtZSkuYXBwZW5kVG8oJHBhZ2UpO1xuICAgIH0pLCAkdHdpbnMgPSBfcmVmMVswXSwgJGhlYWRlciA9IF9yZWYxWzFdLCAkc3RvcnkgPSBfcmVmMVsyXSwgJGpvdXJuYWwgPSBfcmVmMVszXSwgJGZvb3RlciA9IF9yZWYxWzRdO1xuICAgIGVtaXRIZWFkZXIoJGhlYWRlciwgJHBhZ2UsIHBhZ2UpO1xuICAgIGVtaXRJdGVtID0gZnVuY3Rpb24oaSkge1xuICAgICAgdmFyICRpdGVtLCBpdGVtO1xuICAgICAgaWYgKGkgPj0gcGFnZS5zdG9yeS5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaXRlbSA9IHBhZ2Uuc3RvcnlbaV07XG4gICAgICBpZiAoKGl0ZW0gIT0gbnVsbCA/IGl0ZW0udHlwZSA6IHZvaWQgMCkgJiYgKGl0ZW0gIT0gbnVsbCA/IGl0ZW0uaWQgOiB2b2lkIDApKSB7XG4gICAgICAgICRpdGVtID0gJChcIjxkaXYgY2xhc3M9XFxcIml0ZW0gXCIgKyBpdGVtLnR5cGUgKyBcIlxcXCIgZGF0YS1pZD1cXFwiXCIgKyBpdGVtLmlkICsgXCJcXFwiPlwiKTtcbiAgICAgICAgJHN0b3J5LmFwcGVuZCgkaXRlbSk7XG4gICAgICAgIHJldHVybiBwbHVnaW5bXCJkb1wiXSgkaXRlbSwgaXRlbSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGVtaXRJdGVtKGkgKyAxKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkc3RvcnkuYXBwZW5kKCQoXCI8ZGl2PjxwIGNsYXNzPVxcXCJlcnJvclxcXCI+Q2FuJ3QgbWFrZSBzZW5zZSBvZiBzdG9yeVtcIiArIGkgKyBcIl08L3A+PC9kaXY+XCIpKTtcbiAgICAgICAgcmV0dXJuIGVtaXRJdGVtKGkgKyAxKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGVtaXRJdGVtKDApO1xuICAgIF9yZWYyID0gcGFnZS5qb3VybmFsO1xuICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgYWN0aW9uID0gX3JlZjJbX2pdO1xuICAgICAgYWRkVG9Kb3VybmFsKCRqb3VybmFsLCBhY3Rpb24pO1xuICAgIH1cbiAgICBlbWl0VHdpbnMoJHBhZ2UpO1xuICAgICRqb3VybmFsLmFwcGVuZChcIjxkaXYgY2xhc3M9XFxcImNvbnRyb2wtYnV0dG9uc1xcXCI+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGZvcmstcGFnZVxcXCIgdGl0bGU9XFxcImZvcmsgdGhpcyBwYWdlXFxcIj5cIiArIHV0aWwuc3ltYm9sc1snZm9yayddICsgXCI8L2E+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGFkZC1mYWN0b3J5XFxcIiB0aXRsZT1cXFwiYWRkIHBhcmFncmFwaFxcXCI+XCIgKyB1dGlsLnN5bWJvbHNbJ2FkZCddICsgXCI8L2E+XFxuPC9kaXY+XCIpO1xuICAgIHJldHVybiAkZm9vdGVyLmFwcGVuZChcIjxhIGlkPVxcXCJsaWNlbnNlXFxcIiBocmVmPVxcXCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvXFxcIj5DQyBCWS1TQSAzLjA8L2E+IC5cXG48YSBjbGFzcz1cXFwic2hvdy1wYWdlLXNvdXJjZVxcXCIgaHJlZj1cXFwiL1wiICsgc2x1ZyArIFwiLmpzb24/cmFuZG9tPVwiICsgKHV0aWwucmFuZG9tQnl0ZXMoNCkpICsgXCJcXFwiIHRpdGxlPVxcXCJzb3VyY2VcXFwiPkpTT048L2E+IC5cXG48YSBocmVmPSBcXFwiLy9cIiArIChzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdCkgKyBcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIj5cIiArIChzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdCkgKyBcIjwvYT5cIik7XG4gIH07XG5cbiAgd2lraS5idWlsZFBhZ2UgPSBmdW5jdGlvbihkYXRhLCBzaXRlRm91bmQsICRwYWdlKSB7XG4gICAgaWYgKHNpdGVGb3VuZCA9PT0gJ2xvY2FsJykge1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2xvY2FsJyk7XG4gICAgfSBlbHNlIGlmIChzaXRlRm91bmQpIHtcbiAgICAgIGlmIChzaXRlRm91bmQgPT09IHdpbmRvdy5sb2NhdGlvbi5ob3N0KSB7XG4gICAgICAgIHNpdGVGb3VuZCA9ICdvcmlnaW4nO1xuICAgICAgfVxuICAgICAgaWYgKHNpdGVGb3VuZCAhPT0gJ3ZpZXcnICYmIHNpdGVGb3VuZCAhPT0gJ29yaWdpbicpIHtcbiAgICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ3JlbW90ZScpO1xuICAgICAgfVxuICAgICAgJHBhZ2UuZGF0YSgnc2l0ZScsIHNpdGVGb3VuZCk7XG4gICAgfVxuICAgIGlmIChkYXRhLnBsdWdpbiAhPSBudWxsKSB7XG4gICAgICAkcGFnZS5hZGRDbGFzcygncGx1Z2luJyk7XG4gICAgfVxuICAgIHJlbmRlclBhZ2VJbnRvUGFnZUVsZW1lbnQoZGF0YSwgJHBhZ2UsIHNpdGVGb3VuZCk7XG4gICAgc3RhdGUuc2V0VXJsKCk7XG4gICAgaW5pdERyYWdnaW5nKCRwYWdlKTtcbiAgICBpbml0QWRkQnV0dG9uKCRwYWdlKTtcbiAgICByZXR1cm4gJHBhZ2U7XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSByZWZyZXNoID0gd2lraS5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyICRwYWdlLCBjcmVhdGVHaG9zdFBhZ2UsIHBhZ2VJbmZvcm1hdGlvbiwgcmVnaXN0ZXJOZWlnaGJvcnMsIHJldiwgc2x1Zywgd2hlbkdvdHRlbiwgX3JlZjtcbiAgICAkcGFnZSA9ICQodGhpcyk7XG4gICAgX3JlZiA9ICRwYWdlLmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKSwgc2x1ZyA9IF9yZWZbMF0sIHJldiA9IF9yZWZbMV07XG4gICAgcGFnZUluZm9ybWF0aW9uID0ge1xuICAgICAgc2x1Zzogc2x1ZyxcbiAgICAgIHJldjogcmV2LFxuICAgICAgc2l0ZTogJHBhZ2UuZGF0YSgnc2l0ZScpXG4gICAgfTtcbiAgICBjcmVhdGVHaG9zdFBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBoZWFkaW5nLCBoaXRzLCBpbmZvLCBwYWdlLCByZXN1bHQsIHNpdGUsIHRpdGxlLCBfcmVmMSwgX3JlZjI7XG4gICAgICB0aXRsZSA9ICQoXCJhW2hyZWY9XFxcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIl06bGFzdFwiKS50ZXh0KCkgfHwgc2x1ZztcbiAgICAgIHBhZ2UgPSB7XG4gICAgICAgICd0aXRsZSc6IHRpdGxlLFxuICAgICAgICAnc3RvcnknOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgJ2lkJzogdXRpbC5yYW5kb21CeXRlcyg4KSxcbiAgICAgICAgICAgICd0eXBlJzogJ2Z1dHVyZScsXG4gICAgICAgICAgICAndGV4dCc6ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UuJyxcbiAgICAgICAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9O1xuICAgICAgaGVhZGluZyA9IHtcbiAgICAgICAgJ3R5cGUnOiAncGFyYWdyYXBoJyxcbiAgICAgICAgJ2lkJzogdXRpbC5yYW5kb21CeXRlcyg4KSxcbiAgICAgICAgJ3RleHQnOiBcIldlIGRpZCBmaW5kIHRoZSBwYWdlIGluIHlvdXIgY3VycmVudCBuZWlnaGJvcmhvb2QuXCJcbiAgICAgIH07XG4gICAgICBoaXRzID0gW107XG4gICAgICBfcmVmMSA9IHdpa2kubmVpZ2hib3Job29kO1xuICAgICAgZm9yIChzaXRlIGluIF9yZWYxKSB7XG4gICAgICAgIGluZm8gPSBfcmVmMVtzaXRlXTtcbiAgICAgICAgaWYgKGluZm8uc2l0ZW1hcCAhPSBudWxsKSB7XG4gICAgICAgICAgcmVzdWx0ID0gXy5maW5kKGluZm8uc2l0ZW1hcCwgZnVuY3Rpb24oZWFjaCkge1xuICAgICAgICAgICAgcmV0dXJuIGVhY2guc2x1ZyA9PT0gc2x1ZztcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAocmVzdWx0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGhpdHMucHVzaCh7XG4gICAgICAgICAgICAgIFwidHlwZVwiOiBcInJlZmVyZW5jZVwiLFxuICAgICAgICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOCksXG4gICAgICAgICAgICAgIFwic2l0ZVwiOiBzaXRlLFxuICAgICAgICAgICAgICBcInNsdWdcIjogc2x1ZyxcbiAgICAgICAgICAgICAgXCJ0aXRsZVwiOiByZXN1bHQudGl0bGUgfHwgc2x1ZyxcbiAgICAgICAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5zeW5vcHNpcyB8fCAnJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaGl0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIChfcmVmMiA9IHBhZ2Uuc3RvcnkpLnB1c2guYXBwbHkoX3JlZjIsIFtoZWFkaW5nXS5jb25jYXQoX19zbGljZS5jYWxsKGhpdHMpKSk7XG4gICAgICAgIHBhZ2Uuc3RvcnlbMF0udGV4dCA9ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UgaW4gdGhlIGV4cGVjdGVkIGNvbnRleHQuJztcbiAgICAgIH1cbiAgICAgIHJldHVybiB3aWtpLmJ1aWxkUGFnZShwYWdlLCB2b2lkIDAsICRwYWdlKS5hZGRDbGFzcygnZ2hvc3QnKTtcbiAgICB9O1xuICAgIHJlZ2lzdGVyTmVpZ2hib3JzID0gZnVuY3Rpb24oZGF0YSwgc2l0ZSkge1xuICAgICAgdmFyIGFjdGlvbiwgaXRlbSwgX2ksIF9qLCBfbGVuLCBfbGVuMSwgX3JlZjEsIF9yZWYyLCBfcmVzdWx0cztcbiAgICAgIGlmIChfLmluY2x1ZGUoWydsb2NhbCcsICdvcmlnaW4nLCAndmlldycsIG51bGwsIHZvaWQgMF0sIHNpdGUpKSB7XG4gICAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yKGxvY2F0aW9uLmhvc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3Ioc2l0ZSk7XG4gICAgICB9XG4gICAgICBfcmVmMSA9IGRhdGEuc3RvcnkgfHwgW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBfcmVmMVtfaV07XG4gICAgICAgIGlmIChpdGVtLnNpdGUgIT0gbnVsbCkge1xuICAgICAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yKGl0ZW0uc2l0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF9yZWYyID0gZGF0YS5qb3VybmFsIHx8IFtdO1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYyLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBhY3Rpb24gPSBfcmVmMltfal07XG4gICAgICAgIGlmIChhY3Rpb24uc2l0ZSAhPSBudWxsKSB7XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaChuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvcihhY3Rpb24uc2l0ZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH07XG4gICAgd2hlbkdvdHRlbiA9IGZ1bmN0aW9uKGRhdGEsIHNpdGVGb3VuZCkge1xuICAgICAgd2lraS5idWlsZFBhZ2UoZGF0YSwgc2l0ZUZvdW5kLCAkcGFnZSk7XG4gICAgICByZXR1cm4gcmVnaXN0ZXJOZWlnaGJvcnMoZGF0YSwgc2l0ZUZvdW5kKTtcbiAgICB9O1xuICAgIHJldHVybiBwYWdlSGFuZGxlci5nZXQoe1xuICAgICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlbixcbiAgICAgIHdoZW5Ob3RHb3R0ZW46IGNyZWF0ZUdob3N0UGFnZSxcbiAgICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uXG4gICAgfSk7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKXsvLyAgICAgVW5kZXJzY29yZS5qcyAxLjUuMlxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS41LjInO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gdm9pZCAwIDogW107XG4gICAgcmV0dXJuIF9bZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10ob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSB2YWx1ZVtrZXldKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLndoZXJlKG9iaiwgYXR0cnMsIHRydWUpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlIFtXZWJLaXQgQnVnIDgwNzk3XShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTcpXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID4gcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IEluZmluaXR5LCB2YWx1ZTogSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA8IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXksIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGUgXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMiB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWUgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiA9PSBudWxsKSB8fCBndWFyZCA/IGFycmF5WzBdIDogc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBpZiAoc2hhbGxvdyAmJiBfLmV2ZXJ5KGlucHV0LCBfLmlzQXJyYXkpKSB7XG4gICAgICByZXR1cm4gY29uY2F0LmFwcGx5KG91dHB1dCwgaW5wdXQpO1xuICAgIH1cbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmd1bWVudHMsIFwibGVuZ3RoXCIpLmNvbmNhdCgwKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmd1bWVudHMsICcnICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbmd0aCkge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIGN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgY3RvcjtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcihcImJpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXNcIik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsYXN0ID0gKG5ldyBEYXRlKCkpIC0gdGltZXN0YW1wO1xuICAgICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdm9pZCAwKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuXG59KSgpIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBjcmVhdGVTZWFyY2gsIHV0aWwsIHdpa2k7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZScpO1xuXG4gIGNyZWF0ZVNlYXJjaCA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgbmVpZ2hib3Job29kLCBwZXJmb3JtU2VhcmNoO1xuICAgIG5laWdoYm9yaG9vZCA9IF9hcmcubmVpZ2hib3Job29kO1xuICAgIHBlcmZvcm1TZWFyY2ggPSBmdW5jdGlvbihzZWFyY2hRdWVyeSkge1xuICAgICAgdmFyICRzZWFyY2hSZXN1bHRQYWdlLCBleHBsYW5hdG9yeVBhcmEsIHJlc3VsdCwgc2VhcmNoUmVzdWx0UGFnZURhdGEsIHNlYXJjaFJlc3VsdFJlZmVyZW5jZXMsIHNlYXJjaFJlc3VsdHMsIHRhbGx5O1xuICAgICAgc2VhcmNoUmVzdWx0cyA9IG5laWdoYm9yaG9vZC5zZWFyY2goc2VhcmNoUXVlcnkpO1xuICAgICAgdGFsbHkgPSBzZWFyY2hSZXN1bHRzLnRhbGx5O1xuICAgICAgZXhwbGFuYXRvcnlQYXJhID0ge1xuICAgICAgICB0eXBlOiAncGFyYWdyYXBoJyxcbiAgICAgICAgaWQ6IHV0aWwucmFuZG9tQnl0ZXMoOCksXG4gICAgICAgIHRleHQ6IFwiU3RyaW5nICdcIiArIHNlYXJjaFF1ZXJ5ICsgXCInIGZvdW5kIG9uIFwiICsgKHRhbGx5LmZpbmRzIHx8ICdub25lJykgKyBcIiBvZiBcIiArICh0YWxseS5wYWdlcyB8fCAnbm8nKSArIFwiIHBhZ2VzIGZyb20gXCIgKyAodGFsbHkuc2l0ZXMgfHwgJ25vJykgKyBcIiBzaXRlcy5cXG5UZXh0IG1hdGNoZWQgb24gXCIgKyAodGFsbHkudGl0bGUgfHwgJ25vJykgKyBcIiB0aXRsZXMsIFwiICsgKHRhbGx5LnRleHQgfHwgJ25vJykgKyBcIiBwYXJhZ3JhcGhzLCBhbmQgXCIgKyAodGFsbHkuc2x1ZyB8fCAnbm8nKSArIFwiIHNsdWdzLlxcbkVsYXBzZWQgdGltZSBcIiArIHRhbGx5Lm1zZWMgKyBcIiBtaWxsaXNlY29uZHMuXCJcbiAgICAgIH07XG4gICAgICBzZWFyY2hSZXN1bHRSZWZlcmVuY2VzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2ksIF9sZW4sIF9yZWYsIF9yZXN1bHRzO1xuICAgICAgICBfcmVmID0gc2VhcmNoUmVzdWx0cy5maW5kcztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgcmVzdWx0ID0gX3JlZltfaV07XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIixcbiAgICAgICAgICAgIFwiaWRcIjogdXRpbC5yYW5kb21CeXRlcyg4KSxcbiAgICAgICAgICAgIFwic2l0ZVwiOiByZXN1bHQuc2l0ZSxcbiAgICAgICAgICAgIFwic2x1Z1wiOiByZXN1bHQucGFnZS5zbHVnLFxuICAgICAgICAgICAgXCJ0aXRsZVwiOiByZXN1bHQucGFnZS50aXRsZSxcbiAgICAgICAgICAgIFwidGV4dFwiOiByZXN1bHQucGFnZS5zeW5vcHNpcyB8fCAnJ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCk7XG4gICAgICBzZWFyY2hSZXN1bHRQYWdlRGF0YSA9IHtcbiAgICAgICAgdGl0bGU6IFwiU2VhcmNoIFJlc3VsdHNcIixcbiAgICAgICAgc3Rvcnk6IFtleHBsYW5hdG9yeVBhcmFdLmNvbmNhdChzZWFyY2hSZXN1bHRSZWZlcmVuY2VzKVxuICAgICAgfTtcbiAgICAgICRzZWFyY2hSZXN1bHRQYWdlID0gd2lraS5jcmVhdGVQYWdlKCdzZWFyY2gtcmVzdWx0cycpLmFkZENsYXNzKCdnaG9zdCcpO1xuICAgICAgJHNlYXJjaFJlc3VsdFBhZ2UuYXBwZW5kVG8oJCgnLm1haW4nKSk7XG4gICAgICB3aWtpLmJ1aWxkUGFnZShzZWFyY2hSZXN1bHRQYWdlRGF0YSwgbnVsbCwgJHNlYXJjaFJlc3VsdFBhZ2UpO1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgIHBlcmZvcm1TZWFyY2g6IHBlcmZvcm1TZWFyY2hcbiAgICB9O1xuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2VhcmNoO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBjcmVhdGVTZWFyY2gsIG5laWdoYm9yaG9vZCwgbmV4dEF2YWlsYWJsZUZldGNoLCBuZXh0RmV0Y2hJbnRlcnZhbCwgcG9wdWxhdGVTaXRlSW5mb0ZvciwgdXRpbCwgd2lraSwgXyxcbiAgICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4gIHdpa2kgPSByZXF1aXJlKCcuL3dpa2knKTtcblxuICBhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBjcmVhdGVTZWFyY2ggPSByZXF1aXJlKCcuL3NlYXJjaCcpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gbmVpZ2hib3Job29kID0ge307XG5cbiAgaWYgKHdpa2kubmVpZ2hib3Job29kID09IG51bGwpIHtcbiAgICB3aWtpLm5laWdoYm9yaG9vZCA9IHt9O1xuICB9XG5cbiAgbmV4dEF2YWlsYWJsZUZldGNoID0gMDtcblxuICBuZXh0RmV0Y2hJbnRlcnZhbCA9IDIwMDA7XG5cbiAgcG9wdWxhdGVTaXRlSW5mb0ZvciA9IGZ1bmN0aW9uKHNpdGUsIG5laWdoYm9ySW5mbykge1xuICAgIHZhciBmZXRjaE1hcCwgbm93LCB0cmFuc2l0aW9uO1xuICAgIGlmIChuZWlnaGJvckluZm8uc2l0ZW1hcFJlcXVlc3RJbmZsaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBuZWlnaGJvckluZm8uc2l0ZW1hcFJlcXVlc3RJbmZsaWdodCA9IHRydWU7XG4gICAgdHJhbnNpdGlvbiA9IGZ1bmN0aW9uKHNpdGUsIGZyb20sIHRvKSB7XG4gICAgICByZXR1cm4gJChcIi5uZWlnaGJvcltkYXRhLXNpdGU9XFxcIlwiICsgc2l0ZSArIFwiXFxcIl1cIikuZmluZCgnZGl2JykucmVtb3ZlQ2xhc3MoZnJvbSkuYWRkQ2xhc3ModG8pO1xuICAgIH07XG4gICAgZmV0Y2hNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXF1ZXN0LCBzaXRlbWFwVXJsO1xuICAgICAgc2l0ZW1hcFVybCA9IFwiaHR0cDovL1wiICsgc2l0ZSArIFwiL3N5c3RlbS9zaXRlbWFwLmpzb25cIjtcbiAgICAgIHRyYW5zaXRpb24oc2l0ZSwgJ3dhaXQnLCAnZmV0Y2gnKTtcbiAgICAgIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgdXJsOiBzaXRlbWFwVXJsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXF1ZXN0LmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0ID0gZmFsc2U7XG4gICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgbmVpZ2hib3JJbmZvLnNpdGVtYXAgPSBkYXRhO1xuICAgICAgICB0cmFuc2l0aW9uKHNpdGUsICdmZXRjaCcsICdkb25lJyk7XG4gICAgICAgIHJldHVybiAkKCdib2R5JykudHJpZ2dlcignbmV3LW5laWdoYm9yLWRvbmUnLCBzaXRlKTtcbiAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihzaXRlLCAnZmV0Y2gnLCAnZmFpbCcpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgPiBuZXh0QXZhaWxhYmxlRmV0Y2gpIHtcbiAgICAgIG5leHRBdmFpbGFibGVGZXRjaCA9IG5vdyArIG5leHRGZXRjaEludGVydmFsO1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZmV0Y2hNYXAsIDEwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFRpbWVvdXQoZmV0Y2hNYXAsIG5leHRBdmFpbGFibGVGZXRjaCAtIG5vdyk7XG4gICAgICByZXR1cm4gbmV4dEF2YWlsYWJsZUZldGNoICs9IG5leHRGZXRjaEludGVydmFsO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLnJlZ2lzdGVyTmVpZ2hib3IgPSBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgbmVpZ2hib3JJbmZvO1xuICAgIGlmICh3aWtpLm5laWdoYm9yaG9vZFtzaXRlXSAhPSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG5laWdoYm9ySW5mbyA9IHt9O1xuICAgIHdpa2kubmVpZ2hib3Job29kW3NpdGVdID0gbmVpZ2hib3JJbmZvO1xuICAgIHBvcHVsYXRlU2l0ZUluZm9Gb3Ioc2l0ZSwgbmVpZ2hib3JJbmZvKTtcbiAgICByZXR1cm4gJCgnYm9keScpLnRyaWdnZXIoJ25ldy1uZWlnaGJvcicsIHNpdGUpO1xuICB9O1xuXG4gIG5laWdoYm9yaG9vZC5saXN0TmVpZ2hib3JzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8ua2V5cyh3aWtpLm5laWdoYm9yaG9vZCk7XG4gIH07XG5cbiAgbmVpZ2hib3Job29kLnNlYXJjaCA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5KSB7XG4gICAgdmFyIGZpbmRzLCBtYXRjaCwgbWF0Y2hpbmdQYWdlcywgbmVpZ2hib3JJbmZvLCBuZWlnaGJvclNpdGUsIHNpdGVtYXAsIHN0YXJ0LCB0YWxseSwgdGljaywgX3JlZjtcbiAgICBmaW5kcyA9IFtdO1xuICAgIHRhbGx5ID0ge307XG4gICAgdGljayA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKHRhbGx5W2tleV0gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGFsbHlba2V5XSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRhbGx5W2tleV0gPSAxO1xuICAgICAgfVxuICAgIH07XG4gICAgbWF0Y2ggPSBmdW5jdGlvbihrZXksIHRleHQpIHtcbiAgICAgIHZhciBoaXQ7XG4gICAgICBoaXQgPSAodGV4dCAhPSBudWxsKSAmJiB0ZXh0LnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpKSA+PSAwO1xuICAgICAgaWYgKGhpdCkge1xuICAgICAgICB0aWNrKGtleSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGl0O1xuICAgIH07XG4gICAgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIF9yZWYgPSB3aWtpLm5laWdoYm9yaG9vZDtcbiAgICBmb3IgKG5laWdoYm9yU2l0ZSBpbiBfcmVmKSB7XG4gICAgICBpZiAoIV9faGFzUHJvcC5jYWxsKF9yZWYsIG5laWdoYm9yU2l0ZSkpIGNvbnRpbnVlO1xuICAgICAgbmVpZ2hib3JJbmZvID0gX3JlZltuZWlnaGJvclNpdGVdO1xuICAgICAgc2l0ZW1hcCA9IG5laWdoYm9ySW5mby5zaXRlbWFwO1xuICAgICAgaWYgKHNpdGVtYXAgIT0gbnVsbCkge1xuICAgICAgICB0aWNrKCdzaXRlcycpO1xuICAgICAgfVxuICAgICAgbWF0Y2hpbmdQYWdlcyA9IF8uZWFjaChzaXRlbWFwLCBmdW5jdGlvbihwYWdlKSB7XG4gICAgICAgIHRpY2soJ3BhZ2VzJyk7XG4gICAgICAgIGlmICghKG1hdGNoKCd0aXRsZScsIHBhZ2UudGl0bGUpIHx8IG1hdGNoKCd0ZXh0JywgcGFnZS5zeW5vcHNpcykgfHwgbWF0Y2goJ3NsdWcnLCBwYWdlLnNsdWcpKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aWNrKCdmaW5kcycpO1xuICAgICAgICByZXR1cm4gZmluZHMucHVzaCh7XG4gICAgICAgICAgcGFnZTogcGFnZSxcbiAgICAgICAgICBzaXRlOiBuZWlnaGJvclNpdGUsXG4gICAgICAgICAgcmFuazogMVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0YWxseVsnbXNlYyddID0gRGF0ZS5ub3coKSAtIHN0YXJ0O1xuICAgIHJldHVybiB7XG4gICAgICBmaW5kczogZmluZHMsXG4gICAgICB0YWxseTogdGFsbHlcbiAgICB9O1xuICB9O1xuXG4gICQoZnVuY3Rpb24oKSB7XG4gICAgdmFyICRuZWlnaGJvcmhvb2QsIGZsYWcsIHNlYXJjaDtcbiAgICAkbmVpZ2hib3Job29kID0gJCgnLm5laWdoYm9yaG9vZCcpO1xuICAgIGZsYWcgPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgICByZXR1cm4gXCI8c3BhbiBjbGFzcz1cXFwibmVpZ2hib3JcXFwiIGRhdGEtc2l0ZT1cXFwiXCIgKyBzaXRlICsgXCJcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwid2FpdFxcXCI+XFxuICAgIDxpbWcgc3JjPVxcXCJodHRwOi8vXCIgKyBzaXRlICsgXCIvZmF2aWNvbi5wbmdcXFwiIHRpdGxlPVxcXCJcIiArIHNpdGUgKyBcIlxcXCI+XFxuICA8L2Rpdj5cXG48L3NwYW4+XCI7XG4gICAgfTtcbiAgICAkKCdib2R5Jykub24oJ25ldy1uZWlnaGJvcicsIGZ1bmN0aW9uKGUsIHNpdGUpIHtcbiAgICAgIHJldHVybiAkbmVpZ2hib3Job29kLmFwcGVuZChmbGFnKHNpdGUpKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLm5laWdoYm9yIGltZycsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiB3aWtpLmRvSW50ZXJuYWxMaW5rKCd3ZWxjb21lLXZpc2l0b3JzJywgbnVsbCwgdGhpcy50aXRsZSk7XG4gICAgfSk7XG4gICAgc2VhcmNoID0gY3JlYXRlU2VhcmNoKHtcbiAgICAgIG5laWdoYm9yaG9vZDogbmVpZ2hib3Job29kXG4gICAgfSk7XG4gICAgcmV0dXJuICQoJ2lucHV0LnNlYXJjaCcpLm9uKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBzZWFyY2hRdWVyeTtcbiAgICAgIGlmIChlLmtleUNvZGUgIT09IDEzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlYXJjaFF1ZXJ5ID0gJCh0aGlzKS52YWwoKTtcbiAgICAgIHNlYXJjaC5wZXJmb3JtU2VhcmNoKHNlYXJjaFF1ZXJ5KTtcbiAgICAgIHJldHVybiAkKHRoaXMpLnZhbChcIlwiKTtcbiAgICB9KTtcbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iXX0=
;