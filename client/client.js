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

},{"./active":10,"./wiki":2}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./addToJournal":14,"./page":12,"./revision":13,"./state":9,"./util":6,"./wiki":2,"underscore":15}],11:[function(require,module,exports){
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
    var $footer, $header, $journal, $story, $twins, action, emitItem, host, page, slug, _i, _len, _ref, _ref1;
    page = pageObject.getRawPage();
    $page.data("data", page);
    slug = $page.attr('id');
    wiki.resolutionContext = pageObject.getContext();
    $page.empty();
    _ref = ['twins', 'header', 'story', 'journal', 'footer'].map(function(className) {
      return $("<div />").addClass(className).appendTo($page);
    }), $twins = _ref[0], $header = _ref[1], $story = _ref[2], $journal = _ref[3], $footer = _ref[4];
    emitHeader($header, $page, pageObject);
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
    _ref1 = page.journal;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      action = _ref1[_i];
      addToJournal($journal, action);
    }
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

},{"./addToJournal":14,"./neighborhood":16,"./page":12,"./pageHandler":7,"./plugin":8,"./state":9,"./util":6,"./wiki":2,"underscore":15}],12:[function(require,module,exports){
(function() {
  var asSlug, emptyPage, newPage, util, _;

  util = require('./util');

  _ = require('underscore');

  asSlug = function(name) {
    return name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
  };

  emptyPage = function() {
    return newPage({}, null);
  };

  newPage = function(json, site) {
    var addItem, addParagraph, getContext, getNeighbors, getRawPage, getRemoteSite, getSlug, isLocal, isPlugin, isRemote, page, setTitle;
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
    addParagraph = function(text) {
      var type;
      type = "paragraph";
      return addItem({
        type: type,
        text: text
      });
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
      addParagraph: addParagraph
    };
  };

  module.exports = {
    newPage: newPage,
    emptyPage: emptyPage
  };

}).call(this);

},{"./util":6,"underscore":15}],15:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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

},{"./active":10,"./page":12,"./util":6,"./wiki":2}],16:[function(require,module,exports){
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

},{"./active":10,"./search":17,"./util":6,"./wiki":2,"underscore":15}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2NsaWVudC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvd2lraS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9sZWdhY3kuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvc3lub3BzaXMuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvcGVyc29uYS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9hY3RpdmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvdXRpbC5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9wbHVnaW4uanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvc3RhdGUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvcmV2aXNpb24uanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvYWRkVG9Kb3VybmFsLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3BhZ2VIYW5kbGVyLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3JlZnJlc2guanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvcGFnZS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9zZWFyY2guanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvbmVpZ2hib3Job29kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxDQUFPLEVBQU8sQ0FBZCxFQUFNLENBQVEsZUFBQTs7QUFDZCxDQURBLE1BQ0EsaUJBQUE7Ozs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIndpbmRvdy53aWtpID0gcmVxdWlyZSgnd2lraS1jbGllbnQvbGliL3dpa2knKVxucmVxdWlyZSgnd2lraS1jbGllbnQvbGliL2xlZ2FjeScpXG5cbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGNyZWF0ZVN5bm9wc2lzLCB3aWtpLFxuICAgIF9fc2xpY2UgPSBbXS5zbGljZTtcblxuICBjcmVhdGVTeW5vcHNpcyA9IHJlcXVpcmUoJy4vc3lub3BzaXMnKTtcblxuICB3aWtpID0ge1xuICAgIGNyZWF0ZVN5bm9wc2lzOiBjcmVhdGVTeW5vcHNpc1xuICB9O1xuXG4gIHdpa2kucGVyc29uYSA9IHJlcXVpcmUoJy4vcGVyc29uYScpO1xuXG4gIHdpa2kubG9nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoaW5ncztcbiAgICB0aGluZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGlmICgodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCA/IGNvbnNvbGUubG9nIDogdm9pZCAwKSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgdGhpbmdzKTtcbiAgICB9XG4gIH07XG5cbiAgd2lraS5hc1NsdWcgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWUucmVwbGFjZSgvXFxzL2csICctJykucmVwbGFjZSgvW15BLVphLXowLTktXS9nLCAnJykudG9Mb3dlckNhc2UoKTtcbiAgfTtcblxuICB3aWtpLnVzZUxvY2FsU3RvcmFnZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkKFwiLmxvZ2luXCIpLmxlbmd0aCA+IDA7XG4gIH07XG5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dCA9IFtdO1xuXG4gIHdpa2kucmVzb2x2ZUZyb20gPSBmdW5jdGlvbihhZGRpdGlvbiwgY2FsbGJhY2spIHtcbiAgICB3aWtpLnJlc29sdXRpb25Db250ZXh0LnB1c2goYWRkaXRpb24pO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wb3AoKTtcbiAgICB9XG4gIH07XG5cbiAgd2lraS5nZXREYXRhID0gZnVuY3Rpb24odmlzKSB7XG4gICAgdmFyIGlkeCwgd2hvO1xuICAgIGlmICh2aXMpIHtcbiAgICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKTtcbiAgICAgIHdobyA9ICQoXCIuaXRlbTpsdChcIiArIGlkeCArIFwiKVwiKS5maWx0ZXIoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKTtcbiAgICAgIGlmICh3aG8gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aG8gPSAkKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KCk7XG4gICAgICBpZiAod2hvICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHdoby5kYXRhKCdpdGVtJykuZGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgd2lraS5nZXREYXRhTm9kZXMgPSBmdW5jdGlvbih2aXMpIHtcbiAgICB2YXIgaWR4LCB3aG87XG4gICAgaWYgKHZpcykge1xuICAgICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpO1xuICAgICAgd2hvID0gJChcIi5pdGVtOmx0KFwiICsgaWR4ICsgXCIpXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKTtcbiAgICAgIHJldHVybiAkKHdobyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLnRvQXJyYXkoKS5yZXZlcnNlKCk7XG4gICAgICByZXR1cm4gJCh3aG8pO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLmNyZWF0ZVBhZ2UgPSBmdW5jdGlvbihuYW1lLCBsb2MpIHtcbiAgICB2YXIgJHBhZ2UsIHNpdGU7XG4gICAgaWYgKGxvYyAmJiBsb2MgIT09ICd2aWV3Jykge1xuICAgICAgc2l0ZSA9IGxvYztcbiAgICB9XG4gICAgJHBhZ2UgPSAkKFwiPGRpdiBjbGFzcz1cXFwicGFnZVxcXCIgaWQ9XFxcIlwiICsgbmFtZSArIFwiXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcInR3aW5zXFxcIj4gPHA+IDwvcD4gPC9kaXY+XFxuICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXJcXFwiPlxcbiAgICA8aDE+IDxpbWcgY2xhc3M9XFxcImZhdmljb25cXFwiIHNyYz1cXFwiXCIgKyAoc2l0ZSA/IFwiLy9cIiArIHNpdGUgOiBcIlwiKSArIFwiL2Zhdmljb24ucG5nXFxcIiBoZWlnaHQ9XFxcIjMycHhcXFwiPiBcIiArIG5hbWUgKyBcIiA8L2gxPlxcbiAgPC9kaXY+XFxuPC9kaXY+XCIpO1xuICAgIGlmIChzaXRlKSB7XG4gICAgICAkcGFnZS5maW5kKCcucGFnZScpLmF0dHIoJ2RhdGEtc2l0ZScsIHNpdGUpO1xuICAgIH1cbiAgICByZXR1cm4gJHBhZ2U7XG4gIH07XG5cbiAgd2lraS5nZXRJdGVtID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICgkKGVsZW1lbnQpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiAkKGVsZW1lbnQpLmRhdGEoXCJpdGVtXCIpIHx8ICQoZWxlbWVudCkuZGF0YSgnc3RhdGljSXRlbScpO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLnJlc29sdmVMaW5rcyA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgIHZhciByZW5kZXJJbnRlcm5hbExpbms7XG4gICAgcmVuZGVySW50ZXJuYWxMaW5rID0gZnVuY3Rpb24obWF0Y2gsIG5hbWUpIHtcbiAgICAgIHZhciBzbHVnO1xuICAgICAgc2x1ZyA9IHdpa2kuYXNTbHVnKG5hbWUpO1xuICAgICAgcmV0dXJuIFwiPGEgY2xhc3M9XFxcImludGVybmFsXFxcIiBocmVmPVxcXCIvXCIgKyBzbHVnICsgXCIuaHRtbFxcXCIgZGF0YS1wYWdlLW5hbWU9XFxcIlwiICsgc2x1ZyArIFwiXFxcIiB0aXRsZT1cXFwiXCIgKyAod2lraS5yZXNvbHV0aW9uQ29udGV4dC5qb2luKCcgPT4gJykpICsgXCJcXFwiPlwiICsgbmFtZSArIFwiPC9hPlwiO1xuICAgIH07XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9cXFtcXFsoW15cXF1dKylcXF1cXF0vZ2ksIHJlbmRlckludGVybmFsTGluaykucmVwbGFjZSgvXFxbKGh0dHAuKj8pICguKj8pXFxdL2dpLCBcIjxhIGNsYXNzPVxcXCJleHRlcm5hbFxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiIGhyZWY9XFxcIiQxXFxcIiB0aXRsZT1cXFwiJDFcXFwiIHJlbD1cXFwibm9mb2xsb3dcXFwiPiQyIDxpbWcgc3JjPVxcXCIvaW1hZ2VzL2V4dGVybmFsLWxpbmstbHRyLWljb24ucG5nXFxcIj48L2E+XCIpO1xuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0gd2lraTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFjdGl2ZSwgbmV3UGFnZSwgcGFnZUhhbmRsZXIsIHBsdWdpbiwgcmVmcmVzaCwgc3RhdGUsIHV0aWwsIHdpa2k7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBwYWdlSGFuZGxlciA9IHdpa2kucGFnZUhhbmRsZXIgPSByZXF1aXJlKCcuL3BhZ2VIYW5kbGVyJyk7XG5cbiAgcGx1Z2luID0gcmVxdWlyZSgnLi9wbHVnaW4nKTtcblxuICBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKTtcblxuICBhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZScpO1xuXG4gIHJlZnJlc2ggPSByZXF1aXJlKCcuL3JlZnJlc2gnKTtcblxuICBuZXdQYWdlID0gcmVxdWlyZSgnLi9wYWdlJykubmV3UGFnZTtcblxuICBBcnJheS5wcm90b3R5cGUubGFzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzW3RoaXMubGVuZ3RoIC0gMV07XG4gIH07XG5cbiAgJChmdW5jdGlvbigpIHtcbiAgICB2YXIgTEVGVEFSUk9XLCBSSUdIVEFSUk9XLCBjcmVhdGVUZXh0RWxlbWVudCwgZG9JbnRlcm5hbExpbmssIGZpbmlzaENsaWNrLCBnZXRUZW1wbGF0ZSwgc2xlZXAsIHRleHRFZGl0b3I7XG4gICAgd2luZG93LmRpYWxvZyA9ICQoJzxkaXY+PC9kaXY+JykuaHRtbCgnVGhpcyBkaWFsb2cgd2lsbCBzaG93IGV2ZXJ5IHRpbWUhJykuZGlhbG9nKHtcbiAgICAgIGF1dG9PcGVuOiBmYWxzZSxcbiAgICAgIHRpdGxlOiAnQmFzaWMgRGlhbG9nJyxcbiAgICAgIGhlaWdodDogNjAwLFxuICAgICAgd2lkdGg6IDgwMFxuICAgIH0pO1xuICAgIHdpa2kuZGlhbG9nID0gZnVuY3Rpb24odGl0bGUsIGh0bWwpIHtcbiAgICAgIHdpbmRvdy5kaWFsb2cuaHRtbChodG1sKTtcbiAgICAgIHdpbmRvdy5kaWFsb2cuZGlhbG9nKFwib3B0aW9uXCIsIFwidGl0bGVcIiwgd2lraS5yZXNvbHZlTGlua3ModGl0bGUpKTtcbiAgICAgIHJldHVybiB3aW5kb3cuZGlhbG9nLmRpYWxvZygnb3BlbicpO1xuICAgIH07XG4gICAgc2xlZXAgPSBmdW5jdGlvbih0aW1lLCBkb25lKSB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dChkb25lLCB0aW1lKTtcbiAgICB9O1xuICAgIHdpa2kucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uKCRpdGVtLCBpdGVtKSB7XG4gICAgICBwYWdlSGFuZGxlci5wdXQoJGl0ZW0ucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge1xuICAgICAgICB0eXBlOiAncmVtb3ZlJyxcbiAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuICRpdGVtLnJlbW92ZSgpO1xuICAgIH07XG4gICAgd2lraS5jcmVhdGVJdGVtID0gZnVuY3Rpb24oJHBhZ2UsICRiZWZvcmUsIGl0ZW0pIHtcbiAgICAgIHZhciAkaXRlbSwgYmVmb3JlO1xuICAgICAgaWYgKCRwYWdlID09IG51bGwpIHtcbiAgICAgICAgJHBhZ2UgPSAkYmVmb3JlLnBhcmVudHMoJy5wYWdlJyk7XG4gICAgICB9XG4gICAgICBpdGVtLmlkID0gdXRpbC5yYW5kb21CeXRlcyg4KTtcbiAgICAgICRpdGVtID0gJChcIjxkaXYgY2xhc3M9XFxcIml0ZW0gXCIgKyBpdGVtLnR5cGUgKyBcIlxcXCIgZGF0YS1pZD1cXFwiXCIgKyBcIlxcXCI8L2Rpdj5cIik7XG4gICAgICAkaXRlbS5kYXRhKCdpdGVtJywgaXRlbSkuZGF0YSgncGFnZUVsZW1lbnQnLCAkcGFnZSk7XG4gICAgICBpZiAoJGJlZm9yZSAhPSBudWxsKSB7XG4gICAgICAgICRiZWZvcmUuYWZ0ZXIoJGl0ZW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHBhZ2UuZmluZCgnLnN0b3J5JykuYXBwZW5kKCRpdGVtKTtcbiAgICAgIH1cbiAgICAgIHBsdWdpbltcImRvXCJdKCRpdGVtLCBpdGVtKTtcbiAgICAgIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbSgkYmVmb3JlKTtcbiAgICAgIHNsZWVwKDUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQoJHBhZ2UsIHtcbiAgICAgICAgICBpdGVtOiBpdGVtLFxuICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgIHR5cGU6ICdhZGQnLFxuICAgICAgICAgIGFmdGVyOiBiZWZvcmUgIT0gbnVsbCA/IGJlZm9yZS5pZCA6IHZvaWQgMFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuICRpdGVtO1xuICAgIH07XG4gICAgY3JlYXRlVGV4dEVsZW1lbnQgPSBmdW5jdGlvbihwYWdlRWxlbWVudCwgYmVmb3JlRWxlbWVudCwgaW5pdGlhbFRleHQpIHtcbiAgICAgIHZhciBpdGVtLCBpdGVtQmVmb3JlLCBpdGVtRWxlbWVudDtcbiAgICAgIGl0ZW0gPSB7XG4gICAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnLFxuICAgICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KSxcbiAgICAgICAgdGV4dDogaW5pdGlhbFRleHRcbiAgICAgIH07XG4gICAgICBpdGVtRWxlbWVudCA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJpdGVtIHBhcmFncmFwaFxcXCIgZGF0YS1pZD1cIiArIGl0ZW0uaWQgKyBcIj48L2Rpdj5cIik7XG4gICAgICBpdGVtRWxlbWVudC5kYXRhKCdpdGVtJywgaXRlbSkuZGF0YSgncGFnZUVsZW1lbnQnLCBwYWdlRWxlbWVudCk7XG4gICAgICBiZWZvcmVFbGVtZW50LmFmdGVyKGl0ZW1FbGVtZW50KTtcbiAgICAgIHBsdWdpbltcImRvXCJdKGl0ZW1FbGVtZW50LCBpdGVtKTtcbiAgICAgIGl0ZW1CZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudCk7XG4gICAgICB3aWtpLnRleHRFZGl0b3IoaXRlbUVsZW1lbnQsIGl0ZW0pO1xuICAgICAgcmV0dXJuIHNsZWVwKDUwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQocGFnZUVsZW1lbnQsIHtcbiAgICAgICAgICBpdGVtOiBpdGVtLFxuICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgIHR5cGU6ICdhZGQnLFxuICAgICAgICAgIGFmdGVyOiBpdGVtQmVmb3JlICE9IG51bGwgPyBpdGVtQmVmb3JlLmlkIDogdm9pZCAwXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICB0ZXh0RWRpdG9yID0gd2lraS50ZXh0RWRpdG9yID0gZnVuY3Rpb24oZGl2LCBpdGVtLCBjYXJldFBvcywgZG91YmxlQ2xpY2tlZCkge1xuICAgICAgdmFyIG9yaWdpbmFsLCB0ZXh0YXJlYSwgX3JlZjtcbiAgICAgIGlmIChkaXYuaGFzQ2xhc3MoJ3RleHRFZGl0aW5nJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGl2LmFkZENsYXNzKCd0ZXh0RWRpdGluZycpO1xuICAgICAgdGV4dGFyZWEgPSAkKFwiPHRleHRhcmVhPlwiICsgKG9yaWdpbmFsID0gKF9yZWYgPSBpdGVtLnRleHQpICE9IG51bGwgPyBfcmVmIDogJycpICsgXCI8L3RleHRhcmVhPlwiKS5mb2N1c291dChmdW5jdGlvbigpIHtcbiAgICAgICAgZGl2LnJlbW92ZUNsYXNzKCd0ZXh0RWRpdGluZycpO1xuICAgICAgICBpZiAoaXRlbS50ZXh0ID0gdGV4dGFyZWEudmFsKCkpIHtcbiAgICAgICAgICBwbHVnaW5bXCJkb1wiXShkaXYuZW1wdHkoKSwgaXRlbSk7XG4gICAgICAgICAgaWYgKGl0ZW0udGV4dCA9PT0gb3JpZ2luYWwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0KGRpdi5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7XG4gICAgICAgICAgICB0eXBlOiAnZWRpdCcsXG4gICAgICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQoZGl2LnBhcmVudHMoJy5wYWdlOmZpcnN0JyksIHtcbiAgICAgICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICAgICAgaWQ6IGl0ZW0uaWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBkaXYucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9KS5iaW5kKCdrZXlkb3duJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgbWlkZGxlLCBwYWdlLCBwYWdlRWxlbWVudCwgcHJlZml4LCBwcmV2SXRlbSwgcHJldlRleHRMZW4sIHNlbCwgc3VmZml4LCB0ZXh0O1xuICAgICAgICBpZiAoKGUuYWx0S2V5IHx8IGUuY3RsS2V5IHx8IGUubWV0YUtleSkgJiYgZS53aGljaCA9PT0gODMpIHtcbiAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGUuYWx0S2V5IHx8IGUuY3RsS2V5IHx8IGUubWV0YUtleSkgJiYgZS53aGljaCA9PT0gNzMpIHtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYgKCFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICBwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZG9JbnRlcm5hbExpbmsoXCJhYm91dCBcIiArIGl0ZW0udHlwZSArIFwiIHBsdWdpblwiLCBwYWdlKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW0udHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgICBzZWwgPSB1dGlsLmdldFNlbGVjdGlvblBvcyh0ZXh0YXJlYSk7XG4gICAgICAgICAgaWYgKGUud2hpY2ggPT09ICQudWkua2V5Q29kZS5CQUNLU1BBQ0UgJiYgc2VsLnN0YXJ0ID09PSAwICYmIHNlbC5zdGFydCA9PT0gc2VsLmVuZCkge1xuICAgICAgICAgICAgcHJldkl0ZW0gPSB3aWtpLmdldEl0ZW0oZGl2LnByZXYoKSk7XG4gICAgICAgICAgICBpZiAocHJldkl0ZW0udHlwZSAhPT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJldlRleHRMZW4gPSBwcmV2SXRlbS50ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgIHByZXZJdGVtLnRleHQgKz0gdGV4dGFyZWEudmFsKCk7XG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoJycpO1xuICAgICAgICAgICAgdGV4dEVkaXRvcihkaXYucHJldigpLCBwcmV2SXRlbSwgcHJldlRleHRMZW4pO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZS53aGljaCA9PT0gJC51aS5rZXlDb2RlLkVOVEVSICYmIGl0ZW0udHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgICAgIGlmICghc2VsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHQgPSB0ZXh0YXJlYS52YWwoKTtcbiAgICAgICAgICAgIHByZWZpeCA9IHRleHQuc3Vic3RyaW5nKDAsIHNlbC5zdGFydCk7XG4gICAgICAgICAgICBpZiAoc2VsLnN0YXJ0ICE9PSBzZWwuZW5kKSB7XG4gICAgICAgICAgICAgIG1pZGRsZSA9IHRleHQuc3Vic3RyaW5nKHNlbC5zdGFydCwgc2VsLmVuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhzZWwuZW5kKTtcbiAgICAgICAgICAgIGlmIChwcmVmaXggPT09ICcnKSB7XG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnICcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdGV4dGFyZWEudmFsKHByZWZpeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpO1xuICAgICAgICAgICAgcGFnZUVsZW1lbnQgPSBkaXYucGFyZW50KCkucGFyZW50KCk7XG4gICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCBzdWZmaXgpO1xuICAgICAgICAgICAgaWYgKG1pZGRsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsIG1pZGRsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJlZml4ID09PSAnJykge1xuICAgICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGRpdi5odG1sKHRleHRhcmVhKTtcbiAgICAgIGlmIChjYXJldFBvcyAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiB1dGlsLnNldENhcmV0UG9zaXRpb24odGV4dGFyZWEsIGNhcmV0UG9zKTtcbiAgICAgIH0gZWxzZSBpZiAoZG91YmxlQ2xpY2tlZCkge1xuICAgICAgICB1dGlsLnNldENhcmV0UG9zaXRpb24odGV4dGFyZWEsIHRleHRhcmVhLnZhbCgpLmxlbmd0aCk7XG4gICAgICAgIHJldHVybiB0ZXh0YXJlYS5zY3JvbGxUb3AodGV4dGFyZWFbMF0uc2Nyb2xsSGVpZ2h0IC0gdGV4dGFyZWEuaGVpZ2h0KCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBkb0ludGVybmFsTGluayA9IHdpa2kuZG9JbnRlcm5hbExpbmsgPSBmdW5jdGlvbihuYW1lLCBwYWdlLCBzaXRlKSB7XG4gICAgICBpZiAoc2l0ZSA9PSBudWxsKSB7XG4gICAgICAgIHNpdGUgPSBudWxsO1xuICAgICAgfVxuICAgICAgbmFtZSA9IHdpa2kuYXNTbHVnKG5hbWUpO1xuICAgICAgaWYgKHBhZ2UgIT0gbnVsbCkge1xuICAgICAgICAkKHBhZ2UpLm5leHRBbGwoKS5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICAgIHdpa2kuY3JlYXRlUGFnZShuYW1lLCBzaXRlKS5hcHBlbmRUbygkKCcubWFpbicpKS5lYWNoKHJlZnJlc2gpO1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIH07XG4gICAgTEVGVEFSUk9XID0gMzc7XG4gICAgUklHSFRBUlJPVyA9IDM5O1xuICAgICQoZG9jdW1lbnQpLmtleWRvd24oZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBkaXJlY3Rpb24sIG5ld0luZGV4LCBwYWdlcztcbiAgICAgIGRpcmVjdGlvbiA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgc3dpdGNoIChldmVudC53aGljaCkge1xuICAgICAgICAgIGNhc2UgTEVGVEFSUk9XOlxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIGNhc2UgUklHSFRBUlJPVzpcbiAgICAgICAgICAgIHJldHVybiArMTtcbiAgICAgICAgfVxuICAgICAgfSkoKTtcbiAgICAgIGlmIChkaXJlY3Rpb24gJiYgIShldmVudC50YXJnZXQudGFnTmFtZSA9PT0gXCJURVhUQVJFQVwiKSkge1xuICAgICAgICBwYWdlcyA9ICQoJy5wYWdlJyk7XG4gICAgICAgIG5ld0luZGV4ID0gcGFnZXMuaW5kZXgoJCgnLmFjdGl2ZScpKSArIGRpcmVjdGlvbjtcbiAgICAgICAgaWYgKCgwIDw9IG5ld0luZGV4ICYmIG5ld0luZGV4IDwgcGFnZXMubGVuZ3RoKSkge1xuICAgICAgICAgIHJldHVybiBhY3RpdmUuc2V0KHBhZ2VzLmVxKG5ld0luZGV4KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAkKHdpbmRvdykub24oJ3BvcHN0YXRlJywgc3RhdGUuc2hvdyk7XG4gICAgJChkb2N1bWVudCkuYWpheEVycm9yKGZ1bmN0aW9uKGV2ZW50LCByZXF1ZXN0LCBzZXR0aW5ncykge1xuICAgICAgaWYgKHJlcXVlc3Quc3RhdHVzID09PSAwIHx8IHJlcXVlc3Quc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgd2lraS5sb2coJ2FqYXggZXJyb3InLCBldmVudCwgcmVxdWVzdCwgc2V0dGluZ3MpO1xuICAgICAgcmV0dXJuICQoJy5tYWluJykucHJlcGVuZChcIjxsaSBjbGFzcz0nZXJyb3InPlxcbiAgRXJyb3Igb24gXCIgKyBzZXR0aW5ncy51cmwgKyBcIjogXCIgKyByZXF1ZXN0LnJlc3BvbnNlVGV4dCArIFwiXFxuPC9saT5cIik7XG4gICAgfSk7XG4gICAgZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbihzbHVnLCBkb25lKSB7XG4gICAgICBpZiAoIXNsdWcpIHtcbiAgICAgICAgcmV0dXJuIGRvbmUobnVsbCk7XG4gICAgICB9XG4gICAgICB3aWtpLmxvZygnZ2V0VGVtcGxhdGUnLCBzbHVnKTtcbiAgICAgIHJldHVybiBwYWdlSGFuZGxlci5nZXQoe1xuICAgICAgICB3aGVuR290dGVuOiBmdW5jdGlvbihkYXRhLCBzaXRlRm91bmQpIHtcbiAgICAgICAgICByZXR1cm4gZG9uZShkYXRhLnN0b3J5KTtcbiAgICAgICAgfSxcbiAgICAgICAgd2hlbk5vdEdvdHRlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGRvbmUobnVsbCk7XG4gICAgICAgIH0sXG4gICAgICAgIHBhZ2VJbmZvcm1hdGlvbjoge1xuICAgICAgICAgIHNsdWc6IHNsdWdcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcbiAgICBmaW5pc2hDbGljayA9IGZ1bmN0aW9uKGUsIG5hbWUpIHtcbiAgICAgIHZhciBwYWdlO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgaWYgKCFlLnNoaWZ0S2V5KSB7XG4gICAgICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgfVxuICAgICAgZG9JbnRlcm5hbExpbmsobmFtZSwgcGFnZSwgJChlLnRhcmdldCkuZGF0YSgnc2l0ZScpKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgICQoJy5tYWluJykuZGVsZWdhdGUoJy5zaG93LXBhZ2Utc291cmNlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGpzb24sIHBhZ2VFbGVtZW50O1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcGFnZUVsZW1lbnQgPSAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpO1xuICAgICAganNvbiA9IHBhZ2VFbGVtZW50LmRhdGEoJ2RhdGEnKTtcbiAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhcIkpTT04gZm9yIFwiICsganNvbi50aXRsZSwgJCgnPHByZS8+JykudGV4dChKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKSkpO1xuICAgIH0pLmRlbGVnYXRlKCcucGFnZScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmICghJChlLnRhcmdldCkuaXMoXCJhXCIpKSB7XG4gICAgICAgIHJldHVybiBhY3RpdmUuc2V0KHRoaXMpO1xuICAgICAgfVxuICAgIH0pLmRlbGVnYXRlKCcuaW50ZXJuYWwnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgbmFtZTtcbiAgICAgIG5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhKCdwYWdlTmFtZScpO1xuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9ICQoZS50YXJnZXQpLmF0dHIoJ3RpdGxlJykuc3BsaXQoJyA9PiAnKTtcbiAgICAgIHJldHVybiBmaW5pc2hDbGljayhlLCBuYW1lKTtcbiAgICB9KS5kZWxlZ2F0ZSgnaW1nLnJlbW90ZScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBuYW1lO1xuICAgICAgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEoJ3NsdWcnKTtcbiAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJChlLnRhcmdldCkuZGF0YSgnc2l0ZScpXTtcbiAgICAgIHJldHVybiBmaW5pc2hDbGljayhlLCBuYW1lKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLnJldmlzaW9uJywgJ2RibGNsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyICRwYWdlLCBhY3Rpb24sIGpzb24sIHBhZ2UsIHJldjtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKTtcbiAgICAgIHJldiA9IHBhZ2Uuam91cm5hbC5sZW5ndGggLSAxO1xuICAgICAgYWN0aW9uID0gcGFnZS5qb3VybmFsW3Jldl07XG4gICAgICBqc29uID0gSlNPTi5zdHJpbmdpZnkoYWN0aW9uLCBudWxsLCAyKTtcbiAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhcIlJldmlzaW9uIFwiICsgcmV2ICsgXCIsIFwiICsgYWN0aW9uLnR5cGUgKyBcIiBhY3Rpb25cIiwgJCgnPHByZS8+JykudGV4dChqc29uKSk7XG4gICAgfSkuZGVsZWdhdGUoJy5hY3Rpb24nLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGFjdGlvbiwgJHBhZ2UsIG5hbWUsIHJldiwgc2x1ZztcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICRhY3Rpb24gPSAkKGUudGFyZ2V0KTtcbiAgICAgIGlmICgkYWN0aW9uLmlzKCcuZm9yaycpICYmICgobmFtZSA9ICRhY3Rpb24uZGF0YSgnc2x1ZycpKSAhPSBudWxsKSkge1xuICAgICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyRhY3Rpb24uZGF0YSgnc2l0ZScpXTtcbiAgICAgICAgcmV0dXJuIGZpbmlzaENsaWNrKGUsIChuYW1lLnNwbGl0KCdfJykpWzBdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgICBzbHVnID0gd2lraS5hc1NsdWcoJHBhZ2UuZGF0YSgnZGF0YScpLnRpdGxlKTtcbiAgICAgICAgcmV2ID0gJCh0aGlzKS5wYXJlbnQoKS5jaGlsZHJlbigpLmluZGV4KCRhY3Rpb24pO1xuICAgICAgICBpZiAoIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAkcGFnZS5uZXh0QWxsKCkucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgd2lraS5jcmVhdGVQYWdlKFwiXCIgKyBzbHVnICsgXCJfcmV2XCIgKyByZXYsICRwYWdlLmRhdGEoJ3NpdGUnKSkuYXBwZW5kVG8oJCgnLm1haW4nKSkuZWFjaChyZWZyZXNoKTtcbiAgICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgICAgfVxuICAgIH0pLmRlbGVnYXRlKCcuZm9yay1wYWdlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIGl0ZW0sIHBhZ2VFbGVtZW50LCByZW1vdGVTaXRlO1xuICAgICAgcGFnZUVsZW1lbnQgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgaWYgKHBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdsb2NhbCcpKSB7XG4gICAgICAgIGlmICghd2lraS51c2VMb2NhbFN0b3JhZ2UoKSkge1xuICAgICAgICAgIGl0ZW0gPSBwYWdlRWxlbWVudC5kYXRhKCdkYXRhJyk7XG4gICAgICAgICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2xvY2FsJyk7XG4gICAgICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dChwYWdlRWxlbWVudCwge1xuICAgICAgICAgICAgdHlwZTogJ2ZvcmsnLFxuICAgICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoKHJlbW90ZVNpdGUgPSBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJykpICE9IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gcGFnZUhhbmRsZXIucHV0KHBhZ2VFbGVtZW50LCB7XG4gICAgICAgICAgICB0eXBlOiAnZm9yaycsXG4gICAgICAgICAgICBzaXRlOiByZW1vdGVTaXRlXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS5kZWxlZ2F0ZSgnLmFjdGlvbicsICdob3ZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlkO1xuICAgICAgaWQgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtaWQnKTtcbiAgICAgICQoXCJbZGF0YS1pZD1cIiArIGlkICsgXCJdXCIpLnRvZ2dsZUNsYXNzKCd0YXJnZXQnKTtcbiAgICAgIHJldHVybiAkKCcubWFpbicpLnRyaWdnZXIoJ3JldicpO1xuICAgIH0pLmRlbGVnYXRlKCcuaXRlbScsICdob3ZlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGlkO1xuICAgICAgaWQgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtaWQnKTtcbiAgICAgIHJldHVybiAkKFwiLmFjdGlvbltkYXRhLWlkPVwiICsgaWQgKyBcIl1cIikudG9nZ2xlQ2xhc3MoJ3RhcmdldCcpO1xuICAgIH0pLmRlbGVnYXRlKCdidXR0b24uY3JlYXRlJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuIGdldFRlbXBsYXRlKCQoZS50YXJnZXQpLmRhdGEoJ3NsdWcnKSwgZnVuY3Rpb24oc3RvcnkpIHtcbiAgICAgICAgdmFyICRwYWdlLCBwYWdlLCBwYWdlT2JqZWN0O1xuICAgICAgICAkcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlOmZpcnN0Jyk7XG4gICAgICAgICRwYWdlLnJlbW92ZUNsYXNzKCdnaG9zdCcpO1xuICAgICAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpO1xuICAgICAgICBwYWdlLnN0b3J5ID0gc3RvcnkgfHwgW107XG4gICAgICAgIHBhZ2VPYmplY3QgPSBuZXdQYWdlKHBhZ2UsIG51bGwpO1xuICAgICAgICBwYWdlID0gcGFnZU9iamVjdC5nZXRSYXdQYWdlKCk7XG4gICAgICAgIHBhZ2VIYW5kbGVyLnB1dCgkcGFnZSwge1xuICAgICAgICAgIHR5cGU6ICdjcmVhdGUnLFxuICAgICAgICAgIGlkOiBwYWdlLmlkLFxuICAgICAgICAgIGl0ZW06IHtcbiAgICAgICAgICAgIHRpdGxlOiBwYWdlLnRpdGxlLFxuICAgICAgICAgICAgc3Rvcnk6IHBhZ2Uuc3RvcnlcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UuZW1wdHkoKSk7XG4gICAgICB9KTtcbiAgICB9KS5kZWxlZ2F0ZSgnLmdob3N0JywgJ3JldicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkaXRlbSwgJHBhZ2UsIHBvc2l0aW9uO1xuICAgICAgd2lraS5sb2coJ3JldicsIGUpO1xuICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpO1xuICAgICAgJGl0ZW0gPSAkcGFnZS5maW5kKCcudGFyZ2V0Jyk7XG4gICAgICBwb3NpdGlvbiA9ICRpdGVtLm9mZnNldCgpLnRvcCArICRwYWdlLnNjcm9sbFRvcCgpIC0gJHBhZ2UuaGVpZ2h0KCkgLyAyO1xuICAgICAgd2lraS5sb2coJ3Njcm9sbCcsICRwYWdlLCAkaXRlbSwgcG9zaXRpb24pO1xuICAgICAgcmV0dXJuICRwYWdlLnN0b3AoKS5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsVG9wOiBwb3N0aW9uXG4gICAgICB9LCAnc2xvdycpO1xuICAgIH0pLmRlbGVnYXRlKCcuc2NvcmUnLCAnaG92ZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gJCgnLm1haW4nKS50cmlnZ2VyKCd0aHVtYicsICQoZS50YXJnZXQpLmRhdGEoJ3RodW1iJykpO1xuICAgIH0pO1xuICAgICQoXCIucHJvdmlkZXIgaW5wdXRcIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAkKFwiZm9vdGVyIGlucHV0OmZpcnN0XCIpLnZhbCgkKHRoaXMpLmF0dHIoJ2RhdGEtcHJvdmlkZXInKSk7XG4gICAgICByZXR1cm4gJChcImZvb3RlciBmb3JtXCIpLnN1Ym1pdCgpO1xuICAgIH0pO1xuICAgICQoJ2JvZHknKS5vbignbmV3LW5laWdoYm9yLWRvbmUnLCBmdW5jdGlvbihlLCBuZWlnaGJvcikge1xuICAgICAgcmV0dXJuICQoJy5wYWdlJykuZWFjaChmdW5jdGlvbihpbmRleCwgZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gd2lraS5lbWl0VHdpbnMoJChlbGVtZW50KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gJChmdW5jdGlvbigpIHtcbiAgICAgIHN0YXRlLmZpcnN0KCk7XG4gICAgICAkKCcucGFnZScpLmVhY2gocmVmcmVzaCk7XG4gICAgICByZXR1cm4gYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSk7XG4gICAgfSk7XG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICB2YXIgcDEsIHAyLCBzeW5vcHNpcztcbiAgICBzeW5vcHNpcyA9IHBhZ2Uuc3lub3BzaXM7XG4gICAgaWYgKChwYWdlICE9IG51bGwpICYmIChwYWdlLnN0b3J5ICE9IG51bGwpKSB7XG4gICAgICBwMSA9IHBhZ2Uuc3RvcnlbMF07XG4gICAgICBwMiA9IHBhZ2Uuc3RvcnlbMV07XG4gICAgICBpZiAocDEgJiYgcDEudHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDEudGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAocDIgJiYgcDIudHlwZSA9PT0gJ3BhcmFncmFwaCcpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDIudGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAocDEgJiYgKHAxLnRleHQgIT0gbnVsbCkpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDEudGV4dCk7XG4gICAgICB9XG4gICAgICBpZiAocDIgJiYgKHAyLnRleHQgIT0gbnVsbCkpIHtcbiAgICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gcDIudGV4dCk7XG4gICAgICB9XG4gICAgICBzeW5vcHNpcyB8fCAoc3lub3BzaXMgPSAocGFnZS5zdG9yeSAhPSBudWxsKSAmJiAoXCJBIHBhZ2Ugd2l0aCBcIiArIHBhZ2Uuc3RvcnkubGVuZ3RoICsgXCIgaXRlbXMuXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3lub3BzaXMgPSAnQSBwYWdlIHdpdGggbm8gc3RvcnkuJztcbiAgICB9XG4gICAgcmV0dXJuIHN5bm9wc2lzO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG93bmVyKSB7XG4gICAgJChcIiN1c2VyLWVtYWlsXCIpLmhpZGUoKTtcbiAgICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLmhpZGUoKTtcbiAgICAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5oaWRlKCk7XG4gICAgbmF2aWdhdG9yLmlkLndhdGNoKHtcbiAgICAgIGxvZ2dlZEluVXNlcjogb3duZXIsXG4gICAgICBvbmxvZ2luOiBmdW5jdGlvbihhc3NlcnRpb24pIHtcbiAgICAgICAgcmV0dXJuICQucG9zdChcIi9wZXJzb25hX2xvZ2luXCIsIHtcbiAgICAgICAgICBhc3NlcnRpb246IGFzc2VydGlvblxuICAgICAgICB9LCBmdW5jdGlvbih2ZXJpZmllZCkge1xuICAgICAgICAgIHZlcmlmaWVkID0gSlNPTi5wYXJzZSh2ZXJpZmllZCk7XG4gICAgICAgICAgaWYgKFwib2theVwiID09PSB2ZXJpZmllZC5zdGF0dXMpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmF2aWdhdG9yLmlkLmxvZ291dCgpO1xuICAgICAgICAgICAgaWYgKFwid3JvbmctYWRkcmVzc1wiID09PSB2ZXJpZmllZC5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbiA9IFwiL29vcHNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG9ubG9nb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICQucG9zdChcIi9wZXJzb25hX2xvZ291dFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uID0gXCIvXCI7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG9ucmVhZHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAob3duZXIpIHtcbiAgICAgICAgICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLmhpZGUoKTtcbiAgICAgICAgICByZXR1cm4gJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuc2hvdygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuc2hvdygpO1xuICAgICAgICAgIHJldHVybiAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBuYXZpZ2F0b3IuaWQucmVxdWVzdCh7fSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBuYXZpZ2F0b3IuaWQubG9nb3V0KCk7XG4gICAgfSk7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBhY3RpdmUsIGZpbmRTY3JvbGxDb250YWluZXIsIHNjcm9sbFRvO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gYWN0aXZlID0ge307XG5cbiAgYWN0aXZlLnNjcm9sbENvbnRhaW5lciA9IHZvaWQgMDtcblxuICBmaW5kU2Nyb2xsQ29udGFpbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjcm9sbGVkO1xuICAgIHNjcm9sbGVkID0gJChcImJvZHksIGh0bWxcIikuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICQodGhpcykuc2Nyb2xsTGVmdCgpID4gMDtcbiAgICB9KTtcbiAgICBpZiAoc2Nyb2xsZWQubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHNjcm9sbGVkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJChcImJvZHksIGh0bWxcIikuc2Nyb2xsTGVmdCgxMikuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5zY3JvbGxMZWZ0KCkgPiAwO1xuICAgICAgfSkuc2Nyb2xsVG9wKDApO1xuICAgIH1cbiAgfTtcblxuICBzY3JvbGxUbyA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIGJvZHlXaWR0aCwgY29udGVudFdpZHRoLCBtYXhYLCBtaW5YLCB0YXJnZXQsIHdpZHRoO1xuICAgIGlmIChhY3RpdmUuc2Nyb2xsQ29udGFpbmVyID09IG51bGwpIHtcbiAgICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSBmaW5kU2Nyb2xsQ29udGFpbmVyKCk7XG4gICAgfVxuICAgIGJvZHlXaWR0aCA9ICQoXCJib2R5XCIpLndpZHRoKCk7XG4gICAgbWluWCA9IGFjdGl2ZS5zY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCgpO1xuICAgIG1heFggPSBtaW5YICsgYm9keVdpZHRoO1xuICAgIHRhcmdldCA9IGVsLnBvc2l0aW9uKCkubGVmdDtcbiAgICB3aWR0aCA9IGVsLm91dGVyV2lkdGgodHJ1ZSk7XG4gICAgY29udGVudFdpZHRoID0gJChcIi5wYWdlXCIpLm91dGVyV2lkdGgodHJ1ZSkgKiAkKFwiLnBhZ2VcIikuc2l6ZSgpO1xuICAgIGlmICh0YXJnZXQgPCBtaW5YKSB7XG4gICAgICByZXR1cm4gYWN0aXZlLnNjcm9sbENvbnRhaW5lci5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsTGVmdDogdGFyZ2V0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRhcmdldCArIHdpZHRoID4gbWF4WCkge1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbExlZnQ6IHRhcmdldCAtIChib2R5V2lkdGggLSB3aWR0aClcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAobWF4WCA+ICQoXCIucGFnZXNcIikub3V0ZXJXaWR0aCgpKSB7XG4gICAgICByZXR1cm4gYWN0aXZlLnNjcm9sbENvbnRhaW5lci5hbmltYXRlKHtcbiAgICAgICAgc2Nyb2xsTGVmdDogTWF0aC5taW4odGFyZ2V0LCBjb250ZW50V2lkdGggLSBib2R5V2lkdGgpXG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgYWN0aXZlLnNldCA9IGZ1bmN0aW9uKGVsKSB7XG4gICAgZWwgPSAkKGVsKTtcbiAgICAkKFwiLmFjdGl2ZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICByZXR1cm4gc2Nyb2xsVG8oZWwuYWRkQ2xhc3MoXCJhY3RpdmVcIikpO1xuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgdXRpbCwgd2lraTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3aWtpLnV0aWwgPSB1dGlsID0ge307XG5cbiAgdXRpbC5zeW1ib2xzID0ge1xuICAgIGNyZWF0ZTogJ+KYvCcsXG4gICAgYWRkOiAnKycsXG4gICAgZWRpdDogJ+KcjicsXG4gICAgZm9yazogJ+KakScsXG4gICAgbW92ZTogJ+KGlScsXG4gICAgcmVtb3ZlOiAn4pyVJ1xuICB9O1xuXG4gIHV0aWwucmFuZG9tQnl0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xuICB9O1xuXG4gIHV0aWwucmFuZG9tQnl0ZXMgPSBmdW5jdGlvbihuKSB7XG4gICAgcmV0dXJuICgoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX2ksIF9yZXN1bHRzO1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAxOyAxIDw9IG4gPyBfaSA8PSBuIDogX2kgPj0gbjsgMSA8PSBuID8gX2krKyA6IF9pLS0pIHtcbiAgICAgICAgX3Jlc3VsdHMucHVzaCh1dGlsLnJhbmRvbUJ5dGUoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfSkoKSkuam9pbignJyk7XG4gIH07XG5cbiAgdXRpbC5mb3JtYXRUaW1lID0gZnVuY3Rpb24odGltZSkge1xuICAgIHZhciBhbSwgZCwgaCwgbWksIG1vO1xuICAgIGQgPSBuZXcgRGF0ZSgodGltZSA+IDEwMDAwMDAwMDAwID8gdGltZSA6IHRpbWUgKiAxMDAwKSk7XG4gICAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXTtcbiAgICBoID0gZC5nZXRIb3VycygpO1xuICAgIGFtID0gaCA8IDEyID8gJ0FNJyA6ICdQTSc7XG4gICAgaCA9IGggPT09IDAgPyAxMiA6IGggPiAxMiA/IGggLSAxMiA6IGg7XG4gICAgbWkgPSAoZC5nZXRNaW51dGVzKCkgPCAxMCA/IFwiMFwiIDogXCJcIikgKyBkLmdldE1pbnV0ZXMoKTtcbiAgICByZXR1cm4gXCJcIiArIGggKyBcIjpcIiArIG1pICsgXCIgXCIgKyBhbSArIFwiPGJyPlwiICsgKGQuZ2V0RGF0ZSgpKSArIFwiIFwiICsgbW8gKyBcIiBcIiArIChkLmdldEZ1bGxZZWFyKCkpO1xuICB9O1xuXG4gIHV0aWwuZm9ybWF0RGF0ZSA9IGZ1bmN0aW9uKG1zU2luY2VFcG9jaCkge1xuICAgIHZhciBhbSwgZCwgZGF5LCBoLCBtaSwgbW8sIHNlYywgd2ssIHlyO1xuICAgIGQgPSBuZXcgRGF0ZShtc1NpbmNlRXBvY2gpO1xuICAgIHdrID0gWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXVtkLmdldERheSgpXTtcbiAgICBtbyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVtkLmdldE1vbnRoKCldO1xuICAgIGRheSA9IGQuZ2V0RGF0ZSgpO1xuICAgIHlyID0gZC5nZXRGdWxsWWVhcigpO1xuICAgIGggPSBkLmdldEhvdXJzKCk7XG4gICAgYW0gPSBoIDwgMTIgPyAnQU0nIDogJ1BNJztcbiAgICBoID0gaCA9PT0gMCA/IDEyIDogaCA+IDEyID8gaCAtIDEyIDogaDtcbiAgICBtaSA9IChkLmdldE1pbnV0ZXMoKSA8IDEwID8gXCIwXCIgOiBcIlwiKSArIGQuZ2V0TWludXRlcygpO1xuICAgIHNlYyA9IChkLmdldFNlY29uZHMoKSA8IDEwID8gXCIwXCIgOiBcIlwiKSArIGQuZ2V0U2Vjb25kcygpO1xuICAgIHJldHVybiBcIlwiICsgd2sgKyBcIiBcIiArIG1vICsgXCIgXCIgKyBkYXkgKyBcIiwgXCIgKyB5ciArIFwiPGJyPlwiICsgaCArIFwiOlwiICsgbWkgKyBcIjpcIiArIHNlYyArIFwiIFwiICsgYW07XG4gIH07XG5cbiAgdXRpbC5mb3JtYXRFbGFwc2VkVGltZSA9IGZ1bmN0aW9uKG1zU2luY2VFcG9jaCkge1xuICAgIHZhciBkYXlzLCBocnMsIG1pbnMsIG1vbnRocywgbXNlY3MsIHNlY3MsIHdlZWtzLCB5ZWFycztcbiAgICBtc2VjcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbXNTaW5jZUVwb2NoO1xuICAgIGlmICgoc2VjcyA9IG1zZWNzIC8gMTAwMCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKG1zZWNzKSkgKyBcIiBtaWxsaXNlY29uZHMgYWdvXCI7XG4gICAgfVxuICAgIGlmICgobWlucyA9IHNlY3MgLyA2MCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHNlY3MpKSArIFwiIHNlY29uZHMgYWdvXCI7XG4gICAgfVxuICAgIGlmICgoaHJzID0gbWlucyAvIDYwKSA8IDIpIHtcbiAgICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IobWlucykpICsgXCIgbWludXRlcyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKChkYXlzID0gaHJzIC8gMjQpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihocnMpKSArIFwiIGhvdXJzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKHdlZWtzID0gZGF5cyAvIDcpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihkYXlzKSkgKyBcIiBkYXlzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKG1vbnRocyA9IGRheXMgLyAzMSkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHdlZWtzKSkgKyBcIiB3ZWVrcyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKCh5ZWFycyA9IGRheXMgLyAzNjUpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihtb250aHMpKSArIFwiIG1vbnRocyBhZ29cIjtcbiAgICB9XG4gICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcih5ZWFycykpICsgXCIgeWVhcnMgYWdvXCI7XG4gIH07XG5cbiAgdXRpbC5lbXB0eVBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6ICdlbXB0eScsXG4gICAgICBzdG9yeTogW10sXG4gICAgICBqb3VybmFsOiBbXVxuICAgIH07XG4gIH07XG5cbiAgdXRpbC5nZXRTZWxlY3Rpb25Qb3MgPSBmdW5jdGlvbihqUXVlcnlFbGVtZW50KSB7XG4gICAgdmFyIGVsLCBpZVBvcywgc2VsO1xuICAgIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCk7XG4gICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuICAgICAgZWwuZm9jdXMoKTtcbiAgICAgIHNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICAgICAgc2VsLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgLWVsLnZhbHVlLmxlbmd0aCk7XG4gICAgICBpZVBvcyA9IHNlbC50ZXh0Lmxlbmd0aDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiBpZVBvcyxcbiAgICAgICAgZW5kOiBpZVBvc1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IGVsLnNlbGVjdGlvblN0YXJ0LFxuICAgICAgICBlbmQ6IGVsLnNlbGVjdGlvbkVuZFxuICAgICAgfTtcbiAgICB9XG4gIH07XG5cbiAgdXRpbC5zZXRDYXJldFBvc2l0aW9uID0gZnVuY3Rpb24oalF1ZXJ5RWxlbWVudCwgY2FyZXRQb3MpIHtcbiAgICB2YXIgZWwsIHJhbmdlO1xuICAgIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCk7XG4gICAgaWYgKGVsICE9IG51bGwpIHtcbiAgICAgIGlmIChlbC5jcmVhdGVUZXh0UmFuZ2UpIHtcbiAgICAgICAgcmFuZ2UgPSBlbC5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgICAgcmFuZ2UubW92ZShcImNoYXJhY3RlclwiLCBjYXJldFBvcyk7XG4gICAgICAgIHJhbmdlLnNlbGVjdCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UoY2FyZXRQb3MsIGNhcmV0UG9zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbC5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGdldFNjcmlwdCwgcGx1Z2luLCBzY3JpcHRzLCB1dGlsLCB3aWtpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwbHVnaW4gPSB7fTtcblxuICBzY3JpcHRzID0ge307XG5cbiAgZ2V0U2NyaXB0ID0gd2lraS5nZXRTY3JpcHQgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gICAgaWYgKHNjcmlwdHNbdXJsXSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICQuZ2V0U2NyaXB0KHVybCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2NyaXB0c1t1cmxdID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBwbHVnaW4uZ2V0ID0gd2lraS5nZXRQbHVnaW4gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICh3aW5kb3cucGx1Z2luc1tuYW1lXSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFNjcmlwdChcIi9wbHVnaW5zL1wiICsgbmFtZSArIFwiL1wiICsgbmFtZSArIFwiLmpzXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHdpbmRvdy5wbHVnaW5zW25hbWVdKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0U2NyaXB0KFwiL3BsdWdpbnMvXCIgKyBuYW1lICsgXCIuanNcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBwbHVnaW5bXCJkb1wiXSA9IHdpa2kuZG9QbHVnaW4gPSBmdW5jdGlvbihkaXYsIGl0ZW0sIGRvbmUpIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGRvbmUgPT0gbnVsbCkge1xuICAgICAgZG9uZSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICAgIGVycm9yID0gZnVuY3Rpb24oZXgpIHtcbiAgICAgIHZhciBlcnJvckVsZW1lbnQ7XG4gICAgICBlcnJvckVsZW1lbnQgPSAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcygnZXJyb3InKTtcbiAgICAgIGVycm9yRWxlbWVudC50ZXh0KGV4LnRvU3RyaW5nKCkpO1xuICAgICAgcmV0dXJuIGRpdi5hcHBlbmQoZXJyb3JFbGVtZW50KTtcbiAgICB9O1xuICAgIGRpdi5kYXRhKCdwYWdlRWxlbWVudCcsIGRpdi5wYXJlbnRzKFwiLnBhZ2VcIikpO1xuICAgIGRpdi5kYXRhKCdpdGVtJywgaXRlbSk7XG4gICAgcmV0dXJuIHBsdWdpbi5nZXQoaXRlbS50eXBlLCBmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHZhciBlcnI7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2NyaXB0ID09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBmaW5kIHBsdWdpbiBmb3IgJ1wiICsgaXRlbS50eXBlICsgXCInXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY3JpcHQuZW1pdC5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgcmV0dXJuIHNjcmlwdC5lbWl0KGRpdiwgaXRlbSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzY3JpcHQuYmluZChkaXYsIGl0ZW0pO1xuICAgICAgICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY3JpcHQuZW1pdChkaXYsIGl0ZW0pO1xuICAgICAgICAgIHNjcmlwdC5iaW5kKGRpdiwgaXRlbSk7XG4gICAgICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGVyciA9IF9lcnJvcjtcbiAgICAgICAgd2lraS5sb2coJ3BsdWdpbiBlcnJvcicsIGVycik7XG4gICAgICAgIGVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgd2lraS5yZWdpc3RlclBsdWdpbiA9IGZ1bmN0aW9uKHBsdWdpbk5hbWUsIHBsdWdpbkZuKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5wbHVnaW5zW3BsdWdpbk5hbWVdID0gcGx1Z2luRm4oJCk7XG4gIH07XG5cbiAgd2luZG93LnBsdWdpbnMgPSB7XG4gICAgcGFyYWdyYXBoOiB7XG4gICAgICBlbWl0OiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgICAgdmFyIHRleHQsIF9pLCBfbGVuLCBfcmVmLCBfcmVzdWx0cztcbiAgICAgICAgX3JlZiA9IGl0ZW0udGV4dC5zcGxpdCgvXFxuXFxuKy8pO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICB0ZXh0ID0gX3JlZltfaV07XG4gICAgICAgICAgaWYgKHRleHQubWF0Y2goL1xcUy8pKSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKGRpdi5hcHBlbmQoXCI8cD5cIiArICh3aWtpLnJlc29sdmVMaW5rcyh0ZXh0KSkgKyBcIjwvcD5cIikpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgIH0sXG4gICAgICBiaW5kOiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGRpdi5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKGRpdiwgaXRlbSwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgaW1hZ2U6IHtcbiAgICAgIGVtaXQ6IGZ1bmN0aW9uKGRpdiwgaXRlbSkge1xuICAgICAgICBpdGVtLnRleHQgfHwgKGl0ZW0udGV4dCA9IGl0ZW0uY2FwdGlvbik7XG4gICAgICAgIHJldHVybiBkaXYuYXBwZW5kKFwiPGltZyBjbGFzcz10aHVtYm5haWwgc3JjPVxcXCJcIiArIGl0ZW0udXJsICsgXCJcXFwiPiA8cD5cIiArICh3aWtpLnJlc29sdmVMaW5rcyhpdGVtLnRleHQpKSArIFwiPC9wPlwiKTtcbiAgICAgIH0sXG4gICAgICBiaW5kOiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgICAgZGl2LmRibGNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB3aWtpLnRleHRFZGl0b3IoZGl2LCBpdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkaXYuZmluZCgnaW1nJykuZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHdpa2kuZGlhbG9nKGl0ZW0udGV4dCwgdGhpcyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgZnV0dXJlOiB7XG4gICAgICBlbWl0OiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgICAgdmFyIGluZm8sIF9pLCBfbGVuLCBfcmVmLCBfcmVzdWx0cztcbiAgICAgICAgZGl2LmFwcGVuZChcIlwiICsgaXRlbS50ZXh0ICsgXCI8YnI+PGJyPjxidXR0b24gY2xhc3M9XFxcImNyZWF0ZVxcXCI+Y3JlYXRlPC9idXR0b24+IG5ldyBibGFuayBwYWdlXCIpO1xuICAgICAgICBpZiAoKChpbmZvID0gd2lraS5uZWlnaGJvcmhvb2RbbG9jYXRpb24uaG9zdF0pICE9IG51bGwpICYmIChpbmZvLnNpdGVtYXAgIT0gbnVsbCkpIHtcbiAgICAgICAgICBfcmVmID0gaW5mby5zaXRlbWFwO1xuICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gX3JlZltfaV07XG4gICAgICAgICAgICBpZiAoaXRlbS5zbHVnLm1hdGNoKC8tdGVtcGxhdGUkLykpIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChkaXYuYXBwZW5kKFwiPGJyPjxidXR0b24gY2xhc3M9XFxcImNyZWF0ZVxcXCIgZGF0YS1zbHVnPVwiICsgaXRlbS5zbHVnICsgXCI+Y3JlYXRlPC9idXR0b24+IGZyb20gXCIgKyAod2lraS5yZXNvbHZlTGlua3MoXCJbW1wiICsgaXRlbS50aXRsZSArIFwiXV1cIikpKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBfcmVzdWx0cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGJpbmQ6IGZ1bmN0aW9uKGRpdiwgaXRlbSkge31cbiAgICB9XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBhY3RpdmUsIHN0YXRlLCB3aWtpLFxuICAgIF9faW5kZXhPZiA9IFtdLmluZGV4T2YgfHwgZnVuY3Rpb24oaXRlbSkgeyBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7IGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7IH0gcmV0dXJuIC0xOyB9O1xuXG4gIHdpa2kgPSByZXF1aXJlKCcuL3dpa2knKTtcblxuICBhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZScpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSB7fTtcblxuICBzdGF0ZS5wYWdlc0luRG9tID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICQubWFrZUFycmF5KCQoXCIucGFnZVwiKS5tYXAoZnVuY3Rpb24oXywgZWwpIHtcbiAgICAgIHJldHVybiBlbC5pZDtcbiAgICB9KSk7XG4gIH07XG5cbiAgc3RhdGUudXJsUGFnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaTtcbiAgICByZXR1cm4gKChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICBfcmVmID0gJChsb2NhdGlvbikuYXR0cigncGF0aG5hbWUnKS5zcGxpdCgnLycpO1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2kgKz0gMikge1xuICAgICAgICBpID0gX3JlZltfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2goaSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfSkoKSkuc2xpY2UoMSk7XG4gIH07XG5cbiAgc3RhdGUubG9jc0luRG9tID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICQubWFrZUFycmF5KCQoXCIucGFnZVwiKS5tYXAoZnVuY3Rpb24oXywgZWwpIHtcbiAgICAgIHJldHVybiAkKGVsKS5kYXRhKCdzaXRlJykgfHwgJ3ZpZXcnO1xuICAgIH0pKTtcbiAgfTtcblxuICBzdGF0ZS51cmxMb2NzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGosIF9pLCBfbGVuLCBfcmVmLCBfcmVzdWx0cztcbiAgICBfcmVmID0gJChsb2NhdGlvbikuYXR0cigncGF0aG5hbWUnKS5zcGxpdCgnLycpLnNsaWNlKDEpO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSArPSAyKSB7XG4gICAgICBqID0gX3JlZltfaV07XG4gICAgICBfcmVzdWx0cy5wdXNoKGopO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgc3RhdGUuc2V0VXJsID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlkeCwgbG9jcywgcGFnZSwgcGFnZXMsIHVybCwgX3JlZjtcbiAgICBkb2N1bWVudC50aXRsZSA9IChfcmVmID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKSkgIT0gbnVsbCA/IF9yZWYudGl0bGUgOiB2b2lkIDA7XG4gICAgaWYgKGhpc3RvcnkgJiYgaGlzdG9yeS5wdXNoU3RhdGUpIHtcbiAgICAgIGxvY3MgPSBzdGF0ZS5sb2NzSW5Eb20oKTtcbiAgICAgIHBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpO1xuICAgICAgdXJsID0gKChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChpZHggPSBfaSA9IDAsIF9sZW4gPSBwYWdlcy5sZW5ndGg7IF9pIDwgX2xlbjsgaWR4ID0gKytfaSkge1xuICAgICAgICAgIHBhZ2UgPSBwYWdlc1tpZHhdO1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2goXCIvXCIgKyAoKGxvY3MgIT0gbnVsbCA/IGxvY3NbaWR4XSA6IHZvaWQgMCkgfHwgJ3ZpZXcnKSArIFwiL1wiICsgcGFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkoKSkuam9pbignJyk7XG4gICAgICBpZiAodXJsICE9PSAkKGxvY2F0aW9uKS5hdHRyKCdwYXRobmFtZScpKSB7XG4gICAgICAgIHJldHVybiBoaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCB1cmwpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBzdGF0ZS5zaG93ID0gZnVuY3Rpb24oZSkge1xuICAgIHZhciBpZHgsIG5hbWUsIG5ld0xvY3MsIG5ld1BhZ2VzLCBvbGQsIG9sZExvY3MsIG9sZFBhZ2VzLCBwcmV2aW91cywgX2ksIF9sZW4sIF9yZWY7XG4gICAgb2xkUGFnZXMgPSBzdGF0ZS5wYWdlc0luRG9tKCk7XG4gICAgbmV3UGFnZXMgPSBzdGF0ZS51cmxQYWdlcygpO1xuICAgIG9sZExvY3MgPSBzdGF0ZS5sb2NzSW5Eb20oKTtcbiAgICBuZXdMb2NzID0gc3RhdGUudXJsTG9jcygpO1xuICAgIGlmICghbG9jYXRpb24ucGF0aG5hbWUgfHwgbG9jYXRpb24ucGF0aG5hbWUgPT09ICcvJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwcmV2aW91cyA9ICQoJy5wYWdlJykuZXEoMCk7XG4gICAgZm9yIChpZHggPSBfaSA9IDAsIF9sZW4gPSBuZXdQYWdlcy5sZW5ndGg7IF9pIDwgX2xlbjsgaWR4ID0gKytfaSkge1xuICAgICAgbmFtZSA9IG5ld1BhZ2VzW2lkeF07XG4gICAgICBpZiAobmFtZSAhPT0gb2xkUGFnZXNbaWR4XSkge1xuICAgICAgICBvbGQgPSAkKCcucGFnZScpLmVxKGlkeCk7XG4gICAgICAgIGlmIChvbGQpIHtcbiAgICAgICAgICBvbGQucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsIG5ld0xvY3NbaWR4XSkuaW5zZXJ0QWZ0ZXIocHJldmlvdXMpLmVhY2god2lraS5yZWZyZXNoKTtcbiAgICAgIH1cbiAgICAgIHByZXZpb3VzID0gJCgnLnBhZ2UnKS5lcShpZHgpO1xuICAgIH1cbiAgICBwcmV2aW91cy5uZXh0QWxsKCkucmVtb3ZlKCk7XG4gICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSk7XG4gICAgcmV0dXJuIGRvY3VtZW50LnRpdGxlID0gKF9yZWYgPSAkKCcucGFnZTpsYXN0JykuZGF0YSgnZGF0YScpKSAhPSBudWxsID8gX3JlZi50aXRsZSA6IHZvaWQgMDtcbiAgfTtcblxuICBzdGF0ZS5maXJzdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmaXJzdFVybExvY3MsIGZpcnN0VXJsUGFnZXMsIGlkeCwgb2xkUGFnZXMsIHVybFBhZ2UsIF9pLCBfbGVuLCBfcmVzdWx0cztcbiAgICBzdGF0ZS5zZXRVcmwoKTtcbiAgICBmaXJzdFVybFBhZ2VzID0gc3RhdGUudXJsUGFnZXMoKTtcbiAgICBmaXJzdFVybExvY3MgPSBzdGF0ZS51cmxMb2NzKCk7XG4gICAgb2xkUGFnZXMgPSBzdGF0ZS5wYWdlc0luRG9tKCk7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKGlkeCA9IF9pID0gMCwgX2xlbiA9IGZpcnN0VXJsUGFnZXMubGVuZ3RoOyBfaSA8IF9sZW47IGlkeCA9ICsrX2kpIHtcbiAgICAgIHVybFBhZ2UgPSBmaXJzdFVybFBhZ2VzW2lkeF07XG4gICAgICBpZiAoX19pbmRleE9mLmNhbGwob2xkUGFnZXMsIHVybFBhZ2UpIDwgMCkge1xuICAgICAgICBpZiAodXJsUGFnZSAhPT0gJycpIHtcbiAgICAgICAgICBfcmVzdWx0cy5wdXNoKHdpa2kuY3JlYXRlUGFnZSh1cmxQYWdlLCBmaXJzdFVybExvY3NbaWR4XSkuYXBwZW5kVG8oJy5tYWluJykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2godm9pZCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBjcmVhdGU7XG5cbiAgY3JlYXRlID0gZnVuY3Rpb24ocmV2SW5kZXgsIGRhdGEpIHtcbiAgICB2YXIgYWZ0ZXJJbmRleCwgZWRpdEluZGV4LCBpdGVtSWQsIGl0ZW1zLCBqb3VybmFsLCBqb3VybmFsRW50cnksIHJlbW92ZUluZGV4LCByZXZKb3VybmFsLCByZXZTdG9yeSwgcmV2U3RvcnlJZHMsIHJldlRpdGxlLCBzdG9yeUl0ZW0sIF9pLCBfaiwgX2ssIF9sZW4sIF9sZW4xLCBfbGVuMiwgX3JlZjtcbiAgICBqb3VybmFsID0gZGF0YS5qb3VybmFsO1xuICAgIHJldlRpdGxlID0gZGF0YS50aXRsZTtcbiAgICByZXZTdG9yeSA9IFtdO1xuICAgIHJldkpvdXJuYWwgPSBqb3VybmFsLnNsaWNlKDAsICsoK3JldkluZGV4KSArIDEgfHwgOWU5KTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IHJldkpvdXJuYWwubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgIGpvdXJuYWxFbnRyeSA9IHJldkpvdXJuYWxbX2ldO1xuICAgICAgcmV2U3RvcnlJZHMgPSByZXZTdG9yeS5tYXAoZnVuY3Rpb24oc3RvcnlJdGVtKSB7XG4gICAgICAgIHJldHVybiBzdG9yeUl0ZW0uaWQ7XG4gICAgICB9KTtcbiAgICAgIHN3aXRjaCAoam91cm5hbEVudHJ5LnR5cGUpIHtcbiAgICAgICAgY2FzZSAnY3JlYXRlJzpcbiAgICAgICAgICBpZiAoam91cm5hbEVudHJ5Lml0ZW0udGl0bGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV2VGl0bGUgPSBqb3VybmFsRW50cnkuaXRlbS50aXRsZTtcbiAgICAgICAgICAgIHJldlN0b3J5ID0gam91cm5hbEVudHJ5Lml0ZW0uc3RvcnkgfHwgW107XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdhZGQnOlxuICAgICAgICAgIGlmICgoYWZ0ZXJJbmRleCA9IHJldlN0b3J5SWRzLmluZGV4T2Yoam91cm5hbEVudHJ5LmFmdGVyKSkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXZTdG9yeS5zcGxpY2UoYWZ0ZXJJbmRleCArIDEsIDAsIGpvdXJuYWxFbnRyeS5pdGVtKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV2U3RvcnkucHVzaChqb3VybmFsRW50cnkuaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdlZGl0JzpcbiAgICAgICAgICBpZiAoKGVkaXRJbmRleCA9IHJldlN0b3J5SWRzLmluZGV4T2Yoam91cm5hbEVudHJ5LmlkKSkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXZTdG9yeS5zcGxpY2UoZWRpdEluZGV4LCAxLCBqb3VybmFsRW50cnkuaXRlbSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldlN0b3J5LnB1c2goam91cm5hbEVudHJ5Lml0ZW0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbW92ZSc6XG4gICAgICAgICAgaXRlbXMgPSB7fTtcbiAgICAgICAgICBmb3IgKF9qID0gMCwgX2xlbjEgPSByZXZTdG9yeS5sZW5ndGg7IF9qIDwgX2xlbjE7IF9qKyspIHtcbiAgICAgICAgICAgIHN0b3J5SXRlbSA9IHJldlN0b3J5W19qXTtcbiAgICAgICAgICAgIGl0ZW1zW3N0b3J5SXRlbS5pZF0gPSBzdG9yeUl0ZW07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldlN0b3J5ID0gW107XG4gICAgICAgICAgX3JlZiA9IGpvdXJuYWxFbnRyeS5vcmRlcjtcbiAgICAgICAgICBmb3IgKF9rID0gMCwgX2xlbjIgPSBfcmVmLmxlbmd0aDsgX2sgPCBfbGVuMjsgX2srKykge1xuICAgICAgICAgICAgaXRlbUlkID0gX3JlZltfa107XG4gICAgICAgICAgICBpZiAoaXRlbXNbaXRlbUlkXSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHJldlN0b3J5LnB1c2goaXRlbXNbaXRlbUlkXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyZW1vdmUnOlxuICAgICAgICAgIGlmICgocmVtb3ZlSW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mKGpvdXJuYWxFbnRyeS5pZCkpICE9PSAtMSkge1xuICAgICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKHJlbW92ZUluZGV4LCAxKTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBzdG9yeTogcmV2U3RvcnksXG4gICAgICBqb3VybmFsOiByZXZKb3VybmFsLFxuICAgICAgdGl0bGU6IHJldlRpdGxlXG4gICAgfTtcbiAgfTtcblxuICBleHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIHV0aWw7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oam91cm5hbEVsZW1lbnQsIGFjdGlvbikge1xuICAgIHZhciBhY3Rpb25FbGVtZW50LCBhY3Rpb25UaXRsZSwgY29udHJvbHMsIHBhZ2VFbGVtZW50LCBwcmV2O1xuICAgIHBhZ2VFbGVtZW50ID0gam91cm5hbEVsZW1lbnQucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdlZGl0Jykge1xuICAgICAgcHJldiA9IGpvdXJuYWxFbGVtZW50LmZpbmQoXCIuZWRpdFtkYXRhLWlkPVwiICsgKGFjdGlvbi5pZCB8fCAwKSArIFwiXVwiKTtcbiAgICB9XG4gICAgYWN0aW9uVGl0bGUgPSBhY3Rpb24udHlwZTtcbiAgICBpZiAoYWN0aW9uLmRhdGUgIT0gbnVsbCkge1xuICAgICAgYWN0aW9uVGl0bGUgKz0gXCIgXCIgKyAodXRpbC5mb3JtYXRFbGFwc2VkVGltZShhY3Rpb24uZGF0ZSkpO1xuICAgIH1cbiAgICBhY3Rpb25FbGVtZW50ID0gJChcIjxhIGhyZWY9XFxcIiNcXFwiIC8+IFwiKS5hZGRDbGFzcyhcImFjdGlvblwiKS5hZGRDbGFzcyhhY3Rpb24udHlwZSkudGV4dCh1dGlsLnN5bWJvbHNbYWN0aW9uLnR5cGVdKS5hdHRyKCd0aXRsZScsIGFjdGlvblRpdGxlKS5hdHRyKCdkYXRhLWlkJywgYWN0aW9uLmlkIHx8IFwiMFwiKS5kYXRhKCdhY3Rpb24nLCBhY3Rpb24pO1xuICAgIGNvbnRyb2xzID0gam91cm5hbEVsZW1lbnQuY2hpbGRyZW4oJy5jb250cm9sLWJ1dHRvbnMnKTtcbiAgICBpZiAoY29udHJvbHMubGVuZ3RoID4gMCkge1xuICAgICAgYWN0aW9uRWxlbWVudC5pbnNlcnRCZWZvcmUoY29udHJvbHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3Rpb25FbGVtZW50LmFwcGVuZFRvKGpvdXJuYWxFbGVtZW50KTtcbiAgICB9XG4gICAgaWYgKGFjdGlvbi50eXBlID09PSAnZm9yaycgJiYgKGFjdGlvbi5zaXRlICE9IG51bGwpKSB7XG4gICAgICByZXR1cm4gYWN0aW9uRWxlbWVudC5jc3MoXCJiYWNrZ3JvdW5kLWltYWdlXCIsIFwidXJsKC8vXCIgKyBhY3Rpb24uc2l0ZSArIFwiL2Zhdmljb24ucG5nKVwiKS5hdHRyKFwiaHJlZlwiLCBcIi8vXCIgKyBhY3Rpb24uc2l0ZSArIFwiL1wiICsgKHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykpICsgXCIuaHRtbFwiKS5kYXRhKFwic2l0ZVwiLCBhY3Rpb24uc2l0ZSkuZGF0YShcInNsdWdcIiwgcGFnZUVsZW1lbnQuYXR0cignaWQnKSk7XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWRkVG9Kb3VybmFsLCBuZXdQYWdlLCBwYWdlRnJvbUxvY2FsU3RvcmFnZSwgcGFnZUhhbmRsZXIsIHB1c2hUb0xvY2FsLCBwdXNoVG9TZXJ2ZXIsIHJlY3Vyc2l2ZUdldCwgcmV2aXNpb24sIHN0YXRlLCB1dGlsLCB3aWtpLCBfO1xuXG4gIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKTtcblxuICByZXZpc2lvbiA9IHJlcXVpcmUoJy4vcmV2aXNpb24nKTtcblxuICBhZGRUb0pvdXJuYWwgPSByZXF1aXJlKCcuL2FkZFRvSm91cm5hbCcpO1xuXG4gIG5ld1BhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKS5uZXdQYWdlO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gcGFnZUhhbmRsZXIgPSB7fTtcblxuICBwYWdlRnJvbUxvY2FsU3RvcmFnZSA9IGZ1bmN0aW9uKHNsdWcpIHtcbiAgICB2YXIganNvbjtcbiAgICBpZiAoanNvbiA9IGxvY2FsU3RvcmFnZVtzbHVnXSkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UoanNvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICB9O1xuXG4gIHJlY3Vyc2l2ZUdldCA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgbG9jYWxDb250ZXh0LCBsb2NhbFBhZ2UsIHBhZ2VJbmZvcm1hdGlvbiwgcmV2LCBzaXRlLCBzbHVnLCB1cmwsIHdoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW47XG4gICAgcGFnZUluZm9ybWF0aW9uID0gX2FyZy5wYWdlSW5mb3JtYXRpb24sIHdoZW5Hb3R0ZW4gPSBfYXJnLndoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW4gPSBfYXJnLndoZW5Ob3RHb3R0ZW4sIGxvY2FsQ29udGV4dCA9IF9hcmcubG9jYWxDb250ZXh0O1xuICAgIHNsdWcgPSBwYWdlSW5mb3JtYXRpb24uc2x1ZywgcmV2ID0gcGFnZUluZm9ybWF0aW9uLnJldiwgc2l0ZSA9IHBhZ2VJbmZvcm1hdGlvbi5zaXRlO1xuICAgIGlmIChzaXRlKSB7XG4gICAgICBsb2NhbENvbnRleHQgPSBbXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2l0ZSA9IGxvY2FsQ29udGV4dC5zaGlmdCgpO1xuICAgIH1cbiAgICBpZiAoc2l0ZSA9PT0gd2luZG93LmxvY2F0aW9uLmhvc3QpIHtcbiAgICAgIHNpdGUgPSAnb3JpZ2luJztcbiAgICB9XG4gICAgaWYgKHNpdGUgPT09ICd2aWV3Jykge1xuICAgICAgc2l0ZSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChzaXRlICE9IG51bGwpIHtcbiAgICAgIGlmIChzaXRlID09PSAnbG9jYWwnKSB7XG4gICAgICAgIGlmIChsb2NhbFBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlSW5mb3JtYXRpb24uc2x1ZykpIHtcbiAgICAgICAgICByZXR1cm4gd2hlbkdvdHRlbihuZXdQYWdlKGxvY2FsUGFnZSwgJ2xvY2FsJykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB3aGVuTm90R290dGVuKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzaXRlID09PSAnb3JpZ2luJykge1xuICAgICAgICAgIHVybCA9IFwiL1wiICsgc2x1ZyArIFwiLmpzb25cIjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1cmwgPSBcImh0dHA6Ly9cIiArIHNpdGUgKyBcIi9cIiArIHNsdWcgKyBcIi5qc29uXCI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdXJsID0gXCIvXCIgKyBzbHVnICsgXCIuanNvblwiO1xuICAgIH1cbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgIHR5cGU6ICdHRVQnLFxuICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgIHVybDogdXJsICsgKFwiP3JhbmRvbT1cIiArICh1dGlsLnJhbmRvbUJ5dGVzKDQpKSksXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbihwYWdlKSB7XG4gICAgICAgIGlmIChyZXYpIHtcbiAgICAgICAgICBwYWdlID0gcmV2aXNpb24uY3JlYXRlKHJldiwgcGFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4obmV3UGFnZShwYWdlLCBzaXRlKSk7XG4gICAgICB9LFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhociwgdHlwZSwgbXNnKSB7XG4gICAgICAgIHZhciByZXBvcnQ7XG4gICAgICAgIGlmICgoeGhyLnN0YXR1cyAhPT0gNDA0KSAmJiAoeGhyLnN0YXR1cyAhPT0gMCkpIHtcbiAgICAgICAgICB3aWtpLmxvZygncGFnZUhhbmRsZXIuZ2V0IGVycm9yJywgeGhyLCB4aHIuc3RhdHVzLCB0eXBlLCBtc2cpO1xuICAgICAgICAgIHJlcG9ydCA9IHtcbiAgICAgICAgICAgICd0aXRsZSc6IFwiXCIgKyB4aHIuc3RhdHVzICsgXCIgXCIgKyBtc2csXG4gICAgICAgICAgICAnc3RvcnknOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAndHlwZSc6ICdwYXJhZ3JhcGgnLFxuICAgICAgICAgICAgICAgICdpZCc6ICc5Mjg3MzkxODcyNDMnLFxuICAgICAgICAgICAgICAgICd0ZXh0JzogXCI8cHJlPlwiICsgeGhyLnJlc3BvbnNlVGV4dFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gd2hlbkdvdHRlbihyZXBvcnQsICdsb2NhbCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhbENvbnRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiByZWN1cnNpdmVHZXQoe1xuICAgICAgICAgICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb24sXG4gICAgICAgICAgICB3aGVuR290dGVuOiB3aGVuR290dGVuLFxuICAgICAgICAgICAgd2hlbk5vdEdvdHRlbjogd2hlbk5vdEdvdHRlbixcbiAgICAgICAgICAgIGxvY2FsQ29udGV4dDogbG9jYWxDb250ZXh0XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHdoZW5Ob3RHb3R0ZW4oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHBhZ2VIYW5kbGVyLmdldCA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgbG9jYWxQYWdlLCBwYWdlSW5mb3JtYXRpb24sIHdoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW47XG4gICAgd2hlbkdvdHRlbiA9IF9hcmcud2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbiA9IF9hcmcud2hlbk5vdEdvdHRlbiwgcGFnZUluZm9ybWF0aW9uID0gX2FyZy5wYWdlSW5mb3JtYXRpb247XG4gICAgaWYgKCFwYWdlSW5mb3JtYXRpb24uc2l0ZSkge1xuICAgICAgaWYgKGxvY2FsUGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VJbmZvcm1hdGlvbi5zbHVnKSkge1xuICAgICAgICBpZiAocGFnZUluZm9ybWF0aW9uLnJldikge1xuICAgICAgICAgIGxvY2FsUGFnZSA9IHJldmlzaW9uLmNyZWF0ZShwYWdlSW5mb3JtYXRpb24ucmV2LCBsb2NhbFBhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3aGVuR290dGVuKG5ld1BhZ2UobG9jYWxQYWdlLCAnbG9jYWwnKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghcGFnZUhhbmRsZXIuY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJ3ZpZXcnXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlY3Vyc2l2ZUdldCh7XG4gICAgICBwYWdlSW5mb3JtYXRpb246IHBhZ2VJbmZvcm1hdGlvbixcbiAgICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW4sXG4gICAgICB3aGVuTm90R290dGVuOiB3aGVuTm90R290dGVuLFxuICAgICAgbG9jYWxDb250ZXh0OiBfLmNsb25lKHBhZ2VIYW5kbGVyLmNvbnRleHQpXG4gICAgfSk7XG4gIH07XG5cbiAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFtdO1xuXG4gIHB1c2hUb0xvY2FsID0gZnVuY3Rpb24ocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pIHtcbiAgICB2YXIgcGFnZSwgc2l0ZTtcbiAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdjcmVhdGUnKSB7XG4gICAgICBwYWdlID0ge1xuICAgICAgICB0aXRsZTogYWN0aW9uLml0ZW0udGl0bGUsXG4gICAgICAgIHN0b3J5OiBbXSxcbiAgICAgICAgam91cm5hbDogW11cbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlUHV0SW5mby5zbHVnKTtcbiAgICAgIHBhZ2UgfHwgKHBhZ2UgPSBwYWdlRWxlbWVudC5kYXRhKFwiZGF0YVwiKSk7XG4gICAgICBpZiAocGFnZS5qb3VybmFsID09IG51bGwpIHtcbiAgICAgICAgcGFnZS5qb3VybmFsID0gW107XG4gICAgICB9XG4gICAgICBpZiAoKHNpdGUgPSBhY3Rpb25bJ2ZvcmsnXSkgIT0gbnVsbCkge1xuICAgICAgICBwYWdlLmpvdXJuYWwgPSBwYWdlLmpvdXJuYWwuY29uY2F0KHtcbiAgICAgICAgICAndHlwZSc6ICdmb3JrJyxcbiAgICAgICAgICAnc2l0ZSc6IHNpdGVcbiAgICAgICAgfSk7XG4gICAgICAgIGRlbGV0ZSBhY3Rpb25bJ2ZvcmsnXTtcbiAgICAgIH1cbiAgICAgIHBhZ2Uuc3RvcnkgPSAkKHBhZ2VFbGVtZW50KS5maW5kKFwiLml0ZW1cIikubWFwKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJCh0aGlzKS5kYXRhKFwiaXRlbVwiKTtcbiAgICAgIH0pLmdldCgpO1xuICAgIH1cbiAgICBwYWdlLmpvdXJuYWwgPSBwYWdlLmpvdXJuYWwuY29uY2F0KGFjdGlvbik7XG4gICAgbG9jYWxTdG9yYWdlW3BhZ2VQdXRJbmZvLnNsdWddID0gSlNPTi5zdHJpbmdpZnkocGFnZSk7XG4gICAgcmV0dXJuIGFkZFRvSm91cm5hbChwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCBhY3Rpb24pO1xuICB9O1xuXG4gIHB1c2hUb1NlcnZlciA9IGZ1bmN0aW9uKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKSB7XG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICB0eXBlOiAnUFVUJyxcbiAgICAgIHVybDogXCIvcGFnZS9cIiArIHBhZ2VQdXRJbmZvLnNsdWcgKyBcIi9hY3Rpb25cIixcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgJ2FjdGlvbic6IEpTT04uc3RyaW5naWZ5KGFjdGlvbilcbiAgICAgIH0sXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgYWRkVG9Kb3VybmFsKHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksIGFjdGlvbik7XG4gICAgICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ2ZvcmsnKSB7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0ocGFnZUVsZW1lbnQuYXR0cignaWQnKSk7XG4gICAgICAgICAgcmV0dXJuIHN0YXRlLnNldFVybDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGVycm9yOiBmdW5jdGlvbih4aHIsIHR5cGUsIG1zZykge1xuICAgICAgICByZXR1cm4gd2lraS5sb2coXCJwYWdlSGFuZGxlci5wdXQgYWpheCBlcnJvciBjYWxsYmFja1wiLCB0eXBlLCBtc2cpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIHBhZ2VIYW5kbGVyLnB1dCA9IGZ1bmN0aW9uKHBhZ2VFbGVtZW50LCBhY3Rpb24pIHtcbiAgICB2YXIgY2hlY2tlZFNpdGUsIGZvcmtGcm9tLCBwYWdlUHV0SW5mbztcbiAgICBjaGVja2VkU2l0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHNpdGU7XG4gICAgICBzd2l0Y2ggKHNpdGUgPSBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJykpIHtcbiAgICAgICAgY2FzZSAnb3JpZ2luJzpcbiAgICAgICAgY2FzZSAnbG9jYWwnOlxuICAgICAgICBjYXNlICd2aWV3JzpcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgY2FzZSBsb2NhdGlvbi5ob3N0OlxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBzaXRlO1xuICAgICAgfVxuICAgIH07XG4gICAgcGFnZVB1dEluZm8gPSB7XG4gICAgICBzbHVnOiBwYWdlRWxlbWVudC5hdHRyKCdpZCcpLnNwbGl0KCdfcmV2JylbMF0sXG4gICAgICByZXY6IHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVsxXSxcbiAgICAgIHNpdGU6IGNoZWNrZWRTaXRlKCksXG4gICAgICBsb2NhbDogcGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2xvY2FsJylcbiAgICB9O1xuICAgIGZvcmtGcm9tID0gcGFnZVB1dEluZm8uc2l0ZTtcbiAgICB3aWtpLmxvZygncGFnZUhhbmRsZXIucHV0JywgYWN0aW9uLCBwYWdlUHV0SW5mbyk7XG4gICAgaWYgKHdpa2kudXNlTG9jYWxTdG9yYWdlKCkpIHtcbiAgICAgIGlmIChwYWdlUHV0SW5mby5zaXRlICE9IG51bGwpIHtcbiAgICAgICAgd2lraS5sb2coJ3JlbW90ZSA9PiBsb2NhbCcpO1xuICAgICAgfSBlbHNlIGlmICghcGFnZVB1dEluZm8ubG9jYWwpIHtcbiAgICAgICAgd2lraS5sb2coJ29yaWdpbiA9PiBsb2NhbCcpO1xuICAgICAgICBhY3Rpb24uc2l0ZSA9IGZvcmtGcm9tID0gbG9jYXRpb24uaG9zdDtcbiAgICAgIH1cbiAgICB9XG4gICAgYWN0aW9uLmRhdGUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgIGlmIChhY3Rpb24uc2l0ZSA9PT0gJ29yaWdpbicpIHtcbiAgICAgIGRlbGV0ZSBhY3Rpb24uc2l0ZTtcbiAgICB9XG4gICAgaWYgKGZvcmtGcm9tKSB7XG4gICAgICBwYWdlRWxlbWVudC5maW5kKCdoMSBpbWcnKS5hdHRyKCdzcmMnLCAnL2Zhdmljb24ucG5nJyk7XG4gICAgICBwYWdlRWxlbWVudC5maW5kKCdoMSBhJykuYXR0cignaHJlZicsICcvJyk7XG4gICAgICBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJywgbnVsbCk7XG4gICAgICBwYWdlRWxlbWVudC5yZW1vdmVDbGFzcygncmVtb3RlJyk7XG4gICAgICBzdGF0ZS5zZXRVcmwoKTtcbiAgICAgIGlmIChhY3Rpb24udHlwZSAhPT0gJ2ZvcmsnKSB7XG4gICAgICAgIGFjdGlvbi5mb3JrID0gZm9ya0Zyb207XG4gICAgICAgIGFkZFRvSm91cm5hbChwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCB7XG4gICAgICAgICAgdHlwZTogJ2ZvcmsnLFxuICAgICAgICAgIHNpdGU6IGZvcmtGcm9tLFxuICAgICAgICAgIGRhdGU6IGFjdGlvbi5kYXRlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAod2lraS51c2VMb2NhbFN0b3JhZ2UoKSB8fCBwYWdlUHV0SW5mby5zaXRlID09PSAnbG9jYWwnKSB7XG4gICAgICBwdXNoVG9Mb2NhbChwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbik7XG4gICAgICByZXR1cm4gcGFnZUVsZW1lbnQuYWRkQ2xhc3MoXCJsb2NhbFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHB1c2hUb1NlcnZlcihwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbik7XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWRkVG9Kb3VybmFsLCBidWlsZFBhZ2VIZWFkZXIsIGNyZWF0ZUZhY3RvcnksIGVtaXRIZWFkZXIsIGVtaXRUd2lucywgaGFuZGxlRHJhZ2dpbmcsIGluaXRBZGRCdXR0b24sIGluaXREcmFnZ2luZywgbmVpZ2hib3Job29kLCBwYWdlSGFuZGxlciwgcGx1Z2luLCByZWZyZXNoLCByZW5kZXJQYWdlSW50b1BhZ2VFbGVtZW50LCBzdGF0ZSwgdXRpbCwgd2lraSwgXztcblxuICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBwYWdlSGFuZGxlciA9IHJlcXVpcmUoJy4vcGFnZUhhbmRsZXInKTtcblxuICBwbHVnaW4gPSByZXF1aXJlKCcuL3BsdWdpbicpO1xuXG4gIHN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZScpO1xuXG4gIG5laWdoYm9yaG9vZCA9IHJlcXVpcmUoJy4vbmVpZ2hib3Job29kJyk7XG5cbiAgYWRkVG9Kb3VybmFsID0gcmVxdWlyZSgnLi9hZGRUb0pvdXJuYWwnKTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgaGFuZGxlRHJhZ2dpbmcgPSBmdW5jdGlvbihldnQsIHVpKSB7XG4gICAgdmFyIGFjdGlvbiwgYmVmb3JlLCBiZWZvcmVFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50LCBlcXVhbHMsIGl0ZW0sIGl0ZW1FbGVtZW50LCBtb3ZlRnJvbVBhZ2UsIG1vdmVUb1BhZ2UsIG1vdmVXaXRoaW5QYWdlLCBvcmRlciwgc291cmNlUGFnZUVsZW1lbnQsIHNvdXJjZVNpdGUsIHRoaXNQYWdlRWxlbWVudDtcbiAgICBpdGVtRWxlbWVudCA9IHVpLml0ZW07XG4gICAgaXRlbSA9IHdpa2kuZ2V0SXRlbShpdGVtRWxlbWVudCk7XG4gICAgdGhpc1BhZ2VFbGVtZW50ID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpO1xuICAgIHNvdXJjZVBhZ2VFbGVtZW50ID0gaXRlbUVsZW1lbnQuZGF0YSgncGFnZUVsZW1lbnQnKTtcbiAgICBzb3VyY2VTaXRlID0gc291cmNlUGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpO1xuICAgIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpO1xuICAgIGVxdWFscyA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgIHJldHVybiBhICYmIGIgJiYgYS5nZXQoMCkgPT09IGIuZ2V0KDApO1xuICAgIH07XG4gICAgbW92ZVdpdGhpblBhZ2UgPSAhc291cmNlUGFnZUVsZW1lbnQgfHwgZXF1YWxzKHNvdXJjZVBhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KTtcbiAgICBtb3ZlRnJvbVBhZ2UgPSAhbW92ZVdpdGhpblBhZ2UgJiYgZXF1YWxzKHRoaXNQYWdlRWxlbWVudCwgc291cmNlUGFnZUVsZW1lbnQpO1xuICAgIG1vdmVUb1BhZ2UgPSAhbW92ZVdpdGhpblBhZ2UgJiYgZXF1YWxzKHRoaXNQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudCk7XG4gICAgaWYgKG1vdmVGcm9tUGFnZSkge1xuICAgICAgaWYgKHNvdXJjZVBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdnaG9zdCcpIHx8IHNvdXJjZVBhZ2VFbGVtZW50LmF0dHIoJ2lkJykgPT09IGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQuYXR0cignaWQnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIGFjdGlvbiA9IG1vdmVXaXRoaW5QYWdlID8gKG9yZGVyID0gJCh0aGlzKS5jaGlsZHJlbigpLm1hcChmdW5jdGlvbihfLCB2YWx1ZSkge1xuICAgICAgcmV0dXJuICQodmFsdWUpLmF0dHIoJ2RhdGEtaWQnKTtcbiAgICB9KS5nZXQoKSwge1xuICAgICAgdHlwZTogJ21vdmUnLFxuICAgICAgb3JkZXI6IG9yZGVyXG4gICAgfSkgOiBtb3ZlRnJvbVBhZ2UgPyAod2lraS5sb2coJ2RyYWcgZnJvbScsIHNvdXJjZVBhZ2VFbGVtZW50LmZpbmQoJ2gxJykudGV4dCgpKSwge1xuICAgICAgdHlwZTogJ3JlbW92ZSdcbiAgICB9KSA6IG1vdmVUb1BhZ2UgPyAoaXRlbUVsZW1lbnQuZGF0YSgncGFnZUVsZW1lbnQnLCB0aGlzUGFnZUVsZW1lbnQpLCBiZWZvcmVFbGVtZW50ID0gaXRlbUVsZW1lbnQucHJldignLml0ZW0nKSwgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpLCB7XG4gICAgICB0eXBlOiAnYWRkJyxcbiAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICBhZnRlcjogYmVmb3JlICE9IG51bGwgPyBiZWZvcmUuaWQgOiB2b2lkIDBcbiAgICB9KSA6IHZvaWQgMDtcbiAgICBhY3Rpb24uaWQgPSBpdGVtLmlkO1xuICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQodGhpc1BhZ2VFbGVtZW50LCBhY3Rpb24pO1xuICB9O1xuXG4gIGluaXREcmFnZ2luZyA9IGZ1bmN0aW9uKCRwYWdlKSB7XG4gICAgdmFyICRzdG9yeTtcbiAgICAkc3RvcnkgPSAkcGFnZS5maW5kKCcuc3RvcnknKTtcbiAgICByZXR1cm4gJHN0b3J5LnNvcnRhYmxlKHtcbiAgICAgIGNvbm5lY3RXaXRoOiAnLnBhZ2UgLnN0b3J5J1xuICAgIH0pLm9uKFwic29ydHVwZGF0ZVwiLCBoYW5kbGVEcmFnZ2luZyk7XG4gIH07XG5cbiAgaW5pdEFkZEJ1dHRvbiA9IGZ1bmN0aW9uKCRwYWdlKSB7XG4gICAgcmV0dXJuICRwYWdlLmZpbmQoXCIuYWRkLWZhY3RvcnlcIikubGl2ZShcImNsaWNrXCIsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgaWYgKCRwYWdlLmhhc0NsYXNzKCdnaG9zdCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuIGNyZWF0ZUZhY3RvcnkoJHBhZ2UpO1xuICAgIH0pO1xuICB9O1xuXG4gIGNyZWF0ZUZhY3RvcnkgPSBmdW5jdGlvbigkcGFnZSkge1xuICAgIHZhciBiZWZvcmUsIGJlZm9yZUVsZW1lbnQsIGl0ZW0sIGl0ZW1FbGVtZW50O1xuICAgIGl0ZW0gPSB7XG4gICAgICB0eXBlOiBcImZhY3RvcnlcIixcbiAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgfTtcbiAgICBpdGVtRWxlbWVudCA9ICQoXCI8ZGl2IC8+XCIsIHtcbiAgICAgIFwiY2xhc3NcIjogXCJpdGVtIGZhY3RvcnlcIlxuICAgIH0pLmRhdGEoJ2l0ZW0nLCBpdGVtKS5hdHRyKCdkYXRhLWlkJywgaXRlbS5pZCk7XG4gICAgaXRlbUVsZW1lbnQuZGF0YSgncGFnZUVsZW1lbnQnLCAkcGFnZSk7XG4gICAgJHBhZ2UuZmluZChcIi5zdG9yeVwiKS5hcHBlbmQoaXRlbUVsZW1lbnQpO1xuICAgIHBsdWdpbltcImRvXCJdKGl0ZW1FbGVtZW50LCBpdGVtKTtcbiAgICBiZWZvcmVFbGVtZW50ID0gaXRlbUVsZW1lbnQucHJldignLml0ZW0nKTtcbiAgICBiZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudCk7XG4gICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dCgkcGFnZSwge1xuICAgICAgaXRlbTogaXRlbSxcbiAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgdHlwZTogXCJhZGRcIixcbiAgICAgIGFmdGVyOiBiZWZvcmUgIT0gbnVsbCA/IGJlZm9yZS5pZCA6IHZvaWQgMFxuICAgIH0pO1xuICB9O1xuXG4gIGJ1aWxkUGFnZUhlYWRlciA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgZmF2aWNvbl9zcmMsIGhlYWRlcl9ocmVmLCBwYWdlLCB0b29sdGlwO1xuICAgIHBhZ2UgPSBfYXJnLnBhZ2UsIHRvb2x0aXAgPSBfYXJnLnRvb2x0aXAsIGhlYWRlcl9ocmVmID0gX2FyZy5oZWFkZXJfaHJlZiwgZmF2aWNvbl9zcmMgPSBfYXJnLmZhdmljb25fc3JjO1xuICAgIGlmIChwYWdlLnBsdWdpbikge1xuICAgICAgdG9vbHRpcCArPSBcIlxcblwiICsgcGFnZS5wbHVnaW4gKyBcIiBwbHVnaW5cIjtcbiAgICB9XG4gICAgcmV0dXJuIFwiPGgxIHRpdGxlPVxcXCJcIiArIHRvb2x0aXAgKyBcIlxcXCI+PGEgaHJlZj1cXFwiXCIgKyBoZWFkZXJfaHJlZiArIFwiXFxcIj48aW1nIHNyYz1cXFwiXCIgKyBmYXZpY29uX3NyYyArIFwiXFxcIiBoZWlnaHQ9XFxcIjMycHhcXFwiIGNsYXNzPVxcXCJmYXZpY29uXFxcIj48L2E+IFwiICsgcGFnZS50aXRsZSArIFwiPC9oMT5cIjtcbiAgfTtcblxuICBlbWl0SGVhZGVyID0gZnVuY3Rpb24oJGhlYWRlciwgJHBhZ2UsIHBhZ2VPYmplY3QpIHtcbiAgICB2YXIgZGF0ZSwgaGVhZGVyLCBpc1JlbW90ZVBhZ2UsIHBhZ2UsIHBhZ2VIZWFkZXIsIHJldiwgdmlld0hlcmU7XG4gICAgcGFnZSA9IHBhZ2VPYmplY3QuZ2V0UmF3UGFnZSgpO1xuICAgIGlzUmVtb3RlUGFnZSA9IHBhZ2VPYmplY3QuaXNSZW1vdGUoKTtcbiAgICBoZWFkZXIgPSAnJztcbiAgICB2aWV3SGVyZSA9IHdpa2kuYXNTbHVnKHBhZ2UudGl0bGUpID09PSAnd2VsY29tZS12aXNpdG9ycycgPyBcIlwiIDogXCIvdmlldy9cIiArIChwYWdlT2JqZWN0LmdldFNsdWcoKSk7XG4gICAgcGFnZUhlYWRlciA9IGlzUmVtb3RlUGFnZSA/IGJ1aWxkUGFnZUhlYWRlcih7XG4gICAgICB0b29sdGlwOiBwYWdlT2JqZWN0LmdldFJlbW90ZVNpdGUoKSxcbiAgICAgIGhlYWRlcl9ocmVmOiBcIi8vXCIgKyAocGFnZU9iamVjdC5nZXRSZW1vdGVTaXRlKCkpICsgXCIvdmlldy93ZWxjb21lLXZpc2l0b3JzXCIgKyB2aWV3SGVyZSxcbiAgICAgIGZhdmljb25fc3JjOiBcImh0dHA6Ly9cIiArIChwYWdlT2JqZWN0LmdldFJlbW90ZVNpdGUoKSkgKyBcIi9mYXZpY29uLnBuZ1wiLFxuICAgICAgcGFnZTogcGFnZVxuICAgIH0pIDogYnVpbGRQYWdlSGVhZGVyKHtcbiAgICAgIHRvb2x0aXA6IGxvY2F0aW9uLmhvc3QsXG4gICAgICBoZWFkZXJfaHJlZjogXCIvdmlldy93ZWxjb21lLXZpc2l0b3JzXCIgKyB2aWV3SGVyZSxcbiAgICAgIGZhdmljb25fc3JjOiBcIi9mYXZpY29uLnBuZ1wiLFxuICAgICAgcGFnZTogcGFnZVxuICAgIH0pO1xuICAgICRoZWFkZXIuYXBwZW5kKHBhZ2VIZWFkZXIpO1xuICAgIGlmICghaXNSZW1vdGVQYWdlKSB7XG4gICAgICAkKCdpbWcuZmF2aWNvbicsICRwYWdlKS5lcnJvcihmdW5jdGlvbihlKSB7XG4gICAgICAgIHJldHVybiBwbHVnaW4uZ2V0KCdmYXZpY29uJywgZnVuY3Rpb24oZmF2aWNvbikge1xuICAgICAgICAgIHJldHVybiBmYXZpY29uLmNyZWF0ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoJHBhZ2UuYXR0cignaWQnKS5tYXRjaCgvX3Jldi8pKSB7XG4gICAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoIC0gMTtcbiAgICAgIGRhdGUgPSBwYWdlLmpvdXJuYWxbcmV2XS5kYXRlO1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2dob3N0JykuZGF0YSgncmV2JywgcmV2KTtcbiAgICAgIHJldHVybiAkaGVhZGVyLmFwcGVuZCgkKFwiPGgyIGNsYXNzPVxcXCJyZXZpc2lvblxcXCI+XFxuICA8c3Bhbj5cXG4gICAgXCIgKyAoZGF0ZSAhPSBudWxsID8gdXRpbC5mb3JtYXREYXRlKGRhdGUpIDogXCJSZXZpc2lvbiBcIiArIHJldikgKyBcIlxcbiAgPC9zcGFuPlxcbjwvaDI+XCIpKTtcbiAgICB9XG4gIH07XG5cbiAgZW1pdFR3aW5zID0gd2lraS5lbWl0VHdpbnMgPSBmdW5jdGlvbigkcGFnZSkge1xuICAgIHZhciBhY3Rpb25zLCBiaW4sIGJpbnMsIGZsYWdzLCBpLCBpbmZvLCBpdGVtLCBsZWdlbmQsIHBhZ2UsIHJlbW90ZVNpdGUsIHNpdGUsIHNsdWcsIHR3aW5zLCB2aWV3aW5nLCBfaSwgX2xlbiwgX3JlZiwgX3JlZjEsIF9yZWYyLCBfcmVmMztcbiAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpO1xuICAgIHNpdGUgPSAkcGFnZS5kYXRhKCdzaXRlJykgfHwgd2luZG93LmxvY2F0aW9uLmhvc3Q7XG4gICAgaWYgKHNpdGUgPT09ICd2aWV3JyB8fCBzaXRlID09PSAnb3JpZ2luJykge1xuICAgICAgc2l0ZSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgIH1cbiAgICBzbHVnID0gd2lraS5hc1NsdWcocGFnZS50aXRsZSk7XG4gICAgaWYgKCgoYWN0aW9ucyA9IChfcmVmID0gcGFnZS5qb3VybmFsKSAhPSBudWxsID8gX3JlZi5sZW5ndGggOiB2b2lkIDApICE9IG51bGwpICYmICgodmlld2luZyA9IChfcmVmMSA9IHBhZ2Uuam91cm5hbFthY3Rpb25zIC0gMV0pICE9IG51bGwgPyBfcmVmMS5kYXRlIDogdm9pZCAwKSAhPSBudWxsKSkge1xuICAgICAgdmlld2luZyA9IE1hdGguZmxvb3Iodmlld2luZyAvIDEwMDApICogMTAwMDtcbiAgICAgIGJpbnMgPSB7XG4gICAgICAgIG5ld2VyOiBbXSxcbiAgICAgICAgc2FtZTogW10sXG4gICAgICAgIG9sZGVyOiBbXVxuICAgICAgfTtcbiAgICAgIF9yZWYyID0gd2lraS5uZWlnaGJvcmhvb2Q7XG4gICAgICBmb3IgKHJlbW90ZVNpdGUgaW4gX3JlZjIpIHtcbiAgICAgICAgaW5mbyA9IF9yZWYyW3JlbW90ZVNpdGVdO1xuICAgICAgICBpZiAocmVtb3RlU2l0ZSAhPT0gc2l0ZSAmJiAoaW5mby5zaXRlbWFwICE9IG51bGwpKSB7XG4gICAgICAgICAgX3JlZjMgPSBpbmZvLnNpdGVtYXA7XG4gICAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgICAgaXRlbSA9IF9yZWYzW19pXTtcbiAgICAgICAgICAgIGlmIChpdGVtLnNsdWcgPT09IHNsdWcpIHtcbiAgICAgICAgICAgICAgYmluID0gaXRlbS5kYXRlID4gdmlld2luZyA/IGJpbnMubmV3ZXIgOiBpdGVtLmRhdGUgPCB2aWV3aW5nID8gYmlucy5vbGRlciA6IGJpbnMuc2FtZTtcbiAgICAgICAgICAgICAgYmluLnB1c2goe1xuICAgICAgICAgICAgICAgIHJlbW90ZVNpdGU6IHJlbW90ZVNpdGUsXG4gICAgICAgICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHR3aW5zID0gW107XG4gICAgICBmb3IgKGxlZ2VuZCBpbiBiaW5zKSB7XG4gICAgICAgIGJpbiA9IGJpbnNbbGVnZW5kXTtcbiAgICAgICAgaWYgKCFiaW4ubGVuZ3RoKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYmluLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgIHJldHVybiBhLml0ZW0uZGF0ZSA8IGIuaXRlbS5kYXRlO1xuICAgICAgICB9KTtcbiAgICAgICAgZmxhZ3MgPSAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIF9qLCBfbGVuMSwgX3JlZjQsIF9yZXN1bHRzO1xuICAgICAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICAgICAgZm9yIChpID0gX2ogPSAwLCBfbGVuMSA9IGJpbi5sZW5ndGg7IF9qIDwgX2xlbjE7IGkgPSArK19qKSB7XG4gICAgICAgICAgICBfcmVmNCA9IGJpbltpXSwgcmVtb3RlU2l0ZSA9IF9yZWY0LnJlbW90ZVNpdGUsIGl0ZW0gPSBfcmVmNC5pdGVtO1xuICAgICAgICAgICAgaWYgKGkgPj0gOCkge1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goXCI8aW1nIGNsYXNzPVxcXCJyZW1vdGVcXFwiXFxuc3JjPVxcXCJodHRwOi8vXCIgKyByZW1vdGVTaXRlICsgXCIvZmF2aWNvbi5wbmdcXFwiXFxuZGF0YS1zbHVnPVxcXCJcIiArIHNsdWcgKyBcIlxcXCJcXG5kYXRhLXNpdGU9XFxcIlwiICsgcmVtb3RlU2l0ZSArIFwiXFxcIlxcbnRpdGxlPVxcXCJcIiArIHJlbW90ZVNpdGUgKyBcIlxcXCI+XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH0pKCk7XG4gICAgICAgIHR3aW5zLnB1c2goXCJcIiArIChmbGFncy5qb2luKCcmbmJzcDsnKSkgKyBcIiBcIiArIGxlZ2VuZCk7XG4gICAgICB9XG4gICAgICBpZiAodHdpbnMpIHtcbiAgICAgICAgcmV0dXJuICRwYWdlLmZpbmQoJy50d2lucycpLmh0bWwoXCI8cD5cIiArICh0d2lucy5qb2luKFwiLCBcIikpICsgXCI8L3A+XCIpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZW5kZXJQYWdlSW50b1BhZ2VFbGVtZW50ID0gZnVuY3Rpb24ocGFnZU9iamVjdCwgJHBhZ2UpIHtcbiAgICB2YXIgJGZvb3RlciwgJGhlYWRlciwgJGpvdXJuYWwsICRzdG9yeSwgJHR3aW5zLCBhY3Rpb24sIGVtaXRJdGVtLCBob3N0LCBwYWdlLCBzbHVnLCBfaSwgX2xlbiwgX3JlZiwgX3JlZjE7XG4gICAgcGFnZSA9IHBhZ2VPYmplY3QuZ2V0UmF3UGFnZSgpO1xuICAgICRwYWdlLmRhdGEoXCJkYXRhXCIsIHBhZ2UpO1xuICAgIHNsdWcgPSAkcGFnZS5hdHRyKCdpZCcpO1xuICAgIHdpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBwYWdlT2JqZWN0LmdldENvbnRleHQoKTtcbiAgICAkcGFnZS5lbXB0eSgpO1xuICAgIF9yZWYgPSBbJ3R3aW5zJywgJ2hlYWRlcicsICdzdG9yeScsICdqb3VybmFsJywgJ2Zvb3RlciddLm1hcChmdW5jdGlvbihjbGFzc05hbWUpIHtcbiAgICAgIHJldHVybiAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcyhjbGFzc05hbWUpLmFwcGVuZFRvKCRwYWdlKTtcbiAgICB9KSwgJHR3aW5zID0gX3JlZlswXSwgJGhlYWRlciA9IF9yZWZbMV0sICRzdG9yeSA9IF9yZWZbMl0sICRqb3VybmFsID0gX3JlZlszXSwgJGZvb3RlciA9IF9yZWZbNF07XG4gICAgZW1pdEhlYWRlcigkaGVhZGVyLCAkcGFnZSwgcGFnZU9iamVjdCk7XG4gICAgZW1pdEl0ZW0gPSBmdW5jdGlvbihpKSB7XG4gICAgICB2YXIgJGl0ZW0sIGl0ZW07XG4gICAgICBpZiAoaSA+PSBwYWdlLnN0b3J5Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpdGVtID0gcGFnZS5zdG9yeVtpXTtcbiAgICAgIGlmICgoaXRlbSAhPSBudWxsID8gaXRlbS50eXBlIDogdm9pZCAwKSAmJiAoaXRlbSAhPSBudWxsID8gaXRlbS5pZCA6IHZvaWQgMCkpIHtcbiAgICAgICAgJGl0ZW0gPSAkKFwiPGRpdiBjbGFzcz1cXFwiaXRlbSBcIiArIGl0ZW0udHlwZSArIFwiXFxcIiBkYXRhLWlkPVxcXCJcIiArIGl0ZW0uaWQgKyBcIlxcXCI+XCIpO1xuICAgICAgICAkc3RvcnkuYXBwZW5kKCRpdGVtKTtcbiAgICAgICAgcmV0dXJuIHBsdWdpbltcImRvXCJdKCRpdGVtLCBpdGVtLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gZW1pdEl0ZW0oaSArIDEpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzdG9yeS5hcHBlbmQoJChcIjxkaXY+PHAgY2xhc3M9XFxcImVycm9yXFxcIj5DYW4ndCBtYWtlIHNlbnNlIG9mIHN0b3J5W1wiICsgaSArIFwiXTwvcD48L2Rpdj5cIikpO1xuICAgICAgICByZXR1cm4gZW1pdEl0ZW0oaSArIDEpO1xuICAgICAgfVxuICAgIH07XG4gICAgZW1pdEl0ZW0oMCk7XG4gICAgX3JlZjEgPSBwYWdlLmpvdXJuYWw7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmMS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgYWN0aW9uID0gX3JlZjFbX2ldO1xuICAgICAgYWRkVG9Kb3VybmFsKCRqb3VybmFsLCBhY3Rpb24pO1xuICAgIH1cbiAgICBlbWl0VHdpbnMoJHBhZ2UpO1xuICAgICRqb3VybmFsLmFwcGVuZChcIjxkaXYgY2xhc3M9XFxcImNvbnRyb2wtYnV0dG9uc1xcXCI+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGZvcmstcGFnZVxcXCIgdGl0bGU9XFxcImZvcmsgdGhpcyBwYWdlXFxcIj5cIiArIHV0aWwuc3ltYm9sc1snZm9yayddICsgXCI8L2E+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGFkZC1mYWN0b3J5XFxcIiB0aXRsZT1cXFwiYWRkIHBhcmFncmFwaFxcXCI+XCIgKyB1dGlsLnN5bWJvbHNbJ2FkZCddICsgXCI8L2E+XFxuPC9kaXY+XCIpO1xuICAgIGhvc3QgPSBwYWdlT2JqZWN0LmdldFJlbW90ZVNpdGUoKSB8fCBsb2NhdGlvbi5ob3N0O1xuICAgIHJldHVybiAkZm9vdGVyLmFwcGVuZChcIjxhIGlkPVxcXCJsaWNlbnNlXFxcIiBocmVmPVxcXCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvXFxcIj5DQyBCWS1TQSAzLjA8L2E+IC5cXG48YSBjbGFzcz1cXFwic2hvdy1wYWdlLXNvdXJjZVxcXCIgaHJlZj1cXFwiL1wiICsgc2x1ZyArIFwiLmpzb24/cmFuZG9tPVwiICsgKHV0aWwucmFuZG9tQnl0ZXMoNCkpICsgXCJcXFwiIHRpdGxlPVxcXCJzb3VyY2VcXFwiPkpTT048L2E+IC5cXG48YSBocmVmPSBcXFwiLy9cIiArIGhvc3QgKyBcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIj5cIiArIGhvc3QgKyBcIjwvYT5cIik7XG4gIH07XG5cbiAgd2lraS5idWlsZFBhZ2UgPSBmdW5jdGlvbihwYWdlT2JqZWN0LCAkcGFnZSkge1xuICAgIGlmIChwYWdlT2JqZWN0LmlzTG9jYWwoKSkge1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2xvY2FsJyk7XG4gICAgfVxuICAgIGlmIChwYWdlT2JqZWN0LmlzUmVtb3RlKCkpIHtcbiAgICAgICRwYWdlLmFkZENsYXNzKCdyZW1vdGUnKTtcbiAgICB9XG4gICAgaWYgKHBhZ2VPYmplY3QuaXNQbHVnaW4oKSkge1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ3BsdWdpbicpO1xuICAgIH1cbiAgICByZW5kZXJQYWdlSW50b1BhZ2VFbGVtZW50KHBhZ2VPYmplY3QsICRwYWdlKTtcbiAgICBzdGF0ZS5zZXRVcmwoKTtcbiAgICBpbml0RHJhZ2dpbmcoJHBhZ2UpO1xuICAgIGluaXRBZGRCdXR0b24oJHBhZ2UpO1xuICAgIHJldHVybiAkcGFnZTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2ggPSB3aWtpLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJHBhZ2UsIGNyZWF0ZUdob3N0UGFnZSwgZW1wdHlQYWdlLCBwYWdlSW5mb3JtYXRpb24sIHJldiwgc2x1Zywgd2hlbkdvdHRlbiwgX3JlZjtcbiAgICAkcGFnZSA9ICQodGhpcyk7XG4gICAgX3JlZiA9ICRwYWdlLmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKSwgc2x1ZyA9IF9yZWZbMF0sIHJldiA9IF9yZWZbMV07XG4gICAgcGFnZUluZm9ybWF0aW9uID0ge1xuICAgICAgc2x1Zzogc2x1ZyxcbiAgICAgIHJldjogcmV2LFxuICAgICAgc2l0ZTogJHBhZ2UuZGF0YSgnc2l0ZScpXG4gICAgfTtcbiAgICBlbXB0eVBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKS5lbXB0eVBhZ2U7XG4gICAgY3JlYXRlR2hvc3RQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGl0LCBoaXRzLCBpbmZvLCBwYWdlT2JqZWN0LCByZXN1bHQsIHNpdGUsIHRpdGxlLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICB0aXRsZSA9ICQoXCJhW2hyZWY9XFxcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIl06bGFzdFwiKS50ZXh0KCkgfHwgc2x1ZztcbiAgICAgIHBhZ2VPYmplY3QgPSBlbXB0eVBhZ2UoKTtcbiAgICAgIHBhZ2VPYmplY3Quc2V0VGl0bGUodGl0bGUpO1xuICAgICAgaGl0cyA9IFtdO1xuICAgICAgX3JlZjEgPSB3aWtpLm5laWdoYm9yaG9vZDtcbiAgICAgIGZvciAoc2l0ZSBpbiBfcmVmMSkge1xuICAgICAgICBpbmZvID0gX3JlZjFbc2l0ZV07XG4gICAgICAgIGlmIChpbmZvLnNpdGVtYXAgIT0gbnVsbCkge1xuICAgICAgICAgIHJlc3VsdCA9IF8uZmluZChpbmZvLnNpdGVtYXAsIGZ1bmN0aW9uKGVhY2gpIHtcbiAgICAgICAgICAgIHJldHVybiBlYWNoLnNsdWcgPT09IHNsdWc7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBoaXRzLnB1c2goe1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIixcbiAgICAgICAgICAgICAgXCJzaXRlXCI6IHNpdGUsXG4gICAgICAgICAgICAgIFwic2x1Z1wiOiBzbHVnLFxuICAgICAgICAgICAgICBcInRpdGxlXCI6IHJlc3VsdC50aXRsZSB8fCBzbHVnLFxuICAgICAgICAgICAgICBcInRleHRcIjogcmVzdWx0LnN5bm9wc2lzIHx8ICcnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChoaXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcGFnZU9iamVjdC5hZGRJdGVtKHtcbiAgICAgICAgICAndHlwZSc6ICdmdXR1cmUnLFxuICAgICAgICAgICd0ZXh0JzogJ1dlIGNvdWxkIG5vdCBmaW5kIHRoaXMgcGFnZSBpbiB0aGUgZXhwZWN0ZWQgY29udGV4dC4nLFxuICAgICAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICAgIH0pO1xuICAgICAgICBwYWdlT2JqZWN0LmFkZEl0ZW0oe1xuICAgICAgICAgICd0eXBlJzogJ3BhcmFncmFwaCcsXG4gICAgICAgICAgJ3RleHQnOiBcIldlIGRpZCBmaW5kIHRoZSBwYWdlIGluIHlvdXIgY3VycmVudCBuZWlnaGJvcmhvb2QuXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gaGl0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGhpdCA9IGhpdHNbX2ldO1xuICAgICAgICAgIHBhZ2VPYmplY3QuYWRkSXRlbShoaXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlT2JqZWN0LmFkZEl0ZW0oe1xuICAgICAgICAgICd0eXBlJzogJ2Z1dHVyZScsXG4gICAgICAgICAgJ3RleHQnOiAnV2UgY291bGQgbm90IGZpbmQgdGhpcyBwYWdlLicsXG4gICAgICAgICAgJ3RpdGxlJzogdGl0bGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UpLmFkZENsYXNzKCdnaG9zdCcpO1xuICAgIH07XG4gICAgd2hlbkdvdHRlbiA9IGZ1bmN0aW9uKHBhZ2VPYmplY3QpIHtcbiAgICAgIHZhciBzaXRlLCBfaSwgX2xlbiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgICAgd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UpO1xuICAgICAgX3JlZjEgPSBwYWdlT2JqZWN0LmdldE5laWdoYm9ycyhsb2NhdGlvbi5ob3N0KTtcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHNpdGUgPSBfcmVmMVtfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2gobmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3Ioc2l0ZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH07XG4gICAgcmV0dXJuIHBhZ2VIYW5kbGVyLmdldCh7XG4gICAgICB3aGVuR290dGVuOiB3aGVuR290dGVuLFxuICAgICAgd2hlbk5vdEdvdHRlbjogY3JlYXRlR2hvc3RQYWdlLFxuICAgICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cbiAgICB9KTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFzU2x1ZywgZW1wdHlQYWdlLCBuZXdQYWdlLCB1dGlsLCBfO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4gIGFzU2x1ZyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKC9cXHMvZywgJy0nKS5yZXBsYWNlKC9bXkEtWmEtejAtOS1dL2csICcnKS50b0xvd2VyQ2FzZSgpO1xuICB9O1xuXG4gIGVtcHR5UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXdQYWdlKHt9LCBudWxsKTtcbiAgfTtcblxuICBuZXdQYWdlID0gZnVuY3Rpb24oanNvbiwgc2l0ZSkge1xuICAgIHZhciBhZGRJdGVtLCBhZGRQYXJhZ3JhcGgsIGdldENvbnRleHQsIGdldE5laWdoYm9ycywgZ2V0UmF3UGFnZSwgZ2V0UmVtb3RlU2l0ZSwgZ2V0U2x1ZywgaXNMb2NhbCwgaXNQbHVnaW4sIGlzUmVtb3RlLCBwYWdlLCBzZXRUaXRsZTtcbiAgICBwYWdlID0gXy5leHRlbmQoe30sIHV0aWwuZW1wdHlQYWdlKCksIGpzb24pO1xuICAgIHBhZ2Uuc3RvcnkgfHwgKHBhZ2Uuc3RvcnkgPSBbXSk7XG4gICAgcGFnZS5qb3VybmFsIHx8IChwYWdlLmpvdXJuYWwgPSBbXSk7XG4gICAgZ2V0UmF3UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHBhZ2U7XG4gICAgfTtcbiAgICBnZXRDb250ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYWN0aW9uLCBhZGRDb250ZXh0LCBjb250ZXh0LCBfaSwgX2xlbiwgX3JlZjtcbiAgICAgIGNvbnRleHQgPSBbJ3ZpZXcnXTtcbiAgICAgIGlmIChpc1JlbW90ZSgpKSB7XG4gICAgICAgIGNvbnRleHQucHVzaChzaXRlKTtcbiAgICAgIH1cbiAgICAgIGFkZENvbnRleHQgPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgICAgIGlmICgoc2l0ZSAhPSBudWxsKSAmJiAhXy5pbmNsdWRlKGNvbnRleHQsIHNpdGUpKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQucHVzaChzaXRlKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIF9yZWYgPSBwYWdlLmpvdXJuYWwuc2xpY2UoMCkucmV2ZXJzZSgpO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGFjdGlvbiA9IF9yZWZbX2ldO1xuICAgICAgICBhZGRDb250ZXh0KGFjdGlvbi5zaXRlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjb250ZXh0O1xuICAgIH07XG4gICAgaXNQbHVnaW4gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBwYWdlLnBsdWdpbiAhPSBudWxsO1xuICAgIH07XG4gICAgaXNSZW1vdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAhKHNpdGUgPT09ICh2b2lkIDApIHx8IHNpdGUgPT09IG51bGwgfHwgc2l0ZSA9PT0gJ3ZpZXcnIHx8IHNpdGUgPT09ICdvcmlnaW4nIHx8IHNpdGUgPT09ICdsb2NhbCcpO1xuICAgIH07XG4gICAgaXNMb2NhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNpdGUgPT09ICdsb2NhbCc7XG4gICAgfTtcbiAgICBnZXRSZW1vdGVTaXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoaXNSZW1vdGUoKSkge1xuICAgICAgICByZXR1cm4gc2l0ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG4gICAgZ2V0U2x1ZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGFzU2x1ZyhwYWdlLnRpdGxlKTtcbiAgICB9O1xuICAgIGdldE5laWdoYm9ycyA9IGZ1bmN0aW9uKGhvc3QpIHtcbiAgICAgIHZhciBhY3Rpb24sIGl0ZW0sIG5laWdoYm9ycywgX2ksIF9qLCBfbGVuLCBfbGVuMSwgX3JlZiwgX3JlZjE7XG4gICAgICBuZWlnaGJvcnMgPSBbXTtcbiAgICAgIGlmIChpc1JlbW90ZSgpKSB7XG4gICAgICAgIG5laWdoYm9ycy5wdXNoKHNpdGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGhvc3QgIT0gbnVsbCkge1xuICAgICAgICAgIG5laWdoYm9ycy5wdXNoKGhvc3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfcmVmID0gcGFnZS5zdG9yeTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBpdGVtID0gX3JlZltfaV07XG4gICAgICAgIGlmIChpdGVtLnNpdGUgIT0gbnVsbCkge1xuICAgICAgICAgIG5laWdoYm9ycy5wdXNoKGl0ZW0uc2l0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIF9yZWYxID0gcGFnZS5qb3VybmFsO1xuICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gX3JlZjEubGVuZ3RoOyBfaiA8IF9sZW4xOyBfaisrKSB7XG4gICAgICAgIGFjdGlvbiA9IF9yZWYxW19qXTtcbiAgICAgICAgaWYgKGFjdGlvbi5zaXRlICE9IG51bGwpIHtcbiAgICAgICAgICBuZWlnaGJvcnMucHVzaChhY3Rpb24uc2l0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBfLnVuaXEobmVpZ2hib3JzKTtcbiAgICB9O1xuICAgIHNldFRpdGxlID0gZnVuY3Rpb24odGl0bGUpIHtcbiAgICAgIHJldHVybiBwYWdlLnRpdGxlID0gdGl0bGU7XG4gICAgfTtcbiAgICBhZGRJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuICAgICAgaXRlbSA9IF8uZXh0ZW5kKHt9LCB7XG4gICAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICB9LCBpdGVtKTtcbiAgICAgIHJldHVybiBwYWdlLnN0b3J5LnB1c2goaXRlbSk7XG4gICAgfTtcbiAgICBhZGRQYXJhZ3JhcGggPSBmdW5jdGlvbih0ZXh0KSB7XG4gICAgICB2YXIgdHlwZTtcbiAgICAgIHR5cGUgPSBcInBhcmFncmFwaFwiO1xuICAgICAgcmV0dXJuIGFkZEl0ZW0oe1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBnZXRSYXdQYWdlOiBnZXRSYXdQYWdlLFxuICAgICAgZ2V0Q29udGV4dDogZ2V0Q29udGV4dCxcbiAgICAgIGlzUGx1Z2luOiBpc1BsdWdpbixcbiAgICAgIGlzUmVtb3RlOiBpc1JlbW90ZSxcbiAgICAgIGlzTG9jYWw6IGlzTG9jYWwsXG4gICAgICBnZXRSZW1vdGVTaXRlOiBnZXRSZW1vdGVTaXRlLFxuICAgICAgZ2V0U2x1ZzogZ2V0U2x1ZyxcbiAgICAgIGdldE5laWdoYm9yczogZ2V0TmVpZ2hib3JzLFxuICAgICAgc2V0VGl0bGU6IHNldFRpdGxlLFxuICAgICAgYWRkSXRlbTogYWRkSXRlbSxcbiAgICAgIGFkZFBhcmFncmFwaDogYWRkUGFyYWdyYXBoXG4gICAgfTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBuZXdQYWdlOiBuZXdQYWdlLFxuICAgIGVtcHR5UGFnZTogZW1wdHlQYWdlXG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKXsvLyAgICAgVW5kZXJzY29yZS5qcyAxLjUuMlxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZXhwb3J0c2Agb24gdGhlIHNlcnZlci5cbiAgdmFyIHJvb3QgPSB0aGlzO1xuXG4gIC8vIFNhdmUgdGhlIHByZXZpb3VzIHZhbHVlIG9mIHRoZSBgX2AgdmFyaWFibGUuXG4gIHZhciBwcmV2aW91c1VuZGVyc2NvcmUgPSByb290Ll87XG5cbiAgLy8gRXN0YWJsaXNoIHRoZSBvYmplY3QgdGhhdCBnZXRzIHJldHVybmVkIHRvIGJyZWFrIG91dCBvZiBhIGxvb3AgaXRlcmF0aW9uLlxuICB2YXIgYnJlYWtlciA9IHt9O1xuXG4gIC8vIFNhdmUgYnl0ZXMgaW4gdGhlIG1pbmlmaWVkIChidXQgbm90IGd6aXBwZWQpIHZlcnNpb246XG4gIHZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlLCBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGUsIEZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuICAvLyBDcmVhdGUgcXVpY2sgcmVmZXJlbmNlIHZhcmlhYmxlcyBmb3Igc3BlZWQgYWNjZXNzIHRvIGNvcmUgcHJvdG90eXBlcy5cbiAgdmFyXG4gICAgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICBzbGljZSAgICAgICAgICAgID0gQXJyYXlQcm90by5zbGljZSxcbiAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgIGhhc093blByb3BlcnR5ICAgPSBPYmpQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuICAvLyBBbGwgKipFQ01BU2NyaXB0IDUqKiBuYXRpdmUgZnVuY3Rpb24gaW1wbGVtZW50YXRpb25zIHRoYXQgd2UgaG9wZSB0byB1c2VcbiAgLy8gYXJlIGRlY2xhcmVkIGhlcmUuXG4gIHZhclxuICAgIG5hdGl2ZUZvckVhY2ggICAgICA9IEFycmF5UHJvdG8uZm9yRWFjaCxcbiAgICBuYXRpdmVNYXAgICAgICAgICAgPSBBcnJheVByb3RvLm1hcCxcbiAgICBuYXRpdmVSZWR1Y2UgICAgICAgPSBBcnJheVByb3RvLnJlZHVjZSxcbiAgICBuYXRpdmVSZWR1Y2VSaWdodCAgPSBBcnJheVByb3RvLnJlZHVjZVJpZ2h0LFxuICAgIG5hdGl2ZUZpbHRlciAgICAgICA9IEFycmF5UHJvdG8uZmlsdGVyLFxuICAgIG5hdGl2ZUV2ZXJ5ICAgICAgICA9IEFycmF5UHJvdG8uZXZlcnksXG4gICAgbmF0aXZlU29tZSAgICAgICAgID0gQXJyYXlQcm90by5zb21lLFxuICAgIG5hdGl2ZUluZGV4T2YgICAgICA9IEFycmF5UHJvdG8uaW5kZXhPZixcbiAgICBuYXRpdmVMYXN0SW5kZXhPZiAgPSBBcnJheVByb3RvLmxhc3RJbmRleE9mLFxuICAgIG5hdGl2ZUlzQXJyYXkgICAgICA9IEFycmF5LmlzQXJyYXksXG4gICAgbmF0aXZlS2V5cyAgICAgICAgID0gT2JqZWN0LmtleXMsXG4gICAgbmF0aXZlQmluZCAgICAgICAgID0gRnVuY1Byb3RvLmJpbmQ7XG5cbiAgLy8gQ3JlYXRlIGEgc2FmZSByZWZlcmVuY2UgdG8gdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciB1c2UgYmVsb3cuXG4gIHZhciBfID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIF8pIHJldHVybiBvYmo7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIF8pKSByZXR1cm4gbmV3IF8ob2JqKTtcbiAgICB0aGlzLl93cmFwcGVkID0gb2JqO1xuICB9O1xuXG4gIC8vIEV4cG9ydCB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yICoqTm9kZS5qcyoqLCB3aXRoXG4gIC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5IGZvciB0aGUgb2xkIGByZXF1aXJlKClgIEFQSS4gSWYgd2UncmUgaW5cbiAgLy8gdGhlIGJyb3dzZXIsIGFkZCBgX2AgYXMgYSBnbG9iYWwgb2JqZWN0IHZpYSBhIHN0cmluZyBpZGVudGlmaWVyLFxuICAvLyBmb3IgQ2xvc3VyZSBDb21waWxlciBcImFkdmFuY2VkXCIgbW9kZS5cbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gXztcbiAgICB9XG4gICAgZXhwb3J0cy5fID0gXztcbiAgfSBlbHNlIHtcbiAgICByb290Ll8gPSBfO1xuICB9XG5cbiAgLy8gQ3VycmVudCB2ZXJzaW9uLlxuICBfLlZFUlNJT04gPSAnMS41LjInO1xuXG4gIC8vIENvbGxlY3Rpb24gRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVGhlIGNvcm5lcnN0b25lLCBhbiBgZWFjaGAgaW1wbGVtZW50YXRpb24sIGFrYSBgZm9yRWFjaGAuXG4gIC8vIEhhbmRsZXMgb2JqZWN0cyB3aXRoIHRoZSBidWlsdC1pbiBgZm9yRWFjaGAsIGFycmF5cywgYW5kIHJhdyBvYmplY3RzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZm9yRWFjaGAgaWYgYXZhaWxhYmxlLlxuICB2YXIgZWFjaCA9IF8uZWFjaCA9IF8uZm9yRWFjaCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybjtcbiAgICBpZiAobmF0aXZlRm9yRWFjaCAmJiBvYmouZm9yRWFjaCA9PT0gbmF0aXZlRm9yRWFjaCkge1xuICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBvYmoubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5c1tpXV0sIGtleXNbaV0sIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0cy5wdXNoKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHMucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gdm9pZCAwIDogW107XG4gICAgcmV0dXJuIF9bZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10ob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSB2YWx1ZVtrZXldKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLndoZXJlKG9iaiwgYXR0cnMsIHRydWUpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlIFtXZWJLaXQgQnVnIDgwNzk3XShodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTcpXG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID4gcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IEluZmluaXR5LCB2YWx1ZTogSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA8IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXksIHVzaW5nIHRoZSBtb2Rlcm4gdmVyc2lvbiBvZiB0aGUgXG4gIC8vIFtGaXNoZXItWWF0ZXMgc2h1ZmZsZV0oaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GaXNoZXLigJNZYXRlc19zaHVmZmxlKS5cbiAgXy5zaHVmZmxlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJhbmQ7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJhbmQgPSBfLnJhbmRvbShpbmRleCsrKTtcbiAgICAgIHNodWZmbGVkW2luZGV4IC0gMV0gPSBzaHVmZmxlZFtyYW5kXTtcbiAgICAgIHNodWZmbGVkW3JhbmRdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xuICB9O1xuXG4gIC8vIFNhbXBsZSAqKm4qKiByYW5kb20gdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIC8vIElmICoqbioqIGlzIG5vdCBzcGVjaWZpZWQsIHJldHVybnMgYSBzaW5nbGUgcmFuZG9tIGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gIC8vIFRoZSBpbnRlcm5hbCBgZ3VhcmRgIGFyZ3VtZW50IGFsbG93cyBpdCB0byB3b3JrIHdpdGggYG1hcGAuXG4gIF8uc2FtcGxlID0gZnVuY3Rpb24ob2JqLCBuLCBndWFyZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMiB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIG9ialtfLnJhbmRvbShvYmoubGVuZ3RoIC0gMSldO1xuICAgIH1cbiAgICByZXR1cm4gXy5zaHVmZmxlKG9iaikuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbikpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGxvb2t1cCBpdGVyYXRvcnMuXG4gIHZhciBsb29rdXBJdGVyYXRvciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZSA6IGZ1bmN0aW9uKG9iail7IHJldHVybiBvYmpbdmFsdWVdOyB9O1xuICB9O1xuXG4gIC8vIFNvcnQgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiBwcm9kdWNlZCBieSBhbiBpdGVyYXRvci5cbiAgXy5zb3J0QnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gbG9va3VwSXRlcmF0b3IodmFsdWUpO1xuICAgIHJldHVybiBfLnBsdWNrKF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWE6IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KVxuICAgICAgfTtcbiAgICB9KS5zb3J0KGZ1bmN0aW9uKGxlZnQsIHJpZ2h0KSB7XG4gICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWE7XG4gICAgICB2YXIgYiA9IHJpZ2h0LmNyaXRlcmlhO1xuICAgICAgaWYgKGEgIT09IGIpIHtcbiAgICAgICAgaWYgKGEgPiBiIHx8IGEgPT09IHZvaWQgMCkgcmV0dXJuIDE7XG4gICAgICAgIGlmIChhIDwgYiB8fCBiID09PSB2b2lkIDApIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsZWZ0LmluZGV4IC0gcmlnaHQuaW5kZXg7XG4gICAgfSksICd2YWx1ZScpO1xuICB9O1xuXG4gIC8vIEFuIGludGVybmFsIGZ1bmN0aW9uIHVzZWQgZm9yIGFnZ3JlZ2F0ZSBcImdyb3VwIGJ5XCIgb3BlcmF0aW9ucy5cbiAgdmFyIGdyb3VwID0gZnVuY3Rpb24oYmVoYXZpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgdmFyIGl0ZXJhdG9yID0gdmFsdWUgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgICAgYmVoYXZpb3IocmVzdWx0LCBrZXksIHZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEdyb3VwcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLiBQYXNzIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGVcbiAgLy8gdG8gZ3JvdXAgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjcml0ZXJpb24uXG4gIF8uZ3JvdXBCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gIH0pO1xuXG4gIC8vIEluZGV4ZXMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbiwgc2ltaWxhciB0byBgZ3JvdXBCeWAsIGJ1dCBmb3JcbiAgLy8gd2hlbiB5b3Uga25vdyB0aGF0IHlvdXIgaW5kZXggdmFsdWVzIHdpbGwgYmUgdW5pcXVlLlxuICBfLmluZGV4QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICByZXN1bHRba2V5XSA9IHZhbHVlO1xuICB9KTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICBfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSsrIDogcmVzdWx0W2tleV0gPSAxO1xuICB9KTtcblxuICAvLyBVc2UgYSBjb21wYXJhdG9yIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgdGhlIHNtYWxsZXN0IGluZGV4IGF0IHdoaWNoXG4gIC8vIGFuIG9iamVjdCBzaG91bGQgYmUgaW5zZXJ0ZWQgc28gYXMgdG8gbWFpbnRhaW4gb3JkZXIuIFVzZXMgYmluYXJ5IHNlYXJjaC5cbiAgXy5zb3J0ZWRJbmRleCA9IGZ1bmN0aW9uKGFycmF5LCBvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaXRlcmF0b3IgPSBpdGVyYXRvciA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKGl0ZXJhdG9yKTtcbiAgICB2YXIgdmFsdWUgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9iaik7XG4gICAgdmFyIGxvdyA9IDAsIGhpZ2ggPSBhcnJheS5sZW5ndGg7XG4gICAgd2hpbGUgKGxvdyA8IGhpZ2gpIHtcbiAgICAgIHZhciBtaWQgPSAobG93ICsgaGlnaCkgPj4+IDE7XG4gICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGFycmF5W21pZF0pIDwgdmFsdWUgPyBsb3cgPSBtaWQgKyAxIDogaGlnaCA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvdztcbiAgfTtcblxuICAvLyBTYWZlbHkgY3JlYXRlIGEgcmVhbCwgbGl2ZSBhcnJheSBmcm9tIGFueXRoaW5nIGl0ZXJhYmxlLlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiA9PSBudWxsKSB8fCBndWFyZCA/IGFycmF5WzBdIDogc2xpY2UuY2FsbChhcnJheSwgMCwgbik7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQpIHtcbiAgICAgIHJldHVybiBhcnJheVthcnJheS5sZW5ndGggLSAxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgZmlyc3QgZW50cnkgb2YgdGhlIGFycmF5LiBBbGlhc2VkIGFzIGB0YWlsYCBhbmQgYGRyb3BgLlxuICAvLyBFc3BlY2lhbGx5IHVzZWZ1bCBvbiB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyBhbiAqKm4qKiB3aWxsIHJldHVyblxuICAvLyB0aGUgcmVzdCBOIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKipcbiAgLy8gY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLnJlc3QgPSBfLnRhaWwgPSBfLmRyb3AgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbik7XG4gIH07XG5cbiAgLy8gVHJpbSBvdXQgYWxsIGZhbHN5IHZhbHVlcyBmcm9tIGFuIGFycmF5LlxuICBfLmNvbXBhY3QgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgXy5pZGVudGl0eSk7XG4gIH07XG5cbiAgLy8gSW50ZXJuYWwgaW1wbGVtZW50YXRpb24gb2YgYSByZWN1cnNpdmUgYGZsYXR0ZW5gIGZ1bmN0aW9uLlxuICB2YXIgZmxhdHRlbiA9IGZ1bmN0aW9uKGlucHV0LCBzaGFsbG93LCBvdXRwdXQpIHtcbiAgICBpZiAoc2hhbGxvdyAmJiBfLmV2ZXJ5KGlucHV0LCBfLmlzQXJyYXkpKSB7XG4gICAgICByZXR1cm4gY29uY2F0LmFwcGx5KG91dHB1dCwgaW5wdXQpO1xuICAgIH1cbiAgICBlYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgfHwgXy5pc0FyZ3VtZW50cyh2YWx1ZSkpIHtcbiAgICAgICAgc2hhbGxvdyA/IHB1c2guYXBwbHkob3V0cHV0LCB2YWx1ZSkgOiBmbGF0dGVuKHZhbHVlLCBzaGFsbG93LCBvdXRwdXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgLy8gRmxhdHRlbiBvdXQgYW4gYXJyYXksIGVpdGhlciByZWN1cnNpdmVseSAoYnkgZGVmYXVsdCksIG9yIGp1c3Qgb25lIGxldmVsLlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShfLmZsYXR0ZW4oYXJndW1lbnRzLCB0cnVlKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmd1bWVudHMsIFwibGVuZ3RoXCIpLmNvbmNhdCgwKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmd1bWVudHMsICcnICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIGlzU29ydGVkKSA6IGlzU29ydGVkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBfLnNvcnRlZEluZGV4KGFycmF5LCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGFycmF5W2ldID09PSBpdGVtID8gaSA6IC0xO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBhcnJheS5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gYXJyYXkuaW5kZXhPZihpdGVtLCBpc1NvcnRlZCk7XG4gICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbmd0aCA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbmd0aCkge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldXNhYmxlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciBwcm90b3R5cGUgc2V0dGluZy5cbiAgdmFyIGN0b3IgPSBmdW5jdGlvbigpe307XG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgdmFyIGFyZ3MsIGJvdW5kO1xuICAgIGlmIChuYXRpdmVCaW5kICYmIGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBpZiAoIV8uaXNGdW5jdGlvbihmdW5jKSkgdGhyb3cgbmV3IFR5cGVFcnJvcjtcbiAgICBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBib3VuZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSkgcmV0dXJuIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBjdG9yLnByb3RvdHlwZSA9IGZ1bmMucHJvdG90eXBlO1xuICAgICAgdmFyIHNlbGYgPSBuZXcgY3RvcjtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gbnVsbDtcbiAgICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHNlbGYsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgaWYgKE9iamVjdChyZXN1bHQpID09PSByZXN1bHQpIHJldHVybiByZXN1bHQ7XG4gICAgICByZXR1cm4gc2VsZjtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcihcImJpbmRBbGwgbXVzdCBiZSBwYXNzZWQgZnVuY3Rpb24gbmFtZXNcIik7XG4gICAgZWFjaChmdW5jcywgZnVuY3Rpb24oZikgeyBvYmpbZl0gPSBfLmJpbmQob2JqW2ZdLCBvYmopOyB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIE1lbW9pemUgYW4gZXhwZW5zaXZlIGZ1bmN0aW9uIGJ5IHN0b3JpbmcgaXRzIHJlc3VsdHMuXG4gIF8ubWVtb2l6ZSA9IGZ1bmN0aW9uKGZ1bmMsIGhhc2hlcikge1xuICAgIHZhciBtZW1vID0ge307XG4gICAgaGFzaGVyIHx8IChoYXNoZXIgPSBfLmlkZW50aXR5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5ID0gaGFzaGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gXy5oYXMobWVtbywga2V5KSA/IG1lbW9ba2V5XSA6IChtZW1vW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gRGVsYXlzIGEgZnVuY3Rpb24gZm9yIHRoZSBnaXZlbiBudW1iZXIgb2YgbWlsbGlzZWNvbmRzLCBhbmQgdGhlbiBjYWxsc1xuICAvLyBpdCB3aXRoIHRoZSBhcmd1bWVudHMgc3VwcGxpZWQuXG4gIF8uZGVsYXkgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKXsgcmV0dXJuIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7IH0sIHdhaXQpO1xuICB9O1xuXG4gIC8vIERlZmVycyBhIGZ1bmN0aW9uLCBzY2hlZHVsaW5nIGl0IHRvIHJ1biBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhc1xuICAvLyBjbGVhcmVkLlxuICBfLmRlZmVyID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHJldHVybiBfLmRlbGF5LmFwcGx5KF8sIFtmdW5jLCAxXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCB3aGVuIGludm9rZWQsIHdpbGwgb25seSBiZSB0cmlnZ2VyZWQgYXQgbW9zdCBvbmNlXG4gIC8vIGR1cmluZyBhIGdpdmVuIHdpbmRvdyBvZiB0aW1lLiBOb3JtYWxseSwgdGhlIHRocm90dGxlZCBmdW5jdGlvbiB3aWxsIHJ1blxuICAvLyBhcyBtdWNoIGFzIGl0IGNhbiwgd2l0aG91dCBldmVyIGdvaW5nIG1vcmUgdGhhbiBvbmNlIHBlciBgd2FpdGAgZHVyYXRpb247XG4gIC8vIGJ1dCBpZiB5b3UnZCBsaWtlIHRvIGRpc2FibGUgdGhlIGV4ZWN1dGlvbiBvbiB0aGUgbGVhZGluZyBlZGdlLCBwYXNzXG4gIC8vIGB7bGVhZGluZzogZmFsc2V9YC4gVG8gZGlzYWJsZSBleGVjdXRpb24gb24gdGhlIHRyYWlsaW5nIGVkZ2UsIGRpdHRvLlxuICBfLnRocm90dGxlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgdmFyIHRpbWVvdXQgPSBudWxsO1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICBpZiAocmVtYWluaW5nIDw9IDApIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAgLy8gYmUgdHJpZ2dlcmVkLiBUaGUgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgaXQgc3RvcHMgYmVpbmcgY2FsbGVkIGZvclxuICAvLyBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAgLy8gbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAgXy5kZWJvdW5jZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSkge1xuICAgIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBsYXN0ID0gKG5ldyBEYXRlKCkpIC0gdGltZXN0YW1wO1xuICAgICAgICBpZiAobGFzdCA8IHdhaXQpIHtcbiAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHZhbHVlcyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXSA9IG9ialtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfTtcblxuICAvLyBDb252ZXJ0IGFuIG9iamVjdCBpbnRvIGEgbGlzdCBvZiBgW2tleSwgdmFsdWVdYCBwYWlycy5cbiAgXy5wYWlycyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBwYWlycyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHBhaXJzW2ldID0gW2tleXNbaV0sIG9ialtrZXlzW2ldXV07XG4gICAgfVxuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBrZXlzID0gXy5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdFtvYmpba2V5c1tpXV1dID0ga2V5c1tpXTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PT0gdm9pZCAwKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIFtIYXJtb255IGBlZ2FsYCBwcm9wb3NhbF0oaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9aGFybW9ueTplZ2FsKS5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gT2JqZWN0cyB3aXRoIGRpZmZlcmVudCBjb25zdHJ1Y3RvcnMgYXJlIG5vdCBlcXVpdmFsZW50LCBidXQgYE9iamVjdGBzXG4gICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgaWYgKGFDdG9yICE9PSBiQ3RvciAmJiAhKF8uaXNGdW5jdGlvbihhQ3RvcikgJiYgKGFDdG9yIGluc3RhbmNlb2YgYUN0b3IpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBBZGQgdGhlIGZpcnN0IG9iamVjdCB0byB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnB1c2goYSk7XG4gICAgYlN0YWNrLnB1c2goYik7XG4gICAgdmFyIHNpemUgPSAwLCByZXN1bHQgPSB0cnVlO1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbXBhcmUgb2JqZWN0cyBhbmQgYXJyYXlzLlxuICAgIGlmIChjbGFzc05hbWUgPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgLy8gQ29tcGFyZSBhcnJheSBsZW5ndGhzIHRvIGRldGVybWluZSBpZiBhIGRlZXAgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkuXG4gICAgICBzaXplID0gYS5sZW5ndGg7XG4gICAgICByZXN1bHQgPSBzaXplID09IGIubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAvLyBEZWVwIGNvbXBhcmUgdGhlIGNvbnRlbnRzLCBpZ25vcmluZyBub24tbnVtZXJpYyBwcm9wZXJ0aWVzLlxuICAgICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gZXEoYVtzaXplXSwgYltzaXplXSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KE1hdGgubWF4KDAsIG4pKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgYWNjdW1baV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIGkpO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmNsdXNpdmUpLlxuICBfLnJhbmRvbSA9IGZ1bmN0aW9uKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PSBudWxsKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbWluICsgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKTtcbiAgfTtcblxuICAvLyBMaXN0IG9mIEhUTUwgZW50aXRpZXMgZm9yIGVzY2FwaW5nLlxuICB2YXIgZW50aXR5TWFwID0ge1xuICAgIGVzY2FwZToge1xuICAgICAgJyYnOiAnJmFtcDsnLFxuICAgICAgJzwnOiAnJmx0OycsXG4gICAgICAnPic6ICcmZ3Q7JyxcbiAgICAgICdcIic6ICcmcXVvdDsnLFxuICAgICAgXCInXCI6ICcmI3gyNzsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIGBwcm9wZXJ0eWAgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdCB3aXRoIHRoZVxuICAvLyBgb2JqZWN0YCBhcyBjb250ZXh0OyBvdGhlcndpc2UsIHJldHVybiBpdC5cbiAgXy5yZXN1bHQgPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgaWYgKG9iamVjdCA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHZhciBmdW5jID0gX1tuYW1lXSA9IG9ialtuYW1lXTtcbiAgICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdzID0gW3RoaXMuX3dyYXBwZWRdO1xuICAgICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBmdW5jLmFwcGx5KF8sIGFyZ3MpKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW50ZWdlciBpZCAodW5pcXVlIHdpdGhpbiB0aGUgZW50aXJlIGNsaWVudCBzZXNzaW9uKS5cbiAgLy8gVXNlZnVsIGZvciB0ZW1wb3JhcnkgRE9NIGlkcy5cbiAgdmFyIGlkQ291bnRlciA9IDA7XG4gIF8udW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXgpIHtcbiAgICB2YXIgaWQgPSArK2lkQ291bnRlciArICcnO1xuICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBpZCA6IGlkO1xuICB9O1xuXG4gIC8vIEJ5IGRlZmF1bHQsIFVuZGVyc2NvcmUgdXNlcyBFUkItc3R5bGUgdGVtcGxhdGUgZGVsaW1pdGVycywgY2hhbmdlIHRoZVxuICAvLyBmb2xsb3dpbmcgdGVtcGxhdGUgc2V0dGluZ3MgdG8gdXNlIGFsdGVybmF0aXZlIGRlbGltaXRlcnMuXG4gIF8udGVtcGxhdGVTZXR0aW5ncyA9IHtcbiAgICBldmFsdWF0ZSAgICA6IC88JShbXFxzXFxTXSs/KSU+L2csXG4gICAgaW50ZXJwb2xhdGUgOiAvPCU9KFtcXHNcXFNdKz8pJT4vZyxcbiAgICBlc2NhcGUgICAgICA6IC88JS0oW1xcc1xcU10rPyklPi9nXG4gIH07XG5cbiAgLy8gV2hlbiBjdXN0b21pemluZyBgdGVtcGxhdGVTZXR0aW5nc2AsIGlmIHlvdSBkb24ndCB3YW50IHRvIGRlZmluZSBhblxuICAvLyBpbnRlcnBvbGF0aW9uLCBldmFsdWF0aW9uIG9yIGVzY2FwaW5nIHJlZ2V4LCB3ZSBuZWVkIG9uZSB0aGF0IGlzXG4gIC8vIGd1YXJhbnRlZWQgbm90IHRvIG1hdGNoLlxuICB2YXIgbm9NYXRjaCA9IC8oLileLztcblxuICAvLyBDZXJ0YWluIGNoYXJhY3RlcnMgbmVlZCB0byBiZSBlc2NhcGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgcHV0IGludG8gYVxuICAvLyBzdHJpbmcgbGl0ZXJhbC5cbiAgdmFyIGVzY2FwZXMgPSB7XG4gICAgXCInXCI6ICAgICAgXCInXCIsXG4gICAgJ1xcXFwnOiAgICAgJ1xcXFwnLFxuICAgICdcXHInOiAgICAgJ3InLFxuICAgICdcXG4nOiAgICAgJ24nLFxuICAgICdcXHQnOiAgICAgJ3QnLFxuICAgICdcXHUyMDI4JzogJ3UyMDI4JyxcbiAgICAnXFx1MjAyOSc6ICd1MjAyOSdcbiAgfTtcblxuICB2YXIgZXNjYXBlciA9IC9cXFxcfCd8XFxyfFxcbnxcXHR8XFx1MjAyOHxcXHUyMDI5L2c7XG5cbiAgLy8gSmF2YVNjcmlwdCBtaWNyby10ZW1wbGF0aW5nLCBzaW1pbGFyIHRvIEpvaG4gUmVzaWcncyBpbXBsZW1lbnRhdGlvbi5cbiAgLy8gVW5kZXJzY29yZSB0ZW1wbGF0aW5nIGhhbmRsZXMgYXJiaXRyYXJ5IGRlbGltaXRlcnMsIHByZXNlcnZlcyB3aGl0ZXNwYWNlLFxuICAvLyBhbmQgY29ycmVjdGx5IGVzY2FwZXMgcXVvdGVzIHdpdGhpbiBpbnRlcnBvbGF0ZWQgY29kZS5cbiAgXy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRleHQsIGRhdGEsIHNldHRpbmdzKSB7XG4gICAgdmFyIHJlbmRlcjtcbiAgICBzZXR0aW5ncyA9IF8uZGVmYXVsdHMoe30sIHNldHRpbmdzLCBfLnRlbXBsYXRlU2V0dGluZ3MpO1xuXG4gICAgLy8gQ29tYmluZSBkZWxpbWl0ZXJzIGludG8gb25lIHJlZ3VsYXIgZXhwcmVzc2lvbiB2aWEgYWx0ZXJuYXRpb24uXG4gICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKFtcbiAgICAgIChzZXR0aW5ncy5lc2NhcGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmludGVycG9sYXRlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5ldmFsdWF0ZSB8fCBub01hdGNoKS5zb3VyY2VcbiAgICBdLmpvaW4oJ3wnKSArICd8JCcsICdnJyk7XG5cbiAgICAvLyBDb21waWxlIHRoZSB0ZW1wbGF0ZSBzb3VyY2UsIGVzY2FwaW5nIHN0cmluZyBsaXRlcmFscyBhcHByb3ByaWF0ZWx5LlxuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNvdXJjZSA9IFwiX19wKz0nXCI7XG4gICAgdGV4dC5yZXBsYWNlKG1hdGNoZXIsIGZ1bmN0aW9uKG1hdGNoLCBlc2NhcGUsIGludGVycG9sYXRlLCBldmFsdWF0ZSwgb2Zmc2V0KSB7XG4gICAgICBzb3VyY2UgKz0gdGV4dC5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgICAgICAucmVwbGFjZShlc2NhcGVyLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gJ1xcXFwnICsgZXNjYXBlc1ttYXRjaF07IH0pO1xuXG4gICAgICBpZiAoZXNjYXBlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgZXNjYXBlICsgXCIpKT09bnVsbD8nJzpfLmVzY2FwZShfX3QpKStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoaW50ZXJwb2xhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBpbnRlcnBvbGF0ZSArIFwiKSk9PW51bGw/Jyc6X190KStcXG4nXCI7XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJztcXG5cIiArIGV2YWx1YXRlICsgXCJcXG5fX3ArPSdcIjtcbiAgICAgIH1cbiAgICAgIGluZGV4ID0gb2Zmc2V0ICsgbWF0Y2gubGVuZ3RoO1xuICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH0pO1xuICAgIHNvdXJjZSArPSBcIic7XFxuXCI7XG5cbiAgICAvLyBJZiBhIHZhcmlhYmxlIGlzIG5vdCBzcGVjaWZpZWQsIHBsYWNlIGRhdGEgdmFsdWVzIGluIGxvY2FsIHNjb3BlLlxuICAgIGlmICghc2V0dGluZ3MudmFyaWFibGUpIHNvdXJjZSA9ICd3aXRoKG9ianx8e30pe1xcbicgKyBzb3VyY2UgKyAnfVxcbic7XG5cbiAgICBzb3VyY2UgPSBcInZhciBfX3QsX19wPScnLF9faj1BcnJheS5wcm90b3R5cGUuam9pbixcIiArXG4gICAgICBcInByaW50PWZ1bmN0aW9uKCl7X19wKz1fX2ouY2FsbChhcmd1bWVudHMsJycpO307XFxuXCIgK1xuICAgICAgc291cmNlICsgXCJyZXR1cm4gX19wO1xcblwiO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJlbmRlciA9IG5ldyBGdW5jdGlvbihzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJywgJ18nLCBzb3VyY2UpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGUuc291cmNlID0gc291cmNlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICBpZiAoZGF0YSkgcmV0dXJuIHJlbmRlcihkYXRhLCBfKTtcbiAgICB2YXIgdGVtcGxhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZXR1cm4gcmVuZGVyLmNhbGwodGhpcywgZGF0YSwgXyk7XG4gICAgfTtcblxuICAgIC8vIFByb3ZpZGUgdGhlIGNvbXBpbGVkIGZ1bmN0aW9uIHNvdXJjZSBhcyBhIGNvbnZlbmllbmNlIGZvciBwcmVjb21waWxhdGlvbi5cbiAgICB0ZW1wbGF0ZS5zb3VyY2UgPSAnZnVuY3Rpb24oJyArIChzZXR0aW5ncy52YXJpYWJsZSB8fCAnb2JqJykgKyAnKXtcXG4nICsgc291cmNlICsgJ30nO1xuXG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9O1xuXG4gIC8vIEFkZCBhIFwiY2hhaW5cIiBmdW5jdGlvbiwgd2hpY2ggd2lsbCBkZWxlZ2F0ZSB0byB0aGUgd3JhcHBlci5cbiAgXy5jaGFpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfKG9iaikuY2hhaW4oKTtcbiAgfTtcblxuICAvLyBPT1BcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG4gIC8vIElmIFVuZGVyc2NvcmUgaXMgY2FsbGVkIGFzIGEgZnVuY3Rpb24sIGl0IHJldHVybnMgYSB3cmFwcGVkIG9iamVjdCB0aGF0XG4gIC8vIGNhbiBiZSB1c2VkIE9PLXN0eWxlLiBUaGlzIHdyYXBwZXIgaG9sZHMgYWx0ZXJlZCB2ZXJzaW9ucyBvZiBhbGwgdGhlXG4gIC8vIHVuZGVyc2NvcmUgZnVuY3Rpb25zLiBXcmFwcGVkIG9iamVjdHMgbWF5IGJlIGNoYWluZWQuXG5cbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnRpbnVlIGNoYWluaW5nIGludGVybWVkaWF0ZSByZXN1bHRzLlxuICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoYWluID8gXyhvYmopLmNoYWluKCkgOiBvYmo7XG4gIH07XG5cbiAgLy8gQWRkIGFsbCBvZiB0aGUgVW5kZXJzY29yZSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIgb2JqZWN0LlxuICBfLm1peGluKF8pO1xuXG4gIC8vIEFkZCBhbGwgbXV0YXRvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydwb3AnLCAncHVzaCcsICdyZXZlcnNlJywgJ3NoaWZ0JywgJ3NvcnQnLCAnc3BsaWNlJywgJ3Vuc2hpZnQnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgb2JqID0gdGhpcy5fd3JhcHBlZDtcbiAgICAgIG1ldGhvZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICBpZiAoKG5hbWUgPT0gJ3NoaWZ0JyB8fCBuYW1lID09ICdzcGxpY2UnKSAmJiBvYmoubGVuZ3RoID09PSAwKSBkZWxldGUgb2JqWzBdO1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG9iaik7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gQWRkIGFsbCBhY2Nlc3NvciBBcnJheSBmdW5jdGlvbnMgdG8gdGhlIHdyYXBwZXIuXG4gIGVhY2goWydjb25jYXQnLCAnam9pbicsICdzbGljZSddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBtZXRob2QuYXBwbHkodGhpcy5fd3JhcHBlZCwgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfSk7XG5cbiAgXy5leHRlbmQoXy5wcm90b3R5cGUsIHtcblxuICAgIC8vIFN0YXJ0IGNoYWluaW5nIGEgd3JhcHBlZCBVbmRlcnNjb3JlIG9iamVjdC5cbiAgICBjaGFpbjogZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLl9jaGFpbiA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLy8gRXh0cmFjdHMgdGhlIHJlc3VsdCBmcm9tIGEgd3JhcHBlZCBhbmQgY2hhaW5lZCBvYmplY3QuXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX3dyYXBwZWQ7XG4gICAgfVxuXG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuXG59KSgpIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBjcmVhdGVTZWFyY2gsIGVtcHR5UGFnZSwgdXRpbCwgd2lraTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIGFjdGl2ZSA9IHJlcXVpcmUoJy4vYWN0aXZlJyk7XG5cbiAgZW1wdHlQYWdlID0gcmVxdWlyZSgnLi9wYWdlJykuZW1wdHlQYWdlO1xuXG4gIGNyZWF0ZVNlYXJjaCA9IGZ1bmN0aW9uKF9hcmcpIHtcbiAgICB2YXIgbmVpZ2hib3Job29kLCBwZXJmb3JtU2VhcmNoO1xuICAgIG5laWdoYm9yaG9vZCA9IF9hcmcubmVpZ2hib3Job29kO1xuICAgIHBlcmZvcm1TZWFyY2ggPSBmdW5jdGlvbihzZWFyY2hRdWVyeSkge1xuICAgICAgdmFyICRyZXN1bHRQYWdlLCByZXN1bHQsIHJlc3VsdFBhZ2UsIHNlYXJjaFJlc3VsdHMsIHRhbGx5LCBfaSwgX2xlbiwgX3JlZjtcbiAgICAgIHNlYXJjaFJlc3VsdHMgPSBuZWlnaGJvcmhvb2Quc2VhcmNoKHNlYXJjaFF1ZXJ5KTtcbiAgICAgIHRhbGx5ID0gc2VhcmNoUmVzdWx0cy50YWxseTtcbiAgICAgIHJlc3VsdFBhZ2UgPSBlbXB0eVBhZ2UoKTtcbiAgICAgIHJlc3VsdFBhZ2Uuc2V0VGl0bGUoXCJTZWFyY2ggZm9yICdcIiArIHNlYXJjaFF1ZXJ5ICsgXCInXCIpO1xuICAgICAgcmVzdWx0UGFnZS5hZGRQYXJhZ3JhcGgoXCJTdHJpbmcgJ1wiICsgc2VhcmNoUXVlcnkgKyBcIicgZm91bmQgb24gXCIgKyAodGFsbHkuZmluZHMgfHwgJ25vbmUnKSArIFwiIG9mIFwiICsgKHRhbGx5LnBhZ2VzIHx8ICdubycpICsgXCIgcGFnZXMgZnJvbSBcIiArICh0YWxseS5zaXRlcyB8fCAnbm8nKSArIFwiIHNpdGVzLlxcblRleHQgbWF0Y2hlZCBvbiBcIiArICh0YWxseS50aXRsZSB8fCAnbm8nKSArIFwiIHRpdGxlcywgXCIgKyAodGFsbHkudGV4dCB8fCAnbm8nKSArIFwiIHBhcmFncmFwaHMsIGFuZCBcIiArICh0YWxseS5zbHVnIHx8ICdubycpICsgXCIgc2x1Z3MuXFxuRWxhcHNlZCB0aW1lIFwiICsgdGFsbHkubXNlYyArIFwiIG1pbGxpc2Vjb25kcy5cIik7XG4gICAgICBfcmVmID0gc2VhcmNoUmVzdWx0cy5maW5kcztcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICByZXN1bHQgPSBfcmVmW19pXTtcbiAgICAgICAgcmVzdWx0UGFnZS5hZGRJdGVtKHtcbiAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIixcbiAgICAgICAgICBcInNpdGVcIjogcmVzdWx0LnNpdGUsXG4gICAgICAgICAgXCJzbHVnXCI6IHJlc3VsdC5wYWdlLnNsdWcsXG4gICAgICAgICAgXCJ0aXRsZVwiOiByZXN1bHQucGFnZS50aXRsZSxcbiAgICAgICAgICBcInRleHRcIjogcmVzdWx0LnBhZ2Uuc3lub3BzaXMgfHwgJydcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAkcmVzdWx0UGFnZSA9IHdpa2kuY3JlYXRlUGFnZShyZXN1bHRQYWdlLmdldFNsdWcoKSkuYWRkQ2xhc3MoJ2dob3N0Jyk7XG4gICAgICAkcmVzdWx0UGFnZS5hcHBlbmRUbygkKCcubWFpbicpKTtcbiAgICAgIHdpa2kuYnVpbGRQYWdlKHJlc3VsdFBhZ2UsICRyZXN1bHRQYWdlKTtcbiAgICAgIHJldHVybiBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKTtcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICBwZXJmb3JtU2VhcmNoOiBwZXJmb3JtU2VhcmNoXG4gICAgfTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVNlYXJjaDtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFjdGl2ZSwgY3JlYXRlU2VhcmNoLCBuZWlnaGJvcmhvb2QsIG5leHRBdmFpbGFibGVGZXRjaCwgbmV4dEZldGNoSW50ZXJ2YWwsIHBvcHVsYXRlU2l0ZUluZm9Gb3IsIHV0aWwsIHdpa2ksIF8sXG4gICAgX19oYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHk7XG5cbiAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgYWN0aXZlID0gcmVxdWlyZSgnLi9hY3RpdmUnKTtcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgY3JlYXRlU2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2gnKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IG5laWdoYm9yaG9vZCA9IHt9O1xuXG4gIGlmICh3aWtpLm5laWdoYm9yaG9vZCA9PSBudWxsKSB7XG4gICAgd2lraS5uZWlnaGJvcmhvb2QgPSB7fTtcbiAgfVxuXG4gIG5leHRBdmFpbGFibGVGZXRjaCA9IDA7XG5cbiAgbmV4dEZldGNoSW50ZXJ2YWwgPSAyMDAwO1xuXG4gIHBvcHVsYXRlU2l0ZUluZm9Gb3IgPSBmdW5jdGlvbihzaXRlLCBuZWlnaGJvckluZm8pIHtcbiAgICB2YXIgZmV0Y2hNYXAsIG5vdywgdHJhbnNpdGlvbjtcbiAgICBpZiAobmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSB0cnVlO1xuICAgIHRyYW5zaXRpb24gPSBmdW5jdGlvbihzaXRlLCBmcm9tLCB0bykge1xuICAgICAgcmV0dXJuICQoXCIubmVpZ2hib3JbZGF0YS1zaXRlPVxcXCJcIiArIHNpdGUgKyBcIlxcXCJdXCIpLmZpbmQoJ2RpdicpLnJlbW92ZUNsYXNzKGZyb20pLmFkZENsYXNzKHRvKTtcbiAgICB9O1xuICAgIGZldGNoTWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVxdWVzdCwgc2l0ZW1hcFVybDtcbiAgICAgIHNpdGVtYXBVcmwgPSBcImh0dHA6Ly9cIiArIHNpdGUgKyBcIi9zeXN0ZW0vc2l0ZW1hcC5qc29uXCI7XG4gICAgICB0cmFuc2l0aW9uKHNpdGUsICd3YWl0JywgJ2ZldGNoJyk7XG4gICAgICByZXF1ZXN0ID0gJC5hamF4KHtcbiAgICAgICAgdHlwZTogJ0dFVCcsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIHVybDogc2l0ZW1hcFVybFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVxdWVzdC5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZWlnaGJvckluZm8uc2l0ZW1hcFJlcXVlc3RJbmZsaWdodCA9IGZhbHNlO1xuICAgICAgfSkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIG5laWdoYm9ySW5mby5zaXRlbWFwID0gZGF0YTtcbiAgICAgICAgdHJhbnNpdGlvbihzaXRlLCAnZmV0Y2gnLCAnZG9uZScpO1xuICAgICAgICByZXR1cm4gJCgnYm9keScpLnRyaWdnZXIoJ25ldy1uZWlnaGJvci1kb25lJywgc2l0ZSk7XG4gICAgICB9KS5mYWlsKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24oc2l0ZSwgJ2ZldGNoJywgJ2ZhaWwnKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93ID4gbmV4dEF2YWlsYWJsZUZldGNoKSB7XG4gICAgICBuZXh0QXZhaWxhYmxlRmV0Y2ggPSBub3cgKyBuZXh0RmV0Y2hJbnRlcnZhbDtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZldGNoTWFwLCAxMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRUaW1lb3V0KGZldGNoTWFwLCBuZXh0QXZhaWxhYmxlRmV0Y2ggLSBub3cpO1xuICAgICAgcmV0dXJuIG5leHRBdmFpbGFibGVGZXRjaCArPSBuZXh0RmV0Y2hJbnRlcnZhbDtcbiAgICB9XG4gIH07XG5cbiAgd2lraS5yZWdpc3Rlck5laWdoYm9yID0gbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgdmFyIG5laWdoYm9ySW5mbztcbiAgICBpZiAod2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBuZWlnaGJvckluZm8gPSB7fTtcbiAgICB3aWtpLm5laWdoYm9yaG9vZFtzaXRlXSA9IG5laWdoYm9ySW5mbztcbiAgICBwb3B1bGF0ZVNpdGVJbmZvRm9yKHNpdGUsIG5laWdoYm9ySW5mbyk7XG4gICAgcmV0dXJuICQoJ2JvZHknKS50cmlnZ2VyKCduZXctbmVpZ2hib3InLCBzaXRlKTtcbiAgfTtcblxuICBuZWlnaGJvcmhvb2QubGlzdE5laWdoYm9ycyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBfLmtleXMod2lraS5uZWlnaGJvcmhvb2QpO1xuICB9O1xuXG4gIG5laWdoYm9yaG9vZC5zZWFyY2ggPSBmdW5jdGlvbihzZWFyY2hRdWVyeSkge1xuICAgIHZhciBmaW5kcywgbWF0Y2gsIG1hdGNoaW5nUGFnZXMsIG5laWdoYm9ySW5mbywgbmVpZ2hib3JTaXRlLCBzaXRlbWFwLCBzdGFydCwgdGFsbHksIHRpY2ssIF9yZWY7XG4gICAgZmluZHMgPSBbXTtcbiAgICB0YWxseSA9IHt9O1xuICAgIHRpY2sgPSBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmICh0YWxseVtrZXldICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRhbGx5W2tleV0rKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0YWxseVtrZXldID0gMTtcbiAgICAgIH1cbiAgICB9O1xuICAgIG1hdGNoID0gZnVuY3Rpb24oa2V5LCB0ZXh0KSB7XG4gICAgICB2YXIgaGl0O1xuICAgICAgaGl0ID0gKHRleHQgIT0gbnVsbCkgJiYgdGV4dC50b0xvd2VyQ2FzZSgpLmluZGV4T2Yoc2VhcmNoUXVlcnkudG9Mb3dlckNhc2UoKSkgPj0gMDtcbiAgICAgIGlmIChoaXQpIHtcbiAgICAgICAgdGljayhrZXkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGhpdDtcbiAgICB9O1xuICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICBfcmVmID0gd2lraS5uZWlnaGJvcmhvb2Q7XG4gICAgZm9yIChuZWlnaGJvclNpdGUgaW4gX3JlZikge1xuICAgICAgaWYgKCFfX2hhc1Byb3AuY2FsbChfcmVmLCBuZWlnaGJvclNpdGUpKSBjb250aW51ZTtcbiAgICAgIG5laWdoYm9ySW5mbyA9IF9yZWZbbmVpZ2hib3JTaXRlXTtcbiAgICAgIHNpdGVtYXAgPSBuZWlnaGJvckluZm8uc2l0ZW1hcDtcbiAgICAgIGlmIChzaXRlbWFwICE9IG51bGwpIHtcbiAgICAgICAgdGljaygnc2l0ZXMnKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoaW5nUGFnZXMgPSBfLmVhY2goc2l0ZW1hcCwgZnVuY3Rpb24ocGFnZSkge1xuICAgICAgICB0aWNrKCdwYWdlcycpO1xuICAgICAgICBpZiAoIShtYXRjaCgndGl0bGUnLCBwYWdlLnRpdGxlKSB8fCBtYXRjaCgndGV4dCcsIHBhZ2Uuc3lub3BzaXMpIHx8IG1hdGNoKCdzbHVnJywgcGFnZS5zbHVnKSkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGljaygnZmluZHMnKTtcbiAgICAgICAgcmV0dXJuIGZpbmRzLnB1c2goe1xuICAgICAgICAgIHBhZ2U6IHBhZ2UsXG4gICAgICAgICAgc2l0ZTogbmVpZ2hib3JTaXRlLFxuICAgICAgICAgIHJhbms6IDFcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGFsbHlbJ21zZWMnXSA9IERhdGUubm93KCkgLSBzdGFydDtcbiAgICByZXR1cm4ge1xuICAgICAgZmluZHM6IGZpbmRzLFxuICAgICAgdGFsbHk6IHRhbGx5XG4gICAgfTtcbiAgfTtcblxuICAkKGZ1bmN0aW9uKCkge1xuICAgIHZhciAkbmVpZ2hib3Job29kLCBmbGFnLCBzZWFyY2g7XG4gICAgJG5laWdoYm9yaG9vZCA9ICQoJy5uZWlnaGJvcmhvb2QnKTtcbiAgICBmbGFnID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgICAgcmV0dXJuIFwiPHNwYW4gY2xhc3M9XFxcIm5laWdoYm9yXFxcIiBkYXRhLXNpdGU9XFxcIlwiICsgc2l0ZSArIFwiXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcIndhaXRcXFwiPlxcbiAgICA8aW1nIHNyYz1cXFwiaHR0cDovL1wiICsgc2l0ZSArIFwiL2Zhdmljb24ucG5nXFxcIiB0aXRsZT1cXFwiXCIgKyBzaXRlICsgXCJcXFwiPlxcbiAgPC9kaXY+XFxuPC9zcGFuPlwiO1xuICAgIH07XG4gICAgJCgnYm9keScpLm9uKCduZXctbmVpZ2hib3InLCBmdW5jdGlvbihlLCBzaXRlKSB7XG4gICAgICByZXR1cm4gJG5laWdoYm9yaG9vZC5hcHBlbmQoZmxhZyhzaXRlKSk7XG4gICAgfSkuZGVsZWdhdGUoJy5uZWlnaGJvciBpbWcnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICByZXR1cm4gd2lraS5kb0ludGVybmFsTGluaygnd2VsY29tZS12aXNpdG9ycycsIG51bGwsIHRoaXMudGl0bGUpO1xuICAgIH0pO1xuICAgIHNlYXJjaCA9IGNyZWF0ZVNlYXJjaCh7XG4gICAgICBuZWlnaGJvcmhvb2Q6IG5laWdoYm9yaG9vZFxuICAgIH0pO1xuICAgIHJldHVybiAkKCdpbnB1dC5zZWFyY2gnKS5vbigna2V5cHJlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgc2VhcmNoUXVlcnk7XG4gICAgICBpZiAoZS5rZXlDb2RlICE9PSAxMykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzZWFyY2hRdWVyeSA9ICQodGhpcykudmFsKCk7XG4gICAgICBzZWFyY2gucGVyZm9ybVNlYXJjaChzZWFyY2hRdWVyeSk7XG4gICAgICByZXR1cm4gJCh0aGlzKS52YWwoXCJcIik7XG4gICAgfSk7XG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuIl19
;