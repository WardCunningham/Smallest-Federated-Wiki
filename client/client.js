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
  var active, pageHandler, plugin, refresh, state, util;

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


},{"./util.coffee":5,"./pageHandler.coffee":6,"./plugin.coffee":7,"./state.coffee":8,"./active.coffee":9,"./refresh.coffee":10}],4:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
(function() {
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


},{"./util.coffee":5,"./state.coffee":8,"./revision.coffee":11,"./addToJournal.coffee":12}],7:[function(require,module,exports){
(function() {
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


},{"./util.coffee":5}],8:[function(require,module,exports){
(function() {
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


},{"./active.coffee":9}],10:[function(require,module,exports){
(function() {
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


},{"./util.coffee":5,"./pageHandler.coffee":6,"./plugin.coffee":7,"./state.coffee":8,"./neighborhood.coffee":13,"./addToJournal.coffee":12,"./wiki.coffee":2}],11:[function(require,module,exports){
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


},{"./util.coffee":5}],13:[function(require,module,exports){
(function() {
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


},{"./active.coffee":9,"./util.coffee":5,"./search.coffee":14}],14:[function(require,module,exports){
(function() {
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


},{"./util.coffee":5,"./active.coffee":9}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9jbGllbnQuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3dpa2kuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2xlZ2FjeS5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc3lub3BzaXMuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3V0aWwuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2FjdGl2ZS5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcGFnZUhhbmRsZXIuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3BsdWdpbi5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc3RhdGUuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3JlZnJlc2guY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3JldmlzaW9uLmNvZmZlZSIsIi9ob21lL25ybi9naXRodWIvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9hZGRUb0pvdXJuYWwuY29mZmVlIiwiL2hvbWUvbnJuL2dpdGh1Yi9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL25laWdoYm9yaG9vZC5jb2ZmZWUiLCIvaG9tZS9ucm4vZ2l0aHViL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBO0NBQUEsQ0FBQSxDQUFjLENBQWQsRUFBTSxDQUFRLFlBQUE7O0NBQWQsQ0FDQSxLQUFBLGNBQUE7Q0FEQTs7Ozs7QUNBQTtDQUFBLEtBQUEsY0FBQTtLQUFBLGFBQUE7O0NBQUEsQ0FBQSxDQUFpQixJQUFBLE9BQWpCLEtBQWlCOztDQUFqQixDQUVBLENBQU8sQ0FBUDtDQUFPLENBQUUsRUFBQSxVQUFGO0NBRlAsR0FBQTs7Q0FBQSxDQUlBLENBQUEsQ0FBSSxLQUFPO0NBQ1QsS0FBQSxFQUFBOztDQUFBLEdBRFUsbURBQ1Y7Q0FBQSxHQUFBLCtFQUFBO0NBQVEsRUFBUixHQUFBLENBQU8sTUFBUCxHQUFZO01BREg7Q0FKWCxFQUlXOztDQUpYLENBT0EsQ0FBYyxDQUFWLEVBQUosR0FBZTtDQUNSLENBQWUsQ0FBcEIsQ0FBSSxDQUFKLEVBQUEsSUFBQSxLQUFBO0NBUkYsRUFPYzs7Q0FQZCxDQVdBLENBQXVCLENBQW5CLEtBQW1CLE1BQXZCO0NBQ0UsRUFBcUIsR0FBckIsRUFBQSxHQUFBO0NBWkYsRUFXdUI7O0NBWHZCLENBY0EsQ0FBeUIsQ0FBckIsYUFBSjs7Q0FkQSxDQWdCQSxDQUFtQixDQUFmLElBQWUsQ0FBQyxFQUFwQjtDQUNFLEdBQUEsSUFBQSxTQUFzQjtDQUN0QjtDQUNFLE9BQUEsS0FBQTtNQURGO0NBR0UsRUFBQSxDQUFJLEVBQUosV0FBc0I7TUFMUDtDQWhCbkIsRUFnQm1COztDQWhCbkIsQ0F1QkEsQ0FBZSxDQUFYLEdBQUosRUFBZ0I7Q0FDZCxPQUFBOztDQUFBLEVBQUEsQ0FBQTtDQUNFLEVBQUEsRUFBTSxDQUFOLENBQU07Q0FBTixFQUNBLENBQU0sRUFBTixLQUFTLGVBQUg7Q0FDTixHQUFHLEVBQUgsS0FBQTtDQUFpQixF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R0FBQTtDQVBYLE9BQUE7Q0FBQSxLQWFBLGdCQUFBOzs7Q0FBeUI7Q0FBQTtjQUFBLDZCQUFBOzZCQUFBO0NBQ3ZCO0NBQUEsQ0FDVSxJQUFSLEtBREYsQ0FDRTtDQURGLENBRVEsRUFBTixPQUFNLENBQU47Q0FGRixDQUdVLEVBSFYsRUFHRSxNQUFBO0NBSEYsQ0FJVSxFQUFXLEVBQW5CLE1BQUE7Q0FKRixDQUtXLEVBQVcsQ0FMdEIsQ0FLaUIsQ0FBZixLQUFBO0NBTEYsQ0FNVSxFQUFXLEVBQW5CLEVBQVEsSUFBUjtDQU5GO0NBRHVCOztDQWJ6QjtDQUFBLEVBc0J1QixHQUF2QixjQUFBO0NBQXVCLENBQ2QsR0FBUCxHQUFBLFFBRHFCO0NBQUEsQ0FFZCxHQUFQLENBQU8sRUFBUCxPQUFPLE9BQUE7Q0F4QlQsT0FBQTtDQUFBLEVBMEJvQixDQUFJLEVBQXhCLENBQW9CLENBQUEsRUFBQSxNQUFBLENBQXBCO0NBMUJBLEtBMkJBLENBQTJCLENBQTNCLFNBQWlCO0NBM0JqQixDQTRCc0MsRUFBbEMsRUFBSixHQUFBLFFBQUEsR0FBQTtDQUNPLEVBQVAsQ0FBVyxFQUFMLENBQUssTUFBWDtDQTlCRixJQUFnQjtXQWlDaEI7Q0FBQSxDQUNFLElBQUEsT0FERjtDQWxDYTtDQUhmLEVBR2U7O0NBSGYsQ0F3Q0EsQ0FBaUIsR0FBWCxDQUFOLEtBeENBO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJ3aW5kb3cud2lraSA9IHJlcXVpcmUoJy4vbGliL3dpa2kuY29mZmVlJylcbnJlcXVpcmUoJy4vbGliL2xlZ2FjeS5jb2ZmZWUnKVxuXG4iLCJjcmVhdGVTeW5vcHNpcyA9IHJlcXVpcmUgJy4vc3lub3BzaXMuY29mZmVlJ1xuXG53aWtpID0geyBjcmVhdGVTeW5vcHNpcyB9XG5cbndpa2kubG9nID0gKHRoaW5ncy4uLikgLT5cbiAgY29uc29sZS5sb2cgdGhpbmdzLi4uIGlmIGNvbnNvbGU/LmxvZz9cblxud2lraS5hc1NsdWcgPSAobmFtZSkgLT5cbiAgbmFtZS5yZXBsYWNlKC9cXHMvZywgJy0nKS5yZXBsYWNlKC9bXkEtWmEtejAtOS1dL2csICcnKS50b0xvd2VyQ2FzZSgpXG5cblxud2lraS51c2VMb2NhbFN0b3JhZ2UgPSAtPlxuICAkKFwiLmxvZ2luXCIpLmxlbmd0aCA+IDBcblxud2lraS5yZXNvbHV0aW9uQ29udGV4dCA9IFtdXG5cbndpa2kucmVzb2x2ZUZyb20gPSAoYWRkaXRpb24sIGNhbGxiYWNrKSAtPlxuICB3aWtpLnJlc29sdXRpb25Db250ZXh0LnB1c2ggYWRkaXRpb25cbiAgdHJ5XG4gICAgY2FsbGJhY2soKVxuICBmaW5hbGx5XG4gICAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wb3AoKVxuXG53aWtpLmdldERhdGEgPSAodmlzKSAtPlxuICBpZiB2aXNcbiAgICBpZHggPSAkKCcuaXRlbScpLmluZGV4KHZpcylcbiAgICB3aG8gPSAkKFwiLml0ZW06bHQoI3tpZHh9KVwiKS5maWx0ZXIoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKVxuICAgIGlmIHdobz8gdGhlbiB3aG8uZGF0YSgnaXRlbScpLmRhdGEgZWxzZSB7fVxuICBlbHNlXG4gICAgd2hvID0gJCgnLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykubGFzdCgpXG4gICAgaWYgd2hvPyB0aGVuIHdoby5kYXRhKCdpdGVtJykuZGF0YSBlbHNlIHt9XG5cbndpa2kuZ2V0RGF0YU5vZGVzID0gKHZpcykgLT5cbiAgaWYgdmlzXG4gICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpXG4gICAgd2hvID0gJChcIi5pdGVtOmx0KCN7aWR4fSlcIikuZmlsdGVyKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS50b0FycmF5KCkucmV2ZXJzZSgpXG4gICAgJCh3aG8pXG4gIGVsc2VcbiAgICB3aG8gPSAkKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS50b0FycmF5KCkucmV2ZXJzZSgpXG4gICAgJCh3aG8pXG5cbndpa2kuY3JlYXRlUGFnZSA9IChuYW1lLCBsb2MpIC0+XG4gIHNpdGUgPSBsb2MgaWYgbG9jIGFuZCBsb2MgaXNudCAndmlldydcbiAgJHBhZ2UgPSAkIFwiXCJcIlxuICAgIDxkaXYgY2xhc3M9XCJwYWdlXCIgaWQ9XCIje25hbWV9XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwidHdpbnNcIj4gPHA+IDwvcD4gPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyXCI+XG4gICAgICAgIDxoMT4gPGltZyBjbGFzcz1cImZhdmljb25cIiBzcmM9XCIjeyBpZiBzaXRlIHRoZW4gXCIvLyN7c2l0ZX1cIiBlbHNlIFwiXCIgfS9mYXZpY29uLnBuZ1wiIGhlaWdodD1cIjMycHhcIj4gI3tuYW1lfSA8L2gxPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIFwiXCJcIlxuICAkcGFnZS5maW5kKCcucGFnZScpLmF0dHIoJ2RhdGEtc2l0ZScsIHNpdGUpIGlmIHNpdGVcbiAgJHBhZ2Vcblxud2lraS5nZXRJdGVtID0gKGVsZW1lbnQpIC0+XG4gICQoZWxlbWVudCkuZGF0YShcIml0ZW1cIikgb3IgJChlbGVtZW50KS5kYXRhKCdzdGF0aWNJdGVtJykgaWYgJChlbGVtZW50KS5sZW5ndGggPiAwXG5cbndpa2kucmVzb2x2ZUxpbmtzID0gKHN0cmluZykgLT5cbiAgcmVuZGVySW50ZXJuYWxMaW5rID0gKG1hdGNoLCBuYW1lKSAtPlxuICAgICMgc3BhY2VzIGJlY29tZSAnc2x1Z3MnLCBub24tYWxwaGEtbnVtIGdldCByZW1vdmVkXG4gICAgc2x1ZyA9IHdpa2kuYXNTbHVnIG5hbWVcbiAgICBcIjxhIGNsYXNzPVxcXCJpbnRlcm5hbFxcXCIgaHJlZj1cXFwiLyN7c2x1Z30uaHRtbFxcXCIgZGF0YS1wYWdlLW5hbWU9XFxcIiN7c2x1Z31cXFwiIHRpdGxlPVxcXCIje3dpa2kucmVzb2x1dGlvbkNvbnRleHQuam9pbignID0+ICcpfVxcXCI+I3tuYW1lfTwvYT5cIlxuICBzdHJpbmdcbiAgICAucmVwbGFjZSgvXFxbXFxbKFteXFxdXSspXFxdXFxdL2dpLCByZW5kZXJJbnRlcm5hbExpbmspXG4gICAgLnJlcGxhY2UoL1xcWyhodHRwLio/KSAoLio/KVxcXS9naSwgXCJcIlwiPGEgY2xhc3M9XCJleHRlcm5hbFwiIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIkMVwiIHRpdGxlPVwiJDFcIiByZWw9XCJub2ZvbGxvd1wiPiQyIDxpbWcgc3JjPVwiL2ltYWdlcy9leHRlcm5hbC1saW5rLWx0ci1pY29uLnBuZ1wiPjwvYT5cIlwiXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gd2lraVxuXG4iLCJ1dGlsID0gcmVxdWlyZSgnLi91dGlsLmNvZmZlZScpXG5wYWdlSGFuZGxlciA9IHdpa2kucGFnZUhhbmRsZXIgPSByZXF1aXJlKCcuL3BhZ2VIYW5kbGVyLmNvZmZlZScpXG5wbHVnaW4gPSByZXF1aXJlKCcuL3BsdWdpbi5jb2ZmZWUnKVxuc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlLmNvZmZlZScpXG5hY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZS5jb2ZmZWUnKVxucmVmcmVzaCA9IHJlcXVpcmUoJy4vcmVmcmVzaC5jb2ZmZWUnKVxuXG5BcnJheTo6bGFzdCA9IC0+XG4gIHRoaXNbQGxlbmd0aCAtIDFdXG5cbiQgLT5cbiMgRUxFTUVOVFMgdXNlZCBmb3IgZGV0YWlscyBwb3B1cFxuXG4gICMgIyBleHRlbnNpb24gZnJvbSBodHRwOi8vd3d3LmRyb3B0b2ZyYW1lLmNvbS8/cD0zNVxuICAjICAgIyAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItdHJhbnNmZXJ7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgcmlnaHQ6IDIzcHg7IHRvcDogNTAlOyB3aWR0aDogMTlweDsgbWFyZ2luOiAtMTBweCAwIDAgMDsgcGFkZGluZzogMXB4OyBoZWlnaHQ6IDE4cHg7IH1cbiAgIyAgICMgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyIHNwYW4geyBkaXNwbGF5OiBibG9jazsgbWFyZ2luOiAxcHg7IH1cbiAgIyAgICMgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyOmhvdmVyLCAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItbWluOmZvY3VzIHsgcGFkZGluZzogMDsgfVxuICAjIF9pbml0ID0gJC51aS5kaWFsb2cucHJvdG90eXBlLl9pbml0XG4gICMgX3VpRGlhbG9nVGl0bGViYXIgPSBudWxsXG4gICMgJC51aS5kaWFsb2cucHJvdG90eXBlLl9pbml0ID0gLT5cbiAgIyAgIHNlbGYgPSB0aGlzXG4gICMgICBfaW5pdC5hcHBseSB0aGlzLCBhcmd1bWVudHNcbiAgIyAgIHVpRGlhbG9nVGl0bGViYXIgPSB0aGlzLnVpRGlhbG9nVGl0bGViYXJcbiAgIyAgIHVpRGlhbG9nVGl0bGViYXIuYXBwZW5kICc8YSBocmVmPVwiI1wiIGlkPVwiZGlhbG9nLXRyYW5zZmVyXCIgY2xhc3M9XCJkaWFsb2ctdHJhbnNmZXIgdWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyXCI+PHNwYW4gY2xhc3M9XCJ1aS1pY29uIHVpLWljb24tdHJhbnNmZXJ0aGljay1lLXdcIj48L3NwYW4+PC9hPidcbiAgIyAkLmV4dGVuZCAkLnVpLmRpYWxvZy5wcm90b3R5cGUsIC0+XG4gICMgICAkKCcuZGlhbG9nLXRyYW5zZmVyJywgdGhpcy51aURpYWxvZ1RpdGxlYmFyKVxuICAjICAgICAuaG92ZXIgLT4gJCh0aGlzKS50b2dnbGVDbGFzcygndWktc3RhdGUtaG92ZXInKVxuICAjICAgICAuY2xpY2soKSAtPlxuICAjICAgICAgIHNlbGYudHJhbnNmZXIoKVxuICAjICAgICAgIHJldHVybiBmYWxzZVxuICB3aW5kb3cuZGlhbG9nID0gJCgnPGRpdj48L2Rpdj4nKVxuXHQgIC5odG1sKCdUaGlzIGRpYWxvZyB3aWxsIHNob3cgZXZlcnkgdGltZSEnKVxuXHQgIC5kaWFsb2cgeyBhdXRvT3BlbjogZmFsc2UsIHRpdGxlOiAnQmFzaWMgRGlhbG9nJywgaGVpZ2h0OiA2MDAsIHdpZHRoOiA4MDAgfVxuICB3aWtpLmRpYWxvZyA9ICh0aXRsZSwgaHRtbCkgLT5cbiAgICB3aW5kb3cuZGlhbG9nLmh0bWwgaHRtbFxuICAgIHdpbmRvdy5kaWFsb2cuZGlhbG9nIFwib3B0aW9uXCIsIFwidGl0bGVcIiwgd2lraS5yZXNvbHZlTGlua3ModGl0bGUpXG4gICAgd2luZG93LmRpYWxvZy5kaWFsb2cgJ29wZW4nXG5cbiMgRlVOQ1RJT05TIHVzZWQgYnkgcGx1Z2lucyBhbmQgZWxzZXdoZXJlXG5cbiAgc2xlZXAgPSAodGltZSwgZG9uZSkgLT4gc2V0VGltZW91dCBkb25lLCB0aW1lXG5cbiAgd2lraS5yZW1vdmVJdGVtID0gKCRpdGVtLCBpdGVtKSAtPlxuICAgIHBhZ2VIYW5kbGVyLnB1dCAkaXRlbS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7dHlwZTogJ3JlbW92ZScsIGlkOiBpdGVtLmlkfVxuICAgICRpdGVtLnJlbW92ZSgpXG5cbiAgd2lraS5jcmVhdGVJdGVtID0gKCRwYWdlLCAkYmVmb3JlLCBpdGVtKSAtPlxuICAgICRwYWdlID0gJGJlZm9yZS5wYXJlbnRzKCcucGFnZScpIHVubGVzcyAkcGFnZT9cbiAgICBpdGVtLmlkID0gdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICRpdGVtID0gJCBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCJpdGVtICN7aXRlbS50eXBlfVwiIGRhdGEtaWQ9XCIje31cIjwvZGl2PlxuICAgIFwiXCJcIlxuICAgICRpdGVtXG4gICAgICAuZGF0YSgnaXRlbScsIGl0ZW0pXG4gICAgICAuZGF0YSgncGFnZUVsZW1lbnQnLCAkcGFnZSlcbiAgICBpZiAkYmVmb3JlP1xuICAgICAgJGJlZm9yZS5hZnRlciAkaXRlbVxuICAgIGVsc2VcbiAgICAgICRwYWdlLmZpbmQoJy5zdG9yeScpLmFwcGVuZCAkaXRlbVxuICAgIHBsdWdpbi5kbyAkaXRlbSwgaXRlbVxuICAgIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbSAkYmVmb3JlXG4gICAgc2xlZXAgNTAwLCAtPlxuICAgICAgcGFnZUhhbmRsZXIucHV0ICRwYWdlLCB7aXRlbSwgaWQ6IGl0ZW0uaWQsIHR5cGU6ICdhZGQnLCBhZnRlcjogYmVmb3JlPy5pZH1cbiAgICAkaXRlbVxuXG4gIGNyZWF0ZVRleHRFbGVtZW50ID0gKHBhZ2VFbGVtZW50LCBiZWZvcmVFbGVtZW50LCBpbml0aWFsVGV4dCkgLT5cbiAgICBpdGVtID1cbiAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnXG4gICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgdGV4dDogaW5pdGlhbFRleHRcbiAgICBpdGVtRWxlbWVudCA9ICQgXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbSBwYXJhZ3JhcGhcIiBkYXRhLWlkPSN7aXRlbS5pZH0+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgIGl0ZW1FbGVtZW50XG4gICAgICAuZGF0YSgnaXRlbScsIGl0ZW0pXG4gICAgICAuZGF0YSgncGFnZUVsZW1lbnQnLCBwYWdlRWxlbWVudClcbiAgICBiZWZvcmVFbGVtZW50LmFmdGVyIGl0ZW1FbGVtZW50XG4gICAgcGx1Z2luLmRvIGl0ZW1FbGVtZW50LCBpdGVtXG4gICAgaXRlbUJlZm9yZSA9IHdpa2kuZ2V0SXRlbSBiZWZvcmVFbGVtZW50XG4gICAgd2lraS50ZXh0RWRpdG9yIGl0ZW1FbGVtZW50LCBpdGVtXG4gICAgc2xlZXAgNTAwLCAtPiBwYWdlSGFuZGxlci5wdXQgcGFnZUVsZW1lbnQsIHtpdGVtOiBpdGVtLCBpZDogaXRlbS5pZCwgdHlwZTogJ2FkZCcsIGFmdGVyOiBpdGVtQmVmb3JlPy5pZH1cblxuICB0ZXh0RWRpdG9yID0gd2lraS50ZXh0RWRpdG9yID0gKGRpdiwgaXRlbSwgY2FyZXRQb3MsIGRvdWJsZUNsaWNrZWQpIC0+XG4gICAgcmV0dXJuIGlmIGRpdi5oYXNDbGFzcyAndGV4dEVkaXRpbmcnXG4gICAgZGl2LmFkZENsYXNzICd0ZXh0RWRpdGluZydcbiAgICB0ZXh0YXJlYSA9ICQoXCI8dGV4dGFyZWE+I3tvcmlnaW5hbCA9IGl0ZW0udGV4dCA/ICcnfTwvdGV4dGFyZWE+XCIpXG4gICAgICAuZm9jdXNvdXQgLT5cbiAgICAgICAgZGl2LnJlbW92ZUNsYXNzICd0ZXh0RWRpdGluZydcbiAgICAgICAgaWYgaXRlbS50ZXh0ID0gdGV4dGFyZWEudmFsKClcbiAgICAgICAgICBwbHVnaW4uZG8gZGl2LmVtcHR5KCksIGl0ZW1cbiAgICAgICAgICByZXR1cm4gaWYgaXRlbS50ZXh0ID09IG9yaWdpbmFsXG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IGRpdi5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7dHlwZTogJ2VkaXQnLCBpZDogaXRlbS5pZCwgaXRlbTogaXRlbX1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dCBkaXYucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge3R5cGU6ICdyZW1vdmUnLCBpZDogaXRlbS5pZH1cbiAgICAgICAgICBkaXYucmVtb3ZlKClcbiAgICAgICAgbnVsbFxuICAgICAgIyAuYmluZCAncGFzdGUnLCAoZSkgLT5cbiAgICAgICMgICB3aWtpLmxvZyAndGV4dGVkaXQgcGFzdGUnLCBlXG4gICAgICAjICAgd2lraS5sb2cgZS5vcmlnaW5hbEV2ZW50LmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dCcpXG4gICAgICAuYmluZCAna2V5ZG93bicsIChlKSAtPlxuICAgICAgICBpZiAoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSBhbmQgZS53aGljaCA9PSA4MyAjYWx0LXNcbiAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChlLmFsdEtleSB8fCBlLmN0bEtleSB8fCBlLm1ldGFLZXkpIGFuZCBlLndoaWNoID09IDczICNhbHQtaVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpIHVubGVzcyBlLnNoaWZ0S2V5XG4gICAgICAgICAgZG9JbnRlcm5hbExpbmsgXCJhYm91dCAje2l0ZW0udHlwZX0gcGx1Z2luXCIsIHBhZ2VcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgIyBwcm92aWRlcyBhdXRvbWF0aWMgbmV3IHBhcmFncmFwaHMgb24gZW50ZXIgYW5kIGNvbmNhdGVuYXRpb24gb24gYmFja3NwYWNlXG4gICAgICAgIGlmIGl0ZW0udHlwZSBpcyAncGFyYWdyYXBoJyBcbiAgICAgICAgICBzZWwgPSB1dGlsLmdldFNlbGVjdGlvblBvcyh0ZXh0YXJlYSkgIyBwb3NpdGlvbiBvZiBjYXJldCBvciBzZWxlY3RlZCB0ZXh0IGNvb3Jkc1xuICAgICAgICAgIGlmIGUud2hpY2ggaXMgJC51aS5rZXlDb2RlLkJBQ0tTUEFDRSBhbmQgc2VsLnN0YXJ0IGlzIDAgYW5kIHNlbC5zdGFydCBpcyBzZWwuZW5kIFxuICAgICAgICAgICAgcHJldkl0ZW0gPSB3aWtpLmdldEl0ZW0oZGl2LnByZXYoKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJldkl0ZW0udHlwZSBpcyAncGFyYWdyYXBoJ1xuICAgICAgICAgICAgcHJldlRleHRMZW4gPSBwcmV2SXRlbS50ZXh0Lmxlbmd0aFxuICAgICAgICAgICAgcHJldkl0ZW0udGV4dCArPSB0ZXh0YXJlYS52YWwoKVxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKCcnKSAjIE5lZWQgY3VycmVudCB0ZXh0IGFyZWEgdG8gYmUgZW1wdHkuIEl0ZW0gdGhlbiBnZXRzIGRlbGV0ZWQuXG4gICAgICAgICAgICAjIGNhcmV0IG5lZWRzIHRvIGJlIGJldHdlZW4gdGhlIG9sZCB0ZXh0IGFuZCB0aGUgbmV3IGFwcGVuZGVkIHRleHRcbiAgICAgICAgICAgIHRleHRFZGl0b3IgZGl2LnByZXYoKSwgcHJldkl0ZW0sIHByZXZUZXh0TGVuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICBlbHNlIGlmIGUud2hpY2ggaXMgJC51aS5rZXlDb2RlLkVOVEVSIGFuZCBpdGVtLnR5cGUgaXMgJ3BhcmFncmFwaCdcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3Mgc2VsXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dGFyZWEudmFsKClcbiAgICAgICAgICAgIHByZWZpeCA9IHRleHQuc3Vic3RyaW5nIDAsIHNlbC5zdGFydFxuICAgICAgICAgICAgbWlkZGxlID0gdGV4dC5zdWJzdHJpbmcoc2VsLnN0YXJ0LCBzZWwuZW5kKSBpZiBzZWwuc3RhcnQgaXNudCBzZWwuZW5kXG4gICAgICAgICAgICBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhzZWwuZW5kKVxuICAgICAgICAgICAgaWYgcHJlZml4IGlzICcnXG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnICcpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbChwcmVmaXgpXG4gICAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpXG4gICAgICAgICAgICBwYWdlRWxlbWVudCA9IGRpdi5wYXJlbnQoKS5wYXJlbnQoKVxuICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgc3VmZml4KVxuICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgbWlkZGxlKSBpZiBtaWRkbGU/XG4gICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCAnJykgaWYgcHJlZml4IGlzICcnXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICBkaXYuaHRtbCB0ZXh0YXJlYVxuICAgIGlmIGNhcmV0UG9zP1xuICAgICAgdXRpbC5zZXRDYXJldFBvc2l0aW9uIHRleHRhcmVhLCBjYXJldFBvc1xuICAgIGVsc2UgaWYgZG91YmxlQ2xpY2tlZCAjIHdlIHdhbnQgdGhlIGNhcmV0IHRvIGJlIGF0IHRoZSBlbmRcbiAgICAgIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbiB0ZXh0YXJlYSwgdGV4dGFyZWEudmFsKCkubGVuZ3RoXG4gICAgICAjc2Nyb2xscyB0byBib3R0b20gb2YgdGV4dCBhcmVhXG4gICAgICB0ZXh0YXJlYS5zY3JvbGxUb3AodGV4dGFyZWFbMF0uc2Nyb2xsSGVpZ2h0IC0gdGV4dGFyZWEuaGVpZ2h0KCkpXG4gICAgZWxzZVxuICAgICAgdGV4dGFyZWEuZm9jdXMoKVxuXG4gIGRvSW50ZXJuYWxMaW5rID0gd2lraS5kb0ludGVybmFsTGluayA9IChuYW1lLCBwYWdlLCBzaXRlPW51bGwpIC0+XG4gICAgbmFtZSA9IHdpa2kuYXNTbHVnKG5hbWUpXG4gICAgJChwYWdlKS5uZXh0QWxsKCkucmVtb3ZlKCkgaWYgcGFnZT9cbiAgICB3aWtpLmNyZWF0ZVBhZ2UobmFtZSxzaXRlKVxuICAgICAgLmFwcGVuZFRvKCQoJy5tYWluJykpXG4gICAgICAuZWFjaCByZWZyZXNoXG4gICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcblxuICBMRUZUQVJST1cgPSAzN1xuICBSSUdIVEFSUk9XID0gMzlcblxuICAkKGRvY3VtZW50KS5rZXlkb3duIChldmVudCkgLT5cbiAgICBkaXJlY3Rpb24gPSBzd2l0Y2ggZXZlbnQud2hpY2hcbiAgICAgIHdoZW4gTEVGVEFSUk9XIHRoZW4gLTFcbiAgICAgIHdoZW4gUklHSFRBUlJPVyB0aGVuICsxXG4gICAgaWYgZGlyZWN0aW9uICYmIG5vdCAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgaXMgXCJURVhUQVJFQVwiKVxuICAgICAgcGFnZXMgPSAkKCcucGFnZScpXG4gICAgICBuZXdJbmRleCA9IHBhZ2VzLmluZGV4KCQoJy5hY3RpdmUnKSkgKyBkaXJlY3Rpb25cbiAgICAgIGlmIDAgPD0gbmV3SW5kZXggPCBwYWdlcy5sZW5ndGhcbiAgICAgICAgYWN0aXZlLnNldChwYWdlcy5lcShuZXdJbmRleCkpXG5cbiMgSEFORExFUlMgZm9yIGpRdWVyeSBldmVudHNcblxuICAkKHdpbmRvdykub24gJ3BvcHN0YXRlJywgc3RhdGUuc2hvd1xuXG4gICQoZG9jdW1lbnQpXG4gICAgLmFqYXhFcnJvciAoZXZlbnQsIHJlcXVlc3QsIHNldHRpbmdzKSAtPlxuICAgICAgcmV0dXJuIGlmIHJlcXVlc3Quc3RhdHVzID09IDAgb3IgcmVxdWVzdC5zdGF0dXMgPT0gNDA0XG4gICAgICB3aWtpLmxvZyAnYWpheCBlcnJvcicsIGV2ZW50LCByZXF1ZXN0LCBzZXR0aW5nc1xuICAgICAgJCgnLm1haW4nKS5wcmVwZW5kIFwiXCJcIlxuICAgICAgICA8bGkgY2xhc3M9J2Vycm9yJz5cbiAgICAgICAgICBFcnJvciBvbiAje3NldHRpbmdzLnVybH06ICN7cmVxdWVzdC5yZXNwb25zZVRleHR9XG4gICAgICAgIDwvbGk+XG4gICAgICBcIlwiXCJcblxuICBnZXRUZW1wbGF0ZSA9IChzbHVnLCBkb25lKSAtPlxuICAgIHJldHVybiBkb25lKG51bGwpIHVubGVzcyBzbHVnXG4gICAgd2lraS5sb2cgJ2dldFRlbXBsYXRlJywgc2x1Z1xuICAgIHBhZ2VIYW5kbGVyLmdldFxuICAgICAgd2hlbkdvdHRlbjogKGRhdGEsc2l0ZUZvdW5kKSAtPiBkb25lKGRhdGEuc3RvcnkpXG4gICAgICB3aGVuTm90R290dGVuOiAtPiBkb25lKG51bGwpXG4gICAgICBwYWdlSW5mb3JtYXRpb246IHtzbHVnOiBzbHVnfVxuXG4gIGZpbmlzaENsaWNrID0gKGUsIG5hbWUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlJykgdW5sZXNzIGUuc2hpZnRLZXlcbiAgICBkb0ludGVybmFsTGluayBuYW1lLCBwYWdlLCAkKGUudGFyZ2V0KS5kYXRhKCdzaXRlJylcbiAgICByZXR1cm4gZmFsc2VcblxuICAkKCcubWFpbicpXG4gICAgLmRlbGVnYXRlICcuc2hvdy1wYWdlLXNvdXJjZScsICdjbGljaycsIChlKSAtPlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBwYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50KCkucGFyZW50KClcbiAgICAgIGpzb24gPSBwYWdlRWxlbWVudC5kYXRhKCdkYXRhJylcbiAgICAgIHdpa2kuZGlhbG9nIFwiSlNPTiBmb3IgI3tqc29uLnRpdGxlfVwiLCAgJCgnPHByZS8+JykudGV4dChKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKSlcblxuICAgIC5kZWxlZ2F0ZSAnLnBhZ2UnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGFjdGl2ZS5zZXQgdGhpcyB1bmxlc3MgJChlLnRhcmdldCkuaXMoXCJhXCIpXG5cbiAgICAuZGVsZWdhdGUgJy5pbnRlcm5hbCcsICdjbGljaycsIChlKSAtPlxuICAgICAgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEgJ3BhZ2VOYW1lJ1xuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9ICQoZS50YXJnZXQpLmF0dHIoJ3RpdGxlJykuc3BsaXQoJyA9PiAnKVxuICAgICAgZmluaXNoQ2xpY2sgZSwgbmFtZVxuXG4gICAgLmRlbGVnYXRlICdpbWcucmVtb3RlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBuYW1lID0gJChlLnRhcmdldCkuZGF0YSgnc2x1ZycpXG4gICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyQoZS50YXJnZXQpLmRhdGEoJ3NpdGUnKV1cbiAgICAgIGZpbmlzaENsaWNrIGUsIG5hbWVcblxuICAgIC5kZWxlZ2F0ZSAnLnJldmlzaW9uJywgJ2RibGNsaWNrJywgKGUpIC0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpXG4gICAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpXG4gICAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoLTFcbiAgICAgIGFjdGlvbiA9IHBhZ2Uuam91cm5hbFtyZXZdXG4gICAgICBqc29uID0gSlNPTi5zdHJpbmdpZnkoYWN0aW9uLCBudWxsLCAyKVxuICAgICAgd2lraS5kaWFsb2cgXCJSZXZpc2lvbiAje3Jldn0sICN7YWN0aW9uLnR5cGV9IGFjdGlvblwiLCAkKCc8cHJlLz4nKS50ZXh0KGpzb24pXG5cbiAgICAuZGVsZWdhdGUgJy5hY3Rpb24nLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgJGFjdGlvbiA9ICQoZS50YXJnZXQpXG4gICAgICBpZiAkYWN0aW9uLmlzKCcuZm9yaycpIGFuZCAobmFtZSA9ICRhY3Rpb24uZGF0YSgnc2x1ZycpKT9cbiAgICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFskYWN0aW9uLmRhdGEoJ3NpdGUnKV1cbiAgICAgICAgZmluaXNoQ2xpY2sgZSwgKG5hbWUuc3BsaXQgJ18nKVswXVxuICAgICAgZWxzZVxuICAgICAgICAkcGFnZSA9ICQodGhpcykucGFyZW50cygnLnBhZ2UnKVxuICAgICAgICBzbHVnID0gd2lraS5hc1NsdWcoJHBhZ2UuZGF0YSgnZGF0YScpLnRpdGxlKVxuICAgICAgICByZXYgPSAkKHRoaXMpLnBhcmVudCgpLmNoaWxkcmVuKCkuaW5kZXgoJGFjdGlvbilcbiAgICAgICAgJHBhZ2UubmV4dEFsbCgpLnJlbW92ZSgpIHVubGVzcyBlLnNoaWZ0S2V5XG4gICAgICAgIHdpa2kuY3JlYXRlUGFnZShcIiN7c2x1Z31fcmV2I3tyZXZ9XCIsICRwYWdlLmRhdGEoJ3NpdGUnKSlcbiAgICAgICAgICAuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICAgICAgICAuZWFjaCByZWZyZXNoXG4gICAgICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG5cbiAgICAuZGVsZWdhdGUgJy5mb3JrLXBhZ2UnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIHBhZ2VFbGVtZW50ID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKVxuICAgICAgaWYgcGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2xvY2FsJylcbiAgICAgICAgdW5sZXNzIHdpa2kudXNlTG9jYWxTdG9yYWdlKClcbiAgICAgICAgICBpdGVtID0gcGFnZUVsZW1lbnQuZGF0YSgnZGF0YScpXG4gICAgICAgICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2xvY2FsJylcbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQgcGFnZUVsZW1lbnQsIHt0eXBlOiAnZm9yaycsIGl0ZW19ICMgcHVzaFxuICAgICAgZWxzZVxuICAgICAgICBpZiAocmVtb3RlU2l0ZSA9IHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKSk/XG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IHBhZ2VFbGVtZW50LCB7dHlwZTonZm9yaycsIHNpdGU6IHJlbW90ZVNpdGV9ICMgcHVsbFxuXG4gICAgLmRlbGVnYXRlICcuYWN0aW9uJywgJ2hvdmVyJywgLT5cbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJylcbiAgICAgICQoXCJbZGF0YS1pZD0je2lkfV1cIikudG9nZ2xlQ2xhc3MoJ3RhcmdldCcpXG4gICAgICAkKCcubWFpbicpLnRyaWdnZXIoJ3JldicpXG5cbiAgICAuZGVsZWdhdGUgJy5pdGVtJywgJ2hvdmVyJywgLT5cbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJylcbiAgICAgICQoXCIuYWN0aW9uW2RhdGEtaWQ9I3tpZH1dXCIpLnRvZ2dsZUNsYXNzKCd0YXJnZXQnKVxuXG4gICAgLmRlbGVnYXRlICdidXR0b24uY3JlYXRlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBnZXRUZW1wbGF0ZSAkKGUudGFyZ2V0KS5kYXRhKCdzbHVnJyksIChzdG9yeSkgLT5cbiAgICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gICAgICAgICRwYWdlLnJlbW92ZUNsYXNzICdnaG9zdCdcbiAgICAgICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKVxuICAgICAgICBwYWdlLnN0b3J5ID0gc3Rvcnl8fFtdXG4gICAgICAgIHBhZ2VIYW5kbGVyLnB1dCAkcGFnZSwge3R5cGU6ICdjcmVhdGUnLCBpZDogcGFnZS5pZCwgaXRlbToge3RpdGxlOnBhZ2UudGl0bGUsIHN0b3J5OiBzdG9yeXx8dW5kZWZpbmVkfX1cbiAgICAgICAgd2lraS5idWlsZFBhZ2UgcGFnZSwgbnVsbCwgJHBhZ2UuZW1wdHkoKVxuXG4gICAgLmRlbGVnYXRlICcuZ2hvc3QnLCAncmV2JywgKGUpIC0+XG4gICAgICB3aWtpLmxvZyAncmV2JywgZVxuICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gICAgICAkaXRlbSA9ICRwYWdlLmZpbmQoJy50YXJnZXQnKVxuICAgICAgcG9zaXRpb24gPSAkaXRlbS5vZmZzZXQoKS50b3AgKyAkcGFnZS5zY3JvbGxUb3AoKSAtICRwYWdlLmhlaWdodCgpLzJcbiAgICAgIHdpa2kubG9nICdzY3JvbGwnLCAkcGFnZSwgJGl0ZW0sIHBvc2l0aW9uXG4gICAgICAkcGFnZS5zdG9wKCkuYW5pbWF0ZSB7c2Nyb2xsVG9wOiBwb3N0aW9ufSwgJ3Nsb3cnXG5cbiAgICAuZGVsZWdhdGUgJy5zY29yZScsICdob3ZlcicsIChlKSAtPlxuICAgICAgJCgnLm1haW4nKS50cmlnZ2VyICd0aHVtYicsICQoZS50YXJnZXQpLmRhdGEoJ3RodW1iJylcblxuICAkKFwiLnByb3ZpZGVyIGlucHV0XCIpLmNsaWNrIC0+XG4gICAgJChcImZvb3RlciBpbnB1dDpmaXJzdFwiKS52YWwgJCh0aGlzKS5hdHRyKCdkYXRhLXByb3ZpZGVyJylcbiAgICAkKFwiZm9vdGVyIGZvcm1cIikuc3VibWl0KClcblxuICAkKCdib2R5Jykub24gJ25ldy1uZWlnaGJvci1kb25lJywgKGUsIG5laWdoYm9yKSAtPlxuICAgICQoJy5wYWdlJykuZWFjaCAoaW5kZXgsIGVsZW1lbnQpIC0+XG4gICAgICB3aWtpLmVtaXRUd2lucyAkKGVsZW1lbnQpXG5cbiAgJCAtPlxuICAgIHN0YXRlLmZpcnN0KClcbiAgICAkKCcucGFnZScpLmVhY2ggcmVmcmVzaFxuICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gKHBhZ2UpIC0+XG4gIHN5bm9wc2lzID0gcGFnZS5zeW5vcHNpc1xuICBpZiBwYWdlPyAmJiBwYWdlLnN0b3J5P1xuICAgIHAxID0gcGFnZS5zdG9yeVswXVxuICAgIHAyID0gcGFnZS5zdG9yeVsxXVxuICAgIHN5bm9wc2lzIHx8PSBwMS50ZXh0IGlmIHAxICYmIHAxLnR5cGUgPT0gJ3BhcmFncmFwaCdcbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50eXBlID09ICdwYXJhZ3JhcGgnXG4gICAgc3lub3BzaXMgfHw9IHAxLnRleHQgaWYgcDEgJiYgcDEudGV4dD9cbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50ZXh0P1xuICAgIHN5bm9wc2lzIHx8PSBwYWdlLnN0b3J5PyAmJiBcIkEgcGFnZSB3aXRoICN7cGFnZS5zdG9yeS5sZW5ndGh9IGl0ZW1zLlwiXG4gIGVsc2VcbiAgICBzeW5vcHNpcyA9ICdBIHBhZ2Ugd2l0aCBubyBzdG9yeS4nXG4gIHJldHVybiBzeW5vcHNpc1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHdpa2kudXRpbCA9IHV0aWwgPSB7fVxuXG51dGlsLnN5bWJvbHMgPVxuICBjcmVhdGU6ICfimLwnXG4gIGFkZDogJysnXG4gIGVkaXQ6ICfinI4nXG4gIGZvcms6ICfimpEnXG4gIG1vdmU6ICfihpUnXG4gIHJlbW92ZTogJ+KclSdcblxudXRpbC5yYW5kb21CeXRlID0gLT5cbiAgKCgoMStNYXRoLnJhbmRvbSgpKSoweDEwMCl8MCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKVxuXG51dGlsLnJhbmRvbUJ5dGVzID0gKG4pIC0+XG4gICh1dGlsLnJhbmRvbUJ5dGUoKSBmb3IgWzEuLm5dKS5qb2luKCcnKVxuXG4jIGZvciBjaGFydCBwbHVnLWluXG51dGlsLmZvcm1hdFRpbWUgPSAodGltZSkgLT5cbiAgZCA9IG5ldyBEYXRlIChpZiB0aW1lID4gMTAwMDAwMDAwMDAgdGhlbiB0aW1lIGVsc2UgdGltZSoxMDAwKVxuICBtbyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVtkLmdldE1vbnRoKCldXG4gIGggPSBkLmdldEhvdXJzKClcbiAgYW0gPSBpZiBoIDwgMTIgdGhlbiAnQU0nIGVsc2UgJ1BNJ1xuICBoID0gaWYgaCA9PSAwIHRoZW4gMTIgZWxzZSBpZiBoID4gMTIgdGhlbiBoIC0gMTIgZWxzZSBoXG4gIG1pID0gKGlmIGQuZ2V0TWludXRlcygpIDwgMTAgdGhlbiBcIjBcIiBlbHNlIFwiXCIpICsgZC5nZXRNaW51dGVzKClcbiAgXCIje2h9OiN7bWl9ICN7YW19PGJyPiN7ZC5nZXREYXRlKCl9ICN7bW99ICN7ZC5nZXRGdWxsWWVhcigpfVwiXG5cbiMgZm9yIGpvdXJuYWwgbW91c2Utb3ZlcnMgYW5kIHBvc3NpYmx5IGZvciBkYXRlIGhlYWRlclxudXRpbC5mb3JtYXREYXRlID0gKG1zU2luY2VFcG9jaCkgLT5cbiAgZCA9IG5ldyBEYXRlKG1zU2luY2VFcG9jaClcbiAgd2sgPSBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddW2QuZ2V0RGF5KCldXG4gIG1vID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddW2QuZ2V0TW9udGgoKV1cbiAgZGF5ID0gZC5nZXREYXRlKCk7XG4gIHlyID0gZC5nZXRGdWxsWWVhcigpO1xuICBoID0gZC5nZXRIb3VycygpXG4gIGFtID0gaWYgaCA8IDEyIHRoZW4gJ0FNJyBlbHNlICdQTSdcbiAgaCA9IGlmIGggPT0gMCB0aGVuIDEyIGVsc2UgaWYgaCA+IDEyIHRoZW4gaCAtIDEyIGVsc2UgaFxuICBtaSA9IChpZiBkLmdldE1pbnV0ZXMoKSA8IDEwIHRoZW4gXCIwXCIgZWxzZSBcIlwiKSArIGQuZ2V0TWludXRlcygpXG4gIHNlYyA9IChpZiBkLmdldFNlY29uZHMoKSA8IDEwIHRoZW4gXCIwXCIgZWxzZSBcIlwiKSArIGQuZ2V0U2Vjb25kcygpXG4gIFwiI3t3a30gI3ttb30gI3tkYXl9LCAje3lyfTxicj4je2h9OiN7bWl9OiN7c2VjfSAje2FtfVwiXG5cbnV0aWwuZm9ybWF0RWxhcHNlZFRpbWUgPSAobXNTaW5jZUVwb2NoKSAtPlxuICBtc2VjcyA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG1zU2luY2VFcG9jaClcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIG1zZWNzfSBtaWxsaXNlY29uZHMgYWdvXCIgaWYgKHNlY3MgPSBtc2Vjcy8xMDAwKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIHNlY3N9IHNlY29uZHMgYWdvXCIgaWYgKG1pbnMgPSBzZWNzLzYwKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIG1pbnN9IG1pbnV0ZXMgYWdvXCIgaWYgKGhycyA9IG1pbnMvNjApIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgaHJzfSBob3VycyBhZ29cIiBpZiAoZGF5cyA9IGhycy8yNCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBkYXlzfSBkYXlzIGFnb1wiIGlmICh3ZWVrcyA9IGRheXMvNykgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciB3ZWVrc30gd2Vla3MgYWdvXCIgaWYgKG1vbnRocyA9IGRheXMvMzEpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgbW9udGhzfSBtb250aHMgYWdvXCIgaWYgKHllYXJzID0gZGF5cy8zNjUpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgeWVhcnN9IHllYXJzIGFnb1wiXG5cbiMgREVGQVVMVFMgZm9yIHJlcXVpcmVkIGZpZWxkc1xuXG51dGlsLmVtcHR5UGFnZSA9ICgpIC0+XG4gIHRpdGxlOiAnZW1wdHknXG4gIHN0b3J5OiBbXVxuICBqb3VybmFsOiBbXVxuXG5cbiMgSWYgdGhlIHNlbGVjdGlvbiBzdGFydCBhbmQgc2VsZWN0aW9uIGVuZCBhcmUgYm90aCB0aGUgc2FtZSxcbiMgdGhlbiB5b3UgaGF2ZSB0aGUgY2FyZXQgcG9zaXRpb24uIElmIHRoZXJlIGlzIHNlbGVjdGVkIHRleHQsIFxuIyB0aGUgYnJvd3NlciB3aWxsIG5vdCB0ZWxsIHlvdSB3aGVyZSB0aGUgY2FyZXQgaXMsIGJ1dCBpdCB3aWxsIFxuIyBlaXRoZXIgYmUgYXQgdGhlIGJlZ2lubmluZyBvciB0aGUgZW5kIG9mIHRoZSBzZWxlY3Rpb24gXG4jKGRlcGVuZGluZyBvbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBzZWxlY3Rpb24pLlxudXRpbC5nZXRTZWxlY3Rpb25Qb3MgPSAoalF1ZXJ5RWxlbWVudCkgLT4gXG4gIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCkgIyBnZXRzIERPTSBOb2RlIGZyb20gZnJvbSBqUXVlcnkgd3JhcHBlclxuICBpZiBkb2N1bWVudC5zZWxlY3Rpb24gIyBJRVxuICAgIGVsLmZvY3VzKClcbiAgICBzZWwgPSBkb2N1bWVudC5zZWxlY3Rpb24uY3JlYXRlUmFuZ2UoKVxuICAgIHNlbC5tb3ZlU3RhcnQgJ2NoYXJhY3RlcicsIC1lbC52YWx1ZS5sZW5ndGhcbiAgICBpZVBvcyA9IHNlbC50ZXh0Lmxlbmd0aFxuICAgIHtzdGFydDogaWVQb3MsIGVuZDogaWVQb3N9XG4gIGVsc2VcbiAgICB7c3RhcnQ6IGVsLnNlbGVjdGlvblN0YXJ0LCBlbmQ6IGVsLnNlbGVjdGlvbkVuZH1cblxudXRpbC5zZXRDYXJldFBvc2l0aW9uID0gKGpRdWVyeUVsZW1lbnQsIGNhcmV0UG9zKSAtPlxuICBlbCA9IGpRdWVyeUVsZW1lbnQuZ2V0KDApXG4gIGlmIGVsP1xuICAgIGlmIGVsLmNyZWF0ZVRleHRSYW5nZSAjIElFXG4gICAgICByYW5nZSA9IGVsLmNyZWF0ZVRleHRSYW5nZSgpXG4gICAgICByYW5nZS5tb3ZlIFwiY2hhcmFjdGVyXCIsIGNhcmV0UG9zXG4gICAgICByYW5nZS5zZWxlY3QoKVxuICAgIGVsc2UgIyByZXN0IG9mIHRoZSB3b3JsZFxuICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UgY2FyZXRQb3MsIGNhcmV0UG9zXG4gICAgZWwuZm9jdXMoKVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFjdGl2ZSA9IHt9XG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIHRoZSBhY3RpdmUgcGFnZSwgYW5kIHNjcm9sbCB2aWV3cG9ydCB0byBzaG93IGl0XG5cbmFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSB1bmRlZmluZWRcbmZpbmRTY3JvbGxDb250YWluZXIgPSAtPlxuICBzY3JvbGxlZCA9ICQoXCJib2R5LCBodG1sXCIpLmZpbHRlciAtPiAkKHRoaXMpLnNjcm9sbExlZnQoKSA+IDBcbiAgaWYgc2Nyb2xsZWQubGVuZ3RoID4gMFxuICAgIHNjcm9sbGVkXG4gIGVsc2VcbiAgICAkKFwiYm9keSwgaHRtbFwiKS5zY3JvbGxMZWZ0KDEyKS5maWx0ZXIoLT4gJCh0aGlzKS5zY3JvbGxMZWZ0KCkgPiAwKS5zY3JvbGxUb3AoMClcblxuc2Nyb2xsVG8gPSAoZWwpIC0+XG4gIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPz0gZmluZFNjcm9sbENvbnRhaW5lcigpXG4gIGJvZHlXaWR0aCA9ICQoXCJib2R5XCIpLndpZHRoKClcbiAgbWluWCA9IGFjdGl2ZS5zY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCgpXG4gIG1heFggPSBtaW5YICsgYm9keVdpZHRoXG4gIHRhcmdldCA9IGVsLnBvc2l0aW9uKCkubGVmdFxuICB3aWR0aCA9IGVsLm91dGVyV2lkdGgodHJ1ZSlcbiAgY29udGVudFdpZHRoID0gJChcIi5wYWdlXCIpLm91dGVyV2lkdGgodHJ1ZSkgKiAkKFwiLnBhZ2VcIikuc2l6ZSgpXG5cbiAgaWYgdGFyZ2V0IDwgbWluWFxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiB0YXJnZXRcbiAgZWxzZSBpZiB0YXJnZXQgKyB3aWR0aCA+IG1heFhcbiAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUgc2Nyb2xsTGVmdDogdGFyZ2V0IC0gKGJvZHlXaWR0aCAtIHdpZHRoKVxuICBlbHNlIGlmIG1heFggPiAkKFwiLnBhZ2VzXCIpLm91dGVyV2lkdGgoKVxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiBNYXRoLm1pbih0YXJnZXQsIGNvbnRlbnRXaWR0aCAtIGJvZHlXaWR0aClcblxuYWN0aXZlLnNldCA9IChlbCkgLT5cbiAgZWwgPSAkKGVsKVxuICAkKFwiLmFjdGl2ZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICBzY3JvbGxUbyBlbC5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuXG4iLCJ1dGlsID0gcmVxdWlyZSgnLi91dGlsLmNvZmZlZScpXG5zdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUuY29mZmVlJylcbnJldmlzaW9uID0gcmVxdWlyZSgnLi9yZXZpc2lvbi5jb2ZmZWUnKVxuYWRkVG9Kb3VybmFsID0gcmVxdWlyZSgnLi9hZGRUb0pvdXJuYWwuY29mZmVlJylcblxubW9kdWxlLmV4cG9ydHMgPSBwYWdlSGFuZGxlciA9IHt9XG5cbnBhZ2VGcm9tTG9jYWxTdG9yYWdlID0gKHNsdWcpLT5cbiAgaWYganNvbiA9IGxvY2FsU3RvcmFnZVtzbHVnXVxuICAgIEpTT04ucGFyc2UoanNvbilcbiAgZWxzZVxuICAgIHVuZGVmaW5lZFxuXG5yZWN1cnNpdmVHZXQgPSAoe3BhZ2VJbmZvcm1hdGlvbiwgd2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbiwgbG9jYWxDb250ZXh0fSkgLT5cbiAge3NsdWcscmV2LHNpdGV9ID0gcGFnZUluZm9ybWF0aW9uXG5cbiAgaWYgc2l0ZVxuICAgIGxvY2FsQ29udGV4dCA9IFtdXG4gIGVsc2VcbiAgICBzaXRlID0gbG9jYWxDb250ZXh0LnNoaWZ0KClcblxuICBzaXRlID0gbnVsbCBpZiBzaXRlPT0ndmlldydcblxuICBpZiBzaXRlP1xuICAgIGlmIHNpdGUgPT0gJ2xvY2FsJ1xuICAgICAgaWYgbG9jYWxQYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZUluZm9ybWF0aW9uLnNsdWcpXG4gICAgICAgIHJldHVybiB3aGVuR290dGVuKCBsb2NhbFBhZ2UsICdsb2NhbCcgKVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gd2hlbk5vdEdvdHRlbigpXG4gICAgZWxzZVxuICAgICAgaWYgc2l0ZSA9PSAnb3JpZ2luJ1xuICAgICAgICB1cmwgPSBcIi8je3NsdWd9Lmpzb25cIlxuICAgICAgZWxzZVxuICAgICAgICB1cmwgPSBcImh0dHA6Ly8je3NpdGV9LyN7c2x1Z30uanNvblwiXG4gIGVsc2VcbiAgICB1cmwgPSBcIi8je3NsdWd9Lmpzb25cIlxuXG4gICQuYWpheFxuICAgIHR5cGU6ICdHRVQnXG4gICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgIHVybDogdXJsICsgXCI/cmFuZG9tPSN7dXRpbC5yYW5kb21CeXRlcyg0KX1cIlxuICAgIHN1Y2Nlc3M6IChwYWdlKSAtPlxuICAgICAgcGFnZSA9IHJldmlzaW9uLmNyZWF0ZSByZXYsIHBhZ2UgaWYgcmV2XG4gICAgICByZXR1cm4gd2hlbkdvdHRlbihwYWdlLHNpdGUpXG4gICAgZXJyb3I6ICh4aHIsIHR5cGUsIG1zZykgLT5cbiAgICAgIGlmICh4aHIuc3RhdHVzICE9IDQwNCkgYW5kICh4aHIuc3RhdHVzICE9IDApXG4gICAgICAgIHdpa2kubG9nICdwYWdlSGFuZGxlci5nZXQgZXJyb3InLCB4aHIsIHhoci5zdGF0dXMsIHR5cGUsIG1zZ1xuICAgICAgICByZXBvcnQgPVxuICAgICAgICAgICd0aXRsZSc6IFwiI3t4aHIuc3RhdHVzfSAje21zZ31cIlxuICAgICAgICAgICdzdG9yeSc6IFtcbiAgICAgICAgICAgICd0eXBlJzogJ3BhcmFncmFwaCdcbiAgICAgICAgICAgICdpZCc6ICc5Mjg3MzkxODcyNDMnXG4gICAgICAgICAgICAndGV4dCc6IFwiPHByZT4je3hoci5yZXNwb25zZVRleHR9XCJcbiAgICAgICAgICBdXG4gICAgICAgIHJldHVybiB3aGVuR290dGVuIHJlcG9ydCwgJ2xvY2FsJ1xuICAgICAgaWYgbG9jYWxDb250ZXh0Lmxlbmd0aCA+IDBcbiAgICAgICAgcmVjdXJzaXZlR2V0KCB7cGFnZUluZm9ybWF0aW9uLCB3aGVuR290dGVuLCB3aGVuTm90R290dGVuLCBsb2NhbENvbnRleHR9IClcbiAgICAgIGVsc2VcbiAgICAgICAgd2hlbk5vdEdvdHRlbigpXG5cbnBhZ2VIYW5kbGVyLmdldCA9ICh7d2hlbkdvdHRlbix3aGVuTm90R290dGVuLHBhZ2VJbmZvcm1hdGlvbn0gICkgLT5cblxuICB1bmxlc3MgcGFnZUluZm9ybWF0aW9uLnNpdGVcbiAgICBpZiBsb2NhbFBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlSW5mb3JtYXRpb24uc2x1ZylcbiAgICAgIGxvY2FsUGFnZSA9IHJldmlzaW9uLmNyZWF0ZSBwYWdlSW5mb3JtYXRpb24ucmV2LCBsb2NhbFBhZ2UgaWYgcGFnZUluZm9ybWF0aW9uLnJldlxuICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4oIGxvY2FsUGFnZSwgJ2xvY2FsJyApXG5cbiAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFsndmlldyddIHVubGVzcyBwYWdlSGFuZGxlci5jb250ZXh0Lmxlbmd0aFxuXG4gIHJlY3Vyc2l2ZUdldFxuICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uXG4gICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlblxuICAgIHdoZW5Ob3RHb3R0ZW46IHdoZW5Ob3RHb3R0ZW5cbiAgICBsb2NhbENvbnRleHQ6IF8uY2xvbmUocGFnZUhhbmRsZXIuY29udGV4dClcblxuXG5wYWdlSGFuZGxlci5jb250ZXh0ID0gW11cblxucHVzaFRvTG9jYWwgPSAocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pIC0+XG4gIHBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZSBwYWdlUHV0SW5mby5zbHVnXG4gIHBhZ2UgPSB7dGl0bGU6IGFjdGlvbi5pdGVtLnRpdGxlfSBpZiBhY3Rpb24udHlwZSA9PSAnY3JlYXRlJ1xuICBwYWdlIHx8PSBwYWdlRWxlbWVudC5kYXRhKFwiZGF0YVwiKVxuICBwYWdlLmpvdXJuYWwgPSBbXSB1bmxlc3MgcGFnZS5qb3VybmFsP1xuICBpZiAoc2l0ZT1hY3Rpb25bJ2ZvcmsnXSk/XG4gICAgcGFnZS5qb3VybmFsID0gcGFnZS5qb3VybmFsLmNvbmNhdCh7J3R5cGUnOidmb3JrJywnc2l0ZSc6c2l0ZX0pXG4gICAgZGVsZXRlIGFjdGlvblsnZm9yayddXG4gIHBhZ2Uuam91cm5hbCA9IHBhZ2Uuam91cm5hbC5jb25jYXQoYWN0aW9uKVxuICBwYWdlLnN0b3J5ID0gJChwYWdlRWxlbWVudCkuZmluZChcIi5pdGVtXCIpLm1hcCgtPiAkKEApLmRhdGEoXCJpdGVtXCIpKS5nZXQoKVxuICBsb2NhbFN0b3JhZ2VbcGFnZVB1dEluZm8uc2x1Z10gPSBKU09OLnN0cmluZ2lmeShwYWdlKVxuICBhZGRUb0pvdXJuYWwgcGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwgYWN0aW9uXG5cbnB1c2hUb1NlcnZlciA9IChwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbikgLT5cbiAgJC5hamF4XG4gICAgdHlwZTogJ1BVVCdcbiAgICB1cmw6IFwiL3BhZ2UvI3twYWdlUHV0SW5mby5zbHVnfS9hY3Rpb25cIlxuICAgIGRhdGE6XG4gICAgICAnYWN0aW9uJzogSlNPTi5zdHJpbmdpZnkoYWN0aW9uKVxuICAgIHN1Y2Nlc3M6ICgpIC0+XG4gICAgICBhZGRUb0pvdXJuYWwgcGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwgYWN0aW9uXG4gICAgICBpZiBhY3Rpb24udHlwZSA9PSAnZm9yaycgIyBwdXNoXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtIHBhZ2VFbGVtZW50LmF0dHIoJ2lkJylcbiAgICAgICAgc3RhdGUuc2V0VXJsXG4gICAgZXJyb3I6ICh4aHIsIHR5cGUsIG1zZykgLT5cbiAgICAgIHdpa2kubG9nIFwicGFnZUhhbmRsZXIucHV0IGFqYXggZXJyb3IgY2FsbGJhY2tcIiwgdHlwZSwgbXNnXG5cbnBhZ2VIYW5kbGVyLnB1dCA9IChwYWdlRWxlbWVudCwgYWN0aW9uKSAtPlxuXG4gIGNoZWNrZWRTaXRlID0gKCkgLT5cbiAgICBzd2l0Y2ggc2l0ZSA9IHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKVxuICAgICAgd2hlbiAnb3JpZ2luJywgJ2xvY2FsJywgJ3ZpZXcnIHRoZW4gbnVsbFxuICAgICAgd2hlbiBsb2NhdGlvbi5ob3N0IHRoZW4gbnVsbFxuICAgICAgZWxzZSBzaXRlXG5cbiAgIyBhYm91dCB0aGUgcGFnZSB3ZSBoYXZlXG4gIHBhZ2VQdXRJbmZvID0ge1xuICAgIHNsdWc6IHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVswXVxuICAgIHJldjogcGFnZUVsZW1lbnQuYXR0cignaWQnKS5zcGxpdCgnX3JldicpWzFdXG4gICAgc2l0ZTogY2hlY2tlZFNpdGUoKVxuICAgIGxvY2FsOiBwYWdlRWxlbWVudC5oYXNDbGFzcygnbG9jYWwnKVxuICB9XG4gIGZvcmtGcm9tID0gcGFnZVB1dEluZm8uc2l0ZVxuICB3aWtpLmxvZyAncGFnZUhhbmRsZXIucHV0JywgYWN0aW9uLCBwYWdlUHV0SW5mb1xuXG4gICMgZGV0ZWN0IHdoZW4gZm9yayB0byBsb2NhbCBzdG9yYWdlXG4gIGlmIHdpa2kudXNlTG9jYWxTdG9yYWdlKClcbiAgICBpZiBwYWdlUHV0SW5mby5zaXRlP1xuICAgICAgd2lraS5sb2cgJ3JlbW90ZSA9PiBsb2NhbCdcbiAgICBlbHNlIGlmICFwYWdlUHV0SW5mby5sb2NhbFxuICAgICAgd2lraS5sb2cgJ29yaWdpbiA9PiBsb2NhbCdcbiAgICAgIGFjdGlvbi5zaXRlID0gZm9ya0Zyb20gPSBsb2NhdGlvbi5ob3N0XG4gICAgIyBlbHNlIGlmICFwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlUHV0SW5mby5zbHVnKVxuICAgICMgICB3aWtpLmxvZyAnJ1xuICAgICMgICBhY3Rpb24uc2l0ZSA9IGZvcmtGcm9tID0gcGFnZVB1dEluZm8uc2l0ZVxuICAgICMgICB3aWtpLmxvZyAnbG9jYWwgc3RvcmFnZSBmaXJzdCB0aW1lJywgYWN0aW9uLCAnZm9ya0Zyb20nLCBmb3JrRnJvbVxuXG4gICMgdHdlZWsgYWN0aW9uIGJlZm9yZSBzYXZpbmdcbiAgYWN0aW9uLmRhdGUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpXG4gIGRlbGV0ZSBhY3Rpb24uc2l0ZSBpZiBhY3Rpb24uc2l0ZSA9PSAnb3JpZ2luJ1xuXG4gICMgdXBkYXRlIGRvbSB3aGVuIGZvcmtpbmdcbiAgaWYgZm9ya0Zyb21cbiAgICAjIHB1bGwgcmVtb3RlIHNpdGUgY2xvc2VyIHRvIHVzXG4gICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgaW1nJykuYXR0cignc3JjJywgJy9mYXZpY29uLnBuZycpXG4gICAgcGFnZUVsZW1lbnQuZmluZCgnaDEgYScpLmF0dHIoJ2hyZWYnLCAnLycpXG4gICAgcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScsIG51bGwpXG4gICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ3JlbW90ZScpXG4gICAgc3RhdGUuc2V0VXJsKClcbiAgICBpZiBhY3Rpb24udHlwZSAhPSAnZm9yaydcbiAgICAgICMgYnVuZGxlIGltcGxpY2l0IGZvcmsgd2l0aCBuZXh0IGFjdGlvblxuICAgICAgYWN0aW9uLmZvcmsgPSBmb3JrRnJvbVxuICAgICAgYWRkVG9Kb3VybmFsIHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksXG4gICAgICAgIHR5cGU6ICdmb3JrJ1xuICAgICAgICBzaXRlOiBmb3JrRnJvbVxuICAgICAgICBkYXRlOiBhY3Rpb24uZGF0ZVxuXG4gICMgc3RvcmUgYXMgYXBwcm9wcmlhdGVcbiAgaWYgd2lraS51c2VMb2NhbFN0b3JhZ2UoKSBvciBwYWdlUHV0SW5mby5zaXRlID09ICdsb2NhbCdcbiAgICBwdXNoVG9Mb2NhbChwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbilcbiAgICBwYWdlRWxlbWVudC5hZGRDbGFzcyhcImxvY2FsXCIpXG4gIGVsc2VcbiAgICBwdXNoVG9TZXJ2ZXIocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pXG5cbiIsInV0aWwgPSByZXF1aXJlKCcuL3V0aWwuY29mZmVlJylcbm1vZHVsZS5leHBvcnRzID0gcGx1Z2luID0ge31cblxuIyBUT0RPOiBSZW1vdmUgdGhlc2UgbWV0aG9kcyBmcm9tIHdpa2kgb2JqZWN0P1xuI1xuXG5zY3JpcHRzID0ge31cbmdldFNjcmlwdCA9IHdpa2kuZ2V0U2NyaXB0ID0gKHVybCwgY2FsbGJhY2sgPSAoKSAtPikgLT5cbiAgaWYgc2NyaXB0c1t1cmxdP1xuICAgIGNhbGxiYWNrKClcbiAgZWxzZVxuICAgICQuZ2V0U2NyaXB0KHVybClcbiAgICAgIC5kb25lIC0+XG4gICAgICAgIHNjcmlwdHNbdXJsXSA9IHRydWVcbiAgICAgICAgY2FsbGJhY2soKVxuICAgICAgLmZhaWwgLT5cbiAgICAgICAgY2FsbGJhY2soKVxuXG5wbHVnaW4uZ2V0ID0gd2lraS5nZXRQbHVnaW4gPSAobmFtZSwgY2FsbGJhY2spIC0+XG4gIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSkgaWYgd2luZG93LnBsdWdpbnNbbmFtZV1cbiAgZ2V0U2NyaXB0IFwiL3BsdWdpbnMvI3tuYW1lfS8je25hbWV9LmpzXCIsICgpIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKSBpZiB3aW5kb3cucGx1Z2luc1tuYW1lXVxuICAgIGdldFNjcmlwdCBcIi9wbHVnaW5zLyN7bmFtZX0uanNcIiwgKCkgLT5cbiAgICAgIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKVxuXG5wbHVnaW4uZG8gPSB3aWtpLmRvUGx1Z2luID0gKGRpdiwgaXRlbSwgZG9uZT0tPikgLT5cbiAgZXJyb3IgPSAoZXgpIC0+XG4gICAgZXJyb3JFbGVtZW50ID0gJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoJ2Vycm9yJylcbiAgICBlcnJvckVsZW1lbnQudGV4dChleC50b1N0cmluZygpKVxuICAgIGRpdi5hcHBlbmQoZXJyb3JFbGVtZW50KVxuXG4gIGRpdi5kYXRhICdwYWdlRWxlbWVudCcsIGRpdi5wYXJlbnRzKFwiLnBhZ2VcIilcbiAgZGl2LmRhdGEgJ2l0ZW0nLCBpdGVtXG4gIHBsdWdpbi5nZXQgaXRlbS50eXBlLCAoc2NyaXB0KSAtPlxuICAgIHRyeVxuICAgICAgdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgZmluZCBwbHVnaW4gZm9yICcje2l0ZW0udHlwZX0nXCIpIHVubGVzcyBzY3JpcHQ/XG4gICAgICBpZiBzY3JpcHQuZW1pdC5sZW5ndGggPiAyXG4gICAgICAgIHNjcmlwdC5lbWl0IGRpdiwgaXRlbSwgLT5cbiAgICAgICAgICBzY3JpcHQuYmluZCBkaXYsIGl0ZW1cbiAgICAgICAgICBkb25lKClcbiAgICAgIGVsc2VcbiAgICAgICAgc2NyaXB0LmVtaXQgZGl2LCBpdGVtXG4gICAgICAgIHNjcmlwdC5iaW5kIGRpdiwgaXRlbVxuICAgICAgICBkb25lKClcbiAgICBjYXRjaCBlcnJcbiAgICAgIHdpa2kubG9nICdwbHVnaW4gZXJyb3InLCBlcnJcbiAgICAgIGVycm9yKGVycilcbiAgICAgIGRvbmUoKVxuXG53aWtpLnJlZ2lzdGVyUGx1Z2luID0gKHBsdWdpbk5hbWUscGx1Z2luRm4pLT5cbiAgd2luZG93LnBsdWdpbnNbcGx1Z2luTmFtZV0gPSBwbHVnaW5GbigkKVxuXG5cbiMgUExVR0lOUyBmb3IgZWFjaCBzdG9yeSBpdGVtIHR5cGVcblxud2luZG93LnBsdWdpbnMgPVxuICBwYXJhZ3JhcGg6XG4gICAgZW1pdDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGZvciB0ZXh0IGluIGl0ZW0udGV4dC5zcGxpdCAvXFxuXFxuKy9cbiAgICAgICAgZGl2LmFwcGVuZCBcIjxwPiN7d2lraS5yZXNvbHZlTGlua3ModGV4dCl9PC9wPlwiIGlmIHRleHQubWF0Y2ggL1xcUy9cbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmRibGNsaWNrIC0+IHdpa2kudGV4dEVkaXRvciBkaXYsIGl0ZW0sIG51bGwsIHRydWVcbiAgaW1hZ2U6XG4gICAgZW1pdDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGl0ZW0udGV4dCB8fD0gaXRlbS5jYXB0aW9uXG4gICAgICBkaXYuYXBwZW5kIFwiPGltZyBjbGFzcz10aHVtYm5haWwgc3JjPVxcXCIje2l0ZW0udXJsfVxcXCI+IDxwPiN7d2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0KX08L3A+XCJcbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmRibGNsaWNrIC0+IHdpa2kudGV4dEVkaXRvciBkaXYsIGl0ZW1cbiAgICAgIGRpdi5maW5kKCdpbWcnKS5kYmxjbGljayAtPiB3aWtpLmRpYWxvZyBpdGVtLnRleHQsIHRoaXNcbiAgZnV0dXJlOlxuICAgIGVtaXQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBkaXYuYXBwZW5kIFwiXCJcIiN7aXRlbS50ZXh0fTxicj48YnI+PGJ1dHRvbiBjbGFzcz1cImNyZWF0ZVwiPmNyZWF0ZTwvYnV0dG9uPiBuZXcgYmxhbmsgcGFnZVwiXCJcIlxuICAgICAgaWYgKGluZm8gPSB3aWtpLm5laWdoYm9yaG9vZFtsb2NhdGlvbi5ob3N0XSk/IGFuZCBpbmZvLnNpdGVtYXA/XG4gICAgICAgIGZvciBpdGVtIGluIGluZm8uc2l0ZW1hcFxuICAgICAgICAgIGlmIGl0ZW0uc2x1Zy5tYXRjaCAvLXRlbXBsYXRlJC9cbiAgICAgICAgICAgIGRpdi5hcHBlbmQgXCJcIlwiPGJyPjxidXR0b24gY2xhc3M9XCJjcmVhdGVcIiBkYXRhLXNsdWc9I3tpdGVtLnNsdWd9PmNyZWF0ZTwvYnV0dG9uPiBmcm9tICN7d2lraS5yZXNvbHZlTGlua3MgXCJbWyN7aXRlbS50aXRsZX1dXVwifVwiXCJcIlxuICAgIGJpbmQ6IChkaXYsIGl0ZW0pIC0+XG4iLCJhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZS5jb2ZmZWUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlID0ge31cblxuIyBGVU5DVElPTlMgYW5kIEhBTkRMRVJTIHRvIG1hbmFnZSBsb2NhdGlvbiBiYXIgYW5kIGJhY2sgYnV0dG9uXG5cbnN0YXRlLnBhZ2VzSW5Eb20gPSAtPlxuICAkLm1ha2VBcnJheSAkKFwiLnBhZ2VcIikubWFwIChfLCBlbCkgLT4gZWwuaWRcblxuc3RhdGUudXJsUGFnZXMgPSAtPlxuICAoaSBmb3IgaSBpbiAkKGxvY2F0aW9uKS5hdHRyKCdwYXRobmFtZScpLnNwbGl0KCcvJykgYnkgMilbMS4uXVxuXG5zdGF0ZS5sb2NzSW5Eb20gPSAtPlxuICAkLm1ha2VBcnJheSAkKFwiLnBhZ2VcIikubWFwIChfLCBlbCkgLT5cbiAgICAkKGVsKS5kYXRhKCdzaXRlJykgb3IgJ3ZpZXcnXG5cbnN0YXRlLnVybExvY3MgPSAtPlxuICAoaiBmb3IgaiBpbiAkKGxvY2F0aW9uKS5hdHRyKCdwYXRobmFtZScpLnNwbGl0KCcvJylbMS4uXSBieSAyKVxuXG5zdGF0ZS5zZXRVcmwgPSAtPlxuICBkb2N1bWVudC50aXRsZSA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJyk/LnRpdGxlXG4gIGlmIGhpc3RvcnkgYW5kIGhpc3RvcnkucHVzaFN0YXRlXG4gICAgbG9jcyA9IHN0YXRlLmxvY3NJbkRvbSgpXG4gICAgcGFnZXMgPSBzdGF0ZS5wYWdlc0luRG9tKClcbiAgICB1cmwgPSAoXCIvI3tsb2NzP1tpZHhdIG9yICd2aWV3J30vI3twYWdlfVwiIGZvciBwYWdlLCBpZHggaW4gcGFnZXMpLmpvaW4oJycpXG4gICAgdW5sZXNzIHVybCBpcyAkKGxvY2F0aW9uKS5hdHRyKCdwYXRobmFtZScpXG4gICAgICBoaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCB1cmwpXG5cbnN0YXRlLnNob3cgPSAoZSkgLT5cbiAgb2xkUGFnZXMgPSBzdGF0ZS5wYWdlc0luRG9tKClcbiAgbmV3UGFnZXMgPSBzdGF0ZS51cmxQYWdlcygpXG4gIG9sZExvY3MgPSBzdGF0ZS5sb2NzSW5Eb20oKVxuICBuZXdMb2NzID0gc3RhdGUudXJsTG9jcygpXG5cbiAgcmV0dXJuIGlmICghbG9jYXRpb24ucGF0aG5hbWUgb3IgbG9jYXRpb24ucGF0aG5hbWUgaXMgJy8nKVxuXG4gIHByZXZpb3VzID0gJCgnLnBhZ2UnKS5lcSgwKVxuXG4gIGZvciBuYW1lLCBpZHggaW4gbmV3UGFnZXNcbiAgICB1bmxlc3MgbmFtZSBpcyBvbGRQYWdlc1tpZHhdXG4gICAgICBvbGQgPSAkKCcucGFnZScpLmVxKGlkeClcbiAgICAgIG9sZC5yZW1vdmUoKSBpZiBvbGRcbiAgICAgIHdpa2kuY3JlYXRlUGFnZShuYW1lLCBuZXdMb2NzW2lkeF0pLmluc2VydEFmdGVyKHByZXZpb3VzKS5lYWNoIHdpa2kucmVmcmVzaFxuICAgIHByZXZpb3VzID0gJCgnLnBhZ2UnKS5lcShpZHgpXG5cbiAgcHJldmlvdXMubmV4dEFsbCgpLnJlbW92ZSgpXG5cbiAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcbiAgZG9jdW1lbnQudGl0bGUgPSAkKCcucGFnZTpsYXN0JykuZGF0YSgnZGF0YScpPy50aXRsZVxuXG5zdGF0ZS5maXJzdCA9IC0+XG4gIHN0YXRlLnNldFVybCgpXG4gIGZpcnN0VXJsUGFnZXMgPSBzdGF0ZS51cmxQYWdlcygpXG4gIGZpcnN0VXJsTG9jcyA9IHN0YXRlLnVybExvY3MoKVxuICBvbGRQYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICBmb3IgdXJsUGFnZSwgaWR4IGluIGZpcnN0VXJsUGFnZXMgd2hlbiB1cmxQYWdlIG5vdCBpbiBvbGRQYWdlc1xuICAgIHdpa2kuY3JlYXRlUGFnZSh1cmxQYWdlLCBmaXJzdFVybExvY3NbaWR4XSkuYXBwZW5kVG8oJy5tYWluJykgdW5sZXNzIHVybFBhZ2UgaXMgJydcblxuIiwidXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5jb2ZmZWUnKVxucGFnZUhhbmRsZXIgPSByZXF1aXJlKCcuL3BhZ2VIYW5kbGVyLmNvZmZlZScpXG5wbHVnaW4gPSByZXF1aXJlKCcuL3BsdWdpbi5jb2ZmZWUnKVxuc3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlLmNvZmZlZScpXG5uZWlnaGJvcmhvb2QgPSByZXF1aXJlKCcuL25laWdoYm9yaG9vZC5jb2ZmZWUnKVxuYWRkVG9Kb3VybmFsID0gcmVxdWlyZSgnLi9hZGRUb0pvdXJuYWwuY29mZmVlJylcbndpa2kgPSByZXF1aXJlKCcuL3dpa2kuY29mZmVlJylcblxuaGFuZGxlRHJhZ2dpbmcgPSAoZXZ0LCB1aSkgLT5cbiAgaXRlbUVsZW1lbnQgPSB1aS5pdGVtXG5cbiAgaXRlbSA9IHdpa2kuZ2V0SXRlbShpdGVtRWxlbWVudClcbiAgdGhpc1BhZ2VFbGVtZW50ID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIHNvdXJjZVBhZ2VFbGVtZW50ID0gaXRlbUVsZW1lbnQuZGF0YSgncGFnZUVsZW1lbnQnKVxuICBzb3VyY2VTaXRlID0gc291cmNlUGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpXG5cbiAgZGVzdGluYXRpb25QYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnBhcmVudHMoJy5wYWdlOmZpcnN0JylcbiAgZXF1YWxzID0gKGEsIGIpIC0+IGEgYW5kIGIgYW5kIGEuZ2V0KDApID09IGIuZ2V0KDApXG5cbiAgbW92ZVdpdGhpblBhZ2UgPSBub3Qgc291cmNlUGFnZUVsZW1lbnQgb3IgZXF1YWxzKHNvdXJjZVBhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KVxuICBtb3ZlRnJvbVBhZ2UgPSBub3QgbW92ZVdpdGhpblBhZ2UgYW5kIGVxdWFscyh0aGlzUGFnZUVsZW1lbnQsIHNvdXJjZVBhZ2VFbGVtZW50KVxuICBtb3ZlVG9QYWdlID0gbm90IG1vdmVXaXRoaW5QYWdlIGFuZCBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KVxuXG4gIGlmIG1vdmVGcm9tUGFnZVxuICAgIGlmIHNvdXJjZVBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdnaG9zdCcpIG9yXG4gICAgICBzb3VyY2VQYWdlRWxlbWVudC5hdHRyKCdpZCcpID09IGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQuYXR0cignaWQnKVxuICAgICAgICAjIHN0ZW0gdGhlIGRhbWFnZSwgYmV0dGVyIGlkZWFzIGhlcmU6XG4gICAgICAgICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zOTE2MDg5L2pxdWVyeS11aS1zb3J0YWJsZXMtY29ubmVjdC1saXN0cy1jb3B5LWl0ZW1zXG4gICAgICAgIHJldHVyblxuXG4gIGFjdGlvbiA9IGlmIG1vdmVXaXRoaW5QYWdlXG4gICAgb3JkZXIgPSAkKHRoaXMpLmNoaWxkcmVuKCkubWFwKChfLCB2YWx1ZSkgLT4gJCh2YWx1ZSkuYXR0cignZGF0YS1pZCcpKS5nZXQoKVxuICAgIHt0eXBlOiAnbW92ZScsIG9yZGVyOiBvcmRlcn1cbiAgZWxzZSBpZiBtb3ZlRnJvbVBhZ2VcbiAgICB3aWtpLmxvZyAnZHJhZyBmcm9tJywgc291cmNlUGFnZUVsZW1lbnQuZmluZCgnaDEnKS50ZXh0KClcbiAgICB7dHlwZTogJ3JlbW92ZSd9XG4gIGVsc2UgaWYgbW92ZVRvUGFnZVxuICAgIGl0ZW1FbGVtZW50LmRhdGEgJ3BhZ2VFbGVtZW50JywgdGhpc1BhZ2VFbGVtZW50XG4gICAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJylcbiAgICBiZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudClcbiAgICB7dHlwZTogJ2FkZCcsIGl0ZW06IGl0ZW0sIGFmdGVyOiBiZWZvcmU/LmlkfVxuICBhY3Rpb24uaWQgPSBpdGVtLmlkXG4gIHBhZ2VIYW5kbGVyLnB1dCB0aGlzUGFnZUVsZW1lbnQsIGFjdGlvblxuXG5pbml0RHJhZ2dpbmcgPSAoJHBhZ2UpIC0+XG4gICRzdG9yeSA9ICRwYWdlLmZpbmQoJy5zdG9yeScpXG4gICRzdG9yeS5zb3J0YWJsZShjb25uZWN0V2l0aDogJy5wYWdlIC5zdG9yeScpLm9uKFwic29ydHVwZGF0ZVwiLCBoYW5kbGVEcmFnZ2luZylcblxuXG5pbml0QWRkQnV0dG9uID0gKCRwYWdlKSAtPlxuICAkcGFnZS5maW5kKFwiLmFkZC1mYWN0b3J5XCIpLmxpdmUgXCJjbGlja1wiLCAoZXZ0KSAtPlxuICAgIHJldHVybiBpZiAkcGFnZS5oYXNDbGFzcyAnZ2hvc3QnXG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgICBjcmVhdGVGYWN0b3J5KCRwYWdlKVxuXG5jcmVhdGVGYWN0b3J5ID0gKCRwYWdlKSAtPlxuICBpdGVtID1cbiAgICB0eXBlOiBcImZhY3RvcnlcIlxuICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gIGl0ZW1FbGVtZW50ID0gJChcIjxkaXYgLz5cIiwgY2xhc3M6IFwiaXRlbSBmYWN0b3J5XCIpLmRhdGEoJ2l0ZW0nLGl0ZW0pLmF0dHIoJ2RhdGEtaWQnLCBpdGVtLmlkKVxuICBpdGVtRWxlbWVudC5kYXRhICdwYWdlRWxlbWVudCcsICRwYWdlXG4gICRwYWdlLmZpbmQoXCIuc3RvcnlcIikuYXBwZW5kKGl0ZW1FbGVtZW50KVxuICBwbHVnaW4uZG8gaXRlbUVsZW1lbnQsIGl0ZW1cbiAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJylcbiAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpXG4gIHBhZ2VIYW5kbGVyLnB1dCAkcGFnZSwge2l0ZW06IGl0ZW0sIGlkOiBpdGVtLmlkLCB0eXBlOiBcImFkZFwiLCBhZnRlcjogYmVmb3JlPy5pZH1cblxuYnVpbGRQYWdlSGVhZGVyID0gKHtwYWdlLHRvb2x0aXAsaGVhZGVyX2hyZWYsZmF2aWNvbl9zcmN9KS0+XG4gIHRvb2x0aXAgKz0gXCJcXG4je3BhZ2UucGx1Z2lufSBwbHVnaW5cIiBpZiBwYWdlLnBsdWdpblxuICBcIlwiXCI8aDEgdGl0bGU9XCIje3Rvb2x0aXB9XCI+PGEgaHJlZj1cIiN7aGVhZGVyX2hyZWZ9XCI+PGltZyBzcmM9XCIje2Zhdmljb25fc3JjfVwiIGhlaWdodD1cIjMycHhcIiBjbGFzcz1cImZhdmljb25cIj48L2E+ICN7cGFnZS50aXRsZX08L2gxPlwiXCJcIlxuXG5lbWl0SGVhZGVyID0gKCRoZWFkZXIsICRwYWdlLCBwYWdlKSAtPlxuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpXG4gIGlzUmVtb3RlUGFnZSA9IHNpdGU/IGFuZCBzaXRlICE9ICdsb2NhbCcgYW5kIHNpdGUgIT0gJ29yaWdpbicgYW5kIHNpdGUgIT0gJ3ZpZXcnXG4gIGhlYWRlciA9ICcnXG5cbiAgdmlld0hlcmUgPSBpZiB3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKSBpcyAnd2VsY29tZS12aXNpdG9ycycgdGhlbiBcIlwiXG4gIGVsc2UgXCIvdmlldy8je3dpa2kuYXNTbHVnKHBhZ2UudGl0bGUpfVwiXG4gIHBhZ2VIZWFkZXIgPSBpZiBpc1JlbW90ZVBhZ2VcbiAgICBidWlsZFBhZ2VIZWFkZXJcbiAgICAgIHRvb2x0aXA6IHNpdGVcbiAgICAgIGhlYWRlcl9ocmVmOiBcIi8vI3tzaXRlfS92aWV3L3dlbGNvbWUtdmlzaXRvcnMje3ZpZXdIZXJlfVwiXG4gICAgICBmYXZpY29uX3NyYzogXCJodHRwOi8vI3tzaXRlfS9mYXZpY29uLnBuZ1wiXG4gICAgICBwYWdlOiBwYWdlXG4gIGVsc2VcbiAgICBidWlsZFBhZ2VIZWFkZXJcbiAgICAgIHRvb2x0aXA6IGxvY2F0aW9uLmhvc3RcbiAgICAgIGhlYWRlcl9ocmVmOiBcIi92aWV3L3dlbGNvbWUtdmlzaXRvcnMje3ZpZXdIZXJlfVwiXG4gICAgICBmYXZpY29uX3NyYzogXCIvZmF2aWNvbi5wbmdcIlxuICAgICAgcGFnZTogcGFnZVxuXG4gICRoZWFkZXIuYXBwZW5kKCBwYWdlSGVhZGVyIClcbiAgXG4gIHVubGVzcyBpc1JlbW90ZVBhZ2VcbiAgICAkKCdpbWcuZmF2aWNvbicsJHBhZ2UpLmVycm9yIChlKS0+XG4gICAgICBwbHVnaW4uZ2V0ICdmYXZpY29uJywgKGZhdmljb24pIC0+XG4gICAgICAgIGZhdmljb24uY3JlYXRlKClcblxuICBpZiAkcGFnZS5hdHRyKCdpZCcpLm1hdGNoIC9fcmV2L1xuICAgIHJldiA9IHBhZ2Uuam91cm5hbC5sZW5ndGgtMVxuICAgIGRhdGUgPSBwYWdlLmpvdXJuYWxbcmV2XS5kYXRlXG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ2dob3N0JykuZGF0YSgncmV2JyxyZXYpXG4gICAgJGhlYWRlci5hcHBlbmQgJCBcIlwiXCJcbiAgICAgIDxoMiBjbGFzcz1cInJldmlzaW9uXCI+XG4gICAgICAgIDxzcGFuPlxuICAgICAgICAgICN7aWYgZGF0ZT8gdGhlbiB1dGlsLmZvcm1hdERhdGUoZGF0ZSkgZWxzZSBcIlJldmlzaW9uICN7cmV2fVwifVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2gyPlxuICAgIFwiXCJcIlxuXG5lbWl0VHdpbnMgPSB3aWtpLmVtaXRUd2lucyA9ICgkcGFnZSkgLT5cbiAgcGFnZSA9ICRwYWdlLmRhdGEgJ2RhdGEnXG4gIHNpdGUgPSAkcGFnZS5kYXRhKCdzaXRlJykgb3Igd2luZG93LmxvY2F0aW9uLmhvc3RcbiAgc2l0ZSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0IGlmIHNpdGUgaW4gWyd2aWV3JywgJ29yaWdpbiddXG4gIHNsdWcgPSB3aWtpLmFzU2x1ZyBwYWdlLnRpdGxlXG4gIGlmIChhY3Rpb25zID0gcGFnZS5qb3VybmFsPy5sZW5ndGgpPyBhbmQgKHZpZXdpbmcgPSBwYWdlLmpvdXJuYWxbYWN0aW9ucy0xXT8uZGF0ZSk/XG4gICAgdmlld2luZyA9IE1hdGguZmxvb3Iodmlld2luZy8xMDAwKSoxMDAwXG4gICAgYmlucyA9IHtuZXdlcjpbXSwgc2FtZTpbXSwgb2xkZXI6W119XG4gICAgIyB7ZmVkLndpa2kub3JnOiBbe3NsdWc6IFwiaGFwcGVuaW5nc1wiLCB0aXRsZTogXCJIYXBwZW5pbmdzXCIsIGRhdGU6IDEzNTg5NzUzMDMwMDAsIHN5bm9wc2lzOiBcIkNoYW5nZXMgaGVyZSAuLi5cIn1dfVxuICAgIGZvciByZW1vdGVTaXRlLCBpbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgICBpZiByZW1vdGVTaXRlICE9IHNpdGUgYW5kIGluZm8uc2l0ZW1hcD9cbiAgICAgICAgZm9yIGl0ZW0gaW4gaW5mby5zaXRlbWFwXG4gICAgICAgICAgaWYgaXRlbS5zbHVnID09IHNsdWdcbiAgICAgICAgICAgIGJpbiA9IGlmIGl0ZW0uZGF0ZSA+IHZpZXdpbmcgdGhlbiBiaW5zLm5ld2VyXG4gICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZGF0ZSA8IHZpZXdpbmcgdGhlbiBiaW5zLm9sZGVyXG4gICAgICAgICAgICBlbHNlIGJpbnMuc2FtZVxuICAgICAgICAgICAgYmluLnB1c2gge3JlbW90ZVNpdGUsIGl0ZW19XG4gICAgdHdpbnMgPSBbXVxuICAgICMge25ld2VyOltyZW1vdGVTaXRlOiBcImZlZC53aWtpLm9yZ1wiLCBpdGVtOiB7c2x1ZzogLi4uLCBkYXRlOiAuLi59LCAuLi5dfVxuICAgIGZvciBsZWdlbmQsIGJpbiBvZiBiaW5zXG4gICAgICBjb250aW51ZSB1bmxlc3MgYmluLmxlbmd0aFxuICAgICAgYmluLnNvcnQgKGEsYikgLT5cbiAgICAgICAgYS5pdGVtLmRhdGUgPCBiLml0ZW0uZGF0ZVxuICAgICAgZmxhZ3MgPSBmb3Ige3JlbW90ZVNpdGUsIGl0ZW19LCBpIGluIGJpblxuICAgICAgICBicmVhayBpZiBpID49IDhcbiAgICAgICAgXCJcIlwiPGltZyBjbGFzcz1cInJlbW90ZVwiXG4gICAgICAgICAgc3JjPVwiaHR0cDovLyN7cmVtb3RlU2l0ZX0vZmF2aWNvbi5wbmdcIlxuICAgICAgICAgIGRhdGEtc2x1Zz1cIiN7c2x1Z31cIlxuICAgICAgICAgIGRhdGEtc2l0ZT1cIiN7cmVtb3RlU2l0ZX1cIlxuICAgICAgICAgIHRpdGxlPVwiI3tyZW1vdGVTaXRlfVwiPlxuICAgICAgICBcIlwiXCJcbiAgICAgIHR3aW5zLnB1c2ggXCIje2ZsYWdzLmpvaW4gJyZuYnNwOyd9ICN7bGVnZW5kfVwiXG4gICAgJHBhZ2UuZmluZCgnLnR3aW5zJykuaHRtbCBcIlwiXCI8cD4je3R3aW5zLmpvaW4gXCIsIFwifTwvcD5cIlwiXCIgaWYgdHdpbnNcblxucmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCA9IChwYWdlRGF0YSwkcGFnZSwgc2l0ZUZvdW5kKSAtPlxuICBwYWdlID0gJC5leHRlbmQodXRpbC5lbXB0eVBhZ2UoKSwgcGFnZURhdGEpXG4gICRwYWdlLmRhdGEoXCJkYXRhXCIsIHBhZ2UpXG4gIHNsdWcgPSAkcGFnZS5hdHRyKCdpZCcpXG4gIHNpdGUgPSAkcGFnZS5kYXRhKCdzaXRlJylcblxuICBjb250ZXh0ID0gWyd2aWV3J11cbiAgY29udGV4dC5wdXNoIHNpdGUgaWYgc2l0ZT9cbiAgYWRkQ29udGV4dCA9IChzaXRlKSAtPiBjb250ZXh0LnB1c2ggc2l0ZSBpZiBzaXRlPyBhbmQgbm90IF8uaW5jbHVkZSBjb250ZXh0LCBzaXRlXG4gIGFkZENvbnRleHQgYWN0aW9uLnNpdGUgZm9yIGFjdGlvbiBpbiBwYWdlLmpvdXJuYWwuc2xpY2UoMCkucmV2ZXJzZSgpXG5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dCA9IGNvbnRleHRcblxuICAkcGFnZS5lbXB0eSgpXG4gIFskdHdpbnMsICRoZWFkZXIsICRzdG9yeSwgJGpvdXJuYWwsICRmb290ZXJdID0gWyd0d2lucycsICdoZWFkZXInLCAnc3RvcnknLCAnam91cm5hbCcsICdmb290ZXInXS5tYXAgKGNsYXNzTmFtZSkgLT5cbiAgICAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcyhjbGFzc05hbWUpLmFwcGVuZFRvKCRwYWdlKVxuXG4gIGVtaXRIZWFkZXIgJGhlYWRlciwgJHBhZ2UsIHBhZ2VcblxuICBlbWl0SXRlbSA9IChpKSAtPlxuICAgIHJldHVybiBpZiBpID49IHBhZ2Uuc3RvcnkubGVuZ3RoXG4gICAgaXRlbSA9IHBhZ2Uuc3RvcnlbaV1cbiAgICBpZiBpdGVtPy50eXBlIGFuZCBpdGVtPy5pZFxuICAgICAgJGl0ZW0gPSAkIFwiXCJcIjxkaXYgY2xhc3M9XCJpdGVtICN7aXRlbS50eXBlfVwiIGRhdGEtaWQ9XCIje2l0ZW0uaWR9XCI+XCJcIlwiXG4gICAgICAkc3RvcnkuYXBwZW5kICRpdGVtXG4gICAgICBwbHVnaW4uZG8gJGl0ZW0sIGl0ZW0sIC0+IGVtaXRJdGVtIGkrMVxuICAgIGVsc2VcbiAgICAgICRzdG9yeS5hcHBlbmQgJCBcIlwiXCI8ZGl2PjxwIGNsYXNzPVwiZXJyb3JcIj5DYW4ndCBtYWtlIHNlbnNlIG9mIHN0b3J5WyN7aX1dPC9wPjwvZGl2PlwiXCJcIlxuICAgICAgZW1pdEl0ZW0gaSsxXG4gIGVtaXRJdGVtIDBcblxuICBmb3IgYWN0aW9uIGluIHBhZ2Uuam91cm5hbFxuICAgIGFkZFRvSm91cm5hbCAkam91cm5hbCwgYWN0aW9uXG5cbiAgZW1pdFR3aW5zICRwYWdlXG5cbiAgJGpvdXJuYWwuYXBwZW5kIFwiXCJcIlxuICAgIDxkaXYgY2xhc3M9XCJjb250cm9sLWJ1dHRvbnNcIj5cbiAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidXR0b24gZm9yay1wYWdlXCIgdGl0bGU9XCJmb3JrIHRoaXMgcGFnZVwiPiN7dXRpbC5zeW1ib2xzWydmb3JrJ119PC9hPlxuICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzcz1cImJ1dHRvbiBhZGQtZmFjdG9yeVwiIHRpdGxlPVwiYWRkIHBhcmFncmFwaFwiPiN7dXRpbC5zeW1ib2xzWydhZGQnXX08L2E+XG4gICAgPC9kaXY+XG4gIFwiXCJcIlxuXG4gICRmb290ZXIuYXBwZW5kIFwiXCJcIlxuICAgIDxhIGlkPVwibGljZW5zZVwiIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvXCI+Q0MgQlktU0EgMy4wPC9hPiAuXG4gICAgPGEgY2xhc3M9XCJzaG93LXBhZ2Utc291cmNlXCIgaHJlZj1cIi8je3NsdWd9Lmpzb24/cmFuZG9tPSN7dXRpbC5yYW5kb21CeXRlcyg0KX1cIiB0aXRsZT1cInNvdXJjZVwiPkpTT048L2E+IC5cbiAgICA8YSBocmVmPSBcIi8vI3tzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdH0vI3tzbHVnfS5odG1sXCI+I3tzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdH08L2E+XG4gIFwiXCJcIlxuXG5cbndpa2kuYnVpbGRQYWdlID0gKGRhdGEsc2l0ZUZvdW5kLCRwYWdlKSAtPlxuXG4gIGlmIHNpdGVGb3VuZCA9PSAnbG9jYWwnXG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ2xvY2FsJylcbiAgZWxzZSBpZiBzaXRlRm91bmRcbiAgICBzaXRlRm91bmQgPSAnb3JpZ2luJyBpZiBzaXRlRm91bmQgaXMgd2luZG93LmxvY2F0aW9uLmhvc3RcbiAgICAkcGFnZS5hZGRDbGFzcygncmVtb3RlJykgdW5sZXNzIHNpdGVGb3VuZCBpbiBbJ3ZpZXcnLCAnb3JpZ2luJ11cbiAgICAkcGFnZS5kYXRhKCdzaXRlJywgc2l0ZUZvdW5kKVxuICBpZiBkYXRhLnBsdWdpbj9cbiAgICAkcGFnZS5hZGRDbGFzcygncGx1Z2luJylcblxuICAjVE9ETzogYXZvaWQgcGFzc2luZyBzaXRlRm91bmRcbiAgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCggZGF0YSwgJHBhZ2UsIHNpdGVGb3VuZCApXG5cbiAgc3RhdGUuc2V0VXJsKClcblxuICBpbml0RHJhZ2dpbmcgJHBhZ2VcbiAgaW5pdEFkZEJ1dHRvbiAkcGFnZVxuICAkcGFnZVxuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVmcmVzaCA9IHdpa2kucmVmcmVzaCA9IC0+XG4gICRwYWdlID0gJCh0aGlzKVxuXG4gIFtzbHVnLCByZXZdID0gJHBhZ2UuYXR0cignaWQnKS5zcGxpdCgnX3JldicpXG4gIHBhZ2VJbmZvcm1hdGlvbiA9IHtcbiAgICBzbHVnOiBzbHVnXG4gICAgcmV2OiByZXZcbiAgICBzaXRlOiAkcGFnZS5kYXRhKCdzaXRlJylcbiAgfVxuXG4gIGNyZWF0ZUdob3N0UGFnZSA9IC0+XG4gICAgdGl0bGUgPSAkKFwiXCJcImFbaHJlZj1cIi8je3NsdWd9Lmh0bWxcIl06bGFzdFwiXCJcIikudGV4dCgpIG9yIHNsdWdcbiAgICBwYWdlID1cbiAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICAnc3RvcnknOiBbXG4gICAgICAgICdpZCc6IHV0aWwucmFuZG9tQnl0ZXMgOFxuICAgICAgICAndHlwZSc6ICdmdXR1cmUnXG4gICAgICAgICd0ZXh0JzogJ1dlIGNvdWxkIG5vdCBmaW5kIHRoaXMgcGFnZS4nXG4gICAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICBdXG4gICAgaGVhZGluZyA9XG4gICAgICAndHlwZSc6ICdwYXJhZ3JhcGgnXG4gICAgICAnaWQnOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAndGV4dCc6IFwiV2UgZGlkIGZpbmQgdGhlIHBhZ2UgaW4geW91ciBjdXJyZW50IG5laWdoYm9yaG9vZC5cIlxuICAgIGhpdHMgPSBbXVxuICAgIGZvciBzaXRlLCBpbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgICBpZiBpbmZvLnNpdGVtYXA/XG4gICAgICAgIHJlc3VsdCA9IF8uZmluZCBpbmZvLnNpdGVtYXAsIChlYWNoKSAtPlxuICAgICAgICAgIGVhY2guc2x1ZyA9PSBzbHVnXG4gICAgICAgIGlmIHJlc3VsdD9cbiAgICAgICAgICBoaXRzLnB1c2hcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInJlZmVyZW5jZVwiXG4gICAgICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgICAgICAgIFwic2l0ZVwiOiBzaXRlXG4gICAgICAgICAgICBcInNsdWdcIjogc2x1Z1xuICAgICAgICAgICAgXCJ0aXRsZVwiOiByZXN1bHQudGl0bGUgfHwgc2x1Z1xuICAgICAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5zeW5vcHNpcyB8fCAnJ1xuICAgIGlmIGhpdHMubGVuZ3RoID4gMFxuICAgICAgcGFnZS5zdG9yeS5wdXNoIGhlYWRpbmcsIGhpdHMuLi5cbiAgICAgIHBhZ2Uuc3RvcnlbMF0udGV4dCA9ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UgaW4gdGhlIGV4cGVjdGVkIGNvbnRleHQuJ1xuXG4gICAgd2lraS5idWlsZFBhZ2UoIHBhZ2UsIHVuZGVmaW5lZCwgJHBhZ2UgKS5hZGRDbGFzcygnZ2hvc3QnKVxuXG4gIHJlZ2lzdGVyTmVpZ2hib3JzID0gKGRhdGEsIHNpdGUpIC0+XG4gICAgaWYgXy5pbmNsdWRlIFsnbG9jYWwnLCAnb3JpZ2luJywgJ3ZpZXcnLCBudWxsLCB1bmRlZmluZWRdLCBzaXRlXG4gICAgICBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciBsb2NhdGlvbi5ob3N0XG4gICAgZWxzZVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3Igc2l0ZVxuICAgIGZvciBpdGVtIGluIChkYXRhLnN0b3J5IHx8IFtdKVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgaXRlbS5zaXRlIGlmIGl0ZW0uc2l0ZT9cbiAgICBmb3IgYWN0aW9uIGluIChkYXRhLmpvdXJuYWwgfHwgW10pXG4gICAgICBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciBhY3Rpb24uc2l0ZSBpZiBhY3Rpb24uc2l0ZT9cblxuICB3aGVuR290dGVuID0gKGRhdGEsc2l0ZUZvdW5kKSAtPlxuICAgIHdpa2kuYnVpbGRQYWdlKCBkYXRhLCBzaXRlRm91bmQsICRwYWdlIClcbiAgICByZWdpc3Rlck5laWdoYm9ycyggZGF0YSwgc2l0ZUZvdW5kIClcblxuICBwYWdlSGFuZGxlci5nZXRcbiAgICB3aGVuR290dGVuOiB3aGVuR290dGVuXG4gICAgd2hlbk5vdEdvdHRlbjogY3JlYXRlR2hvc3RQYWdlXG4gICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cblxuIiwiIyAqKnJldmlzaW9uLmNvZmZlZSoqXG4jIFRoaXMgbW9kdWxlIGdlbmVyYXRlcyBhIHBhc3QgcmV2aXNpb24gb2YgYSBkYXRhIGZpbGUgYW5kIGNhY2hlcyBpdCBpbiAnZGF0YS9yZXYnLlxuI1xuIyBUaGUgc2F2ZWQgZmlsZSBoYXMgdGhlIG5hbWUgb2YgdGhlIGlkIG9mIHRoZSBwb2ludCBpbiB0aGUgam91cm5hbCdzIGhpc3RvcnlcbiMgdGhhdCB0aGUgcmV2aXNpb24gcmVwcmVzZW50cy5cblxuY3JlYXRlID0gKHJldkluZGV4LCBkYXRhKSAtPlxuICBqb3VybmFsID0gZGF0YS5qb3VybmFsXG4gIHJldlRpdGxlID0gZGF0YS50aXRsZVxuICByZXZTdG9yeSA9IFtdXG4gIHJldkpvdXJuYWwgPSBqb3VybmFsWzAuLigrcmV2SW5kZXgpXVxuICBmb3Igam91cm5hbEVudHJ5IGluIHJldkpvdXJuYWxcbiAgICByZXZTdG9yeUlkcyA9IHJldlN0b3J5Lm1hcCAoc3RvcnlJdGVtKSAtPiBzdG9yeUl0ZW0uaWRcbiAgICBzd2l0Y2ggam91cm5hbEVudHJ5LnR5cGVcbiAgICAgIHdoZW4gJ2NyZWF0ZSdcbiAgICAgICAgaWYgam91cm5hbEVudHJ5Lml0ZW0udGl0bGU/XG4gICAgICAgICAgcmV2VGl0bGUgPSBqb3VybmFsRW50cnkuaXRlbS50aXRsZVxuICAgICAgICAgIHJldlN0b3J5ID0gam91cm5hbEVudHJ5Lml0ZW0uc3RvcnkgfHwgW11cbiAgICAgIHdoZW4gJ2FkZCdcbiAgICAgICAgaWYgKGFmdGVySW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5hZnRlcikgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UoYWZ0ZXJJbmRleCsxLDAsam91cm5hbEVudHJ5Lml0ZW0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXZTdG9yeS5wdXNoIGpvdXJuYWxFbnRyeS5pdGVtXG4gICAgICB3aGVuICdlZGl0J1xuICAgICAgICBpZiAoZWRpdEluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuaWQpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGVkaXRJbmRleCwxLGpvdXJuYWxFbnRyeS5pdGVtKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV2U3RvcnkucHVzaCBqb3VybmFsRW50cnkuaXRlbVxuICAgICAgd2hlbiAnbW92ZSdcbiAgICAgICAgaXRlbXMgPSB7fVxuICAgICAgICBmb3Igc3RvcnlJdGVtIGluIHJldlN0b3J5XG4gICAgICAgICAgaXRlbXNbc3RvcnlJdGVtLmlkXSA9IHN0b3J5SXRlbVxuICAgICAgICByZXZTdG9yeSA9IFtdXG4gICAgICAgIGZvciBpdGVtSWQgaW4gam91cm5hbEVudHJ5Lm9yZGVyXG4gICAgICAgICAgcmV2U3RvcnkucHVzaChpdGVtc1tpdGVtSWRdKSBpZiBpdGVtc1tpdGVtSWRdP1xuICAgICAgd2hlbiAncmVtb3ZlJ1xuICAgICAgICBpZiAocmVtb3ZlSW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5pZCkgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UocmVtb3ZlSW5kZXgsMSlcbiAgICAgICN3aGVuICdmb3JrJyAgICMgZG8gbm90aGluZyB3aGVuIGZvcmtcbiAgcmV0dXJuIHtzdG9yeTogcmV2U3RvcnksIGpvdXJuYWw6IHJldkpvdXJuYWwsIHRpdGxlOiByZXZUaXRsZX1cblxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGUiLCJ1dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoam91cm5hbEVsZW1lbnQsIGFjdGlvbikgLT5cbiAgcGFnZUVsZW1lbnQgPSBqb3VybmFsRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIHByZXYgPSBqb3VybmFsRWxlbWVudC5maW5kKFwiLmVkaXRbZGF0YS1pZD0je2FjdGlvbi5pZCB8fCAwfV1cIikgaWYgYWN0aW9uLnR5cGUgPT0gJ2VkaXQnXG4gIGFjdGlvblRpdGxlID0gYWN0aW9uLnR5cGVcbiAgYWN0aW9uVGl0bGUgKz0gXCIgI3t1dGlsLmZvcm1hdEVsYXBzZWRUaW1lKGFjdGlvbi5kYXRlKX1cIiBpZiBhY3Rpb24uZGF0ZT9cbiAgYWN0aW9uRWxlbWVudCA9ICQoXCJcIlwiPGEgaHJlZj1cIiNcIiAvPiBcIlwiXCIpLmFkZENsYXNzKFwiYWN0aW9uXCIpLmFkZENsYXNzKGFjdGlvbi50eXBlKVxuICAgIC50ZXh0KHV0aWwuc3ltYm9sc1thY3Rpb24udHlwZV0pXG4gICAgLmF0dHIoJ3RpdGxlJyxhY3Rpb25UaXRsZSlcbiAgICAuYXR0cignZGF0YS1pZCcsIGFjdGlvbi5pZCB8fCBcIjBcIilcbiAgICAuZGF0YSgnYWN0aW9uJywgYWN0aW9uKVxuICBjb250cm9scyA9IGpvdXJuYWxFbGVtZW50LmNoaWxkcmVuKCcuY29udHJvbC1idXR0b25zJylcbiAgaWYgY29udHJvbHMubGVuZ3RoID4gMFxuICAgIGFjdGlvbkVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbnRyb2xzKVxuICBlbHNlXG4gICAgYWN0aW9uRWxlbWVudC5hcHBlbmRUbyhqb3VybmFsRWxlbWVudClcbiAgaWYgYWN0aW9uLnR5cGUgPT0gJ2ZvcmsnIGFuZCBhY3Rpb24uc2l0ZT9cbiAgICBhY3Rpb25FbGVtZW50XG4gICAgICAuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLCBcInVybCgvLyN7YWN0aW9uLnNpdGV9L2Zhdmljb24ucG5nKVwiKVxuICAgICAgLmF0dHIoXCJocmVmXCIsIFwiLy8je2FjdGlvbi5zaXRlfS8je3BhZ2VFbGVtZW50LmF0dHIoJ2lkJyl9Lmh0bWxcIilcbiAgICAgIC5kYXRhKFwic2l0ZVwiLCBhY3Rpb24uc2l0ZSlcbiAgICAgIC5kYXRhKFwic2x1Z1wiLCBwYWdlRWxlbWVudC5hdHRyKCdpZCcpKVxuXG4iLCJhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZS5jb2ZmZWUnKVxudXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5jb2ZmZWUnKVxuY3JlYXRlU2VhcmNoID0gcmVxdWlyZSgnLi9zZWFyY2guY29mZmVlJylcblxubW9kdWxlLmV4cG9ydHMgPSBuZWlnaGJvcmhvb2QgPSB7fVxuXG5cbndpa2kubmVpZ2hib3Job29kID89IHt9XG5uZXh0QXZhaWxhYmxlRmV0Y2ggPSAwXG5uZXh0RmV0Y2hJbnRlcnZhbCA9IDIwMDBcblxucG9wdWxhdGVTaXRlSW5mb0ZvciA9IChzaXRlLG5laWdoYm9ySW5mbyktPlxuICByZXR1cm4gaWYgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHRcbiAgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSB0cnVlXG5cbiAgdHJhbnNpdGlvbiA9IChzaXRlLCBmcm9tLCB0bykgLT5cbiAgICAkKFwiXCJcIi5uZWlnaGJvcltkYXRhLXNpdGU9XCIje3NpdGV9XCJdXCJcIlwiKVxuICAgICAgLmZpbmQoJ2RpdicpXG4gICAgICAucmVtb3ZlQ2xhc3MoZnJvbSlcbiAgICAgIC5hZGRDbGFzcyh0bylcblxuICBmZXRjaE1hcCA9IC0+XG4gICAgc2l0ZW1hcFVybCA9IFwiaHR0cDovLyN7c2l0ZX0vc3lzdGVtL3NpdGVtYXAuanNvblwiXG4gICAgdHJhbnNpdGlvbiBzaXRlLCAnd2FpdCcsICdmZXRjaCdcbiAgICByZXF1ZXN0ID0gJC5hamF4XG4gICAgICB0eXBlOiAnR0VUJ1xuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgdXJsOiBzaXRlbWFwVXJsXG4gICAgcmVxdWVzdFxuICAgICAgLmFsd2F5cyggLT4gbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSBmYWxzZSApXG4gICAgICAuZG9uZSAoZGF0YSktPlxuICAgICAgICBuZWlnaGJvckluZm8uc2l0ZW1hcCA9IGRhdGFcbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZG9uZSdcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvci1kb25lJywgc2l0ZVxuICAgICAgLmZhaWwgKGRhdGEpLT5cbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZmFpbCdcblxuICBub3cgPSBEYXRlLm5vdygpXG4gIGlmIG5vdyA+IG5leHRBdmFpbGFibGVGZXRjaFxuICAgIG5leHRBdmFpbGFibGVGZXRjaCA9IG5vdyArIG5leHRGZXRjaEludGVydmFsXG4gICAgc2V0VGltZW91dCBmZXRjaE1hcCwgMTAwXG4gIGVsc2VcbiAgICBzZXRUaW1lb3V0IGZldGNoTWFwLCBuZXh0QXZhaWxhYmxlRmV0Y2ggLSBub3dcbiAgICBuZXh0QXZhaWxhYmxlRmV0Y2ggKz0gbmV4dEZldGNoSW50ZXJ2YWxcblxuXG53aWtpLnJlZ2lzdGVyTmVpZ2hib3IgPSBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciA9IChzaXRlKS0+XG4gIHJldHVybiBpZiB3aWtpLm5laWdoYm9yaG9vZFtzaXRlXT9cbiAgbmVpZ2hib3JJbmZvID0ge31cbiAgd2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0gPSBuZWlnaGJvckluZm9cbiAgcG9wdWxhdGVTaXRlSW5mb0Zvciggc2l0ZSwgbmVpZ2hib3JJbmZvIClcbiAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvcicsIHNpdGVcblxubmVpZ2hib3Job29kLmxpc3ROZWlnaGJvcnMgPSAoKS0+XG4gIF8ua2V5cyggd2lraS5uZWlnaGJvcmhvb2QgKVxuXG5uZWlnaGJvcmhvb2Quc2VhcmNoID0gKHNlYXJjaFF1ZXJ5KS0+XG4gIGZpbmRzID0gW11cbiAgdGFsbHkgPSB7fVxuXG4gIHRpY2sgPSAoa2V5KSAtPlxuICAgIGlmIHRhbGx5W2tleV0/IHRoZW4gdGFsbHlba2V5XSsrIGVsc2UgdGFsbHlba2V5XSA9IDFcblxuICBtYXRjaCA9IChrZXksIHRleHQpIC0+XG4gICAgaGl0ID0gdGV4dD8gYW5kIHRleHQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCBzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpICkgPj0gMFxuICAgIHRpY2sga2V5IGlmIGhpdFxuICAgIGhpdFxuXG4gIHN0YXJ0ID0gRGF0ZS5ub3coKVxuICBmb3Igb3duIG5laWdoYm9yU2l0ZSxuZWlnaGJvckluZm8gb2Ygd2lraS5uZWlnaGJvcmhvb2RcbiAgICBzaXRlbWFwID0gbmVpZ2hib3JJbmZvLnNpdGVtYXBcbiAgICB0aWNrICdzaXRlcycgaWYgc2l0ZW1hcD9cbiAgICBtYXRjaGluZ1BhZ2VzID0gXy5lYWNoIHNpdGVtYXAsIChwYWdlKS0+XG4gICAgICB0aWNrICdwYWdlcydcbiAgICAgIHJldHVybiB1bmxlc3MgbWF0Y2goJ3RpdGxlJywgcGFnZS50aXRsZSkgb3IgbWF0Y2goJ3RleHQnLCBwYWdlLnN5bm9wc2lzKSBvciBtYXRjaCgnc2x1ZycsIHBhZ2Uuc2x1ZylcbiAgICAgIHRpY2sgJ2ZpbmRzJ1xuICAgICAgZmluZHMucHVzaFxuICAgICAgICBwYWdlOiBwYWdlLFxuICAgICAgICBzaXRlOiBuZWlnaGJvclNpdGUsXG4gICAgICAgIHJhbms6IDEgIyBIQVJEQ09ERUQgRk9SIE5PV1xuICB0YWxseVsnbXNlYyddID0gRGF0ZS5ub3coKSAtIHN0YXJ0XG4gIHsgZmluZHMsIHRhbGx5IH1cblxuXG4kIC0+XG4gICRuZWlnaGJvcmhvb2QgPSAkKCcubmVpZ2hib3Job29kJylcblxuICBmbGFnID0gKHNpdGUpIC0+XG4gICAgIyBzdGF0dXMgY2xhc3MgcHJvZ3Jlc3Npb246IC53YWl0LCAuZmV0Y2gsIC5mYWlsIG9yIC5kb25lXG4gICAgXCJcIlwiXG4gICAgICA8c3BhbiBjbGFzcz1cIm5laWdoYm9yXCIgZGF0YS1zaXRlPVwiI3tzaXRlfVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid2FpdFwiPlxuICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cDovLyN7c2l0ZX0vZmF2aWNvbi5wbmdcIiB0aXRsZT1cIiN7c2l0ZX1cIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3NwYW4+XG4gICAgXCJcIlwiXG5cbiAgJCgnYm9keScpXG4gICAgLm9uICduZXctbmVpZ2hib3InLCAoZSwgc2l0ZSkgLT5cbiAgICAgICRuZWlnaGJvcmhvb2QuYXBwZW5kIGZsYWcgc2l0ZVxuICAgIC5kZWxlZ2F0ZSAnLm5laWdoYm9yIGltZycsICdjbGljaycsIChlKSAtPlxuICAgICAgd2lraS5kb0ludGVybmFsTGluayAnd2VsY29tZS12aXNpdG9ycycsIG51bGwsIEAudGl0bGVcblxuICBzZWFyY2ggPSBjcmVhdGVTZWFyY2goe25laWdoYm9yaG9vZH0pXG5cbiAgJCgnaW5wdXQuc2VhcmNoJykub24gJ2tleXByZXNzJywgKGUpLT5cbiAgICByZXR1cm4gaWYgZS5rZXlDb2RlICE9IDEzICMgMTMgPT0gcmV0dXJuXG4gICAgc2VhcmNoUXVlcnkgPSAkKHRoaXMpLnZhbCgpXG4gICAgc2VhcmNoLnBlcmZvcm1TZWFyY2goIHNlYXJjaFF1ZXJ5IClcbiAgICAkKHRoaXMpLnZhbChcIlwiKVxuIiwidXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5jb2ZmZWUnKVxuYWN0aXZlID0gcmVxdWlyZSgnLi9hY3RpdmUuY29mZmVlJylcblxuY3JlYXRlU2VhcmNoID0gKHtuZWlnaGJvcmhvb2R9KS0+XG4gIHBlcmZvcm1TZWFyY2ggPSAoc2VhcmNoUXVlcnkpLT5cbiAgICBzZWFyY2hSZXN1bHRzID0gbmVpZ2hib3Job29kLnNlYXJjaChzZWFyY2hRdWVyeSlcbiAgICB0YWxseSA9IHNlYXJjaFJlc3VsdHMudGFsbHlcblxuXG4gICAgZXhwbGFuYXRvcnlQYXJhID0ge1xuICAgICAgdHlwZTogJ3BhcmFncmFwaCdcbiAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgU3RyaW5nICcje3NlYXJjaFF1ZXJ5fScgZm91bmQgb24gI3t0YWxseS5maW5kc3x8J25vbmUnfSBvZiAje3RhbGx5LnBhZ2VzfHwnbm8nfSBwYWdlcyBmcm9tICN7dGFsbHkuc2l0ZXN8fCdubyd9IHNpdGVzLlxuICAgICAgICBUZXh0IG1hdGNoZWQgb24gI3t0YWxseS50aXRsZXx8J25vJ30gdGl0bGVzLCAje3RhbGx5LnRleHR8fCdubyd9IHBhcmFncmFwaHMsIGFuZCAje3RhbGx5LnNsdWd8fCdubyd9IHNsdWdzLlxuICAgICAgICBFbGFwc2VkIHRpbWUgI3t0YWxseS5tc2VjfSBtaWxsaXNlY29uZHMuXG4gICAgICBcIlwiXCJcbiAgICB9XG4gICAgc2VhcmNoUmVzdWx0UmVmZXJlbmNlcyA9IGZvciByZXN1bHQgaW4gc2VhcmNoUmVzdWx0cy5maW5kc1xuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIlxuICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgICAgXCJzaXRlXCI6IHJlc3VsdC5zaXRlXG4gICAgICAgIFwic2x1Z1wiOiByZXN1bHQucGFnZS5zbHVnXG4gICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnBhZ2UudGl0bGVcbiAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5wYWdlLnN5bm9wc2lzIHx8ICcnXG4gICAgICB9XG4gICAgc2VhcmNoUmVzdWx0UGFnZURhdGEgPSB7XG4gICAgICB0aXRsZTogXCJTZWFyY2ggUmVzdWx0c1wiXG4gICAgICBzdG9yeTogW2V4cGxhbmF0b3J5UGFyYV0uY29uY2F0KHNlYXJjaFJlc3VsdFJlZmVyZW5jZXMpXG4gICAgfVxuICAgICRzZWFyY2hSZXN1bHRQYWdlID0gd2lraS5jcmVhdGVQYWdlKCdzZWFyY2gtcmVzdWx0cycpLmFkZENsYXNzKCdnaG9zdCcpXG4gICAgJHNlYXJjaFJlc3VsdFBhZ2UuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICB3aWtpLmJ1aWxkUGFnZSggc2VhcmNoUmVzdWx0UGFnZURhdGEsIG51bGwsICRzZWFyY2hSZXN1bHRQYWdlIClcbiAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuXG5cbiAge1xuICAgIHBlcmZvcm1TZWFyY2hcbiAgfVxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTZWFyY2hcbiJdfQ==
;