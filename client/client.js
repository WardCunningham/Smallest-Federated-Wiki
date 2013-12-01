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
      $page.data('site', site);
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
  var active, newPage, pageHandler, plugin, refresh, state, util, wiki;

  wiki = require('./wiki');

  util = require('./util');

  pageHandler = wiki.pageHandler = require('./pageHandler');

  plugin = require('./plugin');

  state = require('./state');

  active = require('./active');

  refresh = require('./refresh');

  newPage = require('./page').newPage;

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
        var $page, page, pageObject;
        $page = $(e.target).parents('.page:first');
        $page.removeClass('ghost');
        page = $page.data('data');
        page.story = story || [];
        pageObject = newPage(page, null);
        page = pageObject.getRawPage();
        pageHandler.put($page, {
          type: 'create',
          id: page.id,
          item: {
            title: page.title,
            story: page.story
          }
        });
        return wiki.buildPage(pageObject, $page.empty());
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

},{"./active":10,"./page":12,"./pageHandler":7,"./plugin":8,"./refresh":11,"./state":9,"./util":6,"./wiki":2}],4:[function(require,module,exports){
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
    reference: require('./reference'),
    factory: require('./factory'),
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

},{"./factory":14,"./reference":13,"./util":6,"./wiki":2}],9:[function(require,module,exports){
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

},{"./active":10,"./wiki":2}],15:[function(require,module,exports){
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
  var bind, emit;

  emit = function($item, item) {
    var site, slug;
    slug = item.slug || 'welcome-visitors';
    site = item.site;
    return wiki.resolveFrom(site, function() {
      return $item.append("<p style='margin-bottom:3px;'>\n  <img class='remote'\n    src='//" + site + "/favicon.png'\n    title='" + site + "'\n    data-site=\"" + site + "\"\n    data-slug=\"" + slug + "\"\n  >\n  " + (wiki.resolveLinks("[[" + (item.title || slug) + "]]")) + "\n</p>\n<div>\n  " + (wiki.resolveLinks(item.text)) + "\n</div>");
    });
  };

  bind = function($item, item) {
    return $item.dblclick(function() {
      return wiki.textEditor($item, item);
    });
  };

  module.exports = {
    emit: emit,
    bind: bind
  };

}).call(this);

},{}],14:[function(require,module,exports){
(function() {
  var arrayToJson, bind, csvToArray, emit,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  emit = function(div, item) {
    var showMenu, showPrompt;
    div.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');
    showMenu = function() {
      var info, menu, menuItem, name, _i, _len, _ref, _ref1;
      menu = div.find('p').append("<br>Or Choose a Plugin");
      menuItem = function(title, name) {
        return menu.append("<li><a class=\"menu\" href=\"#\" title=\"" + title + "\">" + name + "</a></li>");
      };
      if (Array.isArray(window.catalog)) {
        _ref = window.catalog;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          info = _ref[_i];
          menuItem(info.title, info.name);
        }
      } else {
        _ref1 = window.catalog;
        for (name in _ref1) {
          info = _ref1[name];
          menuItem(info.menu, name);
        }
      }
      return menu.find('a.menu').click(function(evt) {
        div.removeClass('factory').addClass(item.type = evt.target.text.toLowerCase());
        div.unbind();
        return wiki.textEditor(div, item);
      });
    };
    showPrompt = function() {
      return div.append("<p>" + (wiki.resolveLinks(item.prompt)) + "</b>");
    };
    if (item.prompt) {
      return showPrompt();
    } else if (window.catalog != null) {
      return showMenu();
    } else {
      return $.getJSON('/system/factories.json', function(data) {
        window.catalog = data;
        return showMenu();
      });
    }
  };

  bind = function(div, item) {
    var syncEditAction;
    syncEditAction = function() {
      var err, pageElement;
      wiki.log('factory item', item);
      div.empty().unbind();
      div.removeClass("factory").addClass(item.type);
      pageElement = div.parents('.page:first');
      try {
        div.data('pageElement', pageElement);
        div.data('item', item);
        wiki.getPlugin(item.type, function(plugin) {
          plugin.emit(div, item);
          return plugin.bind(div, item);
        });
      } catch (_error) {
        err = _error;
        div.append("<p class='error'>" + err + "</p>");
      }
      return wiki.pageHandler.put(pageElement, {
        type: 'edit',
        id: item.id,
        item: item
      });
    };
    div.dblclick(function() {
      div.removeClass('factory').addClass(item.type = 'paragraph');
      div.unbind();
      return wiki.textEditor(div, item);
    });
    div.bind('dragenter', function(evt) {
      return evt.preventDefault();
    });
    div.bind('dragover', function(evt) {
      return evt.preventDefault();
    });
    return div.bind("drop", function(dropEvent) {
      var dt, found, ignore, origin, punt, readFile, url;
      punt = function(data) {
        item.prompt = "<b>Unexpected Item</b><br>We can't make sense of the drop.<br>" + (JSON.stringify(data)) + "<br>Try something else or see [[About Factory Plugin]].";
        data.userAgent = navigator.userAgent;
        item.punt = data;
        wiki.log('factory punt', dropEvent);
        return syncEditAction();
      };
      readFile = function(file) {
        var majorType, minorType, reader, _ref;
        if (file != null) {
          _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
          reader = new FileReader();
          if (majorType === "image") {
            reader.onload = function(loadEvent) {
              item.type = 'image';
              item.url = loadEvent.target.result;
              item.caption || (item.caption = "Uploaded image");
              return syncEditAction();
            };
            return reader.readAsDataURL(file);
          } else if (majorType === "text") {
            reader.onload = function(loadEvent) {
              var array, result;
              result = loadEvent.target.result;
              if (minorType === 'csv') {
                item.type = 'data';
                item.columns = (array = csvToArray(result))[0];
                item.data = arrayToJson(array);
                item.text = file.fileName;
              } else {
                item.type = 'paragraph';
                item.text = result;
              }
              return syncEditAction();
            };
            return reader.readAsText(file);
          } else {
            return punt({
              number: 1,
              name: file.fileName,
              type: file.type
            });
          }
        } else {
          return punt({
            number: 2,
            types: dropEvent.originalEvent.dataTransfer.types
          });
        }
      };
      dropEvent.preventDefault();
      if ((dt = dropEvent.originalEvent.dataTransfer) != null) {
        if ((dt.types != null) && (__indexOf.call(dt.types, 'text/uri-list') >= 0 || __indexOf.call(dt.types, 'text/x-moz-url') >= 0) && !(__indexOf.call(dt.types, 'Files') >= 0)) {
          url = dt.getData('URL');
          if (found = url.match(/^http:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/)) {
            wiki.log('factory drop url', found);
            ignore = found[0], origin = found[1], ignore = found[2], item.site = found[3], item.slug = found[4], ignore = found[5];
            if ($.inArray(item.site, ['view', 'local', 'origin']) >= 0) {
              item.site = origin;
            }
            return $.getJSON("http://" + item.site + "/" + item.slug + ".json", function(remote) {
              wiki.log('factory remote', remote);
              item.type = 'reference';
              item.title = remote.title || item.slug;
              item.text = wiki.createSynopsis(remote);
              syncEditAction();
              if (item.site != null) {
                return wiki.registerNeighbor(item.site);
              }
            });
          } else {
            return punt({
              number: 4,
              url: url,
              types: dt.types
            });
          }
        } else if (__indexOf.call(dt.types, 'Files') >= 0) {
          return readFile(dt.files[0]);
        } else {
          return punt({
            number: 5,
            types: dt.types
          });
        }
      } else {
        return punt({
          number: 6,
          trouble: "no data transfer object"
        });
      }
    });
  };

  csvToArray = function(strData, strDelimiter) {
    var arrData, arrMatches, objPattern, strMatchedDelimiter, strMatchedValue;
    strDelimiter = strDelimiter || ",";
    objPattern = new RegExp("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))", "gi");
    arrData = [[]];
    arrMatches = null;
    while (arrMatches = objPattern.exec(strData)) {
      strMatchedDelimiter = arrMatches[1];
      if (strMatchedDelimiter.length && (strMatchedDelimiter !== strDelimiter)) {
        arrData.push([]);
      }
      if (arrMatches[2]) {
        strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
      } else {
        strMatchedValue = arrMatches[3];
      }
      arrData[arrData.length - 1].push(strMatchedValue);
    }
    return arrData;
  };

  arrayToJson = function(array) {
    var cols, row, rowToObject, _i, _len, _results;
    cols = array.shift();
    rowToObject = function(row) {
      var k, obj, v, _i, _len, _ref, _ref1;
      obj = {};
      _ref = _.zip(cols, row);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], k = _ref1[0], v = _ref1[1];
        if ((v != null) && (v.match(/\S/)) && v !== 'NULL') {
          obj[k] = v;
        }
      }
      return obj;
    };
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      row = array[_i];
      _results.push(rowToObject(row));
    }
    return _results;
  };

  module.exports = {
    emit: emit,
    bind: bind
  };

}).call(this);

},{}],16:[function(require,module,exports){
(function() {
  var util;

  util = require('./util');

  module.exports = function(journalElement, action) {
    var actionElement, actionTitle, controls, pageElement;
    pageElement = journalElement.parents('.page:first');
    actionTitle = action.type || 'separator';
    if (action.date != null) {
      actionTitle += " " + (util.formatElapsedTime(action.date));
    }
    actionElement = $("<a href=\"#\" /> ").addClass("action").addClass(action.type || 'separator').text(action.symbol || util.symbols[action.type]).attr('title', actionTitle).attr('data-id', action.id || "0").data('action', action);
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
  var addToJournal, newPage, pageFromLocalStorage, pageHandler, pushToLocal, pushToServer, recursiveGet, revision, state, util, wiki, _;

  _ = require('underscore');

  wiki = require('./wiki');

  util = require('./util');

  state = require('./state');

  revision = require('./revision');

  addToJournal = require('./addToJournal');

  newPage = require('./page').newPage;

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
    if (site === window.location.host) {
      site = 'origin';
    }
    if (site === 'view') {
      site = null;
    }
    if (site != null) {
      if (site === 'local') {
        if (localPage = pageFromLocalStorage(pageInformation.slug)) {
          return whenGotten(newPage(localPage, 'local'));
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
        return whenGotten(newPage(page, site));
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
        return whenGotten(newPage(localPage, 'local'));
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
    if (action.type === 'create') {
      page = {
        title: action.item.title,
        story: [],
        journal: []
      };
    } else {
      page = pageFromLocalStorage(pagePutInfo.slug);
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
      page.story = $(pageElement).find(".item").map(function() {
        return $(this).data("item");
      }).get();
    }
    page.journal = page.journal.concat(action);
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

},{"./addToJournal":16,"./page":12,"./revision":15,"./state":9,"./util":6,"./wiki":2,"underscore":17}],11:[function(require,module,exports){
(function() {
  var addToJournal, buildPageHeader, createFactory, emitHeader, emitTwins, handleDragging, initAddButton, initDragging, neighborhood, pageHandler, plugin, refresh, renderPageIntoPageElement, state, util, wiki, _;

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

  emitHeader = function($header, $page, pageObject) {
    var date, header, isRemotePage, page, pageHeader, rev, viewHere;
    page = pageObject.getRawPage();
    isRemotePage = pageObject.isRemote();
    header = '';
    viewHere = wiki.asSlug(page.title) === 'welcome-visitors' ? "" : "/view/" + (pageObject.getSlug());
    pageHeader = isRemotePage ? buildPageHeader({
      tooltip: pageObject.getRemoteSite(),
      header_href: "//" + (pageObject.getRemoteSite()) + "/view/welcome-visitors" + viewHere,
      favicon_src: "http://" + (pageObject.getRemoteSite()) + "/favicon.png",
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

  renderPageIntoPageElement = function(pageObject, $page) {
    var $footer, $header, $journal, $story, $twins, host, slug, _ref;
    $page.data("data", pageObject.getRawPage());
    if (pageObject.isRemote()) {
      $page.data("site", pageObject.getRemoteSite());
    }
    slug = $page.attr('id');
    wiki.resolutionContext = pageObject.getContext();
    $page.empty();
    _ref = ['twins', 'header', 'story', 'journal', 'footer'].map(function(className) {
      return $("<div />").addClass(className).appendTo($page);
    }), $twins = _ref[0], $header = _ref[1], $story = _ref[2], $journal = _ref[3], $footer = _ref[4];
    emitHeader($header, $page, pageObject);
    pageObject.seqItems(function(item, done) {
      var $item;
      if ((item != null ? item.type : void 0) && (item != null ? item.id : void 0)) {
        $item = $("<div class=\"item " + item.type + "\" data-id=\"" + item.id + "\">");
        $story.append($item);
        return plugin["do"]($item, item, done);
      } else {
        $story.append($("<div><p class=\"error\">Can't make sense of story[" + i + "]</p></div>"));
        return done();
      }
    });
    pageObject.seqActions(function(each, done) {
      if (each.separator) {
        addToJournal($journal, each.separator);
      }
      addToJournal($journal, each.action);
      return done();
    });
    emitTwins($page);
    $journal.append("<div class=\"control-buttons\">\n  <a href=\"#\" class=\"button fork-page\" title=\"fork this page\">" + util.symbols['fork'] + "</a>\n  <a href=\"#\" class=\"button add-factory\" title=\"add paragraph\">" + util.symbols['add'] + "</a>\n</div>");
    host = pageObject.getRemoteSite() || location.host;
    return $footer.append("<a id=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/\">CC BY-SA 3.0</a> .\n<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (util.randomBytes(4)) + "\" title=\"source\">JSON</a> .\n<a href= \"//" + host + "/" + slug + ".html\">" + host + "</a>");
  };

  wiki.buildPage = function(pageObject, $page) {
    if (pageObject.isLocal()) {
      $page.addClass('local');
    }
    if (pageObject.isRemote()) {
      $page.addClass('remote');
    }
    if (pageObject.isPlugin()) {
      $page.addClass('plugin');
    }
    renderPageIntoPageElement(pageObject, $page);
    state.setUrl();
    initDragging($page);
    initAddButton($page);
    return $page;
  };

  module.exports = refresh = wiki.refresh = function() {
    var $page, createGhostPage, emptyPage, pageInformation, rev, slug, whenGotten, _ref;
    $page = $(this);
    _ref = $page.attr('id').split('_rev'), slug = _ref[0], rev = _ref[1];
    pageInformation = {
      slug: slug,
      rev: rev,
      site: $page.data('site')
    };
    emptyPage = require('./page').emptyPage;
    createGhostPage = function() {
      var hit, hits, info, pageObject, result, site, title, _i, _len, _ref1;
      title = $("a[href=\"/" + slug + ".html\"]:last").text() || slug;
      pageObject = emptyPage();
      pageObject.setTitle(title);
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
              "site": site,
              "slug": slug,
              "title": result.title || slug,
              "text": result.synopsis || ''
            });
          }
        }
      }
      if (hits.length > 0) {
        pageObject.addItem({
          'type': 'future',
          'text': 'We could not find this page in the expected context.',
          'title': title
        });
        pageObject.addItem({
          'type': 'paragraph',
          'text': "We did find the page in your current neighborhood."
        });
        for (_i = 0, _len = hits.length; _i < _len; _i++) {
          hit = hits[_i];
          pageObject.addItem(hit);
        }
      } else {
        pageObject.addItem({
          'type': 'future',
          'text': 'We could not find this page.',
          'title': title
        });
      }
      return wiki.buildPage(pageObject, $page).addClass('ghost');
    };
    whenGotten = function(pageObject) {
      var site, _i, _len, _ref1, _results;
      wiki.buildPage(pageObject, $page);
      _ref1 = pageObject.getNeighbors(location.host);
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        site = _ref1[_i];
        _results.push(neighborhood.registerNeighbor(site));
      }
      return _results;
    };
    return pageHandler.get({
      whenGotten: whenGotten,
      whenNotGotten: createGhostPage,
      pageInformation: pageInformation
    });
  };

}).call(this);

},{"./addToJournal":16,"./neighborhood":18,"./page":12,"./pageHandler":7,"./plugin":8,"./state":9,"./util":6,"./wiki":2,"underscore":17}],12:[function(require,module,exports){
(function() {
  var asSlug, emptyPage, newPage, nowSections, util, _;

  util = require('./util');

  _ = require('underscore');

  asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  emptyPage = function() {
    return newPage({}, null);
  };

  nowSections = function(now) {
    return [
      {
        symbol: '❄',
        date: now - 1000 * 60 * 60 * 24 * 366,
        period: 'a Year'
      }, {
        symbol: '⚘',
        date: now - 1000 * 60 * 60 * 24 * 31 * 3,
        period: 'a Season'
      }, {
        symbol: '⚪',
        date: now - 1000 * 60 * 60 * 24 * 31,
        period: 'a Month'
      }, {
        symbol: '☽',
        date: now - 1000 * 60 * 60 * 24 * 7,
        period: 'a Week'
      }, {
        symbol: '☀',
        date: now - 1000 * 60 * 60 * 24,
        period: 'a Day'
      }, {
        symbol: '⌚',
        date: now - 1000 * 60 * 60,
        period: 'an Hour'
      }
    ];
  };

  newPage = function(json, site) {
    var addItem, addParagraph, getContext, getNeighbors, getRawPage, getRemoteSite, getSlug, isLocal, isPlugin, isRemote, page, seqActions, seqItems, setTitle;
    page = _.extend({}, util.emptyPage(), json);
    page.story || (page.story = []);
    page.journal || (page.journal = []);
    getRawPage = function() {
      return page;
    };
    getContext = function() {
      var action, addContext, context, _i, _len, _ref;
      context = ['view'];
      if (isRemote()) {
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
      return context;
    };
    isPlugin = function() {
      return page.plugin != null;
    };
    isRemote = function() {
      return !(site === (void 0) || site === null || site === 'view' || site === 'origin' || site === 'local');
    };
    isLocal = function() {
      return site === 'local';
    };
    getRemoteSite = function() {
      if (isRemote()) {
        return site;
      }
      return null;
    };
    getSlug = function() {
      return asSlug(page.title);
    };
    getNeighbors = function(host) {
      var action, item, neighbors, _i, _j, _len, _len1, _ref, _ref1;
      neighbors = [];
      if (isRemote()) {
        neighbors.push(site);
      } else {
        if (host != null) {
          neighbors.push(host);
        }
      }
      _ref = page.story;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (item.site != null) {
          neighbors.push(item.site);
        }
      }
      _ref1 = page.journal;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        action = _ref1[_j];
        if (action.site != null) {
          neighbors.push(action.site);
        }
      }
      return _.uniq(neighbors);
    };
    setTitle = function(title) {
      return page.title = title;
    };
    addItem = function(item) {
      item = _.extend({}, {
        id: util.randomBytes(8)
      }, item);
      return page.story.push(item);
    };
    seqItems = function(each) {
      var emitItem;
      emitItem = function(i) {
        if (i >= page.story.length) {
          return;
        }
        return each(page.story[i], function() {
          return emitItem(i + 1);
        });
      };
      return emitItem(0);
    };
    addParagraph = function(text) {
      var type;
      type = "paragraph";
      return addItem({
        type: type,
        text: text
      });
    };
    seqActions = function(each) {
      var emitAction, sections, smaller;
      smaller = 0;
      sections = nowSections((new Date).getTime());
      emitAction = function(i) {
        var action, bigger, section, separator, _i, _len;
        if (i >= page.journal.length) {
          return;
        }
        action = page.journal[i];
        bigger = action.date || 0;
        separator = null;
        for (_i = 0, _len = sections.length; _i < _len; _i++) {
          section = sections[_i];
          if (section.date > smaller && section.date < bigger) {
            separator = section;
          }
        }
        smaller = bigger;
        return each({
          action: action,
          separator: separator
        }, function() {
          return emitAction(i + 1);
        });
      };
      return emitAction(0);
    };
    return {
      getRawPage: getRawPage,
      getContext: getContext,
      isPlugin: isPlugin,
      isRemote: isRemote,
      isLocal: isLocal,
      getRemoteSite: getRemoteSite,
      getSlug: getSlug,
      getNeighbors: getNeighbors,
      setTitle: setTitle,
      addItem: addItem,
      addParagraph: addParagraph,
      seqItems: seqItems,
      seqActions: seqActions
    };
  };

  module.exports = {
    newPage: newPage,
    emptyPage: emptyPage
  };

}).call(this);

},{"./util":6,"underscore":17}],17:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
(function() {
  var active, createSearch, emptyPage, util, wiki;

  wiki = require('./wiki');

  util = require('./util');

  active = require('./active');

  emptyPage = require('./page').emptyPage;

  createSearch = function(_arg) {
    var neighborhood, performSearch;
    neighborhood = _arg.neighborhood;
    performSearch = function(searchQuery) {
      var $resultPage, result, resultPage, searchResults, tally, _i, _len, _ref;
      searchResults = neighborhood.search(searchQuery);
      tally = searchResults.tally;
      resultPage = emptyPage();
      resultPage.setTitle("Search for '" + searchQuery + "'");
      resultPage.addParagraph("String '" + searchQuery + "' found on " + (tally.finds || 'none') + " of " + (tally.pages || 'no') + " pages from " + (tally.sites || 'no') + " sites.\nText matched on " + (tally.title || 'no') + " titles, " + (tally.text || 'no') + " paragraphs, and " + (tally.slug || 'no') + " slugs.\nElapsed time " + tally.msec + " milliseconds.");
      _ref = searchResults.finds;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        resultPage.addItem({
          "type": "reference",
          "site": result.site,
          "slug": result.page.slug,
          "title": result.page.title,
          "text": result.page.synopsis || ''
        });
      }
      $resultPage = wiki.createPage(resultPage.getSlug()).addClass('ghost');
      $resultPage.appendTo($('.main'));
      wiki.buildPage(resultPage, $resultPage);
      return active.set($('.page').last());
    };
    return {
      performSearch: performSearch
    };
  };

  module.exports = createSearch;

}).call(this);

},{"./active":10,"./page":12,"./util":6,"./wiki":2}],18:[function(require,module,exports){
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

},{"./active":10,"./search":19,"./util":6,"./wiki":2,"underscore":17}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvY2xpZW50LmNvZmZlZSIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3dpa2kuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9sZWdhY3kuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9zeW5vcHNpcy5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3BlcnNvbmEuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9hY3RpdmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi91dGlsLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL0ZlZFdpa2kvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvcGx1Z2luLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL0ZlZFdpa2kvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvc3RhdGUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9yZXZpc2lvbi5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3JlZmVyZW5jZS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL2ZhY3RvcnkuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9hZGRUb0pvdXJuYWwuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9wYWdlSGFuZGxlci5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3JlZnJlc2guanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9wYWdlLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL0ZlZFdpa2kvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9zZWFyY2guanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9uZWlnaGJvcmhvb2QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLENBQU8sRUFBTyxDQUFkLEVBQU0sQ0FBUSxlQUFBOztBQUNkLENBREEsTUFDQSxpQkFBQTs7OztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJ3aW5kb3cud2lraSA9IHJlcXVpcmUoJ3dpa2ktY2xpZW50L2xpYi93aWtpJylcbnJlcXVpcmUoJ3dpa2ktY2xpZW50L2xpYi9sZWdhY3knKVxuXG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBjcmVhdGVTeW5vcHNpcywgd2lraSxcbiAgICBfX3NsaWNlID0gW10uc2xpY2U7XG5cbiAgY3JlYXRlU3lub3BzaXMgPSByZXF1aXJlKCcuL3N5bm9wc2lzJyk7XG5cbiAgd2lraSA9IHtcbiAgICBjcmVhdGVTeW5vcHNpczogY3JlYXRlU3lub3BzaXNcbiAgfTtcblxuICB3aWtpLnBlcnNvbmEgPSByZXF1aXJlKCcuL3BlcnNvbmEnKTtcblxuICB3aWtpLmxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGluZ3M7XG4gICAgdGhpbmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICBpZiAoKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmIGNvbnNvbGUgIT09IG51bGwgPyBjb25zb2xlLmxvZyA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIHRoaW5ncyk7XG4gICAgfVxuICB9O1xuXG4gIHdpa2kuYXNTbHVnID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBuYW1lLnJlcGxhY2UoL1xccy9nLCAnLScpLnJlcGxhY2UoL1teQS1aYS16MC05LV0vZywgJycpLnRvTG93ZXJDYXNlKCk7XG4gIH07XG5cbiAgd2lraS51c2VMb2NhbFN0b3JhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJChcIi5sb2dpblwiKS5sZW5ndGggPiAwO1xuICB9O1xuXG4gIHdpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBbXTtcblxuICB3aWtpLnJlc29sdmVGcm9tID0gZnVuY3Rpb24oYWRkaXRpb24sIGNhbGxiYWNrKSB7XG4gICAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wdXNoKGFkZGl0aW9uKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHdpa2kucmVzb2x1dGlvbkNvbnRleHQucG9wKCk7XG4gICAgfVxuICB9O1xuXG4gIHdpa2kuZ2V0RGF0YSA9IGZ1bmN0aW9uKHZpcykge1xuICAgIHZhciBpZHgsIHdobztcbiAgICBpZiAodmlzKSB7XG4gICAgICBpZHggPSAkKCcuaXRlbScpLmluZGV4KHZpcyk7XG4gICAgICB3aG8gPSAkKFwiLml0ZW06bHQoXCIgKyBpZHggKyBcIilcIikuZmlsdGVyKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KCk7XG4gICAgICBpZiAod2hvICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHdoby5kYXRhKCdpdGVtJykuZGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgd2hvID0gJCgnLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykubGFzdCgpO1xuICAgICAgaWYgKHdobyAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB3aG8uZGF0YSgnaXRlbScpLmRhdGE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHdpa2kuZ2V0RGF0YU5vZGVzID0gZnVuY3Rpb24odmlzKSB7XG4gICAgdmFyIGlkeCwgd2hvO1xuICAgIGlmICh2aXMpIHtcbiAgICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKTtcbiAgICAgIHdobyA9ICQoXCIuaXRlbTpsdChcIiArIGlkeCArIFwiKVwiKS5maWx0ZXIoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLnRvQXJyYXkoKS5yZXZlcnNlKCk7XG4gICAgICByZXR1cm4gJCh3aG8pO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aG8gPSAkKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS50b0FycmF5KCkucmV2ZXJzZSgpO1xuICAgICAgcmV0dXJuICQod2hvKTtcbiAgICB9XG4gIH07XG5cbiAgd2lraS5jcmVhdGVQYWdlID0gZnVuY3Rpb24obmFtZSwgbG9jKSB7XG4gICAgdmFyICRwYWdlLCBzaXRlO1xuICAgIGlmIChsb2MgJiYgbG9jICE9PSAndmlldycpIHtcbiAgICAgIHNpdGUgPSBsb2M7XG4gICAgfVxuICAgICRwYWdlID0gJChcIjxkaXYgY2xhc3M9XFxcInBhZ2VcXFwiIGlkPVxcXCJcIiArIG5hbWUgKyBcIlxcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJ0d2luc1xcXCI+IDxwPiA8L3A+IDwvZGl2PlxcbiAgPGRpdiBjbGFzcz1cXFwiaGVhZGVyXFxcIj5cXG4gICAgPGgxPiA8aW1nIGNsYXNzPVxcXCJmYXZpY29uXFxcIiBzcmM9XFxcIlwiICsgKHNpdGUgPyBcIi8vXCIgKyBzaXRlIDogXCJcIikgKyBcIi9mYXZpY29uLnBuZ1xcXCIgaGVpZ2h0PVxcXCIzMnB4XFxcIj4gXCIgKyBuYW1lICsgXCIgPC9oMT5cXG4gIDwvZGl2PlxcbjwvZGl2PlwiKTtcbiAgICBpZiAoc2l0ZSkge1xuICAgICAgJHBhZ2UuZGF0YSgnc2l0ZScsIHNpdGUpO1xuICAgIH1cbiAgICByZXR1cm4gJHBhZ2U7XG4gIH07XG5cbiAgd2lraS5nZXRJdGVtID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICgkKGVsZW1lbnQpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiAkKGVsZW1lbnQpLmRhdGEoXCJpdGVtXCIpIHx8ICQoZWxlbWVudCkuZGF0YSgnc3RhdGljSXRlbScpO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLnJlc29sdmVMaW5rcyA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciByZW5kZXJJbnRlcm5hbExpbms7XG4gICAgcmVuZGVySW50ZXJuYWxMaW5rID0gZnVuY3Rpb24obWF0Y2gsIG5hbWUpIHtcbiAgICAgIHZhciBzbHVnO1xuICAgICAgc2x1ZyA9IHdpa2kuYXNTbHVnKG5hbWUpO1xuICAgICAgcmV0dXJuIFwiPGEgY2xhc3M9XFxcImludGVybmFsXFxcIiBocmVmPVxcXCIvXCIgKyBzbHVnICsgXCIuaHRtbFxcXCIgZGF0YS1wYWdlLW5hbWU9XFxcIlwiICsgc2x1ZyArIFwiXFxcIiB0aXRsZT1cXFwiXCIgKyAod2lraS5yZXNvbHV0aW9uQ29udGV4dC5qb2luKCcgPT4gJykpICsgXCJcXFwiPlwiICsgbmFtZSArIFwiPC9hPlwiO1xuICAgIH07XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9cXFtcXFsoW15cXF1dKylcXF1cXF0vZ2ksIHJlbmRlckludGVybmFsTGluaykucmVwbGFjZSgvXFxbKGh0dHAuKj8pICguKj8pXFxdL2dpLCBcIjxhIGNsYXNzPVxcXCJleHRlcm5hbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIGhyZWY9XFxcIiQxXFxcIiB0aXRsZT1cXFwiJDFcXFwiIHJlbD1cXFwibm9mb2xsb3dcXFwiPiQyIDxpbWcgc3JjPVxcXCIvaW1hZ2VzL2V4dGVybmFsLWxpbmstbHRyLWljb24ucG5nXFxcIj48L2E+XCIpO1xuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0gd2lraTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFjdGl2ZSwgbmV3UGFnZSwgcGFnZUhhbmRsZXIsIHBsdWdpbiwgcmVmcmVzaCwgc3RhdGUsIHV0aWwsIHdpa2k7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBwYWdlSGFuZGxlciA9IHdpa2kucGFnZUhhbmRsZXIgPSByZXF1aXJlKCcuL3BhZ2VIYW5kbGVyJyk7XG5cbiAgcGx1Z2luID0gcmVxdWlyZSgnLi9wbHVnaW4nKTtcblxuICBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKTtcblxuICBhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZScpO1xuXG4gIHJlZnJlc2ggPSByZXF1aXJlKCcuL3JlZnJlc2gnKTtcblxuICBuZXdQYWdlID0gcmVxdWlyZSgnLi9wYWdlJykubmV3UGFnZTtcblxuICBBcnJheS5wcm90b3R5cGUubGFzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzW3RoaXMubGVuZ3RoIC0gMV07XG4gIH07XG5cbiAgJChmdW5jdGlvbigpIHtcbiAgICB2YXIgTEVGVEFSUk9XLCBSSUdIVEFSUk9XLCBjcmVhdGVUZXh0RWxlbWVudCwgZG9JbnRlcm5hbExpbmssIGZpbmlzaENsaWNrLCBnZXRUZW1wbGF0ZSwgc2xlZXAsIHRleHRFZGl0b3I7XG4gICAgd2luZG93LmRpYWxvZyA9ICQoJzxkaXY+PC9kaXY+JykuaHRtbCgnVGhpcyBkaWFsb2cgd2lsbCBzaG93IGV2ZXJ5IHRpbWUhJykuZGlhbG9nKHtcbiAgICAgIGF1dG9PcGVuOiBmYWxzZSxcbiAgICAgIHRpdGxlOiAnQmFzaWMgRGlhbG9nJyxcbiAgICAgIGhlaWdodDogNjAwLFxuICAgICAgd2lkdGg6IDgwMFxuICAgIH0pO1xuICAgIHdpa2kuZGlhbG9nID0gZnVuY3Rpb24odGl0bGUsIGh0bWwpIHtcbiAgICAgIHdpbmRvdy5kaWFsb2cuaHRtbChodG1sKTtcbiAgICAgIHdpbmRvdy5kaWFsb2cuZGlhbG9nKFwib3B0aW9uXCIsIFwidGl0bGVcIiwgd2lraS5yZXNvbHZlTGlua3ModGl0bGUpKTtcbiAgICAgIHJldHVybiB3aW5kb3cuZGlhbG9nLmRpYWxvZygnb3BlbicpO1xuICAgIH07XG4gICAgc2xlZXAgPSBmdW5jdGlvbih0aW1lLCBkb25lKSB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChkb25lLCB0aW1lKTtcbiAgICB9O1xuICAgIHdpa2kucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uKCRpdGVtLCBpdGVtKSB7XG4gICAgICBwYWdlSGFuZGxlci5wdXQoJGl0ZW0ucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge1xuICAgICAgICB0eXBlOiAncmVtb3ZlJyxcbiAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuICRpdGVtLnJlbW92ZSgpO1xuICAgIH07XG4gICAgd2lraS5jcmVhdGVJdGVtID0gZnVuY3Rpb24oJHBhZ2UsICRiZWZvcmUsIGl0ZW0pIHtcbiAgICAgIHZhciAkaXRlbSwgYmVmb3JlO1xuICAgICAgaWYgKCRwYWdlID09IG51bGwpIHtcbiAgICAgICAgJHBhZ2UgPSAkYmVmb3JlLnBhcmVudHMoJy5wYWdlJyk7XG4gICAgICB9XG4gICAgICBpdGVtLmlkID0gdXRpbC5yYW5kb21CeXRlcyg4KTtcbiAgICAgICRpdGVtID0gJChcIjxkaXYgY2xhc3M9XFxcIml0ZW0gXCIgKyBpdGVtLnR5cGUgKyBcIlxcXCIgZGF0YS1pZD1cXFwiXCIgKyBcIlxcXCI8L2Rpdj5cIik7XG4gICAgICAkaXRlbS5kYXRhKCdpdGVtJywgaXRlbSkuZGF0YSgncGFnZUVsZW1lbnQnLCAkcGFnZSk7XG4gICAgICBpZiAoJGJlZm9yZSAhPSBudWxsKSB7XG4gICAgICAgICRiZWZvcmUuYWZ0ZXIoJGl0ZW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2UuZmluZCgnLnN0b3J5JykuYXBwZW5kKCRpdGVtKTtcbiAgICAgIH1cbiAgICAgIHBsdWdpbltcImRvXCJdKCRpdGVtLCBpdGVtKTtcbiAgICAgIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbSgkYmVmb3JlKTtcbiAgICAgIHNsZWVwKDUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQoJHBhZ2UsIHtcbiAgICAgICAgICBpdGVtOiBpdGVtLFxuICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgIHR5cGU6ICdhZGQnLFxuICAgICAgICAgIGFmdGVyOiBiZWZvcmUgIT0gbnVsbCA/IGJlZm9yZS5pZCA6IHZvaWQgMFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuICRpdGVtO1xuICAgIH07XG4gICAgY3JlYXRlVGV4dEVsZW1lbnQgPSBmdW5jdGlvbihwYWdlRWxlbWVudCwgYmVmb3JlRWxlbWVudCwgaW5pdGlhbFRleHQpIHtcbiAgICAgIHZhciBpdGVtLCBpdGVtQmVmb3JlLCBpdGVtRWxlbWVudDtcbiAgICAgIGl0ZW0gPSB7XG4gICAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KSxcbiAgICAgICAgdGV4dDogaW5pdGlhbFRleHRcbiAgICAgIH07XG4gICAgICBpdGVtRWxlbWVudCA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJpdGVtIHBhcmFncmFwaFxcXCIgZGF0YS1pZD1cIiArIGl0ZW0uaWQgKyBcIj48L2Rpdj5cIik7XG4gICAgICBpdGVtRWxlbWVudC5kYXRhKCdpdGVtJywgaXRlbSkuZGF0YSgncGFnZUVsZW1lbnQnLCBwYWdlRWxlbWVudCk7XG4gICAgICBiZWZvcmVFbGVtZW50LmFmdGVyKGl0ZW1FbGVtZW50KTtcbiAgICAgIHBsdWdpbltcImRvXCJdKGl0ZW1FbGVtZW50LCBpdGVtKTtcbiAgICAgIGl0ZW1CZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudCk7XG4gICAgICB3aWtpLnRleHRFZGl0b3IoaXRlbUVsZW1lbnQsIGl0ZW0pO1xuICAgICAgcmV0dXJuIHNsZWVwKDUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQocGFnZUVsZW1lbnQsIHtcbiAgICAgICAgICBpdGVtOiBpdGVtLFxuICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgIHR5cGU6ICdhZGQnLFxuICAgICAgICAgIGFmdGVyOiBpdGVtQmVmb3JlICE9IG51bGwgPyBpdGVtQmVmb3JlLmlkIDogdm9pZCAwXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICB0ZXh0RWRpdG9yID0gd2lraS50ZXh0RWRpdG9yID0gZnVuY3Rpb24oZGl2LCBpdGVtLCBjYXJldFBvcywgZG91YmxlQ2xpY2tlZCkge1xuICAgICAgdmFyIG9yaWdpbmFsLCB0ZXh0YXJlYSwgX3JlZjtcbiAgICAgIGlmIChkaXYuaGFzQ2xhc3MoJ3RleHRFZGl0aW5nJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGl2LmFkZENsYXNzKCd0ZXh0RWRpdGluZycpO1xuICAgICAgdGV4dGFyZWEgPSAkKFwiPHRleHRhcmVhPlwiICsgKG9yaWdpbmFsID0gKF9yZWYgPSBpdGVtLnRleHQpICE9IG51bGwgPyBfcmVmIDogJycpICsgXCI8L3RleHRhcmVhPlwiKS5mb2N1c291dChmdW5jdGlvbigpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNsYXNzKCd0ZXh0RWRpdGluZycpO1xuICAgICAgICBpZiAoaXRlbS50ZXh0ID0gdGV4dGFyZWEudmFsKCkpIHtcbiAgICAgICAgICBwbHVnaW5bXCJkb1wiXShkaXYuZW1wdHkoKSwgaXRlbSk7XG4gICAgICAgICAgaWYgKGl0ZW0udGV4dCA9PT0gb3JpZ2luYWwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0KGRpdi5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7XG4gICAgICAgICAgICB0eXBlOiAnZWRpdCcsXG4gICAgICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQoZGl2LnBhcmVudHMoJy5wYWdlOmZpcnN0JyksIHtcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBkaXYucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9KS5iaW5kKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgbWlkZGxlLCBwYWdlLCBwYWdlRWxlbWVudCwgcHJlZml4LCBwcmV2SXRlbSwgcHJldlRleHRMZW4sIHNlbCwgc3VmZml4LCB0ZXh0O1xuICAgICAgICBpZiAoKGUuYWx0S2V5IHx8IGUuY3RsS2V5IHx8IGUubWV0YUtleSkgJiYgZS53aGljaCA9PT0gODMpIHtcbiAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGUuYWx0S2V5IHx8IGUuY3RsS2V5IHx8IGUubWV0YUtleSkgJiYgZS53aGljaCA9PT0gNzMpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYgKCFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICBwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZG9JbnRlcm5hbExpbmsoXCJhYm91dCBcIiArIGl0ZW0udHlwZSArIFwiIHBsdWdpblwiLCBwYWdlKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgICBzZWwgPSB1dGlsLmdldFNlbGVjdGlvblBvcyh0ZXh0YXJlYSk7XG4gICAgICAgICAgaWYgKGUud2hpY2ggPT09ICQudWkua2V5Q29kZS5CQUNLU1BBQ0UgJiYgc2VsLnN0YXJ0ID09PSAwICYmIHNlbC5zdGFydCA9PT0gc2VsLmVuZCkge1xuICAgICAgICAgICAgcHJldkl0ZW0gPSB3aWtpLmdldEl0ZW0oZGl2LnByZXYoKSk7XG4gICAgICAgICAgICBpZiAocHJldkl0ZW0udHlwZSAhPT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldlRleHRMZW4gPSBwcmV2SXRlbS50ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHByZXZJdGVtLnRleHQgKz0gdGV4dGFyZWEudmFsKCk7XG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoJycpO1xuICAgICAgICAgICAgdGV4dEVkaXRvcihkaXYucHJldigpLCBwcmV2SXRlbSwgcHJldlRleHRMZW4pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gJC51aS5rZXlDb2RlLkVOVEVSICYmIGl0ZW0udHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgICAgIGlmICghc2VsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHQgPSB0ZXh0YXJlYS52YWwoKTtcbiAgICAgICAgICAgIHByZWZpeCA9IHRleHQuc3Vic3RyaW5nKDAsIHNlbC5zdGFydCk7XG4gICAgICAgICAgICBpZiAoc2VsLnN0YXJ0ICE9PSBzZWwuZW5kKSB7XG4gICAgICAgICAgICAgIG1pZGRsZSA9IHRleHQuc3Vic3RyaW5nKHNlbC5zdGFydCwgc2VsLmVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhzZWwuZW5kKTtcbiAgICAgICAgICAgIGlmIChwcmVmaXggPT09ICcnKSB7XG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnICcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGV4dGFyZWEudmFsKHByZWZpeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpO1xuICAgICAgICAgICAgcGFnZUVsZW1lbnQgPSBkaXYucGFyZW50KCkucGFyZW50KCk7XG4gICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCBzdWZmaXgpO1xuICAgICAgICAgICAgaWYgKG1pZGRsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsIG1pZGRsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJlZml4ID09PSAnJykge1xuICAgICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRpdi5odG1sKHRleHRhcmVhKTtcbiAgICAgIGlmIChjYXJldFBvcyAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1dGlsLnNldENhcmV0UG9zaXRpb24odGV4dGFyZWEsIGNhcmV0UG9zKTtcbiAgICAgIH0gZWxzZSBpZiAoZG91YmxlQ2xpY2tlZCkge1xuICAgICAgICB1dGlsLnNldENhcmV0UG9zaXRpb24odGV4dGFyZWEsIHRleHRhcmVhLnZhbCgpLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiB0ZXh0YXJlYS5zY3JvbGxUb3AodGV4dGFyZWFbMF0uc2Nyb2xsSGVpZ2h0IC0gdGV4dGFyZWEuaGVpZ2h0KCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb0ludGVybmFsTGluayA9IHdpa2kuZG9JbnRlcm5hbExpbmsgPSBmdW5jdGlvbihuYW1lLCBwYWdlLCBzaXRlKSB7XG4gICAgICBpZiAoc2l0ZSA9PSBudWxsKSB7XG4gICAgICAgIHNpdGUgPSBudWxsO1xuICAgICAgfVxuICAgICAgbmFtZSA9IHdpa2kuYXNTbHVnKG5hbWUpO1xuICAgICAgaWYgKHBhZ2UgIT0gbnVsbCkge1xuICAgICAgICAkKHBhZ2UpLm5leHRBbGwoKS5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICAgIHdpa2kuY3JlYXRlUGFnZShuYW1lLCBzaXRlKS5hcHBlbmRUbygkKCcubWFpbicpKS5lYWNoKHJlZnJlc2gpO1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIH07XG4gICAgTEVGVEFSUk9XID0gMzc7XG4gICAgUklHSFRBUlJPVyA9IDM5O1xuICAgICQoZG9jdW1lbnQpLmtleWRvd24oZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBkaXJlY3Rpb24sIG5ld0luZGV4LCBwYWdlcztcbiAgICAgIGRpcmVjdGlvbiA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgc3dpdGNoIChldmVudC53aGljaCkge1xuICAgICAgICAgIGNhc2UgTEVGVEFSUk9XOlxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIGNhc2UgUklHSFRBUlJPVzpcbiAgICAgICAgICAgIHJldHVybiArMTtcbiAgICAgICAgfVxuICAgICAgfSkoKTtcbiAgICAgIGlmIChkaXJlY3Rpb24gJiYgIShldmVudC50YXJnZXQudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSkge1xuICAgICAgICBwYWdlcyA9ICQoJy5wYWdlJyk7XG4gICAgICAgIG5ld0luZGV4ID0gcGFnZXMuaW5kZXgoJCgnLmFjdGl2ZScpKSArIGRpcmVjdGlvbjtcbiAgICAgICAgaWYgKCgwIDw9IG5ld0luZGV4ICYmIG5ld0luZGV4IDwgcGFnZXMubGVuZ3RoKSkge1xuICAgICAgICAgIHJldHVybiBhY3RpdmUuc2V0KHBhZ2VzLmVxKG5ld0luZGV4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgc3RhdGUuc2hvdyk7XG4gICAgJChkb2N1bWVudCkuYWpheEVycm9yKGZ1bmN0aW9uKGV2ZW50LCByZXF1ZXN0LCBzZXR0aW5ncykge1xuICAgICAgaWYgKHJlcXVlc3Quc3RhdHVzID09PSAwIHx8IHJlcXVlc3Quc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgd2lraS5sb2coJ2FqYXggZXJyb3InLCBldmVudCwgcmVxdWVzdCwgc2V0dGluZ3MpO1xuICAgICAgcmV0dXJuICQoJy5tYWluJykucHJlcGVuZChcIjxsaSBjbGFzcz0nZXJyb3InPlxcbiAgRXJyb3Igb24gXCIgKyBzZXR0aW5ncy51cmwgKyBcIjogXCIgKyByZXF1ZXN0LnJlc3BvbnNlVGV4dCArIFwiXFxuPC9saT5cIik7XG4gICAgfSk7XG4gICAgZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbihzbHVnLCBkb25lKSB7XG4gICAgICBpZiAoIXNsdWcpIHtcbiAgICAgICAgcmV0dXJuIGRvbmUobnVsbCk7XG4gICAgICB9XG4gICAgICB3aWtpLmxvZygnZ2V0VGVtcGxhdGUnLCBzbHVnKTtcbiAgICAgIHJldHVybiBwYWdlSGFuZGxlci5nZXQoe1xuICAgICAgICB3aGVuR290dGVuOiBmdW5jdGlvbihkYXRhLCBzaXRlRm91bmQpIHtcbiAgICAgICAgICByZXR1cm4gZG9uZShkYXRhLnN0b3J5KTtcbiAgICAgICAgfSxcbiAgICAgICAgd2hlbk5vdEdvdHRlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGRvbmUobnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIHBhZ2VJbmZvcm1hdGlvbjoge1xuICAgICAgICAgIHNsdWc6IHNsdWdcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgICBmaW5pc2hDbGljayA9IGZ1bmN0aW9uKGUsIG5hbWUpIHtcbiAgICAgIHZhciBwYWdlO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgaWYgKCFlLnNoaWZ0S2V5KSB7XG4gICAgICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgfVxuICAgICAgZG9JbnRlcm5hbExpbmsobmFtZSwgcGFnZSwgJChlLnRhcmdldCkuZGF0YSgnc2l0ZScpKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgICQoJy5tYWluJykuZGVsZWdhdGUoJy5zaG93LXBhZ2Utc291cmNlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGpzb24sIHBhZ2VFbGVtZW50O1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcGFnZUVsZW1lbnQgPSAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpO1xuICAgICAganNvbiA9IHBhZ2VFbGVtZW50LmRhdGEoJ2RhdGEnKTtcbiAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhcIkpTT04gZm9yIFwiICsganNvbi50aXRsZSwgJCgnPHByZS8+JykudGV4dChKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKSkpO1xuICAgIH0pLmRlbGVnYXRlKCcucGFnZScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghJChlLnRhcmdldCkuaXMoXCJhXCIpKSB7XG4gICAgICAgIHJldHVybiBhY3RpdmUuc2V0KHRoaXMpO1xuICAgICAgfVxuICAgIH0pLmRlbGVnYXRlKCcuaW50ZXJuYWwnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgbmFtZTtcbiAgICAgIG5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhKCdwYWdlTmFtZScpO1xuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9ICQoZS50YXJnZXQpLmF0dHIoJ3RpdGxlJykuc3BsaXQoJyA9PiAnKTtcbiAgICAgIHJldHVybiBmaW5pc2hDbGljayhlLCBuYW1lKTtcbiAgICB9KS5kZWxlZ2F0ZSgnaW1nLnJlbW90ZScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBuYW1lO1xuICAgICAgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEoJ3NsdWcnKTtcbiAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJChlLnRhcmdldCkuZGF0YSgnc2l0ZScpXTtcbiAgICAgIHJldHVybiBmaW5pc2hDbGljayhlLCBuYW1lKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLnJldmlzaW9uJywgJ2RibGNsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyICRwYWdlLCBhY3Rpb24sIGpzb24sIHBhZ2UsIHJldjtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKTtcbiAgICAgIHJldiA9IHBhZ2Uuam91cm5hbC5sZW5ndGggLSAxO1xuICAgICAgYWN0aW9uID0gcGFnZS5qb3VybmFsW3Jldl07XG4gICAgICBqc29uID0gSlNPTi5zdHJpbmdpZnkoYWN0aW9uLCBudWxsLCAyKTtcbiAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhcIlJldmlzaW9uIFwiICsgcmV2ICsgXCIsIFwiICsgYWN0aW9uLnR5cGUgKyBcIiBhY3Rpb25cIiwgJCgnPHByZS8+JykudGV4dChqc29uKSk7XG4gICAgfSkuZGVsZWdhdGUoJy5hY3Rpb24nLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGFjdGlvbiwgJHBhZ2UsIG5hbWUsIHJldiwgc2x1ZztcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICRhY3Rpb24gPSAkKGUudGFyZ2V0KTtcbiAgICAgIGlmICgkYWN0aW9uLmlzKCcuZm9yaycpICYmICgobmFtZSA9ICRhY3Rpb24uZGF0YSgnc2x1ZycpKSAhPSBudWxsKSkge1xuICAgICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyRhY3Rpb24uZGF0YSgnc2l0ZScpXTtcbiAgICAgICAgcmV0dXJuIGZpbmlzaENsaWNrKGUsIChuYW1lLnNwbGl0KCdfJykpWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgICBzbHVnID0gd2lraS5hc1NsdWcoJHBhZ2UuZGF0YSgnZGF0YScpLnRpdGxlKTtcbiAgICAgICAgcmV2ID0gJCh0aGlzKS5wYXJlbnQoKS5jaGlsZHJlbigpLmluZGV4KCRhY3Rpb24pO1xuICAgICAgICBpZiAoIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAkcGFnZS5uZXh0QWxsKCkucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgd2lraS5jcmVhdGVQYWdlKFwiXCIgKyBzbHVnICsgXCJfcmV2XCIgKyByZXYsICRwYWdlLmRhdGEoJ3NpdGUnKSkuYXBwZW5kVG8oJCgnLm1haW4nKSkuZWFjaChyZWZyZXNoKTtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgICAgfVxuICAgIH0pLmRlbGVnYXRlKCcuZm9yay1wYWdlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGl0ZW0sIHBhZ2VFbGVtZW50LCByZW1vdGVTaXRlO1xuICAgICAgcGFnZUVsZW1lbnQgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgaWYgKHBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdsb2NhbCcpKSB7XG4gICAgICAgIGlmICghd2lraS51c2VMb2NhbFN0b3JhZ2UoKSkge1xuICAgICAgICAgIGl0ZW0gPSBwYWdlRWxlbWVudC5kYXRhKCdkYXRhJyk7XG4gICAgICAgICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2xvY2FsJyk7XG4gICAgICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dChwYWdlRWxlbWVudCwge1xuICAgICAgICAgICAgdHlwZTogJ2ZvcmsnLFxuICAgICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKHJlbW90ZVNpdGUgPSBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJykpICE9IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gcGFnZUhhbmRsZXIucHV0KHBhZ2VFbGVtZW50LCB7XG4gICAgICAgICAgICB0eXBlOiAnZm9yaycsXG4gICAgICAgICAgICBzaXRlOiByZW1vdGVTaXRlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS5kZWxlZ2F0ZSgnLmFjdGlvbicsICdob3ZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlkO1xuICAgICAgaWQgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtaWQnKTtcbiAgICAgICQoXCJbZGF0YS1pZD1cIiArIGlkICsgXCJdXCIpLnRvZ2dsZUNsYXNzKCd0YXJnZXQnKTtcbiAgICAgIHJldHVybiAkKCcubWFpbicpLnRyaWdnZXIoJ3JldicpO1xuICAgIH0pLmRlbGVnYXRlKCcuaXRlbScsICdob3ZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlkO1xuICAgICAgaWQgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtaWQnKTtcbiAgICAgIHJldHVybiAkKFwiLmFjdGlvbltkYXRhLWlkPVwiICsgaWQgKyBcIl1cIikudG9nZ2xlQ2xhc3MoJ3RhcmdldCcpO1xuICAgIH0pLmRlbGVnYXRlKCdidXR0b24uY3JlYXRlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuIGdldFRlbXBsYXRlKCQoZS50YXJnZXQpLmRhdGEoJ3NsdWcnKSwgZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgdmFyICRwYWdlLCBwYWdlLCBwYWdlT2JqZWN0O1xuICAgICAgICAkcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlOmZpcnN0Jyk7XG4gICAgICAgICRwYWdlLnJlbW92ZUNsYXNzKCdnaG9zdCcpO1xuICAgICAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpO1xuICAgICAgICBwYWdlLnN0b3J5ID0gc3RvcnkgfHwgW107XG4gICAgICAgIHBhZ2VPYmplY3QgPSBuZXdQYWdlKHBhZ2UsIG51bGwpO1xuICAgICAgICBwYWdlID0gcGFnZU9iamVjdC5nZXRSYXdQYWdlKCk7XG4gICAgICAgIHBhZ2VIYW5kbGVyLnB1dCgkcGFnZSwge1xuICAgICAgICAgIHR5cGU6ICdjcmVhdGUnLFxuICAgICAgICAgIGlkOiBwYWdlLmlkLFxuICAgICAgICAgIGl0ZW06IHtcbiAgICAgICAgICAgIHRpdGxlOiBwYWdlLnRpdGxlLFxuICAgICAgICAgICAgc3Rvcnk6IHBhZ2Uuc3RvcnlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UuZW1wdHkoKSk7XG4gICAgICB9KTtcbiAgICB9KS5kZWxlZ2F0ZSgnLmdob3N0JywgJ3JldicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkaXRlbSwgJHBhZ2UsIHBvc2l0aW9uO1xuICAgICAgd2lraS5sb2coJ3JldicsIGUpO1xuICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpO1xuICAgICAgJGl0ZW0gPSAkcGFnZS5maW5kKCcudGFyZ2V0Jyk7XG4gICAgICBwb3NpdGlvbiA9ICRpdGVtLm9mZnNldCgpLnRvcCArICRwYWdlLnNjcm9sbFRvcCgpIC0gJHBhZ2UuaGVpZ2h0KCkgLyAyO1xuICAgICAgd2lraS5sb2coJ3Njcm9sbCcsICRwYWdlLCAkaXRlbSwgcG9zaXRpb24pO1xuICAgICAgcmV0dXJuICRwYWdlLnN0b3AoKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiBwb3N0aW9uXG4gICAgICB9LCAnc2xvdycpO1xuICAgIH0pLmRlbGVnYXRlKCcuc2NvcmUnLCAnaG92ZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gJCgnLm1haW4nKS50cmlnZ2VyKCd0aHVtYicsICQoZS50YXJnZXQpLmRhdGEoJ3RodW1iJykpO1xuICAgIH0pO1xuICAgICQoXCIucHJvdmlkZXIgaW5wdXRcIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAkKFwiZm9vdGVyIGlucHV0OmZpcnN0XCIpLnZhbCgkKHRoaXMpLmF0dHIoJ2RhdGEtcHJvdmlkZXInKSk7XG4gICAgICByZXR1cm4gJChcImZvb3RlciBmb3JtXCIpLnN1Ym1pdCgpO1xuICAgIH0pO1xuICAgICQoJ2JvZHknKS5vbignbmV3LW5laWdoYm9yLWRvbmUnLCBmdW5jdGlvbihlLCBuZWlnaGJvcikge1xuICAgICAgcmV0dXJuICQoJy5wYWdlJykuZWFjaChmdW5jdGlvbihpbmRleCwgZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gd2lraS5lbWl0VHdpbnMoJChlbGVtZW50KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gJChmdW5jdGlvbigpIHtcbiAgICAgIHN0YXRlLmZpcnN0KCk7XG4gICAgICAkKCcucGFnZScpLmVhY2gocmVmcmVzaCk7XG4gICAgICByZXR1cm4gYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSk7XG4gICAgfSk7XG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICB2YXIgcDEsIHAyLCBzeW5vcHNpcztcbiAgICBzeW5vcHNpcyA9IHBhZ2Uuc3lub3BzaXM7XG4gICAgaWYgKChwYWdlICE9IG51bGwpICYmIChwYWdlLnN0b3J5ICE9IG51bGwpKSB7XG4gICAgICBwMSA9IHBhZ2Uuc3RvcnlbMF07XG4gICAgICBwMiA9IHBhZ2Uuc3RvcnlbMV07XG4gICAgICBpZiAocDEgJiYgcDEudHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDEudGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAocDIgJiYgcDIudHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDIudGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAocDEgJiYgKHAxLnRleHQgIT0gbnVsbCkpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDEudGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAocDIgJiYgKHAyLnRleHQgIT0gbnVsbCkpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDIudGV4dCk7XG4gICAgICB9XG4gICAgICBzeW5vcHNpcyB8fCAoc3lub3BzaXMgPSAocGFnZS5zdG9yeSAhPSBudWxsKSAmJiAoXCJBIHBhZ2Ugd2l0aCBcIiArIHBhZ2Uuc3RvcnkubGVuZ3RoICsgXCIgaXRlbXMuXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3lub3BzaXMgPSAnQSBwYWdlIHdpdGggbm8gc3RvcnkuJztcbiAgICB9XG4gICAgcmV0dXJuIHN5bm9wc2lzO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG93bmVyKSB7XG4gICAgJChcIiN1c2VyLWVtYWlsXCIpLmhpZGUoKTtcbiAgICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLmhpZGUoKTtcbiAgICAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5oaWRlKCk7XG4gICAgbmF2aWdhdG9yLmlkLndhdGNoKHtcbiAgICAgIGxvZ2dlZEluVXNlcjogb3duZXIsXG4gICAgICBvbmxvZ2luOiBmdW5jdGlvbihhc3NlcnRpb24pIHtcbiAgICAgICAgcmV0dXJuICQucG9zdChcIi9wZXJzb25hX2xvZ2luXCIsIHtcbiAgICAgICAgICBhc3NlcnRpb246IGFzc2VydGlvblxuICAgICAgICB9LCBmdW5jdGlvbih2ZXJpZmllZCkge1xuICAgICAgICAgIHZlcmlmaWVkID0gSlNPTi5wYXJzZSh2ZXJpZmllZCk7XG4gICAgICAgICAgaWYgKFwib2theVwiID09PSB2ZXJpZmllZC5zdGF0dXMpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmF2aWdhdG9yLmlkLmxvZ291dCgpO1xuICAgICAgICAgICAgaWYgKFwid3JvbmctYWRkcmVzc1wiID09PSB2ZXJpZmllZC5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbiA9IFwiL29vcHNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG9ubG9nb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICQucG9zdChcIi9wZXJzb25hX2xvZ291dFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uID0gXCIvXCI7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG9ucmVhZHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAob3duZXIpIHtcbiAgICAgICAgICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLmhpZGUoKTtcbiAgICAgICAgICByZXR1cm4gJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuc2hvdygpO1xuICAgICAgICAgIHJldHVybiAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBuYXZpZ2F0b3IuaWQucmVxdWVzdCh7fSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBuYXZpZ2F0b3IuaWQubG9nb3V0KCk7XG4gICAgfSk7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBhY3RpdmUsIGZpbmRTY3JvbGxDb250YWluZXIsIHNjcm9sbFRvO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gYWN0aXZlID0ge307XG5cbiAgYWN0aXZlLnNjcm9sbENvbnRhaW5lciA9IHZvaWQgMDtcblxuICBmaW5kU2Nyb2xsQ29udGFpbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjcm9sbGVkO1xuICAgIHNjcm9sbGVkID0gJChcImJvZHksIGh0bWxcIikuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICQodGhpcykuc2Nyb2xsTGVmdCgpID4gMDtcbiAgICB9KTtcbiAgICBpZiAoc2Nyb2xsZWQubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHNjcm9sbGVkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJChcImJvZHksIGh0bWxcIikuc2Nyb2xsTGVmdCgxMikuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5zY3JvbGxMZWZ0KCkgPiAwO1xuICAgICAgfSkuc2Nyb2xsVG9wKDApO1xuICAgIH1cbiAgfTtcblxuICBzY3JvbGxUbyA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIGJvZHlXaWR0aCwgY29udGVudFdpZHRoLCBtYXhYLCBtaW5YLCB0YXJnZXQsIHdpZHRoO1xuICAgIGlmIChhY3RpdmUuc2Nyb2xsQ29udGFpbmVyID09IG51bGwpIHtcbiAgICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSBmaW5kU2Nyb2xsQ29udGFpbmVyKCk7XG4gICAgfVxuICAgIGJvZHlXaWR0aCA9ICQoXCJib2R5XCIpLndpZHRoKCk7XG4gICAgbWluWCA9IGFjdGl2ZS5zY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCgpO1xuICAgIG1heFggPSBtaW5YICsgYm9keVdpZHRoO1xuICAgIHRhcmdldCA9IGVsLnBvc2l0aW9uKCkubGVmdDtcbiAgICB3aWR0aCA9IGVsLm91dGVyV2lkdGgodHJ1ZSk7XG4gICAgY29udGVudFdpZHRoID0gJChcIi5wYWdlXCIpLm91dGVyV2lkdGgodHJ1ZSkgKiAkKFwiLnBhZ2VcIikuc2l6ZSgpO1xuICAgIGlmICh0YXJnZXQgPCBtaW5YKSB7XG4gICAgICByZXR1cm4gYWN0aXZlLnNjcm9sbENvbnRhaW5lci5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsTGVmdDogdGFyZ2V0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCArIHdpZHRoID4gbWF4WCkge1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbExlZnQ6IHRhcmdldCAtIChib2R5V2lkdGggLSB3aWR0aClcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAobWF4WCA+ICQoXCIucGFnZXNcIikub3V0ZXJXaWR0aCgpKSB7XG4gICAgICByZXR1cm4gYWN0aXZlLnNjcm9sbENvbnRhaW5lci5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsTGVmdDogTWF0aC5taW4odGFyZ2V0LCBjb250ZW50V2lkdGggLSBib2R5V2lkdGgpXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgYWN0aXZlLnNldCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwgPSAkKGVsKTtcbiAgICAkKFwiLmFjdGl2ZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICByZXR1cm4gc2Nyb2xsVG8oZWwuYWRkQ2xhc3MoXCJhY3RpdmVcIikpO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgdXRpbCwgd2lraTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3aWtpLnV0aWwgPSB1dGlsID0ge307XG5cbiAgdXRpbC5zeW1ib2xzID0ge1xuICAgIGNyZWF0ZTogJ+KYvCcsXG4gICAgYWRkOiAnKycsXG4gICAgZWRpdDogJ+KcjicsXG4gICAgZm9yazogJ+KakScsXG4gICAgbW92ZTogJ+KGlScsXG4gICAgcmVtb3ZlOiAn4pyVJ1xuICB9O1xuXG4gIHV0aWwucmFuZG9tQnl0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xuICB9O1xuXG4gIHV0aWwucmFuZG9tQnl0ZXMgPSBmdW5jdGlvbihuKSB7XG4gICAgcmV0dXJuICgoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX2ksIF9yZXN1bHRzO1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAxOyAxIDw9IG4gPyBfaSA8PSBuIDogX2kgPj0gbjsgMSA8PSBuID8gX2krKyA6IF9pLS0pIHtcbiAgICAgICAgX3Jlc3VsdHMucHVzaCh1dGlsLnJhbmRvbUJ5dGUoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfSkoKSkuam9pbignJyk7XG4gIH07XG5cbiAgdXRpbC5mb3JtYXRUaW1lID0gZnVuY3Rpb24odGltZSkge1xuICAgIHZhciBhbSwgZCwgaCwgbWksIG1vO1xuICAgIGQgPSBuZXcgRGF0ZSgodGltZSA+IDEwMDAwMDAwMDAwID8gdGltZSA6IHRpbWUgKiAxMDAwKSk7XG4gICAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXTtcbiAgICBoID0gZC5nZXRIb3VycygpO1xuICAgIGFtID0gaCA8IDEyID8gJ0FNJyA6ICdQTSc7XG4gICAgaCA9IGggPT09IDAgPyAxMiA6IGggPiAxMiA/IGggLSAxMiA6IGg7XG4gICAgbWkgPSAoZC5nZXRNaW51dGVzKCkgPCAxMCA/IFwiMFwiIDogXCJcIikgKyBkLmdldE1pbnV0ZXMoKTtcbiAgICByZXR1cm4gXCJcIiArIGggKyBcIjpcIiArIG1pICsgXCIgXCIgKyBhbSArIFwiPGJyPlwiICsgKGQuZ2V0RGF0ZSgpKSArIFwiIFwiICsgbW8gKyBcIiBcIiArIChkLmdldEZ1bGxZZWFyKCkpO1xuICB9O1xuXG4gIHV0aWwuZm9ybWF0RGF0ZSA9IGZ1bmN0aW9uKG1zU2luY2VFcG9jaCkge1xuICAgIHZhciBhbSwgZCwgZGF5LCBoLCBtaSwgbW8sIHNlYywgd2ssIHlyO1xuICAgIGQgPSBuZXcgRGF0ZShtc1NpbmNlRXBvY2gpO1xuICAgIHdrID0gWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXVtkLmdldERheSgpXTtcbiAgICBtbyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVtkLmdldE1vbnRoKCldO1xuICAgIGRheSA9IGQuZ2V0RGF0ZSgpO1xuICAgIHlyID0gZC5nZXRGdWxsWWVhcigpO1xuICAgIGggPSBkLmdldEhvdXJzKCk7XG4gICAgYW0gPSBoIDwgMTIgPyAnQU0nIDogJ1BNJztcbiAgICBoID0gaCA9PT0gMCA/IDEyIDogaCA+IDEyID8gaCAtIDEyIDogaDtcbiAgICBtaSA9IChkLmdldE1pbnV0ZXMoKSA8IDEwID8gXCIwXCIgOiBcIlwiKSArIGQuZ2V0TWludXRlcygpO1xuICAgIHNlYyA9IChkLmdldFNlY29uZHMoKSA8IDEwID8gXCIwXCIgOiBcIlwiKSArIGQuZ2V0U2Vjb25kcygpO1xuICAgIHJldHVybiBcIlwiICsgd2sgKyBcIiBcIiArIG1vICsgXCIgXCIgKyBkYXkgKyBcIiwgXCIgKyB5ciArIFwiPGJyPlwiICsgaCArIFwiOlwiICsgbWkgKyBcIjpcIiArIHNlYyArIFwiIFwiICsgYW07XG4gIH07XG5cbiAgdXRpbC5mb3JtYXRFbGFwc2VkVGltZSA9IGZ1bmN0aW9uKG1zU2luY2VFcG9jaCkge1xuICAgIHZhciBkYXlzLCBocnMsIG1pbnMsIG1vbnRocywgbXNlY3MsIHNlY3MsIHdlZWtzLCB5ZWFycztcbiAgICBtc2VjcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbXNTaW5jZUVwb2NoO1xuICAgIGlmICgoc2VjcyA9IG1zZWNzIC8gMTAwMCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKG1zZWNzKSkgKyBcIiBtaWxsaXNlY29uZHMgYWdvXCI7XG4gICAgfVxuICAgIGlmICgobWlucyA9IHNlY3MgLyA2MCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHNlY3MpKSArIFwiIHNlY29uZHMgYWdvXCI7XG4gICAgfVxuICAgIGlmICgoaHJzID0gbWlucyAvIDYwKSA8IDIpIHtcbiAgICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IobWlucykpICsgXCIgbWludXRlcyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKChkYXlzID0gaHJzIC8gMjQpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihocnMpKSArIFwiIGhvdXJzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKHdlZWtzID0gZGF5cyAvIDcpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihkYXlzKSkgKyBcIiBkYXlzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKG1vbnRocyA9IGRheXMgLyAzMSkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHdlZWtzKSkgKyBcIiB3ZWVrcyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKCh5ZWFycyA9IGRheXMgLyAzNjUpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihtb250aHMpKSArIFwiIG1vbnRocyBhZ29cIjtcbiAgICB9XG4gICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcih5ZWFycykpICsgXCIgeWVhcnMgYWdvXCI7XG4gIH07XG5cbiAgdXRpbC5lbXB0eVBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6ICdlbXB0eScsXG4gICAgICBzdG9yeTogW10sXG4gICAgICBqb3VybmFsOiBbXVxuICAgIH07XG4gIH07XG5cbiAgdXRpbC5nZXRTZWxlY3Rpb25Qb3MgPSBmdW5jdGlvbihqUXVlcnlFbGVtZW50KSB7XG4gICAgdmFyIGVsLCBpZVBvcywgc2VsO1xuICAgIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCk7XG4gICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuICAgICAgZWwuZm9jdXMoKTtcbiAgICAgIHNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICAgICAgc2VsLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgLWVsLnZhbHVlLmxlbmd0aCk7XG4gICAgICBpZVBvcyA9IHNlbC50ZXh0Lmxlbmd0aDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiBpZVBvcyxcbiAgICAgICAgZW5kOiBpZVBvc1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IGVsLnNlbGVjdGlvblN0YXJ0LFxuICAgICAgICBlbmQ6IGVsLnNlbGVjdGlvbkVuZFxuICAgICAgfTtcbiAgICB9XG4gIH07XG5cbiAgdXRpbC5zZXRDYXJldFBvc2l0aW9uID0gZnVuY3Rpb24oalF1ZXJ5RWxlbWVudCwgY2FyZXRQb3MpIHtcbiAgICB2YXIgZWwsIHJhbmdlO1xuICAgIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCk7XG4gICAgaWYgKGVsICE9IG51bGwpIHtcbiAgICAgIGlmIChlbC5jcmVhdGVUZXh0UmFuZ2UpIHtcbiAgICAgICAgcmFuZ2UgPSBlbC5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgICAgcmFuZ2UubW92ZShcImNoYXJhY3RlclwiLCBjYXJldFBvcyk7XG4gICAgICAgIHJhbmdlLnNlbGVjdCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UoY2FyZXRQb3MsIGNhcmV0UG9zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbC5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGdldFNjcmlwdCwgcGx1Z2luLCBzY3JpcHRzLCB1dGlsLCB3aWtpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwbHVnaW4gPSB7fTtcblxuICBzY3JpcHRzID0ge307XG5cbiAgZ2V0U2NyaXB0ID0gd2lraS5nZXRTY3JpcHQgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gICAgaWYgKHNjcmlwdHNbdXJsXSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICQuZ2V0U2NyaXB0KHVybCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2NyaXB0c1t1cmxdID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBwbHVnaW4uZ2V0ID0gd2lraS5nZXRQbHVnaW4gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICh3aW5kb3cucGx1Z2luc1tuYW1lXSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFNjcmlwdChcIi9wbHVnaW5zL1wiICsgbmFtZSArIFwiL1wiICsgbmFtZSArIFwiLmpzXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHdpbmRvdy5wbHVnaW5zW25hbWVdKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0U2NyaXB0KFwiL3BsdWdpbnMvXCIgKyBuYW1lICsgXCIuanNcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBwbHVnaW5bXCJkb1wiXSA9IHdpa2kuZG9QbHVnaW4gPSBmdW5jdGlvbihkaXYsIGl0ZW0sIGRvbmUpIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGRvbmUgPT0gbnVsbCkge1xuICAgICAgZG9uZSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICAgIGVycm9yID0gZnVuY3Rpb24oZXgpIHtcbiAgICAgIHZhciBlcnJvckVsZW1lbnQ7XG4gICAgICBlcnJvckVsZW1lbnQgPSAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcygnZXJyb3InKTtcbiAgICAgIGVycm9yRWxlbWVudC50ZXh0KGV4LnRvU3RyaW5nKCkpO1xuICAgICAgcmV0dXJuIGRpdi5hcHBlbmQoZXJyb3JFbGVtZW50KTtcbiAgICB9O1xuICAgIGRpdi5kYXRhKCdwYWdlRWxlbWVudCcsIGRpdi5wYXJlbnRzKFwiLnBhZ2VcIikpO1xuICAgIGRpdi5kYXRhKCdpdGVtJywgaXRlbSk7XG4gICAgcmV0dXJuIHBsdWdpbi5nZXQoaXRlbS50eXBlLCBmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHZhciBlcnI7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2NyaXB0ID09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBmaW5kIHBsdWdpbiBmb3IgJ1wiICsgaXRlbS50eXBlICsgXCInXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY3JpcHQuZW1pdC5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgcmV0dXJuIHNjcmlwdC5lbWl0KGRpdiwgaXRlbSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzY3JpcHQuYmluZChkaXYsIGl0ZW0pO1xuICAgICAgICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY3JpcHQuZW1pdChkaXYsIGl0ZW0pO1xuICAgICAgICAgIHNjcmlwdC5iaW5kKGRpdiwgaXRlbSk7XG4gICAgICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGVyciA9IF9lcnJvcjtcbiAgICAgICAgd2lraS5sb2coJ3BsdWdpbiBlcnJvcicsIGVycik7XG4gICAgICAgIGVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgd2lraS5yZWdpc3RlclBsdWdpbiA9IGZ1bmN0aW9uKHBsdWdpbk5hbWUsIHBsdWdpbkZuKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5wbHVnaW5zW3BsdWdpbk5hbWVdID0gcGx1Z2luRm4oJCk7XG4gIH07XG5cbiAgd2luZG93LnBsdWdpbnMgPSB7XG4gICAgcmVmZXJlbmNlOiByZXF1aXJlKCcuL3JlZmVyZW5jZScpLFxuICAgIGZhY3Rvcnk6IHJlcXVpcmUoJy4vZmFjdG9yeScpLFxuICAgIHBhcmFncmFwaDoge1xuICAgICAgZW1pdDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHZhciB0ZXh0LCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZWYgPSBpdGVtLnRleHQuc3BsaXQoL1xcblxcbisvKTtcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgdGV4dCA9IF9yZWZbX2ldO1xuICAgICAgICAgIGlmICh0ZXh0Lm1hdGNoKC9cXFMvKSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChkaXYuYXBwZW5kKFwiPHA+XCIgKyAod2lraS5yZXNvbHZlTGlua3ModGV4dCkpICsgXCI8L3A+XCIpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9LFxuICAgICAgYmluZDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHJldHVybiBkaXYuZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHdpa2kudGV4dEVkaXRvcihkaXYsIGl0ZW0sIG51bGwsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGltYWdlOiB7XG4gICAgICBlbWl0OiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgICAgaXRlbS50ZXh0IHx8IChpdGVtLnRleHQgPSBpdGVtLmNhcHRpb24pO1xuICAgICAgICByZXR1cm4gZGl2LmFwcGVuZChcIjxpbWcgY2xhc3M9dGh1bWJuYWlsIHNyYz1cXFwiXCIgKyBpdGVtLnVybCArIFwiXFxcIj4gPHA+XCIgKyAod2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0KSkgKyBcIjwvcD5cIik7XG4gICAgICB9LFxuICAgICAgYmluZDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIGRpdi5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKGRpdiwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGl2LmZpbmQoJ2ltZycpLmRibGNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhpdGVtLnRleHQsIHRoaXMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGZ1dHVyZToge1xuICAgICAgZW1pdDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHZhciBpbmZvLCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIGRpdi5hcHBlbmQoXCJcIiArIGl0ZW0udGV4dCArIFwiPGJyPjxicj48YnV0dG9uIGNsYXNzPVxcXCJjcmVhdGVcXFwiPmNyZWF0ZTwvYnV0dG9uPiBuZXcgYmxhbmsgcGFnZVwiKTtcbiAgICAgICAgaWYgKCgoaW5mbyA9IHdpa2kubmVpZ2hib3Job29kW2xvY2F0aW9uLmhvc3RdKSAhPSBudWxsKSAmJiAoaW5mby5zaXRlbWFwICE9IG51bGwpKSB7XG4gICAgICAgICAgX3JlZiA9IGluZm8uc2l0ZW1hcDtcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgICAgaXRlbSA9IF9yZWZbX2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0uc2x1Zy5tYXRjaCgvLXRlbXBsYXRlJC8pKSB7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goZGl2LmFwcGVuZChcIjxicj48YnV0dG9uIGNsYXNzPVxcXCJjcmVhdGVcXFwiIGRhdGEtc2x1Zz1cIiArIGl0ZW0uc2x1ZyArIFwiPmNyZWF0ZTwvYnV0dG9uPiBmcm9tIFwiICsgKHdpa2kucmVzb2x2ZUxpbmtzKFwiW1tcIiArIGl0ZW0udGl0bGUgKyBcIl1dXCIpKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBiaW5kOiBmdW5jdGlvbihkaXYsIGl0ZW0pIHt9XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBzdGF0ZSwgd2lraSxcbiAgICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgYWN0aXZlID0gcmVxdWlyZSgnLi9hY3RpdmUnKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHN0YXRlID0ge307XG5cbiAgc3RhdGUucGFnZXNJbkRvbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkLm1ha2VBcnJheSgkKFwiLnBhZ2VcIikubWFwKGZ1bmN0aW9uKF8sIGVsKSB7XG4gICAgICByZXR1cm4gZWwuaWQ7XG4gICAgfSkpO1xuICB9O1xuXG4gIHN0YXRlLnVybFBhZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGk7XG4gICAgcmV0dXJuICgoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX2ksIF9sZW4sIF9yZWYsIF9yZXN1bHRzO1xuICAgICAgX3JlZiA9ICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKTtcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pICs9IDIpIHtcbiAgICAgICAgaSA9IF9yZWZbX2ldO1xuICAgICAgICBfcmVzdWx0cy5wdXNoKGkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH0pKCkpLnNsaWNlKDEpO1xuICB9O1xuXG4gIHN0YXRlLmxvY3NJbkRvbSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkLm1ha2VBcnJheSgkKFwiLnBhZ2VcIikubWFwKGZ1bmN0aW9uKF8sIGVsKSB7XG4gICAgICByZXR1cm4gJChlbCkuZGF0YSgnc2l0ZScpIHx8ICd2aWV3JztcbiAgICB9KSk7XG4gIH07XG5cbiAgc3RhdGUudXJsTG9jcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBqLCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgX3JlZiA9ICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKS5zbGljZSgxKTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2kgKz0gMikge1xuICAgICAgaiA9IF9yZWZbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChqKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG4gIHN0YXRlLnNldFVybCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpZHgsIGxvY3MsIHBhZ2UsIHBhZ2VzLCB1cmwsIF9yZWY7XG4gICAgZG9jdW1lbnQudGl0bGUgPSAoX3JlZiA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJykpICE9IG51bGwgPyBfcmVmLnRpdGxlIDogdm9pZCAwO1xuICAgIGlmIChoaXN0b3J5ICYmIGhpc3RvcnkucHVzaFN0YXRlKSB7XG4gICAgICBsb2NzID0gc3RhdGUubG9jc0luRG9tKCk7XG4gICAgICBwYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKTtcbiAgICAgIHVybCA9ICgoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgIGZvciAoaWR4ID0gX2kgPSAwLCBfbGVuID0gcGFnZXMubGVuZ3RoOyBfaSA8IF9sZW47IGlkeCA9ICsrX2kpIHtcbiAgICAgICAgICBwYWdlID0gcGFnZXNbaWR4XTtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKFwiL1wiICsgKChsb2NzICE9IG51bGwgPyBsb2NzW2lkeF0gOiB2b2lkIDApIHx8ICd2aWV3JykgKyBcIi9cIiArIHBhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0pKCkpLmpvaW4oJycpO1xuICAgICAgaWYgKHVybCAhPT0gJChsb2NhdGlvbikuYXR0cigncGF0aG5hbWUnKSkge1xuICAgICAgICByZXR1cm4gaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgdXJsKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgc3RhdGUuc2hvdyA9IGZ1bmN0aW9uKGUpIHtcbiAgICB2YXIgaWR4LCBuYW1lLCBuZXdMb2NzLCBuZXdQYWdlcywgb2xkLCBvbGRMb2NzLCBvbGRQYWdlcywgcHJldmlvdXMsIF9pLCBfbGVuLCBfcmVmO1xuICAgIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpO1xuICAgIG5ld1BhZ2VzID0gc3RhdGUudXJsUGFnZXMoKTtcbiAgICBvbGRMb2NzID0gc3RhdGUubG9jc0luRG9tKCk7XG4gICAgbmV3TG9jcyA9IHN0YXRlLnVybExvY3MoKTtcbiAgICBpZiAoIWxvY2F0aW9uLnBhdGhuYW1lIHx8IGxvY2F0aW9uLnBhdGhuYW1lID09PSAnLycpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKDApO1xuICAgIGZvciAoaWR4ID0gX2kgPSAwLCBfbGVuID0gbmV3UGFnZXMubGVuZ3RoOyBfaSA8IF9sZW47IGlkeCA9ICsrX2kpIHtcbiAgICAgIG5hbWUgPSBuZXdQYWdlc1tpZHhdO1xuICAgICAgaWYgKG5hbWUgIT09IG9sZFBhZ2VzW2lkeF0pIHtcbiAgICAgICAgb2xkID0gJCgnLnBhZ2UnKS5lcShpZHgpO1xuICAgICAgICBpZiAob2xkKSB7XG4gICAgICAgICAgb2xkLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHdpa2kuY3JlYXRlUGFnZShuYW1lLCBuZXdMb2NzW2lkeF0pLmluc2VydEFmdGVyKHByZXZpb3VzKS5lYWNoKHdpa2kucmVmcmVzaCk7XG4gICAgICB9XG4gICAgICBwcmV2aW91cyA9ICQoJy5wYWdlJykuZXEoaWR4KTtcbiAgICB9XG4gICAgcHJldmlvdXMubmV4dEFsbCgpLnJlbW92ZSgpO1xuICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIHJldHVybiBkb2N1bWVudC50aXRsZSA9IChfcmVmID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKSkgIT0gbnVsbCA/IF9yZWYudGl0bGUgOiB2b2lkIDA7XG4gIH07XG5cbiAgc3RhdGUuZmlyc3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZmlyc3RVcmxMb2NzLCBmaXJzdFVybFBhZ2VzLCBpZHgsIG9sZFBhZ2VzLCB1cmxQYWdlLCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgc3RhdGUuc2V0VXJsKCk7XG4gICAgZmlyc3RVcmxQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKCk7XG4gICAgZmlyc3RVcmxMb2NzID0gc3RhdGUudXJsTG9jcygpO1xuICAgIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChpZHggPSBfaSA9IDAsIF9sZW4gPSBmaXJzdFVybFBhZ2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBpZHggPSArK19pKSB7XG4gICAgICB1cmxQYWdlID0gZmlyc3RVcmxQYWdlc1tpZHhdO1xuICAgICAgaWYgKF9faW5kZXhPZi5jYWxsKG9sZFBhZ2VzLCB1cmxQYWdlKSA8IDApIHtcbiAgICAgICAgaWYgKHVybFBhZ2UgIT09ICcnKSB7XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaCh3aWtpLmNyZWF0ZVBhZ2UodXJsUGFnZSwgZmlyc3RVcmxMb2NzW2lkeF0pLmFwcGVuZFRvKCcubWFpbicpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgY3JlYXRlO1xuXG4gIGNyZWF0ZSA9IGZ1bmN0aW9uKHJldkluZGV4LCBkYXRhKSB7XG4gICAgdmFyIGFmdGVySW5kZXgsIGVkaXRJbmRleCwgaXRlbUlkLCBpdGVtcywgam91cm5hbCwgam91cm5hbEVudHJ5LCByZW1vdmVJbmRleCwgcmV2Sm91cm5hbCwgcmV2U3RvcnksIHJldlN0b3J5SWRzLCByZXZUaXRsZSwgc3RvcnlJdGVtLCBfaSwgX2osIF9rLCBfbGVuLCBfbGVuMSwgX2xlbjIsIF9yZWY7XG4gICAgam91cm5hbCA9IGRhdGEuam91cm5hbDtcbiAgICByZXZUaXRsZSA9IGRhdGEudGl0bGU7XG4gICAgcmV2U3RvcnkgPSBbXTtcbiAgICByZXZKb3VybmFsID0gam91cm5hbC5zbGljZSgwLCArKCtyZXZJbmRleCkgKyAxIHx8IDllOSk7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSByZXZKb3VybmFsLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBqb3VybmFsRW50cnkgPSByZXZKb3VybmFsW19pXTtcbiAgICAgIHJldlN0b3J5SWRzID0gcmV2U3RvcnkubWFwKGZ1bmN0aW9uKHN0b3J5SXRlbSkge1xuICAgICAgICByZXR1cm4gc3RvcnlJdGVtLmlkO1xuICAgICAgfSk7XG4gICAgICBzd2l0Y2ggKGpvdXJuYWxFbnRyeS50eXBlKSB7XG4gICAgICAgIGNhc2UgJ2NyZWF0ZSc6XG4gICAgICAgICAgaWYgKGpvdXJuYWxFbnRyeS5pdGVtLnRpdGxlICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJldlRpdGxlID0gam91cm5hbEVudHJ5Lml0ZW0udGl0bGU7XG4gICAgICAgICAgICByZXZTdG9yeSA9IGpvdXJuYWxFbnRyeS5pdGVtLnN0b3J5IHx8IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYWRkJzpcbiAgICAgICAgICBpZiAoKGFmdGVySW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mKGpvdXJuYWxFbnRyeS5hZnRlcikpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGFmdGVySW5kZXggKyAxLCAwLCBqb3VybmFsRW50cnkuaXRlbSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldlN0b3J5LnB1c2goam91cm5hbEVudHJ5Lml0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZWRpdCc6XG4gICAgICAgICAgaWYgKChlZGl0SW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mKGpvdXJuYWxFbnRyeS5pZCkpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGVkaXRJbmRleCwgMSwgam91cm5hbEVudHJ5Lml0ZW0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXZTdG9yeS5wdXNoKGpvdXJuYWxFbnRyeS5pdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21vdmUnOlxuICAgICAgICAgIGl0ZW1zID0ge307XG4gICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gcmV2U3RvcnkubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgICAgICBzdG9yeUl0ZW0gPSByZXZTdG9yeVtfal07XG4gICAgICAgICAgICBpdGVtc1tzdG9yeUl0ZW0uaWRdID0gc3RvcnlJdGVtO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXZTdG9yeSA9IFtdO1xuICAgICAgICAgIF9yZWYgPSBqb3VybmFsRW50cnkub3JkZXI7XG4gICAgICAgICAgZm9yIChfayA9IDAsIF9sZW4yID0gX3JlZi5sZW5ndGg7IF9rIDwgX2xlbjI7IF9rKyspIHtcbiAgICAgICAgICAgIGl0ZW1JZCA9IF9yZWZbX2tdO1xuICAgICAgICAgICAgaWYgKGl0ZW1zW2l0ZW1JZF0gIT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXZTdG9yeS5wdXNoKGl0ZW1zW2l0ZW1JZF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVtb3ZlJzpcbiAgICAgICAgICBpZiAoKHJlbW92ZUluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZihqb3VybmFsRW50cnkuaWQpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldlN0b3J5LnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgc3Rvcnk6IHJldlN0b3J5LFxuICAgICAgam91cm5hbDogcmV2Sm91cm5hbCxcbiAgICAgIHRpdGxlOiByZXZUaXRsZVxuICAgIH07XG4gIH07XG5cbiAgZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGU7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBiaW5kLCBlbWl0O1xuXG4gIGVtaXQgPSBmdW5jdGlvbigkaXRlbSwgaXRlbSkge1xuICAgIHZhciBzaXRlLCBzbHVnO1xuICAgIHNsdWcgPSBpdGVtLnNsdWcgfHwgJ3dlbGNvbWUtdmlzaXRvcnMnO1xuICAgIHNpdGUgPSBpdGVtLnNpdGU7XG4gICAgcmV0dXJuIHdpa2kucmVzb2x2ZUZyb20oc2l0ZSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJGl0ZW0uYXBwZW5kKFwiPHAgc3R5bGU9J21hcmdpbi1ib3R0b206M3B4Oyc+XFxuICA8aW1nIGNsYXNzPSdyZW1vdGUnXFxuICAgIHNyYz0nLy9cIiArIHNpdGUgKyBcIi9mYXZpY29uLnBuZydcXG4gICAgdGl0bGU9J1wiICsgc2l0ZSArIFwiJ1xcbiAgICBkYXRhLXNpdGU9XFxcIlwiICsgc2l0ZSArIFwiXFxcIlxcbiAgICBkYXRhLXNsdWc9XFxcIlwiICsgc2x1ZyArIFwiXFxcIlxcbiAgPlxcbiAgXCIgKyAod2lraS5yZXNvbHZlTGlua3MoXCJbW1wiICsgKGl0ZW0udGl0bGUgfHwgc2x1ZykgKyBcIl1dXCIpKSArIFwiXFxuPC9wPlxcbjxkaXY+XFxuICBcIiArICh3aWtpLnJlc29sdmVMaW5rcyhpdGVtLnRleHQpKSArIFwiXFxuPC9kaXY+XCIpO1xuICAgIH0pO1xuICB9O1xuXG4gIGJpbmQgPSBmdW5jdGlvbigkaXRlbSwgaXRlbSkge1xuICAgIHJldHVybiAkaXRlbS5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB3aWtpLnRleHRFZGl0b3IoJGl0ZW0sIGl0ZW0pO1xuICAgIH0pO1xuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIGVtaXQ6IGVtaXQsXG4gICAgYmluZDogYmluZFxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYXJyYXlUb0pzb24sIGJpbmQsIGNzdlRvQXJyYXksIGVtaXQsXG4gICAgX19pbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHsgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTsgfSByZXR1cm4gLTE7IH07XG5cbiAgZW1pdCA9IGZ1bmN0aW9uKGRpdiwgaXRlbSkge1xuICAgIHZhciBzaG93TWVudSwgc2hvd1Byb21wdDtcbiAgICBkaXYuYXBwZW5kKCc8cD5Eb3VibGUtQ2xpY2sgdG8gRWRpdDxicj5Ecm9wIFRleHQgb3IgSW1hZ2UgdG8gSW5zZXJ0PC9wPicpO1xuICAgIHNob3dNZW51ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaW5mbywgbWVudSwgbWVudUl0ZW0sIG5hbWUsIF9pLCBfbGVuLCBfcmVmLCBfcmVmMTtcbiAgICAgIG1lbnUgPSBkaXYuZmluZCgncCcpLmFwcGVuZChcIjxicj5PciBDaG9vc2UgYSBQbHVnaW5cIik7XG4gICAgICBtZW51SXRlbSA9IGZ1bmN0aW9uKHRpdGxlLCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBtZW51LmFwcGVuZChcIjxsaT48YSBjbGFzcz1cXFwibWVudVxcXCIgaHJlZj1cXFwiI1xcXCIgdGl0bGU9XFxcIlwiICsgdGl0bGUgKyBcIlxcXCI+XCIgKyBuYW1lICsgXCI8L2E+PC9saT5cIik7XG4gICAgICB9O1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkod2luZG93LmNhdGFsb2cpKSB7XG4gICAgICAgIF9yZWYgPSB3aW5kb3cuY2F0YWxvZztcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgaW5mbyA9IF9yZWZbX2ldO1xuICAgICAgICAgIG1lbnVJdGVtKGluZm8udGl0bGUsIGluZm8ubmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9yZWYxID0gd2luZG93LmNhdGFsb2c7XG4gICAgICAgIGZvciAobmFtZSBpbiBfcmVmMSkge1xuICAgICAgICAgIGluZm8gPSBfcmVmMVtuYW1lXTtcbiAgICAgICAgICBtZW51SXRlbShpbmZvLm1lbnUsIG5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVudS5maW5kKCdhLm1lbnUnKS5jbGljayhmdW5jdGlvbihldnQpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNsYXNzKCdmYWN0b3J5JykuYWRkQ2xhc3MoaXRlbS50eXBlID0gZXZ0LnRhcmdldC50ZXh0LnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBkaXYudW5iaW5kKCk7XG4gICAgICAgIHJldHVybiB3aWtpLnRleHRFZGl0b3IoZGl2LCBpdGVtKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgc2hvd1Byb21wdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRpdi5hcHBlbmQoXCI8cD5cIiArICh3aWtpLnJlc29sdmVMaW5rcyhpdGVtLnByb21wdCkpICsgXCI8L2I+XCIpO1xuICAgIH07XG4gICAgaWYgKGl0ZW0ucHJvbXB0KSB7XG4gICAgICByZXR1cm4gc2hvd1Byb21wdCgpO1xuICAgIH0gZWxzZSBpZiAod2luZG93LmNhdGFsb2cgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHNob3dNZW51KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAkLmdldEpTT04oJy9zeXN0ZW0vZmFjdG9yaWVzLmpzb24nLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHdpbmRvdy5jYXRhbG9nID0gZGF0YTtcbiAgICAgICAgcmV0dXJuIHNob3dNZW51KCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgYmluZCA9IGZ1bmN0aW9uKGRpdiwgaXRlbSkge1xuICAgIHZhciBzeW5jRWRpdEFjdGlvbjtcbiAgICBzeW5jRWRpdEFjdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGVyciwgcGFnZUVsZW1lbnQ7XG4gICAgICB3aWtpLmxvZygnZmFjdG9yeSBpdGVtJywgaXRlbSk7XG4gICAgICBkaXYuZW1wdHkoKS51bmJpbmQoKTtcbiAgICAgIGRpdi5yZW1vdmVDbGFzcyhcImZhY3RvcnlcIikuYWRkQ2xhc3MoaXRlbS50eXBlKTtcbiAgICAgIHBhZ2VFbGVtZW50ID0gZGl2LnBhcmVudHMoJy5wYWdlOmZpcnN0Jyk7XG4gICAgICB0cnkge1xuICAgICAgICBkaXYuZGF0YSgncGFnZUVsZW1lbnQnLCBwYWdlRWxlbWVudCk7XG4gICAgICAgIGRpdi5kYXRhKCdpdGVtJywgaXRlbSk7XG4gICAgICAgIHdpa2kuZ2V0UGx1Z2luKGl0ZW0udHlwZSwgZnVuY3Rpb24ocGx1Z2luKSB7XG4gICAgICAgICAgcGx1Z2luLmVtaXQoZGl2LCBpdGVtKTtcbiAgICAgICAgICByZXR1cm4gcGx1Z2luLmJpbmQoZGl2LCBpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgZXJyID0gX2Vycm9yO1xuICAgICAgICBkaXYuYXBwZW5kKFwiPHAgY2xhc3M9J2Vycm9yJz5cIiArIGVyciArIFwiPC9wPlwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB3aWtpLnBhZ2VIYW5kbGVyLnB1dChwYWdlRWxlbWVudCwge1xuICAgICAgICB0eXBlOiAnZWRpdCcsXG4gICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICBpdGVtOiBpdGVtXG4gICAgICB9KTtcbiAgICB9O1xuICAgIGRpdi5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgIGRpdi5yZW1vdmVDbGFzcygnZmFjdG9yeScpLmFkZENsYXNzKGl0ZW0udHlwZSA9ICdwYXJhZ3JhcGgnKTtcbiAgICAgIGRpdi51bmJpbmQoKTtcbiAgICAgIHJldHVybiB3aWtpLnRleHRFZGl0b3IoZGl2LCBpdGVtKTtcbiAgICB9KTtcbiAgICBkaXYuYmluZCgnZHJhZ2VudGVyJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICByZXR1cm4gZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG4gICAgZGl2LmJpbmQoJ2RyYWdvdmVyJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgICByZXR1cm4gZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRpdi5iaW5kKFwiZHJvcFwiLCBmdW5jdGlvbihkcm9wRXZlbnQpIHtcbiAgICAgIHZhciBkdCwgZm91bmQsIGlnbm9yZSwgb3JpZ2luLCBwdW50LCByZWFkRmlsZSwgdXJsO1xuICAgICAgcHVudCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaXRlbS5wcm9tcHQgPSBcIjxiPlVuZXhwZWN0ZWQgSXRlbTwvYj48YnI+V2UgY2FuJ3QgbWFrZSBzZW5zZSBvZiB0aGUgZHJvcC48YnI+XCIgKyAoSlNPTi5zdHJpbmdpZnkoZGF0YSkpICsgXCI8YnI+VHJ5IHNvbWV0aGluZyBlbHNlIG9yIHNlZSBbW0Fib3V0IEZhY3RvcnkgUGx1Z2luXV0uXCI7XG4gICAgICAgIGRhdGEudXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICAgICAgaXRlbS5wdW50ID0gZGF0YTtcbiAgICAgICAgd2lraS5sb2coJ2ZhY3RvcnkgcHVudCcsIGRyb3BFdmVudCk7XG4gICAgICAgIHJldHVybiBzeW5jRWRpdEFjdGlvbigpO1xuICAgICAgfTtcbiAgICAgIHJlYWRGaWxlID0gZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICB2YXIgbWFqb3JUeXBlLCBtaW5vclR5cGUsIHJlYWRlciwgX3JlZjtcbiAgICAgICAgaWYgKGZpbGUgIT0gbnVsbCkge1xuICAgICAgICAgIF9yZWYgPSBmaWxlLnR5cGUuc3BsaXQoXCIvXCIpLCBtYWpvclR5cGUgPSBfcmVmWzBdLCBtaW5vclR5cGUgPSBfcmVmWzFdO1xuICAgICAgICAgIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgaWYgKG1ham9yVHlwZSA9PT0gXCJpbWFnZVwiKSB7XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24obG9hZEV2ZW50KSB7XG4gICAgICAgICAgICAgIGl0ZW0udHlwZSA9ICdpbWFnZSc7XG4gICAgICAgICAgICAgIGl0ZW0udXJsID0gbG9hZEV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgIGl0ZW0uY2FwdGlvbiB8fCAoaXRlbS5jYXB0aW9uID0gXCJVcGxvYWRlZCBpbWFnZVwiKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHN5bmNFZGl0QWN0aW9uKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobWFqb3JUeXBlID09PSBcInRleHRcIikge1xuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGxvYWRFdmVudCkge1xuICAgICAgICAgICAgICB2YXIgYXJyYXksIHJlc3VsdDtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gbG9hZEV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICAgIGlmIChtaW5vclR5cGUgPT09ICdjc3YnKSB7XG4gICAgICAgICAgICAgICAgaXRlbS50eXBlID0gJ2RhdGEnO1xuICAgICAgICAgICAgICAgIGl0ZW0uY29sdW1ucyA9IChhcnJheSA9IGNzdlRvQXJyYXkocmVzdWx0KSlbMF07XG4gICAgICAgICAgICAgICAgaXRlbS5kYXRhID0gYXJyYXlUb0pzb24oYXJyYXkpO1xuICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IGZpbGUuZmlsZU5hbWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaXRlbS50eXBlID0gJ3BhcmFncmFwaCc7XG4gICAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBzeW5jRWRpdEFjdGlvbigpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiByZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHB1bnQoe1xuICAgICAgICAgICAgICBudW1iZXI6IDEsXG4gICAgICAgICAgICAgIG5hbWU6IGZpbGUuZmlsZU5hbWUsXG4gICAgICAgICAgICAgIHR5cGU6IGZpbGUudHlwZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwdW50KHtcbiAgICAgICAgICAgIG51bWJlcjogMixcbiAgICAgICAgICAgIHR5cGVzOiBkcm9wRXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIudHlwZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGRyb3BFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgaWYgKChkdCA9IGRyb3BFdmVudC5vcmlnaW5hbEV2ZW50LmRhdGFUcmFuc2ZlcikgIT0gbnVsbCkge1xuICAgICAgICBpZiAoKGR0LnR5cGVzICE9IG51bGwpICYmIChfX2luZGV4T2YuY2FsbChkdC50eXBlcywgJ3RleHQvdXJpLWxpc3QnKSA+PSAwIHx8IF9faW5kZXhPZi5jYWxsKGR0LnR5cGVzLCAndGV4dC94LW1vei11cmwnKSA+PSAwKSAmJiAhKF9faW5kZXhPZi5jYWxsKGR0LnR5cGVzLCAnRmlsZXMnKSA+PSAwKSkge1xuICAgICAgICAgIHVybCA9IGR0LmdldERhdGEoJ1VSTCcpO1xuICAgICAgICAgIGlmIChmb3VuZCA9IHVybC5tYXRjaCgvXmh0dHA6XFwvXFwvKFthLXpBLVowLTk6Li1dKykoXFwvKFthLXpBLVowLTk6Li1dKylcXC8oW2EtejAtOS1dKyhfcmV2XFxkKyk/KSkrJC8pKSB7XG4gICAgICAgICAgICB3aWtpLmxvZygnZmFjdG9yeSBkcm9wIHVybCcsIGZvdW5kKTtcbiAgICAgICAgICAgIGlnbm9yZSA9IGZvdW5kWzBdLCBvcmlnaW4gPSBmb3VuZFsxXSwgaWdub3JlID0gZm91bmRbMl0sIGl0ZW0uc2l0ZSA9IGZvdW5kWzNdLCBpdGVtLnNsdWcgPSBmb3VuZFs0XSwgaWdub3JlID0gZm91bmRbNV07XG4gICAgICAgICAgICBpZiAoJC5pbkFycmF5KGl0ZW0uc2l0ZSwgWyd2aWV3JywgJ2xvY2FsJywgJ29yaWdpbiddKSA+PSAwKSB7XG4gICAgICAgICAgICAgIGl0ZW0uc2l0ZSA9IG9yaWdpbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkLmdldEpTT04oXCJodHRwOi8vXCIgKyBpdGVtLnNpdGUgKyBcIi9cIiArIGl0ZW0uc2x1ZyArIFwiLmpzb25cIiwgZnVuY3Rpb24ocmVtb3RlKSB7XG4gICAgICAgICAgICAgIHdpa2kubG9nKCdmYWN0b3J5IHJlbW90ZScsIHJlbW90ZSk7XG4gICAgICAgICAgICAgIGl0ZW0udHlwZSA9ICdyZWZlcmVuY2UnO1xuICAgICAgICAgICAgICBpdGVtLnRpdGxlID0gcmVtb3RlLnRpdGxlIHx8IGl0ZW0uc2x1ZztcbiAgICAgICAgICAgICAgaXRlbS50ZXh0ID0gd2lraS5jcmVhdGVTeW5vcHNpcyhyZW1vdGUpO1xuICAgICAgICAgICAgICBzeW5jRWRpdEFjdGlvbigpO1xuICAgICAgICAgICAgICBpZiAoaXRlbS5zaXRlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd2lraS5yZWdpc3Rlck5laWdoYm9yKGl0ZW0uc2l0ZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcHVudCh7XG4gICAgICAgICAgICAgIG51bWJlcjogNCxcbiAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgIHR5cGVzOiBkdC50eXBlc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKF9faW5kZXhPZi5jYWxsKGR0LnR5cGVzLCAnRmlsZXMnKSA+PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHJlYWRGaWxlKGR0LmZpbGVzWzBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcHVudCh7XG4gICAgICAgICAgICBudW1iZXI6IDUsXG4gICAgICAgICAgICB0eXBlczogZHQudHlwZXNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHB1bnQoe1xuICAgICAgICAgIG51bWJlcjogNixcbiAgICAgICAgICB0cm91YmxlOiBcIm5vIGRhdGEgdHJhbnNmZXIgb2JqZWN0XCJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgY3N2VG9BcnJheSA9IGZ1bmN0aW9uKHN0ckRhdGEsIHN0ckRlbGltaXRlcikge1xuICAgIHZhciBhcnJEYXRhLCBhcnJNYXRjaGVzLCBvYmpQYXR0ZXJuLCBzdHJNYXRjaGVkRGVsaW1pdGVyLCBzdHJNYXRjaGVkVmFsdWU7XG4gICAgc3RyRGVsaW1pdGVyID0gc3RyRGVsaW1pdGVyIHx8IFwiLFwiO1xuICAgIG9ialBhdHRlcm4gPSBuZXcgUmVnRXhwKFwiKFxcXFxcIiArIHN0ckRlbGltaXRlciArIFwifFxcXFxyP1xcXFxufFxcXFxyfF4pXCIgKyBcIig/OlxcXCIoW15cXFwiXSooPzpcXFwiXFxcIlteXFxcIl0qKSopXFxcInxcIiArIFwiKFteXFxcIlxcXFxcIiArIHN0ckRlbGltaXRlciArIFwiXFxcXHJcXFxcbl0qKSlcIiwgXCJnaVwiKTtcbiAgICBhcnJEYXRhID0gW1tdXTtcbiAgICBhcnJNYXRjaGVzID0gbnVsbDtcbiAgICB3aGlsZSAoYXJyTWF0Y2hlcyA9IG9ialBhdHRlcm4uZXhlYyhzdHJEYXRhKSkge1xuICAgICAgc3RyTWF0Y2hlZERlbGltaXRlciA9IGFyck1hdGNoZXNbMV07XG4gICAgICBpZiAoc3RyTWF0Y2hlZERlbGltaXRlci5sZW5ndGggJiYgKHN0ck1hdGNoZWREZWxpbWl0ZXIgIT09IHN0ckRlbGltaXRlcikpIHtcbiAgICAgICAgYXJyRGF0YS5wdXNoKFtdKTtcbiAgICAgIH1cbiAgICAgIGlmIChhcnJNYXRjaGVzWzJdKSB7XG4gICAgICAgIHN0ck1hdGNoZWRWYWx1ZSA9IGFyck1hdGNoZXNbMl0ucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcIlxcXCJcIiwgXCJnXCIpLCBcIlxcXCJcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWzNdO1xuICAgICAgfVxuICAgICAgYXJyRGF0YVthcnJEYXRhLmxlbmd0aCAtIDFdLnB1c2goc3RyTWF0Y2hlZFZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGFyckRhdGE7XG4gIH07XG5cbiAgYXJyYXlUb0pzb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciBjb2xzLCByb3csIHJvd1RvT2JqZWN0LCBfaSwgX2xlbiwgX3Jlc3VsdHM7XG4gICAgY29scyA9IGFycmF5LnNoaWZ0KCk7XG4gICAgcm93VG9PYmplY3QgPSBmdW5jdGlvbihyb3cpIHtcbiAgICAgIHZhciBrLCBvYmosIHYsIF9pLCBfbGVuLCBfcmVmLCBfcmVmMTtcbiAgICAgIG9iaiA9IHt9O1xuICAgICAgX3JlZiA9IF8uemlwKGNvbHMsIHJvdyk7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgX3JlZjEgPSBfcmVmW19pXSwgayA9IF9yZWYxWzBdLCB2ID0gX3JlZjFbMV07XG4gICAgICAgIGlmICgodiAhPSBudWxsKSAmJiAodi5tYXRjaCgvXFxTLykpICYmIHYgIT09ICdOVUxMJykge1xuICAgICAgICAgIG9ialtrXSA9IHY7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBvYmo7XG4gICAgfTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gYXJyYXkubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIHJvdyA9IGFycmF5W19pXTtcbiAgICAgIF9yZXN1bHRzLnB1c2gocm93VG9PYmplY3Qocm93KSk7XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBlbWl0OiBlbWl0LFxuICAgIGJpbmQ6IGJpbmRcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIHV0aWw7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oam91cm5hbEVsZW1lbnQsIGFjdGlvbikge1xuICAgIHZhciBhY3Rpb25FbGVtZW50LCBhY3Rpb25UaXRsZSwgY29udHJvbHMsIHBhZ2VFbGVtZW50O1xuICAgIHBhZ2VFbGVtZW50ID0gam91cm5hbEVsZW1lbnQucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICBhY3Rpb25UaXRsZSA9IGFjdGlvbi50eXBlIHx8ICdzZXBhcmF0b3InO1xuICAgIGlmIChhY3Rpb24uZGF0ZSAhPSBudWxsKSB7XG4gICAgICBhY3Rpb25UaXRsZSArPSBcIiBcIiArICh1dGlsLmZvcm1hdEVsYXBzZWRUaW1lKGFjdGlvbi5kYXRlKSk7XG4gICAgfVxuICAgIGFjdGlvbkVsZW1lbnQgPSAkKFwiPGEgaHJlZj1cXFwiI1xcXCIgLz4gXCIpLmFkZENsYXNzKFwiYWN0aW9uXCIpLmFkZENsYXNzKGFjdGlvbi50eXBlIHx8ICdzZXBhcmF0b3InKS50ZXh0KGFjdGlvbi5zeW1ib2wgfHwgdXRpbC5zeW1ib2xzW2FjdGlvbi50eXBlXSkuYXR0cigndGl0bGUnLCBhY3Rpb25UaXRsZSkuYXR0cignZGF0YS1pZCcsIGFjdGlvbi5pZCB8fCBcIjBcIikuZGF0YSgnYWN0aW9uJywgYWN0aW9uKTtcbiAgICBjb250cm9scyA9IGpvdXJuYWxFbGVtZW50LmNoaWxkcmVuKCcuY29udHJvbC1idXR0b25zJyk7XG4gICAgaWYgKGNvbnRyb2xzLmxlbmd0aCA+IDApIHtcbiAgICAgIGFjdGlvbkVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbnRyb2xzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWN0aW9uRWxlbWVudC5hcHBlbmRUbyhqb3VybmFsRWxlbWVudCk7XG4gICAgfVxuICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ2ZvcmsnICYmIChhY3Rpb24uc2l0ZSAhPSBudWxsKSkge1xuICAgICAgcmV0dXJuIGFjdGlvbkVsZW1lbnQuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLCBcInVybCgvL1wiICsgYWN0aW9uLnNpdGUgKyBcIi9mYXZpY29uLnBuZylcIikuYXR0cihcImhyZWZcIiwgXCIvL1wiICsgYWN0aW9uLnNpdGUgKyBcIi9cIiArIChwYWdlRWxlbWVudC5hdHRyKCdpZCcpKSArIFwiLmh0bWxcIikuZGF0YShcInNpdGVcIiwgYWN0aW9uLnNpdGUpLmRhdGEoXCJzbHVnXCIsIHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykpO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFkZFRvSm91cm5hbCwgbmV3UGFnZSwgcGFnZUZyb21Mb2NhbFN0b3JhZ2UsIHBhZ2VIYW5kbGVyLCBwdXNoVG9Mb2NhbCwgcHVzaFRvU2VydmVyLCByZWN1cnNpdmVHZXQsIHJldmlzaW9uLCBzdGF0ZSwgdXRpbCwgd2lraSwgXztcblxuICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4gIHdpa2kgPSByZXF1aXJlKCcuL3dpa2knKTtcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlJyk7XG5cbiAgcmV2aXNpb24gPSByZXF1aXJlKCcuL3JldmlzaW9uJyk7XG5cbiAgYWRkVG9Kb3VybmFsID0gcmVxdWlyZSgnLi9hZGRUb0pvdXJuYWwnKTtcblxuICBuZXdQYWdlID0gcmVxdWlyZSgnLi9wYWdlJykubmV3UGFnZTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHBhZ2VIYW5kbGVyID0ge307XG5cbiAgcGFnZUZyb21Mb2NhbFN0b3JhZ2UgPSBmdW5jdGlvbihzbHVnKSB7XG4gICAgdmFyIGpzb247XG4gICAgaWYgKGpzb24gPSBsb2NhbFN0b3JhZ2Vbc2x1Z10pIHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKGpzb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgfTtcblxuICByZWN1cnNpdmVHZXQgPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgdmFyIGxvY2FsQ29udGV4dCwgbG9jYWxQYWdlLCBwYWdlSW5mb3JtYXRpb24sIHJldiwgc2l0ZSwgc2x1ZywgdXJsLCB3aGVuR290dGVuLCB3aGVuTm90R290dGVuO1xuICAgIHBhZ2VJbmZvcm1hdGlvbiA9IF9hcmcucGFnZUluZm9ybWF0aW9uLCB3aGVuR290dGVuID0gX2FyZy53aGVuR290dGVuLCB3aGVuTm90R290dGVuID0gX2FyZy53aGVuTm90R290dGVuLCBsb2NhbENvbnRleHQgPSBfYXJnLmxvY2FsQ29udGV4dDtcbiAgICBzbHVnID0gcGFnZUluZm9ybWF0aW9uLnNsdWcsIHJldiA9IHBhZ2VJbmZvcm1hdGlvbi5yZXYsIHNpdGUgPSBwYWdlSW5mb3JtYXRpb24uc2l0ZTtcbiAgICBpZiAoc2l0ZSkge1xuICAgICAgbG9jYWxDb250ZXh0ID0gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHNpdGUgPSBsb2NhbENvbnRleHQuc2hpZnQoKTtcbiAgICB9XG4gICAgaWYgKHNpdGUgPT09IHdpbmRvdy5sb2NhdGlvbi5ob3N0KSB7XG4gICAgICBzaXRlID0gJ29yaWdpbic7XG4gICAgfVxuICAgIGlmIChzaXRlID09PSAndmlldycpIHtcbiAgICAgIHNpdGUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoc2l0ZSAhPSBudWxsKSB7XG4gICAgICBpZiAoc2l0ZSA9PT0gJ2xvY2FsJykge1xuICAgICAgICBpZiAobG9jYWxQYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZUluZm9ybWF0aW9uLnNsdWcpKSB7XG4gICAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4obmV3UGFnZShsb2NhbFBhZ2UsICdsb2NhbCcpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gd2hlbk5vdEdvdHRlbigpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2l0ZSA9PT0gJ29yaWdpbicpIHtcbiAgICAgICAgICB1cmwgPSBcIi9cIiArIHNsdWcgKyBcIi5qc29uXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXJsID0gXCJodHRwOi8vXCIgKyBzaXRlICsgXCIvXCIgKyBzbHVnICsgXCIuanNvblwiO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybCA9IFwiL1wiICsgc2x1ZyArIFwiLmpzb25cIjtcbiAgICB9XG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICB0eXBlOiAnR0VUJyxcbiAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICB1cmw6IHVybCArIChcIj9yYW5kb209XCIgKyAodXRpbC5yYW5kb21CeXRlcyg0KSkpLFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24ocGFnZSkge1xuICAgICAgICBpZiAocmV2KSB7XG4gICAgICAgICAgcGFnZSA9IHJldmlzaW9uLmNyZWF0ZShyZXYsIHBhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3aGVuR290dGVuKG5ld1BhZ2UocGFnZSwgc2l0ZSkpO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbih4aHIsIHR5cGUsIG1zZykge1xuICAgICAgICB2YXIgcmVwb3J0O1xuICAgICAgICBpZiAoKHhoci5zdGF0dXMgIT09IDQwNCkgJiYgKHhoci5zdGF0dXMgIT09IDApKSB7XG4gICAgICAgICAgd2lraS5sb2coJ3BhZ2VIYW5kbGVyLmdldCBlcnJvcicsIHhociwgeGhyLnN0YXR1cywgdHlwZSwgbXNnKTtcbiAgICAgICAgICByZXBvcnQgPSB7XG4gICAgICAgICAgICAndGl0bGUnOiBcIlwiICsgeGhyLnN0YXR1cyArIFwiIFwiICsgbXNnLFxuICAgICAgICAgICAgJ3N0b3J5JzogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJ3R5cGUnOiAncGFyYWdyYXBoJyxcbiAgICAgICAgICAgICAgICAnaWQnOiAnOTI4NzM5MTg3MjQzJyxcbiAgICAgICAgICAgICAgICAndGV4dCc6IFwiPHByZT5cIiArIHhoci5yZXNwb25zZVRleHRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH07XG4gICAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4ocmVwb3J0LCAnbG9jYWwnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobG9jYWxDb250ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gcmVjdXJzaXZlR2V0KHtcbiAgICAgICAgICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uLFxuICAgICAgICAgICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlbixcbiAgICAgICAgICAgIHdoZW5Ob3RHb3R0ZW46IHdoZW5Ob3RHb3R0ZW4sXG4gICAgICAgICAgICBsb2NhbENvbnRleHQ6IGxvY2FsQ29udGV4dFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB3aGVuTm90R290dGVuKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBwYWdlSGFuZGxlci5nZXQgPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgdmFyIGxvY2FsUGFnZSwgcGFnZUluZm9ybWF0aW9uLCB3aGVuR290dGVuLCB3aGVuTm90R290dGVuO1xuICAgIHdoZW5Hb3R0ZW4gPSBfYXJnLndoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW4gPSBfYXJnLndoZW5Ob3RHb3R0ZW4sIHBhZ2VJbmZvcm1hdGlvbiA9IF9hcmcucGFnZUluZm9ybWF0aW9uO1xuICAgIGlmICghcGFnZUluZm9ybWF0aW9uLnNpdGUpIHtcbiAgICAgIGlmIChsb2NhbFBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlSW5mb3JtYXRpb24uc2x1ZykpIHtcbiAgICAgICAgaWYgKHBhZ2VJbmZvcm1hdGlvbi5yZXYpIHtcbiAgICAgICAgICBsb2NhbFBhZ2UgPSByZXZpc2lvbi5jcmVhdGUocGFnZUluZm9ybWF0aW9uLnJldiwgbG9jYWxQYWdlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2hlbkdvdHRlbihuZXdQYWdlKGxvY2FsUGFnZSwgJ2xvY2FsJykpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXBhZ2VIYW5kbGVyLmNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyd2aWV3J107XG4gICAgfVxuICAgIHJldHVybiByZWN1cnNpdmVHZXQoe1xuICAgICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb24sXG4gICAgICB3aGVuR290dGVuOiB3aGVuR290dGVuLFxuICAgICAgd2hlbk5vdEdvdHRlbjogd2hlbk5vdEdvdHRlbixcbiAgICAgIGxvY2FsQ29udGV4dDogXy5jbG9uZShwYWdlSGFuZGxlci5jb250ZXh0KVxuICAgIH0pO1xuICB9O1xuXG4gIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbXTtcblxuICBwdXNoVG9Mb2NhbCA9IGZ1bmN0aW9uKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKSB7XG4gICAgdmFyIHBhZ2UsIHNpdGU7XG4gICAgaWYgKGFjdGlvbi50eXBlID09PSAnY3JlYXRlJykge1xuICAgICAgcGFnZSA9IHtcbiAgICAgICAgdGl0bGU6IGFjdGlvbi5pdGVtLnRpdGxlLFxuICAgICAgICBzdG9yeTogW10sXG4gICAgICAgIGpvdXJuYWw6IFtdXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBwYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZVB1dEluZm8uc2x1Zyk7XG4gICAgICBwYWdlIHx8IChwYWdlID0gcGFnZUVsZW1lbnQuZGF0YShcImRhdGFcIikpO1xuICAgICAgaWYgKHBhZ2Uuam91cm5hbCA9PSBudWxsKSB7XG4gICAgICAgIHBhZ2Uuam91cm5hbCA9IFtdO1xuICAgICAgfVxuICAgICAgaWYgKChzaXRlID0gYWN0aW9uWydmb3JrJ10pICE9IG51bGwpIHtcbiAgICAgICAgcGFnZS5qb3VybmFsID0gcGFnZS5qb3VybmFsLmNvbmNhdCh7XG4gICAgICAgICAgJ3R5cGUnOiAnZm9yaycsXG4gICAgICAgICAgJ3NpdGUnOiBzaXRlXG4gICAgICAgIH0pO1xuICAgICAgICBkZWxldGUgYWN0aW9uWydmb3JrJ107XG4gICAgICB9XG4gICAgICBwYWdlLnN0b3J5ID0gJChwYWdlRWxlbWVudCkuZmluZChcIi5pdGVtXCIpLm1hcChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YShcIml0ZW1cIik7XG4gICAgICB9KS5nZXQoKTtcbiAgICB9XG4gICAgcGFnZS5qb3VybmFsID0gcGFnZS5qb3VybmFsLmNvbmNhdChhY3Rpb24pO1xuICAgIGxvY2FsU3RvcmFnZVtwYWdlUHV0SW5mby5zbHVnXSA9IEpTT04uc3RyaW5naWZ5KHBhZ2UpO1xuICAgIHJldHVybiBhZGRUb0pvdXJuYWwocGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwgYWN0aW9uKTtcbiAgfTtcblxuICBwdXNoVG9TZXJ2ZXIgPSBmdW5jdGlvbihwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbikge1xuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgdHlwZTogJ1BVVCcsXG4gICAgICB1cmw6IFwiL3BhZ2UvXCIgKyBwYWdlUHV0SW5mby5zbHVnICsgXCIvYWN0aW9uXCIsXG4gICAgICBkYXRhOiB7XG4gICAgICAgICdhY3Rpb24nOiBKU09OLnN0cmluZ2lmeShhY3Rpb24pXG4gICAgICB9LFxuICAgICAgc3VjY2VzczogZnVuY3Rpb24oKSB7XG4gICAgICAgIGFkZFRvSm91cm5hbChwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCBhY3Rpb24pO1xuICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdmb3JrJykge1xuICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykpO1xuICAgICAgICAgIHJldHVybiBzdGF0ZS5zZXRVcmw7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oeGhyLCB0eXBlLCBtc2cpIHtcbiAgICAgICAgcmV0dXJuIHdpa2kubG9nKFwicGFnZUhhbmRsZXIucHV0IGFqYXggZXJyb3IgY2FsbGJhY2tcIiwgdHlwZSwgbXNnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBwYWdlSGFuZGxlci5wdXQgPSBmdW5jdGlvbihwYWdlRWxlbWVudCwgYWN0aW9uKSB7XG4gICAgdmFyIGNoZWNrZWRTaXRlLCBmb3JrRnJvbSwgcGFnZVB1dEluZm87XG4gICAgY2hlY2tlZFNpdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBzaXRlO1xuICAgICAgc3dpdGNoIChzaXRlID0gcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpKSB7XG4gICAgICAgIGNhc2UgJ29yaWdpbic6XG4gICAgICAgIGNhc2UgJ2xvY2FsJzpcbiAgICAgICAgY2FzZSAndmlldyc6XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGNhc2UgbG9jYXRpb24uaG9zdDpcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gc2l0ZTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHBhZ2VQdXRJbmZvID0ge1xuICAgICAgc2x1ZzogcGFnZUVsZW1lbnQuYXR0cignaWQnKS5zcGxpdCgnX3JldicpWzBdLFxuICAgICAgcmV2OiBwYWdlRWxlbWVudC5hdHRyKCdpZCcpLnNwbGl0KCdfcmV2JylbMV0sXG4gICAgICBzaXRlOiBjaGVja2VkU2l0ZSgpLFxuICAgICAgbG9jYWw6IHBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdsb2NhbCcpXG4gICAgfTtcbiAgICBmb3JrRnJvbSA9IHBhZ2VQdXRJbmZvLnNpdGU7XG4gICAgd2lraS5sb2coJ3BhZ2VIYW5kbGVyLnB1dCcsIGFjdGlvbiwgcGFnZVB1dEluZm8pO1xuICAgIGlmICh3aWtpLnVzZUxvY2FsU3RvcmFnZSgpKSB7XG4gICAgICBpZiAocGFnZVB1dEluZm8uc2l0ZSAhPSBudWxsKSB7XG4gICAgICAgIHdpa2kubG9nKCdyZW1vdGUgPT4gbG9jYWwnKTtcbiAgICAgIH0gZWxzZSBpZiAoIXBhZ2VQdXRJbmZvLmxvY2FsKSB7XG4gICAgICAgIHdpa2kubG9nKCdvcmlnaW4gPT4gbG9jYWwnKTtcbiAgICAgICAgYWN0aW9uLnNpdGUgPSBmb3JrRnJvbSA9IGxvY2F0aW9uLmhvc3Q7XG4gICAgICB9XG4gICAgfVxuICAgIGFjdGlvbi5kYXRlID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICBpZiAoYWN0aW9uLnNpdGUgPT09ICdvcmlnaW4nKSB7XG4gICAgICBkZWxldGUgYWN0aW9uLnNpdGU7XG4gICAgfVxuICAgIGlmIChmb3JrRnJvbSkge1xuICAgICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgaW1nJykuYXR0cignc3JjJywgJy9mYXZpY29uLnBuZycpO1xuICAgICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgYScpLmF0dHIoJ2hyZWYnLCAnLycpO1xuICAgICAgcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScsIG51bGwpO1xuICAgICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3JlbW90ZScpO1xuICAgICAgc3RhdGUuc2V0VXJsKCk7XG4gICAgICBpZiAoYWN0aW9uLnR5cGUgIT09ICdmb3JrJykge1xuICAgICAgICBhY3Rpb24uZm9yayA9IGZvcmtGcm9tO1xuICAgICAgICBhZGRUb0pvdXJuYWwocGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwge1xuICAgICAgICAgIHR5cGU6ICdmb3JrJyxcbiAgICAgICAgICBzaXRlOiBmb3JrRnJvbSxcbiAgICAgICAgICBkYXRlOiBhY3Rpb24uZGF0ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdpa2kudXNlTG9jYWxTdG9yYWdlKCkgfHwgcGFnZVB1dEluZm8uc2l0ZSA9PT0gJ2xvY2FsJykge1xuICAgICAgcHVzaFRvTG9jYWwocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pO1xuICAgICAgcmV0dXJuIHBhZ2VFbGVtZW50LmFkZENsYXNzKFwibG9jYWxcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwdXNoVG9TZXJ2ZXIocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFkZFRvSm91cm5hbCwgYnVpbGRQYWdlSGVhZGVyLCBjcmVhdGVGYWN0b3J5LCBlbWl0SGVhZGVyLCBlbWl0VHdpbnMsIGhhbmRsZURyYWdnaW5nLCBpbml0QWRkQnV0dG9uLCBpbml0RHJhZ2dpbmcsIG5laWdoYm9yaG9vZCwgcGFnZUhhbmRsZXIsIHBsdWdpbiwgcmVmcmVzaCwgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCwgc3RhdGUsIHV0aWwsIHdpa2ksIF87XG5cbiAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgcGFnZUhhbmRsZXIgPSByZXF1aXJlKCcuL3BhZ2VIYW5kbGVyJyk7XG5cbiAgcGx1Z2luID0gcmVxdWlyZSgnLi9wbHVnaW4nKTtcblxuICBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKTtcblxuICBuZWlnaGJvcmhvb2QgPSByZXF1aXJlKCcuL25laWdoYm9yaG9vZCcpO1xuXG4gIGFkZFRvSm91cm5hbCA9IHJlcXVpcmUoJy4vYWRkVG9Kb3VybmFsJyk7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIGhhbmRsZURyYWdnaW5nID0gZnVuY3Rpb24oZXZ0LCB1aSkge1xuICAgIHZhciBhY3Rpb24sIGJlZm9yZSwgYmVmb3JlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudCwgZXF1YWxzLCBpdGVtLCBpdGVtRWxlbWVudCwgbW92ZUZyb21QYWdlLCBtb3ZlVG9QYWdlLCBtb3ZlV2l0aGluUGFnZSwgb3JkZXIsIHNvdXJjZVBhZ2VFbGVtZW50LCBzb3VyY2VTaXRlLCB0aGlzUGFnZUVsZW1lbnQ7XG4gICAgaXRlbUVsZW1lbnQgPSB1aS5pdGVtO1xuICAgIGl0ZW0gPSB3aWtpLmdldEl0ZW0oaXRlbUVsZW1lbnQpO1xuICAgIHRoaXNQYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICBzb3VyY2VQYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50Jyk7XG4gICAgc291cmNlU2l0ZSA9IHNvdXJjZVBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKTtcbiAgICBkZXN0aW5hdGlvblBhZ2VFbGVtZW50ID0gaXRlbUVsZW1lbnQucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICBlcXVhbHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICByZXR1cm4gYSAmJiBiICYmIGEuZ2V0KDApID09PSBiLmdldCgwKTtcbiAgICB9O1xuICAgIG1vdmVXaXRoaW5QYWdlID0gIXNvdXJjZVBhZ2VFbGVtZW50IHx8IGVxdWFscyhzb3VyY2VQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudCk7XG4gICAgbW92ZUZyb21QYWdlID0gIW1vdmVXaXRoaW5QYWdlICYmIGVxdWFscyh0aGlzUGFnZUVsZW1lbnQsIHNvdXJjZVBhZ2VFbGVtZW50KTtcbiAgICBtb3ZlVG9QYWdlID0gIW1vdmVXaXRoaW5QYWdlICYmIGVxdWFscyh0aGlzUGFnZUVsZW1lbnQsIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQpO1xuICAgIGlmIChtb3ZlRnJvbVBhZ2UpIHtcbiAgICAgIGlmIChzb3VyY2VQYWdlRWxlbWVudC5oYXNDbGFzcygnZ2hvc3QnKSB8fCBzb3VyY2VQYWdlRWxlbWVudC5hdHRyKCdpZCcpID09PSBkZXN0aW5hdGlvblBhZ2VFbGVtZW50LmF0dHIoJ2lkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBhY3Rpb24gPSBtb3ZlV2l0aGluUGFnZSA/IChvcmRlciA9ICQodGhpcykuY2hpbGRyZW4oKS5tYXAoZnVuY3Rpb24oXywgdmFsdWUpIHtcbiAgICAgIHJldHVybiAkKHZhbHVlKS5hdHRyKCdkYXRhLWlkJyk7XG4gICAgfSkuZ2V0KCksIHtcbiAgICAgIHR5cGU6ICdtb3ZlJyxcbiAgICAgIG9yZGVyOiBvcmRlclxuICAgIH0pIDogbW92ZUZyb21QYWdlID8gKHdpa2kubG9nKCdkcmFnIGZyb20nLCBzb3VyY2VQYWdlRWxlbWVudC5maW5kKCdoMScpLnRleHQoKSksIHtcbiAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgfSkgOiBtb3ZlVG9QYWdlID8gKGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JywgdGhpc1BhZ2VFbGVtZW50KSwgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJyksIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KSwge1xuICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICBpdGVtOiBpdGVtLFxuICAgICAgYWZ0ZXI6IGJlZm9yZSAhPSBudWxsID8gYmVmb3JlLmlkIDogdm9pZCAwXG4gICAgfSkgOiB2b2lkIDA7XG4gICAgYWN0aW9uLmlkID0gaXRlbS5pZDtcbiAgICByZXR1cm4gcGFnZUhhbmRsZXIucHV0KHRoaXNQYWdlRWxlbWVudCwgYWN0aW9uKTtcbiAgfTtcblxuICBpbml0RHJhZ2dpbmcgPSBmdW5jdGlvbigkcGFnZSkge1xuICAgIHZhciAkc3Rvcnk7XG4gICAgJHN0b3J5ID0gJHBhZ2UuZmluZCgnLnN0b3J5Jyk7XG4gICAgcmV0dXJuICRzdG9yeS5zb3J0YWJsZSh7XG4gICAgICBjb25uZWN0V2l0aDogJy5wYWdlIC5zdG9yeSdcbiAgICB9KS5vbihcInNvcnR1cGRhdGVcIiwgaGFuZGxlRHJhZ2dpbmcpO1xuICB9O1xuXG4gIGluaXRBZGRCdXR0b24gPSBmdW5jdGlvbigkcGFnZSkge1xuICAgIHJldHVybiAkcGFnZS5maW5kKFwiLmFkZC1mYWN0b3J5XCIpLmxpdmUoXCJjbGlja1wiLCBmdW5jdGlvbihldnQpIHtcbiAgICAgIGlmICgkcGFnZS5oYXNDbGFzcygnZ2hvc3QnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBjcmVhdGVGYWN0b3J5KCRwYWdlKTtcbiAgICB9KTtcbiAgfTtcblxuICBjcmVhdGVGYWN0b3J5ID0gZnVuY3Rpb24oJHBhZ2UpIHtcbiAgICB2YXIgYmVmb3JlLCBiZWZvcmVFbGVtZW50LCBpdGVtLCBpdGVtRWxlbWVudDtcbiAgICBpdGVtID0ge1xuICAgICAgdHlwZTogXCJmYWN0b3J5XCIsXG4gICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgIH07XG4gICAgaXRlbUVsZW1lbnQgPSAkKFwiPGRpdiAvPlwiLCB7XG4gICAgICBcImNsYXNzXCI6IFwiaXRlbSBmYWN0b3J5XCJcbiAgICB9KS5kYXRhKCdpdGVtJywgaXRlbSkuYXR0cignZGF0YS1pZCcsIGl0ZW0uaWQpO1xuICAgIGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JywgJHBhZ2UpO1xuICAgICRwYWdlLmZpbmQoXCIuc3RvcnlcIikuYXBwZW5kKGl0ZW1FbGVtZW50KTtcbiAgICBwbHVnaW5bXCJkb1wiXShpdGVtRWxlbWVudCwgaXRlbSk7XG4gICAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJyk7XG4gICAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpO1xuICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQoJHBhZ2UsIHtcbiAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICBpZDogaXRlbS5pZCxcbiAgICAgIHR5cGU6IFwiYWRkXCIsXG4gICAgICBhZnRlcjogYmVmb3JlICE9IG51bGwgPyBiZWZvcmUuaWQgOiB2b2lkIDBcbiAgICB9KTtcbiAgfTtcblxuICBidWlsZFBhZ2VIZWFkZXIgPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgdmFyIGZhdmljb25fc3JjLCBoZWFkZXJfaHJlZiwgcGFnZSwgdG9vbHRpcDtcbiAgICBwYWdlID0gX2FyZy5wYWdlLCB0b29sdGlwID0gX2FyZy50b29sdGlwLCBoZWFkZXJfaHJlZiA9IF9hcmcuaGVhZGVyX2hyZWYsIGZhdmljb25fc3JjID0gX2FyZy5mYXZpY29uX3NyYztcbiAgICBpZiAocGFnZS5wbHVnaW4pIHtcbiAgICAgIHRvb2x0aXAgKz0gXCJcXG5cIiArIHBhZ2UucGx1Z2luICsgXCIgcGx1Z2luXCI7XG4gICAgfVxuICAgIHJldHVybiBcIjxoMSB0aXRsZT1cXFwiXCIgKyB0b29sdGlwICsgXCJcXFwiPjxhIGhyZWY9XFxcIlwiICsgaGVhZGVyX2hyZWYgKyBcIlxcXCI+PGltZyBzcmM9XFxcIlwiICsgZmF2aWNvbl9zcmMgKyBcIlxcXCIgaGVpZ2h0PVxcXCIzMnB4XFxcIiBjbGFzcz1cXFwiZmF2aWNvblxcXCI+PC9hPiBcIiArIHBhZ2UudGl0bGUgKyBcIjwvaDE+XCI7XG4gIH07XG5cbiAgZW1pdEhlYWRlciA9IGZ1bmN0aW9uKCRoZWFkZXIsICRwYWdlLCBwYWdlT2JqZWN0KSB7XG4gICAgdmFyIGRhdGUsIGhlYWRlciwgaXNSZW1vdGVQYWdlLCBwYWdlLCBwYWdlSGVhZGVyLCByZXYsIHZpZXdIZXJlO1xuICAgIHBhZ2UgPSBwYWdlT2JqZWN0LmdldFJhd1BhZ2UoKTtcbiAgICBpc1JlbW90ZVBhZ2UgPSBwYWdlT2JqZWN0LmlzUmVtb3RlKCk7XG4gICAgaGVhZGVyID0gJyc7XG4gICAgdmlld0hlcmUgPSB3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKSA9PT0gJ3dlbGNvbWUtdmlzaXRvcnMnID8gXCJcIiA6IFwiL3ZpZXcvXCIgKyAocGFnZU9iamVjdC5nZXRTbHVnKCkpO1xuICAgIHBhZ2VIZWFkZXIgPSBpc1JlbW90ZVBhZ2UgPyBidWlsZFBhZ2VIZWFkZXIoe1xuICAgICAgdG9vbHRpcDogcGFnZU9iamVjdC5nZXRSZW1vdGVTaXRlKCksXG4gICAgICBoZWFkZXJfaHJlZjogXCIvL1wiICsgKHBhZ2VPYmplY3QuZ2V0UmVtb3RlU2l0ZSgpKSArIFwiL3ZpZXcvd2VsY29tZS12aXNpdG9yc1wiICsgdmlld0hlcmUsXG4gICAgICBmYXZpY29uX3NyYzogXCJodHRwOi8vXCIgKyAocGFnZU9iamVjdC5nZXRSZW1vdGVTaXRlKCkpICsgXCIvZmF2aWNvbi5wbmdcIixcbiAgICAgIHBhZ2U6IHBhZ2VcbiAgICB9KSA6IGJ1aWxkUGFnZUhlYWRlcih7XG4gICAgICB0b29sdGlwOiBsb2NhdGlvbi5ob3N0LFxuICAgICAgaGVhZGVyX2hyZWY6IFwiL3ZpZXcvd2VsY29tZS12aXNpdG9yc1wiICsgdmlld0hlcmUsXG4gICAgICBmYXZpY29uX3NyYzogXCIvZmF2aWNvbi5wbmdcIixcbiAgICAgIHBhZ2U6IHBhZ2VcbiAgICB9KTtcbiAgICAkaGVhZGVyLmFwcGVuZChwYWdlSGVhZGVyKTtcbiAgICBpZiAoIWlzUmVtb3RlUGFnZSkge1xuICAgICAgJCgnaW1nLmZhdmljb24nLCAkcGFnZSkuZXJyb3IoZnVuY3Rpb24oZSkge1xuICAgICAgICByZXR1cm4gcGx1Z2luLmdldCgnZmF2aWNvbicsIGZ1bmN0aW9uKGZhdmljb24pIHtcbiAgICAgICAgICByZXR1cm4gZmF2aWNvbi5jcmVhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCRwYWdlLmF0dHIoJ2lkJykubWF0Y2goL19yZXYvKSkge1xuICAgICAgcmV2ID0gcGFnZS5qb3VybmFsLmxlbmd0aCAtIDE7XG4gICAgICBkYXRlID0gcGFnZS5qb3VybmFsW3Jldl0uZGF0ZTtcbiAgICAgICRwYWdlLmFkZENsYXNzKCdnaG9zdCcpLmRhdGEoJ3JldicsIHJldik7XG4gICAgICByZXR1cm4gJGhlYWRlci5hcHBlbmQoJChcIjxoMiBjbGFzcz1cXFwicmV2aXNpb25cXFwiPlxcbiAgPHNwYW4+XFxuICAgIFwiICsgKGRhdGUgIT0gbnVsbCA/IHV0aWwuZm9ybWF0RGF0ZShkYXRlKSA6IFwiUmV2aXNpb24gXCIgKyByZXYpICsgXCJcXG4gIDwvc3Bhbj5cXG48L2gyPlwiKSk7XG4gICAgfVxuICB9O1xuXG4gIGVtaXRUd2lucyA9IHdpa2kuZW1pdFR3aW5zID0gZnVuY3Rpb24oJHBhZ2UpIHtcbiAgICB2YXIgYWN0aW9ucywgYmluLCBiaW5zLCBmbGFncywgaSwgaW5mbywgaXRlbSwgbGVnZW5kLCBwYWdlLCByZW1vdGVTaXRlLCBzaXRlLCBzbHVnLCB0d2lucywgdmlld2luZywgX2ksIF9sZW4sIF9yZWYsIF9yZWYxLCBfcmVmMiwgX3JlZjM7XG4gICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKTtcbiAgICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpIHx8IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgIGlmIChzaXRlID09PSAndmlldycgfHwgc2l0ZSA9PT0gJ29yaWdpbicpIHtcbiAgICAgIHNpdGUgPSB3aW5kb3cubG9jYXRpb24uaG9zdDtcbiAgICB9XG4gICAgc2x1ZyA9IHdpa2kuYXNTbHVnKHBhZ2UudGl0bGUpO1xuICAgIGlmICgoKGFjdGlvbnMgPSAoX3JlZiA9IHBhZ2Uuam91cm5hbCkgIT0gbnVsbCA/IF9yZWYubGVuZ3RoIDogdm9pZCAwKSAhPSBudWxsKSAmJiAoKHZpZXdpbmcgPSAoX3JlZjEgPSBwYWdlLmpvdXJuYWxbYWN0aW9ucyAtIDFdKSAhPSBudWxsID8gX3JlZjEuZGF0ZSA6IHZvaWQgMCkgIT0gbnVsbCkpIHtcbiAgICAgIHZpZXdpbmcgPSBNYXRoLmZsb29yKHZpZXdpbmcgLyAxMDAwKSAqIDEwMDA7XG4gICAgICBiaW5zID0ge1xuICAgICAgICBuZXdlcjogW10sXG4gICAgICAgIHNhbWU6IFtdLFxuICAgICAgICBvbGRlcjogW11cbiAgICAgIH07XG4gICAgICBfcmVmMiA9IHdpa2kubmVpZ2hib3Job29kO1xuICAgICAgZm9yIChyZW1vdGVTaXRlIGluIF9yZWYyKSB7XG4gICAgICAgIGluZm8gPSBfcmVmMltyZW1vdGVTaXRlXTtcbiAgICAgICAgaWYgKHJlbW90ZVNpdGUgIT09IHNpdGUgJiYgKGluZm8uc2l0ZW1hcCAhPSBudWxsKSkge1xuICAgICAgICAgIF9yZWYzID0gaW5mby5zaXRlbWFwO1xuICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBfcmVmM1tfaV07XG4gICAgICAgICAgICBpZiAoaXRlbS5zbHVnID09PSBzbHVnKSB7XG4gICAgICAgICAgICAgIGJpbiA9IGl0ZW0uZGF0ZSA+IHZpZXdpbmcgPyBiaW5zLm5ld2VyIDogaXRlbS5kYXRlIDwgdmlld2luZyA/IGJpbnMub2xkZXIgOiBiaW5zLnNhbWU7XG4gICAgICAgICAgICAgIGJpbi5wdXNoKHtcbiAgICAgICAgICAgICAgICByZW1vdGVTaXRlOiByZW1vdGVTaXRlLFxuICAgICAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0d2lucyA9IFtdO1xuICAgICAgZm9yIChsZWdlbmQgaW4gYmlucykge1xuICAgICAgICBiaW4gPSBiaW5zW2xlZ2VuZF07XG4gICAgICAgIGlmICghYmluLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJpbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gYS5pdGVtLmRhdGUgPCBiLml0ZW0uZGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZsYWdzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBfaiwgX2xlbjEsIF9yZWY0LCBfcmVzdWx0cztcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoaSA9IF9qID0gMCwgX2xlbjEgPSBiaW4ubGVuZ3RoOyBfaiA8IF9sZW4xOyBpID0gKytfaikge1xuICAgICAgICAgICAgX3JlZjQgPSBiaW5baV0sIHJlbW90ZVNpdGUgPSBfcmVmNC5yZW1vdGVTaXRlLCBpdGVtID0gX3JlZjQuaXRlbTtcbiAgICAgICAgICAgIGlmIChpID49IDgpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKFwiPGltZyBjbGFzcz1cXFwicmVtb3RlXFxcIlxcbnNyYz1cXFwiaHR0cDovL1wiICsgcmVtb3RlU2l0ZSArIFwiL2Zhdmljb24ucG5nXFxcIlxcbmRhdGEtc2x1Zz1cXFwiXCIgKyBzbHVnICsgXCJcXFwiXFxuZGF0YS1zaXRlPVxcXCJcIiArIHJlbW90ZVNpdGUgKyBcIlxcXCJcXG50aXRsZT1cXFwiXCIgKyByZW1vdGVTaXRlICsgXCJcXFwiPlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgICB9KSgpO1xuICAgICAgICB0d2lucy5wdXNoKFwiXCIgKyAoZmxhZ3Muam9pbignJm5ic3A7JykpICsgXCIgXCIgKyBsZWdlbmQpO1xuICAgICAgfVxuICAgICAgaWYgKHR3aW5zKSB7XG4gICAgICAgIHJldHVybiAkcGFnZS5maW5kKCcudHdpbnMnKS5odG1sKFwiPHA+XCIgKyAodHdpbnMuam9pbihcIiwgXCIpKSArIFwiPC9wPlwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCA9IGZ1bmN0aW9uKHBhZ2VPYmplY3QsICRwYWdlKSB7XG4gICAgdmFyICRmb290ZXIsICRoZWFkZXIsICRqb3VybmFsLCAkc3RvcnksICR0d2lucywgaG9zdCwgc2x1ZywgX3JlZjtcbiAgICAkcGFnZS5kYXRhKFwiZGF0YVwiLCBwYWdlT2JqZWN0LmdldFJhd1BhZ2UoKSk7XG4gICAgaWYgKHBhZ2VPYmplY3QuaXNSZW1vdGUoKSkge1xuICAgICAgJHBhZ2UuZGF0YShcInNpdGVcIiwgcGFnZU9iamVjdC5nZXRSZW1vdGVTaXRlKCkpO1xuICAgIH1cbiAgICBzbHVnID0gJHBhZ2UuYXR0cignaWQnKTtcbiAgICB3aWtpLnJlc29sdXRpb25Db250ZXh0ID0gcGFnZU9iamVjdC5nZXRDb250ZXh0KCk7XG4gICAgJHBhZ2UuZW1wdHkoKTtcbiAgICBfcmVmID0gWyd0d2lucycsICdoZWFkZXInLCAnc3RvcnknLCAnam91cm5hbCcsICdmb290ZXInXS5tYXAoZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICByZXR1cm4gJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoY2xhc3NOYW1lKS5hcHBlbmRUbygkcGFnZSk7XG4gICAgfSksICR0d2lucyA9IF9yZWZbMF0sICRoZWFkZXIgPSBfcmVmWzFdLCAkc3RvcnkgPSBfcmVmWzJdLCAkam91cm5hbCA9IF9yZWZbM10sICRmb290ZXIgPSBfcmVmWzRdO1xuICAgIGVtaXRIZWFkZXIoJGhlYWRlciwgJHBhZ2UsIHBhZ2VPYmplY3QpO1xuICAgIHBhZ2VPYmplY3Quc2VxSXRlbXMoZnVuY3Rpb24oaXRlbSwgZG9uZSkge1xuICAgICAgdmFyICRpdGVtO1xuICAgICAgaWYgKChpdGVtICE9IG51bGwgPyBpdGVtLnR5cGUgOiB2b2lkIDApICYmIChpdGVtICE9IG51bGwgPyBpdGVtLmlkIDogdm9pZCAwKSkge1xuICAgICAgICAkaXRlbSA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJpdGVtIFwiICsgaXRlbS50eXBlICsgXCJcXFwiIGRhdGEtaWQ9XFxcIlwiICsgaXRlbS5pZCArIFwiXFxcIj5cIik7XG4gICAgICAgICRzdG9yeS5hcHBlbmQoJGl0ZW0pO1xuICAgICAgICByZXR1cm4gcGx1Z2luW1wiZG9cIl0oJGl0ZW0sIGl0ZW0sIGRvbmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHN0b3J5LmFwcGVuZCgkKFwiPGRpdj48cCBjbGFzcz1cXFwiZXJyb3JcXFwiPkNhbid0IG1ha2Ugc2Vuc2Ugb2Ygc3RvcnlbXCIgKyBpICsgXCJdPC9wPjwvZGl2PlwiKSk7XG4gICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcGFnZU9iamVjdC5zZXFBY3Rpb25zKGZ1bmN0aW9uKGVhY2gsIGRvbmUpIHtcbiAgICAgIGlmIChlYWNoLnNlcGFyYXRvcikge1xuICAgICAgICBhZGRUb0pvdXJuYWwoJGpvdXJuYWwsIGVhY2guc2VwYXJhdG9yKTtcbiAgICAgIH1cbiAgICAgIGFkZFRvSm91cm5hbCgkam91cm5hbCwgZWFjaC5hY3Rpb24pO1xuICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICB9KTtcbiAgICBlbWl0VHdpbnMoJHBhZ2UpO1xuICAgICRqb3VybmFsLmFwcGVuZChcIjxkaXYgY2xhc3M9XFxcImNvbnRyb2wtYnV0dG9uc1xcXCI+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGZvcmstcGFnZVxcXCIgdGl0bGU9XFxcImZvcmsgdGhpcyBwYWdlXFxcIj5cIiArIHV0aWwuc3ltYm9sc1snZm9yayddICsgXCI8L2E+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGFkZC1mYWN0b3J5XFxcIiB0aXRsZT1cXFwiYWRkIHBhcmFncmFwaFxcXCI+XCIgKyB1dGlsLnN5bWJvbHNbJ2FkZCddICsgXCI8L2E+XFxuPC9kaXY+XCIpO1xuICAgIGhvc3QgPSBwYWdlT2JqZWN0LmdldFJlbW90ZVNpdGUoKSB8fCBsb2NhdGlvbi5ob3N0O1xuICAgIHJldHVybiAkZm9vdGVyLmFwcGVuZChcIjxhIGlkPVxcXCJsaWNlbnNlXFxcIiBocmVmPVxcXCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvXFxcIj5DQyBCWS1TQSAzLjA8L2E+IC5cXG48YSBjbGFzcz1cXFwic2hvdy1wYWdlLXNvdXJjZVxcXCIgaHJlZj1cXFwiL1wiICsgc2x1ZyArIFwiLmpzb24/cmFuZG9tPVwiICsgKHV0aWwucmFuZG9tQnl0ZXMoNCkpICsgXCJcXFwiIHRpdGxlPVxcXCJzb3VyY2VcXFwiPkpTT048L2E+IC5cXG48YSBocmVmPSBcXFwiLy9cIiArIGhvc3QgKyBcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIj5cIiArIGhvc3QgKyBcIjwvYT5cIik7XG4gIH07XG5cbiAgd2lraS5idWlsZFBhZ2UgPSBmdW5jdGlvbihwYWdlT2JqZWN0LCAkcGFnZSkge1xuICAgIGlmIChwYWdlT2JqZWN0LmlzTG9jYWwoKSkge1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2xvY2FsJyk7XG4gICAgfVxuICAgIGlmIChwYWdlT2JqZWN0LmlzUmVtb3RlKCkpIHtcbiAgICAgICRwYWdlLmFkZENsYXNzKCdyZW1vdGUnKTtcbiAgICB9XG4gICAgaWYgKHBhZ2VPYmplY3QuaXNQbHVnaW4oKSkge1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ3BsdWdpbicpO1xuICAgIH1cbiAgICByZW5kZXJQYWdlSW50b1BhZ2VFbGVtZW50KHBhZ2VPYmplY3QsICRwYWdlKTtcbiAgICBzdGF0ZS5zZXRVcmwoKTtcbiAgICBpbml0RHJhZ2dpbmcoJHBhZ2UpO1xuICAgIGluaXRBZGRCdXR0b24oJHBhZ2UpO1xuICAgIHJldHVybiAkcGFnZTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2ggPSB3aWtpLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJHBhZ2UsIGNyZWF0ZUdob3N0UGFnZSwgZW1wdHlQYWdlLCBwYWdlSW5mb3JtYXRpb24sIHJldiwgc2x1Zywgd2hlbkdvdHRlbiwgX3JlZjtcbiAgICAkcGFnZSA9ICQodGhpcyk7XG4gICAgX3JlZiA9ICRwYWdlLmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKSwgc2x1ZyA9IF9yZWZbMF0sIHJldiA9IF9yZWZbMV07XG4gICAgcGFnZUluZm9ybWF0aW9uID0ge1xuICAgICAgc2x1Zzogc2x1ZyxcbiAgICAgIHJldjogcmV2LFxuICAgICAgc2l0ZTogJHBhZ2UuZGF0YSgnc2l0ZScpXG4gICAgfTtcbiAgICBlbXB0eVBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKS5lbXB0eVBhZ2U7XG4gICAgY3JlYXRlR2hvc3RQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGl0LCBoaXRzLCBpbmZvLCBwYWdlT2JqZWN0LCByZXN1bHQsIHNpdGUsIHRpdGxlLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICB0aXRsZSA9ICQoXCJhW2hyZWY9XFxcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIl06bGFzdFwiKS50ZXh0KCkgfHwgc2x1ZztcbiAgICAgIHBhZ2VPYmplY3QgPSBlbXB0eVBhZ2UoKTtcbiAgICAgIHBhZ2VPYmplY3Quc2V0VGl0bGUodGl0bGUpO1xuICAgICAgaGl0cyA9IFtdO1xuICAgICAgX3JlZjEgPSB3aWtpLm5laWdoYm9yaG9vZDtcbiAgICAgIGZvciAoc2l0ZSBpbiBfcmVmMSkge1xuICAgICAgICBpbmZvID0gX3JlZjFbc2l0ZV07XG4gICAgICAgIGlmIChpbmZvLnNpdGVtYXAgIT0gbnVsbCkge1xuICAgICAgICAgIHJlc3VsdCA9IF8uZmluZChpbmZvLnNpdGVtYXAsIGZ1bmN0aW9uKGVhY2gpIHtcbiAgICAgICAgICAgIHJldHVybiBlYWNoLnNsdWcgPT09IHNsdWc7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBoaXRzLnB1c2goe1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIixcbiAgICAgICAgICAgICAgXCJzaXRlXCI6IHNpdGUsXG4gICAgICAgICAgICAgIFwic2x1Z1wiOiBzbHVnLFxuICAgICAgICAgICAgICBcInRpdGxlXCI6IHJlc3VsdC50aXRsZSB8fCBzbHVnLFxuICAgICAgICAgICAgICBcInRleHRcIjogcmVzdWx0LnN5bm9wc2lzIHx8ICcnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChoaXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcGFnZU9iamVjdC5hZGRJdGVtKHtcbiAgICAgICAgICAndHlwZSc6ICdmdXR1cmUnLFxuICAgICAgICAgICd0ZXh0JzogJ1dlIGNvdWxkIG5vdCBmaW5kIHRoaXMgcGFnZSBpbiB0aGUgZXhwZWN0ZWQgY29udGV4dC4nLFxuICAgICAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICAgIH0pO1xuICAgICAgICBwYWdlT2JqZWN0LmFkZEl0ZW0oe1xuICAgICAgICAgICd0eXBlJzogJ3BhcmFncmFwaCcsXG4gICAgICAgICAgJ3RleHQnOiBcIldlIGRpZCBmaW5kIHRoZSBwYWdlIGluIHlvdXIgY3VycmVudCBuZWlnaGJvcmhvb2QuXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gaGl0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGhpdCA9IGhpdHNbX2ldO1xuICAgICAgICAgIHBhZ2VPYmplY3QuYWRkSXRlbShoaXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlT2JqZWN0LmFkZEl0ZW0oe1xuICAgICAgICAgICd0eXBlJzogJ2Z1dHVyZScsXG4gICAgICAgICAgJ3RleHQnOiAnV2UgY291bGQgbm90IGZpbmQgdGhpcyBwYWdlLicsXG4gICAgICAgICAgJ3RpdGxlJzogdGl0bGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UpLmFkZENsYXNzKCdnaG9zdCcpO1xuICAgIH07XG4gICAgd2hlbkdvdHRlbiA9IGZ1bmN0aW9uKHBhZ2VPYmplY3QpIHtcbiAgICAgIHZhciBzaXRlLCBfaSwgX2xlbiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgICAgd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UpO1xuICAgICAgX3JlZjEgPSBwYWdlT2JqZWN0LmdldE5laWdoYm9ycyhsb2NhdGlvbi5ob3N0KTtcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHNpdGUgPSBfcmVmMVtfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2gobmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3Ioc2l0ZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH07XG4gICAgcmV0dXJuIHBhZ2VIYW5kbGVyLmdldCh7XG4gICAgICB3aGVuR290dGVuOiB3aGVuR290dGVuLFxuICAgICAgd2hlbk5vdEdvdHRlbjogY3JlYXRlR2hvc3RQYWdlLFxuICAgICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cbiAgICB9KTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFzU2x1ZywgZW1wdHlQYWdlLCBuZXdQYWdlLCBub3dTZWN0aW9ucywgdXRpbCwgXztcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuICBhc1NsdWcgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWUucmVwbGFjZSgvXFxzL2csICctJykucmVwbGFjZSgvW15BLVphLXowLTktXS9nLCAnJykudG9Mb3dlckNhc2UoKTtcbiAgfTtcblxuICBlbXB0eVBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3UGFnZSh7fSwgbnVsbCk7XG4gIH07XG5cbiAgbm93U2VjdGlvbnMgPSBmdW5jdGlvbihub3cpIHtcbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICBzeW1ib2w6ICfinYQnLFxuICAgICAgICBkYXRlOiBub3cgLSAxMDAwICogNjAgKiA2MCAqIDI0ICogMzY2LFxuICAgICAgICBwZXJpb2Q6ICdhIFllYXInXG4gICAgICB9LCB7XG4gICAgICAgIHN5bWJvbDogJ+KamCcsXG4gICAgICAgIGRhdGU6IG5vdyAtIDEwMDAgKiA2MCAqIDYwICogMjQgKiAzMSAqIDMsXG4gICAgICAgIHBlcmlvZDogJ2EgU2Vhc29uJ1xuICAgICAgfSwge1xuICAgICAgICBzeW1ib2w6ICfimqonLFxuICAgICAgICBkYXRlOiBub3cgLSAxMDAwICogNjAgKiA2MCAqIDI0ICogMzEsXG4gICAgICAgIHBlcmlvZDogJ2EgTW9udGgnXG4gICAgICB9LCB7XG4gICAgICAgIHN5bWJvbDogJ+KYvScsXG4gICAgICAgIGRhdGU6IG5vdyAtIDEwMDAgKiA2MCAqIDYwICogMjQgKiA3LFxuICAgICAgICBwZXJpb2Q6ICdhIFdlZWsnXG4gICAgICB9LCB7XG4gICAgICAgIHN5bWJvbDogJ+KYgCcsXG4gICAgICAgIGRhdGU6IG5vdyAtIDEwMDAgKiA2MCAqIDYwICogMjQsXG4gICAgICAgIHBlcmlvZDogJ2EgRGF5J1xuICAgICAgfSwge1xuICAgICAgICBzeW1ib2w6ICfijJonLFxuICAgICAgICBkYXRlOiBub3cgLSAxMDAwICogNjAgKiA2MCxcbiAgICAgICAgcGVyaW9kOiAnYW4gSG91cidcbiAgICAgIH1cbiAgICBdO1xuICB9O1xuXG4gIG5ld1BhZ2UgPSBmdW5jdGlvbihqc29uLCBzaXRlKSB7XG4gICAgdmFyIGFkZEl0ZW0sIGFkZFBhcmFncmFwaCwgZ2V0Q29udGV4dCwgZ2V0TmVpZ2hib3JzLCBnZXRSYXdQYWdlLCBnZXRSZW1vdGVTaXRlLCBnZXRTbHVnLCBpc0xvY2FsLCBpc1BsdWdpbiwgaXNSZW1vdGUsIHBhZ2UsIHNlcUFjdGlvbnMsIHNlcUl0ZW1zLCBzZXRUaXRsZTtcbiAgICBwYWdlID0gXy5leHRlbmQoe30sIHV0aWwuZW1wdHlQYWdlKCksIGpzb24pO1xuICAgIHBhZ2Uuc3RvcnkgfHwgKHBhZ2Uuc3RvcnkgPSBbXSk7XG4gICAgcGFnZS5qb3VybmFsIHx8IChwYWdlLmpvdXJuYWwgPSBbXSk7XG4gICAgZ2V0UmF3UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHBhZ2U7XG4gICAgfTtcbiAgICBnZXRDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYWN0aW9uLCBhZGRDb250ZXh0LCBjb250ZXh0LCBfaSwgX2xlbiwgX3JlZjtcbiAgICAgIGNvbnRleHQgPSBbJ3ZpZXcnXTtcbiAgICAgIGlmIChpc1JlbW90ZSgpKSB7XG4gICAgICAgIGNvbnRleHQucHVzaChzaXRlKTtcbiAgICAgIH1cbiAgICAgIGFkZENvbnRleHQgPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgICAgIGlmICgoc2l0ZSAhPSBudWxsKSAmJiAhXy5pbmNsdWRlKGNvbnRleHQsIHNpdGUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQucHVzaChzaXRlKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIF9yZWYgPSBwYWdlLmpvdXJuYWwuc2xpY2UoMCkucmV2ZXJzZSgpO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGFjdGlvbiA9IF9yZWZbX2ldO1xuICAgICAgICBhZGRDb250ZXh0KGFjdGlvbi5zaXRlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb250ZXh0O1xuICAgIH07XG4gICAgaXNQbHVnaW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBwYWdlLnBsdWdpbiAhPSBudWxsO1xuICAgIH07XG4gICAgaXNSZW1vdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhKHNpdGUgPT09ICh2b2lkIDApIHx8IHNpdGUgPT09IG51bGwgfHwgc2l0ZSA9PT0gJ3ZpZXcnIHx8IHNpdGUgPT09ICdvcmlnaW4nIHx8IHNpdGUgPT09ICdsb2NhbCcpO1xuICAgIH07XG4gICAgaXNMb2NhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNpdGUgPT09ICdsb2NhbCc7XG4gICAgfTtcbiAgICBnZXRSZW1vdGVTaXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoaXNSZW1vdGUoKSkge1xuICAgICAgICByZXR1cm4gc2l0ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgZ2V0U2x1ZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFzU2x1ZyhwYWdlLnRpdGxlKTtcbiAgICB9O1xuICAgIGdldE5laWdoYm9ycyA9IGZ1bmN0aW9uKGhvc3QpIHtcbiAgICAgIHZhciBhY3Rpb24sIGl0ZW0sIG5laWdoYm9ycywgX2ksIF9qLCBfbGVuLCBfbGVuMSwgX3JlZiwgX3JlZjE7XG4gICAgICBuZWlnaGJvcnMgPSBbXTtcbiAgICAgIGlmIChpc1JlbW90ZSgpKSB7XG4gICAgICAgIG5laWdoYm9ycy5wdXNoKHNpdGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGhvc3QgIT0gbnVsbCkge1xuICAgICAgICAgIG5laWdoYm9ycy5wdXNoKGhvc3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfcmVmID0gcGFnZS5zdG9yeTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBpdGVtID0gX3JlZltfaV07XG4gICAgICAgIGlmIChpdGVtLnNpdGUgIT0gbnVsbCkge1xuICAgICAgICAgIG5laWdoYm9ycy5wdXNoKGl0ZW0uc2l0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF9yZWYxID0gcGFnZS5qb3VybmFsO1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjEubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIGFjdGlvbiA9IF9yZWYxW19qXTtcbiAgICAgICAgaWYgKGFjdGlvbi5zaXRlICE9IG51bGwpIHtcbiAgICAgICAgICBuZWlnaGJvcnMucHVzaChhY3Rpb24uc2l0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBfLnVuaXEobmVpZ2hib3JzKTtcbiAgICB9O1xuICAgIHNldFRpdGxlID0gZnVuY3Rpb24odGl0bGUpIHtcbiAgICAgIHJldHVybiBwYWdlLnRpdGxlID0gdGl0bGU7XG4gICAgfTtcbiAgICBhZGRJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgaXRlbSA9IF8uZXh0ZW5kKHt9LCB7XG4gICAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICB9LCBpdGVtKTtcbiAgICAgIHJldHVybiBwYWdlLnN0b3J5LnB1c2goaXRlbSk7XG4gICAgfTtcbiAgICBzZXFJdGVtcyA9IGZ1bmN0aW9uKGVhY2gpIHtcbiAgICAgIHZhciBlbWl0SXRlbTtcbiAgICAgIGVtaXRJdGVtID0gZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoaSA+PSBwYWdlLnN0b3J5Lmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWFjaChwYWdlLnN0b3J5W2ldLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZW1pdEl0ZW0oaSArIDEpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gZW1pdEl0ZW0oMCk7XG4gICAgfTtcbiAgICBhZGRQYXJhZ3JhcGggPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICB2YXIgdHlwZTtcbiAgICAgIHR5cGUgPSBcInBhcmFncmFwaFwiO1xuICAgICAgcmV0dXJuIGFkZEl0ZW0oe1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHNlcUFjdGlvbnMgPSBmdW5jdGlvbihlYWNoKSB7XG4gICAgICB2YXIgZW1pdEFjdGlvbiwgc2VjdGlvbnMsIHNtYWxsZXI7XG4gICAgICBzbWFsbGVyID0gMDtcbiAgICAgIHNlY3Rpb25zID0gbm93U2VjdGlvbnMoKG5ldyBEYXRlKS5nZXRUaW1lKCkpO1xuICAgICAgZW1pdEFjdGlvbiA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgdmFyIGFjdGlvbiwgYmlnZ2VyLCBzZWN0aW9uLCBzZXBhcmF0b3IsIF9pLCBfbGVuO1xuICAgICAgICBpZiAoaSA+PSBwYWdlLmpvdXJuYWwubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGFjdGlvbiA9IHBhZ2Uuam91cm5hbFtpXTtcbiAgICAgICAgYmlnZ2VyID0gYWN0aW9uLmRhdGUgfHwgMDtcbiAgICAgICAgc2VwYXJhdG9yID0gbnVsbDtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBzZWN0aW9ucy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIHNlY3Rpb24gPSBzZWN0aW9uc1tfaV07XG4gICAgICAgICAgaWYgKHNlY3Rpb24uZGF0ZSA+IHNtYWxsZXIgJiYgc2VjdGlvbi5kYXRlIDwgYmlnZ2VyKSB7XG4gICAgICAgICAgICBzZXBhcmF0b3IgPSBzZWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzbWFsbGVyID0gYmlnZ2VyO1xuICAgICAgICByZXR1cm4gZWFjaCh7XG4gICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXG4gICAgICAgICAgc2VwYXJhdG9yOiBzZXBhcmF0b3JcbiAgICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGVtaXRBY3Rpb24oaSArIDEpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gZW1pdEFjdGlvbigwKTtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBnZXRSYXdQYWdlOiBnZXRSYXdQYWdlLFxuICAgICAgZ2V0Q29udGV4dDogZ2V0Q29udGV4dCxcbiAgICAgIGlzUGx1Z2luOiBpc1BsdWdpbixcbiAgICAgIGlzUmVtb3RlOiBpc1JlbW90ZSxcbiAgICAgIGlzTG9jYWw6IGlzTG9jYWwsXG4gICAgICBnZXRSZW1vdGVTaXRlOiBnZXRSZW1vdGVTaXRlLFxuICAgICAgZ2V0U2x1ZzogZ2V0U2x1ZyxcbiAgICAgIGdldE5laWdoYm9yczogZ2V0TmVpZ2hib3JzLFxuICAgICAgc2V0VGl0bGU6IHNldFRpdGxlLFxuICAgICAgYWRkSXRlbTogYWRkSXRlbSxcbiAgICAgIGFkZFBhcmFncmFwaDogYWRkUGFyYWdyYXBoLFxuICAgICAgc2VxSXRlbXM6IHNlcUl0ZW1zLFxuICAgICAgc2VxQWN0aW9uczogc2VxQWN0aW9uc1xuICAgIH07XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbmV3UGFnZTogbmV3UGFnZSxcbiAgICBlbXB0eVBhZ2U6IGVtcHR5UGFnZVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCl7Ly8gICAgIFVuZGVyc2NvcmUuanMgMS41LjJcbi8vICAgICBodHRwOi8vdW5kZXJzY29yZWpzLm9yZ1xuLy8gICAgIChjKSAyMDA5LTIwMTMgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbi8vICAgICBVbmRlcnNjb3JlIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuXG4oZnVuY3Rpb24oKSB7XG5cbiAgLy8gQmFzZWxpbmUgc2V0dXBcbiAgLy8gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBFc3RhYmxpc2ggdGhlIHJvb3Qgb2JqZWN0LCBgd2luZG93YCBpbiB0aGUgYnJvd3Nlciwgb3IgYGV4cG9ydHNgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIEVzdGFibGlzaCB0aGUgb2JqZWN0IHRoYXQgZ2V0cyByZXR1cm5lZCB0byBicmVhayBvdXQgb2YgYSBsb29wIGl0ZXJhdGlvbi5cbiAgdmFyIGJyZWFrZXIgPSB7fTtcblxuICAvLyBTYXZlIGJ5dGVzIGluIHRoZSBtaW5pZmllZCAoYnV0IG5vdCBnemlwcGVkKSB2ZXJzaW9uOlxuICB2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZSwgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlLCBGdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgLy8gQ3JlYXRlIHF1aWNrIHJlZmVyZW5jZSB2YXJpYWJsZXMgZm9yIHNwZWVkIGFjY2VzcyB0byBjb3JlIHByb3RvdHlwZXMuXG4gIHZhclxuICAgIHB1c2ggICAgICAgICAgICAgPSBBcnJheVByb3RvLnB1c2gsXG4gICAgc2xpY2UgICAgICAgICAgICA9IEFycmF5UHJvdG8uc2xpY2UsXG4gICAgY29uY2F0ICAgICAgICAgICA9IEFycmF5UHJvdG8uY29uY2F0LFxuICAgIHRvU3RyaW5nICAgICAgICAgPSBPYmpQcm90by50b1N0cmluZyxcbiAgICBoYXNPd25Qcm9wZXJ0eSAgID0gT2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gQWxsICoqRUNNQVNjcmlwdCA1KiogbmF0aXZlIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9ucyB0aGF0IHdlIGhvcGUgdG8gdXNlXG4gIC8vIGFyZSBkZWNsYXJlZCBoZXJlLlxuICB2YXJcbiAgICBuYXRpdmVGb3JFYWNoICAgICAgPSBBcnJheVByb3RvLmZvckVhY2gsXG4gICAgbmF0aXZlTWFwICAgICAgICAgID0gQXJyYXlQcm90by5tYXAsXG4gICAgbmF0aXZlUmVkdWNlICAgICAgID0gQXJyYXlQcm90by5yZWR1Y2UsXG4gICAgbmF0aXZlUmVkdWNlUmlnaHQgID0gQXJyYXlQcm90by5yZWR1Y2VSaWdodCxcbiAgICBuYXRpdmVGaWx0ZXIgICAgICAgPSBBcnJheVByb3RvLmZpbHRlcixcbiAgICBuYXRpdmVFdmVyeSAgICAgICAgPSBBcnJheVByb3RvLmV2ZXJ5LFxuICAgIG5hdGl2ZVNvbWUgICAgICAgICA9IEFycmF5UHJvdG8uc29tZSxcbiAgICBuYXRpdmVJbmRleE9mICAgICAgPSBBcnJheVByb3RvLmluZGV4T2YsXG4gICAgbmF0aXZlTGFzdEluZGV4T2YgID0gQXJyYXlQcm90by5sYXN0SW5kZXhPZixcbiAgICBuYXRpdmVJc0FycmF5ICAgICAgPSBBcnJheS5pc0FycmF5LFxuICAgIG5hdGl2ZUtleXMgICAgICAgICA9IE9iamVjdC5rZXlzLFxuICAgIG5hdGl2ZUJpbmQgICAgICAgICA9IEZ1bmNQcm90by5iaW5kO1xuXG4gIC8vIENyZWF0ZSBhIHNhZmUgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgdXNlIGJlbG93LlxuICB2YXIgXyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBfKSByZXR1cm4gb2JqO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBfKSkgcmV0dXJuIG5ldyBfKG9iaik7XG4gICAgdGhpcy5fd3JhcHBlZCA9IG9iajtcbiAgfTtcblxuICAvLyBFeHBvcnQgdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciAqKk5vZGUuanMqKiwgd2l0aFxuICAvLyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3IgdGhlIG9sZCBgcmVxdWlyZSgpYCBBUEkuIElmIHdlJ3JlIGluXG4gIC8vIHRoZSBicm93c2VyLCBhZGQgYF9gIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgXCJhZHZhbmNlZFwiIG1vZGUuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IF87XG4gICAgfVxuICAgIGV4cG9ydHMuXyA9IF87XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5fID0gXztcbiAgfVxuXG4gIC8vIEN1cnJlbnQgdmVyc2lvbi5cbiAgXy5WRVJTSU9OID0gJzEuNS4yJztcblxuICAvLyBDb2xsZWN0aW9uIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRoZSBjb3JuZXJzdG9uZSwgYW4gYGVhY2hgIGltcGxlbWVudGF0aW9uLCBha2EgYGZvckVhY2hgLlxuICAvLyBIYW5kbGVzIG9iamVjdHMgd2l0aCB0aGUgYnVpbHQtaW4gYGZvckVhY2hgLCBhcnJheXMsIGFuZCByYXcgb2JqZWN0cy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZvckVhY2hgIGlmIGF2YWlsYWJsZS5cbiAgdmFyIGVhY2ggPSBfLmVhY2ggPSBfLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgaWYgKG5hdGl2ZUZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IG5hdGl2ZUZvckVhY2gpIHtcbiAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gb2JqLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2tleXNbaV1dLCBrZXlzW2ldLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgcmVzdWx0cyBvZiBhcHBseWluZyB0aGUgaXRlcmF0b3IgdG8gZWFjaCBlbGVtZW50LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbWFwYCBpZiBhdmFpbGFibGUuXG4gIF8ubWFwID0gXy5jb2xsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlTWFwICYmIG9iai5tYXAgPT09IG5hdGl2ZU1hcCkgcmV0dXJuIG9iai5tYXAoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJlc3VsdHMucHVzaChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIHZhciByZWR1Y2VFcnJvciA9ICdSZWR1Y2Ugb2YgZW1wdHkgYXJyYXkgd2l0aCBubyBpbml0aWFsIHZhbHVlJztcblxuICAvLyAqKlJlZHVjZSoqIGJ1aWxkcyB1cCBhIHNpbmdsZSByZXN1bHQgZnJvbSBhIGxpc3Qgb2YgdmFsdWVzLCBha2EgYGluamVjdGAsXG4gIC8vIG9yIGBmb2xkbGAuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2UgPSBfLmZvbGRsID0gXy5pbmplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2UgJiYgb2JqLnJlZHVjZSA9PT0gbmF0aXZlUmVkdWNlKSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlKGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2UoaXRlcmF0b3IpO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IHZhbHVlO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBUaGUgcmlnaHQtYXNzb2NpYXRpdmUgdmVyc2lvbiBvZiByZWR1Y2UsIGFsc28ga25vd24gYXMgYGZvbGRyYC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZVJpZ2h0YCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlUmlnaHQgPSBfLmZvbGRyID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlUmlnaHQgJiYgb2JqLnJlZHVjZVJpZ2h0ID09PSBuYXRpdmVSZWR1Y2VSaWdodCkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yLCBtZW1vKSA6IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvcik7XG4gICAgfVxuICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggIT09ICtsZW5ndGgpIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaW5kZXggPSBrZXlzID8ga2V5c1stLWxlbmd0aF0gOiAtLWxlbmd0aDtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gb2JqW2luZGV4XTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCBvYmpbaW5kZXhdLCBpbmRleCwgbGlzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFpbml0aWFsKSB0aHJvdyBuZXcgVHlwZUVycm9yKHJlZHVjZUVycm9yKTtcbiAgICByZXR1cm4gbWVtbztcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIGZpcnN0IHZhbHVlIHdoaWNoIHBhc3NlcyBhIHRydXRoIHRlc3QuIEFsaWFzZWQgYXMgYGRldGVjdGAuXG4gIF8uZmluZCA9IF8uZGV0ZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHQ7XG4gICAgYW55KG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSB7XG4gICAgICAgIHJlc3VsdCA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIHRoYXQgcGFzcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmaWx0ZXJgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgc2VsZWN0YC5cbiAgXy5maWx0ZXIgPSBfLnNlbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZUZpbHRlciAmJiBvYmouZmlsdGVyID09PSBuYXRpdmVGaWx0ZXIpIHJldHVybiBvYmouZmlsdGVyKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSByZXN1bHRzLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFJldHVybiBhbGwgdGhlIGVsZW1lbnRzIGZvciB3aGljaCBhIHRydXRoIHRlc3QgZmFpbHMuXG4gIF8ucmVqZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHJldHVybiBfLmZpbHRlcihvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuICFpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgfSwgY29udGV4dCk7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgYWxsIG9mIHRoZSBlbGVtZW50cyBtYXRjaCBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBldmVyeWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbGxgLlxuICBfLmV2ZXJ5ID0gXy5hbGwgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IHRydWU7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVFdmVyeSAmJiBvYmouZXZlcnkgPT09IG5hdGl2ZUV2ZXJ5KSByZXR1cm4gb2JqLmV2ZXJ5KGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAoIShyZXN1bHQgPSByZXN1bHQgJiYgaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgZWxlbWVudCBpbiB0aGUgb2JqZWN0IG1hdGNoZXMgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgc29tZWAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBhbnlgLlxuICB2YXIgYW55ID0gXy5zb21lID0gXy5hbnkgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgfHwgKGl0ZXJhdG9yID0gXy5pZGVudGl0eSk7XG4gICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlU29tZSAmJiBvYmouc29tZSA9PT0gbmF0aXZlU29tZSkgcmV0dXJuIG9iai5zb21lKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpZiAocmVzdWx0IHx8IChyZXN1bHQgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIHRoZSBhcnJheSBvciBvYmplY3QgY29udGFpbnMgYSBnaXZlbiB2YWx1ZSAodXNpbmcgYD09PWApLlxuICAvLyBBbGlhc2VkIGFzIGBpbmNsdWRlYC5cbiAgXy5jb250YWlucyA9IF8uaW5jbHVkZSA9IGZ1bmN0aW9uKG9iaiwgdGFyZ2V0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgb2JqLmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBvYmouaW5kZXhPZih0YXJnZXQpICE9IC0xO1xuICAgIHJldHVybiBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSB0YXJnZXQ7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gSW52b2tlIGEgbWV0aG9kICh3aXRoIGFyZ3VtZW50cykgb24gZXZlcnkgaXRlbSBpbiBhIGNvbGxlY3Rpb24uXG4gIF8uaW52b2tlID0gZnVuY3Rpb24ob2JqLCBtZXRob2QpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgaXNGdW5jID0gXy5pc0Z1bmN0aW9uKG1ldGhvZCk7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiAoaXNGdW5jID8gbWV0aG9kIDogdmFsdWVbbWV0aG9kXSkuYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYG1hcGA6IGZldGNoaW5nIGEgcHJvcGVydHkuXG4gIF8ucGx1Y2sgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuIHZhbHVlW2tleV07IH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbHRlcmA6IHNlbGVjdGluZyBvbmx5IG9iamVjdHNcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy53aGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMsIGZpcnN0KSB7XG4gICAgaWYgKF8uaXNFbXB0eShhdHRycykpIHJldHVybiBmaXJzdCA/IHZvaWQgMCA6IFtdO1xuICAgIHJldHVybiBfW2ZpcnN0ID8gJ2ZpbmQnIDogJ2ZpbHRlciddKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBhdHRycykge1xuICAgICAgICBpZiAoYXR0cnNba2V5XSAhPT0gdmFsdWVba2V5XSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy53aGVyZShvYmosIGF0dHJzLCB0cnVlKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1heGltdW0gZWxlbWVudCBvciAoZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIC8vIENhbid0IG9wdGltaXplIGFycmF5cyBvZiBpbnRlZ2VycyBsb25nZXIgdGhhbiA2NSw1MzUgZWxlbWVudHMuXG4gIC8vIFNlZSBbV2ViS2l0IEJ1ZyA4MDc5N10oaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgwNzk3KVxuICBfLm1heCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gLUluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiAtSW5maW5pdHksIHZhbHVlOiAtSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA+IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4uYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIEluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiBJbmZpbml0eSwgdmFsdWU6IEluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPCByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGFuIGFycmF5LCB1c2luZyB0aGUgbW9kZXJuIHZlcnNpb24gb2YgdGhlIFxuICAvLyBbRmlzaGVyLVlhdGVzIHNodWZmbGVdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmlzaGVy4oCTWWF0ZXNfc2h1ZmZsZSkuXG4gIF8uc2h1ZmZsZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByYW5kO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNodWZmbGVkID0gW107XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByYW5kID0gXy5yYW5kb20oaW5kZXgrKyk7XG4gICAgICBzaHVmZmxlZFtpbmRleCAtIDFdID0gc2h1ZmZsZWRbcmFuZF07XG4gICAgICBzaHVmZmxlZFtyYW5kXSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBzaHVmZmxlZDtcbiAgfTtcblxuICAvLyBTYW1wbGUgKipuKiogcmFuZG9tIHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICAvLyBJZiAqKm4qKiBpcyBub3Qgc3BlY2lmaWVkLCByZXR1cm5zIGEgc2luZ2xlIHJhbmRvbSBlbGVtZW50IGZyb20gdGhlIGFycmF5LlxuICAvLyBUaGUgaW50ZXJuYWwgYGd1YXJkYCBhcmd1bWVudCBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBtYXBgLlxuICBfLnNhbXBsZSA9IGZ1bmN0aW9uKG9iaiwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBvYmpbXy5yYW5kb20ob2JqLmxlbmd0aCAtIDEpXTtcbiAgICB9XG4gICAgcmV0dXJuIF8uc2h1ZmZsZShvYmopLnNsaWNlKDAsIE1hdGgubWF4KDAsIG4pKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBnZW5lcmF0ZSBsb29rdXAgaXRlcmF0b3JzLlxuICB2YXIgbG9va3VwSXRlcmF0b3IgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUgOiBmdW5jdGlvbihvYmopeyByZXR1cm4gb2JqW3ZhbHVlXTsgfTtcbiAgfTtcblxuICAvLyBTb3J0IHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24gcHJvZHVjZWQgYnkgYW4gaXRlcmF0b3IuXG4gIF8uc29ydEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgIHZhciBpdGVyYXRvciA9IGxvb2t1cEl0ZXJhdG9yKHZhbHVlKTtcbiAgICByZXR1cm4gXy5wbHVjayhfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIGNyaXRlcmlhOiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCAtIHJpZ2h0LmluZGV4O1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKGJlaGF2aW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgIHZhciBpdGVyYXRvciA9IHZhbHVlID09IG51bGwgPyBfLmlkZW50aXR5IDogbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgICB2YXIga2V5ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICAgIGJlaGF2aW9yKHJlc3VsdCwga2V5LCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBHcm91cHMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbi4gUGFzcyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlXG4gIC8vIHRvIGdyb3VwIGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3JpdGVyaW9uLlxuICBfLmdyb3VwQnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICAoXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0gOiAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuICB9KTtcblxuICAvLyBJbmRleGVzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24sIHNpbWlsYXIgdG8gYGdyb3VwQnlgLCBidXQgZm9yXG4gIC8vIHdoZW4geW91IGtub3cgdGhhdCB5b3VyIGluZGV4IHZhbHVlcyB3aWxsIGJlIHVuaXF1ZS5cbiAgXy5pbmRleEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgfSk7XG5cbiAgLy8gQ291bnRzIGluc3RhbmNlcyBvZiBhbiBvYmplY3QgdGhhdCBncm91cCBieSBhIGNlcnRhaW4gY3JpdGVyaW9uLiBQYXNzXG4gIC8vIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGUgdG8gY291bnQgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAvLyBjcml0ZXJpb24uXG4gIF8uY291bnRCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5KSB7XG4gICAgXy5oYXMocmVzdWx0LCBrZXkpID8gcmVzdWx0W2tleV0rKyA6IHJlc3VsdFtrZXldID0gMTtcbiAgfSk7XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yID0gaXRlcmF0b3IgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcihpdGVyYXRvcik7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmopO1xuICAgIHZhciBsb3cgPSAwLCBoaWdoID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+PiAxO1xuICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBhcnJheVttaWRdKSA8IHZhbHVlID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG4gIH07XG5cbiAgLy8gU2FmZWx5IGNyZWF0ZSBhIHJlYWwsIGxpdmUgYXJyYXkgZnJvbSBhbnl0aGluZyBpdGVyYWJsZS5cbiAgXy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFvYmopIHJldHVybiBbXTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHJldHVybiBzbGljZS5jYWxsKG9iaik7XG4gICAgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSByZXR1cm4gXy5tYXAob2JqLCBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gXy52YWx1ZXMob2JqKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG51bWJlciBvZiBlbGVtZW50cyBpbiBhbiBvYmplY3QuXG4gIF8uc2l6ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIDA7XG4gICAgcmV0dXJuIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgPyBvYmoubGVuZ3RoIDogXy5rZXlzKG9iaikubGVuZ3RoO1xuICB9O1xuXG4gIC8vIEFycmF5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS1cblxuICAvLyBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGZpcnN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgaGVhZGAgYW5kIGB0YWtlYC4gVGhlICoqZ3VhcmQqKiBjaGVja1xuICAvLyBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8uZmlyc3QgPSBfLmhlYWQgPSBfLnRha2UgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICByZXR1cm4gKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyBhcnJheVswXSA6IHNsaWNlLmNhbGwoYXJyYXksIDAsIG4pO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGhcbiAgLy8gYF8ubWFwYC5cbiAgXy5pbml0aWFsID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIGFycmF5Lmxlbmd0aCAtICgobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGxhc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5sYXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKChuID09IG51bGwpIHx8IGd1YXJkKSB7XG4gICAgICByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCBNYXRoLm1heChhcnJheS5sZW5ndGggLSBuLCAwKSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqXG4gIC8vIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pO1xuICB9O1xuXG4gIC8vIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgXy5jb21wYWN0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIF8uaWRlbnRpdHkpO1xuICB9O1xuXG4gIC8vIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIGEgcmVjdXJzaXZlIGBmbGF0dGVuYCBmdW5jdGlvbi5cbiAgdmFyIGZsYXR0ZW4gPSBmdW5jdGlvbihpbnB1dCwgc2hhbGxvdywgb3V0cHV0KSB7XG4gICAgaWYgKHNoYWxsb3cgJiYgXy5ldmVyeShpbnB1dCwgXy5pc0FycmF5KSkge1xuICAgICAgcmV0dXJuIGNvbmNhdC5hcHBseShvdXRwdXQsIGlucHV0KTtcbiAgICB9XG4gICAgZWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmIChfLmlzQXJyYXkodmFsdWUpIHx8IF8uaXNBcmd1bWVudHModmFsdWUpKSB7XG4gICAgICAgIHNoYWxsb3cgPyBwdXNoLmFwcGx5KG91dHB1dCwgdmFsdWUpIDogZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgb3V0cHV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIEZsYXR0ZW4gb3V0IGFuIGFycmF5LCBlaXRoZXIgcmVjdXJzaXZlbHkgKGJ5IGRlZmF1bHQpLCBvciBqdXN0IG9uZSBsZXZlbC5cbiAgXy5mbGF0dGVuID0gZnVuY3Rpb24oYXJyYXksIHNoYWxsb3cpIHtcbiAgICByZXR1cm4gZmxhdHRlbihhcnJheSwgc2hhbGxvdywgW10pO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHZlcnNpb24gb2YgdGhlIGFycmF5IHRoYXQgZG9lcyBub3QgY29udGFpbiB0aGUgc3BlY2lmaWVkIHZhbHVlKHMpLlxuICBfLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmRpZmZlcmVuY2UoYXJyYXksIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhIGR1cGxpY2F0ZS1mcmVlIHZlcnNpb24gb2YgdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGFscmVhZHlcbiAgLy8gYmVlbiBzb3J0ZWQsIHlvdSBoYXZlIHRoZSBvcHRpb24gb2YgdXNpbmcgYSBmYXN0ZXIgYWxnb3JpdGhtLlxuICAvLyBBbGlhc2VkIGFzIGB1bmlxdWVgLlxuICBfLnVuaXEgPSBfLnVuaXF1ZSA9IGZ1bmN0aW9uKGFycmF5LCBpc1NvcnRlZCwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKGlzU29ydGVkKSkge1xuICAgICAgY29udGV4dCA9IGl0ZXJhdG9yO1xuICAgICAgaXRlcmF0b3IgPSBpc1NvcnRlZDtcbiAgICAgIGlzU29ydGVkID0gZmFsc2U7XG4gICAgfVxuICAgIHZhciBpbml0aWFsID0gaXRlcmF0b3IgPyBfLm1hcChhcnJheSwgaXRlcmF0b3IsIGNvbnRleHQpIDogYXJyYXk7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgc2VlbiA9IFtdO1xuICAgIGVhY2goaW5pdGlhbCwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICBpZiAoaXNTb3J0ZWQgPyAoIWluZGV4IHx8IHNlZW5bc2Vlbi5sZW5ndGggLSAxXSAhPT0gdmFsdWUpIDogIV8uY29udGFpbnMoc2VlbiwgdmFsdWUpKSB7XG4gICAgICAgIHNlZW4ucHVzaCh2YWx1ZSk7XG4gICAgICAgIHJlc3VsdHMucHVzaChhcnJheVtpbmRleF0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgdW5pb246IGVhY2ggZGlzdGluY3QgZWxlbWVudCBmcm9tIGFsbCBvZlxuICAvLyB0aGUgcGFzc2VkLWluIGFycmF5cy5cbiAgXy51bmlvbiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLnVuaXEoXy5mbGF0dGVuKGFyZ3VtZW50cywgdHJ1ZSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYW4gYXJyYXkgdGhhdCBjb250YWlucyBldmVyeSBpdGVtIHNoYXJlZCBiZXR3ZWVuIGFsbCB0aGVcbiAgLy8gcGFzc2VkLWluIGFycmF5cy5cbiAgXy5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBfLmZpbHRlcihfLnVuaXEoYXJyYXkpLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICByZXR1cm4gXy5ldmVyeShyZXN0LCBmdW5jdGlvbihvdGhlcikge1xuICAgICAgICByZXR1cm4gXy5pbmRleE9mKG90aGVyLCBpdGVtKSA+PSAwO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gVGFrZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIG9uZSBhcnJheSBhbmQgYSBudW1iZXIgb2Ygb3RoZXIgYXJyYXlzLlxuICAvLyBPbmx5IHRoZSBlbGVtZW50cyBwcmVzZW50IGluIGp1c3QgdGhlIGZpcnN0IGFycmF5IHdpbGwgcmVtYWluLlxuICBfLmRpZmZlcmVuY2UgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN0ID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiAhXy5jb250YWlucyhyZXN0LCB2YWx1ZSk7IH0pO1xuICB9O1xuXG4gIC8vIFppcCB0b2dldGhlciBtdWx0aXBsZSBsaXN0cyBpbnRvIGEgc2luZ2xlIGFycmF5IC0tIGVsZW1lbnRzIHRoYXQgc2hhcmVcbiAgLy8gYW4gaW5kZXggZ28gdG9nZXRoZXIuXG4gIF8uemlwID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbmd0aCA9IF8ubWF4KF8ucGx1Y2soYXJndW1lbnRzLCBcImxlbmd0aFwiKS5jb25jYXQoMCkpO1xuICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0c1tpXSA9IF8ucGx1Y2soYXJndW1lbnRzLCAnJyArIGkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDb252ZXJ0cyBsaXN0cyBpbnRvIG9iamVjdHMuIFBhc3MgZWl0aGVyIGEgc2luZ2xlIGFycmF5IG9mIGBba2V5LCB2YWx1ZV1gXG4gIC8vIHBhaXJzLCBvciB0d28gcGFyYWxsZWwgYXJyYXlzIG9mIHRoZSBzYW1lIGxlbmd0aCAtLSBvbmUgb2Yga2V5cywgYW5kIG9uZSBvZlxuICAvLyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gIF8ub2JqZWN0ID0gZnVuY3Rpb24obGlzdCwgdmFsdWVzKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIHt9O1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0gbGlzdC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICByZXN1bHRbbGlzdFtpXV0gPSB2YWx1ZXNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbbGlzdFtpXVswXV0gPSBsaXN0W2ldWzFdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcGx5IHVzIHdpdGggaW5kZXhPZiAoSSdtIGxvb2tpbmcgYXQgeW91LCAqKk1TSUUqKiksXG4gIC8vIHdlIG5lZWQgdGhpcyBmdW5jdGlvbi4gUmV0dXJuIHRoZSBwb3NpdGlvbiBvZiB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBhblxuICAvLyBpdGVtIGluIGFuIGFycmF5LCBvciAtMSBpZiB0aGUgaXRlbSBpcyBub3QgaW5jbHVkZWQgaW4gdGhlIGFycmF5LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgaW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICAvLyBJZiB0aGUgYXJyYXkgaXMgbGFyZ2UgYW5kIGFscmVhZHkgaW4gc29ydCBvcmRlciwgcGFzcyBgdHJ1ZWBcbiAgLy8gZm9yICoqaXNTb3J0ZWQqKiB0byB1c2UgYmluYXJ5IHNlYXJjaC5cbiAgXy5pbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGlzU29ydGVkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaSA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgaXNTb3J0ZWQgPT0gJ251bWJlcicpIHtcbiAgICAgICAgaSA9IChpc1NvcnRlZCA8IDAgPyBNYXRoLm1heCgwLCBsZW5ndGggKyBpc1NvcnRlZCkgOiBpc1NvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gXy5zb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpXSA9PT0gaXRlbSA/IGkgOiAtMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgYXJyYXkuaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIGFycmF5LmluZGV4T2YoaXRlbSwgaXNTb3J0ZWQpO1xuICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBsYXN0SW5kZXhPZmAgaWYgYXZhaWxhYmxlLlxuICBfLmxhc3RJbmRleE9mID0gZnVuY3Rpb24oYXJyYXksIGl0ZW0sIGZyb20pIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBoYXNJbmRleCA9IGZyb20gIT0gbnVsbDtcbiAgICBpZiAobmF0aXZlTGFzdEluZGV4T2YgJiYgYXJyYXkubGFzdEluZGV4T2YgPT09IG5hdGl2ZUxhc3RJbmRleE9mKSB7XG4gICAgICByZXR1cm4gaGFzSW5kZXggPyBhcnJheS5sYXN0SW5kZXhPZihpdGVtLCBmcm9tKSA6IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0pO1xuICAgIH1cbiAgICB2YXIgaSA9IChoYXNJbmRleCA/IGZyb20gOiBhcnJheS5sZW5ndGgpO1xuICAgIHdoaWxlIChpLS0pIGlmIChhcnJheVtpXSA9PT0gaXRlbSkgcmV0dXJuIGk7XG4gICAgcmV0dXJuIC0xO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGFuIGludGVnZXIgQXJyYXkgY29udGFpbmluZyBhbiBhcml0aG1ldGljIHByb2dyZXNzaW9uLiBBIHBvcnQgb2ZcbiAgLy8gdGhlIG5hdGl2ZSBQeXRob24gYHJhbmdlKClgIGZ1bmN0aW9uLiBTZWVcbiAgLy8gW3RoZSBQeXRob24gZG9jdW1lbnRhdGlvbl0oaHR0cDovL2RvY3MucHl0aG9uLm9yZy9saWJyYXJ5L2Z1bmN0aW9ucy5odG1sI3JhbmdlKS5cbiAgXy5yYW5nZSA9IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPD0gMSkge1xuICAgICAgc3RvcCA9IHN0YXJ0IHx8IDA7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHN0ZXAgPSBhcmd1bWVudHNbMl0gfHwgMTtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLm1heChNYXRoLmNlaWwoKHN0b3AgLSBzdGFydCkgLyBzdGVwKSwgMCk7XG4gICAgdmFyIGlkeCA9IDA7XG4gICAgdmFyIHJhbmdlID0gbmV3IEFycmF5KGxlbmd0aCk7XG5cbiAgICB3aGlsZShpZHggPCBsZW5ndGgpIHtcbiAgICAgIHJhbmdlW2lkeCsrXSA9IHN0YXJ0O1xuICAgICAgc3RhcnQgKz0gc3RlcDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZ2U7XG4gIH07XG5cbiAgLy8gRnVuY3Rpb24gKGFoZW0pIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXVzYWJsZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgcHJvdG90eXBlIHNldHRpbmcuXG4gIHZhciBjdG9yID0gZnVuY3Rpb24oKXt9O1xuXG4gIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIGEgZ2l2ZW4gb2JqZWN0IChhc3NpZ25pbmcgYHRoaXNgLCBhbmQgYXJndW1lbnRzLFxuICAvLyBvcHRpb25hbGx5KS4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYEZ1bmN0aW9uLmJpbmRgIGlmXG4gIC8vIGF2YWlsYWJsZS5cbiAgXy5iaW5kID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCkge1xuICAgIHZhciBhcmdzLCBib3VuZDtcbiAgICBpZiAobmF0aXZlQmluZCAmJiBmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgaWYgKCFfLmlzRnVuY3Rpb24oZnVuYykpIHRocm93IG5ldyBUeXBlRXJyb3I7XG4gICAgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gYm91bmQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBib3VuZCkpIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBzZWxmID0gbmV3IGN0b3I7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IG51bGw7XG4gICAgICB2YXIgcmVzdWx0ID0gZnVuYy5hcHBseShzZWxmLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIGlmIChPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0KSByZXR1cm4gcmVzdWx0O1xuICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfTtcbiAgfTtcblxuICAvLyBQYXJ0aWFsbHkgYXBwbHkgYSBmdW5jdGlvbiBieSBjcmVhdGluZyBhIHZlcnNpb24gdGhhdCBoYXMgaGFkIHNvbWUgb2YgaXRzXG4gIC8vIGFyZ3VtZW50cyBwcmUtZmlsbGVkLCB3aXRob3V0IGNoYW5naW5nIGl0cyBkeW5hbWljIGB0aGlzYCBjb250ZXh0LlxuICBfLnBhcnRpYWwgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBCaW5kIGFsbCBvZiBhbiBvYmplY3QncyBtZXRob2RzIHRvIHRoYXQgb2JqZWN0LiBVc2VmdWwgZm9yIGVuc3VyaW5nIHRoYXRcbiAgLy8gYWxsIGNhbGxiYWNrcyBkZWZpbmVkIG9uIGFuIG9iamVjdCBiZWxvbmcgdG8gaXQuXG4gIF8uYmluZEFsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBmdW5jcyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBpZiAoZnVuY3MubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJiaW5kQWxsIG11c3QgYmUgcGFzc2VkIGZ1bmN0aW9uIG5hbWVzXCIpO1xuICAgIGVhY2goZnVuY3MsIGZ1bmN0aW9uKGYpIHsgb2JqW2ZdID0gXy5iaW5kKG9ialtmXSwgb2JqKTsgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBNZW1vaXplIGFuIGV4cGVuc2l2ZSBmdW5jdGlvbiBieSBzdG9yaW5nIGl0cyByZXN1bHRzLlxuICBfLm1lbW9pemUgPSBmdW5jdGlvbihmdW5jLCBoYXNoZXIpIHtcbiAgICB2YXIgbWVtbyA9IHt9O1xuICAgIGhhc2hlciB8fCAoaGFzaGVyID0gXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGtleSA9IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIF8uaGFzKG1lbW8sIGtleSkgPyBtZW1vW2tleV0gOiAobWVtb1trZXldID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIERlbGF5cyBhIGZ1bmN0aW9uIGZvciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgYW5kIHRoZW4gY2FsbHNcbiAgLy8gaXQgd2l0aCB0aGUgYXJndW1lbnRzIHN1cHBsaWVkLlxuICBfLmRlbGF5ID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpOyB9LCB3YWl0KTtcbiAgfTtcblxuICAvLyBEZWZlcnMgYSBmdW5jdGlvbiwgc2NoZWR1bGluZyBpdCB0byBydW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXNcbiAgLy8gY2xlYXJlZC5cbiAgXy5kZWZlciA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICByZXR1cm4gXy5kZWxheS5hcHBseShfLCBbZnVuYywgMV0uY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS4gTm9ybWFsbHksIHRoZSB0aHJvdHRsZWQgZnVuY3Rpb24gd2lsbCBydW5cbiAgLy8gYXMgbXVjaCBhcyBpdCBjYW4sIHdpdGhvdXQgZXZlciBnb2luZyBtb3JlIHRoYW4gb25jZSBwZXIgYHdhaXRgIGR1cmF0aW9uO1xuICAvLyBidXQgaWYgeW91J2QgbGlrZSB0byBkaXNhYmxlIHRoZSBleGVjdXRpb24gb24gdGhlIGxlYWRpbmcgZWRnZSwgcGFzc1xuICAvLyBge2xlYWRpbmc6IGZhbHNlfWAuIFRvIGRpc2FibGUgZXhlY3V0aW9uIG9uIHRoZSB0cmFpbGluZyBlZGdlLCBkaXR0by5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogbmV3IERhdGU7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgbm93ID0gbmV3IERhdGU7XG4gICAgICBpZiAoIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UpIHByZXZpb3VzID0gbm93O1xuICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gIC8vIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAgLy8gTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gIC8vIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gIF8uZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICB2YXIgdGltZW91dCwgYXJncywgY29udGV4dCwgdGltZXN0YW1wLCByZXN1bHQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgdGltZXN0YW1wID0gbmV3IERhdGUoKTtcbiAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbGFzdCA9IChuZXcgRGF0ZSgpKSAtIHRpbWVzdGFtcDtcbiAgICAgICAgaWYgKGxhc3QgPCB3YWl0KSB7XG4gICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQgLSBsYXN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICBpZiAoIWltbWVkaWF0ZSkgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgaWYgKCF0aW1lb3V0KSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICAgIH1cbiAgICAgIGlmIChjYWxsTm93KSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgYXQgbW9zdCBvbmUgdGltZSwgbm8gbWF0dGVyIGhvd1xuICAvLyBvZnRlbiB5b3UgY2FsbCBpdC4gVXNlZnVsIGZvciBsYXp5IGluaXRpYWxpemF0aW9uLlxuICBfLm9uY2UgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIHJhbiA9IGZhbHNlLCBtZW1vO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChyYW4pIHJldHVybiBtZW1vO1xuICAgICAgcmFuID0gdHJ1ZTtcbiAgICAgIG1lbW8gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICBmdW5jID0gbnVsbDtcbiAgICAgIHJldHVybiBtZW1vO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyB0aGUgZmlyc3QgZnVuY3Rpb24gcGFzc2VkIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSBzZWNvbmQsXG4gIC8vIGFsbG93aW5nIHlvdSB0byBhZGp1c3QgYXJndW1lbnRzLCBydW4gY29kZSBiZWZvcmUgYW5kIGFmdGVyLCBhbmRcbiAgLy8gY29uZGl0aW9uYWxseSBleGVjdXRlIHRoZSBvcmlnaW5hbCBmdW5jdGlvbi5cbiAgXy53cmFwID0gZnVuY3Rpb24oZnVuYywgd3JhcHBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gW2Z1bmNdO1xuICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIHdyYXBwZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBpcyB0aGUgY29tcG9zaXRpb24gb2YgYSBsaXN0IG9mIGZ1bmN0aW9ucywgZWFjaFxuICAvLyBjb25zdW1pbmcgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZnVuY3Rpb24gdGhhdCBmb2xsb3dzLlxuICBfLmNvbXBvc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZnVuY3MgPSBhcmd1bWVudHM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBmb3IgKHZhciBpID0gZnVuY3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgYXJncyA9IFtmdW5jc1tpXS5hcHBseSh0aGlzLCBhcmdzKV07XG4gICAgICB9XG4gICAgICByZXR1cm4gYXJnc1swXTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBhZnRlciBiZWluZyBjYWxsZWQgTiB0aW1lcy5cbiAgXy5hZnRlciA9IGZ1bmN0aW9uKHRpbWVzLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICAvLyBPYmplY3QgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSZXRyaWV2ZSB0aGUgbmFtZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYE9iamVjdC5rZXlzYFxuICBfLmtleXMgPSBuYXRpdmVLZXlzIHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogIT09IE9iamVjdChvYmopKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIG9iamVjdCcpO1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH07XG5cbiAgLy8gUmV0cmlldmUgdGhlIHZhbHVlcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICBfLnZhbHVlcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciB2YWx1ZXMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWx1ZXNbaV0gPSBvYmpba2V5c1tpXV07XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH07XG5cbiAgLy8gQ29udmVydCBhbiBvYmplY3QgaW50byBhIGxpc3Qgb2YgYFtrZXksIHZhbHVlXWAgcGFpcnMuXG4gIF8ucGFpcnMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgcGFpcnMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBwYWlyc1tpXSA9IFtrZXlzW2ldLCBvYmpba2V5c1tpXV1dO1xuICAgIH1cbiAgICByZXR1cm4gcGFpcnM7XG4gIH07XG5cbiAgLy8gSW52ZXJ0IHRoZSBrZXlzIGFuZCB2YWx1ZXMgb2YgYW4gb2JqZWN0LiBUaGUgdmFsdWVzIG11c3QgYmUgc2VyaWFsaXphYmxlLlxuICBfLmludmVydCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRbb2JqW2tleXNbaV1dXSA9IGtleXNbaV07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgc29ydGVkIGxpc3Qgb2YgdGhlIGZ1bmN0aW9uIG5hbWVzIGF2YWlsYWJsZSBvbiB0aGUgb2JqZWN0LlxuICAvLyBBbGlhc2VkIGFzIGBtZXRob2RzYFxuICBfLmZ1bmN0aW9ucyA9IF8ubWV0aG9kcyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBuYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChfLmlzRnVuY3Rpb24ob2JqW2tleV0pKSBuYW1lcy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBuYW1lcy5zb3J0KCk7XG4gIH07XG5cbiAgLy8gRXh0ZW5kIGEgZ2l2ZW4gb2JqZWN0IHdpdGggYWxsIHRoZSBwcm9wZXJ0aWVzIGluIHBhc3NlZC1pbiBvYmplY3QocykuXG4gIF8uZXh0ZW5kID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IG9ubHkgY29udGFpbmluZyB0aGUgd2hpdGVsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5waWNrID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGVhY2goa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoa2V5IGluIG9iaikgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCB3aXRob3V0IHRoZSBibGFja2xpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLm9taXQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKCFfLmNvbnRhaW5zKGtleXMsIGtleSkpIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAvLyBGaWxsIGluIGEgZ2l2ZW4gb2JqZWN0IHdpdGggZGVmYXVsdCBwcm9wZXJ0aWVzLlxuICBfLmRlZmF1bHRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgaWYgKHNvdXJjZSkge1xuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgIGlmIChvYmpbcHJvcF0gPT09IHZvaWQgMCkgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBDcmVhdGUgYSAoc2hhbGxvdy1jbG9uZWQpIGR1cGxpY2F0ZSBvZiBhbiBvYmplY3QuXG4gIF8uY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIV8uaXNPYmplY3Qob2JqKSkgcmV0dXJuIG9iajtcbiAgICByZXR1cm4gXy5pc0FycmF5KG9iaikgPyBvYmouc2xpY2UoKSA6IF8uZXh0ZW5kKHt9LCBvYmopO1xuICB9O1xuXG4gIC8vIEludm9rZXMgaW50ZXJjZXB0b3Igd2l0aCB0aGUgb2JqLCBhbmQgdGhlbiByZXR1cm5zIG9iai5cbiAgLy8gVGhlIHByaW1hcnkgcHVycG9zZSBvZiB0aGlzIG1ldGhvZCBpcyB0byBcInRhcCBpbnRvXCIgYSBtZXRob2QgY2hhaW4sIGluXG4gIC8vIG9yZGVyIHRvIHBlcmZvcm0gb3BlcmF0aW9ucyBvbiBpbnRlcm1lZGlhdGUgcmVzdWx0cyB3aXRoaW4gdGhlIGNoYWluLlxuICBfLnRhcCA9IGZ1bmN0aW9uKG9iaiwgaW50ZXJjZXB0b3IpIHtcbiAgICBpbnRlcmNlcHRvcihvYmopO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgcmVjdXJzaXZlIGNvbXBhcmlzb24gZnVuY3Rpb24gZm9yIGBpc0VxdWFsYC5cbiAgdmFyIGVxID0gZnVuY3Rpb24oYSwgYiwgYVN0YWNrLCBiU3RhY2spIHtcbiAgICAvLyBJZGVudGljYWwgb2JqZWN0cyBhcmUgZXF1YWwuIGAwID09PSAtMGAsIGJ1dCB0aGV5IGFyZW4ndCBpZGVudGljYWwuXG4gICAgLy8gU2VlIHRoZSBbSGFybW9ueSBgZWdhbGAgcHJvcG9zYWxdKGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6ZWdhbCkuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPSB0b1N0cmluZy5jYWxsKGIpKSByZXR1cm4gZmFsc2U7XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIC8vIFN0cmluZ3MsIG51bWJlcnMsIGRhdGVzLCBhbmQgYm9vbGVhbnMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLlxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gYSA9PSBTdHJpbmcoYik7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLiBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yXG4gICAgICAgIC8vIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gYSAhPSArYSA/IGIgIT0gK2IgOiAoYSA9PSAwID8gMSAvIGEgPT0gMSAvIGIgOiBhID09ICtiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PSArYjtcbiAgICAgIC8vIFJlZ0V4cHMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyIHNvdXJjZSBwYXR0ZXJucyBhbmQgZmxhZ3MuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICByZXR1cm4gYS5zb3VyY2UgPT0gYi5zb3VyY2UgJiZcbiAgICAgICAgICAgICAgIGEuZ2xvYmFsID09IGIuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICBhLm11bHRpbGluZSA9PSBiLm11bHRpbGluZSAmJlxuICAgICAgICAgICAgICAgYS5pZ25vcmVDYXNlID09IGIuaWdub3JlQ2FzZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT0gYSkgcmV0dXJuIGJTdGFja1tsZW5ndGhdID09IGI7XG4gICAgfVxuICAgIC8vIE9iamVjdHMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1aXZhbGVudCwgYnV0IGBPYmplY3Rgc1xuICAgIC8vIGZyb20gZGlmZmVyZW50IGZyYW1lcyBhcmUuXG4gICAgdmFyIGFDdG9yID0gYS5jb25zdHJ1Y3RvciwgYkN0b3IgPSBiLmNvbnN0cnVjdG9yO1xuICAgIGlmIChhQ3RvciAhPT0gYkN0b3IgJiYgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIChhQ3RvciBpbnN0YW5jZW9mIGFDdG9yKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmlzRnVuY3Rpb24oYkN0b3IpICYmIChiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBmaXJzdCBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wdXNoKGEpO1xuICAgIGJTdGFjay5wdXNoKGIpO1xuICAgIHZhciBzaXplID0gMCwgcmVzdWx0ID0gdHJ1ZTtcbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoY2xhc3NOYW1lID09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIC8vIENvbXBhcmUgYXJyYXkgbGVuZ3RocyB0byBkZXRlcm1pbmUgaWYgYSBkZWVwIGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5LlxuICAgICAgc2l6ZSA9IGEubGVuZ3RoO1xuICAgICAgcmVzdWx0ID0gc2l6ZSA9PSBiLmxlbmd0aDtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgLy8gRGVlcCBjb21wYXJlIHRoZSBjb250ZW50cywgaWdub3Jpbmcgbm9uLW51bWVyaWMgcHJvcGVydGllcy5cbiAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgIGlmICghKHJlc3VsdCA9IGVxKGFbc2l6ZV0sIGJbc2l6ZV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIERlZXAgY29tcGFyZSBvYmplY3RzLlxuICAgICAgZm9yICh2YXIga2V5IGluIGEpIHtcbiAgICAgICAgaWYgKF8uaGFzKGEsIGtleSkpIHtcbiAgICAgICAgICAvLyBDb3VudCB0aGUgZXhwZWN0ZWQgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICAgICAgc2l6ZSsrO1xuICAgICAgICAgIC8vIERlZXAgY29tcGFyZSBlYWNoIG1lbWJlci5cbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBfLmhhcyhiLCBrZXkpICYmIGVxKGFba2V5XSwgYltrZXldLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gRW5zdXJlIHRoYXQgYm90aCBvYmplY3RzIGNvbnRhaW4gdGhlIHNhbWUgbnVtYmVyIG9mIHByb3BlcnRpZXMuXG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIGZvciAoa2V5IGluIGIpIHtcbiAgICAgICAgICBpZiAoXy5oYXMoYiwga2V5KSAmJiAhKHNpemUtLSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9ICFzaXplO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZW1vdmUgdGhlIGZpcnN0IG9iamVjdCBmcm9tIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucG9wKCk7XG4gICAgYlN0YWNrLnBvcCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUGVyZm9ybSBhIGRlZXAgY29tcGFyaXNvbiB0byBjaGVjayBpZiB0d28gb2JqZWN0cyBhcmUgZXF1YWwuXG4gIF8uaXNFcXVhbCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gZXEoYSwgYiwgW10sIFtdKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIGFycmF5LCBzdHJpbmcsIG9yIG9iamVjdCBlbXB0eT9cbiAgLy8gQW4gXCJlbXB0eVwiIG9iamVjdCBoYXMgbm8gZW51bWVyYWJsZSBvd24tcHJvcGVydGllcy5cbiAgXy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoXy5pc0FycmF5KG9iaikgfHwgXy5pc1N0cmluZyhvYmopKSByZXR1cm4gb2JqLmxlbmd0aCA9PT0gMDtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIERPTSBlbGVtZW50P1xuICBfLmlzRWxlbWVudCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiAhIShvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxKTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGFuIGFycmF5P1xuICAvLyBEZWxlZ2F0ZXMgdG8gRUNNQTUncyBuYXRpdmUgQXJyYXkuaXNBcnJheVxuICBfLmlzQXJyYXkgPSBuYXRpdmVJc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQXJyYXldJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIGFuIG9iamVjdD9cbiAgXy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xuICB9O1xuXG4gIC8vIEFkZCBzb21lIGlzVHlwZSBtZXRob2RzOiBpc0FyZ3VtZW50cywgaXNGdW5jdGlvbiwgaXNTdHJpbmcsIGlzTnVtYmVyLCBpc0RhdGUsIGlzUmVnRXhwLlxuICBlYWNoKFsnQXJndW1lbnRzJywgJ0Z1bmN0aW9uJywgJ1N0cmluZycsICdOdW1iZXInLCAnRGF0ZScsICdSZWdFeHAnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIF9bJ2lzJyArIG5hbWVdID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0ICcgKyBuYW1lICsgJ10nO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIERlZmluZSBhIGZhbGxiYWNrIHZlcnNpb24gb2YgdGhlIG1ldGhvZCBpbiBicm93c2VycyAoYWhlbSwgSUUpLCB3aGVyZVxuICAvLyB0aGVyZSBpc24ndCBhbnkgaW5zcGVjdGFibGUgXCJBcmd1bWVudHNcIiB0eXBlLlxuICBpZiAoIV8uaXNBcmd1bWVudHMoYXJndW1lbnRzKSkge1xuICAgIF8uaXNBcmd1bWVudHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiAhIShvYmogJiYgXy5oYXMob2JqLCAnY2FsbGVlJykpO1xuICAgIH07XG4gIH1cblxuICAvLyBPcHRpbWl6ZSBgaXNGdW5jdGlvbmAgaWYgYXBwcm9wcmlhdGUuXG4gIGlmICh0eXBlb2YgKC8uLykgIT09ICdmdW5jdGlvbicpIHtcbiAgICBfLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xuICAgIH07XG4gIH1cblxuICAvLyBJcyBhIGdpdmVuIG9iamVjdCBhIGZpbml0ZSBudW1iZXI/XG4gIF8uaXNGaW5pdGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gaXNGaW5pdGUob2JqKSAmJiAhaXNOYU4ocGFyc2VGbG9hdChvYmopKTtcbiAgfTtcblxuICAvLyBJcyB0aGUgZ2l2ZW4gdmFsdWUgYE5hTmA/IChOYU4gaXMgdGhlIG9ubHkgbnVtYmVyIHdoaWNoIGRvZXMgbm90IGVxdWFsIGl0c2VsZikuXG4gIF8uaXNOYU4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXy5pc051bWJlcihvYmopICYmIG9iaiAhPSArb2JqO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBib29sZWFuP1xuICBfLmlzQm9vbGVhbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHRydWUgfHwgb2JqID09PSBmYWxzZSB8fCB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQm9vbGVhbl0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgZXF1YWwgdG8gbnVsbD9cbiAgXy5pc051bGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBudWxsO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgdW5kZWZpbmVkP1xuICBfLmlzVW5kZWZpbmVkID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdm9pZCAwO1xuICB9O1xuXG4gIC8vIFNob3J0Y3V0IGZ1bmN0aW9uIGZvciBjaGVja2luZyBpZiBhbiBvYmplY3QgaGFzIGEgZ2l2ZW4gcHJvcGVydHkgZGlyZWN0bHlcbiAgLy8gb24gaXRzZWxmIChpbiBvdGhlciB3b3Jkcywgbm90IG9uIGEgcHJvdG90eXBlKS5cbiAgXy5oYXMgPSBmdW5jdGlvbihvYmosIGtleSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KTtcbiAgfTtcblxuICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJ1biBVbmRlcnNjb3JlLmpzIGluICpub0NvbmZsaWN0KiBtb2RlLCByZXR1cm5pbmcgdGhlIGBfYCB2YXJpYWJsZSB0byBpdHNcbiAgLy8gcHJldmlvdXMgb3duZXIuIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICByb290Ll8gPSBwcmV2aW91c1VuZGVyc2NvcmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLy8gS2VlcCB0aGUgaWRlbnRpdHkgZnVuY3Rpb24gYXJvdW5kIGZvciBkZWZhdWx0IGl0ZXJhdG9ycy5cbiAgXy5pZGVudGl0eSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9O1xuXG4gIC8vIFJ1biBhIGZ1bmN0aW9uICoqbioqIHRpbWVzLlxuICBfLnRpbWVzID0gZnVuY3Rpb24obiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgYWNjdW0gPSBBcnJheShNYXRoLm1heCgwLCBuKSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIGFjY3VtW2ldID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVudGl0eU1hcCA9IHtcbiAgICBlc2NhcGU6IHtcbiAgICAgICcmJzogJyZhbXA7JyxcbiAgICAgICc8JzogJyZsdDsnLFxuICAgICAgJz4nOiAnJmd0OycsXG4gICAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICAgIFwiJ1wiOiAnJiN4Mjc7J1xuICAgIH1cbiAgfTtcbiAgZW50aXR5TWFwLnVuZXNjYXBlID0gXy5pbnZlcnQoZW50aXR5TWFwLmVzY2FwZSk7XG5cbiAgLy8gUmVnZXhlcyBjb250YWluaW5nIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbGlzdGVkIGltbWVkaWF0ZWx5IGFib3ZlLlxuICB2YXIgZW50aXR5UmVnZXhlcyA9IHtcbiAgICBlc2NhcGU6ICAgbmV3IFJlZ0V4cCgnWycgKyBfLmtleXMoZW50aXR5TWFwLmVzY2FwZSkuam9pbignJykgKyAnXScsICdnJyksXG4gICAgdW5lc2NhcGU6IG5ldyBSZWdFeHAoJygnICsgXy5rZXlzKGVudGl0eU1hcC51bmVzY2FwZSkuam9pbignfCcpICsgJyknLCAnZycpXG4gIH07XG5cbiAgLy8gRnVuY3Rpb25zIGZvciBlc2NhcGluZyBhbmQgdW5lc2NhcGluZyBzdHJpbmdzIHRvL2Zyb20gSFRNTCBpbnRlcnBvbGF0aW9uLlxuICBfLmVhY2goWydlc2NhcGUnLCAndW5lc2NhcGUnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgX1ttZXRob2RdID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICBpZiAoc3RyaW5nID09IG51bGwpIHJldHVybiAnJztcbiAgICAgIHJldHVybiAoJycgKyBzdHJpbmcpLnJlcGxhY2UoZW50aXR5UmVnZXhlc1ttZXRob2RdLCBmdW5jdGlvbihtYXRjaCkge1xuICAgICAgICByZXR1cm4gZW50aXR5TWFwW21ldGhvZF1bbWF0Y2hdO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gSWYgdGhlIHZhbHVlIG9mIHRoZSBuYW1lZCBgcHJvcGVydHlgIGlzIGEgZnVuY3Rpb24gdGhlbiBpbnZva2UgaXQgd2l0aCB0aGVcbiAgLy8gYG9iamVjdGAgYXMgY29udGV4dDsgb3RoZXJ3aXNlLCByZXR1cm4gaXQuXG4gIF8ucmVzdWx0ID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICB2YXIgdmFsdWUgPSBvYmplY3RbcHJvcGVydHldO1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH07XG5cbiAgLy8gQWRkIHlvdXIgb3duIGN1c3RvbSBmdW5jdGlvbnMgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0LlxuICBfLm1peGluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgZWFjaChfLmZ1bmN0aW9ucyhvYmopLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICB2YXIgZnVuYyA9IF9bbmFtZV0gPSBvYmpbbmFtZV07XG4gICAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IFt0aGlzLl93cmFwcGVkXTtcbiAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgZnVuYy5hcHBseShfLCBhcmdzKSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGEgdW5pcXVlIGludGVnZXIgaWQgKHVuaXF1ZSB3aXRoaW4gdGhlIGVudGlyZSBjbGllbnQgc2Vzc2lvbikuXG4gIC8vIFVzZWZ1bCBmb3IgdGVtcG9yYXJ5IERPTSBpZHMuXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuICBfLnVuaXF1ZUlkID0gZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgfTtcblxuICAvLyBCeSBkZWZhdWx0LCBVbmRlcnNjb3JlIHVzZXMgRVJCLXN0eWxlIHRlbXBsYXRlIGRlbGltaXRlcnMsIGNoYW5nZSB0aGVcbiAgLy8gZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZSBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICBfLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG4gICAgZXZhbHVhdGUgICAgOiAvPCUoW1xcc1xcU10rPyklPi9nLFxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXG4gICAgZXNjYXBlICAgICAgOiAvPCUtKFtcXHNcXFNdKz8pJT4vZ1xuICB9O1xuXG4gIC8vIFdoZW4gY3VzdG9taXppbmcgYHRlbXBsYXRlU2V0dGluZ3NgLCBpZiB5b3UgZG9uJ3Qgd2FudCB0byBkZWZpbmUgYW5cbiAgLy8gaW50ZXJwb2xhdGlvbiwgZXZhbHVhdGlvbiBvciBlc2NhcGluZyByZWdleCwgd2UgbmVlZCBvbmUgdGhhdCBpc1xuICAvLyBndWFyYW50ZWVkIG5vdCB0byBtYXRjaC5cbiAgdmFyIG5vTWF0Y2ggPSAvKC4pXi87XG5cbiAgLy8gQ2VydGFpbiBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgZXNjYXBlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHB1dCBpbnRvIGFcbiAgLy8gc3RyaW5nIGxpdGVyYWwuXG4gIHZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx0JzogICAgICd0JyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG4gIH07XG5cbiAgdmFyIGVzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx0fFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIC8vIEphdmFTY3JpcHQgbWljcm8tdGVtcGxhdGluZywgc2ltaWxhciB0byBKb2huIFJlc2lnJ3MgaW1wbGVtZW50YXRpb24uXG4gIC8vIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBoYW5kbGVzIGFyYml0cmFyeSBkZWxpbWl0ZXJzLCBwcmVzZXJ2ZXMgd2hpdGVzcGFjZSxcbiAgLy8gYW5kIGNvcnJlY3RseSBlc2NhcGVzIHF1b3RlcyB3aXRoaW4gaW50ZXJwb2xhdGVkIGNvZGUuXG4gIF8udGVtcGxhdGUgPSBmdW5jdGlvbih0ZXh0LCBkYXRhLCBzZXR0aW5ncykge1xuICAgIHZhciByZW5kZXI7XG4gICAgc2V0dGluZ3MgPSBfLmRlZmF1bHRzKHt9LCBzZXR0aW5ncywgXy50ZW1wbGF0ZVNldHRpbmdzKTtcblxuICAgIC8vIENvbWJpbmUgZGVsaW1pdGVycyBpbnRvIG9uZSByZWd1bGFyIGV4cHJlc3Npb24gdmlhIGFsdGVybmF0aW9uLlxuICAgIHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChbXG4gICAgICAoc2V0dGluZ3MuZXNjYXBlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5pbnRlcnBvbGF0ZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgdGVtcGxhdGUgc291cmNlLCBlc2NhcGluZyBzdHJpbmcgbGl0ZXJhbHMgYXBwcm9wcmlhdGVseS5cbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzb3VyY2UgPSBcIl9fcCs9J1wiO1xuICAgIHRleHQucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlLCBpbnRlcnBvbGF0ZSwgZXZhbHVhdGUsIG9mZnNldCkge1xuICAgICAgc291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICAgICAgLnJlcGxhY2UoZXNjYXBlciwgZnVuY3Rpb24obWF0Y2gpIHsgcmV0dXJuICdcXFxcJyArIGVzY2FwZXNbbWF0Y2hdOyB9KTtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGludGVycG9sYXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgaW50ZXJwb2xhdGUgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGV2YWx1YXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG4gICAgICB9XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcbiAgICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gICAgLy8gSWYgYSB2YXJpYWJsZSBpcyBub3Qgc3BlY2lmaWVkLCBwbGFjZSBkYXRhIHZhbHVlcyBpbiBsb2NhbCBzY29wZS5cbiAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlKSBzb3VyY2UgPSAnd2l0aChvYmp8fHt9KXtcXG4nICsgc291cmNlICsgJ31cXG4nO1xuXG4gICAgc291cmNlID0gXCJ2YXIgX190LF9fcD0nJyxfX2o9QXJyYXkucHJvdG90eXBlLmpvaW4sXCIgK1xuICAgICAgXCJwcmludD1mdW5jdGlvbigpe19fcCs9X19qLmNhbGwoYXJndW1lbnRzLCcnKTt9O1xcblwiICtcbiAgICAgIHNvdXJjZSArIFwicmV0dXJuIF9fcDtcXG5cIjtcblxuICAgIHRyeSB7XG4gICAgICByZW5kZXIgPSBuZXcgRnVuY3Rpb24oc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicsICdfJywgc291cmNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHJldHVybiByZW5kZXIoZGF0YSwgXyk7XG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIHJlbmRlci5jYWxsKHRoaXMsIGRhdGEsIF8pO1xuICAgIH07XG5cbiAgICAvLyBQcm92aWRlIHRoZSBjb21waWxlZCBmdW5jdGlvbiBzb3VyY2UgYXMgYSBjb252ZW5pZW5jZSBmb3IgcHJlY29tcGlsYXRpb24uXG4gICAgdGVtcGxhdGUuc291cmNlID0gJ2Z1bmN0aW9uKCcgKyAoc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicpICsgJyl7XFxuJyArIHNvdXJjZSArICd9JztcblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfTtcblxuICAvLyBBZGQgYSBcImNoYWluXCIgZnVuY3Rpb24sIHdoaWNoIHdpbGwgZGVsZWdhdGUgdG8gdGhlIHdyYXBwZXIuXG4gIF8uY2hhaW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXyhvYmopLmNoYWluKCk7XG4gIH07XG5cbiAgLy8gT09QXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAvLyBJZiBVbmRlcnNjb3JlIGlzIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLCBpdCByZXR1cm5zIGEgd3JhcHBlZCBvYmplY3QgdGhhdFxuICAvLyBjYW4gYmUgdXNlZCBPTy1zdHlsZS4gVGhpcyB3cmFwcGVyIGhvbGRzIGFsdGVyZWQgdmVyc2lvbnMgb2YgYWxsIHRoZVxuICAvLyB1bmRlcnNjb3JlIGZ1bmN0aW9ucy4gV3JhcHBlZCBvYmplY3RzIG1heSBiZSBjaGFpbmVkLlxuXG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjb250aW51ZSBjaGFpbmluZyBpbnRlcm1lZGlhdGUgcmVzdWx0cy5cbiAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0aGlzLl9jaGFpbiA/IF8ob2JqKS5jaGFpbigpIDogb2JqO1xuICB9O1xuXG4gIC8vIEFkZCBhbGwgb2YgdGhlIFVuZGVyc2NvcmUgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgXy5taXhpbihfKTtcblxuICAvLyBBZGQgYWxsIG11dGF0b3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09ICdzaGlmdCcgfHwgbmFtZSA9PSAnc3BsaWNlJykgJiYgb2JqLmxlbmd0aCA9PT0gMCkgZGVsZXRlIG9ialswXTtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBvYmopO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgYWNjZXNzb3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsnY29uY2F0JywgJ2pvaW4nLCAnc2xpY2UnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgbWV0aG9kLmFwcGx5KHRoaXMuX3dyYXBwZWQsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH0pO1xuXG4gIF8uZXh0ZW5kKF8ucHJvdG90eXBlLCB7XG5cbiAgICAvLyBTdGFydCBjaGFpbmluZyBhIHdyYXBwZWQgVW5kZXJzY29yZSBvYmplY3QuXG4gICAgY2hhaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY2hhaW4gPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEV4dHJhY3RzIHRoZSByZXN1bHQgZnJvbSBhIHdyYXBwZWQgYW5kIGNoYWluZWQgb2JqZWN0LlxuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl93cmFwcGVkO1xuICAgIH1cblxuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcblxufSkoKSIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFjdGl2ZSwgY3JlYXRlU2VhcmNoLCBlbXB0eVBhZ2UsIHV0aWwsIHdpa2k7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZScpO1xuXG4gIGVtcHR5UGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpLmVtcHR5UGFnZTtcblxuICBjcmVhdGVTZWFyY2ggPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgdmFyIG5laWdoYm9yaG9vZCwgcGVyZm9ybVNlYXJjaDtcbiAgICBuZWlnaGJvcmhvb2QgPSBfYXJnLm5laWdoYm9yaG9vZDtcbiAgICBwZXJmb3JtU2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoUXVlcnkpIHtcbiAgICAgIHZhciAkcmVzdWx0UGFnZSwgcmVzdWx0LCByZXN1bHRQYWdlLCBzZWFyY2hSZXN1bHRzLCB0YWxseSwgX2ksIF9sZW4sIF9yZWY7XG4gICAgICBzZWFyY2hSZXN1bHRzID0gbmVpZ2hib3Job29kLnNlYXJjaChzZWFyY2hRdWVyeSk7XG4gICAgICB0YWxseSA9IHNlYXJjaFJlc3VsdHMudGFsbHk7XG4gICAgICByZXN1bHRQYWdlID0gZW1wdHlQYWdlKCk7XG4gICAgICByZXN1bHRQYWdlLnNldFRpdGxlKFwiU2VhcmNoIGZvciAnXCIgKyBzZWFyY2hRdWVyeSArIFwiJ1wiKTtcbiAgICAgIHJlc3VsdFBhZ2UuYWRkUGFyYWdyYXBoKFwiU3RyaW5nICdcIiArIHNlYXJjaFF1ZXJ5ICsgXCInIGZvdW5kIG9uIFwiICsgKHRhbGx5LmZpbmRzIHx8ICdub25lJykgKyBcIiBvZiBcIiArICh0YWxseS5wYWdlcyB8fCAnbm8nKSArIFwiIHBhZ2VzIGZyb20gXCIgKyAodGFsbHkuc2l0ZXMgfHwgJ25vJykgKyBcIiBzaXRlcy5cXG5UZXh0IG1hdGNoZWQgb24gXCIgKyAodGFsbHkudGl0bGUgfHwgJ25vJykgKyBcIiB0aXRsZXMsIFwiICsgKHRhbGx5LnRleHQgfHwgJ25vJykgKyBcIiBwYXJhZ3JhcGhzLCBhbmQgXCIgKyAodGFsbHkuc2x1ZyB8fCAnbm8nKSArIFwiIHNsdWdzLlxcbkVsYXBzZWQgdGltZSBcIiArIHRhbGx5Lm1zZWMgKyBcIiBtaWxsaXNlY29uZHMuXCIpO1xuICAgICAgX3JlZiA9IHNlYXJjaFJlc3VsdHMuZmluZHM7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgcmVzdWx0ID0gX3JlZltfaV07XG4gICAgICAgIHJlc3VsdFBhZ2UuYWRkSXRlbSh7XG4gICAgICAgICAgXCJ0eXBlXCI6IFwicmVmZXJlbmNlXCIsXG4gICAgICAgICAgXCJzaXRlXCI6IHJlc3VsdC5zaXRlLFxuICAgICAgICAgIFwic2x1Z1wiOiByZXN1bHQucGFnZS5zbHVnLFxuICAgICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnBhZ2UudGl0bGUsXG4gICAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5wYWdlLnN5bm9wc2lzIHx8ICcnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgJHJlc3VsdFBhZ2UgPSB3aWtpLmNyZWF0ZVBhZ2UocmVzdWx0UGFnZS5nZXRTbHVnKCkpLmFkZENsYXNzKCdnaG9zdCcpO1xuICAgICAgJHJlc3VsdFBhZ2UuYXBwZW5kVG8oJCgnLm1haW4nKSk7XG4gICAgICB3aWtpLmJ1aWxkUGFnZShyZXN1bHRQYWdlLCAkcmVzdWx0UGFnZSk7XG4gICAgICByZXR1cm4gYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSk7XG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgcGVyZm9ybVNlYXJjaDogcGVyZm9ybVNlYXJjaFxuICAgIH07XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTZWFyY2g7XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBhY3RpdmUsIGNyZWF0ZVNlYXJjaCwgbmVpZ2hib3Job29kLCBuZXh0QXZhaWxhYmxlRmV0Y2gsIG5leHRGZXRjaEludGVydmFsLCBwb3B1bGF0ZVNpdGVJbmZvRm9yLCB1dGlsLCB3aWtpLCBfLFxuICAgIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG4gIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIGFjdGl2ZSA9IHJlcXVpcmUoJy4vYWN0aXZlJyk7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIGNyZWF0ZVNlYXJjaCA9IHJlcXVpcmUoJy4vc2VhcmNoJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBuZWlnaGJvcmhvb2QgPSB7fTtcblxuICBpZiAod2lraS5uZWlnaGJvcmhvb2QgPT0gbnVsbCkge1xuICAgIHdpa2kubmVpZ2hib3Job29kID0ge307XG4gIH1cblxuICBuZXh0QXZhaWxhYmxlRmV0Y2ggPSAwO1xuXG4gIG5leHRGZXRjaEludGVydmFsID0gMjAwMDtcblxuICBwb3B1bGF0ZVNpdGVJbmZvRm9yID0gZnVuY3Rpb24oc2l0ZSwgbmVpZ2hib3JJbmZvKSB7XG4gICAgdmFyIGZldGNoTWFwLCBub3csIHRyYW5zaXRpb247XG4gICAgaWYgKG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0ID0gdHJ1ZTtcbiAgICB0cmFuc2l0aW9uID0gZnVuY3Rpb24oc2l0ZSwgZnJvbSwgdG8pIHtcbiAgICAgIHJldHVybiAkKFwiLm5laWdoYm9yW2RhdGEtc2l0ZT1cXFwiXCIgKyBzaXRlICsgXCJcXFwiXVwiKS5maW5kKCdkaXYnKS5yZW1vdmVDbGFzcyhmcm9tKS5hZGRDbGFzcyh0byk7XG4gICAgfTtcbiAgICBmZXRjaE1hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlcXVlc3QsIHNpdGVtYXBVcmw7XG4gICAgICBzaXRlbWFwVXJsID0gXCJodHRwOi8vXCIgKyBzaXRlICsgXCIvc3lzdGVtL3NpdGVtYXAuanNvblwiO1xuICAgICAgdHJhbnNpdGlvbihzaXRlLCAnd2FpdCcsICdmZXRjaCcpO1xuICAgICAgcmVxdWVzdCA9ICQuYWpheCh7XG4gICAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICB1cmw6IHNpdGVtYXBVcmxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlcXVlc3QuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSBmYWxzZTtcbiAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBuZWlnaGJvckluZm8uc2l0ZW1hcCA9IGRhdGE7XG4gICAgICAgIHRyYW5zaXRpb24oc2l0ZSwgJ2ZldGNoJywgJ2RvbmUnKTtcbiAgICAgICAgcmV0dXJuICQoJ2JvZHknKS50cmlnZ2VyKCduZXctbmVpZ2hib3ItZG9uZScsIHNpdGUpO1xuICAgICAgfSkuZmFpbChmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uKHNpdGUsICdmZXRjaCcsICdmYWlsJyk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKG5vdyA+IG5leHRBdmFpbGFibGVGZXRjaCkge1xuICAgICAgbmV4dEF2YWlsYWJsZUZldGNoID0gbm93ICsgbmV4dEZldGNoSW50ZXJ2YWw7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChmZXRjaE1hcCwgMTAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0VGltZW91dChmZXRjaE1hcCwgbmV4dEF2YWlsYWJsZUZldGNoIC0gbm93KTtcbiAgICAgIHJldHVybiBuZXh0QXZhaWxhYmxlRmV0Y2ggKz0gbmV4dEZldGNoSW50ZXJ2YWw7XG4gICAgfVxuICB9O1xuXG4gIHdpa2kucmVnaXN0ZXJOZWlnaGJvciA9IG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgIHZhciBuZWlnaGJvckluZm87XG4gICAgaWYgKHdpa2kubmVpZ2hib3Job29kW3NpdGVdICE9IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbmVpZ2hib3JJbmZvID0ge307XG4gICAgd2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0gPSBuZWlnaGJvckluZm87XG4gICAgcG9wdWxhdGVTaXRlSW5mb0ZvcihzaXRlLCBuZWlnaGJvckluZm8pO1xuICAgIHJldHVybiAkKCdib2R5JykudHJpZ2dlcignbmV3LW5laWdoYm9yJywgc2l0ZSk7XG4gIH07XG5cbiAgbmVpZ2hib3Job29kLmxpc3ROZWlnaGJvcnMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy5rZXlzKHdpa2kubmVpZ2hib3Job29kKTtcbiAgfTtcblxuICBuZWlnaGJvcmhvb2Quc2VhcmNoID0gZnVuY3Rpb24oc2VhcmNoUXVlcnkpIHtcbiAgICB2YXIgZmluZHMsIG1hdGNoLCBtYXRjaGluZ1BhZ2VzLCBuZWlnaGJvckluZm8sIG5laWdoYm9yU2l0ZSwgc2l0ZW1hcCwgc3RhcnQsIHRhbGx5LCB0aWNrLCBfcmVmO1xuICAgIGZpbmRzID0gW107XG4gICAgdGFsbHkgPSB7fTtcbiAgICB0aWNrID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAodGFsbHlba2V5XSAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB0YWxseVtrZXldKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGFsbHlba2V5XSA9IDE7XG4gICAgICB9XG4gICAgfTtcbiAgICBtYXRjaCA9IGZ1bmN0aW9uKGtleSwgdGV4dCkge1xuICAgICAgdmFyIGhpdDtcbiAgICAgIGhpdCA9ICh0ZXh0ICE9IG51bGwpICYmIHRleHQudG9Mb3dlckNhc2UoKS5pbmRleE9mKHNlYXJjaFF1ZXJ5LnRvTG93ZXJDYXNlKCkpID49IDA7XG4gICAgICBpZiAoaGl0KSB7XG4gICAgICAgIHRpY2soa2V5KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoaXQ7XG4gICAgfTtcbiAgICBzdGFydCA9IERhdGUubm93KCk7XG4gICAgX3JlZiA9IHdpa2kubmVpZ2hib3Job29kO1xuICAgIGZvciAobmVpZ2hib3JTaXRlIGluIF9yZWYpIHtcbiAgICAgIGlmICghX19oYXNQcm9wLmNhbGwoX3JlZiwgbmVpZ2hib3JTaXRlKSkgY29udGludWU7XG4gICAgICBuZWlnaGJvckluZm8gPSBfcmVmW25laWdoYm9yU2l0ZV07XG4gICAgICBzaXRlbWFwID0gbmVpZ2hib3JJbmZvLnNpdGVtYXA7XG4gICAgICBpZiAoc2l0ZW1hcCAhPSBudWxsKSB7XG4gICAgICAgIHRpY2soJ3NpdGVzJyk7XG4gICAgICB9XG4gICAgICBtYXRjaGluZ1BhZ2VzID0gXy5lYWNoKHNpdGVtYXAsIGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICAgICAgdGljaygncGFnZXMnKTtcbiAgICAgICAgaWYgKCEobWF0Y2goJ3RpdGxlJywgcGFnZS50aXRsZSkgfHwgbWF0Y2goJ3RleHQnLCBwYWdlLnN5bm9wc2lzKSB8fCBtYXRjaCgnc2x1ZycsIHBhZ2Uuc2x1ZykpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRpY2soJ2ZpbmRzJyk7XG4gICAgICAgIHJldHVybiBmaW5kcy5wdXNoKHtcbiAgICAgICAgICBwYWdlOiBwYWdlLFxuICAgICAgICAgIHNpdGU6IG5laWdoYm9yU2l0ZSxcbiAgICAgICAgICByYW5rOiAxXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRhbGx5Wydtc2VjJ10gPSBEYXRlLm5vdygpIC0gc3RhcnQ7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmRzOiBmaW5kcyxcbiAgICAgIHRhbGx5OiB0YWxseVxuICAgIH07XG4gIH07XG5cbiAgJChmdW5jdGlvbigpIHtcbiAgICB2YXIgJG5laWdoYm9yaG9vZCwgZmxhZywgc2VhcmNoO1xuICAgICRuZWlnaGJvcmhvb2QgPSAkKCcubmVpZ2hib3Job29kJyk7XG4gICAgZmxhZyA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICAgIHJldHVybiBcIjxzcGFuIGNsYXNzPVxcXCJuZWlnaGJvclxcXCIgZGF0YS1zaXRlPVxcXCJcIiArIHNpdGUgKyBcIlxcXCI+XFxuICA8ZGl2IGNsYXNzPVxcXCJ3YWl0XFxcIj5cXG4gICAgPGltZyBzcmM9XFxcImh0dHA6Ly9cIiArIHNpdGUgKyBcIi9mYXZpY29uLnBuZ1xcXCIgdGl0bGU9XFxcIlwiICsgc2l0ZSArIFwiXFxcIj5cXG4gIDwvZGl2Plxcbjwvc3Bhbj5cIjtcbiAgICB9O1xuICAgICQoJ2JvZHknKS5vbignbmV3LW5laWdoYm9yJywgZnVuY3Rpb24oZSwgc2l0ZSkge1xuICAgICAgcmV0dXJuICRuZWlnaGJvcmhvb2QuYXBwZW5kKGZsYWcoc2l0ZSkpO1xuICAgIH0pLmRlbGVnYXRlKCcubmVpZ2hib3IgaW1nJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuIHdpa2kuZG9JbnRlcm5hbExpbmsoJ3dlbGNvbWUtdmlzaXRvcnMnLCBudWxsLCB0aGlzLnRpdGxlKTtcbiAgICB9KTtcbiAgICBzZWFyY2ggPSBjcmVhdGVTZWFyY2goe1xuICAgICAgbmVpZ2hib3Job29kOiBuZWlnaGJvcmhvb2RcbiAgICB9KTtcbiAgICByZXR1cm4gJCgnaW5wdXQuc2VhcmNoJykub24oJ2tleXByZXNzJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIHNlYXJjaFF1ZXJ5O1xuICAgICAgaWYgKGUua2V5Q29kZSAhPT0gMTMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2VhcmNoUXVlcnkgPSAkKHRoaXMpLnZhbCgpO1xuICAgICAgc2VhcmNoLnBlcmZvcm1TZWFyY2goc2VhcmNoUXVlcnkpO1xuICAgICAgcmV0dXJuICQodGhpcykudmFsKFwiXCIpO1xuICAgIH0pO1xuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcbiJdfQ==
;
