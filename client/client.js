;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
window.wiki = require('./lib/wiki.coffee');

require('./lib/legacy.coffee');


},{"./lib/wiki.coffee":2,"./lib/legacy.coffee":3}],3:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":4,"./pageHandler.coffee":5,"./plugin.coffee":6,"./state.coffee":7,"./active.coffee":8,"./refresh.coffee":9}],2:[function(require,module,exports){
var createSynopsis, wiki,
  __slice = [].slice;

createSynopsis = require('./synopsis.coffee');

wiki = {
  createSynopsis: createSynopsis
};

wiki.persona = require('./persona.coffee');

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


},{"./synopsis.coffee":10,"./persona.coffee":11}],8:[function(require,module,exports){
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


},{}],10:[function(require,module,exports){
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


},{}],11:[function(require,module,exports){
module.exports = function(owner) {
  $("#user-email").hide();
  $("#persona-login-btn").hide();
  $("#persona-logout-btn").hide();
  navigator.id.watch({
    loggedInUser: owner,
    onlogin: function(assertion) {
      console.log("assertion=", assertion);
      return $.post("/persona_login", {
        assertion: assertion
      }, function(verified) {
        verified = JSON.parse(verified);
        console.log(verified);
        if ("okay" === verified.status) {
          console.log('Setting email to ' + verified.email);
          $("#user-email").text(verified.email).show();
          $("#persona-login-btn").hide();
          return $("#persona-logout-btn").show();
        } else {
          navigator.id.logout();
          if ("wrong-address" === verified.status) {
            return window.location = "/oops";
          }
        }
      });
    },
    onlogout: function() {
      console.log("logging out");
      $.post("/persona_logout");
      $("#user-email").hide();
      $("#persona-login-btn").show();
      return $("#persona-logout-btn").hide();
    },
    onmatch: function() {
      console.log("It is safe to render the UI");
      if (owner) {
        $("#user-email").text(owner).show();
        $("#persona-login-btn").hide();
        return $("#persona-logout-btn").show();
      } else {
        $("#user-email").hide();
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


},{}],4:[function(require,module,exports){
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


},{"./wiki.coffee":2}],7:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./active.coffee":8}],6:[function(require,module,exports){
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


},{"./util.coffee":4,"./wiki.coffee":2}],5:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":4,"./state.coffee":7,"./revision.coffee":12,"./addToJournal.coffee":13,"underscore":14}],9:[function(require,module,exports){
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


},{"./util.coffee":4,"./pageHandler.coffee":5,"./plugin.coffee":6,"./state.coffee":7,"./neighborhood.coffee":15,"./addToJournal.coffee":13,"./wiki.coffee":2,"underscore":14}],12:[function(require,module,exports){
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


},{}],14:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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


},{"./util.coffee":4}],15:[function(require,module,exports){
var active, createSearch, neighborhood, nextAvailableFetch, nextFetchInterval, populateSiteInfoFor, util, wiki, _,
  __hasProp = {}.hasOwnProperty;

_ = require('underscore');

wiki = require('./wiki.coffee');

active = require('./active.coffee');

util = require('./util.coffee');

createSearch = require('./search.coffee');

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


},{"./wiki.coffee":2,"./active.coffee":8,"./util.coffee":4,"./search.coffee":16,"underscore":14}],16:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":4,"./active.coffee":8}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2NsaWVudC5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9sZWdhY3kuY29mZmVlIiwiL1VzZXJzL3Nob3V0L1Byb2plY3RzL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvd2lraS5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9hY3RpdmUuY29mZmVlIiwiL1VzZXJzL3Nob3V0L1Byb2plY3RzL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc3lub3BzaXMuY29mZmVlIiwiL1VzZXJzL3Nob3V0L1Byb2plY3RzL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcGVyc29uYS5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi91dGlsLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3N0YXRlLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3BsdWdpbi5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9wYWdlSGFuZGxlci5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9yZWZyZXNoLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3JldmlzaW9uLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2FkZFRvSm91cm5hbC5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9uZWlnaGJvcmhvb2QuY29mZmVlIiwiL1VzZXJzL3Nob3V0L1Byb2plY3RzL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsQ0FBTyxFQUFPLENBQWQsRUFBTSxDQUFRLFlBQUE7O0FBQ2QsQ0FEQSxNQUNBLGNBQUE7Ozs7QUNEQSxJQUFBLG1EQUFBOztBQUFBLENBQUEsRUFBTyxDQUFQLEdBQU8sUUFBQTs7QUFDUCxDQURBLEVBQ08sQ0FBUCxHQUFPLFFBQUE7O0FBQ1AsQ0FGQSxFQUVjLENBQUksR0FBZSxJQUFqQyxXQUFpQzs7QUFDakMsQ0FIQSxFQUdTLEdBQVQsQ0FBUyxVQUFBOztBQUNULENBSkEsRUFJUSxFQUFSLEVBQVEsU0FBQTs7QUFDUixDQUxBLEVBS1MsR0FBVCxDQUFTLFVBQUE7O0FBQ1QsQ0FOQSxFQU1VLElBQVYsV0FBVTs7QUFFVixDQVJBLEVBUWMsQ0FBZCxDQUFLLElBQUU7Q0FDQSxFQUFVLENBQVYsRUFBQSxHQUFMO0NBRFk7O0FBR2QsQ0FYQSxFQVdFLE1BQUE7Q0FvQkEsS0FBQSwrRkFBQTtDQUFBLENBQUEsQ0FBZ0IsQ0FBQSxFQUFWLE9BQVUsc0JBQUE7Q0FFUCxDQUFZLEVBQVYsQ0FBRixHQUFFO0NBQUYsQ0FBMEIsRUFBUCxDQUFBLFNBQW5CO0NBQUEsQ0FBa0QsQ0FBbEQsQ0FBMEMsRUFBQTtDQUExQyxDQUE4RCxDQUE5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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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ekI7Q0FBQSxFQXNCdUIsQ0FBdkIsZ0JBQUE7Q0FBdUIsQ0FDZCxHQUFQLENBQUEsVUFEcUI7Q0FBQSxDQUVkLEdBQVAsQ0FBQSxTQUFPLE9BQUE7Q0F4QlQsS0FBQTtDQUFBLEVBMEJvQixDQUFwQixHQUFvQixDQUFBLEVBQUEsTUFBQSxDQUFwQjtDQTFCQSxHQTJCQSxHQUEyQixDQUEzQixTQUFpQjtDQTNCakIsQ0E0QnNDLEVBQXRDLEtBQUEsUUFBQSxHQUFBO0NBQ08sRUFBUCxDQUFXLEVBQUwsQ0FBSyxJQUFYO0NBOUJGLEVBQWdCO1NBaUNoQjtDQUFBLENBQ0UsRUFBQSxTQURGO0NBbENhO0NBQUE7O0FBcUNmLENBekNBLEVBeUNpQixHQUFYLENBQU4sS0F6Q0EiLCJzb3VyY2VzQ29udGVudCI6WyJ3aW5kb3cud2lraSA9IHJlcXVpcmUoJy4vbGliL3dpa2kuY29mZmVlJylcbnJlcXVpcmUoJy4vbGliL2xlZ2FjeS5jb2ZmZWUnKVxuXG4iLCJ3aWtpID0gcmVxdWlyZSAnLi93aWtpLmNvZmZlZSdcbnV0aWwgPSByZXF1aXJlICcuL3V0aWwuY29mZmVlJ1xucGFnZUhhbmRsZXIgPSB3aWtpLnBhZ2VIYW5kbGVyID0gcmVxdWlyZSAnLi9wYWdlSGFuZGxlci5jb2ZmZWUnXG5wbHVnaW4gPSByZXF1aXJlICcuL3BsdWdpbi5jb2ZmZWUnXG5zdGF0ZSA9IHJlcXVpcmUgJy4vc3RhdGUuY29mZmVlJ1xuYWN0aXZlID0gcmVxdWlyZSAnLi9hY3RpdmUuY29mZmVlJ1xucmVmcmVzaCA9IHJlcXVpcmUgJy4vcmVmcmVzaC5jb2ZmZWUnXG5cbkFycmF5OjpsYXN0ID0gLT5cbiAgdGhpc1tAbGVuZ3RoIC0gMV1cblxuJCAtPlxuIyBFTEVNRU5UUyB1c2VkIGZvciBkZXRhaWxzIHBvcHVwXG5cbiAgIyAjIGV4dGVuc2lvbiBmcm9tIGh0dHA6Ly93d3cuZHJvcHRvZnJhbWUuY29tLz9wPTM1XG4gICMgICAjIC51aS1kaWFsb2cgLnVpLWRpYWxvZy10aXRsZWJhci10cmFuc2ZlcnsgcG9zaXRpb246IGFic29sdXRlOyByaWdodDogMjNweDsgdG9wOiA1MCU7IHdpZHRoOiAxOXB4OyBtYXJnaW46IC0xMHB4IDAgMCAwOyBwYWRkaW5nOiAxcHg7IGhlaWdodDogMThweDsgfVxuICAjICAgIyAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItdHJhbnNmZXIgc3BhbiB7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW46IDFweDsgfVxuICAjICAgIyAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItdHJhbnNmZXI6aG92ZXIsIC51aS1kaWFsb2cgLnVpLWRpYWxvZy10aXRsZWJhci1taW46Zm9jdXMgeyBwYWRkaW5nOiAwOyB9XG4gICMgX2luaXQgPSAkLnVpLmRpYWxvZy5wcm90b3R5cGUuX2luaXRcbiAgIyBfdWlEaWFsb2dUaXRsZWJhciA9IG51bGxcbiAgIyAkLnVpLmRpYWxvZy5wcm90b3R5cGUuX2luaXQgPSAtPlxuICAjICAgc2VsZiA9IHRoaXNcbiAgIyAgIF9pbml0LmFwcGx5IHRoaXMsIGFyZ3VtZW50c1xuICAjICAgdWlEaWFsb2dUaXRsZWJhciA9IHRoaXMudWlEaWFsb2dUaXRsZWJhclxuICAjICAgdWlEaWFsb2dUaXRsZWJhci5hcHBlbmQgJzxhIGhyZWY9XCIjXCIgaWQ9XCJkaWFsb2ctdHJhbnNmZXJcIiBjbGFzcz1cImRpYWxvZy10cmFuc2ZlciB1aS1kaWFsb2ctdGl0bGViYXItdHJhbnNmZXJcIj48c3BhbiBjbGFzcz1cInVpLWljb24gdWktaWNvbi10cmFuc2ZlcnRoaWNrLWUtd1wiPjwvc3Bhbj48L2E+J1xuICAjICQuZXh0ZW5kICQudWkuZGlhbG9nLnByb3RvdHlwZSwgLT5cbiAgIyAgICQoJy5kaWFsb2ctdHJhbnNmZXInLCB0aGlzLnVpRGlhbG9nVGl0bGViYXIpXG4gICMgICAgIC5ob3ZlciAtPiAkKHRoaXMpLnRvZ2dsZUNsYXNzKCd1aS1zdGF0ZS1ob3ZlcicpXG4gICMgICAgIC5jbGljaygpIC0+XG4gICMgICAgICAgc2VsZi50cmFuc2ZlcigpXG4gICMgICAgICAgcmV0dXJuIGZhbHNlXG4gIHdpbmRvdy5kaWFsb2cgPSAkKCc8ZGl2PjwvZGl2PicpXG5cdCAgLmh0bWwoJ1RoaXMgZGlhbG9nIHdpbGwgc2hvdyBldmVyeSB0aW1lIScpXG5cdCAgLmRpYWxvZyB7IGF1dG9PcGVuOiBmYWxzZSwgdGl0bGU6ICdCYXNpYyBEaWFsb2cnLCBoZWlnaHQ6IDYwMCwgd2lkdGg6IDgwMCB9XG4gIHdpa2kuZGlhbG9nID0gKHRpdGxlLCBodG1sKSAtPlxuICAgIHdpbmRvdy5kaWFsb2cuaHRtbCBodG1sXG4gICAgd2luZG93LmRpYWxvZy5kaWFsb2cgXCJvcHRpb25cIiwgXCJ0aXRsZVwiLCB3aWtpLnJlc29sdmVMaW5rcyh0aXRsZSlcbiAgICB3aW5kb3cuZGlhbG9nLmRpYWxvZyAnb3BlbidcblxuIyBGVU5DVElPTlMgdXNlZCBieSBwbHVnaW5zIGFuZCBlbHNld2hlcmVcblxuICBzbGVlcCA9ICh0aW1lLCBkb25lKSAtPiBzZXRUaW1lb3V0IGRvbmUsIHRpbWVcblxuICB3aWtpLnJlbW92ZUl0ZW0gPSAoJGl0ZW0sIGl0ZW0pIC0+XG4gICAgcGFnZUhhbmRsZXIucHV0ICRpdGVtLnBhcmVudHMoJy5wYWdlOmZpcnN0JyksIHt0eXBlOiAncmVtb3ZlJywgaWQ6IGl0ZW0uaWR9XG4gICAgJGl0ZW0ucmVtb3ZlKClcblxuICB3aWtpLmNyZWF0ZUl0ZW0gPSAoJHBhZ2UsICRiZWZvcmUsIGl0ZW0pIC0+XG4gICAgJHBhZ2UgPSAkYmVmb3JlLnBhcmVudHMoJy5wYWdlJykgdW5sZXNzICRwYWdlP1xuICAgIGl0ZW0uaWQgPSB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgJGl0ZW0gPSAkIFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIml0ZW0gI3tpdGVtLnR5cGV9XCIgZGF0YS1pZD1cIiN7fVwiPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgJGl0ZW1cbiAgICAgIC5kYXRhKCdpdGVtJywgaXRlbSlcbiAgICAgIC5kYXRhKCdwYWdlRWxlbWVudCcsICRwYWdlKVxuICAgIGlmICRiZWZvcmU/XG4gICAgICAkYmVmb3JlLmFmdGVyICRpdGVtXG4gICAgZWxzZVxuICAgICAgJHBhZ2UuZmluZCgnLnN0b3J5JykuYXBwZW5kICRpdGVtXG4gICAgcGx1Z2luLmRvICRpdGVtLCBpdGVtXG4gICAgYmVmb3JlID0gd2lraS5nZXRJdGVtICRiZWZvcmVcbiAgICBzbGVlcCA1MDAsIC0+XG4gICAgICBwYWdlSGFuZGxlci5wdXQgJHBhZ2UsIHtpdGVtLCBpZDogaXRlbS5pZCwgdHlwZTogJ2FkZCcsIGFmdGVyOiBiZWZvcmU/LmlkfVxuICAgICRpdGVtXG5cbiAgY3JlYXRlVGV4dEVsZW1lbnQgPSAocGFnZUVsZW1lbnQsIGJlZm9yZUVsZW1lbnQsIGluaXRpYWxUZXh0KSAtPlxuICAgIGl0ZW0gPVxuICAgICAgdHlwZTogJ3BhcmFncmFwaCdcbiAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICB0ZXh0OiBpbml0aWFsVGV4dFxuICAgIGl0ZW1FbGVtZW50ID0gJCBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCJpdGVtIHBhcmFncmFwaFwiIGRhdGEtaWQ9I3tpdGVtLmlkfT48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgaXRlbUVsZW1lbnRcbiAgICAgIC5kYXRhKCdpdGVtJywgaXRlbSlcbiAgICAgIC5kYXRhKCdwYWdlRWxlbWVudCcsIHBhZ2VFbGVtZW50KVxuICAgIGJlZm9yZUVsZW1lbnQuYWZ0ZXIgaXRlbUVsZW1lbnRcbiAgICBwbHVnaW4uZG8gaXRlbUVsZW1lbnQsIGl0ZW1cbiAgICBpdGVtQmVmb3JlID0gd2lraS5nZXRJdGVtIGJlZm9yZUVsZW1lbnRcbiAgICB3aWtpLnRleHRFZGl0b3IgaXRlbUVsZW1lbnQsIGl0ZW1cbiAgICBzbGVlcCA1MDAsIC0+IHBhZ2VIYW5kbGVyLnB1dCBwYWdlRWxlbWVudCwge2l0ZW06IGl0ZW0sIGlkOiBpdGVtLmlkLCB0eXBlOiAnYWRkJywgYWZ0ZXI6IGl0ZW1CZWZvcmU/LmlkfVxuXG4gIHRleHRFZGl0b3IgPSB3aWtpLnRleHRFZGl0b3IgPSAoZGl2LCBpdGVtLCBjYXJldFBvcywgZG91YmxlQ2xpY2tlZCkgLT5cbiAgICByZXR1cm4gaWYgZGl2Lmhhc0NsYXNzICd0ZXh0RWRpdGluZydcbiAgICBkaXYuYWRkQ2xhc3MgJ3RleHRFZGl0aW5nJ1xuICAgIHRleHRhcmVhID0gJChcIjx0ZXh0YXJlYT4je29yaWdpbmFsID0gaXRlbS50ZXh0ID8gJyd9PC90ZXh0YXJlYT5cIilcbiAgICAgIC5mb2N1c291dCAtPlxuICAgICAgICBkaXYucmVtb3ZlQ2xhc3MgJ3RleHRFZGl0aW5nJ1xuICAgICAgICBpZiBpdGVtLnRleHQgPSB0ZXh0YXJlYS52YWwoKVxuICAgICAgICAgIHBsdWdpbi5kbyBkaXYuZW1wdHkoKSwgaXRlbVxuICAgICAgICAgIHJldHVybiBpZiBpdGVtLnRleHQgPT0gb3JpZ2luYWxcbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQgZGl2LnBhcmVudHMoJy5wYWdlOmZpcnN0JyksIHt0eXBlOiAnZWRpdCcsIGlkOiBpdGVtLmlkLCBpdGVtOiBpdGVtfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IGRpdi5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7dHlwZTogJ3JlbW92ZScsIGlkOiBpdGVtLmlkfVxuICAgICAgICAgIGRpdi5yZW1vdmUoKVxuICAgICAgICBudWxsXG4gICAgICAjIC5iaW5kICdwYXN0ZScsIChlKSAtPlxuICAgICAgIyAgIHdpa2kubG9nICd0ZXh0ZWRpdCBwYXN0ZScsIGVcbiAgICAgICMgICB3aWtpLmxvZyBlLm9yaWdpbmFsRXZlbnQuY2xpcGJvYXJkRGF0YS5nZXREYXRhKCd0ZXh0JylcbiAgICAgIC5iaW5kICdrZXlkb3duJywgKGUpIC0+XG4gICAgICAgIGlmIChlLmFsdEtleSB8fCBlLmN0bEtleSB8fCBlLm1ldGFLZXkpIGFuZCBlLndoaWNoID09IDgzICNhbHQtc1xuICAgICAgICAgIHRleHRhcmVhLmZvY3Vzb3V0KClcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgaWYgKGUuYWx0S2V5IHx8IGUuY3RsS2V5IHx8IGUubWV0YUtleSkgYW5kIGUud2hpY2ggPT0gNzMgI2FsdC1pXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlJykgdW5sZXNzIGUuc2hpZnRLZXlcbiAgICAgICAgICBkb0ludGVybmFsTGluayBcImFib3V0ICN7aXRlbS50eXBlfSBwbHVnaW5cIiwgcGFnZVxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAjIHByb3ZpZGVzIGF1dG9tYXRpYyBuZXcgcGFyYWdyYXBocyBvbiBlbnRlciBhbmQgY29uY2F0ZW5hdGlvbiBvbiBiYWNrc3BhY2VcbiAgICAgICAgaWYgaXRlbS50eXBlIGlzICdwYXJhZ3JhcGgnIFxuICAgICAgICAgIHNlbCA9IHV0aWwuZ2V0U2VsZWN0aW9uUG9zKHRleHRhcmVhKSAjIHBvc2l0aW9uIG9mIGNhcmV0IG9yIHNlbGVjdGVkIHRleHQgY29vcmRzXG4gICAgICAgICAgaWYgZS53aGljaCBpcyAkLnVpLmtleUNvZGUuQkFDS1NQQUNFIGFuZCBzZWwuc3RhcnQgaXMgMCBhbmQgc2VsLnN0YXJ0IGlzIHNlbC5lbmQgXG4gICAgICAgICAgICBwcmV2SXRlbSA9IHdpa2kuZ2V0SXRlbShkaXYucHJldigpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBwcmV2SXRlbS50eXBlIGlzICdwYXJhZ3JhcGgnXG4gICAgICAgICAgICBwcmV2VGV4dExlbiA9IHByZXZJdGVtLnRleHQubGVuZ3RoXG4gICAgICAgICAgICBwcmV2SXRlbS50ZXh0ICs9IHRleHRhcmVhLnZhbCgpXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoJycpICMgTmVlZCBjdXJyZW50IHRleHQgYXJlYSB0byBiZSBlbXB0eS4gSXRlbSB0aGVuIGdldHMgZGVsZXRlZC5cbiAgICAgICAgICAgICMgY2FyZXQgbmVlZHMgdG8gYmUgYmV0d2VlbiB0aGUgb2xkIHRleHQgYW5kIHRoZSBuZXcgYXBwZW5kZWQgdGV4dFxuICAgICAgICAgICAgdGV4dEVkaXRvciBkaXYucHJldigpLCBwcmV2SXRlbSwgcHJldlRleHRMZW5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIGVsc2UgaWYgZS53aGljaCBpcyAkLnVpLmtleUNvZGUuRU5URVIgYW5kIGl0ZW0udHlwZSBpcyAncGFyYWdyYXBoJ1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBzZWxcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0YXJlYS52YWwoKVxuICAgICAgICAgICAgcHJlZml4ID0gdGV4dC5zdWJzdHJpbmcgMCwgc2VsLnN0YXJ0XG4gICAgICAgICAgICBtaWRkbGUgPSB0ZXh0LnN1YnN0cmluZyhzZWwuc3RhcnQsIHNlbC5lbmQpIGlmIHNlbC5zdGFydCBpc250IHNlbC5lbmRcbiAgICAgICAgICAgIHN1ZmZpeCA9IHRleHQuc3Vic3RyaW5nKHNlbC5lbmQpXG4gICAgICAgICAgICBpZiBwcmVmaXggaXMgJydcbiAgICAgICAgICAgICAgdGV4dGFyZWEudmFsKCcgJylcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgdGV4dGFyZWEudmFsKHByZWZpeClcbiAgICAgICAgICAgIHRleHRhcmVhLmZvY3Vzb3V0KClcbiAgICAgICAgICAgIHBhZ2VFbGVtZW50ID0gZGl2LnBhcmVudCgpLnBhcmVudCgpXG4gICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCBzdWZmaXgpXG4gICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCBtaWRkbGUpIGlmIG1pZGRsZT9cbiAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsICcnKSBpZiBwcmVmaXggaXMgJydcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgIGRpdi5odG1sIHRleHRhcmVhXG4gICAgaWYgY2FyZXRQb3M/XG4gICAgICB1dGlsLnNldENhcmV0UG9zaXRpb24gdGV4dGFyZWEsIGNhcmV0UG9zXG4gICAgZWxzZSBpZiBkb3VibGVDbGlja2VkICMgd2Ugd2FudCB0aGUgY2FyZXQgdG8gYmUgYXQgdGhlIGVuZFxuICAgICAgdXRpbC5zZXRDYXJldFBvc2l0aW9uIHRleHRhcmVhLCB0ZXh0YXJlYS52YWwoKS5sZW5ndGhcbiAgICAgICNzY3JvbGxzIHRvIGJvdHRvbSBvZiB0ZXh0IGFyZWFcbiAgICAgIHRleHRhcmVhLnNjcm9sbFRvcCh0ZXh0YXJlYVswXS5zY3JvbGxIZWlnaHQgLSB0ZXh0YXJlYS5oZWlnaHQoKSlcbiAgICBlbHNlXG4gICAgICB0ZXh0YXJlYS5mb2N1cygpXG5cbiAgZG9JbnRlcm5hbExpbmsgPSB3aWtpLmRvSW50ZXJuYWxMaW5rID0gKG5hbWUsIHBhZ2UsIHNpdGU9bnVsbCkgLT5cbiAgICBuYW1lID0gd2lraS5hc1NsdWcobmFtZSlcbiAgICAkKHBhZ2UpLm5leHRBbGwoKS5yZW1vdmUoKSBpZiBwYWdlP1xuICAgIHdpa2kuY3JlYXRlUGFnZShuYW1lLHNpdGUpXG4gICAgICAuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICAgIC5lYWNoIHJlZnJlc2hcbiAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuXG4gIExFRlRBUlJPVyA9IDM3XG4gIFJJR0hUQVJST1cgPSAzOVxuXG4gICQoZG9jdW1lbnQpLmtleWRvd24gKGV2ZW50KSAtPlxuICAgIGRpcmVjdGlvbiA9IHN3aXRjaCBldmVudC53aGljaFxuICAgICAgd2hlbiBMRUZUQVJST1cgdGhlbiAtMVxuICAgICAgd2hlbiBSSUdIVEFSUk9XIHRoZW4gKzFcbiAgICBpZiBkaXJlY3Rpb24gJiYgbm90IChldmVudC50YXJnZXQudGFnTmFtZSBpcyBcIlRFWFRBUkVBXCIpXG4gICAgICBwYWdlcyA9ICQoJy5wYWdlJylcbiAgICAgIG5ld0luZGV4ID0gcGFnZXMuaW5kZXgoJCgnLmFjdGl2ZScpKSArIGRpcmVjdGlvblxuICAgICAgaWYgMCA8PSBuZXdJbmRleCA8IHBhZ2VzLmxlbmd0aFxuICAgICAgICBhY3RpdmUuc2V0KHBhZ2VzLmVxKG5ld0luZGV4KSlcblxuIyBIQU5ETEVSUyBmb3IgalF1ZXJ5IGV2ZW50c1xuXG4gICQod2luZG93KS5vbiAncG9wc3RhdGUnLCBzdGF0ZS5zaG93XG5cbiAgJChkb2N1bWVudClcbiAgICAuYWpheEVycm9yIChldmVudCwgcmVxdWVzdCwgc2V0dGluZ3MpIC0+XG4gICAgICByZXR1cm4gaWYgcmVxdWVzdC5zdGF0dXMgPT0gMCBvciByZXF1ZXN0LnN0YXR1cyA9PSA0MDRcbiAgICAgIHdpa2kubG9nICdhamF4IGVycm9yJywgZXZlbnQsIHJlcXVlc3QsIHNldHRpbmdzXG4gICAgICAkKCcubWFpbicpLnByZXBlbmQgXCJcIlwiXG4gICAgICAgIDxsaSBjbGFzcz0nZXJyb3InPlxuICAgICAgICAgIEVycm9yIG9uICN7c2V0dGluZ3MudXJsfTogI3tyZXF1ZXN0LnJlc3BvbnNlVGV4dH1cbiAgICAgICAgPC9saT5cbiAgICAgIFwiXCJcIlxuXG4gIGdldFRlbXBsYXRlID0gKHNsdWcsIGRvbmUpIC0+XG4gICAgcmV0dXJuIGRvbmUobnVsbCkgdW5sZXNzIHNsdWdcbiAgICB3aWtpLmxvZyAnZ2V0VGVtcGxhdGUnLCBzbHVnXG4gICAgcGFnZUhhbmRsZXIuZ2V0XG4gICAgICB3aGVuR290dGVuOiAoZGF0YSxzaXRlRm91bmQpIC0+IGRvbmUoZGF0YS5zdG9yeSlcbiAgICAgIHdoZW5Ob3RHb3R0ZW46IC0+IGRvbmUobnVsbClcbiAgICAgIHBhZ2VJbmZvcm1hdGlvbjoge3NsdWc6IHNsdWd9XG5cbiAgZmluaXNoQ2xpY2sgPSAoZSwgbmFtZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKSB1bmxlc3MgZS5zaGlmdEtleVxuICAgIGRvSW50ZXJuYWxMaW5rIG5hbWUsIHBhZ2UsICQoZS50YXJnZXQpLmRhdGEoJ3NpdGUnKVxuICAgIHJldHVybiBmYWxzZVxuXG4gICQoJy5tYWluJylcbiAgICAuZGVsZWdhdGUgJy5zaG93LXBhZ2Utc291cmNlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIHBhZ2VFbGVtZW50ID0gJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKVxuICAgICAganNvbiA9IHBhZ2VFbGVtZW50LmRhdGEoJ2RhdGEnKVxuICAgICAgd2lraS5kaWFsb2cgXCJKU09OIGZvciAje2pzb24udGl0bGV9XCIsICAkKCc8cHJlLz4nKS50ZXh0KEpTT04uc3RyaW5naWZ5KGpzb24sIG51bGwsIDIpKVxuXG4gICAgLmRlbGVnYXRlICcucGFnZScsICdjbGljaycsIChlKSAtPlxuICAgICAgYWN0aXZlLnNldCB0aGlzIHVubGVzcyAkKGUudGFyZ2V0KS5pcyhcImFcIilcblxuICAgIC5kZWxlZ2F0ZSAnLmludGVybmFsJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBuYW1lID0gJChlLnRhcmdldCkuZGF0YSAncGFnZU5hbWUnXG4gICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gJChlLnRhcmdldCkuYXR0cigndGl0bGUnKS5zcGxpdCgnID0+ICcpXG4gICAgICBmaW5pc2hDbGljayBlLCBuYW1lXG5cbiAgICAuZGVsZWdhdGUgJ2ltZy5yZW1vdGUnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIG5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhKCdzbHVnJylcbiAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJChlLnRhcmdldCkuZGF0YSgnc2l0ZScpXVxuICAgICAgZmluaXNoQ2xpY2sgZSwgbmFtZVxuXG4gICAgLmRlbGVnYXRlICcucmV2aXNpb24nLCAnZGJsY2xpY2snLCAoZSkgLT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgJHBhZ2UgPSAkKHRoaXMpLnBhcmVudHMoJy5wYWdlJylcbiAgICAgIHBhZ2UgPSAkcGFnZS5kYXRhKCdkYXRhJylcbiAgICAgIHJldiA9IHBhZ2Uuam91cm5hbC5sZW5ndGgtMVxuICAgICAgYWN0aW9uID0gcGFnZS5qb3VybmFsW3Jldl1cbiAgICAgIGpzb24gPSBKU09OLnN0cmluZ2lmeShhY3Rpb24sIG51bGwsIDIpXG4gICAgICB3aWtpLmRpYWxvZyBcIlJldmlzaW9uICN7cmV2fSwgI3thY3Rpb24udHlwZX0gYWN0aW9uXCIsICQoJzxwcmUvPicpLnRleHQoanNvbilcblxuICAgIC5kZWxlZ2F0ZSAnLmFjdGlvbicsICdjbGljaycsIChlKSAtPlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAkYWN0aW9uID0gJChlLnRhcmdldClcbiAgICAgIGlmICRhY3Rpb24uaXMoJy5mb3JrJykgYW5kIChuYW1lID0gJGFjdGlvbi5kYXRhKCdzbHVnJykpP1xuICAgICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyRhY3Rpb24uZGF0YSgnc2l0ZScpXVxuICAgICAgICBmaW5pc2hDbGljayBlLCAobmFtZS5zcGxpdCAnXycpWzBdXG4gICAgICBlbHNlXG4gICAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpXG4gICAgICAgIHNsdWcgPSB3aWtpLmFzU2x1ZygkcGFnZS5kYXRhKCdkYXRhJykudGl0bGUpXG4gICAgICAgIHJldiA9ICQodGhpcykucGFyZW50KCkuY2hpbGRyZW4oKS5pbmRleCgkYWN0aW9uKVxuICAgICAgICAkcGFnZS5uZXh0QWxsKCkucmVtb3ZlKCkgdW5sZXNzIGUuc2hpZnRLZXlcbiAgICAgICAgd2lraS5jcmVhdGVQYWdlKFwiI3tzbHVnfV9yZXYje3Jldn1cIiwgJHBhZ2UuZGF0YSgnc2l0ZScpKVxuICAgICAgICAgIC5hcHBlbmRUbygkKCcubWFpbicpKVxuICAgICAgICAgIC5lYWNoIHJlZnJlc2hcbiAgICAgICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcblxuICAgIC5kZWxlZ2F0ZSAnLmZvcmstcGFnZScsICdjbGljaycsIChlKSAtPlxuICAgICAgcGFnZUVsZW1lbnQgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpXG4gICAgICBpZiBwYWdlRWxlbWVudC5oYXNDbGFzcygnbG9jYWwnKVxuICAgICAgICB1bmxlc3Mgd2lraS51c2VMb2NhbFN0b3JhZ2UoKVxuICAgICAgICAgIGl0ZW0gPSBwYWdlRWxlbWVudC5kYXRhKCdkYXRhJylcbiAgICAgICAgICBwYWdlRWxlbWVudC5yZW1vdmVDbGFzcygnbG9jYWwnKVxuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dCBwYWdlRWxlbWVudCwge3R5cGU6ICdmb3JrJywgaXRlbX0gIyBwdXNoXG4gICAgICBlbHNlXG4gICAgICAgIGlmIChyZW1vdGVTaXRlID0gcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpKT9cbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQgcGFnZUVsZW1lbnQsIHt0eXBlOidmb3JrJywgc2l0ZTogcmVtb3RlU2l0ZX0gIyBwdWxsXG5cbiAgICAuZGVsZWdhdGUgJy5hY3Rpb24nLCAnaG92ZXInLCAtPlxuICAgICAgaWQgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtaWQnKVxuICAgICAgJChcIltkYXRhLWlkPSN7aWR9XVwiKS50b2dnbGVDbGFzcygndGFyZ2V0JylcbiAgICAgICQoJy5tYWluJykudHJpZ2dlcigncmV2JylcblxuICAgIC5kZWxlZ2F0ZSAnLml0ZW0nLCAnaG92ZXInLCAtPlxuICAgICAgaWQgPSAkKHRoaXMpLmF0dHIoJ2RhdGEtaWQnKVxuICAgICAgJChcIi5hY3Rpb25bZGF0YS1pZD0je2lkfV1cIikudG9nZ2xlQ2xhc3MoJ3RhcmdldCcpXG5cbiAgICAuZGVsZWdhdGUgJ2J1dHRvbi5jcmVhdGUnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGdldFRlbXBsYXRlICQoZS50YXJnZXQpLmRhdGEoJ3NsdWcnKSwgKHN0b3J5KSAtPlxuICAgICAgICAkcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlOmZpcnN0JylcbiAgICAgICAgJHBhZ2UucmVtb3ZlQ2xhc3MgJ2dob3N0J1xuICAgICAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpXG4gICAgICAgIHBhZ2Uuc3RvcnkgPSBzdG9yeXx8W11cbiAgICAgICAgcGFnZUhhbmRsZXIucHV0ICRwYWdlLCB7dHlwZTogJ2NyZWF0ZScsIGlkOiBwYWdlLmlkLCBpdGVtOiB7dGl0bGU6cGFnZS50aXRsZSwgc3Rvcnk6IHN0b3J5fHx1bmRlZmluZWR9fVxuICAgICAgICB3aWtpLmJ1aWxkUGFnZSBwYWdlLCBudWxsLCAkcGFnZS5lbXB0eSgpXG5cbiAgICAuZGVsZWdhdGUgJy5naG9zdCcsICdyZXYnLCAoZSkgLT5cbiAgICAgIHdpa2kubG9nICdyZXYnLCBlXG4gICAgICAkcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlOmZpcnN0JylcbiAgICAgICRpdGVtID0gJHBhZ2UuZmluZCgnLnRhcmdldCcpXG4gICAgICBwb3NpdGlvbiA9ICRpdGVtLm9mZnNldCgpLnRvcCArICRwYWdlLnNjcm9sbFRvcCgpIC0gJHBhZ2UuaGVpZ2h0KCkvMlxuICAgICAgd2lraS5sb2cgJ3Njcm9sbCcsICRwYWdlLCAkaXRlbSwgcG9zaXRpb25cbiAgICAgICRwYWdlLnN0b3AoKS5hbmltYXRlIHtzY3JvbGxUb3A6IHBvc3Rpb259LCAnc2xvdydcblxuICAgIC5kZWxlZ2F0ZSAnLnNjb3JlJywgJ2hvdmVyJywgKGUpIC0+XG4gICAgICAkKCcubWFpbicpLnRyaWdnZXIgJ3RodW1iJywgJChlLnRhcmdldCkuZGF0YSgndGh1bWInKVxuXG4gICQoXCIucHJvdmlkZXIgaW5wdXRcIikuY2xpY2sgLT5cbiAgICAkKFwiZm9vdGVyIGlucHV0OmZpcnN0XCIpLnZhbCAkKHRoaXMpLmF0dHIoJ2RhdGEtcHJvdmlkZXInKVxuICAgICQoXCJmb290ZXIgZm9ybVwiKS5zdWJtaXQoKVxuXG4gICQoJ2JvZHknKS5vbiAnbmV3LW5laWdoYm9yLWRvbmUnLCAoZSwgbmVpZ2hib3IpIC0+XG4gICAgJCgnLnBhZ2UnKS5lYWNoIChpbmRleCwgZWxlbWVudCkgLT5cbiAgICAgIHdpa2kuZW1pdFR3aW5zICQoZWxlbWVudClcblxuICAkIC0+XG4gICAgc3RhdGUuZmlyc3QoKVxuICAgICQoJy5wYWdlJykuZWFjaCByZWZyZXNoXG4gICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcblxuIiwiY3JlYXRlU3lub3BzaXMgPSByZXF1aXJlICcuL3N5bm9wc2lzLmNvZmZlZSdcblxud2lraSA9IHsgY3JlYXRlU3lub3BzaXMgfVxuXG53aWtpLnBlcnNvbmEgPSByZXF1aXJlICcuL3BlcnNvbmEuY29mZmVlJ1xuXG53aWtpLmxvZyA9ICh0aGluZ3MuLi4pIC0+XG4gIGNvbnNvbGUubG9nIHRoaW5ncy4uLiBpZiBjb25zb2xlPy5sb2c/XG5cbndpa2kuYXNTbHVnID0gKG5hbWUpIC0+XG4gIG5hbWUucmVwbGFjZSgvXFxzL2csICctJykucmVwbGFjZSgvW15BLVphLXowLTktXS9nLCAnJykudG9Mb3dlckNhc2UoKVxuXG5cbndpa2kudXNlTG9jYWxTdG9yYWdlID0gLT5cbiAgJChcIi5sb2dpblwiKS5sZW5ndGggPiAwXG5cbndpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBbXVxuXG53aWtpLnJlc29sdmVGcm9tID0gKGFkZGl0aW9uLCBjYWxsYmFjaykgLT5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wdXNoIGFkZGl0aW9uXG4gIHRyeVxuICAgIGNhbGxiYWNrKClcbiAgZmluYWxseVxuICAgIHdpa2kucmVzb2x1dGlvbkNvbnRleHQucG9wKClcblxud2lraS5nZXREYXRhID0gKHZpcykgLT5cbiAgaWYgdmlzXG4gICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpXG4gICAgd2hvID0gJChcIi5pdGVtOmx0KCN7aWR4fSlcIikuZmlsdGVyKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KClcbiAgICBpZiB3aG8/IHRoZW4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhIGVsc2Uge31cbiAgZWxzZVxuICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKVxuICAgIGlmIHdobz8gdGhlbiB3aG8uZGF0YSgnaXRlbScpLmRhdGEgZWxzZSB7fVxuXG53aWtpLmdldERhdGFOb2RlcyA9ICh2aXMpIC0+XG4gIGlmIHZpc1xuICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKVxuICAgIHdobyA9ICQoXCIuaXRlbTpsdCgje2lkeH0pXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuICBlbHNlXG4gICAgd2hvID0gJCgnLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuXG53aWtpLmNyZWF0ZVBhZ2UgPSAobmFtZSwgbG9jKSAtPlxuICBzaXRlID0gbG9jIGlmIGxvYyBhbmQgbG9jIGlzbnQgJ3ZpZXcnXG4gICRwYWdlID0gJCBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwicGFnZVwiIGlkPVwiI3tuYW1lfVwiPlxuICAgICAgPGRpdiBjbGFzcz1cInR3aW5zXCI+IDxwPiA8L3A+IDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICA8aDE+IDxpbWcgY2xhc3M9XCJmYXZpY29uXCIgc3JjPVwiI3sgaWYgc2l0ZSB0aGVuIFwiLy8je3NpdGV9XCIgZWxzZSBcIlwiIH0vZmF2aWNvbi5wbmdcIiBoZWlnaHQ9XCIzMnB4XCI+ICN7bmFtZX0gPC9oMT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICBcIlwiXCJcbiAgJHBhZ2UuZmluZCgnLnBhZ2UnKS5hdHRyKCdkYXRhLXNpdGUnLCBzaXRlKSBpZiBzaXRlXG4gICRwYWdlXG5cbndpa2kuZ2V0SXRlbSA9IChlbGVtZW50KSAtPlxuICAkKGVsZW1lbnQpLmRhdGEoXCJpdGVtXCIpIG9yICQoZWxlbWVudCkuZGF0YSgnc3RhdGljSXRlbScpIGlmICQoZWxlbWVudCkubGVuZ3RoID4gMFxuXG53aWtpLnJlc29sdmVMaW5rcyA9IChzdHJpbmcpIC0+XG4gIHJlbmRlckludGVybmFsTGluayA9IChtYXRjaCwgbmFtZSkgLT5cbiAgICAjIHNwYWNlcyBiZWNvbWUgJ3NsdWdzJywgbm9uLWFscGhhLW51bSBnZXQgcmVtb3ZlZFxuICAgIHNsdWcgPSB3aWtpLmFzU2x1ZyBuYW1lXG4gICAgXCI8YSBjbGFzcz1cXFwiaW50ZXJuYWxcXFwiIGhyZWY9XFxcIi8je3NsdWd9Lmh0bWxcXFwiIGRhdGEtcGFnZS1uYW1lPVxcXCIje3NsdWd9XFxcIiB0aXRsZT1cXFwiI3t3aWtpLnJlc29sdXRpb25Db250ZXh0LmpvaW4oJyA9PiAnKX1cXFwiPiN7bmFtZX08L2E+XCJcbiAgc3RyaW5nXG4gICAgLnJlcGxhY2UoL1xcW1xcWyhbXlxcXV0rKVxcXVxcXS9naSwgcmVuZGVySW50ZXJuYWxMaW5rKVxuICAgIC5yZXBsYWNlKC9cXFsoaHR0cC4qPykgKC4qPylcXF0vZ2ksIFwiXCJcIjxhIGNsYXNzPVwiZXh0ZXJuYWxcIiB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJDFcIiB0aXRsZT1cIiQxXCIgcmVsPVwibm9mb2xsb3dcIj4kMiA8aW1nIHNyYz1cIi9pbWFnZXMvZXh0ZXJuYWwtbGluay1sdHItaWNvbi5wbmdcIj48L2E+XCJcIlwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdpa2lcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBhY3RpdmUgPSB7fVxuIyBGVU5DVElPTlMgYW5kIEhBTkRMRVJTIHRvIG1hbmFnZSB0aGUgYWN0aXZlIHBhZ2UsIGFuZCBzY3JvbGwgdmlld3BvcnQgdG8gc2hvdyBpdFxuXG5hY3RpdmUuc2Nyb2xsQ29udGFpbmVyID0gdW5kZWZpbmVkXG5maW5kU2Nyb2xsQ29udGFpbmVyID0gLT5cbiAgc2Nyb2xsZWQgPSAkKFwiYm9keSwgaHRtbFwiKS5maWx0ZXIgLT4gJCh0aGlzKS5zY3JvbGxMZWZ0KCkgPiAwXG4gIGlmIHNjcm9sbGVkLmxlbmd0aCA+IDBcbiAgICBzY3JvbGxlZFxuICBlbHNlXG4gICAgJChcImJvZHksIGh0bWxcIikuc2Nyb2xsTGVmdCgxMikuZmlsdGVyKC0+ICQodGhpcykuc2Nyb2xsTGVmdCgpID4gMCkuc2Nyb2xsVG9wKDApXG5cbnNjcm9sbFRvID0gKGVsKSAtPlxuICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyID89IGZpbmRTY3JvbGxDb250YWluZXIoKVxuICBib2R5V2lkdGggPSAkKFwiYm9keVwiKS53aWR0aCgpXG4gIG1pblggPSBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQoKVxuICBtYXhYID0gbWluWCArIGJvZHlXaWR0aFxuICB0YXJnZXQgPSBlbC5wb3NpdGlvbigpLmxlZnRcbiAgd2lkdGggPSBlbC5vdXRlcldpZHRoKHRydWUpXG4gIGNvbnRlbnRXaWR0aCA9ICQoXCIucGFnZVwiKS5vdXRlcldpZHRoKHRydWUpICogJChcIi5wYWdlXCIpLnNpemUoKVxuXG4gIGlmIHRhcmdldCA8IG1pblhcbiAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUgc2Nyb2xsTGVmdDogdGFyZ2V0XG4gIGVsc2UgaWYgdGFyZ2V0ICsgd2lkdGggPiBtYXhYXG4gICAgYWN0aXZlLnNjcm9sbENvbnRhaW5lci5hbmltYXRlIHNjcm9sbExlZnQ6IHRhcmdldCAtIChib2R5V2lkdGggLSB3aWR0aClcbiAgZWxzZSBpZiBtYXhYID4gJChcIi5wYWdlc1wiKS5vdXRlcldpZHRoKClcbiAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUgc2Nyb2xsTGVmdDogTWF0aC5taW4odGFyZ2V0LCBjb250ZW50V2lkdGggLSBib2R5V2lkdGgpXG5cbmFjdGl2ZS5zZXQgPSAoZWwpIC0+XG4gIGVsID0gJChlbClcbiAgJChcIi5hY3RpdmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIilcbiAgc2Nyb2xsVG8gZWwuYWRkQ2xhc3MoXCJhY3RpdmVcIilcblxuIiwibW9kdWxlLmV4cG9ydHMgPSAocGFnZSkgLT5cbiAgc3lub3BzaXMgPSBwYWdlLnN5bm9wc2lzXG4gIGlmIHBhZ2U/ICYmIHBhZ2Uuc3Rvcnk/XG4gICAgcDEgPSBwYWdlLnN0b3J5WzBdXG4gICAgcDIgPSBwYWdlLnN0b3J5WzFdXG4gICAgc3lub3BzaXMgfHw9IHAxLnRleHQgaWYgcDEgJiYgcDEudHlwZSA9PSAncGFyYWdyYXBoJ1xuICAgIHN5bm9wc2lzIHx8PSBwMi50ZXh0IGlmIHAyICYmIHAyLnR5cGUgPT0gJ3BhcmFncmFwaCdcbiAgICBzeW5vcHNpcyB8fD0gcDEudGV4dCBpZiBwMSAmJiBwMS50ZXh0P1xuICAgIHN5bm9wc2lzIHx8PSBwMi50ZXh0IGlmIHAyICYmIHAyLnRleHQ/XG4gICAgc3lub3BzaXMgfHw9IHBhZ2Uuc3Rvcnk/ICYmIFwiQSBwYWdlIHdpdGggI3twYWdlLnN0b3J5Lmxlbmd0aH0gaXRlbXMuXCJcbiAgZWxzZVxuICAgIHN5bm9wc2lzID0gJ0EgcGFnZSB3aXRoIG5vIHN0b3J5LidcbiAgcmV0dXJuIHN5bm9wc2lzXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gKG93bmVyKSAtPlxuICAkKFwiI3VzZXItZW1haWxcIikuaGlkZSgpXG4gICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuaGlkZSgpXG4gICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLmhpZGUoKVxuICBuYXZpZ2F0b3IuaWQud2F0Y2hcbiAgICBsb2dnZWRJblVzZXI6IG93bmVyXG4gICAgb25sb2dpbjogKGFzc2VydGlvbikgLT5cbiAgICAgIGNvbnNvbGUubG9nIFwiYXNzZXJ0aW9uPVwiLCBhc3NlcnRpb25cbiAgICAgICQucG9zdCBcIi9wZXJzb25hX2xvZ2luXCIsXG4gICAgICAgIGFzc2VydGlvbjogYXNzZXJ0aW9uXG4gICAgICAsICh2ZXJpZmllZCkgLT5cbiAgICAgICAgdmVyaWZpZWQgPSBKU09OLnBhcnNlKHZlcmlmaWVkKVxuICAgICAgICBjb25zb2xlLmxvZyB2ZXJpZmllZFxuICAgICAgICBpZiBcIm9rYXlcIiBpcyB2ZXJpZmllZC5zdGF0dXNcbiAgICAgICAgICBjb25zb2xlLmxvZygnU2V0dGluZyBlbWFpbCB0byAnICsgdmVyaWZpZWQuZW1haWwpXG4gICAgICAgICAgJChcIiN1c2VyLWVtYWlsXCIpLnRleHQodmVyaWZpZWQuZW1haWwpLnNob3coKVxuICAgICAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuaGlkZSgpXG4gICAgICAgICAgJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcbiAgICAgICAgICAjIFZlcmlmaWNhdGlvbiBmYWlsZWRcbiAgICAgICAgICBuYXZpZ2F0b3IuaWQubG9nb3V0KClcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBcIi9vb3BzXCIgIGlmIFwid3JvbmctYWRkcmVzc1wiIGlzIHZlcmlmaWVkLnN0YXR1c1xuXG5cbiAgICBvbmxvZ291dDogLT5cbiAgICAgIGNvbnNvbGUubG9nIFwibG9nZ2luZyBvdXRcIlxuICAgICAgJC5wb3N0IFwiL3BlcnNvbmFfbG9nb3V0XCJcbiAgICAgICQoXCIjdXNlci1lbWFpbFwiKS5oaWRlKClcbiAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuc2hvdygpXG4gICAgICAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5oaWRlKClcblxuICAgIG9ubWF0Y2g6IC0+XG4gICAgICBjb25zb2xlLmxvZyBcIkl0IGlzIHNhZmUgdG8gcmVuZGVyIHRoZSBVSVwiXG4gICAgICBpZiBvd25lclxuICAgICAgICAkKFwiI3VzZXItZW1haWxcIikudGV4dChvd25lcikuc2hvdygpXG4gICAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuaGlkZSgpXG4gICAgICAgICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLnNob3coKVxuICAgICAgZWxzZVxuICAgICAgICAkKFwiI3VzZXItZW1haWxcIikuaGlkZSgpXG4gICAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuc2hvdygpXG4gICAgICAgICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLmhpZGUoKVxuXG4gICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuY2xpY2sgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgbmF2aWdhdG9yLmlkLnJlcXVlc3Qge31cblxuICAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5jbGljayAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBuYXZpZ2F0b3IuaWQubG9nb3V0KClcbiIsIndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xubW9kdWxlLmV4cG9ydHMgPSB3aWtpLnV0aWwgPSB1dGlsID0ge31cblxudXRpbC5zeW1ib2xzID1cbiAgY3JlYXRlOiAn4pi8J1xuICBhZGQ6ICcrJ1xuICBlZGl0OiAn4pyOJ1xuICBmb3JrOiAn4pqRJ1xuICBtb3ZlOiAn4oaVJ1xuICByZW1vdmU6ICfinJUnXG5cbnV0aWwucmFuZG9tQnl0ZSA9IC0+XG4gICgoKDErTWF0aC5yYW5kb20oKSkqMHgxMDApfDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSlcblxudXRpbC5yYW5kb21CeXRlcyA9IChuKSAtPlxuICAodXRpbC5yYW5kb21CeXRlKCkgZm9yIFsxLi5uXSkuam9pbignJylcblxuIyBmb3IgY2hhcnQgcGx1Zy1pblxudXRpbC5mb3JtYXRUaW1lID0gKHRpbWUpIC0+XG4gIGQgPSBuZXcgRGF0ZSAoaWYgdGltZSA+IDEwMDAwMDAwMDAwIHRoZW4gdGltZSBlbHNlIHRpbWUqMTAwMClcbiAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXVxuICBoID0gZC5nZXRIb3VycygpXG4gIGFtID0gaWYgaCA8IDEyIHRoZW4gJ0FNJyBlbHNlICdQTSdcbiAgaCA9IGlmIGggPT0gMCB0aGVuIDEyIGVsc2UgaWYgaCA+IDEyIHRoZW4gaCAtIDEyIGVsc2UgaFxuICBtaSA9IChpZiBkLmdldE1pbnV0ZXMoKSA8IDEwIHRoZW4gXCIwXCIgZWxzZSBcIlwiKSArIGQuZ2V0TWludXRlcygpXG4gIFwiI3tofToje21pfSAje2FtfTxicj4je2QuZ2V0RGF0ZSgpfSAje21vfSAje2QuZ2V0RnVsbFllYXIoKX1cIlxuXG4jIGZvciBqb3VybmFsIG1vdXNlLW92ZXJzIGFuZCBwb3NzaWJseSBmb3IgZGF0ZSBoZWFkZXJcbnV0aWwuZm9ybWF0RGF0ZSA9IChtc1NpbmNlRXBvY2gpIC0+XG4gIGQgPSBuZXcgRGF0ZShtc1NpbmNlRXBvY2gpXG4gIHdrID0gWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXVtkLmdldERheSgpXVxuICBtbyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVtkLmdldE1vbnRoKCldXG4gIGRheSA9IGQuZ2V0RGF0ZSgpO1xuICB5ciA9IGQuZ2V0RnVsbFllYXIoKTtcbiAgaCA9IGQuZ2V0SG91cnMoKVxuICBhbSA9IGlmIGggPCAxMiB0aGVuICdBTScgZWxzZSAnUE0nXG4gIGggPSBpZiBoID09IDAgdGhlbiAxMiBlbHNlIGlmIGggPiAxMiB0aGVuIGggLSAxMiBlbHNlIGhcbiAgbWkgPSAoaWYgZC5nZXRNaW51dGVzKCkgPCAxMCB0aGVuIFwiMFwiIGVsc2UgXCJcIikgKyBkLmdldE1pbnV0ZXMoKVxuICBzZWMgPSAoaWYgZC5nZXRTZWNvbmRzKCkgPCAxMCB0aGVuIFwiMFwiIGVsc2UgXCJcIikgKyBkLmdldFNlY29uZHMoKVxuICBcIiN7d2t9ICN7bW99ICN7ZGF5fSwgI3t5cn08YnI+I3tofToje21pfToje3NlY30gI3thbX1cIlxuXG51dGlsLmZvcm1hdEVsYXBzZWRUaW1lID0gKG1zU2luY2VFcG9jaCkgLT5cbiAgbXNlY3MgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBtc1NpbmNlRXBvY2gpXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBtc2Vjc30gbWlsbGlzZWNvbmRzIGFnb1wiIGlmIChzZWNzID0gbXNlY3MvMTAwMCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBzZWNzfSBzZWNvbmRzIGFnb1wiIGlmIChtaW5zID0gc2Vjcy82MCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBtaW5zfSBtaW51dGVzIGFnb1wiIGlmIChocnMgPSBtaW5zLzYwKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIGhyc30gaG91cnMgYWdvXCIgaWYgKGRheXMgPSBocnMvMjQpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgZGF5c30gZGF5cyBhZ29cIiBpZiAod2Vla3MgPSBkYXlzLzcpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3Igd2Vla3N9IHdlZWtzIGFnb1wiIGlmIChtb250aHMgPSBkYXlzLzMxKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIG1vbnRoc30gbW9udGhzIGFnb1wiIGlmICh5ZWFycyA9IGRheXMvMzY1KSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIHllYXJzfSB5ZWFycyBhZ29cIlxuXG4jIERFRkFVTFRTIGZvciByZXF1aXJlZCBmaWVsZHNcblxudXRpbC5lbXB0eVBhZ2UgPSAoKSAtPlxuICB0aXRsZTogJ2VtcHR5J1xuICBzdG9yeTogW11cbiAgam91cm5hbDogW11cblxuXG4jIElmIHRoZSBzZWxlY3Rpb24gc3RhcnQgYW5kIHNlbGVjdGlvbiBlbmQgYXJlIGJvdGggdGhlIHNhbWUsXG4jIHRoZW4geW91IGhhdmUgdGhlIGNhcmV0IHBvc2l0aW9uLiBJZiB0aGVyZSBpcyBzZWxlY3RlZCB0ZXh0LCBcbiMgdGhlIGJyb3dzZXIgd2lsbCBub3QgdGVsbCB5b3Ugd2hlcmUgdGhlIGNhcmV0IGlzLCBidXQgaXQgd2lsbCBcbiMgZWl0aGVyIGJlIGF0IHRoZSBiZWdpbm5pbmcgb3IgdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uIFxuIyhkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGlvbiBvZiB0aGUgc2VsZWN0aW9uKS5cbnV0aWwuZ2V0U2VsZWN0aW9uUG9zID0gKGpRdWVyeUVsZW1lbnQpIC0+IFxuICBlbCA9IGpRdWVyeUVsZW1lbnQuZ2V0KDApICMgZ2V0cyBET00gTm9kZSBmcm9tIGZyb20galF1ZXJ5IHdyYXBwZXJcbiAgaWYgZG9jdW1lbnQuc2VsZWN0aW9uICMgSUVcbiAgICBlbC5mb2N1cygpXG4gICAgc2VsID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKClcbiAgICBzZWwubW92ZVN0YXJ0ICdjaGFyYWN0ZXInLCAtZWwudmFsdWUubGVuZ3RoXG4gICAgaWVQb3MgPSBzZWwudGV4dC5sZW5ndGhcbiAgICB7c3RhcnQ6IGllUG9zLCBlbmQ6IGllUG9zfVxuICBlbHNlXG4gICAge3N0YXJ0OiBlbC5zZWxlY3Rpb25TdGFydCwgZW5kOiBlbC5zZWxlY3Rpb25FbmR9XG5cbnV0aWwuc2V0Q2FyZXRQb3NpdGlvbiA9IChqUXVlcnlFbGVtZW50LCBjYXJldFBvcykgLT5cbiAgZWwgPSBqUXVlcnlFbGVtZW50LmdldCgwKVxuICBpZiBlbD9cbiAgICBpZiBlbC5jcmVhdGVUZXh0UmFuZ2UgIyBJRVxuICAgICAgcmFuZ2UgPSBlbC5jcmVhdGVUZXh0UmFuZ2UoKVxuICAgICAgcmFuZ2UubW92ZSBcImNoYXJhY3RlclwiLCBjYXJldFBvc1xuICAgICAgcmFuZ2Uuc2VsZWN0KClcbiAgICBlbHNlICMgcmVzdCBvZiB0aGUgd29ybGRcbiAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlIGNhcmV0UG9zLCBjYXJldFBvc1xuICAgIGVsLmZvY3VzKClcblxuIiwid2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSB7fVxuXG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIGxvY2F0aW9uIGJhciBhbmQgYmFjayBidXR0b25cblxuc3RhdGUucGFnZXNJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPiBlbC5pZFxuXG5zdGF0ZS51cmxQYWdlcyA9IC0+XG4gIChpIGZvciBpIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKSBieSAyKVsxLi5dXG5cbnN0YXRlLmxvY3NJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPlxuICAgICQoZWwpLmRhdGEoJ3NpdGUnKSBvciAndmlldydcblxuc3RhdGUudXJsTG9jcyA9IC0+XG4gIChqIGZvciBqIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKVsxLi5dIGJ5IDIpXG5cbnN0YXRlLnNldFVybCA9IC0+XG4gIGRvY3VtZW50LnRpdGxlID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKT8udGl0bGVcbiAgaWYgaGlzdG9yeSBhbmQgaGlzdG9yeS5wdXNoU3RhdGVcbiAgICBsb2NzID0gc3RhdGUubG9jc0luRG9tKClcbiAgICBwYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICAgIHVybCA9IChcIi8je2xvY3M/W2lkeF0gb3IgJ3ZpZXcnfS8je3BhZ2V9XCIgZm9yIHBhZ2UsIGlkeCBpbiBwYWdlcykuam9pbignJylcbiAgICB1bmxlc3MgdXJsIGlzICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJylcbiAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIHVybClcblxuc3RhdGUuc2hvdyA9IChlKSAtPlxuICBvbGRQYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICBuZXdQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgb2xkTG9jcyA9IHN0YXRlLmxvY3NJbkRvbSgpXG4gIG5ld0xvY3MgPSBzdGF0ZS51cmxMb2NzKClcblxuICByZXR1cm4gaWYgKCFsb2NhdGlvbi5wYXRobmFtZSBvciBsb2NhdGlvbi5wYXRobmFtZSBpcyAnLycpXG5cbiAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKDApXG5cbiAgZm9yIG5hbWUsIGlkeCBpbiBuZXdQYWdlc1xuICAgIHVubGVzcyBuYW1lIGlzIG9sZFBhZ2VzW2lkeF1cbiAgICAgIG9sZCA9ICQoJy5wYWdlJykuZXEoaWR4KVxuICAgICAgb2xkLnJlbW92ZSgpIGlmIG9sZFxuICAgICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsIG5ld0xvY3NbaWR4XSkuaW5zZXJ0QWZ0ZXIocHJldmlvdXMpLmVhY2ggd2lraS5yZWZyZXNoXG4gICAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKGlkeClcblxuICBwcmV2aW91cy5uZXh0QWxsKCkucmVtb3ZlKClcblxuICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuICBkb2N1bWVudC50aXRsZSA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJyk/LnRpdGxlXG5cbnN0YXRlLmZpcnN0ID0gLT5cbiAgc3RhdGUuc2V0VXJsKClcbiAgZmlyc3RVcmxQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgZmlyc3RVcmxMb2NzID0gc3RhdGUudXJsTG9jcygpXG4gIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpXG4gIGZvciB1cmxQYWdlLCBpZHggaW4gZmlyc3RVcmxQYWdlcyB3aGVuIHVybFBhZ2Ugbm90IGluIG9sZFBhZ2VzXG4gICAgd2lraS5jcmVhdGVQYWdlKHVybFBhZ2UsIGZpcnN0VXJsTG9jc1tpZHhdKS5hcHBlbmRUbygnLm1haW4nKSB1bmxlc3MgdXJsUGFnZSBpcyAnJ1xuXG4iLCJ1dGlsID0gcmVxdWlyZSgnLi91dGlsLmNvZmZlZScpXG53aWtpID0gcmVxdWlyZSAnLi93aWtpLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSBwbHVnaW4gPSB7fVxuXG4jIFRPRE86IFJlbW92ZSB0aGVzZSBtZXRob2RzIGZyb20gd2lraSBvYmplY3Q/XG4jXG5cbnNjcmlwdHMgPSB7fVxuZ2V0U2NyaXB0ID0gd2lraS5nZXRTY3JpcHQgPSAodXJsLCBjYWxsYmFjayA9ICgpIC0+KSAtPlxuICBpZiBzY3JpcHRzW3VybF0/XG4gICAgY2FsbGJhY2soKVxuICBlbHNlXG4gICAgJC5nZXRTY3JpcHQodXJsKVxuICAgICAgLmRvbmUgLT5cbiAgICAgICAgc2NyaXB0c1t1cmxdID0gdHJ1ZVxuICAgICAgICBjYWxsYmFjaygpXG4gICAgICAuZmFpbCAtPlxuICAgICAgICBjYWxsYmFjaygpXG5cbnBsdWdpbi5nZXQgPSB3aWtpLmdldFBsdWdpbiA9IChuYW1lLCBjYWxsYmFjaykgLT5cbiAgcmV0dXJuIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKSBpZiB3aW5kb3cucGx1Z2luc1tuYW1lXVxuICBnZXRTY3JpcHQgXCIvcGx1Z2lucy8je25hbWV9LyN7bmFtZX0uanNcIiwgKCkgLT5cbiAgICByZXR1cm4gY2FsbGJhY2sod2luZG93LnBsdWdpbnNbbmFtZV0pIGlmIHdpbmRvdy5wbHVnaW5zW25hbWVdXG4gICAgZ2V0U2NyaXB0IFwiL3BsdWdpbnMvI3tuYW1lfS5qc1wiLCAoKSAtPlxuICAgICAgY2FsbGJhY2sod2luZG93LnBsdWdpbnNbbmFtZV0pXG5cbnBsdWdpbi5kbyA9IHdpa2kuZG9QbHVnaW4gPSAoZGl2LCBpdGVtLCBkb25lPS0+KSAtPlxuICBlcnJvciA9IChleCkgLT5cbiAgICBlcnJvckVsZW1lbnQgPSAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcygnZXJyb3InKVxuICAgIGVycm9yRWxlbWVudC50ZXh0KGV4LnRvU3RyaW5nKCkpXG4gICAgZGl2LmFwcGVuZChlcnJvckVsZW1lbnQpXG5cbiAgZGl2LmRhdGEgJ3BhZ2VFbGVtZW50JywgZGl2LnBhcmVudHMoXCIucGFnZVwiKVxuICBkaXYuZGF0YSAnaXRlbScsIGl0ZW1cbiAgcGx1Z2luLmdldCBpdGVtLnR5cGUsIChzY3JpcHQpIC0+XG4gICAgdHJ5XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBmaW5kIHBsdWdpbiBmb3IgJyN7aXRlbS50eXBlfSdcIikgdW5sZXNzIHNjcmlwdD9cbiAgICAgIGlmIHNjcmlwdC5lbWl0Lmxlbmd0aCA+IDJcbiAgICAgICAgc2NyaXB0LmVtaXQgZGl2LCBpdGVtLCAtPlxuICAgICAgICAgIHNjcmlwdC5iaW5kIGRpdiwgaXRlbVxuICAgICAgICAgIGRvbmUoKVxuICAgICAgZWxzZVxuICAgICAgICBzY3JpcHQuZW1pdCBkaXYsIGl0ZW1cbiAgICAgICAgc2NyaXB0LmJpbmQgZGl2LCBpdGVtXG4gICAgICAgIGRvbmUoKVxuICAgIGNhdGNoIGVyclxuICAgICAgd2lraS5sb2cgJ3BsdWdpbiBlcnJvcicsIGVyclxuICAgICAgZXJyb3IoZXJyKVxuICAgICAgZG9uZSgpXG5cbndpa2kucmVnaXN0ZXJQbHVnaW4gPSAocGx1Z2luTmFtZSxwbHVnaW5GbiktPlxuICB3aW5kb3cucGx1Z2luc1twbHVnaW5OYW1lXSA9IHBsdWdpbkZuKCQpXG5cblxuIyBQTFVHSU5TIGZvciBlYWNoIHN0b3J5IGl0ZW0gdHlwZVxuXG53aW5kb3cucGx1Z2lucyA9XG4gIHBhcmFncmFwaDpcbiAgICBlbWl0OiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZm9yIHRleHQgaW4gaXRlbS50ZXh0LnNwbGl0IC9cXG5cXG4rL1xuICAgICAgICBkaXYuYXBwZW5kIFwiPHA+I3t3aWtpLnJlc29sdmVMaW5rcyh0ZXh0KX08L3A+XCIgaWYgdGV4dC5tYXRjaCAvXFxTL1xuICAgIGJpbmQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBkaXYuZGJsY2xpY2sgLT4gd2lraS50ZXh0RWRpdG9yIGRpdiwgaXRlbSwgbnVsbCwgdHJ1ZVxuICBpbWFnZTpcbiAgICBlbWl0OiAoZGl2LCBpdGVtKSAtPlxuICAgICAgaXRlbS50ZXh0IHx8PSBpdGVtLmNhcHRpb25cbiAgICAgIGRpdi5hcHBlbmQgXCI8aW1nIGNsYXNzPXRodW1ibmFpbCBzcmM9XFxcIiN7aXRlbS51cmx9XFxcIj4gPHA+I3t3aWtpLnJlc29sdmVMaW5rcyhpdGVtLnRleHQpfTwvcD5cIlxuICAgIGJpbmQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBkaXYuZGJsY2xpY2sgLT4gd2lraS50ZXh0RWRpdG9yIGRpdiwgaXRlbVxuICAgICAgZGl2LmZpbmQoJ2ltZycpLmRibGNsaWNrIC0+IHdpa2kuZGlhbG9nIGl0ZW0udGV4dCwgdGhpc1xuICBmdXR1cmU6XG4gICAgZW1pdDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGRpdi5hcHBlbmQgXCJcIlwiI3tpdGVtLnRleHR9PGJyPjxicj48YnV0dG9uIGNsYXNzPVwiY3JlYXRlXCI+Y3JlYXRlPC9idXR0b24+IG5ldyBibGFuayBwYWdlXCJcIlwiXG4gICAgICBpZiAoaW5mbyA9IHdpa2kubmVpZ2hib3Job29kW2xvY2F0aW9uLmhvc3RdKT8gYW5kIGluZm8uc2l0ZW1hcD9cbiAgICAgICAgZm9yIGl0ZW0gaW4gaW5mby5zaXRlbWFwXG4gICAgICAgICAgaWYgaXRlbS5zbHVnLm1hdGNoIC8tdGVtcGxhdGUkL1xuICAgICAgICAgICAgZGl2LmFwcGVuZCBcIlwiXCI8YnI+PGJ1dHRvbiBjbGFzcz1cImNyZWF0ZVwiIGRhdGEtc2x1Zz0je2l0ZW0uc2x1Z30+Y3JlYXRlPC9idXR0b24+IGZyb20gI3t3aWtpLnJlc29sdmVMaW5rcyBcIltbI3tpdGVtLnRpdGxlfV1dXCJ9XCJcIlwiXG4gICAgYmluZDogKGRpdiwgaXRlbSkgLT5cbiIsIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlJ1xuXG53aWtpID0gcmVxdWlyZSAnLi93aWtpLmNvZmZlZSdcbnV0aWwgPSByZXF1aXJlICcuL3V0aWwuY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcbnJldmlzaW9uID0gcmVxdWlyZSAnLi9yZXZpc2lvbi5jb2ZmZWUnXG5hZGRUb0pvdXJuYWwgPSByZXF1aXJlICcuL2FkZFRvSm91cm5hbC5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gcGFnZUhhbmRsZXIgPSB7fVxuXG5wYWdlRnJvbUxvY2FsU3RvcmFnZSA9IChzbHVnKS0+XG4gIGlmIGpzb24gPSBsb2NhbFN0b3JhZ2Vbc2x1Z11cbiAgICBKU09OLnBhcnNlKGpzb24pXG4gIGVsc2VcbiAgICB1bmRlZmluZWRcblxucmVjdXJzaXZlR2V0ID0gKHtwYWdlSW5mb3JtYXRpb24sIHdoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW4sIGxvY2FsQ29udGV4dH0pIC0+XG4gIHtzbHVnLHJldixzaXRlfSA9IHBhZ2VJbmZvcm1hdGlvblxuXG4gIGlmIHNpdGVcbiAgICBsb2NhbENvbnRleHQgPSBbXVxuICBlbHNlXG4gICAgc2l0ZSA9IGxvY2FsQ29udGV4dC5zaGlmdCgpXG5cbiAgc2l0ZSA9IG51bGwgaWYgc2l0ZT09J3ZpZXcnXG5cbiAgaWYgc2l0ZT9cbiAgICBpZiBzaXRlID09ICdsb2NhbCdcbiAgICAgIGlmIGxvY2FsUGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VJbmZvcm1hdGlvbi5zbHVnKVxuICAgICAgICByZXR1cm4gd2hlbkdvdHRlbiggbG9jYWxQYWdlLCAnbG9jYWwnIClcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHdoZW5Ob3RHb3R0ZW4oKVxuICAgIGVsc2VcbiAgICAgIGlmIHNpdGUgPT0gJ29yaWdpbidcbiAgICAgICAgdXJsID0gXCIvI3tzbHVnfS5qc29uXCJcbiAgICAgIGVsc2VcbiAgICAgICAgdXJsID0gXCJodHRwOi8vI3tzaXRlfS8je3NsdWd9Lmpzb25cIlxuICBlbHNlXG4gICAgdXJsID0gXCIvI3tzbHVnfS5qc29uXCJcblxuICAkLmFqYXhcbiAgICB0eXBlOiAnR0VUJ1xuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICB1cmw6IHVybCArIFwiP3JhbmRvbT0je3V0aWwucmFuZG9tQnl0ZXMoNCl9XCJcbiAgICBzdWNjZXNzOiAocGFnZSkgLT5cbiAgICAgIHBhZ2UgPSByZXZpc2lvbi5jcmVhdGUgcmV2LCBwYWdlIGlmIHJldlxuICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4ocGFnZSxzaXRlKVxuICAgIGVycm9yOiAoeGhyLCB0eXBlLCBtc2cpIC0+XG4gICAgICBpZiAoeGhyLnN0YXR1cyAhPSA0MDQpIGFuZCAoeGhyLnN0YXR1cyAhPSAwKVxuICAgICAgICB3aWtpLmxvZyAncGFnZUhhbmRsZXIuZ2V0IGVycm9yJywgeGhyLCB4aHIuc3RhdHVzLCB0eXBlLCBtc2dcbiAgICAgICAgcmVwb3J0ID1cbiAgICAgICAgICAndGl0bGUnOiBcIiN7eGhyLnN0YXR1c30gI3ttc2d9XCJcbiAgICAgICAgICAnc3RvcnknOiBbXG4gICAgICAgICAgICAndHlwZSc6ICdwYXJhZ3JhcGgnXG4gICAgICAgICAgICAnaWQnOiAnOTI4NzM5MTg3MjQzJ1xuICAgICAgICAgICAgJ3RleHQnOiBcIjxwcmU+I3t4aHIucmVzcG9uc2VUZXh0fVwiXG4gICAgICAgICAgXVxuICAgICAgICByZXR1cm4gd2hlbkdvdHRlbiByZXBvcnQsICdsb2NhbCdcbiAgICAgIGlmIGxvY2FsQ29udGV4dC5sZW5ndGggPiAwXG4gICAgICAgIHJlY3Vyc2l2ZUdldCgge3BhZ2VJbmZvcm1hdGlvbiwgd2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbiwgbG9jYWxDb250ZXh0fSApXG4gICAgICBlbHNlXG4gICAgICAgIHdoZW5Ob3RHb3R0ZW4oKVxuXG5wYWdlSGFuZGxlci5nZXQgPSAoe3doZW5Hb3R0ZW4sd2hlbk5vdEdvdHRlbixwYWdlSW5mb3JtYXRpb259ICApIC0+XG5cbiAgdW5sZXNzIHBhZ2VJbmZvcm1hdGlvbi5zaXRlXG4gICAgaWYgbG9jYWxQYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZUluZm9ybWF0aW9uLnNsdWcpXG4gICAgICBsb2NhbFBhZ2UgPSByZXZpc2lvbi5jcmVhdGUgcGFnZUluZm9ybWF0aW9uLnJldiwgbG9jYWxQYWdlIGlmIHBhZ2VJbmZvcm1hdGlvbi5yZXZcbiAgICAgIHJldHVybiB3aGVuR290dGVuKCBsb2NhbFBhZ2UsICdsb2NhbCcgKVxuXG4gIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJ3ZpZXcnXSB1bmxlc3MgcGFnZUhhbmRsZXIuY29udGV4dC5sZW5ndGhcblxuICByZWN1cnNpdmVHZXRcbiAgICBwYWdlSW5mb3JtYXRpb246IHBhZ2VJbmZvcm1hdGlvblxuICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW5cbiAgICB3aGVuTm90R290dGVuOiB3aGVuTm90R290dGVuXG4gICAgbG9jYWxDb250ZXh0OiBfLmNsb25lKHBhZ2VIYW5kbGVyLmNvbnRleHQpXG5cblxucGFnZUhhbmRsZXIuY29udGV4dCA9IFtdXG5cbnB1c2hUb0xvY2FsID0gKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKSAtPlxuICBwYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UgcGFnZVB1dEluZm8uc2x1Z1xuICBwYWdlID0ge3RpdGxlOiBhY3Rpb24uaXRlbS50aXRsZX0gaWYgYWN0aW9uLnR5cGUgPT0gJ2NyZWF0ZSdcbiAgcGFnZSB8fD0gcGFnZUVsZW1lbnQuZGF0YShcImRhdGFcIilcbiAgcGFnZS5qb3VybmFsID0gW10gdW5sZXNzIHBhZ2Uuam91cm5hbD9cbiAgaWYgKHNpdGU9YWN0aW9uWydmb3JrJ10pP1xuICAgIHBhZ2Uuam91cm5hbCA9IHBhZ2Uuam91cm5hbC5jb25jYXQoeyd0eXBlJzonZm9yaycsJ3NpdGUnOnNpdGV9KVxuICAgIGRlbGV0ZSBhY3Rpb25bJ2ZvcmsnXVxuICBwYWdlLmpvdXJuYWwgPSBwYWdlLmpvdXJuYWwuY29uY2F0KGFjdGlvbilcbiAgcGFnZS5zdG9yeSA9ICQocGFnZUVsZW1lbnQpLmZpbmQoXCIuaXRlbVwiKS5tYXAoLT4gJChAKS5kYXRhKFwiaXRlbVwiKSkuZ2V0KClcbiAgbG9jYWxTdG9yYWdlW3BhZ2VQdXRJbmZvLnNsdWddID0gSlNPTi5zdHJpbmdpZnkocGFnZSlcbiAgYWRkVG9Kb3VybmFsIHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksIGFjdGlvblxuXG5wdXNoVG9TZXJ2ZXIgPSAocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pIC0+XG4gICQuYWpheFxuICAgIHR5cGU6ICdQVVQnXG4gICAgdXJsOiBcIi9wYWdlLyN7cGFnZVB1dEluZm8uc2x1Z30vYWN0aW9uXCJcbiAgICBkYXRhOlxuICAgICAgJ2FjdGlvbic6IEpTT04uc3RyaW5naWZ5KGFjdGlvbilcbiAgICBzdWNjZXNzOiAoKSAtPlxuICAgICAgYWRkVG9Kb3VybmFsIHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksIGFjdGlvblxuICAgICAgaWYgYWN0aW9uLnR5cGUgPT0gJ2ZvcmsnICMgcHVzaFxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSBwYWdlRWxlbWVudC5hdHRyKCdpZCcpXG4gICAgICAgIHN0YXRlLnNldFVybFxuICAgIGVycm9yOiAoeGhyLCB0eXBlLCBtc2cpIC0+XG4gICAgICB3aWtpLmxvZyBcInBhZ2VIYW5kbGVyLnB1dCBhamF4IGVycm9yIGNhbGxiYWNrXCIsIHR5cGUsIG1zZ1xuXG5wYWdlSGFuZGxlci5wdXQgPSAocGFnZUVsZW1lbnQsIGFjdGlvbikgLT5cblxuICBjaGVja2VkU2l0ZSA9ICgpIC0+XG4gICAgc3dpdGNoIHNpdGUgPSBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJylcbiAgICAgIHdoZW4gJ29yaWdpbicsICdsb2NhbCcsICd2aWV3JyB0aGVuIG51bGxcbiAgICAgIHdoZW4gbG9jYXRpb24uaG9zdCB0aGVuIG51bGxcbiAgICAgIGVsc2Ugc2l0ZVxuXG4gICMgYWJvdXQgdGhlIHBhZ2Ugd2UgaGF2ZVxuICBwYWdlUHV0SW5mbyA9IHtcbiAgICBzbHVnOiBwYWdlRWxlbWVudC5hdHRyKCdpZCcpLnNwbGl0KCdfcmV2JylbMF1cbiAgICByZXY6IHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVsxXVxuICAgIHNpdGU6IGNoZWNrZWRTaXRlKClcbiAgICBsb2NhbDogcGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2xvY2FsJylcbiAgfVxuICBmb3JrRnJvbSA9IHBhZ2VQdXRJbmZvLnNpdGVcbiAgd2lraS5sb2cgJ3BhZ2VIYW5kbGVyLnB1dCcsIGFjdGlvbiwgcGFnZVB1dEluZm9cblxuICAjIGRldGVjdCB3aGVuIGZvcmsgdG8gbG9jYWwgc3RvcmFnZVxuICBpZiB3aWtpLnVzZUxvY2FsU3RvcmFnZSgpXG4gICAgaWYgcGFnZVB1dEluZm8uc2l0ZT9cbiAgICAgIHdpa2kubG9nICdyZW1vdGUgPT4gbG9jYWwnXG4gICAgZWxzZSBpZiAhcGFnZVB1dEluZm8ubG9jYWxcbiAgICAgIHdpa2kubG9nICdvcmlnaW4gPT4gbG9jYWwnXG4gICAgICBhY3Rpb24uc2l0ZSA9IGZvcmtGcm9tID0gbG9jYXRpb24uaG9zdFxuICAgICMgZWxzZSBpZiAhcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZVB1dEluZm8uc2x1ZylcbiAgICAjICAgd2lraS5sb2cgJydcbiAgICAjICAgYWN0aW9uLnNpdGUgPSBmb3JrRnJvbSA9IHBhZ2VQdXRJbmZvLnNpdGVcbiAgICAjICAgd2lraS5sb2cgJ2xvY2FsIHN0b3JhZ2UgZmlyc3QgdGltZScsIGFjdGlvbiwgJ2ZvcmtGcm9tJywgZm9ya0Zyb21cblxuICAjIHR3ZWVrIGFjdGlvbiBiZWZvcmUgc2F2aW5nXG4gIGFjdGlvbi5kYXRlID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKVxuICBkZWxldGUgYWN0aW9uLnNpdGUgaWYgYWN0aW9uLnNpdGUgPT0gJ29yaWdpbidcblxuICAjIHVwZGF0ZSBkb20gd2hlbiBmb3JraW5nXG4gIGlmIGZvcmtGcm9tXG4gICAgIyBwdWxsIHJlbW90ZSBzaXRlIGNsb3NlciB0byB1c1xuICAgIHBhZ2VFbGVtZW50LmZpbmQoJ2gxIGltZycpLmF0dHIoJ3NyYycsICcvZmF2aWNvbi5wbmcnKVxuICAgIHBhZ2VFbGVtZW50LmZpbmQoJ2gxIGEnKS5hdHRyKCdocmVmJywgJy8nKVxuICAgIHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnLCBudWxsKVxuICAgIHBhZ2VFbGVtZW50LnJlbW92ZUNsYXNzKCdyZW1vdGUnKVxuICAgIHN0YXRlLnNldFVybCgpXG4gICAgaWYgYWN0aW9uLnR5cGUgIT0gJ2ZvcmsnXG4gICAgICAjIGJ1bmRsZSBpbXBsaWNpdCBmb3JrIHdpdGggbmV4dCBhY3Rpb25cbiAgICAgIGFjdGlvbi5mb3JrID0gZm9ya0Zyb21cbiAgICAgIGFkZFRvSm91cm5hbCBwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLFxuICAgICAgICB0eXBlOiAnZm9yaydcbiAgICAgICAgc2l0ZTogZm9ya0Zyb21cbiAgICAgICAgZGF0ZTogYWN0aW9uLmRhdGVcblxuICAjIHN0b3JlIGFzIGFwcHJvcHJpYXRlXG4gIGlmIHdpa2kudXNlTG9jYWxTdG9yYWdlKCkgb3IgcGFnZVB1dEluZm8uc2l0ZSA9PSAnbG9jYWwnXG4gICAgcHVzaFRvTG9jYWwocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pXG4gICAgcGFnZUVsZW1lbnQuYWRkQ2xhc3MoXCJsb2NhbFwiKVxuICBlbHNlXG4gICAgcHVzaFRvU2VydmVyKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKVxuXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcblxudXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5wYWdlSGFuZGxlciA9IHJlcXVpcmUgJy4vcGFnZUhhbmRsZXIuY29mZmVlJ1xucGx1Z2luID0gcmVxdWlyZSAnLi9wbHVnaW4uY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcbm5laWdoYm9yaG9vZCA9IHJlcXVpcmUgJy4vbmVpZ2hib3Job29kLmNvZmZlZSdcbmFkZFRvSm91cm5hbCA9IHJlcXVpcmUgJy4vYWRkVG9Kb3VybmFsLmNvZmZlZSdcbndpa2kgPSByZXF1aXJlKCcuL3dpa2kuY29mZmVlJylcblxuaGFuZGxlRHJhZ2dpbmcgPSAoZXZ0LCB1aSkgLT5cbiAgaXRlbUVsZW1lbnQgPSB1aS5pdGVtXG5cbiAgaXRlbSA9IHdpa2kuZ2V0SXRlbShpdGVtRWxlbWVudClcbiAgdGhpc1BhZ2VFbGVtZW50ID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIHNvdXJjZVBhZ2VFbGVtZW50ID0gaXRlbUVsZW1lbnQuZGF0YSgncGFnZUVsZW1lbnQnKVxuICBzb3VyY2VTaXRlID0gc291cmNlUGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpXG5cbiAgZGVzdGluYXRpb25QYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnBhcmVudHMoJy5wYWdlOmZpcnN0JylcbiAgZXF1YWxzID0gKGEsIGIpIC0+IGEgYW5kIGIgYW5kIGEuZ2V0KDApID09IGIuZ2V0KDApXG5cbiAgbW92ZVdpdGhpblBhZ2UgPSBub3Qgc291cmNlUGFnZUVsZW1lbnQgb3IgZXF1YWxzKHNvdXJjZVBhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KVxuICBtb3ZlRnJvbVBhZ2UgPSBub3QgbW92ZVdpdGhpblBhZ2UgYW5kIGVxdWFscyh0aGlzUGFnZUVsZW1lbnQsIHNvdXJjZVBhZ2VFbGVtZW50KVxuICBtb3ZlVG9QYWdlID0gbm90IG1vdmVXaXRoaW5QYWdlIGFuZCBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KVxuXG4gIGlmIG1vdmVGcm9tUGFnZVxuICAgIGlmIHNvdXJjZVBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdnaG9zdCcpIG9yXG4gICAgICBzb3VyY2VQYWdlRWxlbWVudC5hdHRyKCdpZCcpID09IGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQuYXR0cignaWQnKVxuICAgICAgICAjIHN0ZW0gdGhlIGRhbWFnZSwgYmV0dGVyIGlkZWFzIGhlcmU6XG4gICAgICAgICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zOTE2MDg5L2pxdWVyeS11aS1zb3J0YWJsZXMtY29ubmVjdC1saXN0cy1jb3B5LWl0ZW1zXG4gICAgICAgIHJldHVyblxuXG4gIGFjdGlvbiA9IGlmIG1vdmVXaXRoaW5QYWdlXG4gICAgb3JkZXIgPSAkKHRoaXMpLmNoaWxkcmVuKCkubWFwKChfLCB2YWx1ZSkgLT4gJCh2YWx1ZSkuYXR0cignZGF0YS1pZCcpKS5nZXQoKVxuICAgIHt0eXBlOiAnbW92ZScsIG9yZGVyOiBvcmRlcn1cbiAgZWxzZSBpZiBtb3ZlRnJvbVBhZ2VcbiAgICB3aWtpLmxvZyAnZHJhZyBmcm9tJywgc291cmNlUGFnZUVsZW1lbnQuZmluZCgnaDEnKS50ZXh0KClcbiAgICB7dHlwZTogJ3JlbW92ZSd9XG4gIGVsc2UgaWYgbW92ZVRvUGFnZVxuICAgIGl0ZW1FbGVtZW50LmRhdGEgJ3BhZ2VFbGVtZW50JywgdGhpc1BhZ2VFbGVtZW50XG4gICAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJylcbiAgICBiZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudClcbiAgICB7dHlwZTogJ2FkZCcsIGl0ZW06IGl0ZW0sIGFmdGVyOiBiZWZvcmU/LmlkfVxuICBhY3Rpb24uaWQgPSBpdGVtLmlkXG4gIHBhZ2VIYW5kbGVyLnB1dCB0aGlzUGFnZUVsZW1lbnQsIGFjdGlvblxuXG5pbml0RHJhZ2dpbmcgPSAoJHBhZ2UpIC0+XG4gICRzdG9yeSA9ICRwYWdlLmZpbmQoJy5zdG9yeScpXG4gICRzdG9yeS5zb3J0YWJsZShjb25uZWN0V2l0aDogJy5wYWdlIC5zdG9yeScpLm9uKFwic29ydHVwZGF0ZVwiLCBoYW5kbGVEcmFnZ2luZylcblxuXG5pbml0QWRkQnV0dG9uID0gKCRwYWdlKSAtPlxuICAkcGFnZS5maW5kKFwiLmFkZC1mYWN0b3J5XCIpLmxpdmUgXCJjbGlja1wiLCAoZXZ0KSAtPlxuICAgIHJldHVybiBpZiAkcGFnZS5oYXNDbGFzcyAnZ2hvc3QnXG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgICBjcmVhdGVGYWN0b3J5KCRwYWdlKVxuXG5jcmVhdGVGYWN0b3J5ID0gKCRwYWdlKSAtPlxuICBpdGVtID1cbiAgICB0eXBlOiBcImZhY3RvcnlcIlxuICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gIGl0ZW1FbGVtZW50ID0gJChcIjxkaXYgLz5cIiwgY2xhc3M6IFwiaXRlbSBmYWN0b3J5XCIpLmRhdGEoJ2l0ZW0nLGl0ZW0pLmF0dHIoJ2RhdGEtaWQnLCBpdGVtLmlkKVxuICBpdGVtRWxlbWVudC5kYXRhICdwYWdlRWxlbWVudCcsICRwYWdlXG4gICRwYWdlLmZpbmQoXCIuc3RvcnlcIikuYXBwZW5kKGl0ZW1FbGVtZW50KVxuICBwbHVnaW4uZG8gaXRlbUVsZW1lbnQsIGl0ZW1cbiAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJylcbiAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpXG4gIHBhZ2VIYW5kbGVyLnB1dCAkcGFnZSwge2l0ZW06IGl0ZW0sIGlkOiBpdGVtLmlkLCB0eXBlOiBcImFkZFwiLCBhZnRlcjogYmVmb3JlPy5pZH1cblxuYnVpbGRQYWdlSGVhZGVyID0gKHtwYWdlLHRvb2x0aXAsaGVhZGVyX2hyZWYsZmF2aWNvbl9zcmN9KS0+XG4gIHRvb2x0aXAgKz0gXCJcXG4je3BhZ2UucGx1Z2lufSBwbHVnaW5cIiBpZiBwYWdlLnBsdWdpblxuICBcIlwiXCI8aDEgdGl0bGU9XCIje3Rvb2x0aXB9XCI+PGEgaHJlZj1cIiN7aGVhZGVyX2hyZWZ9XCI+PGltZyBzcmM9XCIje2Zhdmljb25fc3JjfVwiIGhlaWdodD1cIjMycHhcIiBjbGFzcz1cImZhdmljb25cIj48L2E+ICN7cGFnZS50aXRsZX08L2gxPlwiXCJcIlxuXG5lbWl0SGVhZGVyID0gKCRoZWFkZXIsICRwYWdlLCBwYWdlKSAtPlxuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpXG4gIGlzUmVtb3RlUGFnZSA9IHNpdGU/IGFuZCBzaXRlICE9ICdsb2NhbCcgYW5kIHNpdGUgIT0gJ29yaWdpbicgYW5kIHNpdGUgIT0gJ3ZpZXcnXG4gIGhlYWRlciA9ICcnXG5cbiAgdmlld0hlcmUgPSBpZiB3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKSBpcyAnd2VsY29tZS12aXNpdG9ycycgdGhlbiBcIlwiXG4gIGVsc2UgXCIvdmlldy8je3dpa2kuYXNTbHVnKHBhZ2UudGl0bGUpfVwiXG4gIHBhZ2VIZWFkZXIgPSBpZiBpc1JlbW90ZVBhZ2VcbiAgICBidWlsZFBhZ2VIZWFkZXJcbiAgICAgIHRvb2x0aXA6IHNpdGVcbiAgICAgIGhlYWRlcl9ocmVmOiBcIi8vI3tzaXRlfS92aWV3L3dlbGNvbWUtdmlzaXRvcnMje3ZpZXdIZXJlfVwiXG4gICAgICBmYXZpY29uX3NyYzogXCJodHRwOi8vI3tzaXRlfS9mYXZpY29uLnBuZ1wiXG4gICAgICBwYWdlOiBwYWdlXG4gIGVsc2VcbiAgICBidWlsZFBhZ2VIZWFkZXJcbiAgICAgIHRvb2x0aXA6IGxvY2F0aW9uLmhvc3RcbiAgICAgIGhlYWRlcl9ocmVmOiBcIi92aWV3L3dlbGNvbWUtdmlzaXRvcnMje3ZpZXdIZXJlfVwiXG4gICAgICBmYXZpY29uX3NyYzogXCIvZmF2aWNvbi5wbmdcIlxuICAgICAgcGFnZTogcGFnZVxuXG4gICRoZWFkZXIuYXBwZW5kKCBwYWdlSGVhZGVyIClcbiAgXG4gIHVubGVzcyBpc1JlbW90ZVBhZ2VcbiAgICAkKCdpbWcuZmF2aWNvbicsJHBhZ2UpLmVycm9yIChlKS0+XG4gICAgICBwbHVnaW4uZ2V0ICdmYXZpY29uJywgKGZhdmljb24pIC0+XG4gICAgICAgIGZhdmljb24uY3JlYXRlKClcblxuICBpZiAkcGFnZS5hdHRyKCdpZCcpLm1hdGNoIC9fcmV2L1xuICAgIHJldiA9IHBhZ2Uuam91cm5hbC5sZW5ndGgtMVxuICAgIGRhdGUgPSBwYWdlLmpvdXJuYWxbcmV2XS5kYXRlXG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ2dob3N0JykuZGF0YSgncmV2JyxyZXYpXG4gICAgJGhlYWRlci5hcHBlbmQgJCBcIlwiXCJcbiAgICAgIDxoMiBjbGFzcz1cInJldmlzaW9uXCI+XG4gICAgICAgIDxzcGFuPlxuICAgICAgICAgICN7aWYgZGF0ZT8gdGhlbiB1dGlsLmZvcm1hdERhdGUoZGF0ZSkgZWxzZSBcIlJldmlzaW9uICN7cmV2fVwifVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2gyPlxuICAgIFwiXCJcIlxuXG5lbWl0VHdpbnMgPSB3aWtpLmVtaXRUd2lucyA9ICgkcGFnZSkgLT5cbiAgcGFnZSA9ICRwYWdlLmRhdGEgJ2RhdGEnXG4gIHNpdGUgPSAkcGFnZS5kYXRhKCdzaXRlJykgb3Igd2luZG93LmxvY2F0aW9uLmhvc3RcbiAgc2l0ZSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0IGlmIHNpdGUgaW4gWyd2aWV3JywgJ29yaWdpbiddXG4gIHNsdWcgPSB3aWtpLmFzU2x1ZyBwYWdlLnRpdGxlXG4gIGlmIChhY3Rpb25zID0gcGFnZS5qb3VybmFsPy5sZW5ndGgpPyBhbmQgKHZpZXdpbmcgPSBwYWdlLmpvdXJuYWxbYWN0aW9ucy0xXT8uZGF0ZSk/XG4gICAgdmlld2luZyA9IE1hdGguZmxvb3Iodmlld2luZy8xMDAwKSoxMDAwXG4gICAgYmlucyA9IHtuZXdlcjpbXSwgc2FtZTpbXSwgb2xkZXI6W119XG4gICAgIyB7ZmVkLndpa2kub3JnOiBbe3NsdWc6IFwiaGFwcGVuaW5nc1wiLCB0aXRsZTogXCJIYXBwZW5pbmdzXCIsIGRhdGU6IDEzNTg5NzUzMDMwMDAsIHN5bm9wc2lzOiBcIkNoYW5nZXMgaGVyZSAuLi5cIn1dfVxuICAgIGZvciByZW1vdGVTaXRlLCBpbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgICBpZiByZW1vdGVTaXRlICE9IHNpdGUgYW5kIGluZm8uc2l0ZW1hcD9cbiAgICAgICAgZm9yIGl0ZW0gaW4gaW5mby5zaXRlbWFwXG4gICAgICAgICAgaWYgaXRlbS5zbHVnID09IHNsdWdcbiAgICAgICAgICAgIGJpbiA9IGlmIGl0ZW0uZGF0ZSA+IHZpZXdpbmcgdGhlbiBiaW5zLm5ld2VyXG4gICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZGF0ZSA8IHZpZXdpbmcgdGhlbiBiaW5zLm9sZGVyXG4gICAgICAgICAgICBlbHNlIGJpbnMuc2FtZVxuICAgICAgICAgICAgYmluLnB1c2gge3JlbW90ZVNpdGUsIGl0ZW19XG4gICAgdHdpbnMgPSBbXVxuICAgICMge25ld2VyOltyZW1vdGVTaXRlOiBcImZlZC53aWtpLm9yZ1wiLCBpdGVtOiB7c2x1ZzogLi4uLCBkYXRlOiAuLi59LCAuLi5dfVxuICAgIGZvciBsZWdlbmQsIGJpbiBvZiBiaW5zXG4gICAgICBjb250aW51ZSB1bmxlc3MgYmluLmxlbmd0aFxuICAgICAgYmluLnNvcnQgKGEsYikgLT5cbiAgICAgICAgYS5pdGVtLmRhdGUgPCBiLml0ZW0uZGF0ZVxuICAgICAgZmxhZ3MgPSBmb3Ige3JlbW90ZVNpdGUsIGl0ZW19LCBpIGluIGJpblxuICAgICAgICBicmVhayBpZiBpID49IDhcbiAgICAgICAgXCJcIlwiPGltZyBjbGFzcz1cInJlbW90ZVwiXG4gICAgICAgICAgc3JjPVwiaHR0cDovLyN7cmVtb3RlU2l0ZX0vZmF2aWNvbi5wbmdcIlxuICAgICAgICAgIGRhdGEtc2x1Zz1cIiN7c2x1Z31cIlxuICAgICAgICAgIGRhdGEtc2l0ZT1cIiN7cmVtb3RlU2l0ZX1cIlxuICAgICAgICAgIHRpdGxlPVwiI3tyZW1vdGVTaXRlfVwiPlxuICAgICAgICBcIlwiXCJcbiAgICAgIHR3aW5zLnB1c2ggXCIje2ZsYWdzLmpvaW4gJyZuYnNwOyd9ICN7bGVnZW5kfVwiXG4gICAgJHBhZ2UuZmluZCgnLnR3aW5zJykuaHRtbCBcIlwiXCI8cD4je3R3aW5zLmpvaW4gXCIsIFwifTwvcD5cIlwiXCIgaWYgdHdpbnNcblxucmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCA9IChwYWdlRGF0YSwkcGFnZSwgc2l0ZUZvdW5kKSAtPlxuICBwYWdlID0gJC5leHRlbmQodXRpbC5lbXB0eVBhZ2UoKSwgcGFnZURhdGEpXG4gICRwYWdlLmRhdGEoXCJkYXRhXCIsIHBhZ2UpXG4gIHNsdWcgPSAkcGFnZS5hdHRyKCdpZCcpXG4gIHNpdGUgPSAkcGFnZS5kYXRhKCdzaXRlJylcblxuICBjb250ZXh0ID0gWyd2aWV3J11cbiAgY29udGV4dC5wdXNoIHNpdGUgaWYgc2l0ZT9cbiAgYWRkQ29udGV4dCA9IChzaXRlKSAtPiBjb250ZXh0LnB1c2ggc2l0ZSBpZiBzaXRlPyBhbmQgbm90IF8uaW5jbHVkZSBjb250ZXh0LCBzaXRlXG4gIGFkZENvbnRleHQgYWN0aW9uLnNpdGUgZm9yIGFjdGlvbiBpbiBwYWdlLmpvdXJuYWwuc2xpY2UoMCkucmV2ZXJzZSgpXG5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dCA9IGNvbnRleHRcblxuICAkcGFnZS5lbXB0eSgpXG4gIFskdHdpbnMsICRoZWFkZXIsICRzdG9yeSwgJGpvdXJuYWwsICRmb290ZXJdID0gWyd0d2lucycsICdoZWFkZXInLCAnc3RvcnknLCAnam91cm5hbCcsICdmb290ZXInXS5tYXAgKGNsYXNzTmFtZSkgLT5cbiAgICAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcyhjbGFzc05hbWUpLmFwcGVuZFRvKCRwYWdlKVxuXG4gIGVtaXRIZWFkZXIgJGhlYWRlciwgJHBhZ2UsIHBhZ2VcblxuICBlbWl0SXRlbSA9IChpKSAtPlxuICAgIHJldHVybiBpZiBpID49IHBhZ2Uuc3RvcnkubGVuZ3RoXG4gICAgaXRlbSA9IHBhZ2Uuc3RvcnlbaV1cbiAgICBpZiBpdGVtPy50eXBlIGFuZCBpdGVtPy5pZFxuICAgICAgJGl0ZW0gPSAkIFwiXCJcIjxkaXYgY2xhc3M9XCJpdGVtICN7aXRlbS50eXBlfVwiIGRhdGEtaWQ9XCIje2l0ZW0uaWR9XCI+XCJcIlwiXG4gICAgICAkc3RvcnkuYXBwZW5kICRpdGVtXG4gICAgICBwbHVnaW4uZG8gJGl0ZW0sIGl0ZW0sIC0+IGVtaXRJdGVtIGkrMVxuICAgIGVsc2VcbiAgICAgICRzdG9yeS5hcHBlbmQgJCBcIlwiXCI8ZGl2PjxwIGNsYXNzPVwiZXJyb3JcIj5DYW4ndCBtYWtlIHNlbnNlIG9mIHN0b3J5WyN7aX1dPC9wPjwvZGl2PlwiXCJcIlxuICAgICAgZW1pdEl0ZW0gaSsxXG4gIGVtaXRJdGVtIDBcblxuICBmb3IgYWN0aW9uIGluIHBhZ2Uuam91cm5hbFxuICAgIGFkZFRvSm91cm5hbCAkam91cm5hbCwgYWN0aW9uXG5cbiAgZW1pdFR3aW5zICRwYWdlXG5cbiAgJGpvdXJuYWwuYXBwZW5kIFwiXCJcIlxuICAgIDxkaXYgY2xhc3M9XCJjb250cm9sLWJ1dHRvbnNcIj5cbiAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidXR0b24gZm9yay1wYWdlXCIgdGl0bGU9XCJmb3JrIHRoaXMgcGFnZVwiPiN7dXRpbC5zeW1ib2xzWydmb3JrJ119PC9hPlxuICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzcz1cImJ1dHRvbiBhZGQtZmFjdG9yeVwiIHRpdGxlPVwiYWRkIHBhcmFncmFwaFwiPiN7dXRpbC5zeW1ib2xzWydhZGQnXX08L2E+XG4gICAgPC9kaXY+XG4gIFwiXCJcIlxuXG4gICRmb290ZXIuYXBwZW5kIFwiXCJcIlxuICAgIDxhIGlkPVwibGljZW5zZVwiIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvXCI+Q0MgQlktU0EgMy4wPC9hPiAuXG4gICAgPGEgY2xhc3M9XCJzaG93LXBhZ2Utc291cmNlXCIgaHJlZj1cIi8je3NsdWd9Lmpzb24/cmFuZG9tPSN7dXRpbC5yYW5kb21CeXRlcyg0KX1cIiB0aXRsZT1cInNvdXJjZVwiPkpTT048L2E+IC5cbiAgICA8YSBocmVmPSBcIi8vI3tzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdH0vI3tzbHVnfS5odG1sXCI+I3tzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdH08L2E+XG4gIFwiXCJcIlxuXG5cbndpa2kuYnVpbGRQYWdlID0gKGRhdGEsc2l0ZUZvdW5kLCRwYWdlKSAtPlxuXG4gIGlmIHNpdGVGb3VuZCA9PSAnbG9jYWwnXG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ2xvY2FsJylcbiAgZWxzZSBpZiBzaXRlRm91bmRcbiAgICBzaXRlRm91bmQgPSAnb3JpZ2luJyBpZiBzaXRlRm91bmQgaXMgd2luZG93LmxvY2F0aW9uLmhvc3RcbiAgICAkcGFnZS5hZGRDbGFzcygncmVtb3RlJykgdW5sZXNzIHNpdGVGb3VuZCBpbiBbJ3ZpZXcnLCAnb3JpZ2luJ11cbiAgICAkcGFnZS5kYXRhKCdzaXRlJywgc2l0ZUZvdW5kKVxuICBpZiBkYXRhLnBsdWdpbj9cbiAgICAkcGFnZS5hZGRDbGFzcygncGx1Z2luJylcblxuICAjVE9ETzogYXZvaWQgcGFzc2luZyBzaXRlRm91bmRcbiAgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCggZGF0YSwgJHBhZ2UsIHNpdGVGb3VuZCApXG5cbiAgc3RhdGUuc2V0VXJsKClcblxuICBpbml0RHJhZ2dpbmcgJHBhZ2VcbiAgaW5pdEFkZEJ1dHRvbiAkcGFnZVxuICAkcGFnZVxuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVmcmVzaCA9IHdpa2kucmVmcmVzaCA9IC0+XG4gICRwYWdlID0gJCh0aGlzKVxuXG4gIFtzbHVnLCByZXZdID0gJHBhZ2UuYXR0cignaWQnKS5zcGxpdCgnX3JldicpXG4gIHBhZ2VJbmZvcm1hdGlvbiA9IHtcbiAgICBzbHVnOiBzbHVnXG4gICAgcmV2OiByZXZcbiAgICBzaXRlOiAkcGFnZS5kYXRhKCdzaXRlJylcbiAgfVxuXG4gIGNyZWF0ZUdob3N0UGFnZSA9IC0+XG4gICAgdGl0bGUgPSAkKFwiXCJcImFbaHJlZj1cIi8je3NsdWd9Lmh0bWxcIl06bGFzdFwiXCJcIikudGV4dCgpIG9yIHNsdWdcbiAgICBwYWdlID1cbiAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICAnc3RvcnknOiBbXG4gICAgICAgICdpZCc6IHV0aWwucmFuZG9tQnl0ZXMgOFxuICAgICAgICAndHlwZSc6ICdmdXR1cmUnXG4gICAgICAgICd0ZXh0JzogJ1dlIGNvdWxkIG5vdCBmaW5kIHRoaXMgcGFnZS4nXG4gICAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICBdXG4gICAgaGVhZGluZyA9XG4gICAgICAndHlwZSc6ICdwYXJhZ3JhcGgnXG4gICAgICAnaWQnOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAndGV4dCc6IFwiV2UgZGlkIGZpbmQgdGhlIHBhZ2UgaW4geW91ciBjdXJyZW50IG5laWdoYm9yaG9vZC5cIlxuICAgIGhpdHMgPSBbXVxuICAgIGZvciBzaXRlLCBpbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgICBpZiBpbmZvLnNpdGVtYXA/XG4gICAgICAgIHJlc3VsdCA9IF8uZmluZCBpbmZvLnNpdGVtYXAsIChlYWNoKSAtPlxuICAgICAgICAgIGVhY2guc2x1ZyA9PSBzbHVnXG4gICAgICAgIGlmIHJlc3VsdD9cbiAgICAgICAgICBoaXRzLnB1c2hcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInJlZmVyZW5jZVwiXG4gICAgICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgICAgICAgIFwic2l0ZVwiOiBzaXRlXG4gICAgICAgICAgICBcInNsdWdcIjogc2x1Z1xuICAgICAgICAgICAgXCJ0aXRsZVwiOiByZXN1bHQudGl0bGUgfHwgc2x1Z1xuICAgICAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5zeW5vcHNpcyB8fCAnJ1xuICAgIGlmIGhpdHMubGVuZ3RoID4gMFxuICAgICAgcGFnZS5zdG9yeS5wdXNoIGhlYWRpbmcsIGhpdHMuLi5cbiAgICAgIHBhZ2Uuc3RvcnlbMF0udGV4dCA9ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UgaW4gdGhlIGV4cGVjdGVkIGNvbnRleHQuJ1xuXG4gICAgd2lraS5idWlsZFBhZ2UoIHBhZ2UsIHVuZGVmaW5lZCwgJHBhZ2UgKS5hZGRDbGFzcygnZ2hvc3QnKVxuXG4gIHJlZ2lzdGVyTmVpZ2hib3JzID0gKGRhdGEsIHNpdGUpIC0+XG4gICAgaWYgXy5pbmNsdWRlIFsnbG9jYWwnLCAnb3JpZ2luJywgJ3ZpZXcnLCBudWxsLCB1bmRlZmluZWRdLCBzaXRlXG4gICAgICBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciBsb2NhdGlvbi5ob3N0XG4gICAgZWxzZVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3Igc2l0ZVxuICAgIGZvciBpdGVtIGluIChkYXRhLnN0b3J5IHx8IFtdKVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgaXRlbS5zaXRlIGlmIGl0ZW0uc2l0ZT9cbiAgICBmb3IgYWN0aW9uIGluIChkYXRhLmpvdXJuYWwgfHwgW10pXG4gICAgICBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciBhY3Rpb24uc2l0ZSBpZiBhY3Rpb24uc2l0ZT9cblxuICB3aGVuR290dGVuID0gKGRhdGEsc2l0ZUZvdW5kKSAtPlxuICAgIHdpa2kuYnVpbGRQYWdlKCBkYXRhLCBzaXRlRm91bmQsICRwYWdlIClcbiAgICByZWdpc3Rlck5laWdoYm9ycyggZGF0YSwgc2l0ZUZvdW5kIClcblxuICBwYWdlSGFuZGxlci5nZXRcbiAgICB3aGVuR290dGVuOiB3aGVuR290dGVuXG4gICAgd2hlbk5vdEdvdHRlbjogY3JlYXRlR2hvc3RQYWdlXG4gICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cblxuIiwiIyAqKnJldmlzaW9uLmNvZmZlZSoqXG4jIFRoaXMgbW9kdWxlIGdlbmVyYXRlcyBhIHBhc3QgcmV2aXNpb24gb2YgYSBkYXRhIGZpbGUgYW5kIGNhY2hlcyBpdCBpbiAnZGF0YS9yZXYnLlxuI1xuIyBUaGUgc2F2ZWQgZmlsZSBoYXMgdGhlIG5hbWUgb2YgdGhlIGlkIG9mIHRoZSBwb2ludCBpbiB0aGUgam91cm5hbCdzIGhpc3RvcnlcbiMgdGhhdCB0aGUgcmV2aXNpb24gcmVwcmVzZW50cy5cblxuY3JlYXRlID0gKHJldkluZGV4LCBkYXRhKSAtPlxuICBqb3VybmFsID0gZGF0YS5qb3VybmFsXG4gIHJldlRpdGxlID0gZGF0YS50aXRsZVxuICByZXZTdG9yeSA9IFtdXG4gIHJldkpvdXJuYWwgPSBqb3VybmFsWzAuLigrcmV2SW5kZXgpXVxuICBmb3Igam91cm5hbEVudHJ5IGluIHJldkpvdXJuYWxcbiAgICByZXZTdG9yeUlkcyA9IHJldlN0b3J5Lm1hcCAoc3RvcnlJdGVtKSAtPiBzdG9yeUl0ZW0uaWRcbiAgICBzd2l0Y2ggam91cm5hbEVudHJ5LnR5cGVcbiAgICAgIHdoZW4gJ2NyZWF0ZSdcbiAgICAgICAgaWYgam91cm5hbEVudHJ5Lml0ZW0udGl0bGU/XG4gICAgICAgICAgcmV2VGl0bGUgPSBqb3VybmFsRW50cnkuaXRlbS50aXRsZVxuICAgICAgICAgIHJldlN0b3J5ID0gam91cm5hbEVudHJ5Lml0ZW0uc3RvcnkgfHwgW11cbiAgICAgIHdoZW4gJ2FkZCdcbiAgICAgICAgaWYgKGFmdGVySW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5hZnRlcikgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UoYWZ0ZXJJbmRleCsxLDAsam91cm5hbEVudHJ5Lml0ZW0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXZTdG9yeS5wdXNoIGpvdXJuYWxFbnRyeS5pdGVtXG4gICAgICB3aGVuICdlZGl0J1xuICAgICAgICBpZiAoZWRpdEluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuaWQpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGVkaXRJbmRleCwxLGpvdXJuYWxFbnRyeS5pdGVtKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV2U3RvcnkucHVzaCBqb3VybmFsRW50cnkuaXRlbVxuICAgICAgd2hlbiAnbW92ZSdcbiAgICAgICAgaXRlbXMgPSB7fVxuICAgICAgICBmb3Igc3RvcnlJdGVtIGluIHJldlN0b3J5XG4gICAgICAgICAgaXRlbXNbc3RvcnlJdGVtLmlkXSA9IHN0b3J5SXRlbVxuICAgICAgICByZXZTdG9yeSA9IFtdXG4gICAgICAgIGZvciBpdGVtSWQgaW4gam91cm5hbEVudHJ5Lm9yZGVyXG4gICAgICAgICAgcmV2U3RvcnkucHVzaChpdGVtc1tpdGVtSWRdKSBpZiBpdGVtc1tpdGVtSWRdP1xuICAgICAgd2hlbiAncmVtb3ZlJ1xuICAgICAgICBpZiAocmVtb3ZlSW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5pZCkgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UocmVtb3ZlSW5kZXgsMSlcbiAgICAgICN3aGVuICdmb3JrJyAgICMgZG8gbm90aGluZyB3aGVuIGZvcmtcbiAgcmV0dXJuIHtzdG9yeTogcmV2U3RvcnksIGpvdXJuYWw6IHJldkpvdXJuYWwsIHRpdGxlOiByZXZUaXRsZX1cblxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGUiLCIoZnVuY3Rpb24oKXsvLyAgICAgVW5kZXJzY29yZS5qcyAxLjQuNFxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZ2xvYmFsYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBFc3RhYmxpc2ggdGhlIG9iamVjdCB0aGF0IGdldHMgcmV0dXJuZWQgdG8gYnJlYWsgb3V0IG9mIGEgbG9vcCBpdGVyYXRpb24uXG4gIHZhciBicmVha2VyID0ge307XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXIgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgICAgY29uY2F0ICAgICAgICAgICA9IEFycmF5UHJvdG8uY29uY2F0LFxuICAgICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlRm9yRWFjaCAgICAgID0gQXJyYXlQcm90by5mb3JFYWNoLFxuICAgIG5hdGl2ZU1hcCAgICAgICAgICA9IEFycmF5UHJvdG8ubWFwLFxuICAgIG5hdGl2ZVJlZHVjZSAgICAgICA9IEFycmF5UHJvdG8ucmVkdWNlLFxuICAgIG5hdGl2ZVJlZHVjZVJpZ2h0ICA9IEFycmF5UHJvdG8ucmVkdWNlUmlnaHQsXG4gICAgbmF0aXZlRmlsdGVyICAgICAgID0gQXJyYXlQcm90by5maWx0ZXIsXG4gICAgbmF0aXZlRXZlcnkgICAgICAgID0gQXJyYXlQcm90by5ldmVyeSxcbiAgICBuYXRpdmVTb21lICAgICAgICAgPSBBcnJheVByb3RvLnNvbWUsXG4gICAgbmF0aXZlSW5kZXhPZiAgICAgID0gQXJyYXlQcm90by5pbmRleE9mLFxuICAgIG5hdGl2ZUxhc3RJbmRleE9mICA9IEFycmF5UHJvdG8ubGFzdEluZGV4T2YsXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZDtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyIFwiYWR2YW5jZWRcIiBtb2RlLlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjQuNCc7XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyBvYmplY3RzIHdpdGggdGhlIGJ1aWx0LWluIGBmb3JFYWNoYCwgYXJyYXlzLCBhbmQgcmF3IG9iamVjdHMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmb3JFYWNoYCBpZiBhdmFpbGFibGUuXG4gIHZhciBlYWNoID0gXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChfLmhhcyhvYmosIGtleSkpIHtcbiAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0c1tyZXN1bHRzLmxlbmd0aF0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gbnVsbCA6IFtdO1xuICAgIHJldHVybiBfW2ZpcnN0ID8gJ2ZpbmQnIDogJ2ZpbHRlciddKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBhdHRycykge1xuICAgICAgICBpZiAoYXR0cnNba2V5XSAhPT0gdmFsdWVba2V5XSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy53aGVyZShvYmosIGF0dHJzLCB0cnVlKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1heGltdW0gZWxlbWVudCBvciAoZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIC8vIENhbid0IG9wdGltaXplIGFycmF5cyBvZiBpbnRlZ2VycyBsb25nZXIgdGhhbiA2NSw1MzUgZWxlbWVudHMuXG4gIC8vIFNlZTogaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgwNzk3XG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID49IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4uYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIEluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiBJbmZpbml0eSwgdmFsdWU6IEluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPCByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGFuIGFycmF5LlxuICBfLnNodWZmbGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmFuZDtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzaHVmZmxlZCA9IFtdO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKGluZGV4KyspO1xuICAgICAgc2h1ZmZsZWRbaW5kZXggLSAxXSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgbG9va3VwIGl0ZXJhdG9ycy5cbiAgdmFyIGxvb2t1cEl0ZXJhdG9yID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlIDogZnVuY3Rpb24ob2JqKXsgcmV0dXJuIG9ialt2YWx1ZV07IH07XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdG9yLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlIDogdmFsdWUsXG4gICAgICAgIGluZGV4IDogaW5kZXgsXG4gICAgICAgIGNyaXRlcmlhIDogaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggPCByaWdodC5pbmRleCA/IC0xIDogMTtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0LCBiZWhhdmlvcikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcih2YWx1ZSB8fCBfLmlkZW50aXR5KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICB2YXIga2V5ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICBiZWhhdmlvcihyZXN1bHQsIGtleSwgdmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gR3JvdXBzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24uIFBhc3MgZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZVxuICAvLyB0byBncm91cCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGNyaXRlcmlvbi5cbiAgXy5ncm91cEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBncm91cChvYmosIHZhbHVlLCBjb250ZXh0LCBmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ291bnRzIGluc3RhbmNlcyBvZiBhbiBvYmplY3QgdGhhdCBncm91cCBieSBhIGNlcnRhaW4gY3JpdGVyaW9uLiBQYXNzXG4gIC8vIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGUgdG8gY291bnQgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAvLyBjcml0ZXJpb24uXG4gIF8uY291bnRCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gZ3JvdXAob2JqLCB2YWx1ZSwgY29udGV4dCwgZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICAgIGlmICghXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XSA9IDA7XG4gICAgICByZXN1bHRba2V5XSsrO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciA9IGl0ZXJhdG9yID09IG51bGwgPyBfLmlkZW50aXR5IDogbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgYXJyYXlbbWlkXSkgPCB2YWx1ZSA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjb252ZXJ0IGFueXRoaW5nIGl0ZXJhYmxlIGludG8gYSByZWFsLCBsaXZlIGFycmF5LlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiAhPSBudWxsKSAmJiAhZ3VhcmQgPyBzbGljZS5jYWxsKGFycmF5LCAwLCBuKSA6IGFycmF5WzBdO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGhcbiAgLy8gYF8ubWFwYC5cbiAgXy5pbml0aWFsID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIGFycmF5Lmxlbmd0aCAtICgobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGxhc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5sYXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKChuICE9IG51bGwpICYmICFndWFyZCkge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKlxuICAvLyBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIG91dHB1dCkge1xuICAgIGVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBzaGFsbG93ID8gcHVzaC5hcHBseShvdXRwdXQsIHZhbHVlKSA6IGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIG91dHB1dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb21wbGV0ZWx5IGZsYXR0ZW5lZCB2ZXJzaW9uIG9mIGFuIGFycmF5LlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmdzLCAnbGVuZ3RoJykpO1xuICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0c1tpXSA9IF8ucGx1Y2soYXJncywgXCJcIiArIGkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDb252ZXJ0cyBsaXN0cyBpbnRvIG9iamVjdHMuIFBhc3MgZWl0aGVyIGEgc2luZ2xlIGFycmF5IG9mIGBba2V5LCB2YWx1ZV1gXG4gIC8vIHBhaXJzLCBvciB0d28gcGFyYWxsZWwgYXJyYXlzIG9mIHRoZSBzYW1lIGxlbmd0aCAtLSBvbmUgb2Yga2V5cywgYW5kIG9uZSBvZlxuICAvLyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gIF8ub2JqZWN0ID0gZnVuY3Rpb24obGlzdCwgdmFsdWVzKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIHt9O1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgaXNTb3J0ZWQgPT0gJ251bWJlcicpIHtcbiAgICAgICAgaSA9IChpc1NvcnRlZCA8IDAgPyBNYXRoLm1heCgwLCBsICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaV0gPT09IGl0ZW0gPyBpIDogLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIGFycmF5LmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBhcnJheS5pbmRleE9mKGl0ZW0sIGlzU29ydGVkKTtcbiAgICBmb3IgKDsgaSA8IGw7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbiA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbikge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIGEgZ2l2ZW4gb2JqZWN0IChhc3NpZ25pbmcgYHRoaXNgLCBhbmQgYXJndW1lbnRzLFxuICAvLyBvcHRpb25hbGx5KS4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYEZ1bmN0aW9uLmJpbmRgIGlmXG4gIC8vIGF2YWlsYWJsZS5cbiAgXy5iaW5kID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCkge1xuICAgIGlmIChmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQgJiYgbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIGZ1bmNzID0gXy5mdW5jdGlvbnMob2JqKTtcbiAgICBlYWNoKGZ1bmNzLCBmdW5jdGlvbihmKSB7IG9ialtmXSA9IF8uYmluZChvYmpbZl0sIG9iaik7IH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW8gPSB7fTtcbiAgICBoYXNoZXIgfHwgKGhhc2hlciA9IF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfLmhhcyhtZW1vLCBrZXkpID8gbWVtb1trZXldIDogKG1lbW9ba2V5XSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpeyByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTsgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgcmV0dXJuIF8uZGVsYXkuYXBwbHkoXywgW2Z1bmMsIDFdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHRpbWVvdXQsIHJlc3VsdDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICBpZiAodGltZXMgPD0gMCkgcmV0dXJuIGZ1bmMoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzW2tleXMubGVuZ3RoXSA9IGtleTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHZhbHVlcy5wdXNoKG9ialtrZXldKTtcbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHBhaXJzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcGFpcnMucHVzaChba2V5LCBvYmpba2V5XV0pO1xuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJlc3VsdFtvYmpba2V5XV0gPSBrZXk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PSBudWxsKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIEhhcm1vbnkgYGVnYWxgIHByb3Bvc2FsOiBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmVnYWwuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPSB0b1N0cmluZy5jYWxsKGIpKSByZXR1cm4gZmFsc2U7XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIC8vIFN0cmluZ3MsIG51bWJlcnMsIGRhdGVzLCBhbmQgYm9vbGVhbnMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLlxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gYSA9PSBTdHJpbmcoYik7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLiBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yXG4gICAgICAgIC8vIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gYSAhPSArYSA/IGIgIT0gK2IgOiAoYSA9PSAwID8gMSAvIGEgPT0gMSAvIGIgOiBhID09ICtiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PSArYjtcbiAgICAgIC8vIFJlZ0V4cHMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyIHNvdXJjZSBwYXR0ZXJucyBhbmQgZmxhZ3MuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICByZXR1cm4gYS5zb3VyY2UgPT0gYi5zb3VyY2UgJiZcbiAgICAgICAgICAgICAgIGEuZ2xvYmFsID09IGIuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICBhLm11bHRpbGluZSA9PSBiLm11bHRpbGluZSAmJlxuICAgICAgICAgICAgICAgYS5pZ25vcmVDYXNlID09IGIuaWdub3JlQ2FzZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT0gYSkgcmV0dXJuIGJTdGFja1tsZW5ndGhdID09IGI7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucHVzaChhKTtcbiAgICBiU3RhY2sucHVzaChiKTtcbiAgICB2YXIgc2l6ZSA9IDAsIHJlc3VsdCA9IHRydWU7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYi5sZW5ndGg7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBlcShhW3NpemVdLCBiW3NpemVdLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPYmplY3RzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWl2YWxlbnQsIGJ1dCBgT2JqZWN0YHNcbiAgICAgIC8vIGZyb20gZGlmZmVyZW50IGZyYW1lcyBhcmUuXG4gICAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgICBpZiAoYUN0b3IgIT09IGJDdG9yICYmICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiAoYUN0b3IgaW5zdGFuY2VvZiBhQ3RvcikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmlzRnVuY3Rpb24oYkN0b3IpICYmIChiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KG4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgZXNjYXBlOiB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyYjeDI3OycsXG4gICAgICAnLyc6ICcmI3gyRjsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIHByb3BlcnR5IGlzIGEgZnVuY3Rpb24gdGhlbiBpbnZva2UgaXQ7XG4gIC8vIG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdCc6ICAgICAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdHxcXHUyMDI4fFxcdTIwMjkvZztcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgZGF0YSwgc2V0dGluZ3MpIHtcbiAgICB2YXIgcmVuZGVyO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAgIC5yZXBsYWNlKGVzY2FwZXIsIGZ1bmN0aW9uKG1hdGNoKSB7IHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTsgfSk7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyBcInJldHVybiBfX3A7XFxuXCI7XG5cbiAgICB0cnkge1xuICAgICAgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGlmIChkYXRhKSByZXR1cm4gcmVuZGVyKGRhdGEsIF8pO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24gc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonKSArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLCB3aGljaCB3aWxsIGRlbGVnYXRlIHRvIHRoZSB3cmFwcGVyLlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8ob2JqKS5jaGFpbigpO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PSAnc2hpZnQnIHx8IG5hbWUgPT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgb2JqKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYWxsIGFjY2Vzc29yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICBfLmV4dGVuZChfLnByb3RvdHlwZSwge1xuXG4gICAgLy8gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2NoYWluID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgICB9XG5cbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG5cbn0pKCkiLCJ1dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoam91cm5hbEVsZW1lbnQsIGFjdGlvbikgLT5cbiAgcGFnZUVsZW1lbnQgPSBqb3VybmFsRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIHByZXYgPSBqb3VybmFsRWxlbWVudC5maW5kKFwiLmVkaXRbZGF0YS1pZD0je2FjdGlvbi5pZCB8fCAwfV1cIikgaWYgYWN0aW9uLnR5cGUgPT0gJ2VkaXQnXG4gIGFjdGlvblRpdGxlID0gYWN0aW9uLnR5cGVcbiAgYWN0aW9uVGl0bGUgKz0gXCIgI3t1dGlsLmZvcm1hdEVsYXBzZWRUaW1lKGFjdGlvbi5kYXRlKX1cIiBpZiBhY3Rpb24uZGF0ZT9cbiAgYWN0aW9uRWxlbWVudCA9ICQoXCJcIlwiPGEgaHJlZj1cIiNcIiAvPiBcIlwiXCIpLmFkZENsYXNzKFwiYWN0aW9uXCIpLmFkZENsYXNzKGFjdGlvbi50eXBlKVxuICAgIC50ZXh0KHV0aWwuc3ltYm9sc1thY3Rpb24udHlwZV0pXG4gICAgLmF0dHIoJ3RpdGxlJyxhY3Rpb25UaXRsZSlcbiAgICAuYXR0cignZGF0YS1pZCcsIGFjdGlvbi5pZCB8fCBcIjBcIilcbiAgICAuZGF0YSgnYWN0aW9uJywgYWN0aW9uKVxuICBjb250cm9scyA9IGpvdXJuYWxFbGVtZW50LmNoaWxkcmVuKCcuY29udHJvbC1idXR0b25zJylcbiAgaWYgY29udHJvbHMubGVuZ3RoID4gMFxuICAgIGFjdGlvbkVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbnRyb2xzKVxuICBlbHNlXG4gICAgYWN0aW9uRWxlbWVudC5hcHBlbmRUbyhqb3VybmFsRWxlbWVudClcbiAgaWYgYWN0aW9uLnR5cGUgPT0gJ2ZvcmsnIGFuZCBhY3Rpb24uc2l0ZT9cbiAgICBhY3Rpb25FbGVtZW50XG4gICAgICAuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLCBcInVybCgvLyN7YWN0aW9uLnNpdGV9L2Zhdmljb24ucG5nKVwiKVxuICAgICAgLmF0dHIoXCJocmVmXCIsIFwiLy8je2FjdGlvbi5zaXRlfS8je3BhZ2VFbGVtZW50LmF0dHIoJ2lkJyl9Lmh0bWxcIilcbiAgICAgIC5kYXRhKFwic2l0ZVwiLCBhY3Rpb24uc2l0ZSlcbiAgICAgIC5kYXRhKFwic2x1Z1wiLCBwYWdlRWxlbWVudC5hdHRyKCdpZCcpKVxuXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcblxud2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbmNyZWF0ZVNlYXJjaCA9IHJlcXVpcmUgJy4vc2VhcmNoLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSBuZWlnaGJvcmhvb2QgPSB7fVxuXG5cbndpa2kubmVpZ2hib3Job29kID89IHt9XG5uZXh0QXZhaWxhYmxlRmV0Y2ggPSAwXG5uZXh0RmV0Y2hJbnRlcnZhbCA9IDIwMDBcblxucG9wdWxhdGVTaXRlSW5mb0ZvciA9IChzaXRlLG5laWdoYm9ySW5mbyktPlxuICByZXR1cm4gaWYgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHRcbiAgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSB0cnVlXG5cbiAgdHJhbnNpdGlvbiA9IChzaXRlLCBmcm9tLCB0bykgLT5cbiAgICAkKFwiXCJcIi5uZWlnaGJvcltkYXRhLXNpdGU9XCIje3NpdGV9XCJdXCJcIlwiKVxuICAgICAgLmZpbmQoJ2RpdicpXG4gICAgICAucmVtb3ZlQ2xhc3MoZnJvbSlcbiAgICAgIC5hZGRDbGFzcyh0bylcblxuICBmZXRjaE1hcCA9IC0+XG4gICAgc2l0ZW1hcFVybCA9IFwiaHR0cDovLyN7c2l0ZX0vc3lzdGVtL3NpdGVtYXAuanNvblwiXG4gICAgdHJhbnNpdGlvbiBzaXRlLCAnd2FpdCcsICdmZXRjaCdcbiAgICByZXF1ZXN0ID0gJC5hamF4XG4gICAgICB0eXBlOiAnR0VUJ1xuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgdXJsOiBzaXRlbWFwVXJsXG4gICAgcmVxdWVzdFxuICAgICAgLmFsd2F5cyggLT4gbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSBmYWxzZSApXG4gICAgICAuZG9uZSAoZGF0YSktPlxuICAgICAgICBuZWlnaGJvckluZm8uc2l0ZW1hcCA9IGRhdGFcbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZG9uZSdcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvci1kb25lJywgc2l0ZVxuICAgICAgLmZhaWwgKGRhdGEpLT5cbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZmFpbCdcblxuICBub3cgPSBEYXRlLm5vdygpXG4gIGlmIG5vdyA+IG5leHRBdmFpbGFibGVGZXRjaFxuICAgIG5leHRBdmFpbGFibGVGZXRjaCA9IG5vdyArIG5leHRGZXRjaEludGVydmFsXG4gICAgc2V0VGltZW91dCBmZXRjaE1hcCwgMTAwXG4gIGVsc2VcbiAgICBzZXRUaW1lb3V0IGZldGNoTWFwLCBuZXh0QXZhaWxhYmxlRmV0Y2ggLSBub3dcbiAgICBuZXh0QXZhaWxhYmxlRmV0Y2ggKz0gbmV4dEZldGNoSW50ZXJ2YWxcblxuXG53aWtpLnJlZ2lzdGVyTmVpZ2hib3IgPSBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciA9IChzaXRlKS0+XG4gIHJldHVybiBpZiB3aWtpLm5laWdoYm9yaG9vZFtzaXRlXT9cbiAgbmVpZ2hib3JJbmZvID0ge31cbiAgd2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0gPSBuZWlnaGJvckluZm9cbiAgcG9wdWxhdGVTaXRlSW5mb0Zvciggc2l0ZSwgbmVpZ2hib3JJbmZvIClcbiAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvcicsIHNpdGVcblxubmVpZ2hib3Job29kLmxpc3ROZWlnaGJvcnMgPSAoKS0+XG4gIF8ua2V5cyggd2lraS5uZWlnaGJvcmhvb2QgKVxuXG5uZWlnaGJvcmhvb2Quc2VhcmNoID0gKHNlYXJjaFF1ZXJ5KS0+XG4gIGZpbmRzID0gW11cbiAgdGFsbHkgPSB7fVxuXG4gIHRpY2sgPSAoa2V5KSAtPlxuICAgIGlmIHRhbGx5W2tleV0/IHRoZW4gdGFsbHlba2V5XSsrIGVsc2UgdGFsbHlba2V5XSA9IDFcblxuICBtYXRjaCA9IChrZXksIHRleHQpIC0+XG4gICAgaGl0ID0gdGV4dD8gYW5kIHRleHQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCBzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpICkgPj0gMFxuICAgIHRpY2sga2V5IGlmIGhpdFxuICAgIGhpdFxuXG4gIHN0YXJ0ID0gRGF0ZS5ub3coKVxuICBmb3Igb3duIG5laWdoYm9yU2l0ZSxuZWlnaGJvckluZm8gb2Ygd2lraS5uZWlnaGJvcmhvb2RcbiAgICBzaXRlbWFwID0gbmVpZ2hib3JJbmZvLnNpdGVtYXBcbiAgICB0aWNrICdzaXRlcycgaWYgc2l0ZW1hcD9cbiAgICBtYXRjaGluZ1BhZ2VzID0gXy5lYWNoIHNpdGVtYXAsIChwYWdlKS0+XG4gICAgICB0aWNrICdwYWdlcydcbiAgICAgIHJldHVybiB1bmxlc3MgbWF0Y2goJ3RpdGxlJywgcGFnZS50aXRsZSkgb3IgbWF0Y2goJ3RleHQnLCBwYWdlLnN5bm9wc2lzKSBvciBtYXRjaCgnc2x1ZycsIHBhZ2Uuc2x1ZylcbiAgICAgIHRpY2sgJ2ZpbmRzJ1xuICAgICAgZmluZHMucHVzaFxuICAgICAgICBwYWdlOiBwYWdlLFxuICAgICAgICBzaXRlOiBuZWlnaGJvclNpdGUsXG4gICAgICAgIHJhbms6IDEgIyBIQVJEQ09ERUQgRk9SIE5PV1xuICB0YWxseVsnbXNlYyddID0gRGF0ZS5ub3coKSAtIHN0YXJ0XG4gIHsgZmluZHMsIHRhbGx5IH1cblxuXG4kIC0+XG4gICRuZWlnaGJvcmhvb2QgPSAkKCcubmVpZ2hib3Job29kJylcblxuICBmbGFnID0gKHNpdGUpIC0+XG4gICAgIyBzdGF0dXMgY2xhc3MgcHJvZ3Jlc3Npb246IC53YWl0LCAuZmV0Y2gsIC5mYWlsIG9yIC5kb25lXG4gICAgXCJcIlwiXG4gICAgICA8c3BhbiBjbGFzcz1cIm5laWdoYm9yXCIgZGF0YS1zaXRlPVwiI3tzaXRlfVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid2FpdFwiPlxuICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cDovLyN7c2l0ZX0vZmF2aWNvbi5wbmdcIiB0aXRsZT1cIiN7c2l0ZX1cIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3NwYW4+XG4gICAgXCJcIlwiXG5cbiAgJCgnYm9keScpXG4gICAgLm9uICduZXctbmVpZ2hib3InLCAoZSwgc2l0ZSkgLT5cbiAgICAgICRuZWlnaGJvcmhvb2QuYXBwZW5kIGZsYWcgc2l0ZVxuICAgIC5kZWxlZ2F0ZSAnLm5laWdoYm9yIGltZycsICdjbGljaycsIChlKSAtPlxuICAgICAgd2lraS5kb0ludGVybmFsTGluayAnd2VsY29tZS12aXNpdG9ycycsIG51bGwsIEAudGl0bGVcblxuICBzZWFyY2ggPSBjcmVhdGVTZWFyY2goe25laWdoYm9yaG9vZH0pXG5cbiAgJCgnaW5wdXQuc2VhcmNoJykub24gJ2tleXByZXNzJywgKGUpLT5cbiAgICByZXR1cm4gaWYgZS5rZXlDb2RlICE9IDEzICMgMTMgPT0gcmV0dXJuXG4gICAgc2VhcmNoUXVlcnkgPSAkKHRoaXMpLnZhbCgpXG4gICAgc2VhcmNoLnBlcmZvcm1TZWFyY2goIHNlYXJjaFF1ZXJ5IClcbiAgICAkKHRoaXMpLnZhbChcIlwiKVxuIiwid2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbmFjdGl2ZSA9IHJlcXVpcmUgJy4vYWN0aXZlLmNvZmZlZSdcblxuY3JlYXRlU2VhcmNoID0gKHtuZWlnaGJvcmhvb2R9KS0+XG4gIHBlcmZvcm1TZWFyY2ggPSAoc2VhcmNoUXVlcnkpLT5cbiAgICBzZWFyY2hSZXN1bHRzID0gbmVpZ2hib3Job29kLnNlYXJjaChzZWFyY2hRdWVyeSlcbiAgICB0YWxseSA9IHNlYXJjaFJlc3VsdHMudGFsbHlcblxuXG4gICAgZXhwbGFuYXRvcnlQYXJhID0ge1xuICAgICAgdHlwZTogJ3BhcmFncmFwaCdcbiAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgU3RyaW5nICcje3NlYXJjaFF1ZXJ5fScgZm91bmQgb24gI3t0YWxseS5maW5kc3x8J25vbmUnfSBvZiAje3RhbGx5LnBhZ2VzfHwnbm8nfSBwYWdlcyBmcm9tICN7dGFsbHkuc2l0ZXN8fCdubyd9IHNpdGVzLlxuICAgICAgICBUZXh0IG1hdGNoZWQgb24gI3t0YWxseS50aXRsZXx8J25vJ30gdGl0bGVzLCAje3RhbGx5LnRleHR8fCdubyd9IHBhcmFncmFwaHMsIGFuZCAje3RhbGx5LnNsdWd8fCdubyd9IHNsdWdzLlxuICAgICAgICBFbGFwc2VkIHRpbWUgI3t0YWxseS5tc2VjfSBtaWxsaXNlY29uZHMuXG4gICAgICBcIlwiXCJcbiAgICB9XG4gICAgc2VhcmNoUmVzdWx0UmVmZXJlbmNlcyA9IGZvciByZXN1bHQgaW4gc2VhcmNoUmVzdWx0cy5maW5kc1xuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIlxuICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgICAgXCJzaXRlXCI6IHJlc3VsdC5zaXRlXG4gICAgICAgIFwic2x1Z1wiOiByZXN1bHQucGFnZS5zbHVnXG4gICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnBhZ2UudGl0bGVcbiAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5wYWdlLnN5bm9wc2lzIHx8ICcnXG4gICAgICB9XG4gICAgc2VhcmNoUmVzdWx0UGFnZURhdGEgPSB7XG4gICAgICB0aXRsZTogXCJTZWFyY2ggUmVzdWx0c1wiXG4gICAgICBzdG9yeTogW2V4cGxhbmF0b3J5UGFyYV0uY29uY2F0KHNlYXJjaFJlc3VsdFJlZmVyZW5jZXMpXG4gICAgfVxuICAgICRzZWFyY2hSZXN1bHRQYWdlID0gd2lraS5jcmVhdGVQYWdlKCdzZWFyY2gtcmVzdWx0cycpLmFkZENsYXNzKCdnaG9zdCcpXG4gICAgJHNlYXJjaFJlc3VsdFBhZ2UuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICB3aWtpLmJ1aWxkUGFnZSggc2VhcmNoUmVzdWx0UGFnZURhdGEsIG51bGwsICRzZWFyY2hSZXN1bHRQYWdlIClcbiAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuXG5cbiAge1xuICAgIHBlcmZvcm1TZWFyY2hcbiAgfVxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTZWFyY2hcbiJdfQ==
;