;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
window.wiki = require('./lib/wiki.coffee');

require('./lib/legacy.coffee');


},{"./lib/wiki.coffee":2,"./lib/legacy.coffee":3}],2:[function(require,module,exports){
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


},{"./synopsis.coffee":4,"./persona.coffee":5}],3:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":6,"./pageHandler.coffee":7,"./plugin.coffee":8,"./state.coffee":9,"./active.coffee":10,"./refresh.coffee":11}],5:[function(require,module,exports){
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
        $("#user-email").text("{{owner}}").show();
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


},{}],10:[function(require,module,exports){
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


},{}],6:[function(require,module,exports){
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


},{"./wiki.coffee":2}],8:[function(require,module,exports){
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


},{"./util.coffee":6,"./wiki.coffee":2}],9:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./active.coffee":10}],7:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":6,"./state.coffee":9,"./revision.coffee":12,"./addToJournal.coffee":13,"underscore":14}],11:[function(require,module,exports){
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


},{"./util.coffee":6,"./plugin.coffee":8,"./pageHandler.coffee":7,"./state.coffee":9,"./neighborhood.coffee":15,"./addToJournal.coffee":13,"./wiki.coffee":2,"underscore":14}],12:[function(require,module,exports){
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


},{"./util.coffee":6}],15:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./active.coffee":10,"./util.coffee":6,"./search.coffee":16,"underscore":14}],16:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":6,"./active.coffee":10}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2NsaWVudC5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi93aWtpLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2xlZ2FjeS5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9wZXJzb25hLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3N5bm9wc2lzLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2FjdGl2ZS5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi91dGlsLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3BsdWdpbi5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9zdGF0ZS5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9wYWdlSGFuZGxlci5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9yZWZyZXNoLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3JldmlzaW9uLmNvZmZlZSIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qcyIsIi9Vc2Vycy9zaG91dC9Qcm9qZWN0cy9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2FkZFRvSm91cm5hbC5jb2ZmZWUiLCIvVXNlcnMvc2hvdXQvUHJvamVjdHMvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9uZWlnaGJvcmhvb2QuY29mZmVlIiwiL1VzZXJzL3Nob3V0L1Byb2plY3RzL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsQ0FBTyxFQUFPLENBQWQsRUFBTSxDQUFRLFlBQUE7O0FBQ2QsQ0FEQSxNQUNBLGNBQUE7Ozs7QUNEQSxJQUFBLGdCQUFBO0dBQUEsZUFBQTs7QUFBQSxDQUFBLEVBQWlCLElBQUEsT0FBakIsS0FBaUI7O0FBRWpCLENBRkEsRUFFTyxDQUFQO0NBQU8sQ0FBRSxZQUFGO0NBRlAsQ0FBQTs7QUFJQSxDQUpBLEVBSWUsQ0FBWCxHQUFKLFdBQWU7O0FBRWYsQ0FOQSxFQU1BLENBQUksS0FBTztDQUNULEtBQUE7Q0FBQSxDQURVLHFEQUNWO0NBQUEsQ0FBQSxFQUF5QiwrRUFBekI7Q0FBUSxFQUFSLEdBQUEsQ0FBTyxJQUFQLEtBQVk7SUFESDtDQUFBOztBQUdYLENBVEEsRUFTYyxDQUFWLEVBQUosR0FBZTtDQUNSLENBQWUsQ0FBcEIsQ0FBSSxDQUFKLEVBQUEsRUFBQSxFQUFBLEtBQUE7Q0FEWTs7QUFJZCxDQWJBLEVBYXVCLENBQW5CLEtBQW1CLE1BQXZCO0NBQ0UsRUFBcUIsR0FBckIsRUFBQSxDQUFBO0NBRHFCOztBQUd2QixDQWhCQSxDQUFBLENBZ0J5QixDQUFyQixhQUFKOztBQUVBLENBbEJBLENBa0I4QixDQUFYLENBQWYsSUFBZSxDQUFDLEVBQXBCO0NBQ0UsQ0FBQSxFQUFJLElBQUosU0FBc0I7Q0FDdEI7Q0FDRSxPQUFBLEdBQUE7SUFERjtDQUdFLEVBQUEsQ0FBQSxhQUFzQjtJQUxQO0NBQUE7O0FBT25CLENBekJBLEVBeUJlLENBQVgsR0FBSixFQUFnQjtDQUNkLEtBQUEsRUFBQTtDQUFBLENBQUEsQ0FBQSxDQUFHO0NBQ0QsRUFBQSxDQUFBLENBQU0sRUFBQTtDQUFOLEVBQ0EsQ0FBQSxFQUFNLEtBQUcsZUFBSDtDQUNOLEdBQUEsT0FBQTtDQUFpQixFQUFELENBQUgsRUFBQSxPQUFBO01BQWI7Q0FBQSxZQUF3QztNQUgxQztJQUFBLEVBQUE7Q0FLRSxFQUFBLENBQUEsc0JBQU07Q0FDTixHQUFBLE9BQUE7Q0FBaUIsRUFBRCxDQUFILEVBQUEsT0FBQTtNQUFiO0NBQUEsWUFBd0M7TUFOMUM7SUFEYTtDQUFBOztBQVNmLENBbENBLEVBa0NvQixDQUFoQixLQUFpQixHQUFyQjtDQUNFLEtBQUEsRUFBQTtDQUFBLENBQUEsQ0FBQSxDQUFHO0NBQ0QsRUFBQSxDQUFBLENBQU0sRUFBQTtDQUFOLEVBQ0EsQ0FBQSxFQUFNLENBQUEsSUFBRyxlQUFIO0NBQ04sRUFBQSxRQUFBO0lBSEYsRUFBQTtDQUtFLEVBQUEsQ0FBQSxHQUFNLG1CQUFBO0NBQ04sRUFBQSxRQUFBO0lBUGdCO0NBQUE7O0FBU3BCLENBM0NBLENBMkN5QixDQUFQLENBQWQsS0FBZSxDQUFuQjtDQUNFLEtBQUEsS0FBQTtDQUFBLENBQUEsQ0FBYyxDQUFBLENBQWlCLENBQS9CO0NBQUEsRUFBTyxDQUFQO0lBQUE7Q0FBQSxDQUNBLENBQVEsQ0FBSyxDQUFiLHFCQUFRLENBQUssT0FBQSw4RUFBQTtDQVFiLENBQUEsRUFBK0M7Q0FBL0MsQ0FBc0MsRUFBdEMsQ0FBSyxFQUFMLElBQUE7SUFUQTtDQURnQixRQVdoQjtDQVhnQjs7QUFhbEIsQ0F4REEsRUF3RGUsQ0FBWCxHQUFKLEVBQWdCO0NBQ2QsQ0FBQSxDQUFnRixDQUFwQixFQUFBLENBQUE7Q0FBNUQsR0FBQSxFQUFBLENBQUEsSUFBQSxDQUEyQjtJQURkO0NBQUE7O0FBR2YsQ0EzREEsRUEyRG9CLENBQWhCLEVBQWdCLEdBQUMsR0FBckI7Q0FDRSxLQUFBLFlBQUE7Q0FBQSxDQUFBLENBQXFCLENBQUEsQ0FBQSxJQUFDLFNBQXRCO0NBRUUsR0FBQSxJQUFBO0NBQUEsRUFBTyxDQUFQLEVBQU87Q0FDMkUsRUFBbEQsQ0FBL0IsQ0FBQSxDQUFpRixLQUFqRixFQUFBLElBQXVHLFVBQXZHLEtBQUE7Q0FISCxFQUFxQjtDQUtsQixDQUE4QixJQUEvQixDQURGLEVBQUEsU0FBQSxFQUFBLEdBQUEsb0hBQUE7Q0FMa0I7O0FBU3BCLENBcEVBLEVBb0VpQixDQXBFakIsRUFvRU0sQ0FBTjs7OztBQ3BFQSxJQUFBLG1EQUFBOztBQUFBLENBQUEsRUFBTyxDQUFQLEdBQU8sUUFBQTs7QUFDUCxDQURBLEVBQ08sQ0FBUCxHQUFPLFFBQUE7O0FBQ1AsQ0FGQSxFQUVjLENBQUksR0FBZSxJQUFqQyxXQUFpQzs7QUFDakMsQ0FIQSxFQUdTLEdBQVQsQ0FBUyxVQUFBOztBQUNULENBSkEsRUFJUSxFQUFSLEVBQVEsU0FBQTs7QUFDUixDQUxBLEVBS1MsR0FBVCxDQUFTLFVBQUE7O0FBQ1QsQ0FOQSxFQU1VLElBQVYsV0FBVTs7QUFFVixDQVJBLEVBUWMsQ0FBZCxDQUFLLElBQUU7Q0FDQSxFQUFVLENBQVYsRUFBQSxHQUFMO0NBRFk7O0FBR2QsQ0FYQSxFQVdFLE1BQUE7Q0FvQkEsS0FBQSwrRkFBQTtDQUFBLENBQUEsQ0FBZ0IsQ0FBQSxFQUFWLE9BQVUsc0JBQUE7Q0FFUCxDQUFZLEVBQVYsQ0FBRixHQUFFO0NBQUYsQ0FBMEIsRUFBUCxDQUFBLFNBQW5CO0NBQUEsQ0FBa0QsQ0FBbEQsQ0FBMEMsRUFBQTtDQUExQyxDQUE4RCxDQUE5RCxDQUF1RCxDQUFBO0NBRmhFLEdBQWdCO0NBQWhCLENBR0EsQ0FBYyxDQUFWLENBQVUsQ0FBZCxHQUFlO0NBQ2IsR0FBQSxFQUFNO0NBQU4sQ0FDK0IsRUFBL0IsQ0FBd0MsQ0FBbEMsQ0FBTixDQUFBLElBQXdDO0NBQ2pDLEtBQUQsS0FBTjtDQU5GLEVBR2M7Q0FIZCxDQVVBLENBQVEsQ0FBQSxDQUFSLElBQVM7Q0FBMEIsQ0FBTSxFQUFqQixNQUFBLENBQUE7Q0FWeEIsRUFVUTtDQVZSLENBWUEsQ0FBa0IsQ0FBZCxDQUFjLElBQUMsQ0FBbkI7Q0FDRSxDQUE4QyxDQUE5QyxDQUFBLENBQXFCLEVBQUwsSUFBTCxFQUFLO0NBQThCLENBQU8sRUFBTixFQUFBLEVBQUQ7Q0FBQSxDQUFpQixFQUFRLEVBQVI7Q0FBL0QsS0FBQTtDQUNNLElBQUQsQ0FBTCxLQUFBO0NBZEYsRUFZa0I7Q0FabEIsQ0FnQkEsQ0FBa0IsQ0FBZCxDQUFjLEVBQUEsRUFBQyxDQUFuQjtDQUNFLE9BQUEsS0FBQTtDQUFBLEdBQUEsU0FBQTtDQUFBLEVBQVEsRUFBUixDQUFBLENBQWU7TUFBZjtDQUFBLENBQ0EsQ0FBVSxDQUFWLE9BQVU7Q0FEVixFQUVRLENBQVIsQ0FBQSxLQUFRLEtBQUssS0FBQTtDQUZiLENBTWdCLEVBRGhCLENBQ0UsQ0FERixPQUFBO0NBR0EsR0FBQSxXQUFBO0NBQ0UsSUFBQSxDQUFBLENBQU87TUFEVDtDQUdFLEdBQUEsQ0FBSyxDQUFMLEVBQUE7TUFYRjtDQUFBLENBWWlCLEVBQWpCLENBQUEsQ0FBTTtDQVpOLEVBYVMsQ0FBVCxFQUFBLENBQVM7Q0FiVCxDQWNXLENBQVgsQ0FBQSxDQUFBLElBQVc7Q0FDRyxDQUFXLENBQXZCLEVBQUEsTUFBVyxFQUFYO0NBQXVCLENBQUMsRUFBRCxJQUFDO0NBQUQsQ0FBTyxFQUFRLElBQVI7Q0FBUCxDQUEwQixFQUFOLENBQXBCLEdBQW9CO0NBQXBCLEVBQXdDLEVBQVAsQ0FBYSxFQUFiO0NBRC9DLE9BQ1Q7Q0FERixJQUFXO0NBZkssVUFpQmhCO0NBakNGLEVBZ0JrQjtDQWhCbEIsQ0FtQ0EsQ0FBb0IsTUFBQyxFQUFELEVBQUEsSUFBcEI7Q0FDRSxPQUFBLHFCQUFBO0NBQUEsRUFDRSxDQURGO0NBQ0UsQ0FBTSxFQUFOLEVBQUEsS0FBQTtDQUFBLENBQ0EsRUFBUSxFQUFSLEtBQUk7Q0FESixDQUVNLEVBQU4sRUFBQSxLQUZBO0NBREYsS0FBQTtDQUFBLENBSW1CLENBQUwsQ0FBZCxLQUFjLEVBQWQsNkJBQW1CO0NBSm5CLENBUWdCLEVBRGhCLEVBQUEsS0FDRSxFQURGO0NBUEEsR0FVQSxDQUFBLE1BQUEsRUFBYTtDQVZiLENBV3VCLEVBQXZCLEVBQU0sS0FBTjtDQVhBLEVBWWEsQ0FBYixHQUFhLEdBQWIsR0FBYTtDQVpiLENBYTZCLEVBQTdCLE1BQUEsQ0FBQTtDQUNNLENBQUssQ0FBWCxFQUFBLElBQVcsRUFBWDtDQUEwQixDQUFpQixDQUE3QixRQUFXLEVBQVg7Q0FBNkIsQ0FBTyxFQUFOLElBQUE7Q0FBRCxDQUFhLEVBQVEsSUFBUjtDQUFiLENBQWdDLEVBQU4sQ0FBMUIsR0FBMEI7Q0FBMUIsRUFBOEMsRUFBUCxDQUF2QyxFQUF1QyxFQUFpQjtDQUF4RixPQUFHO0NBQWQsSUFBVztDQWxEYixFQW1Db0I7Q0FuQ3BCLENBb0RBLENBQWEsQ0FBSSxJQUFjLENBQUMsQ0FBaEMsR0FBK0I7Q0FDN0IsT0FBQSxnQkFBQTtDQUFBLEVBQWEsQ0FBYixJQUFVLEtBQUE7Q0FBVixXQUFBO01BQUE7Q0FBQSxFQUNHLENBQUgsSUFBQSxLQUFBO0NBREEsQ0FFeUIsQ0FBZCxDQUFYLElBQUEsQ0FDWSxHQURFLENBQUg7Q0FFUCxFQUFHLEdBQUgsS0FBQSxFQUFBO0NBQ0EsRUFBZSxDQUFaLEVBQUgsRUFBdUI7Q0FDckIsQ0FBdUIsQ0FBVixDQUFQLENBQUksQ0FBSixFQUFOO0NBQ0EsR0FBVSxDQUFhLEdBQXZCO0NBQUEsZUFBQTtVQURBO0NBQUEsQ0FFNEMsQ0FBNUMsSUFBZ0IsQ0FBaEIsR0FBVyxFQUFLO0NBQTRCLENBQU8sRUFBTixFQUFELElBQUM7Q0FBRCxDQUFlLEVBQVEsTUFBUjtDQUFmLENBQWtDLEVBQU4sTUFBQTtDQUZ4RSxTQUVBO01BSEYsRUFBQTtDQUtFLENBQTRDLENBQTVDLElBQWdCLENBQWhCLEdBQVcsRUFBSztDQUE0QixDQUFPLEVBQU4sSUFBRCxFQUFDO0NBQUQsQ0FBaUIsRUFBUSxNQUFSO0NBQTdELFNBQUE7Q0FBQSxFQUNHLEdBQUgsRUFBQTtRQVBGO0NBRFEsWUFTUjtDQVZPLENBY1EsQ0FBQSxDQWRSLENBQ0MsSUFERDtDQWVQLFNBQUEsaUVBQUE7Q0FBQSxDQUFBLEVBQUcsQ0FBd0MsQ0FBM0MsQ0FBRztDQUNELE9BQUE7Q0FDQSxJQUFBLFVBQU87UUFGVDtDQUdBLENBQUEsRUFBRyxDQUF3QyxDQUEzQyxDQUFHO0NBQ0QsT0FBQSxNQUFBO0FBQzJDLENBQTNDLEdBQUEsSUFBQTtDQUFBLEVBQU8sQ0FBUCxFQUFPLENBQUEsR0FBUDtVQURBO0NBQUEsQ0FFNEMsQ0FBckIsQ0FBSSxJQUEzQixDQUFBLEtBQUE7Q0FDQSxJQUFBLFVBQU87UUFQVDtDQVNBLEdBQUcsQ0FBYSxDQUFoQixLQUFBO0NBQ0UsRUFBQSxDQUFVLElBQVYsT0FBTTtDQUNOLENBQWtCLENBQTBCLENBQXpDLENBQUEsRUFBdUIsQ0FBMUIsQ0FBRztDQUNELEVBQVcsQ0FBSSxHQUFKLENBQVgsRUFBQTtDQUNBLEdBQW9CLENBQWlCLEdBQVQsRUFBNUIsQ0FBQTtDQUFBLElBQUEsY0FBTztZQURQO0NBQUEsRUFFYyxDQUFhLEVBRjNCLEVBRXNCLEVBQXRCLENBQUE7Q0FGQSxFQUdpQixDQUFqQixJQUFRLEVBQVI7Q0FIQSxDQUlBLENBQUEsS0FBUSxFQUFSO0NBSkEsQ0FNdUIsQ0FBVCxDQUFILElBQVgsRUFBQSxDQUFBO0NBQ0EsSUFBQSxZQUFPO0NBQ0EsQ0FBYyxFQUFmLENBQUEsQ0FUUixDQVMrQixHQVQvQixDQUFBO0FBVXNCLENBQXBCLEVBQUEsQ0FBQSxNQUFBO0NBQUEsSUFBQSxjQUFPO1lBQVA7Q0FBQSxFQUNPLENBQVAsSUFBZSxFQUFmO0NBREEsQ0FFMkIsQ0FBbEIsQ0FBSSxDQUFKLENBQVQsR0FBUyxDQUFUO0NBQ0EsRUFBa0QsQ0FBSCxDQUFBLEtBQS9DO0NBQUEsQ0FBbUMsQ0FBMUIsQ0FBSSxDQUFKLENBQVQsR0FBUyxHQUFUO1lBSEE7Q0FBQSxFQUlTLENBQUksRUFBYixHQUFTLENBQVQ7Q0FDQSxDQUFBLEVBQUcsQ0FBVSxDQUFWLElBQUg7Q0FDRSxFQUFBLEtBQVEsSUFBUjtNQURGLE1BQUE7Q0FHRSxFQUFBLEdBQUEsRUFBUSxJQUFSO1lBUkY7Q0FBQSxPQVNRLEVBQVI7Q0FUQSxFQVVjLEdBQUEsSUFBZCxDQUFBO0NBVkEsQ0FXK0IsQ0FBL0IsR0FBQSxJQUFBLENBQUEsTUFBQTtDQUNBLEdBQStDLE1BQS9DLElBQUE7Q0FBQSxDQUErQixDQUEvQixHQUFBLEtBQUEsQ0FBQSxLQUFBO1lBWkE7Q0FhQSxDQUFBLEVBQTJDLENBQVUsQ0FBVixJQUEzQztDQUFBLENBQStCLENBQS9CLFFBQUEsQ0FBQSxLQUFBO1lBYkE7Q0FjQSxJQUFBLFlBQU87VUExQlg7UUFWZTtDQWRSLElBY1E7Q0FoQm5CLEVBcURHLENBQUgsSUFBQTtDQUNBLEdBQUEsWUFBQTtDQUNPLENBQTJCLEVBQTVCLElBQUosS0FBQSxHQUFBO0lBQ00sRUFGUixPQUFBO0NBR0UsQ0FBZ0MsQ0FBQSxDQUE1QixFQUFKLEVBQUEsUUFBQTtDQUVTLEVBQXFDLEdBQUEsRUFBdEMsQ0FBUixHQUFtQixDQUFuQjtNQUxGO0NBT1csSUFBVCxHQUFRLEtBQVI7TUE5RDJCO0NBcEQvQixFQW9EK0I7Q0FwRC9CLENBb0hBLENBQWlCLENBQUksS0FBbUIsS0FBeEM7O0dBQXlELEdBQUw7TUFDbEQ7Q0FBQSxFQUFPLENBQVAsRUFBTztDQUNQLEdBQUEsUUFBQTtDQUFBLEdBQUEsRUFBQSxDQUFBO01BREE7Q0FBQSxDQUVxQixFQUFyQixHQUNZLENBRFosRUFBQTtDQUdPLEVBQVAsQ0FBVyxFQUFMLENBQUssSUFBWDtDQTFIRixFQW9IdUM7Q0FwSHZDLENBNEhBLENBQVksTUFBWjtDQTVIQSxDQTZIQSxDQUFhLE9BQWI7Q0E3SEEsQ0ErSEEsQ0FBb0IsRUFBQSxFQUFwQixDQUFBLENBQXFCO0NBQ25CLE9BQUEsa0JBQUE7Q0FBQSxHQUFBLEtBQUE7Q0FBWSxJQUFZLFNBQUw7Q0FBUCxRQUFBLElBQ0w7QUFBZ0IsQ0FBRCxnQkFBQTtDQURWLFNBQUEsR0FFTDtBQUFpQixDQUFELGdCQUFBO0NBRlg7Q0FBWjtBQUdvQixDQUFwQixHQUFBLENBQTBCLENBQU8sQ0FBWixFQUFsQixDQUFpQjtDQUNsQixFQUFRLEVBQVIsQ0FBQSxDQUFRO0NBQVIsRUFDVyxFQUFLLENBQWhCLEVBQUEsQ0FBdUI7Q0FDdkIsRUFBbUIsQ0FBaEIsQ0FBcUIsQ0FBeEIsRUFBRztDQUNNLENBQUksQ0FBWCxFQUFnQixDQUFWLEVBQUssT0FBWDtRQUpKO01BSmtCO0NBQXBCLEVBQW9CO0NBL0hwQixDQTJJQSxFQUFBLENBQThCLENBQTlCLElBQUE7Q0EzSUEsQ0E2SUEsQ0FDYSxFQUFBLEVBQUEsQ0FEYixDQUFBO0NBRUksRUFBQSxDQUFBLENBQTRCLENBQWxCLENBQU87Q0FBakIsV0FBQTtNQUFBO0NBQUEsQ0FDdUIsQ0FBdkIsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxJQUFBO0NBQ0EsRUFFSCxDQUZ5QixHQUF0QixDQUVLLENBRkwsRUFBQSxDQUFzQixxQkFBQTtDQUoxQixFQUNhO0NBOUliLENBdUpBLENBQWMsQ0FBQSxLQUFDLEVBQWY7QUFDMkIsQ0FBekIsR0FBQTtDQUFBLEdBQU8sU0FBQTtNQUFQO0NBQUEsQ0FDd0IsQ0FBeEIsQ0FBQSxTQUFBO0NBQ1ksRUFBWixRQUFBO0NBQ0UsQ0FBWSxDQUFBLENBQUEsRUFBWixHQUFhLENBQWI7Q0FBcUMsR0FBTCxDQUFBLFVBQUE7Q0FBaEMsTUFBWTtDQUFaLENBQ2UsQ0FBQSxHQUFmLEdBQWUsSUFBZjtDQUF1QixHQUFMLFdBQUE7Q0FEbEIsTUFDZTtDQURmLENBRWlCLElBQWpCLFNBQUE7Q0FBaUIsQ0FBTyxFQUFOLElBQUE7UUFGbEI7Q0FKVSxLQUdaO0NBMUpGLEVBdUpjO0NBdkpkLENBK0pBLENBQWMsQ0FBQSxLQUFDLEVBQWY7Q0FDRSxHQUFBLElBQUE7Q0FBQSxHQUFBLFVBQUE7QUFDMkMsQ0FBM0MsR0FBQSxJQUFBO0NBQUEsRUFBTyxDQUFQLEVBQUEsQ0FBTztNQURQO0NBQUEsQ0FFcUIsRUFBckIsRUFBMkIsUUFBM0I7Q0FDQSxJQUFBLE1BQU87Q0FuS1QsRUErSmM7Q0EvSmQsQ0FxS0EsQ0FDMEMsSUFEMUMsQ0FBQSxDQUMyQyxVQUQzQztDQUVJLE9BQUEsU0FBQTtDQUFBLEdBQUEsVUFBQTtDQUFBLEVBQ2MsQ0FBZCxFQUFjLEtBQWQ7Q0FEQSxFQUVPLENBQVAsRUFBTyxLQUFXO0NBQ2IsQ0FBa0MsQ0FBaEIsQ0FBbkIsQ0FBSixDQUFBLEVBQXVDLENBQWlCLEVBQXhEO0NBTEosQ0FPcUIsQ0FOcUIsSUFEMUMsQ0FBQSxDQU8rQjtBQUNKLENBQXZCLENBQXVCLENBQUEsQ0FBdkIsRUFBdUI7Q0FBaEIsRUFBUCxDQUFBLEVBQU0sT0FBTjtNQUQwQjtDQVA5QixDQVV5QixDQUhLLElBUDlCLENBQUEsQ0FVbUMsRUFWbkM7Q0FXSSxHQUFBLElBQUE7Q0FBQSxFQUFPLENBQVAsRUFBTyxJQUFBO0NBQVAsRUFDc0IsQ0FBdEIsQ0FBc0IsQ0FBQSxDQUF0QixJQUFXO0NBQ0MsQ0FBRyxFQUFmLE9BQUE7Q0FiSixDQWUwQixDQUxRLElBVmxDLENBQUEsQ0Flb0MsR0FmcEM7Q0FnQkksR0FBQSxJQUFBO0NBQUEsRUFBTyxDQUFQLEVBQU87Q0FBUCxFQUNzQixDQUF0QixFQUF1QixDQUF2QixJQUFXO0NBQ0MsQ0FBRyxFQUFmLE9BQUE7Q0FsQkosQ0FvQnlCLENBTFUsS0FmbkMsQ0FvQnNDLENBcEJ0QyxDQUFBO0NBcUJJLE9BQUEsc0JBQUE7Q0FBQSxHQUFBLFVBQUE7Q0FBQSxFQUNRLENBQVIsQ0FBQSxFQUFRO0NBRFIsRUFFTyxDQUFQLENBQVksQ0FBTDtDQUZQLEVBR0EsQ0FBQSxFQUFNLENBQVk7Q0FIbEIsRUFJUyxDQUFULEVBQUEsQ0FBc0I7Q0FKdEIsQ0FLOEIsQ0FBdkIsQ0FBUCxFQUFPLEdBQUE7Q0FDRixDQUFpRCxDQUEvQixDQUFuQixFQUFKLEVBQXNELENBQXRELEVBQUE7Q0EzQkosQ0E2QnVCLENBVGMsSUFwQnJDLENBQUEsQ0FBQTtDQThCSSxPQUFBLHVCQUFBO0NBQUEsR0FBQSxVQUFBO0NBQUEsRUFDVSxDQUFWLEVBQVUsQ0FBVjtDQUNBLENBQUcsRUFBSCxHQUFVLGdDQUFWO0NBQ0UsRUFBc0IsQ0FBQyxFQUF2QixDQUFBLElBQVc7Q0FDQyxDQUFHLENBQUMsQ0FBSSxDQUFKLE1BQWhCLEVBQUE7TUFGRjtDQUlFLEVBQVEsQ0FBQSxDQUFSLENBQUEsQ0FBUTtDQUFSLEVBQ08sQ0FBUCxDQUF3QixDQUF4QjtDQURBLEVBRUEsQ0FBTSxDQUFBLENBQU4sQ0FBTSxDQUFBO0FBQzBCLENBQWhDLEdBQUEsRUFBQSxFQUFBO0NBQUEsSUFBSyxDQUFMLENBQUEsQ0FBQTtRQUhBO0NBQUEsQ0FJZ0IsQ0FBRSxDQUFkLENBQXNDLENBQTFDLENBQ1ksQ0FEWixFQUFBO0NBR08sRUFBUCxDQUFXLEVBQUwsQ0FBSyxNQUFYO01BZDBCO0NBN0JoQyxDQTZDMEIsQ0FoQk0sSUE3QmhDLENBQUEsQ0E2Q29DLEdBN0NwQztDQThDSSxPQUFBLHFCQUFBO0NBQUEsRUFBYyxDQUFkLEVBQWMsQ0FBQSxJQUFkO0NBQ0EsR0FBQSxHQUFHLENBQUEsR0FBVztBQUNMLENBQVAsR0FBQSxFQUFBLFNBQU87Q0FDTCxFQUFPLENBQVAsRUFBTyxFQUFQLEdBQWtCO0NBQWxCLE1BQ0EsQ0FBQSxHQUFXO0NBQ0MsQ0FBaUIsQ0FBN0IsUUFBVyxJQUFYO0NBQTZCLENBQU8sRUFBTixFQUFELElBQUM7Q0FBRCxDQUFlLEVBQWYsTUFBZTtDQUg5QyxTQUdFO1FBSko7TUFBQTtDQU1FLEdBQUcsRUFBSCx5Q0FBQTtDQUNjLENBQWlCLENBQTdCLFFBQVcsSUFBWDtDQUE2QixDQUFNLEVBQUwsRUFBRCxJQUFDO0NBQUQsQ0FBb0IsRUFBTixNQUFBO0NBRDdDLFNBQ0U7UUFQSjtNQUYrQjtDQTdDbkMsQ0F3RHVCLENBWFksSUE3Q25DLENBQUEsQ0FBQTtDQXlESSxDQUFBLE1BQUE7Q0FBQSxDQUFBLENBQUssQ0FBTCxLQUFLO0NBQUwsQ0FDRyxDQUFVLENBQWIsSUFBQSxHQUFHO0NBQ0gsSUFBQSxFQUFBLElBQUE7Q0EzREosQ0E2RHFCLENBTFcsSUF4RGhDLENBQUEsQ0E2RDhCO0NBQzFCLENBQUEsTUFBQTtDQUFBLENBQUEsQ0FBSyxDQUFMLEtBQUs7Q0FDTCxDQUFHLENBQWlCLEtBQXBCLEdBQUEsT0FBRztDQS9EUCxDQWlFNkIsQ0FKQyxJQTdEOUIsQ0FBQSxDQWlFdUMsTUFqRXZDO0NBa0VnQixDQUEwQixDQUFBLENBQTFCLENBQTBCLENBQTFCLEdBQTJCLEVBQXZDO0NBQ0UsU0FBQSxDQUFBO0NBQUEsRUFBUSxFQUFSLENBQUEsQ0FBUSxNQUFBO0NBQVIsSUFDSyxDQUFMLENBQUEsSUFBQTtDQURBLEVBRU8sQ0FBUCxDQUFZLENBQVo7Q0FGQSxDQUFBLENBR2EsQ0FBVCxDQUFKLENBQUE7Q0FIQSxDQUl1QixDQUF2QixFQUFBLENBQUEsS0FBVztDQUFZLENBQU8sRUFBTixJQUFBO0NBQUQsQ0FBaUIsRUFBUSxJQUFSO0NBQWpCLENBQW9DLEVBQU4sSUFBQTtDQUFNLENBQU8sRUFBSSxDQUFWLEtBQUE7Q0FBRCxDQUEwQixFQUFPLENBQWQsQ0FBbkIsSUFBbUI7VUFBdkQ7Q0FKdkIsT0FJQTtDQUNLLENBQWdCLEVBQWpCLENBQTRCLElBQWhDLElBQUE7Q0FORixJQUFzQztDQWxFMUMsQ0EwRXNCLENBVGdCLEVBakV0QyxHQUFBLENBMEU4QjtDQUMxQixPQUFBLGNBQUE7Q0FBQSxDQUFnQixDQUFoQixDQUFBLENBQUE7Q0FBQSxFQUNRLENBQVIsQ0FBQSxDQUFRLENBQUEsTUFBQTtDQURSLEVBRVEsQ0FBUixDQUFBLElBQVE7Q0FGUixFQUdXLENBQVgsQ0FBZ0IsQ0FBTCxFQUFYLENBQWdDO0NBSGhDLENBSW1CLENBQW5CLENBQUEsQ0FBQSxHQUFBO0NBQ00sR0FBTixDQUFLLEVBQUwsSUFBQTtDQUFxQixDQUFZLElBQVgsQ0FBRCxFQUFDO0NBTkcsQ0FNa0IsSUFBM0M7Q0FoRkosQ0FrRnNCLENBUk8sSUExRTdCLENBQUEsQ0FrRmdDO0NBQzVCLENBQTRCLEVBQUEsRUFBQSxDQUE1QixJQUFBO0NBbkZKLEVBa0YrQjtDQXZQL0IsQ0EwUEEsQ0FBMkIsRUFBM0IsSUFBMkIsUUFBM0I7Q0FDRSxFQUFBLENBQUEsV0FBNEIsS0FBNUI7Q0FDQSxLQUFBLEtBQUEsRUFBQTtDQUZGLEVBQTJCO0NBMVAzQixDQThQQSxDQUFrQyxHQUFsQyxFQUFrQyxDQUFDLFVBQW5DO0NBQ0UsQ0FBd0IsQ0FBUixDQUFoQixDQUFnQixFQUFoQixFQUFpQixFQUFqQjtDQUNPLEdBQUQsR0FBVyxFQUFmLElBQUE7Q0FERixJQUFnQjtDQURsQixFQUFrQztDQUlsQyxFQUFFLE1BQUY7Q0FDRSxHQUFBLENBQUs7Q0FBTCxHQUNBLEdBQUE7Q0FDTyxFQUFQLENBQVcsRUFBTCxDQUFLLElBQVg7Q0FIRixFQUFFO0NBdFJGOzs7O0FDWEYsQ0FBTyxFQUFVLEVBQUEsQ0FBWCxDQUFOLEVBQWtCO0NBQ2hCLENBQUEsRUFBQSxTQUFBO0NBQUEsQ0FDQSxFQUFBLGdCQUFBO0NBREEsQ0FFQSxFQUFBLGlCQUFBO0NBRkEsQ0FHQSxHQUFBLElBQVM7Q0FDUCxDQUFjLEVBQWQsQ0FBQSxPQUFBO0NBQUEsQ0FDUyxDQUFBLENBQVQsR0FBQSxFQUFVO0NBQ1IsQ0FBMEIsQ0FBMUIsR0FBQSxDQUFPLEVBQVAsR0FBQTtDQUNDLENBQ0MsRUFERixTQUFBLEdBQUE7Q0FDRSxDQUFXLE1BQVgsQ0FBQTtFQUNBLENBQUEsS0FGRixDQUVHO0NBQ0QsRUFBVyxDQUFJLENBQUosR0FBWDtDQUFBLEVBQ0EsSUFBTyxDQUFQO0NBQ0EsR0FBRyxDQUFVLENBQVYsRUFBSDtDQUNFLEdBQUEsQ0FBQSxHQUE4QixFQUE5QixHQUFBO0NBQUEsR0FDQSxNQUFBLFVBQUE7Q0FDQSxHQUFBLGFBQUEsSUFBQTtNQUhGLElBQUE7Q0FPRSxDQUFZLElBQVosR0FBUyxDQUFUO0NBQ0EsR0FBOEIsQ0FBbUIsQ0FBakQsRUFBeUQsRUFBekQsS0FBOEI7Q0FBdkIsRUFBVyxHQUFaLEVBQU4sV0FBQTtZQVJGO1VBSEE7Q0FGRixNQUVFO0NBTEosSUFDUztDQURULENBbUJVLENBQUEsQ0FBVixJQUFBLENBQVU7Q0FDUixFQUFBLEdBQUEsQ0FBTyxNQUFQO0NBQUEsR0FDQSxFQUFBLFdBQUE7Q0FEQSxHQUVBLEVBQUEsT0FBQTtDQUZBLEdBR0EsRUFBQSxjQUFBO0NBQ0EsR0FBQSxTQUFBLFFBQUE7Q0F4QkYsSUFtQlU7Q0FuQlYsQ0EwQlMsQ0FBQSxDQUFULEdBQUEsRUFBUztDQUNQLEVBQUEsR0FBQSxDQUFPLHNCQUFQO0NBQ0EsR0FBRyxDQUFILENBQUE7Q0FDRSxHQUFBLElBQUEsR0FBQSxFQUFBO0NBQUEsR0FDQSxJQUFBLFlBQUE7Q0FDQSxHQUFBLFdBQUEsTUFBQTtNQUhGLEVBQUE7Q0FLRSxHQUFBLElBQUEsS0FBQTtDQUFBLEdBQ0EsSUFBQSxZQUFBO0NBQ0EsR0FBQSxXQUFBLE1BQUE7UUFUSztDQTFCVCxJQTBCUztDQTlCWCxHQUdBO0NBSEEsQ0F5Q0EsQ0FBOEIsRUFBOUIsSUFBK0IsV0FBL0I7Q0FDRSxHQUFBLFVBQUE7Q0FDVSxDQUFFLEtBQVosRUFBUyxFQUFUO0NBRkYsRUFBOEI7Q0FJOUIsRUFBK0IsRUFBL0IsSUFBQSxZQUFBO0NBQ0UsR0FBQSxVQUFBO0NBQ1UsQ0FBRSxJQUFaLEdBQVMsRUFBVDtDQUZGLEVBQStCO0NBOUNoQjs7OztBQ0FqQixDQUFPLEVBQVUsQ0FBQSxFQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSxVQUFBO0NBQUEsQ0FBQSxDQUFXLENBQUksSUFBZjtDQUNBLENBQUEsRUFBRyxVQUFBLE1BQUg7Q0FDRSxDQUFBLENBQUssQ0FBTCxDQUFnQjtDQUFoQixDQUNBLENBQUssQ0FBTCxDQUFnQjtDQUNoQixDQUF3QixFQUF4QixDQUF5QyxNQUF6QztDQUFBLENBQWUsQ0FBRixHQUFiO01BRkE7Q0FHQSxDQUF3QixFQUF4QixDQUF5QyxNQUF6QztDQUFBLENBQWUsQ0FBRixHQUFiO01BSEE7Q0FJQSxDQUF3QixFQUF4QixhQUFBO0NBQUEsQ0FBZSxDQUFGLEdBQWI7TUFKQTtDQUtBLENBQXdCLEVBQXhCLGFBQUE7Q0FBQSxDQUFlLENBQUYsR0FBYjtNQUxBO0NBQUEsRUFNYSxDQUFiLENBQW9ELENBQXZCLEdBQUQsS0FBQyxNQUFoQjtJQVBmLEVBQUE7Q0FTRSxFQUFXLENBQVgsSUFBQSxlQUFBO0lBVkY7Q0FXQSxPQUFBLENBQU87Q0FaUTs7OztBQ0FqQixJQUFBLGlDQUFBOztBQUFBLENBQUEsQ0FBQSxDQUFpQixHQUFYLENBQU47O0FBR0EsQ0FIQSxFQUd5QixHQUFuQixTQUFOOztBQUNBLENBSkEsRUFJc0IsTUFBQSxVQUF0QjtDQUNFLEtBQUEsRUFBQTtDQUFBLENBQUEsQ0FBVyxHQUFBLEVBQVgsQ0FBa0MsR0FBdkI7Q0FBMEIsRUFBdUIsQ0FBdkIsTUFBQSxDQUFBO0NBQTFCLEVBQXVCO0NBQ2xDLENBQUEsQ0FBcUIsQ0FBbEIsRUFBQSxFQUFRO0NBQVgsVUFDRTtJQURGLEVBQUE7Q0FHRSxDQUFBLENBQXNDLEdBQXRDLEdBQXNDLENBQXRDLENBQUEsQ0FBQTtDQUF5QyxFQUF1QixDQUF2QixNQUFBLEdBQUE7Q0FBekMsSUFBc0MsSUFBdEM7SUFMa0I7Q0FBQTs7QUFPdEIsQ0FYQSxDQVdXLENBQUEsS0FBWCxDQUFZO0NBQ1YsS0FBQSw0Q0FBQTs7Q0FBTyxFQUFtQixDQUExQixFQUFNLGFBQW9CO0lBQTFCO0NBQUEsQ0FDQSxDQUFZLEVBQUEsQ0FBQSxHQUFaO0NBREEsQ0FFQSxDQUFPLENBQVAsRUFBYSxJQUFOLEtBQXNCO0NBRjdCLENBR0EsQ0FBTyxDQUFQLEtBSEE7Q0FBQSxDQUlBLENBQVMsQ0FKVCxFQUlBLEVBQVM7Q0FKVCxDQUtBLENBQVEsQ0FBQSxDQUFSLEtBQVE7Q0FMUixDQU1BLENBQWUsQ0FBQSxHQUFBLEdBQUEsRUFBZjtDQUVBLENBQUEsQ0FBWSxDQUFULEVBQUE7Q0FDTSxLQUFELENBQU4sSUFBQSxJQUFzQjtDQUFTLENBQVksSUFBWixJQUFBO0NBRGpDLEtBQ0U7R0FDZSxDQUZqQixDQUVRLENBRlI7Q0FHUyxLQUFELENBQU4sSUFBQSxJQUFzQjtDQUFTLENBQVksQ0FBUyxFQUFBLENBQXJCLEdBQXNCLENBQXRCO0NBSGpDLEtBR0U7Q0FDYSxFQUFBLENBSmYsRUFBQSxFQUllLEVBQUE7Q0FDTixLQUFELENBQU4sSUFBQSxJQUFzQjtDQUFTLENBQVksQ0FBQSxDQUFJLEVBQWhCLEdBQVksQ0FBWixFQUE2QjtDQUw5RCxLQUtFO0lBZE87Q0FBQTs7QUFnQlgsQ0EzQkEsQ0EyQmEsQ0FBYixHQUFNLEdBQVE7Q0FDWixDQUFBLENBQUs7Q0FBTCxDQUNBLE1BQUEsQ0FBQSxFQUFBO0NBQ1MsQ0FBRSxNQUFYLENBQUE7Q0FIVzs7OztBQzNCYixJQUFBLE1BQUE7O0FBQUEsQ0FBQSxFQUFPLENBQVAsR0FBTyxRQUFBOztBQUNQLENBREEsQ0FBQSxDQUNpQixDQUFJLEVBQWYsQ0FBTjs7QUFFQSxDQUhBLEVBSUUsQ0FERSxHQUFKO0NBQ0UsQ0FBQSxDQUFBLEdBQUE7Q0FBQSxDQUNBLENBQUE7Q0FEQSxDQUVBLENBRkEsQ0FFQTtDQUZBLENBR0EsQ0FIQSxDQUdBO0NBSEEsQ0FJQSxDQUpBLENBSUE7Q0FKQSxDQUtBLENBTEEsR0FLQTtDQVRGLENBQUE7O0FBV0EsQ0FYQSxFQVdrQixDQUFkLEtBQWMsQ0FBbEI7Q0FDRyxDQUFELENBQUssQ0FBSSxDQUFSLENBQUksRUFBTCxDQUFBO0NBRGdCOztBQUdsQixDQWRBLEVBY21CLENBQWYsS0FBZ0IsRUFBcEI7U0FDRTs7QUFBQyxDQUFBO0dBQUEsT0FBc0IsOENBQXRCO0NBQUEsR0FBSSxNQUFKO0NBQUE7O0NBQUQsQ0FBQSxFQUFBO0NBRGlCOztBQUluQixDQWxCQSxFQWtCa0IsQ0FBZCxLQUFlLENBQW5CO0NBQ0UsS0FBQSxVQUFBO0NBQUEsQ0FBQSxDQUFRLENBQUEsT0FBTTtDQUFkLENBQ0EsQ0FBSyxFQUFBLEdBQXFGO0NBRDFGLENBRUEsQ0FBSSxLQUFBO0NBRkosQ0FHQSxDQUFRLENBQUg7Q0FITCxDQUlBLENBQU8sRUFBSztDQUpaLENBS0EsQ0FBSyxPQUFJO0NBQ1QsQ0FBQSxDQUFFLEdBQUYsQ0FBc0IsRUFBdEIsRUFBMkM7Q0FQM0I7O0FBVWxCLENBNUJBLEVBNEJrQixDQUFkLEtBQWUsQ0FBbkIsRUFBa0I7Q0FDaEIsS0FBQSw0QkFBQTtDQUFBLENBQUEsQ0FBUSxDQUFBLFFBQUE7Q0FBUixDQUNBLENBQUssRUFBQSxDQUFrRDtDQUR2RCxDQUVBLENBQUssRUFBQSxHQUFxRjtDQUYxRixDQUdBLENBQUEsSUFBTTtDQUhOLENBSUEsQ0FBSyxRQUFBO0NBSkwsQ0FLQSxDQUFJLEtBQUE7Q0FMSixDQU1BLENBQVEsQ0FBSDtDQU5MLENBT0EsQ0FBTyxFQUFLO0NBUFosQ0FRQSxDQUFLLE9BQUk7Q0FSVCxDQVNBLENBQUEsT0FBVTtDQUNWLENBQUEsQ0FBRSxDQUFGLEVBQUEsR0FBQTtDQVhnQjs7QUFhbEIsQ0F6Q0EsRUF5Q3lCLENBQXJCLEtBQXNCLEdBQUQsS0FBekI7Q0FDRSxLQUFBLDRDQUFBO0NBQUEsQ0FBQSxDQUFhLENBQUEsQ0FBYixFQUFhLEtBQWI7Q0FDQSxDQUFBLENBQXlELENBQVIsQ0FBUTtDQUF6RCxDQUFPLENBQUUsQ0FBSSxDQUFKLE1BQUYsUUFBUDtJQURBO0NBRUEsQ0FBQSxDQUFtRCxDQUFSO0NBQTNDLENBQU8sQ0FBRSxDQUFJLENBQUosTUFBRixHQUFQO0lBRkE7Q0FHQSxDQUFBLENBQTRDLENBQUQ7Q0FBM0MsQ0FBTyxDQUFFLENBQUksQ0FBSixNQUFGLEdBQVA7SUFIQTtDQUlBLENBQUEsQ0FBZ0QsQ0FBUjtDQUF4QyxDQUFPLENBQUUsQ0FBSSxDQUFKLE1BQUYsQ0FBUDtJQUpBO0NBS0EsQ0FBQSxDQUFpRCxDQUFULENBQUM7Q0FBekMsQ0FBTyxDQUFFLENBQUksQ0FBSixNQUFGO0lBTFA7Q0FNQSxDQUFBLENBQW9ELENBQVYsRUFBQztDQUEzQyxDQUFPLENBQUUsQ0FBSSxDQUFKLE1BQUYsQ0FBUDtJQU5BO0NBT0EsQ0FBQSxDQUFxRCxDQUFULENBQUM7Q0FBN0MsQ0FBTyxDQUFFLENBQUksQ0FBSixDQUFBLEtBQUYsRUFBUDtJQVBBO0NBUUEsQ0FBTyxDQUFFLENBQUksQ0FBSixJQUFGLEdBQVA7Q0FUdUI7O0FBYXpCLENBdERBLEVBc0RpQixDQUFiLEtBQUo7U0FDRTtDQUFBLENBQU8sRUFBUCxDQUFBLEVBQUE7Q0FBQSxDQUNPLEVBQVAsQ0FBQTtDQURBLENBRVMsRUFBVCxHQUFBO0NBSGU7Q0FBQTs7QUFXakIsQ0FqRUEsRUFpRXVCLENBQW5CLEtBQW9CLElBQUQsRUFBdkI7Q0FDRSxLQUFBLFFBQUE7Q0FBQSxDQUFBLENBQUssVUFBYTtDQUNsQixDQUFBLEVBQUcsSUFBUSxDQUFYO0NBQ0UsQ0FBRSxFQUFGLENBQUE7Q0FBQSxFQUNBLENBQUEsSUFBYyxDQUFVLEVBQWxCO0FBQ3NCLENBRjVCLENBRTJCLENBQXhCLENBQUgsQ0FBb0MsQ0FBcEMsR0FBQSxFQUFBO0NBRkEsRUFHUSxDQUFSLENBQUEsQ0FIQTtXQUlBO0NBQUEsQ0FBUSxHQUFQLENBQUE7Q0FBRCxDQUFvQixDQUFMLEVBQWYsQ0FBZTtDQUxqQjtJQUFBLEVBQUE7V0FPRTtDQUFBLENBQVEsR0FBUCxDQUFBLFFBQUQ7Q0FBQSxDQUFnQyxDQUFMLEdBQUEsTUFBM0I7Q0FQRjtJQUZxQjtDQUFBOztBQVd2QixDQTVFQSxDQTRFd0MsQ0FBaEIsQ0FBcEIsSUFBb0IsQ0FBQyxJQUFELEdBQXhCO0NBQ0UsS0FBQSxHQUFBO0NBQUEsQ0FBQSxDQUFLLFVBQWE7Q0FDbEIsQ0FBQSxFQUFHLE1BQUg7Q0FDRSxDQUFLLEVBQUwsV0FBQTtDQUNFLENBQVUsQ0FBRixFQUFSLENBQUEsU0FBUTtDQUFSLENBQ3dCLEVBQXhCLENBQUssQ0FBTCxFQUFBLEdBQUE7Q0FEQSxJQUVLLENBQUw7TUFIRjtDQUtFLENBQUUsSUFBRixFQUFBLFNBQUE7TUFMRjtDQU1HLENBQUQsR0FBRixNQUFBO0lBVG9CO0NBQUE7Ozs7QUM1RXhCLElBQUEsa0NBQUE7O0FBQUEsQ0FBQSxFQUFPLENBQVAsR0FBTyxRQUFBOztBQUNQLENBREEsRUFDTyxDQUFQLEdBQU8sUUFBQTs7QUFFUCxDQUhBLENBQUEsQ0FHaUIsR0FBWCxDQUFOOztBQUtBLENBUkEsQ0FBQSxDQVFVLElBQVY7O0FBQ0EsQ0FUQSxDQVNtQyxDQUF2QixDQUFJLElBQWEsQ0FBN0I7O0dBQThDLENBQVgsS0FBVztJQUM1QztDQUFBLENBQUEsRUFBRyxnQkFBSDtDQUNFLE9BQUEsR0FBQTtJQURGLEVBQUE7Q0FHRyxFQUFELENBQUEsS0FBQSxFQUFBO0NBRUksRUFBUSxDQUFSLEVBQUEsQ0FBUTtDQUNSLE9BQUEsS0FBQTtDQUhKLEVBSVEsQ0FKUixDQUNRLElBR0E7Q0FDSixPQUFBLEtBQUE7Q0FMSixJQUlRO0lBUmlCO0NBQUE7O0FBVzdCLENBcEJBLENBb0JxQyxDQUFyQyxDQUFpQixFQUFYLEVBQXdCLENBQWpCO0NBQ1gsQ0FBQSxFQUF5QyxFQUFNLENBQVM7Q0FBeEQsR0FBK0IsRUFBVCxDQUFTLENBQXhCLEdBQUE7SUFBUDtDQUNXLENBQThCLENBQXBCLENBQVYsQ0FBWCxJQUFBLEVBQVc7Q0FDVCxHQUFBLEVBQStDLENBQVM7Q0FBeEQsR0FBK0IsRUFBVCxDQUFTLENBQXhCLEtBQUE7TUFBUDtDQUNXLENBQXNCLENBQVosQ0FBVixDQUFYLElBQUEsRUFBQTtDQUNXLEdBQWUsRUFBVCxDQUFTLENBQXhCLEtBQUE7Q0FERixJQUFpQztDQUZuQyxFQUF5QztDQUZiOztBQU85QixDQTNCQSxDQTJCa0MsQ0FBdEIsQ0FBTixFQUFBLEVBQU0sQ0FBaUI7Q0FDM0IsSUFBQSxDQUFBOztHQUQyQyxDQUFMLEtBQUs7SUFDM0M7Q0FBQSxDQUFBLENBQVEsRUFBUixJQUFTO0NBQ1AsT0FBQSxJQUFBO0NBQUEsRUFBZSxDQUFmLEdBQWUsQ0FBQSxDQUFBLEdBQWY7Q0FBQSxDQUNvQixFQUFwQixJQUFrQixJQUFOO0NBQ1IsRUFBRCxHQUFILEtBQUEsQ0FBQTtDQUhGLEVBQVE7Q0FBUixDQUtBLENBQUcsQ0FBSCxHQUF3QixNQUF4QjtDQUxBLENBTUEsQ0FBRyxDQUFILEVBQUE7Q0FDTyxDQUFlLENBQXRCLENBQWUsRUFBVCxHQUFOO0NBQ0UsRUFBQSxLQUFBO0NBQUE7Q0FDRSxHQUErRCxFQUEvRCxRQUFBO0NBQUEsRUFBeUMsQ0FBSSxLQUF2QyxLQUFBLFdBQVc7UUFBakI7Q0FDQSxFQUF3QixDQUFyQixFQUFIO0NBQ1MsQ0FBVSxDQUFqQixDQUFBLEVBQU0sR0FBaUIsTUFBdkI7Q0FDRSxDQUFpQixDQUFqQixDQUFBLEVBQU0sSUFBTjtDQUNBLEdBQUEsYUFBQTtDQUZGLFFBQXVCO01BRHpCLEVBQUE7Q0FLRSxDQUFpQixDQUFqQixDQUFBLEVBQU0sRUFBTjtDQUFBLENBQ2lCLENBQWpCLENBQUEsRUFBTSxFQUFOO0NBQ0EsR0FBQSxXQUFBO1FBVEo7TUFBQTtDQVdFLEtBREk7Q0FDSixDQUF5QixDQUF6QixDQUFJLEVBQUosUUFBQTtDQUFBLEVBQ0EsRUFBQSxDQUFBO0NBQ0EsR0FBQSxTQUFBO01BZGtCO0NBQXRCLEVBQXNCO0NBUkk7O0FBd0I1QixDQW5EQSxDQW1Ea0MsQ0FBWixDQUFsQixJQUFrQixDQUFDLENBQUQsSUFBdEI7Q0FDUyxFQUFzQixHQUF2QixDQUFTLENBQWMsQ0FBN0IsQ0FBZTtDQURLOztBQU10QixDQXpEQSxFQTBERSxHQURJLENBQU47Q0FDRSxDQUFBLE9BQUE7Q0FDRSxDQUFNLENBQUEsQ0FBTixLQUFPO0NBQ0wsU0FBQSxvQkFBQTtDQUFBO0NBQUE7WUFBQSwrQkFBQTt5QkFBQTtDQUNFLEdBQWtELENBQUEsR0FBbEQ7Q0FBQSxFQUFHLENBQWlCLENBQVIsQ0FBWixNQUFnQjtNQUFoQixJQUFBO0NBQUE7VUFERjtDQUFBO3VCQURJO0NBQU4sSUFBTTtDQUFOLENBR00sQ0FBQSxDQUFOLEtBQU87Q0FDRCxFQUFELEtBQUgsQ0FBYSxJQUFiO0NBQXFCLENBQWdCLENBQXJCLENBQUksTUFBSixLQUFBO0NBQWhCLE1BQWE7Q0FKZixJQUdNO0lBSlI7Q0FBQSxDQU1BLEdBQUE7Q0FDRSxDQUFNLENBQUEsQ0FBTixLQUFPO0NBQ0wsRUFBYyxDQUFWLEVBQUo7Q0FDSSxFQUFELENBQXlDLEVBQTVDLEdBQVksR0FBOEMsQ0FBMUQsZ0JBQVk7Q0FGZCxJQUFNO0NBQU4sQ0FHTSxDQUFBLENBQU4sS0FBTztDQUNMLEVBQUcsR0FBSCxFQUFBLENBQWE7Q0FBUSxDQUFnQixDQUFyQixDQUFJLE1BQUosS0FBQTtDQUFoQixNQUFhO0NBQ1QsRUFBRCxDQUFILENBQUEsR0FBQSxDQUF5QixJQUF6QjtDQUFpQyxDQUFrQixFQUFuQixFQUFKLFNBQUE7Q0FBNUIsTUFBeUI7Q0FMM0IsSUFHTTtJQVZSO0NBQUEsQ0FhQSxJQUFBO0NBQ0UsQ0FBTSxDQUFBLENBQU4sS0FBTztDQUNMLFNBQUEsb0JBQUE7Q0FBQSxDQUFXLENBQVIsQ0FBZ0IsRUFBbkIsMkRBQUE7Q0FDQSxHQUFHLEVBQUgsZ0JBQUEsNkJBQUc7Q0FDRDtDQUFBO2NBQUEsNkJBQUE7MkJBQUE7Q0FDRSxHQUFHLENBQUEsS0FBSCxFQUFHO0NBQ0QsRUFBRyxDQUFxRCxDQUFpRCxDQUF6RyxNQUFzRixZQUF4RSxpQkFBQTtNQURoQixNQUFBO0NBQUE7WUFERjtDQUFBO3lCQURGO1FBRkk7Q0FBTixJQUFNO0NBQU4sQ0FNTSxDQUFBLENBQU4sS0FBTztJQXBCVDtDQTFERixDQUFBOzs7O0FDQUEsSUFBQSxlQUFBO0dBQUEsa0pBQUE7O0FBQUEsQ0FBQSxFQUFPLENBQVAsR0FBTyxRQUFBOztBQUNQLENBREEsRUFDUyxHQUFULENBQVMsVUFBQTs7QUFFVCxDQUhBLENBQUEsQ0FHaUIsRUFBQSxDQUFYLENBQU47O0FBSUEsQ0FQQSxFQU9tQixFQUFkLElBQWMsQ0FBbkI7Q0FDRyxDQUE4QixDQUFuQixJQUFBLEVBQVo7Q0FBeUMsQ0FBRCxTQUFGO0NBQTFCLEVBQWU7Q0FEVjs7QUFHbkIsQ0FWQSxFQVVpQixFQUFaLEdBQUwsQ0FBaUI7Q0FDZixLQUFBO1NBQUE7O0NBQUM7Q0FBQTtVQUFBLG9DQUFBO29CQUFBO0NBQUE7Q0FBQTs7Q0FBRDtDQURlOztBQUdqQixDQWJBLEVBYWtCLEVBQWIsSUFBTDtDQUNHLENBQThCLENBQW5CLElBQUEsRUFBWjtDQUNFLENBQUEsRUFBQSxFQUFBLEtBQUE7Q0FEVSxFQUFlO0NBRFg7O0FBSWxCLENBakJBLEVBaUJnQixFQUFYLEVBQUwsRUFBZ0I7Q0FDZCxLQUFBLHFCQUFBO0NBQUM7Q0FBQTtRQUFBLHNDQUFBO2tCQUFBO0NBQUE7Q0FBQTttQkFEYTtDQUFBOztBQUdoQixDQXBCQSxFQW9CZSxFQUFWLENBQUwsR0FBZTtDQUNiLEtBQUEsMkJBQUE7Q0FBQSxDQUFBLEVBQTZDLENBQTdDLENBQUEsRUFBUTtDQUNSLENBQUEsRUFBRyxHQUFBLEVBQUg7Q0FDRSxFQUFPLENBQVAsQ0FBWSxJQUFMO0NBQVAsRUFDUSxDQUFSLENBQUEsS0FBUTtDQURSLEVBRUEsQ0FBQTs7QUFBTyxDQUFBO1lBQUEsNENBQUE7MkJBQUE7Q0FBQSxFQUFDLENBQVEsRUFBTjtDQUFIOztDQUFELENBQUEsRUFBQTtDQUNOLEVBQU8sQ0FBUCxDQUFjLEdBQUEsRUFBQTtDQUNKLENBQWdCLENBQXhCLENBQUEsR0FBTyxFQUFQLElBQUE7TUFMSjtJQUZhO0NBQUE7O0FBU2YsQ0E3QkEsRUE2QmEsQ0FBYixDQUFLLElBQVM7Q0FDWixLQUFBLHdFQUFBO0NBQUEsQ0FBQSxDQUFXLEVBQUssR0FBaEIsRUFBVztDQUFYLENBQ0EsQ0FBVyxFQUFLLEdBQWhCO0NBREEsQ0FFQSxDQUFVLEVBQUssRUFBZixFQUFVO0NBRlYsQ0FHQSxDQUFVLEVBQUssRUFBZjtBQUVZLENBQVosQ0FBQSxDQUFBLENBQVcsQ0FBMkMsR0FBbEM7Q0FBcEIsU0FBQTtJQUxBO0NBQUEsQ0FPQSxDQUFXLElBQUEsQ0FBWDtBQUVBLENBQUEsTUFBQSxvREFBQTswQkFBQTtDQUNFLEVBQXdCLENBQXhCLENBQWUsR0FBUztDQUN0QixDQUFNLENBQU4sR0FBQSxDQUFNO0NBQ04sRUFBQSxDQUFnQixFQUFoQjtDQUFBLEVBQUcsR0FBSCxFQUFBO1FBREE7Q0FBQSxDQUVzQixDQUFRLENBQTFCLEVBQUosQ0FBOEIsQ0FBOUIsRUFBQSxDQUFBO01BSEY7Q0FBQSxDQUlXLENBQUEsQ0FBWCxHQUFXLENBQVg7Q0FMRixFQVRBO0NBQUEsQ0FnQkEsSUFBQSxDQUFBLENBQVE7Q0FoQlIsQ0FrQkEsQ0FBQSxDQUFXLEVBQUwsQ0FBSztDQUNGLEdBQW9DLENBQTdDLEdBQVEsQ0FBUjtDQXBCVzs7QUFzQmIsQ0FuREEsRUFtRGMsRUFBVCxJQUFTO0NBQ1osS0FBQSxpRUFBQTtDQUFBLENBQUEsR0FBSyxDQUFMO0NBQUEsQ0FDQSxDQUFnQixFQUFLLEdBQUwsS0FBaEI7Q0FEQSxDQUVBLENBQWUsRUFBSyxFQUFMLEtBQWY7Q0FGQSxDQUdBLENBQVcsRUFBSyxHQUFoQixFQUFXO0FBQ1gsQ0FBQTtRQUFBLHdEQUFBO2tDQUFBO0VBQXVDLEVBQUEsR0FBQSxDQUFBLE9BQWU7Q0FDcEQsQ0FBQSxFQUFxRSxDQUFXLENBQWhGLENBQXFFO0NBQXJFLENBQXlCLENBQWEsQ0FBbEMsR0FBSixDQUFBLEVBQUEsRUFBc0M7TUFBdEMsRUFBQTtDQUFBOztNQURGO0NBQUE7bUJBTFk7Q0FBQTs7OztBQ25EZCxJQUFBLG9IQUFBOztBQUFBLENBQUEsRUFBSSxJQUFBLEtBQUE7O0FBRUosQ0FGQSxFQUVPLENBQVAsR0FBTyxRQUFBOztBQUNQLENBSEEsRUFHTyxDQUFQLEdBQU8sUUFBQTs7QUFDUCxDQUpBLEVBSVEsRUFBUixFQUFRLFNBQUE7O0FBQ1IsQ0FMQSxFQUtXLElBQUEsQ0FBWCxXQUFXOztBQUNYLENBTkEsRUFNZSxJQUFBLEtBQWYsV0FBZTs7QUFFZixDQVJBLENBQUEsQ0FRaUIsR0FBWCxDQUFOLElBQWlCOztBQUVqQixDQVZBLEVBVXVCLENBQUEsS0FBQyxXQUF4QjtDQUNFLEdBQUEsRUFBQTtDQUFBLENBQUEsQ0FBVSxDQUFQLFFBQW9CO0NBQ2hCLEdBQUQsQ0FBSixNQUFBO0lBREYsRUFBQTtDQUFBLFVBR0U7SUFKbUI7Q0FBQTs7QUFNdkIsQ0FoQkEsRUFnQmUsQ0FBQSxRQUFmO0NBQ0UsS0FBQSxtRkFBQTtDQUFBLENBRGUsVUFDZjtDQUFBLENBQUMsQ0FBRCxDQUFBO0NBRUEsQ0FBQSxFQUFHO0NBQ0QsQ0FBQSxDQUFlLENBQWYsUUFBQTtJQURGLEVBQUE7Q0FHRSxFQUFPLENBQVAsQ0FBTyxPQUFZO0lBTHJCO0NBT0EsQ0FBQSxFQUFlLENBQU0sQ0FBckI7Q0FBQSxFQUFPLENBQVA7SUFQQTtDQVNBLENBQUEsRUFBRyxRQUFIO0NBQ0UsR0FBQSxDQUFXLEVBQVg7Q0FDRSxFQUFlLENBQVosRUFBSCxHQUFHLE1BQWdELEtBQXBDO0NBQ2IsQ0FBOEIsS0FBdkIsRUFBQSxDQUFBLEtBQUE7TUFEVCxFQUFBO0NBR0UsWUFBTyxFQUFBO1FBSlg7TUFBQTtDQU1FLEdBQUcsQ0FBUSxDQUFYLEVBQUE7Q0FDRSxFQUFBLENBQU8sR0FBUCxDQUFBO01BREYsRUFBQTtDQUdFLEVBQUEsQ0FBTyxHQUFQLENBQUEsQ0FBTztRQVRYO01BREY7SUFBQSxFQUFBO0NBWUUsRUFBQSxDQUFBLEdBQUE7SUFyQkY7Q0F1QkMsR0FBRCxLQUFBO0NBQ0UsQ0FBTSxFQUFOLENBQUE7Q0FBQSxDQUNVLEVBQVYsRUFEQSxFQUNBO0NBREEsQ0FFSyxDQUFMLENBQUEsTUFBWSxDQUFTO0NBRnJCLENBR1MsQ0FBQSxDQUFULEdBQUEsRUFBVTtDQUNSLEVBQUEsQ0FBb0MsRUFBcEM7Q0FBQSxDQUE0QixDQUFyQixDQUFQLEVBQU8sRUFBUDtRQUFBO0NBQ0EsQ0FBdUIsRUFBaEIsTUFBQSxHQUFBO0NBTFQsSUFHUztDQUhULENBTU8sQ0FBQSxDQUFQLENBQUEsSUFBUTtDQUNOLEtBQUEsSUFBQTtDQUFBLEVBQU8sQ0FBSixDQUFlLENBQWxCO0NBQ0UsQ0FBa0MsQ0FBbEMsQ0FBSSxFQUFKLEVBQUEsZUFBQTtDQUFBLEVBRUUsR0FERixFQUFBO0NBQ0UsQ0FBUyxDQUFFLEdBQUYsQ0FBVCxHQUFBO0NBQUEsQ0FDUyxLQUFULEdBQUE7YUFDRTtDQUFBLENBQVEsSUFBUixLQUFBLEdBQUE7Q0FBQSxDQUNNLEVBQU4sVUFBQTtDQURBLENBRVMsQ0FBTSxHQUFmLENBQVMsS0FGVCxFQUVBO2NBSE87WUFEVDtDQUZGLFNBQUE7Q0FRQSxDQUEwQixJQUFuQixDQUFBLEdBQUEsS0FBQTtRQVRUO0NBVUEsRUFBeUIsQ0FBdEIsRUFBSCxNQUFlO0NBQ0MsV0FBZCxHQUFBO0NBQWMsQ0FBQyxRQUFBLEtBQUQ7Q0FBQSxDQUFrQixRQUFBO0NBQWxCLENBQThCLFFBQUEsR0FBOUI7Q0FBQSxDQUE2QyxRQUFBLEVBQTdDO0NBRGhCLFNBQ0U7TUFERixFQUFBO0NBR0UsWUFBQSxFQUFBO1FBZEc7Q0FOUCxJQU1PO0NBL0JJLEdBd0JiO0NBeEJhOztBQStDZixDQS9EQSxFQStEQSxDQUFrQixPQUFQO0NBRVQsS0FBQSwrQ0FBQTtDQUFBLENBRmtCLGFBRWxCO0FBQU8sQ0FBUCxDQUFBLEVBQUEsV0FBc0I7Q0FDcEIsRUFBZSxDQUFmLEtBQUcsTUFBZ0QsS0FBcEM7Q0FDYixFQUFBLENBQThELEVBQTlELFNBQTZFO0NBQTdFLENBQWlELENBQXJDLEdBQUEsRUFBWixDQUFBLE1BQTJDO1FBQTNDO0NBQ0EsQ0FBOEIsS0FBdkIsRUFBQSxDQUFBLEdBQUE7TUFIWDtJQUFBO0FBS3NDLENBQXRDLENBQUEsRUFBQSxFQUFBLENBQXlELElBQVI7Q0FBakQsRUFBc0IsQ0FBdEIsRUFBc0IsQ0FBdEIsSUFBVztJQUxYO0NBUUUsUUFERixHQUFBO0NBQ0UsQ0FBaUIsRUFBakIsV0FBQTtDQUFBLENBQ1ksRUFBWixNQUFBO0NBREEsQ0FFZSxFQUFmLFNBQUE7Q0FGQSxDQUdjLEVBQWQsQ0FBYyxFQUFBLElBQW1CLENBQWpDO0NBYmMsR0FTaEI7Q0FUZ0I7O0FBZ0JsQixDQS9FQSxDQUFBLENBK0VzQixJQUF0QixJQUFXOztBQUVYLENBakZBLENBaUY0QixDQUFkLEdBQUEsR0FBQyxFQUFmO0NBQ0UsS0FBQSxJQUFBO0NBQUEsQ0FBQSxDQUFPLENBQVAsT0FBdUMsU0FBaEM7Q0FDUCxDQUFBLEVBQXFDLENBQWUsQ0FBVCxFQUEzQztDQUFBLEVBQU8sQ0FBUDtDQUFPLENBQVEsRUFBVyxDQUFsQixDQUFBO0NBQVIsS0FBQTtJQURBO0NBQUEsQ0FFQSxDQUFTLENBQUEsRUFBQSxLQUFXO0NBQ3BCLENBQUEsRUFBeUIsZ0JBQXpCO0NBQUEsQ0FBQSxDQUFlLENBQWYsR0FBQTtJQUhBO0NBSUEsQ0FBQSxFQUFHLDJCQUFIO0NBQ0UsRUFBZSxDQUFmLEVBQWUsQ0FBZjtDQUFtQyxDQUFRLElBQVA7Q0FBRCxDQUFzQixFQUF0QixFQUFlO0NBQWxELEtBQWU7QUFDZixDQURBLEdBQ0EsRUFBQTtJQU5GO0NBQUEsQ0FPQSxDQUFlLENBQVgsRUFBVyxDQUFmO0NBUEEsQ0FRQSxDQUFhLENBQVQsQ0FBSixFQUFhLEVBQWlDLEVBQWpDO0NBQW9DLEdBQUEsRUFBQSxLQUFBO0NBQXBDLEVBQWlDO0NBUjlDLENBU0EsQ0FBaUMsQ0FBcEIsS0FBb0IsRUFBVCxDQUFYO0NBQ0EsQ0FBOEIsRUFBOUIsRUFBYixHQUFBLENBQWEsQ0FBVyxDQUF4QjtDQVhZOztBQWFkLENBOUZBLENBOEY2QixDQUFkLEdBQUEsR0FBQyxFQUFELENBQWY7Q0FDRyxHQUFELEtBQUE7Q0FDRSxDQUFNLEVBQU4sQ0FBQTtDQUFBLENBQ00sQ0FBTixDQUFBLElBQU0sQ0FETixFQUN3QjtDQUR4QixDQUdFLEVBREY7Q0FDRSxDQUFVLEVBQUksRUFBZCxFQUFBLENBQVU7TUFIWjtDQUFBLENBSVMsQ0FBQSxDQUFULEdBQUEsRUFBUztDQUNQLENBQTJDLEVBQTlCLEVBQWIsSUFBYSxDQUFXLENBQXhCO0NBQ0EsR0FBRyxDQUFlLENBQWxCO0NBQ0UsR0FBd0IsSUFBeEIsRUFBQSxDQUFtQyxDQUF2QjtDQUNOLElBQUQsVUFBTDtRQUpLO0NBSlQsSUFJUztDQUpULENBU08sQ0FBQSxDQUFQLENBQUEsSUFBUTtDQUNELENBQTJDLENBQWhELENBQUksU0FBSix3QkFBQTtDQVZGLElBU087Q0FYSSxHQUNiO0NBRGE7O0FBY2YsQ0E1R0EsQ0E0R2dDLENBQWhDLEdBQWtCLEdBQUMsRUFBUjtDQUVULEtBQUEsNEJBQUE7Q0FBQSxDQUFBLENBQWMsTUFBQSxFQUFkO0NBQ0UsR0FBQSxJQUFBO0NBQUEsRUFBYyxDQUFQLEVBQU8sS0FBVyxDQUFsQjtDQUFQLE9BQUEsR0FDTztDQURQLE1BQUEsSUFDaUI7Q0FEakIsS0FBQSxLQUMwQjtDQUQxQixjQUNzQztDQUR0QyxHQUFBLElBRWUsR0FBUjtDQUZQLGNBRTBCO0NBRjFCO0NBQUEsY0FHTztDQUhQLElBRFk7Q0FBZCxFQUFjO0NBQWQsQ0FPQSxDQUFjLFFBQWQ7Q0FBYyxDQUNOLEVBQU4sQ0FBTSxDQUFBLEtBQVc7Q0FETCxDQUVQLENBQUwsQ0FBQSxDQUFLLENBQUEsS0FBVztDQUZKLENBR04sRUFBTixPQUFNO0NBSE0sQ0FJTCxFQUFQLENBQUEsRUFBTyxDQUFBLEdBQVc7Q0FYcEIsR0FBQTtDQUFBLENBYUEsQ0FBVyxDQWJYLElBYUEsR0FBc0I7Q0FidEIsQ0FjQSxDQUFBLENBQUksRUFBSixLQUFBLE1BQUE7Q0FHQSxDQUFBLEVBQUcsV0FBQTtDQUNELEdBQUEsb0JBQUE7Q0FDRSxFQUFBLENBQUksRUFBSixXQUFBO0FBQ08sQ0FBRCxHQUFBLENBRlIsQ0FBQSxLQUVvQjtDQUNsQixFQUFBLENBQUksRUFBSixXQUFBO0NBQUEsRUFDYyxDQUFkLEVBQUEsRUFBYztNQUxsQjtJQWpCQTtDQUFBLENBNkJBLENBQWMsQ0FBZCxFQUFNLENBQVE7Q0FDZCxDQUFBLEVBQXNCLENBQWUsQ0FBVCxFQUE1QjtBQUFBLENBQUEsR0FBQSxFQUFBO0lBOUJBO0NBaUNBLENBQUEsRUFBRyxJQUFIO0NBRUUsQ0FBdUMsRUFBdkMsQ0FBQSxHQUFBLEdBQVcsR0FBWDtDQUFBLENBQ3NDLENBQXRDLENBQUEsRUFBQSxLQUFXO0NBRFgsQ0FFeUIsRUFBekIsRUFBQSxLQUFXO0NBRlgsR0FHQSxJQUFBLEdBQVc7Q0FIWCxHQUlBLENBQUssQ0FBTDtDQUNBLEdBQUEsQ0FBa0IsQ0FBVDtDQUVQLEVBQWMsQ0FBZCxFQUFBLEVBQUE7Q0FBQSxDQUVFLEVBRFcsRUFBYixJQUFhLENBQVcsQ0FBeEI7Q0FDRSxDQUFNLEVBQU4sRUFBQSxFQUFBO0NBQUEsQ0FDTSxFQUFOLElBQUE7Q0FEQSxDQUVNLEVBQU4sRUFBWSxFQUFaO0NBSkYsT0FDQTtNQVZKO0lBakNBO0NBaURBLENBQUEsRUFBRyxDQUE4QyxFQUFqRCxJQUF3QyxJQUFyQztDQUNELENBQXlCLEVBQXpCLEVBQUEsS0FBQTtDQUNZLE1BQVosQ0FBQSxHQUFBO0lBRkYsRUFBQTtDQUllLENBQWEsSUFBMUIsS0FBQSxDQUFBO0lBdkRjO0NBQUE7Ozs7QUM1R2xCLElBQUEseU1BQUE7R0FBQSxlQUFBOztBQUFBLENBQUEsRUFBSSxJQUFBLEtBQUE7O0FBRUosQ0FGQSxFQUVPLENBQVAsR0FBTyxRQUFBOztBQUNQLENBSEEsRUFHYyxJQUFBLElBQWQsV0FBYzs7QUFDZCxDQUpBLEVBSVMsR0FBVCxDQUFTLFVBQUE7O0FBQ1QsQ0FMQSxFQUtRLEVBQVIsRUFBUSxTQUFBOztBQUNSLENBTkEsRUFNZSxJQUFBLEtBQWYsV0FBZTs7QUFDZixDQVBBLEVBT2UsSUFBQSxLQUFmLFdBQWU7O0FBQ2YsQ0FSQSxFQVFPLENBQVAsR0FBTyxRQUFBOztBQUVQLENBVkEsQ0FVdUIsQ0FBTixNQUFDLEtBQWxCO0NBQ0UsS0FBQSwyS0FBQTtDQUFBLENBQUEsQ0FBYyxDQUFkLE9BQUE7Q0FBQSxDQUVBLENBQU8sQ0FBUCxHQUFPLElBQUE7Q0FGUCxDQUdBLENBQWtCLENBQUEsR0FBQSxNQUFBLEVBQWxCO0NBSEEsQ0FJQSxDQUFvQixDQUFBLE9BQVcsRUFBWCxJQUFwQjtDQUpBLENBS0EsQ0FBYSxDQUFBLEVBQUEsSUFBYixPQUE4QjtDQUw5QixDQU9BLENBQXlCLElBQUEsSUFBVyxFQUFYLFNBQXpCO0NBUEEsQ0FRQSxDQUFTLEdBQVQsR0FBVTtDQUFTLEVBQVksQ0FBTixDQUFrQixNQUF4QjtDQVJuQixFQVFTO0FBRVksQ0FWckIsQ0FVQSxDQUFpQixDQUF5QixFQUFBLFFBQTFDLEdBQWlCLEtBQXlCO0FBQ3ZCLENBWG5CLENBV0EsQ0FBZSxDQUF1QixFQUFBLE1BQXRDLEVBQWUsQ0FBdUIsRUFBQTtBQUNyQixDQVpqQixDQVlBLENBQWEsQ0FBdUIsRUFBQSxJQUFwQyxJQUFhLENBQXVCLE9BQUE7Q0FFcEMsQ0FBQSxFQUFHLFFBQUg7Q0FDRSxHQUFBLENBQ2tDLEVBRC9CLENBQUEsU0FBaUIsS0FDb0M7Q0FHcEQsV0FBQTtNQUxOO0lBZEE7Q0FBQSxDQXFCQSxDQUFZLENBQ0YsQ0FBUixDQURGLEVBQ1UsQ0FBd0IsS0FEekI7Q0FDc0MsR0FBQSxDQUFBLElBQUEsRUFBQTtDQUFyQyxDQUNSLENBRCtCO0NBQy9CLENBQU8sRUFBTixFQUFEO0NBQUEsQ0FBc0IsRUFBUCxDQUFBO0NBRlIsQ0FJZSxDQURoQixDQUZOLE9BR0EsQ0FKTyxLQUlnQztDQUN2QyxDQUFPLEVBQU4sSUFBRDtDQUxPLENBT3lCLENBRDFCLENBRk4sRUFLQSxDQURnQixHQVJULENBT0ksRUFBWCxFQUFBO0NBR0EsQ0FBTyxFQUFOLENBQUQ7Q0FBQSxDQUFvQixFQUFOO0NBQWQsRUFBaUMsQ0FBUCxDQUFBLENBQWE7Q0FWaEMsRUFBQSxDQU9QLEVBNUJGO0NBQUEsQ0FnQ0EsQ0FBWSxDQUFJLEVBQVY7Q0FDTSxDQUFxQixDQUFqQyxHQUFBLEdBQUEsRUFBVyxJQUFYO0NBbENlOztBQW9DakIsQ0E5Q0EsRUE4Q2UsRUFBQSxJQUFDLEdBQWhCO0NBQ0UsS0FBQTtDQUFBLENBQUEsQ0FBUyxDQUFBLENBQUssQ0FBZCxFQUFTO0NBQ0YsS0FBRCxFQUFOLENBQUE7Q0FBZ0IsQ0FBYSxFQUFiLE9BQUEsR0FBQTtDQUE0QixDQUE1QyxFQUFBLFFBQUEsRUFBQTtDQUZhOztBQUtmLENBbkRBLEVBbURnQixFQUFBLElBQUMsSUFBakI7Q0FDUSxDQUFtQyxDQUFBLENBQXpDLENBQUssRUFBTCxFQUFBLEtBQUE7Q0FDRSxHQUFBLENBQWUsRUFBTCxDQUFBO0NBQVYsV0FBQTtNQUFBO0NBQUEsRUFDRyxDQUFILFVBQUE7Q0FDYyxJQUFkLE1BQUEsRUFBQTtDQUhGLEVBQXlDO0NBRDNCOztBQU1oQixDQXpEQSxFQXlEZ0IsRUFBQSxJQUFDLElBQWpCO0NBQ0UsS0FBQSxrQ0FBQTtDQUFBLENBQUEsQ0FDRSxDQURGO0NBQ0UsQ0FBTSxFQUFOLEtBQUE7Q0FBQSxDQUNBLEVBQUEsT0FBSTtDQUZOLEdBQUE7Q0FBQSxDQUdBLENBQWMsTUFBQSxFQUFkO0NBQTJCLENBQU8sRUFBUCxHQUFBLE9BQUE7Q0FBc0IsQ0FBYSxFQUFoRCxFQUFBLEdBQUE7Q0FIZCxDQUlBLEVBQUEsQ0FBQSxNQUFXLEVBQVg7Q0FKQSxDQUtBLEVBQUEsQ0FBSyxDQUFMLEVBQUEsR0FBQTtDQUxBLENBTUEsRUFBTSxFQUFBLEtBQU47Q0FOQSxDQU9BLENBQWdCLENBQUEsR0FBQSxJQUFXLEVBQTNCO0NBUEEsQ0FRQSxDQUFTLENBQUksRUFBYixDQUFTLE1BQUE7Q0FDRyxDQUFXLENBQXZCLEVBQUEsSUFBQSxFQUFXO0NBQVksQ0FBTyxFQUFOO0NBQUQsQ0FBYSxFQUFBO0NBQWIsQ0FBZ0MsRUFBTixDQUExQjtDQUFBLEVBQThDLENBQVAsQ0FBQSxDQUFhO0NBVjdELEdBVWQ7Q0FWYzs7QUFZaEIsQ0FyRUEsRUFxRWtCLENBQUEsV0FBbEI7Q0FDRSxLQUFBLGlDQUFBO0NBQUEsQ0FEa0IsU0FDbEI7Q0FBQSxDQUFBLEVBQXdDLEVBQXhDO0NBQUEsRUFBZSxDQUFmLEVBQVksQ0FBWixFQUFBO0lBQUE7Q0FDc0gsRUFBdkcsQ0FBc0csQ0FBbEgsRUFBQSxFQUFBLEVBQUEsR0FBQSxDQUFBLENBQUEsNEJBQUE7Q0FGYTs7QUFJbEIsQ0F6RUEsQ0F5RXVCLENBQVYsQ0FBQSxDQUFBLEVBQUEsRUFBQyxDQUFkO0NBQ0UsS0FBQSxxREFBQTtDQUFBLENBQUEsQ0FBTyxDQUFQLENBQVksQ0FBTDtDQUFQLENBQ0EsQ0FBZSxDQUFVLENBQVEsQ0FEakMsQ0FDZSxDQUFBLElBQWYsRUFBZTtDQURmLENBRUEsQ0FBUyxHQUFUO0NBRkEsQ0FJQSxDQUFjLENBQUksQ0FBSixDQUFBLEVBQWQsVUFBVztDQUpYLENBTUEsQ0FBZ0IsT0FBaEIsRUFBYSxHQUNYO0NBQ0UsQ0FBUyxFQUFULEdBQUE7Q0FBQSxDQUNjLENBQUcsQ0FBakIsSUFEQSxHQUNBLGFBQWM7Q0FEZCxDQUVjLENBQVEsQ0FBdEIsS0FBYyxFQUFkLEdBRkE7Q0FBQSxDQUdNLEVBQU47Q0FMUyxFQU9YLENBTkEsV0FNQTtDQUNFLENBQVMsRUFBVCxHQUFBLENBQWlCO0NBQWpCLENBQ2MsQ0FBdUIsQ0FBckMsSUFEQSxHQUNBLGFBQWM7Q0FEZCxDQUVhLEVBQWIsT0FBQSxHQUZBO0NBQUEsQ0FHTSxFQUFOO0NBakJKLEdBYUU7Q0FiRixDQW1CQSxJQUFBLENBQU8sR0FBUDtBQUVPLENBQVAsQ0FBQSxFQUFBLFFBQUE7Q0FDRSxDQUFnQixDQUFhLENBQTdCLENBQUEsSUFBOEIsSUFBOUI7Q0FDUyxDQUFlLENBQXRCLEdBQU0sQ0FBZ0IsRUFBdEIsSUFBQTtDQUNVLEtBQVIsQ0FBTyxRQUFQO0NBREYsTUFBc0I7Q0FEeEIsSUFBNkI7SUF0Qi9CO0NBMEJBLENBQUEsRUFBRyxDQUFLLENBQUw7Q0FDRCxFQUFBLENBQUEsRUFBTSxDQUFZO0NBQWxCLEVBQ08sQ0FBUCxHQUFvQjtDQURwQixDQUVtQyxDQUFuQyxDQUFBLENBQUssRUFBTCxDQUFBO0NBQ1EsRUFFTCxDQUFrQixFQUZyQixDQUFPLEdBRVUsQ0FGakIsQ0FFRyxRQUZZLHFCQUFLO0lBL0JYO0NBQUE7O0FBdUNiLENBaEhBLEVBZ0hZLENBQUksQ0FBYSxJQUE3QjtDQUNFLEtBQUEsNkhBQUE7Q0FBQSxDQUFBLENBQU8sQ0FBUCxDQUFZLENBQUw7Q0FBUCxDQUNBLENBQU8sQ0FBUCxDQUFZLENBQUwsRUFBcUM7Q0FDNUMsQ0FBQSxFQUErQixDQUFTLENBQVQsRUFBL0I7Q0FBQSxFQUFPLENBQVAsRUFBYSxFQUFTO0lBRnRCO0NBQUEsQ0FHQSxDQUFPLENBQVAsQ0FBTyxDQUFBO0NBQ1AsQ0FBQSxFQUFHLHNFQUFBLGFBQUg7Q0FDRSxFQUFVLENBQVYsQ0FBVSxFQUFWO0NBQUEsRUFDTyxDQUFQO0NBQU8sQ0FBTyxHQUFOLENBQUE7Q0FBRCxDQUFnQixFQUFMLEVBQUE7Q0FBWCxDQUEwQixHQUFOLENBQUE7Q0FEM0IsS0FBQTtDQUdBO0NBQUEsUUFBQSxVQUFBO2dDQUFBO0NBQ0UsR0FBRyxDQUFjLENBQWpCLElBQUcsWUFBSDtDQUNFO0NBQUEsWUFBQSwrQkFBQTs0QkFBQTtDQUNFLEdBQUcsQ0FBYSxLQUFoQjtDQUNFLEVBQUEsQ0FBYSxDQUFQLEVBQUEsS0FBTjtDQUFBLEVBR0csQ0FBSCxRQUFBO0NBQVMsQ0FBQyxRQUFELElBQUM7Q0FBRCxDQUFhLEVBQWIsVUFBYTtDQUh0QixhQUdBO1lBTEo7Q0FBQSxRQURGO1FBREY7Q0FBQSxJQUhBO0NBQUEsQ0FBQSxDQVdRLENBQVIsQ0FBQTtBQUVBLENBQUEsUUFBQSxLQUFBOzBCQUFBO0FBQ2tCLENBQWhCLEVBQW1CLENBQW5CLEVBQUE7Q0FBQSxnQkFBQTtRQUFBO0NBQUEsQ0FDWSxDQUFULENBQUgsRUFBQSxHQUFVO0NBQ1AsRUFBYSxDQUFSLFdBQU47Q0FERixNQUFTO0NBRFQsSUFHQSxDQUFBOztBQUFRLENBQUE7R0FBQSxXQUFBLHNDQUFBO0NBQ04sQ0FEVyxFQUNYO0NBQUEsR0FBUyxNQUFUO0NBQUEsaUJBQUE7WUFBQTtDQUFBLEVBRUssQ0FERixNQUFBLElBQUEsSUFBQSxZQUFBLFFBQUE7Q0FGRzs7Q0FIUjtDQUFBLENBV1csQ0FBRSxDQUFiLENBQUssQ0FBTCxFQUFhO0NBWmYsSUFiQTtDQTBCQSxHQUFBLENBQUE7Q0FBTSxFQUEyQixDQUFqQyxDQUFLLENBQUwsRUFBQSxLQUFBO01BM0JGO0lBTDJCO0NBQUE7O0FBa0M3QixDQWxKQSxDQWtKc0MsQ0FBVixFQUFBLEdBQUEsQ0FBQyxnQkFBN0I7Q0FDRSxLQUFBLHNJQUFBO0NBQUEsQ0FBQSxDQUFPLENBQVAsRUFBTyxFQUFBLENBQVM7Q0FBaEIsQ0FDQSxFQUFBLENBQUssQ0FBTDtDQURBLENBRUEsQ0FBTyxDQUFQLENBQVk7Q0FGWixDQUdBLENBQU8sQ0FBUCxDQUFZLENBQUw7Q0FIUCxDQUtBLENBQVUsR0FBQSxDQUFWO0NBQ0EsQ0FBQSxFQUFxQixRQUFyQjtDQUFBLEdBQUEsR0FBTztJQU5QO0NBQUEsQ0FPQSxDQUFhLENBQUEsS0FBQyxDQUFkO0FBQTBELENBQW5DLENBQXNELEVBQXRELEdBQW1DLE9BQWQ7Q0FBYixHQUFSLEdBQU8sTUFBUDtNQUFWO0NBUGIsRUFPYTtDQUNiO0NBQUEsTUFBQSxvQ0FBQTt1QkFBQTtDQUFBLEdBQUEsRUFBaUIsSUFBakI7Q0FBQSxFQVJBO0NBQUEsQ0FVQSxDQUF5QixDQUFyQixHQVZKLFVBVUE7Q0FWQSxDQVlBLEdBQUs7Q0FaTCxDQWFBLENBQStDLElBQUEsQ0FBQSxDQUFBO0NBQzdDLElBQUEsR0FBQSxDQUFBLEVBQUE7Q0FENkMsQ0FBOUMsQ0FBb0c7Q0FickcsQ0FnQkEsRUFBQSxDQUFBLEVBQUEsR0FBQTtDQWhCQSxDQWtCQSxDQUFXLEtBQVgsQ0FBWTtDQUNWLE9BQUEsR0FBQTtDQUFBLEdBQUEsQ0FBeUIsQ0FBekI7Q0FBQSxXQUFBO01BQUE7Q0FBQSxFQUNPLENBQVAsQ0FBa0I7Q0FDbEIsRUFBRyxDQUFIO0NBQ0UsQ0FBYSxDQUFMLENBQTJCLENBQW5DLENBQUEsU0FBYSxLQUFBO0NBQWIsSUFDQSxDQUFBO0NBQ08sQ0FBVSxDQUFNLENBQWpCLENBQU4sQ0FBTSxHQUFpQixJQUF2QjtDQUFtQyxFQUFFLEtBQVgsT0FBQTtDQUExQixNQUF1QjtNQUh6QjtDQUtFLEVBQW9FLEdBQXBFLE9BQWMsdUNBQUs7Q0FDVixFQUFFLEtBQVgsS0FBQTtNQVRPO0NBbEJYLEVBa0JXO0NBbEJYLENBNEJBLE1BQUE7Q0FFQTtDQUFBLE1BQUEsdUNBQUE7d0JBQUE7Q0FDRSxDQUF1QixFQUF2QixFQUFBLEVBQUEsSUFBQTtDQURGLEVBOUJBO0NBQUEsQ0FpQ0EsR0FBQSxJQUFBO0NBakNBLENBbUNBLENBRXdELENBQUksQ0FDTSxDQUhsRSxDQUVxRSxDQUY3RCxNQUFSLCtEQUFtQiwwQkFBQTtDQU9YLEVBRXFCLENBRlgsRUFBbEIsQ0FBTyxDQUdnQixDQUh2QixDQUFrQixDQUUrQixJQUYvQixnQ0FBQSx1RkFBQTtDQTNDUTs7QUFrRDVCLENBcE1BLENBb011QixDQUFOLENBQWIsQ0FBYSxJQUFqQjtDQUVFLENBQUEsRUFBRyxDQUFhLEVBQWhCLEVBQUc7Q0FDRCxHQUFBLENBQUssRUFBTCxDQUFBO0lBREYsRUFBQSxHQUFBO0NBR0UsR0FBQSxDQUFxQyxDQUFNLEVBQVMsQ0FBNUI7Q0FBeEIsRUFBWSxHQUFaLEVBQUEsQ0FBQTtNQUFBO0NBQ0EsR0FBQSxDQUE4QyxDQUFkLEVBQWhDLENBQWdDO0NBQWhDLElBQUssQ0FBTCxFQUFBO01BREE7Q0FBQSxDQUVtQixFQUFuQixDQUFLLENBQUwsR0FBQTtJQUxGO0NBTUEsQ0FBQSxFQUFHLGVBQUg7Q0FDRSxHQUFBLENBQUssR0FBTDtJQVBGO0NBQUEsQ0FVQSxFQUFBLENBQUEsSUFBQSxnQkFBQTtDQVZBLENBWUEsR0FBSyxDQUFMO0NBWkEsQ0FjQSxHQUFBLE9BQUE7Q0FkQSxDQWVBLEdBQUEsUUFBQTtDQWpCZSxRQWtCZjtDQWxCZTs7QUFxQmpCLENBek5BLEVBeU5pQixDQUFjLEVBQXpCLENBQU4sRUFBMEM7Q0FDeEMsS0FBQSxpRkFBQTtDQUFBLENBQUEsQ0FBUSxDQUFBLENBQVI7Q0FBQSxDQUVBLEVBQWMsQ0FBSyxDQUFMLENBQUE7Q0FGZCxDQUdBLENBQWtCLFlBQWxCO0NBQWtCLENBQ1YsRUFBTjtDQURnQixDQUVYLENBQUwsQ0FBQTtDQUZnQixDQUdWLEVBQU4sQ0FBVyxDQUFMO0NBTlIsR0FBQTtDQUFBLENBU0EsQ0FBa0IsTUFBQSxNQUFsQjtDQUNFLE9BQUEsb0RBQUE7Q0FBQSxFQUFRLENBQVIsQ0FBQSxPQUFhLEdBQUw7Q0FBUixFQUVFLENBREY7Q0FDRSxDQUFTLEdBQVQsQ0FBQSxDQUFBO0NBQUEsQ0FDUyxJQUFULENBQUE7U0FDRTtDQUFBLENBQU0sRUFBTixNQUFBLENBQU07Q0FBTixDQUNRLElBQVIsRUFEQSxFQUNBO0NBREEsQ0FFUSxJQUFSLElBQUEsb0JBRkE7Q0FBQSxDQUdTLEdBSFQsRUFHQSxHQUFBO1VBSk87UUFEVDtDQUZGLEtBQUE7Q0FBQSxFQVVFLENBREYsR0FBQTtDQUNFLENBQVEsSUFBUixLQUFBO0NBQUEsQ0FDTSxFQUFOLEVBQUEsS0FBTTtDQUROLENBRVEsSUFBUiw4Q0FGQTtDQVZGLEtBQUE7Q0FBQSxDQUFBLENBYU8sQ0FBUDtDQUNBO0NBQUEsUUFBQSxJQUFBOzBCQUFBO0NBQ0UsR0FBRyxFQUFILGNBQUE7Q0FDRSxDQUE4QixDQUFyQixDQUFBLEVBQVQsQ0FBUyxDQUFULENBQStCO0NBQ3hCLEdBQUQsQ0FBUyxZQUFiO0NBRE8sUUFBcUI7Q0FFOUIsR0FBRyxJQUFILE1BQUE7Q0FDRSxHQUFJLE1BQUo7Q0FDRSxDQUFRLElBQVIsS0FBQSxDQUFBO0NBQUEsQ0FDTSxFQUFOLE9BQU0sQ0FBTjtDQURBLENBRVEsRUFGUixFQUVBLE1BQUE7Q0FGQSxDQUdRLEVBSFIsRUFHQSxNQUFBO0NBSEEsQ0FJUyxFQUFnQixDQUFoQixDQUFNLENBQWYsS0FBQTtDQUpBLENBS1EsRUFBbUIsRUFBM0IsRUFBUSxJQUFSO0NBTkYsV0FBQTtVQUpKO1FBREY7Q0FBQSxJQWRBO0NBMEJBLEVBQWlCLENBQWpCLEVBQUc7Q0FDRCxHQUFJLENBQUosQ0FBQSxDQUF5QixFQUF6QixJQUF5QixDQUFUO0NBQWhCLEVBQ3FCLENBQWpCLENBQU8sQ0FBWCxnREFEQTtNQTNCRjtDQThCSyxDQUFpQixFQUFsQixDQUFKLENBQUEsQ0FBQSxDQUFBLENBQUEsRUFBQTtDQXhDRixFQVNrQjtDQVRsQixDQTBDQSxDQUFvQixDQUFBLEtBQUMsUUFBckI7Q0FDRSxPQUFBLGlEQUFBO0NBQUEsQ0FBdUIsRUFBdkIsRUFBYSxDQUFWLENBQVU7Q0FDWCxHQUFBLEVBQUEsRUFBc0MsSUFBMUIsSUFBWjtNQURGO0NBR0UsR0FBQSxFQUFBLE1BQVksSUFBWjtNQUhGO0NBSUE7Q0FBQSxRQUFBLG1DQUFBO3dCQUFBO0NBQ0UsR0FBMkMsRUFBM0MsV0FBQTtDQUFBLEdBQWtDLElBQWxDLElBQVksSUFBWjtRQURGO0NBQUEsSUFKQTtDQU1BO0NBQUE7VUFBQSxvQ0FBQTswQkFBQTtDQUNFLEdBQTZDLEVBQTdDLGFBQUE7Q0FBQSxHQUFBLEVBQW9DLE1BQXhCLElBQVo7TUFBQSxFQUFBO0NBQUE7UUFERjtDQUFBO3FCQVBrQjtDQTFDcEIsRUEwQ29CO0NBMUNwQixDQW9EQSxDQUFhLENBQUEsS0FBQyxDQUFkO0NBQ0UsQ0FBc0IsRUFBdEIsQ0FBQSxJQUFBO0NBQ21CLENBQU0sRUFBekIsS0FBQSxFQUFBLE1BQUE7Q0F0REYsRUFvRGE7Q0FJRCxFQUFaLE1BQUEsRUFBVztDQUNULENBQVksRUFBWixNQUFBO0NBQUEsQ0FDZSxFQUFmLFNBQUEsRUFEQTtDQUFBLENBRWlCLEVBQWpCLFdBQUE7Q0E1RHNDLEdBeUR4QztDQXpEd0M7Ozs7QUNuTjFDLElBQUEsRUFBQTs7QUFBQSxDQUFBLENBQW9CLENBQVgsQ0FBQSxFQUFULEVBQVMsQ0FBQztDQUNSLEtBQUEsZ0tBQUE7Q0FBQSxDQUFBLENBQVUsQ0FBSSxHQUFkO0NBQUEsQ0FDQSxDQUFXLENBQUksQ0FEZixHQUNBO0NBREEsQ0FFQSxDQUFXLEtBQVg7Q0FGQSxDQUdBLENBQWEsSUFBUSxHQUFyQix3QkFIQTtBQUlBLENBQUEsTUFBQSwwQ0FBQTttQ0FBQTtDQUNFLEVBQWMsQ0FBZCxJQUFzQixDQUFNLEVBQTVCO0NBQW9ELFFBQUQsSUFBVDtDQUE1QixJQUFhO0NBQzNCLEdBQUEsUUFBTztDQUFQLE9BQUEsR0FDTztDQUNILEdBQUcsSUFBSCx1QkFBQTtDQUNFLEVBQVcsQ0FBaUIsQ0FBNUIsR0FBQSxFQUFBLEVBQXVCO0NBQXZCLENBQUEsQ0FDVyxDQUFpQixDQUFqQixHQUFYLEVBQUEsRUFBdUI7VUFKN0I7Q0FDTztDQURQLElBQUEsTUFLTztBQUMwRCxDQUE3RCxFQUFpQixDQUFkLENBQWMsRUFBQSxDQUFqQixFQUFJLENBQXdCLENBQXFCO0NBQy9DLENBQTZCLENBQUYsQ0FBM0IsRUFBQSxFQUFRLEVBQVIsRUFBMkM7TUFEN0MsSUFBQTtDQUdFLEdBQUEsSUFBUSxFQUFSLEVBQTBCO1VBVGhDO0NBS087Q0FMUCxLQUFBLEtBVU87QUFDc0QsQ0FBekQsQ0FBZ0IsQ0FBQSxDQUFiLENBQXFELEVBQXhDLENBQWhCLENBQUksRUFBdUIsQ0FBcUI7Q0FDOUMsQ0FBMEIsRUFBMUIsRUFBQSxFQUFRLENBQVIsQ0FBQSxFQUF3QztNQUQxQyxJQUFBO0NBR0UsR0FBQSxJQUFRLEVBQVIsRUFBMEI7VUFkaEM7Q0FVTztDQVZQLEtBQUEsS0FlTztDQUNILENBQUEsQ0FBUSxFQUFSLEdBQUE7QUFDQSxDQUFBLFlBQUEsb0NBQUE7b0NBQUE7Q0FDRSxDQUFNLENBQWdCLEVBQWhCLElBQVMsQ0FBZjtDQURGLFFBREE7Q0FBQSxDQUFBLENBR1csS0FBWDtDQUNBO0NBQUEsWUFBQSxnQ0FBQTs2QkFBQTtDQUNFLEdBQWdDLE1BQWhDLFdBQUE7Q0FBQSxHQUFBLENBQW9CLENBQUEsRUFBWixJQUFSO1lBREY7Q0FBQSxRQXBCSjtDQWVPO0NBZlAsT0FBQSxHQXNCTztBQUN3RCxDQUEzRCxDQUFrQixDQUFBLENBQWYsQ0FBdUQsRUFBeEMsQ0FBbEIsR0FBSSxDQUE4QztDQUNoRCxDQUE0QixJQUE1QixFQUFRLEVBQVIsQ0FBQTtVQXhCTjtDQUFBLElBRkY7Q0FBQSxFQUpBO0NBZ0NBLFFBQU87Q0FBQSxDQUFRLEVBQVAsQ0FBQSxHQUFEO0NBQUEsQ0FBMkIsRUFBVCxHQUFBLEdBQWxCO0NBQUEsQ0FBOEMsRUFBUCxDQUFBLEdBQXZDO0NBakNBLEdBaUNQO0NBakNPOztBQW1DVCxDQW5DQSxFQW1DaUIsR0FBakIsQ0FBTzs7OztBQ3pDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzc0NBLElBQUE7O0FBQUEsQ0FBQSxFQUFPLENBQVAsR0FBTyxRQUFBOztBQUVQLENBRkEsQ0FFa0MsQ0FBakIsR0FBWCxDQUFOLEVBQWtCLEtBQUQ7Q0FDZixLQUFBLGlEQUFBO0NBQUEsQ0FBQSxDQUFjLElBQUEsSUFBZCxFQUFjLENBQWM7Q0FDNUIsQ0FBQSxFQUFrRSxDQUFlLENBQVQ7Q0FBeEUsQ0FBMkMsQ0FBcEMsQ0FBUCxFQUFpRCxRQUE1QixFQUFPO0lBRDVCO0NBQUEsQ0FFQSxDQUFjLENBRmQsRUFFb0IsS0FBcEI7Q0FDQSxDQUFBLEVBQTRELGVBQTVEO0NBQUEsRUFBZ0IsQ0FBaEIsRUFBK0MsS0FBL0MsTUFBa0I7SUFIbEI7Q0FBQSxDQUlBLENBQWdCLENBQUEsRUFBMkQsQ0FDdEQsQ0FETCxDQUFBLEVBQUEsRUFBaEIsTUFBZ0I7Q0FKaEIsQ0FTQSxDQUFXLEtBQVgsTUFBeUIsSUFBZDtDQUNYLENBQUEsQ0FBcUIsQ0FBbEIsRUFBQSxFQUFRO0NBQ1QsR0FBQSxJQUFBLElBQUEsQ0FBYTtJQURmLEVBQUE7Q0FHRSxHQUFBLElBQUEsS0FBYSxDQUFiO0lBYkY7Q0FjQSxDQUFBLEVBQUcsQ0FBZSxDQUFULGVBQVQ7Q0FFSyxDQUF5QixDQUQ1QixDQUM0QixFQUFhLENBRHpDLENBQzRCLEdBRDVCLEVBQ0UsRUFERixHQUFBO0lBaEJhO0NBQUE7Ozs7QUNGakIsSUFBQSx5R0FBQTtHQUFBLDBCQUFBOztBQUFBLENBQUEsRUFBSSxJQUFBLEtBQUE7O0FBRUosQ0FGQSxFQUVPLENBQVAsR0FBTyxRQUFBOztBQUNQLENBSEEsRUFHUyxHQUFULENBQVMsVUFBQTs7QUFDVCxDQUpBLEVBSU8sQ0FBUCxHQUFPLFFBQUE7O0FBQ1AsQ0FMQSxFQUtlLElBQUEsS0FBZixLQUFlOztBQUVmLENBUEEsQ0FBQSxDQU9pQixHQUFYLENBQU4sS0FBaUI7OztDQUdaLENBQUwsQ0FBcUIsQ0FBakI7RUFWSjs7QUFXQSxDQVhBLEVBV3FCLGVBQXJCOztBQUNBLENBWkEsRUFZb0IsQ0FacEIsYUFZQTs7QUFFQSxDQWRBLENBYzRCLENBQU4sQ0FBQSxLQUFDLEdBQUQsT0FBdEI7Q0FDRSxLQUFBLG1CQUFBO0NBQUEsQ0FBQSxFQUFVLFFBQVksVUFBdEI7Q0FBQSxTQUFBO0lBQUE7Q0FBQSxDQUNBLENBQXNDLENBRHRDLFFBQ1ksVUFBWjtDQURBLENBR0EsQ0FBYSxDQUFBLEtBQUMsQ0FBZDtDQUNFLENBQUEsQ0FBMkIsQ0FBdEIsQ0FBTCxHQUFBLEdBQUEsYUFBSztDQUpQLEVBR2E7Q0FIYixDQVNBLENBQVcsS0FBWCxDQUFXO0NBQ1QsT0FBQSxXQUFBO0NBQUEsRUFBYyxDQUFkLEtBQWMsQ0FBZCxZQUFBO0NBQUEsQ0FDaUIsRUFBakIsRUFBQSxDQUFBLEdBQUE7Q0FEQSxFQUVVLENBQVYsR0FBQTtDQUNFLENBQU0sRUFBTixDQUFBLENBQUE7Q0FBQSxDQUNVLElBQVYsRUFBQTtDQURBLENBRUssQ0FBTCxHQUFBLElBRkE7Q0FIRixLQUVVO0NBS1AsRUFBUSxHQURYLENBQ0UsRUFBUyxFQURYO0NBQzJCLEVBQXlCLFNBQTFCLENBQVosU0FBQTtDQURkLEVBRVEsQ0FGUixDQUNXLElBQ0Y7Q0FDTCxFQUF1QixDQUF2QixFQUFBLENBQUEsS0FBWTtDQUFaLENBQ2lCLEVBQWpCLEVBQUEsQ0FBQSxHQUFBO0NBQ0EsQ0FBdUMsRUFBdkMsRUFBQSxDQUFBLE1BQUEsTUFBQTtDQUxKLEVBTVEsQ0FOUixDQUVRLElBSUM7Q0FDTSxDQUFNLEVBQWpCLEVBQUEsQ0FBQSxHQUFBLEdBQUE7Q0FQSixJQU1RO0NBdEJWLEVBU1c7Q0FUWCxDQXlCQSxDQUFBLENBQVU7Q0FDVixDQUFBLENBQUcsQ0FBQSxjQUFIO0NBQ0UsRUFBcUIsQ0FBckIsYUFBQSxDQUFBO0NBQ1csQ0FBVSxDQUFyQixLQUFBLEVBQUEsQ0FBQTtJQUZGLEVBQUE7Q0FJRSxDQUFxQixDQUFxQixDQUExQyxJQUFBLEVBQUEsUUFBcUI7Q0FKdkIsR0FLd0IsT0FBdEIsT0FBQTtJQWhDa0I7Q0FBQTs7QUFtQ3RCLENBakRBLEVBaUR3QixDQUFwQixLQUFxRCxHQUFyQixJQUFwQztDQUNFLEtBQUEsTUFBQTtDQUFBLENBQUEsRUFBVSwyQkFBVjtDQUFBLFNBQUE7SUFBQTtDQUFBLENBQ0EsQ0FBZSxTQUFmO0NBREEsQ0FFQSxDQUEwQixDQUF0QixRQUFjO0NBRmxCLENBR0EsRUFBQSxRQUFBLE9BQUE7Q0FDQSxDQUFrQyxFQUFsQyxFQUFBLENBQUEsRUFBQSxLQUFBO0NBTHNEOztBQU94RCxDQXhEQSxFQXdENkIsTUFBQSxHQUFqQixDQUFaO0NBQ0csR0FBRCxLQUFBLEdBQUE7Q0FEMkI7O0FBRzdCLENBM0RBLEVBMkRzQixHQUF0QixHQUF1QixFQUFELENBQVY7Q0FDVixLQUFBLG9GQUFBO0NBQUEsQ0FBQSxDQUFRLEVBQVI7Q0FBQSxDQUNBLENBQVEsRUFBUjtDQURBLENBR0EsQ0FBTyxDQUFQLEtBQVE7Q0FDTixHQUFBLGNBQUE7QUFBb0IsQ0FBTSxFQUFBLEVBQUEsUUFBTjtNQUFwQjtDQUE0QyxFQUFBLEVBQUEsUUFBTjtNQURqQztDQUhQLEVBR087Q0FIUCxDQU1BLENBQVEsQ0FBQSxDQUFSLElBQVM7Q0FDUCxFQUFBLEtBQUE7Q0FBQSxFQUFBLENBQUEsR0FBZ0IsSUFBQSxHQUFWO0NBQ04sRUFBQSxDQUFBO0NBQUEsRUFBQSxDQUFBLEVBQUE7TUFEQTtDQURNLFVBR047Q0FURixFQU1RO0NBTlIsQ0FXQSxDQUFRLENBQUksQ0FBWjtDQUNBO0NBQUEsTUFBQSxhQUFBOzt1Q0FBQTtDQUNFLEVBQVUsQ0FBVixHQUFBLEtBQXNCO0NBQ3RCLEdBQUEsV0FBQTtDQUFBLEdBQUEsRUFBQSxDQUFBO01BREE7Q0FBQSxDQUVnQyxDQUFoQixDQUFoQixHQUFnQixFQUFpQixJQUFqQztDQUNFLEdBQUEsRUFBQSxDQUFBO0FBQ0EsQ0FBQSxDQUE2QixFQUE3QixDQUFjLENBQWQsQ0FBYyxDQUE4QjtDQUE1QyxhQUFBO1FBREE7Q0FBQSxHQUVBLEVBQUEsQ0FBQTtDQUNNLEdBQU4sQ0FBSyxRQUFMO0NBQ0UsQ0FBTSxFQUFOLElBQUE7Q0FBQSxDQUNNLEVBQU4sSUFBQSxJQURBO0NBQUEsQ0FFTSxFQUFOLElBQUE7Q0FQNEIsT0FJOUI7Q0FKYyxJQUFnQjtDQUhsQyxFQVpBO0NBQUEsQ0F1QkEsQ0FBZ0IsQ0FBSSxDQUFkLENBQUE7U0FDTjtDQUFBLENBQUUsRUFBQSxDQUFGO0NBQUEsQ0FBUyxFQUFBLENBQVQ7Q0F6Qm9CO0NBQUE7O0FBNEJ0QixDQXZGQSxFQXVGRSxNQUFBO0NBQ0EsS0FBQSxxQkFBQTtDQUFBLENBQUEsQ0FBZ0IsVUFBaEIsRUFBZ0I7Q0FBaEIsQ0FFQSxDQUFPLENBQVAsS0FBUTtDQUFELEVBR3lCLENBRDNCLE9BQUEsY0FBQSxjQUFBLGNBQUE7Q0FKTCxFQUVPO0NBRlAsQ0FZQSxDQUNzQixDQUFBLEVBRHRCLEdBQ3VCLEtBRHZCO0NBRWtCLEdBQU8sRUFBckIsS0FBQSxFQUFhO0NBRmpCLENBRzZCLENBRlAsSUFEdEIsQ0FBQSxDQUd1QyxNQUh2QztDQUlTLENBQW1DLEVBQXBDLENBQUosTUFBQSxHQUFBLElBQUE7Q0FKSixFQUdzQztDQWZ0QyxDQWtCQSxDQUFTLEdBQVQsTUFBUztDQUFhLENBQUMsRUFBQSxRQUFEO0NBbEJ0QixHQWtCUztDQUVULENBQUEsQ0FBaUMsTUFBakMsQ0FBQSxJQUFBO0NBQ0UsT0FBQSxHQUFBO0NBQUEsQ0FBQSxFQUFBLENBQXVCLEVBQWI7Q0FBVixXQUFBO01BQUE7Q0FBQSxFQUNjLENBQWQsT0FBQTtDQURBLEdBRUEsRUFBTSxLQUFOLEVBQUE7Q0FDQSxDQUFBLENBQUEsQ0FBQSxPQUFBO0NBSkYsRUFBaUM7Q0FyQmpDOzs7O0FDdkZGLElBQUEsNEJBQUE7O0FBQUEsQ0FBQSxFQUFPLENBQVAsR0FBTyxRQUFBOztBQUNQLENBREEsRUFDTyxDQUFQLEdBQU8sUUFBQTs7QUFDUCxDQUZBLEVBRVMsR0FBVCxDQUFTLFVBQUE7O0FBRVQsQ0FKQSxFQUllLENBQUEsUUFBZjtDQUNFLEtBQUEscUJBQUE7Q0FBQSxDQURlLFVBQ2Y7Q0FBQSxDQUFBLENBQWdCLE1BQUMsRUFBRCxFQUFoQjtDQUNFLE9BQUEsc0dBQUE7Q0FBQSxFQUFnQixDQUFoQixFQUFnQixLQUFBLENBQVksQ0FBNUI7Q0FBQSxFQUNRLENBQVIsQ0FBQSxRQUFxQjtDQURyQixFQUlrQixDQUFsQixXQUFBO0NBQWtCLENBQ1YsRUFBTixFQUFBLEtBRGdCO0NBQUEsQ0FFaEIsRUFBUSxFQUFSLEtBQUk7Q0FGWSxDQUdQLENBQ1AsQ0FERixDQUNnQyxDQURoQyxJQUFTLENBQUEsRUFBQSxDQUFBLEVBSE8sR0FHUCxLQUFBLEdBQUE7Q0FQWCxLQUFBO0NBQUEsR0FhQSxrQkFBQTs7Q0FBeUI7Q0FBQTtZQUFBLCtCQUFBOzJCQUFBO0NBQ3ZCO0NBQUEsQ0FDVSxJQUFSLElBQUEsQ0FERjtDQUFBLENBRVEsRUFBTixNQUFBLENBQU07Q0FGUixDQUdVLEVBSFYsRUFHRSxJQUFBO0NBSEYsQ0FJVSxFQUFXLEVBQW5CLElBQUE7Q0FKRixDQUtXLEVBQVcsQ0FMdEIsQ0FLaUIsQ0FBZixHQUFBO0NBTEYsQ0FNVSxFQUFXLEVBQW5CLEVBQVEsRUFBUjtDQU5GO0NBRHVCOztDQWJ6QjtDQUFBLEVBc0J1QixDQUF2QixnQkFBQTtDQUF1QixDQUNkLEdBQVAsQ0FBQSxVQURxQjtDQUFBLENBRWQsR0FBUCxDQUFBLFNBQU8sT0FBQTtDQXhCVCxLQUFBO0NBQUEsRUEwQm9CLENBQXBCLEdBQW9CLENBQUEsRUFBQSxNQUFBLENBQXBCO0NBMUJBLEdBMkJBLEdBQTJCLENBQTNCLFNBQWlCO0NBM0JqQixDQTRCc0MsRUFBdEMsS0FBQSxRQUFBLEdBQUE7Q0FDTyxFQUFQLENBQVcsRUFBTCxDQUFLLElBQVg7Q0E5QkYsRUFBZ0I7U0FpQ2hCO0NBQUEsQ0FDRSxFQUFBLFNBREY7Q0FsQ2E7Q0FBQTs7QUFxQ2YsQ0F6Q0EsRUF5Q2lCLEdBQVgsQ0FBTixLQXpDQSIsInNvdXJjZXNDb250ZW50IjpbIndpbmRvdy53aWtpID0gcmVxdWlyZSgnLi9saWIvd2lraS5jb2ZmZWUnKVxucmVxdWlyZSgnLi9saWIvbGVnYWN5LmNvZmZlZScpXG5cbiIsImNyZWF0ZVN5bm9wc2lzID0gcmVxdWlyZSAnLi9zeW5vcHNpcy5jb2ZmZWUnXG5cbndpa2kgPSB7IGNyZWF0ZVN5bm9wc2lzIH1cblxud2lraS5wZXJzb25hID0gcmVxdWlyZSAnLi9wZXJzb25hLmNvZmZlZSdcblxud2lraS5sb2cgPSAodGhpbmdzLi4uKSAtPlxuICBjb25zb2xlLmxvZyB0aGluZ3MuLi4gaWYgY29uc29sZT8ubG9nP1xuXG53aWtpLmFzU2x1ZyA9IChuYW1lKSAtPlxuICBuYW1lLnJlcGxhY2UoL1xccy9nLCAnLScpLnJlcGxhY2UoL1teQS1aYS16MC05LV0vZywgJycpLnRvTG93ZXJDYXNlKClcblxuXG53aWtpLnVzZUxvY2FsU3RvcmFnZSA9IC0+XG4gICQoXCIubG9naW5cIikubGVuZ3RoID4gMFxuXG53aWtpLnJlc29sdXRpb25Db250ZXh0ID0gW11cblxud2lraS5yZXNvbHZlRnJvbSA9IChhZGRpdGlvbiwgY2FsbGJhY2spIC0+XG4gIHdpa2kucmVzb2x1dGlvbkNvbnRleHQucHVzaCBhZGRpdGlvblxuICB0cnlcbiAgICBjYWxsYmFjaygpXG4gIGZpbmFsbHlcbiAgICB3aWtpLnJlc29sdXRpb25Db250ZXh0LnBvcCgpXG5cbndpa2kuZ2V0RGF0YSA9ICh2aXMpIC0+XG4gIGlmIHZpc1xuICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKVxuICAgIHdobyA9ICQoXCIuaXRlbTpsdCgje2lkeH0pXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykubGFzdCgpXG4gICAgaWYgd2hvPyB0aGVuIHdoby5kYXRhKCdpdGVtJykuZGF0YSBlbHNlIHt9XG4gIGVsc2VcbiAgICB3aG8gPSAkKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KClcbiAgICBpZiB3aG8/IHRoZW4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhIGVsc2Uge31cblxud2lraS5nZXREYXRhTm9kZXMgPSAodmlzKSAtPlxuICBpZiB2aXNcbiAgICBpZHggPSAkKCcuaXRlbScpLmluZGV4KHZpcylcbiAgICB3aG8gPSAkKFwiLml0ZW06bHQoI3tpZHh9KVwiKS5maWx0ZXIoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLnRvQXJyYXkoKS5yZXZlcnNlKClcbiAgICAkKHdobylcbiAgZWxzZVxuICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLnRvQXJyYXkoKS5yZXZlcnNlKClcbiAgICAkKHdobylcblxud2lraS5jcmVhdGVQYWdlID0gKG5hbWUsIGxvYykgLT5cbiAgc2l0ZSA9IGxvYyBpZiBsb2MgYW5kIGxvYyBpc250ICd2aWV3J1xuICAkcGFnZSA9ICQgXCJcIlwiXG4gICAgPGRpdiBjbGFzcz1cInBhZ2VcIiBpZD1cIiN7bmFtZX1cIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJ0d2luc1wiPiA8cD4gPC9wPiA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgPGgxPiA8aW1nIGNsYXNzPVwiZmF2aWNvblwiIHNyYz1cIiN7IGlmIHNpdGUgdGhlbiBcIi8vI3tzaXRlfVwiIGVsc2UgXCJcIiB9L2Zhdmljb24ucG5nXCIgaGVpZ2h0PVwiMzJweFwiPiAje25hbWV9IDwvaDE+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgXCJcIlwiXG4gICRwYWdlLmZpbmQoJy5wYWdlJykuYXR0cignZGF0YS1zaXRlJywgc2l0ZSkgaWYgc2l0ZVxuICAkcGFnZVxuXG53aWtpLmdldEl0ZW0gPSAoZWxlbWVudCkgLT5cbiAgJChlbGVtZW50KS5kYXRhKFwiaXRlbVwiKSBvciAkKGVsZW1lbnQpLmRhdGEoJ3N0YXRpY0l0ZW0nKSBpZiAkKGVsZW1lbnQpLmxlbmd0aCA+IDBcblxud2lraS5yZXNvbHZlTGlua3MgPSAoc3RyaW5nKSAtPlxuICByZW5kZXJJbnRlcm5hbExpbmsgPSAobWF0Y2gsIG5hbWUpIC0+XG4gICAgIyBzcGFjZXMgYmVjb21lICdzbHVncycsIG5vbi1hbHBoYS1udW0gZ2V0IHJlbW92ZWRcbiAgICBzbHVnID0gd2lraS5hc1NsdWcgbmFtZVxuICAgIFwiPGEgY2xhc3M9XFxcImludGVybmFsXFxcIiBocmVmPVxcXCIvI3tzbHVnfS5odG1sXFxcIiBkYXRhLXBhZ2UtbmFtZT1cXFwiI3tzbHVnfVxcXCIgdGl0bGU9XFxcIiN7d2lraS5yZXNvbHV0aW9uQ29udGV4dC5qb2luKCcgPT4gJyl9XFxcIj4je25hbWV9PC9hPlwiXG4gIHN0cmluZ1xuICAgIC5yZXBsYWNlKC9cXFtcXFsoW15cXF1dKylcXF1cXF0vZ2ksIHJlbmRlckludGVybmFsTGluaylcbiAgICAucmVwbGFjZSgvXFxbKGh0dHAuKj8pICguKj8pXFxdL2dpLCBcIlwiXCI8YSBjbGFzcz1cImV4dGVybmFsXCIgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiQxXCIgdGl0bGU9XCIkMVwiIHJlbD1cIm5vZm9sbG93XCI+JDIgPGltZyBzcmM9XCIvaW1hZ2VzL2V4dGVybmFsLWxpbmstbHRyLWljb24ucG5nXCI+PC9hPlwiXCJcIilcblxubW9kdWxlLmV4cG9ydHMgPSB3aWtpXG5cbiIsIndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xudXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5wYWdlSGFuZGxlciA9IHdpa2kucGFnZUhhbmRsZXIgPSByZXF1aXJlICcuL3BhZ2VIYW5kbGVyLmNvZmZlZSdcbnBsdWdpbiA9IHJlcXVpcmUgJy4vcGx1Z2luLmNvZmZlZSdcbnN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZS5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG5yZWZyZXNoID0gcmVxdWlyZSAnLi9yZWZyZXNoLmNvZmZlZSdcblxuQXJyYXk6Omxhc3QgPSAtPlxuICB0aGlzW0BsZW5ndGggLSAxXVxuXG4kIC0+XG4jIEVMRU1FTlRTIHVzZWQgZm9yIGRldGFpbHMgcG9wdXBcblxuICAjICMgZXh0ZW5zaW9uIGZyb20gaHR0cDovL3d3dy5kcm9wdG9mcmFtZS5jb20vP3A9MzVcbiAgIyAgICMgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyeyBwb3NpdGlvbjogYWJzb2x1dGU7IHJpZ2h0OiAyM3B4OyB0b3A6IDUwJTsgd2lkdGg6IDE5cHg7IG1hcmdpbjogLTEwcHggMCAwIDA7IHBhZGRpbmc6IDFweDsgaGVpZ2h0OiAxOHB4OyB9XG4gICMgICAjIC51aS1kaWFsb2cgLnVpLWRpYWxvZy10aXRsZWJhci10cmFuc2ZlciBzcGFuIHsgZGlzcGxheTogYmxvY2s7IG1hcmdpbjogMXB4OyB9XG4gICMgICAjIC51aS1kaWFsb2cgLnVpLWRpYWxvZy10aXRsZWJhci10cmFuc2Zlcjpob3ZlciwgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLW1pbjpmb2N1cyB7IHBhZGRpbmc6IDA7IH1cbiAgIyBfaW5pdCA9ICQudWkuZGlhbG9nLnByb3RvdHlwZS5faW5pdFxuICAjIF91aURpYWxvZ1RpdGxlYmFyID0gbnVsbFxuICAjICQudWkuZGlhbG9nLnByb3RvdHlwZS5faW5pdCA9IC0+XG4gICMgICBzZWxmID0gdGhpc1xuICAjICAgX2luaXQuYXBwbHkgdGhpcywgYXJndW1lbnRzXG4gICMgICB1aURpYWxvZ1RpdGxlYmFyID0gdGhpcy51aURpYWxvZ1RpdGxlYmFyXG4gICMgICB1aURpYWxvZ1RpdGxlYmFyLmFwcGVuZCAnPGEgaHJlZj1cIiNcIiBpZD1cImRpYWxvZy10cmFuc2ZlclwiIGNsYXNzPVwiZGlhbG9nLXRyYW5zZmVyIHVpLWRpYWxvZy10aXRsZWJhci10cmFuc2ZlclwiPjxzcGFuIGNsYXNzPVwidWktaWNvbiB1aS1pY29uLXRyYW5zZmVydGhpY2stZS13XCI+PC9zcGFuPjwvYT4nXG4gICMgJC5leHRlbmQgJC51aS5kaWFsb2cucHJvdG90eXBlLCAtPlxuICAjICAgJCgnLmRpYWxvZy10cmFuc2ZlcicsIHRoaXMudWlEaWFsb2dUaXRsZWJhcilcbiAgIyAgICAgLmhvdmVyIC0+ICQodGhpcykudG9nZ2xlQ2xhc3MoJ3VpLXN0YXRlLWhvdmVyJylcbiAgIyAgICAgLmNsaWNrKCkgLT5cbiAgIyAgICAgICBzZWxmLnRyYW5zZmVyKClcbiAgIyAgICAgICByZXR1cm4gZmFsc2VcbiAgd2luZG93LmRpYWxvZyA9ICQoJzxkaXY+PC9kaXY+Jylcblx0ICAuaHRtbCgnVGhpcyBkaWFsb2cgd2lsbCBzaG93IGV2ZXJ5IHRpbWUhJylcblx0ICAuZGlhbG9nIHsgYXV0b09wZW46IGZhbHNlLCB0aXRsZTogJ0Jhc2ljIERpYWxvZycsIGhlaWdodDogNjAwLCB3aWR0aDogODAwIH1cbiAgd2lraS5kaWFsb2cgPSAodGl0bGUsIGh0bWwpIC0+XG4gICAgd2luZG93LmRpYWxvZy5odG1sIGh0bWxcbiAgICB3aW5kb3cuZGlhbG9nLmRpYWxvZyBcIm9wdGlvblwiLCBcInRpdGxlXCIsIHdpa2kucmVzb2x2ZUxpbmtzKHRpdGxlKVxuICAgIHdpbmRvdy5kaWFsb2cuZGlhbG9nICdvcGVuJ1xuXG4jIEZVTkNUSU9OUyB1c2VkIGJ5IHBsdWdpbnMgYW5kIGVsc2V3aGVyZVxuXG4gIHNsZWVwID0gKHRpbWUsIGRvbmUpIC0+IHNldFRpbWVvdXQgZG9uZSwgdGltZVxuXG4gIHdpa2kucmVtb3ZlSXRlbSA9ICgkaXRlbSwgaXRlbSkgLT5cbiAgICBwYWdlSGFuZGxlci5wdXQgJGl0ZW0ucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge3R5cGU6ICdyZW1vdmUnLCBpZDogaXRlbS5pZH1cbiAgICAkaXRlbS5yZW1vdmUoKVxuXG4gIHdpa2kuY3JlYXRlSXRlbSA9ICgkcGFnZSwgJGJlZm9yZSwgaXRlbSkgLT5cbiAgICAkcGFnZSA9ICRiZWZvcmUucGFyZW50cygnLnBhZ2UnKSB1bmxlc3MgJHBhZ2U/XG4gICAgaXRlbS5pZCA9IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAkaXRlbSA9ICQgXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbSAje2l0ZW0udHlwZX1cIiBkYXRhLWlkPVwiI3t9XCI8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICAkaXRlbVxuICAgICAgLmRhdGEoJ2l0ZW0nLCBpdGVtKVxuICAgICAgLmRhdGEoJ3BhZ2VFbGVtZW50JywgJHBhZ2UpXG4gICAgaWYgJGJlZm9yZT9cbiAgICAgICRiZWZvcmUuYWZ0ZXIgJGl0ZW1cbiAgICBlbHNlXG4gICAgICAkcGFnZS5maW5kKCcuc3RvcnknKS5hcHBlbmQgJGl0ZW1cbiAgICBwbHVnaW4uZG8gJGl0ZW0sIGl0ZW1cbiAgICBiZWZvcmUgPSB3aWtpLmdldEl0ZW0gJGJlZm9yZVxuICAgIHNsZWVwIDUwMCwgLT5cbiAgICAgIHBhZ2VIYW5kbGVyLnB1dCAkcGFnZSwge2l0ZW0sIGlkOiBpdGVtLmlkLCB0eXBlOiAnYWRkJywgYWZ0ZXI6IGJlZm9yZT8uaWR9XG4gICAgJGl0ZW1cblxuICBjcmVhdGVUZXh0RWxlbWVudCA9IChwYWdlRWxlbWVudCwgYmVmb3JlRWxlbWVudCwgaW5pdGlhbFRleHQpIC0+XG4gICAgaXRlbSA9XG4gICAgICB0eXBlOiAncGFyYWdyYXBoJ1xuICAgICAgaWQ6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgIHRleHQ6IGluaXRpYWxUZXh0XG4gICAgaXRlbUVsZW1lbnQgPSAkIFwiXCJcIlxuICAgICAgPGRpdiBjbGFzcz1cIml0ZW0gcGFyYWdyYXBoXCIgZGF0YS1pZD0je2l0ZW0uaWR9PjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICBcIlwiXCJcbiAgICBpdGVtRWxlbWVudFxuICAgICAgLmRhdGEoJ2l0ZW0nLCBpdGVtKVxuICAgICAgLmRhdGEoJ3BhZ2VFbGVtZW50JywgcGFnZUVsZW1lbnQpXG4gICAgYmVmb3JlRWxlbWVudC5hZnRlciBpdGVtRWxlbWVudFxuICAgIHBsdWdpbi5kbyBpdGVtRWxlbWVudCwgaXRlbVxuICAgIGl0ZW1CZWZvcmUgPSB3aWtpLmdldEl0ZW0gYmVmb3JlRWxlbWVudFxuICAgIHdpa2kudGV4dEVkaXRvciBpdGVtRWxlbWVudCwgaXRlbVxuICAgIHNsZWVwIDUwMCwgLT4gcGFnZUhhbmRsZXIucHV0IHBhZ2VFbGVtZW50LCB7aXRlbTogaXRlbSwgaWQ6IGl0ZW0uaWQsIHR5cGU6ICdhZGQnLCBhZnRlcjogaXRlbUJlZm9yZT8uaWR9XG5cbiAgdGV4dEVkaXRvciA9IHdpa2kudGV4dEVkaXRvciA9IChkaXYsIGl0ZW0sIGNhcmV0UG9zLCBkb3VibGVDbGlja2VkKSAtPlxuICAgIHJldHVybiBpZiBkaXYuaGFzQ2xhc3MgJ3RleHRFZGl0aW5nJ1xuICAgIGRpdi5hZGRDbGFzcyAndGV4dEVkaXRpbmcnXG4gICAgdGV4dGFyZWEgPSAkKFwiPHRleHRhcmVhPiN7b3JpZ2luYWwgPSBpdGVtLnRleHQgPyAnJ308L3RleHRhcmVhPlwiKVxuICAgICAgLmZvY3Vzb3V0IC0+XG4gICAgICAgIGRpdi5yZW1vdmVDbGFzcyAndGV4dEVkaXRpbmcnXG4gICAgICAgIGlmIGl0ZW0udGV4dCA9IHRleHRhcmVhLnZhbCgpXG4gICAgICAgICAgcGx1Z2luLmRvIGRpdi5lbXB0eSgpLCBpdGVtXG4gICAgICAgICAgcmV0dXJuIGlmIGl0ZW0udGV4dCA9PSBvcmlnaW5hbFxuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dCBkaXYucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge3R5cGU6ICdlZGl0JywgaWQ6IGl0ZW0uaWQsIGl0ZW06IGl0ZW19XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQgZGl2LnBhcmVudHMoJy5wYWdlOmZpcnN0JyksIHt0eXBlOiAncmVtb3ZlJywgaWQ6IGl0ZW0uaWR9XG4gICAgICAgICAgZGl2LnJlbW92ZSgpXG4gICAgICAgIG51bGxcbiAgICAgICMgLmJpbmQgJ3Bhc3RlJywgKGUpIC0+XG4gICAgICAjICAgd2lraS5sb2cgJ3RleHRlZGl0IHBhc3RlJywgZVxuICAgICAgIyAgIHdpa2kubG9nIGUub3JpZ2luYWxFdmVudC5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQnKVxuICAgICAgLmJpbmQgJ2tleWRvd24nLCAoZSkgLT5cbiAgICAgICAgaWYgKGUuYWx0S2V5IHx8IGUuY3RsS2V5IHx8IGUubWV0YUtleSkgYW5kIGUud2hpY2ggPT0gODMgI2FsdC1zXG4gICAgICAgICAgdGV4dGFyZWEuZm9jdXNvdXQoKVxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBpZiAoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSBhbmQgZS53aGljaCA9PSA3MyAjYWx0LWlcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICBwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKSB1bmxlc3MgZS5zaGlmdEtleVxuICAgICAgICAgIGRvSW50ZXJuYWxMaW5rIFwiYWJvdXQgI3tpdGVtLnR5cGV9IHBsdWdpblwiLCBwYWdlXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICMgcHJvdmlkZXMgYXV0b21hdGljIG5ldyBwYXJhZ3JhcGhzIG9uIGVudGVyIGFuZCBjb25jYXRlbmF0aW9uIG9uIGJhY2tzcGFjZVxuICAgICAgICBpZiBpdGVtLnR5cGUgaXMgJ3BhcmFncmFwaCcgXG4gICAgICAgICAgc2VsID0gdXRpbC5nZXRTZWxlY3Rpb25Qb3ModGV4dGFyZWEpICMgcG9zaXRpb24gb2YgY2FyZXQgb3Igc2VsZWN0ZWQgdGV4dCBjb29yZHNcbiAgICAgICAgICBpZiBlLndoaWNoIGlzICQudWkua2V5Q29kZS5CQUNLU1BBQ0UgYW5kIHNlbC5zdGFydCBpcyAwIGFuZCBzZWwuc3RhcnQgaXMgc2VsLmVuZCBcbiAgICAgICAgICAgIHByZXZJdGVtID0gd2lraS5nZXRJdGVtKGRpdi5wcmV2KCkpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHByZXZJdGVtLnR5cGUgaXMgJ3BhcmFncmFwaCdcbiAgICAgICAgICAgIHByZXZUZXh0TGVuID0gcHJldkl0ZW0udGV4dC5sZW5ndGhcbiAgICAgICAgICAgIHByZXZJdGVtLnRleHQgKz0gdGV4dGFyZWEudmFsKClcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnJykgIyBOZWVkIGN1cnJlbnQgdGV4dCBhcmVhIHRvIGJlIGVtcHR5LiBJdGVtIHRoZW4gZ2V0cyBkZWxldGVkLlxuICAgICAgICAgICAgIyBjYXJldCBuZWVkcyB0byBiZSBiZXR3ZWVuIHRoZSBvbGQgdGV4dCBhbmQgdGhlIG5ldyBhcHBlbmRlZCB0ZXh0XG4gICAgICAgICAgICB0ZXh0RWRpdG9yIGRpdi5wcmV2KCksIHByZXZJdGVtLCBwcmV2VGV4dExlblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgZWxzZSBpZiBlLndoaWNoIGlzICQudWkua2V5Q29kZS5FTlRFUiBhbmQgaXRlbS50eXBlIGlzICdwYXJhZ3JhcGgnXG4gICAgICAgICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHNlbFxuICAgICAgICAgICAgdGV4dCA9IHRleHRhcmVhLnZhbCgpXG4gICAgICAgICAgICBwcmVmaXggPSB0ZXh0LnN1YnN0cmluZyAwLCBzZWwuc3RhcnRcbiAgICAgICAgICAgIG1pZGRsZSA9IHRleHQuc3Vic3RyaW5nKHNlbC5zdGFydCwgc2VsLmVuZCkgaWYgc2VsLnN0YXJ0IGlzbnQgc2VsLmVuZFxuICAgICAgICAgICAgc3VmZml4ID0gdGV4dC5zdWJzdHJpbmcoc2VsLmVuZClcbiAgICAgICAgICAgIGlmIHByZWZpeCBpcyAnJ1xuICAgICAgICAgICAgICB0ZXh0YXJlYS52YWwoJyAnKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICB0ZXh0YXJlYS52YWwocHJlZml4KVxuICAgICAgICAgICAgdGV4dGFyZWEuZm9jdXNvdXQoKVxuICAgICAgICAgICAgcGFnZUVsZW1lbnQgPSBkaXYucGFyZW50KCkucGFyZW50KClcbiAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsIHN1ZmZpeClcbiAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsIG1pZGRsZSkgaWYgbWlkZGxlP1xuICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgJycpIGlmIHByZWZpeCBpcyAnJ1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgZGl2Lmh0bWwgdGV4dGFyZWFcbiAgICBpZiBjYXJldFBvcz9cbiAgICAgIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbiB0ZXh0YXJlYSwgY2FyZXRQb3NcbiAgICBlbHNlIGlmIGRvdWJsZUNsaWNrZWQgIyB3ZSB3YW50IHRoZSBjYXJldCB0byBiZSBhdCB0aGUgZW5kXG4gICAgICB1dGlsLnNldENhcmV0UG9zaXRpb24gdGV4dGFyZWEsIHRleHRhcmVhLnZhbCgpLmxlbmd0aFxuICAgICAgI3Njcm9sbHMgdG8gYm90dG9tIG9mIHRleHQgYXJlYVxuICAgICAgdGV4dGFyZWEuc2Nyb2xsVG9wKHRleHRhcmVhWzBdLnNjcm9sbEhlaWdodCAtIHRleHRhcmVhLmhlaWdodCgpKVxuICAgIGVsc2VcbiAgICAgIHRleHRhcmVhLmZvY3VzKClcblxuICBkb0ludGVybmFsTGluayA9IHdpa2kuZG9JbnRlcm5hbExpbmsgPSAobmFtZSwgcGFnZSwgc2l0ZT1udWxsKSAtPlxuICAgIG5hbWUgPSB3aWtpLmFzU2x1ZyhuYW1lKVxuICAgICQocGFnZSkubmV4dEFsbCgpLnJlbW92ZSgpIGlmIHBhZ2U/XG4gICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsc2l0ZSlcbiAgICAgIC5hcHBlbmRUbygkKCcubWFpbicpKVxuICAgICAgLmVhY2ggcmVmcmVzaFxuICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG5cbiAgTEVGVEFSUk9XID0gMzdcbiAgUklHSFRBUlJPVyA9IDM5XG5cbiAgJChkb2N1bWVudCkua2V5ZG93biAoZXZlbnQpIC0+XG4gICAgZGlyZWN0aW9uID0gc3dpdGNoIGV2ZW50LndoaWNoXG4gICAgICB3aGVuIExFRlRBUlJPVyB0aGVuIC0xXG4gICAgICB3aGVuIFJJR0hUQVJST1cgdGhlbiArMVxuICAgIGlmIGRpcmVjdGlvbiAmJiBub3QgKGV2ZW50LnRhcmdldC50YWdOYW1lIGlzIFwiVEVYVEFSRUFcIilcbiAgICAgIHBhZ2VzID0gJCgnLnBhZ2UnKVxuICAgICAgbmV3SW5kZXggPSBwYWdlcy5pbmRleCgkKCcuYWN0aXZlJykpICsgZGlyZWN0aW9uXG4gICAgICBpZiAwIDw9IG5ld0luZGV4IDwgcGFnZXMubGVuZ3RoXG4gICAgICAgIGFjdGl2ZS5zZXQocGFnZXMuZXEobmV3SW5kZXgpKVxuXG4jIEhBTkRMRVJTIGZvciBqUXVlcnkgZXZlbnRzXG5cbiAgJCh3aW5kb3cpLm9uICdwb3BzdGF0ZScsIHN0YXRlLnNob3dcblxuICAkKGRvY3VtZW50KVxuICAgIC5hamF4RXJyb3IgKGV2ZW50LCByZXF1ZXN0LCBzZXR0aW5ncykgLT5cbiAgICAgIHJldHVybiBpZiByZXF1ZXN0LnN0YXR1cyA9PSAwIG9yIHJlcXVlc3Quc3RhdHVzID09IDQwNFxuICAgICAgd2lraS5sb2cgJ2FqYXggZXJyb3InLCBldmVudCwgcmVxdWVzdCwgc2V0dGluZ3NcbiAgICAgICQoJy5tYWluJykucHJlcGVuZCBcIlwiXCJcbiAgICAgICAgPGxpIGNsYXNzPSdlcnJvcic+XG4gICAgICAgICAgRXJyb3Igb24gI3tzZXR0aW5ncy51cmx9OiAje3JlcXVlc3QucmVzcG9uc2VUZXh0fVxuICAgICAgICA8L2xpPlxuICAgICAgXCJcIlwiXG5cbiAgZ2V0VGVtcGxhdGUgPSAoc2x1ZywgZG9uZSkgLT5cbiAgICByZXR1cm4gZG9uZShudWxsKSB1bmxlc3Mgc2x1Z1xuICAgIHdpa2kubG9nICdnZXRUZW1wbGF0ZScsIHNsdWdcbiAgICBwYWdlSGFuZGxlci5nZXRcbiAgICAgIHdoZW5Hb3R0ZW46IChkYXRhLHNpdGVGb3VuZCkgLT4gZG9uZShkYXRhLnN0b3J5KVxuICAgICAgd2hlbk5vdEdvdHRlbjogLT4gZG9uZShudWxsKVxuICAgICAgcGFnZUluZm9ybWF0aW9uOiB7c2x1Zzogc2x1Z31cblxuICBmaW5pc2hDbGljayA9IChlLCBuYW1lKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpIHVubGVzcyBlLnNoaWZ0S2V5XG4gICAgZG9JbnRlcm5hbExpbmsgbmFtZSwgcGFnZSwgJChlLnRhcmdldCkuZGF0YSgnc2l0ZScpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgJCgnLm1haW4nKVxuICAgIC5kZWxlZ2F0ZSAnLnNob3ctcGFnZS1zb3VyY2UnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgcGFnZUVsZW1lbnQgPSAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpXG4gICAgICBqc29uID0gcGFnZUVsZW1lbnQuZGF0YSgnZGF0YScpXG4gICAgICB3aWtpLmRpYWxvZyBcIkpTT04gZm9yICN7anNvbi50aXRsZX1cIiwgICQoJzxwcmUvPicpLnRleHQoSlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMikpXG5cbiAgICAuZGVsZWdhdGUgJy5wYWdlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBhY3RpdmUuc2V0IHRoaXMgdW5sZXNzICQoZS50YXJnZXQpLmlzKFwiYVwiKVxuXG4gICAgLmRlbGVnYXRlICcuaW50ZXJuYWwnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIG5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhICdwYWdlTmFtZSdcbiAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSAkKGUudGFyZ2V0KS5hdHRyKCd0aXRsZScpLnNwbGl0KCcgPT4gJylcbiAgICAgIGZpbmlzaENsaWNrIGUsIG5hbWVcblxuICAgIC5kZWxlZ2F0ZSAnaW1nLnJlbW90ZScsICdjbGljaycsIChlKSAtPlxuICAgICAgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEoJ3NsdWcnKVxuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFskKGUudGFyZ2V0KS5kYXRhKCdzaXRlJyldXG4gICAgICBmaW5pc2hDbGljayBlLCBuYW1lXG5cbiAgICAuZGVsZWdhdGUgJy5yZXZpc2lvbicsICdkYmxjbGljaycsIChlKSAtPlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAkcGFnZSA9ICQodGhpcykucGFyZW50cygnLnBhZ2UnKVxuICAgICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKVxuICAgICAgcmV2ID0gcGFnZS5qb3VybmFsLmxlbmd0aC0xXG4gICAgICBhY3Rpb24gPSBwYWdlLmpvdXJuYWxbcmV2XVxuICAgICAganNvbiA9IEpTT04uc3RyaW5naWZ5KGFjdGlvbiwgbnVsbCwgMilcbiAgICAgIHdpa2kuZGlhbG9nIFwiUmV2aXNpb24gI3tyZXZ9LCAje2FjdGlvbi50eXBlfSBhY3Rpb25cIiwgJCgnPHByZS8+JykudGV4dChqc29uKVxuXG4gICAgLmRlbGVnYXRlICcuYWN0aW9uJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICRhY3Rpb24gPSAkKGUudGFyZ2V0KVxuICAgICAgaWYgJGFjdGlvbi5pcygnLmZvcmsnKSBhbmQgKG5hbWUgPSAkYWN0aW9uLmRhdGEoJ3NsdWcnKSk/XG4gICAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJGFjdGlvbi5kYXRhKCdzaXRlJyldXG4gICAgICAgIGZpbmlzaENsaWNrIGUsIChuYW1lLnNwbGl0ICdfJylbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgJHBhZ2UgPSAkKHRoaXMpLnBhcmVudHMoJy5wYWdlJylcbiAgICAgICAgc2x1ZyA9IHdpa2kuYXNTbHVnKCRwYWdlLmRhdGEoJ2RhdGEnKS50aXRsZSlcbiAgICAgICAgcmV2ID0gJCh0aGlzKS5wYXJlbnQoKS5jaGlsZHJlbigpLmluZGV4KCRhY3Rpb24pXG4gICAgICAgICRwYWdlLm5leHRBbGwoKS5yZW1vdmUoKSB1bmxlc3MgZS5zaGlmdEtleVxuICAgICAgICB3aWtpLmNyZWF0ZVBhZ2UoXCIje3NsdWd9X3JldiN7cmV2fVwiLCAkcGFnZS5kYXRhKCdzaXRlJykpXG4gICAgICAgICAgLmFwcGVuZFRvKCQoJy5tYWluJykpXG4gICAgICAgICAgLmVhY2ggcmVmcmVzaFxuICAgICAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuXG4gICAgLmRlbGVnYXRlICcuZm9yay1wYWdlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBwYWdlRWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlJylcbiAgICAgIGlmIHBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdsb2NhbCcpXG4gICAgICAgIHVubGVzcyB3aWtpLnVzZUxvY2FsU3RvcmFnZSgpXG4gICAgICAgICAgaXRlbSA9IHBhZ2VFbGVtZW50LmRhdGEoJ2RhdGEnKVxuICAgICAgICAgIHBhZ2VFbGVtZW50LnJlbW92ZUNsYXNzKCdsb2NhbCcpXG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IHBhZ2VFbGVtZW50LCB7dHlwZTogJ2ZvcmsnLCBpdGVtfSAjIHB1c2hcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgKHJlbW90ZVNpdGUgPSBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJykpP1xuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dCBwYWdlRWxlbWVudCwge3R5cGU6J2ZvcmsnLCBzaXRlOiByZW1vdGVTaXRlfSAjIHB1bGxcblxuICAgIC5kZWxlZ2F0ZSAnLmFjdGlvbicsICdob3ZlcicsIC0+XG4gICAgICBpZCA9ICQodGhpcykuYXR0cignZGF0YS1pZCcpXG4gICAgICAkKFwiW2RhdGEtaWQ9I3tpZH1dXCIpLnRvZ2dsZUNsYXNzKCd0YXJnZXQnKVxuICAgICAgJCgnLm1haW4nKS50cmlnZ2VyKCdyZXYnKVxuXG4gICAgLmRlbGVnYXRlICcuaXRlbScsICdob3ZlcicsIC0+XG4gICAgICBpZCA9ICQodGhpcykuYXR0cignZGF0YS1pZCcpXG4gICAgICAkKFwiLmFjdGlvbltkYXRhLWlkPSN7aWR9XVwiKS50b2dnbGVDbGFzcygndGFyZ2V0JylcblxuICAgIC5kZWxlZ2F0ZSAnYnV0dG9uLmNyZWF0ZScsICdjbGljaycsIChlKSAtPlxuICAgICAgZ2V0VGVtcGxhdGUgJChlLnRhcmdldCkuZGF0YSgnc2x1ZycpLCAoc3RvcnkpIC0+XG4gICAgICAgICRwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2U6Zmlyc3QnKVxuICAgICAgICAkcGFnZS5yZW1vdmVDbGFzcyAnZ2hvc3QnXG4gICAgICAgIHBhZ2UgPSAkcGFnZS5kYXRhKCdkYXRhJylcbiAgICAgICAgcGFnZS5zdG9yeSA9IHN0b3J5fHxbXVxuICAgICAgICBwYWdlSGFuZGxlci5wdXQgJHBhZ2UsIHt0eXBlOiAnY3JlYXRlJywgaWQ6IHBhZ2UuaWQsIGl0ZW06IHt0aXRsZTpwYWdlLnRpdGxlLCBzdG9yeTogc3Rvcnl8fHVuZGVmaW5lZH19XG4gICAgICAgIHdpa2kuYnVpbGRQYWdlIHBhZ2UsIG51bGwsICRwYWdlLmVtcHR5KClcblxuICAgIC5kZWxlZ2F0ZSAnLmdob3N0JywgJ3JldicsIChlKSAtPlxuICAgICAgd2lraS5sb2cgJ3JldicsIGVcbiAgICAgICRwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2U6Zmlyc3QnKVxuICAgICAgJGl0ZW0gPSAkcGFnZS5maW5kKCcudGFyZ2V0JylcbiAgICAgIHBvc2l0aW9uID0gJGl0ZW0ub2Zmc2V0KCkudG9wICsgJHBhZ2Uuc2Nyb2xsVG9wKCkgLSAkcGFnZS5oZWlnaHQoKS8yXG4gICAgICB3aWtpLmxvZyAnc2Nyb2xsJywgJHBhZ2UsICRpdGVtLCBwb3NpdGlvblxuICAgICAgJHBhZ2Uuc3RvcCgpLmFuaW1hdGUge3Njcm9sbFRvcDogcG9zdGlvbn0sICdzbG93J1xuXG4gICAgLmRlbGVnYXRlICcuc2NvcmUnLCAnaG92ZXInLCAoZSkgLT5cbiAgICAgICQoJy5tYWluJykudHJpZ2dlciAndGh1bWInLCAkKGUudGFyZ2V0KS5kYXRhKCd0aHVtYicpXG5cbiAgJChcIi5wcm92aWRlciBpbnB1dFwiKS5jbGljayAtPlxuICAgICQoXCJmb290ZXIgaW5wdXQ6Zmlyc3RcIikudmFsICQodGhpcykuYXR0cignZGF0YS1wcm92aWRlcicpXG4gICAgJChcImZvb3RlciBmb3JtXCIpLnN1Ym1pdCgpXG5cbiAgJCgnYm9keScpLm9uICduZXctbmVpZ2hib3ItZG9uZScsIChlLCBuZWlnaGJvcikgLT5cbiAgICAkKCcucGFnZScpLmVhY2ggKGluZGV4LCBlbGVtZW50KSAtPlxuICAgICAgd2lraS5lbWl0VHdpbnMgJChlbGVtZW50KVxuXG4gICQgLT5cbiAgICBzdGF0ZS5maXJzdCgpXG4gICAgJCgnLnBhZ2UnKS5lYWNoIHJlZnJlc2hcbiAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChvd25lcikgLT5cbiAgJChcIiN1c2VyLWVtYWlsXCIpLmhpZGUoKVxuICAkKFwiI3BlcnNvbmEtbG9naW4tYnRuXCIpLmhpZGUoKVxuICAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5oaWRlKClcbiAgbmF2aWdhdG9yLmlkLndhdGNoXG4gICAgbG9nZ2VkSW5Vc2VyOiBvd25lclxuICAgIG9ubG9naW46IChhc3NlcnRpb24pIC0+XG4gICAgICBjb25zb2xlLmxvZyBcImFzc2VydGlvbj1cIiwgYXNzZXJ0aW9uXG4gICAgICAkLnBvc3QgXCIvcGVyc29uYV9sb2dpblwiLFxuICAgICAgICBhc3NlcnRpb246IGFzc2VydGlvblxuICAgICAgLCAodmVyaWZpZWQpIC0+XG4gICAgICAgIHZlcmlmaWVkID0gSlNPTi5wYXJzZSh2ZXJpZmllZClcbiAgICAgICAgY29uc29sZS5sb2cgdmVyaWZpZWRcbiAgICAgICAgaWYgXCJva2F5XCIgaXMgdmVyaWZpZWQuc3RhdHVzXG4gICAgICAgICAgJChcIiN1c2VyLWVtYWlsXCIpLnRleHQodmVyaWZpZWQuZW1haWwpLnNob3coKVxuICAgICAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuaGlkZSgpXG4gICAgICAgICAgJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcbiAgICAgICAgICAjIFZlcmlmaWNhdGlvbiBmYWlsZWRcbiAgICAgICAgICBuYXZpZ2F0b3IuaWQubG9nb3V0KClcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBcIi9vb3BzXCIgIGlmIFwid3JvbmctYWRkcmVzc1wiIGlzIHZlcmlmaWVkLnN0YXR1c1xuXG5cbiAgICBvbmxvZ291dDogLT5cbiAgICAgIGNvbnNvbGUubG9nIFwibG9nZ2luZyBvdXRcIlxuICAgICAgJC5wb3N0IFwiL3BlcnNvbmFfbG9nb3V0XCJcbiAgICAgICQoXCIjdXNlci1lbWFpbFwiKS5oaWRlKClcbiAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuc2hvdygpXG4gICAgICAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5oaWRlKClcblxuICAgIG9ubWF0Y2g6IC0+XG4gICAgICBjb25zb2xlLmxvZyBcIkl0IGlzIHNhZmUgdG8gcmVuZGVyIHRoZSBVSVwiXG4gICAgICBpZiBvd25lclxuICAgICAgICAkKFwiI3VzZXItZW1haWxcIikudGV4dChcInt7b3duZXJ9fVwiKS5zaG93KClcbiAgICAgICAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5oaWRlKClcbiAgICAgICAgJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuc2hvdygpXG4gICAgICBlbHNlXG4gICAgICAgICQoXCIjdXNlci1lbWFpbFwiKS5oaWRlKClcbiAgICAgICAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5zaG93KClcbiAgICAgICAgJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuaGlkZSgpXG5cbiAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5jbGljayAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBuYXZpZ2F0b3IuaWQucmVxdWVzdCB7fVxuXG4gICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLmNsaWNrIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIG5hdmlnYXRvci5pZC5sb2dvdXQoKVxuIiwibW9kdWxlLmV4cG9ydHMgPSAocGFnZSkgLT5cbiAgc3lub3BzaXMgPSBwYWdlLnN5bm9wc2lzXG4gIGlmIHBhZ2U/ICYmIHBhZ2Uuc3Rvcnk/XG4gICAgcDEgPSBwYWdlLnN0b3J5WzBdXG4gICAgcDIgPSBwYWdlLnN0b3J5WzFdXG4gICAgc3lub3BzaXMgfHw9IHAxLnRleHQgaWYgcDEgJiYgcDEudHlwZSA9PSAncGFyYWdyYXBoJ1xuICAgIHN5bm9wc2lzIHx8PSBwMi50ZXh0IGlmIHAyICYmIHAyLnR5cGUgPT0gJ3BhcmFncmFwaCdcbiAgICBzeW5vcHNpcyB8fD0gcDEudGV4dCBpZiBwMSAmJiBwMS50ZXh0P1xuICAgIHN5bm9wc2lzIHx8PSBwMi50ZXh0IGlmIHAyICYmIHAyLnRleHQ/XG4gICAgc3lub3BzaXMgfHw9IHBhZ2Uuc3Rvcnk/ICYmIFwiQSBwYWdlIHdpdGggI3twYWdlLnN0b3J5Lmxlbmd0aH0gaXRlbXMuXCJcbiAgZWxzZVxuICAgIHN5bm9wc2lzID0gJ0EgcGFnZSB3aXRoIG5vIHN0b3J5LidcbiAgcmV0dXJuIHN5bm9wc2lzXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gYWN0aXZlID0ge31cbiMgRlVOQ1RJT05TIGFuZCBIQU5ETEVSUyB0byBtYW5hZ2UgdGhlIGFjdGl2ZSBwYWdlLCBhbmQgc2Nyb2xsIHZpZXdwb3J0IHRvIHNob3cgaXRcblxuYWN0aXZlLnNjcm9sbENvbnRhaW5lciA9IHVuZGVmaW5lZFxuZmluZFNjcm9sbENvbnRhaW5lciA9IC0+XG4gIHNjcm9sbGVkID0gJChcImJvZHksIGh0bWxcIikuZmlsdGVyIC0+ICQodGhpcykuc2Nyb2xsTGVmdCgpID4gMFxuICBpZiBzY3JvbGxlZC5sZW5ndGggPiAwXG4gICAgc2Nyb2xsZWRcbiAgZWxzZVxuICAgICQoXCJib2R5LCBodG1sXCIpLnNjcm9sbExlZnQoMTIpLmZpbHRlcigtPiAkKHRoaXMpLnNjcm9sbExlZnQoKSA+IDApLnNjcm9sbFRvcCgwKVxuXG5zY3JvbGxUbyA9IChlbCkgLT5cbiAgYWN0aXZlLnNjcm9sbENvbnRhaW5lciA/PSBmaW5kU2Nyb2xsQ29udGFpbmVyKClcbiAgYm9keVdpZHRoID0gJChcImJvZHlcIikud2lkdGgoKVxuICBtaW5YID0gYWN0aXZlLnNjcm9sbENvbnRhaW5lci5zY3JvbGxMZWZ0KClcbiAgbWF4WCA9IG1pblggKyBib2R5V2lkdGhcbiAgdGFyZ2V0ID0gZWwucG9zaXRpb24oKS5sZWZ0XG4gIHdpZHRoID0gZWwub3V0ZXJXaWR0aCh0cnVlKVxuICBjb250ZW50V2lkdGggPSAkKFwiLnBhZ2VcIikub3V0ZXJXaWR0aCh0cnVlKSAqICQoXCIucGFnZVwiKS5zaXplKClcblxuICBpZiB0YXJnZXQgPCBtaW5YXG4gICAgYWN0aXZlLnNjcm9sbENvbnRhaW5lci5hbmltYXRlIHNjcm9sbExlZnQ6IHRhcmdldFxuICBlbHNlIGlmIHRhcmdldCArIHdpZHRoID4gbWF4WFxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiB0YXJnZXQgLSAoYm9keVdpZHRoIC0gd2lkdGgpXG4gIGVsc2UgaWYgbWF4WCA+ICQoXCIucGFnZXNcIikub3V0ZXJXaWR0aCgpXG4gICAgYWN0aXZlLnNjcm9sbENvbnRhaW5lci5hbmltYXRlIHNjcm9sbExlZnQ6IE1hdGgubWluKHRhcmdldCwgY29udGVudFdpZHRoIC0gYm9keVdpZHRoKVxuXG5hY3RpdmUuc2V0ID0gKGVsKSAtPlxuICBlbCA9ICQoZWwpXG4gICQoXCIuYWN0aXZlXCIpLnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpXG4gIHNjcm9sbFRvIGVsLmFkZENsYXNzKFwiYWN0aXZlXCIpXG5cbiIsIndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xubW9kdWxlLmV4cG9ydHMgPSB3aWtpLnV0aWwgPSB1dGlsID0ge31cblxudXRpbC5zeW1ib2xzID1cbiAgY3JlYXRlOiAn4pi8J1xuICBhZGQ6ICcrJ1xuICBlZGl0OiAn4pyOJ1xuICBmb3JrOiAn4pqRJ1xuICBtb3ZlOiAn4oaVJ1xuICByZW1vdmU6ICfinJUnXG5cbnV0aWwucmFuZG9tQnl0ZSA9IC0+XG4gICgoKDErTWF0aC5yYW5kb20oKSkqMHgxMDApfDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSlcblxudXRpbC5yYW5kb21CeXRlcyA9IChuKSAtPlxuICAodXRpbC5yYW5kb21CeXRlKCkgZm9yIFsxLi5uXSkuam9pbignJylcblxuIyBmb3IgY2hhcnQgcGx1Zy1pblxudXRpbC5mb3JtYXRUaW1lID0gKHRpbWUpIC0+XG4gIGQgPSBuZXcgRGF0ZSAoaWYgdGltZSA+IDEwMDAwMDAwMDAwIHRoZW4gdGltZSBlbHNlIHRpbWUqMTAwMClcbiAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXVxuICBoID0gZC5nZXRIb3VycygpXG4gIGFtID0gaWYgaCA8IDEyIHRoZW4gJ0FNJyBlbHNlICdQTSdcbiAgaCA9IGlmIGggPT0gMCB0aGVuIDEyIGVsc2UgaWYgaCA+IDEyIHRoZW4gaCAtIDEyIGVsc2UgaFxuICBtaSA9IChpZiBkLmdldE1pbnV0ZXMoKSA8IDEwIHRoZW4gXCIwXCIgZWxzZSBcIlwiKSArIGQuZ2V0TWludXRlcygpXG4gIFwiI3tofToje21pfSAje2FtfTxicj4je2QuZ2V0RGF0ZSgpfSAje21vfSAje2QuZ2V0RnVsbFllYXIoKX1cIlxuXG4jIGZvciBqb3VybmFsIG1vdXNlLW92ZXJzIGFuZCBwb3NzaWJseSBmb3IgZGF0ZSBoZWFkZXJcbnV0aWwuZm9ybWF0RGF0ZSA9IChtc1NpbmNlRXBvY2gpIC0+XG4gIGQgPSBuZXcgRGF0ZShtc1NpbmNlRXBvY2gpXG4gIHdrID0gWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXVtkLmdldERheSgpXVxuICBtbyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVtkLmdldE1vbnRoKCldXG4gIGRheSA9IGQuZ2V0RGF0ZSgpO1xuICB5ciA9IGQuZ2V0RnVsbFllYXIoKTtcbiAgaCA9IGQuZ2V0SG91cnMoKVxuICBhbSA9IGlmIGggPCAxMiB0aGVuICdBTScgZWxzZSAnUE0nXG4gIGggPSBpZiBoID09IDAgdGhlbiAxMiBlbHNlIGlmIGggPiAxMiB0aGVuIGggLSAxMiBlbHNlIGhcbiAgbWkgPSAoaWYgZC5nZXRNaW51dGVzKCkgPCAxMCB0aGVuIFwiMFwiIGVsc2UgXCJcIikgKyBkLmdldE1pbnV0ZXMoKVxuICBzZWMgPSAoaWYgZC5nZXRTZWNvbmRzKCkgPCAxMCB0aGVuIFwiMFwiIGVsc2UgXCJcIikgKyBkLmdldFNlY29uZHMoKVxuICBcIiN7d2t9ICN7bW99ICN7ZGF5fSwgI3t5cn08YnI+I3tofToje21pfToje3NlY30gI3thbX1cIlxuXG51dGlsLmZvcm1hdEVsYXBzZWRUaW1lID0gKG1zU2luY2VFcG9jaCkgLT5cbiAgbXNlY3MgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBtc1NpbmNlRXBvY2gpXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBtc2Vjc30gbWlsbGlzZWNvbmRzIGFnb1wiIGlmIChzZWNzID0gbXNlY3MvMTAwMCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBzZWNzfSBzZWNvbmRzIGFnb1wiIGlmIChtaW5zID0gc2Vjcy82MCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBtaW5zfSBtaW51dGVzIGFnb1wiIGlmIChocnMgPSBtaW5zLzYwKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIGhyc30gaG91cnMgYWdvXCIgaWYgKGRheXMgPSBocnMvMjQpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgZGF5c30gZGF5cyBhZ29cIiBpZiAod2Vla3MgPSBkYXlzLzcpIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3Igd2Vla3N9IHdlZWtzIGFnb1wiIGlmIChtb250aHMgPSBkYXlzLzMxKSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIG1vbnRoc30gbW9udGhzIGFnb1wiIGlmICh5ZWFycyA9IGRheXMvMzY1KSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIHllYXJzfSB5ZWFycyBhZ29cIlxuXG4jIERFRkFVTFRTIGZvciByZXF1aXJlZCBmaWVsZHNcblxudXRpbC5lbXB0eVBhZ2UgPSAoKSAtPlxuICB0aXRsZTogJ2VtcHR5J1xuICBzdG9yeTogW11cbiAgam91cm5hbDogW11cblxuXG4jIElmIHRoZSBzZWxlY3Rpb24gc3RhcnQgYW5kIHNlbGVjdGlvbiBlbmQgYXJlIGJvdGggdGhlIHNhbWUsXG4jIHRoZW4geW91IGhhdmUgdGhlIGNhcmV0IHBvc2l0aW9uLiBJZiB0aGVyZSBpcyBzZWxlY3RlZCB0ZXh0LCBcbiMgdGhlIGJyb3dzZXIgd2lsbCBub3QgdGVsbCB5b3Ugd2hlcmUgdGhlIGNhcmV0IGlzLCBidXQgaXQgd2lsbCBcbiMgZWl0aGVyIGJlIGF0IHRoZSBiZWdpbm5pbmcgb3IgdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uIFxuIyhkZXBlbmRpbmcgb24gdGhlIGRpcmVjdGlvbiBvZiB0aGUgc2VsZWN0aW9uKS5cbnV0aWwuZ2V0U2VsZWN0aW9uUG9zID0gKGpRdWVyeUVsZW1lbnQpIC0+IFxuICBlbCA9IGpRdWVyeUVsZW1lbnQuZ2V0KDApICMgZ2V0cyBET00gTm9kZSBmcm9tIGZyb20galF1ZXJ5IHdyYXBwZXJcbiAgaWYgZG9jdW1lbnQuc2VsZWN0aW9uICMgSUVcbiAgICBlbC5mb2N1cygpXG4gICAgc2VsID0gZG9jdW1lbnQuc2VsZWN0aW9uLmNyZWF0ZVJhbmdlKClcbiAgICBzZWwubW92ZVN0YXJ0ICdjaGFyYWN0ZXInLCAtZWwudmFsdWUubGVuZ3RoXG4gICAgaWVQb3MgPSBzZWwudGV4dC5sZW5ndGhcbiAgICB7c3RhcnQ6IGllUG9zLCBlbmQ6IGllUG9zfVxuICBlbHNlXG4gICAge3N0YXJ0OiBlbC5zZWxlY3Rpb25TdGFydCwgZW5kOiBlbC5zZWxlY3Rpb25FbmR9XG5cbnV0aWwuc2V0Q2FyZXRQb3NpdGlvbiA9IChqUXVlcnlFbGVtZW50LCBjYXJldFBvcykgLT5cbiAgZWwgPSBqUXVlcnlFbGVtZW50LmdldCgwKVxuICBpZiBlbD9cbiAgICBpZiBlbC5jcmVhdGVUZXh0UmFuZ2UgIyBJRVxuICAgICAgcmFuZ2UgPSBlbC5jcmVhdGVUZXh0UmFuZ2UoKVxuICAgICAgcmFuZ2UubW92ZSBcImNoYXJhY3RlclwiLCBjYXJldFBvc1xuICAgICAgcmFuZ2Uuc2VsZWN0KClcbiAgICBlbHNlICMgcmVzdCBvZiB0aGUgd29ybGRcbiAgICAgIGVsLnNldFNlbGVjdGlvblJhbmdlIGNhcmV0UG9zLCBjYXJldFBvc1xuICAgIGVsLmZvY3VzKClcblxuIiwidXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5jb2ZmZWUnKVxud2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gcGx1Z2luID0ge31cblxuIyBUT0RPOiBSZW1vdmUgdGhlc2UgbWV0aG9kcyBmcm9tIHdpa2kgb2JqZWN0P1xuI1xuXG5zY3JpcHRzID0ge31cbmdldFNjcmlwdCA9IHdpa2kuZ2V0U2NyaXB0ID0gKHVybCwgY2FsbGJhY2sgPSAoKSAtPikgLT5cbiAgaWYgc2NyaXB0c1t1cmxdP1xuICAgIGNhbGxiYWNrKClcbiAgZWxzZVxuICAgICQuZ2V0U2NyaXB0KHVybClcbiAgICAgIC5kb25lIC0+XG4gICAgICAgIHNjcmlwdHNbdXJsXSA9IHRydWVcbiAgICAgICAgY2FsbGJhY2soKVxuICAgICAgLmZhaWwgLT5cbiAgICAgICAgY2FsbGJhY2soKVxuXG5wbHVnaW4uZ2V0ID0gd2lraS5nZXRQbHVnaW4gPSAobmFtZSwgY2FsbGJhY2spIC0+XG4gIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSkgaWYgd2luZG93LnBsdWdpbnNbbmFtZV1cbiAgZ2V0U2NyaXB0IFwiL3BsdWdpbnMvI3tuYW1lfS8je25hbWV9LmpzXCIsICgpIC0+XG4gICAgcmV0dXJuIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKSBpZiB3aW5kb3cucGx1Z2luc1tuYW1lXVxuICAgIGdldFNjcmlwdCBcIi9wbHVnaW5zLyN7bmFtZX0uanNcIiwgKCkgLT5cbiAgICAgIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKVxuXG5wbHVnaW4uZG8gPSB3aWtpLmRvUGx1Z2luID0gKGRpdiwgaXRlbSwgZG9uZT0tPikgLT5cbiAgZXJyb3IgPSAoZXgpIC0+XG4gICAgZXJyb3JFbGVtZW50ID0gJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoJ2Vycm9yJylcbiAgICBlcnJvckVsZW1lbnQudGV4dChleC50b1N0cmluZygpKVxuICAgIGRpdi5hcHBlbmQoZXJyb3JFbGVtZW50KVxuXG4gIGRpdi5kYXRhICdwYWdlRWxlbWVudCcsIGRpdi5wYXJlbnRzKFwiLnBhZ2VcIilcbiAgZGl2LmRhdGEgJ2l0ZW0nLCBpdGVtXG4gIHBsdWdpbi5nZXQgaXRlbS50eXBlLCAoc2NyaXB0KSAtPlxuICAgIHRyeVxuICAgICAgdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgZmluZCBwbHVnaW4gZm9yICcje2l0ZW0udHlwZX0nXCIpIHVubGVzcyBzY3JpcHQ/XG4gICAgICBpZiBzY3JpcHQuZW1pdC5sZW5ndGggPiAyXG4gICAgICAgIHNjcmlwdC5lbWl0IGRpdiwgaXRlbSwgLT5cbiAgICAgICAgICBzY3JpcHQuYmluZCBkaXYsIGl0ZW1cbiAgICAgICAgICBkb25lKClcbiAgICAgIGVsc2VcbiAgICAgICAgc2NyaXB0LmVtaXQgZGl2LCBpdGVtXG4gICAgICAgIHNjcmlwdC5iaW5kIGRpdiwgaXRlbVxuICAgICAgICBkb25lKClcbiAgICBjYXRjaCBlcnJcbiAgICAgIHdpa2kubG9nICdwbHVnaW4gZXJyb3InLCBlcnJcbiAgICAgIGVycm9yKGVycilcbiAgICAgIGRvbmUoKVxuXG53aWtpLnJlZ2lzdGVyUGx1Z2luID0gKHBsdWdpbk5hbWUscGx1Z2luRm4pLT5cbiAgd2luZG93LnBsdWdpbnNbcGx1Z2luTmFtZV0gPSBwbHVnaW5GbigkKVxuXG5cbiMgUExVR0lOUyBmb3IgZWFjaCBzdG9yeSBpdGVtIHR5cGVcblxud2luZG93LnBsdWdpbnMgPVxuICBwYXJhZ3JhcGg6XG4gICAgZW1pdDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGZvciB0ZXh0IGluIGl0ZW0udGV4dC5zcGxpdCAvXFxuXFxuKy9cbiAgICAgICAgZGl2LmFwcGVuZCBcIjxwPiN7d2lraS5yZXNvbHZlTGlua3ModGV4dCl9PC9wPlwiIGlmIHRleHQubWF0Y2ggL1xcUy9cbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmRibGNsaWNrIC0+IHdpa2kudGV4dEVkaXRvciBkaXYsIGl0ZW0sIG51bGwsIHRydWVcbiAgaW1hZ2U6XG4gICAgZW1pdDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGl0ZW0udGV4dCB8fD0gaXRlbS5jYXB0aW9uXG4gICAgICBkaXYuYXBwZW5kIFwiPGltZyBjbGFzcz10aHVtYm5haWwgc3JjPVxcXCIje2l0ZW0udXJsfVxcXCI+IDxwPiN7d2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0KX08L3A+XCJcbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmRibGNsaWNrIC0+IHdpa2kudGV4dEVkaXRvciBkaXYsIGl0ZW1cbiAgICAgIGRpdi5maW5kKCdpbWcnKS5kYmxjbGljayAtPiB3aWtpLmRpYWxvZyBpdGVtLnRleHQsIHRoaXNcbiAgZnV0dXJlOlxuICAgIGVtaXQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBkaXYuYXBwZW5kIFwiXCJcIiN7aXRlbS50ZXh0fTxicj48YnI+PGJ1dHRvbiBjbGFzcz1cImNyZWF0ZVwiPmNyZWF0ZTwvYnV0dG9uPiBuZXcgYmxhbmsgcGFnZVwiXCJcIlxuICAgICAgaWYgKGluZm8gPSB3aWtpLm5laWdoYm9yaG9vZFtsb2NhdGlvbi5ob3N0XSk/IGFuZCBpbmZvLnNpdGVtYXA/XG4gICAgICAgIGZvciBpdGVtIGluIGluZm8uc2l0ZW1hcFxuICAgICAgICAgIGlmIGl0ZW0uc2x1Zy5tYXRjaCAvLXRlbXBsYXRlJC9cbiAgICAgICAgICAgIGRpdi5hcHBlbmQgXCJcIlwiPGJyPjxidXR0b24gY2xhc3M9XCJjcmVhdGVcIiBkYXRhLXNsdWc9I3tpdGVtLnNsdWd9PmNyZWF0ZTwvYnV0dG9uPiBmcm9tICN7d2lraS5yZXNvbHZlTGlua3MgXCJbWyN7aXRlbS50aXRsZX1dXVwifVwiXCJcIlxuICAgIGJpbmQ6IChkaXYsIGl0ZW0pIC0+XG4iLCJ3aWtpID0gcmVxdWlyZSAnLi93aWtpLmNvZmZlZSdcbmFjdGl2ZSA9IHJlcXVpcmUgJy4vYWN0aXZlLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSBzdGF0ZSA9IHt9XG5cbiMgRlVOQ1RJT05TIGFuZCBIQU5ETEVSUyB0byBtYW5hZ2UgbG9jYXRpb24gYmFyIGFuZCBiYWNrIGJ1dHRvblxuXG5zdGF0ZS5wYWdlc0luRG9tID0gLT5cbiAgJC5tYWtlQXJyYXkgJChcIi5wYWdlXCIpLm1hcCAoXywgZWwpIC0+IGVsLmlkXG5cbnN0YXRlLnVybFBhZ2VzID0gLT5cbiAgKGkgZm9yIGkgaW4gJChsb2NhdGlvbikuYXR0cigncGF0aG5hbWUnKS5zcGxpdCgnLycpIGJ5IDIpWzEuLl1cblxuc3RhdGUubG9jc0luRG9tID0gLT5cbiAgJC5tYWtlQXJyYXkgJChcIi5wYWdlXCIpLm1hcCAoXywgZWwpIC0+XG4gICAgJChlbCkuZGF0YSgnc2l0ZScpIG9yICd2aWV3J1xuXG5zdGF0ZS51cmxMb2NzID0gLT5cbiAgKGogZm9yIGogaW4gJChsb2NhdGlvbikuYXR0cigncGF0aG5hbWUnKS5zcGxpdCgnLycpWzEuLl0gYnkgMilcblxuc3RhdGUuc2V0VXJsID0gLT5cbiAgZG9jdW1lbnQudGl0bGUgPSAkKCcucGFnZTpsYXN0JykuZGF0YSgnZGF0YScpPy50aXRsZVxuICBpZiBoaXN0b3J5IGFuZCBoaXN0b3J5LnB1c2hTdGF0ZVxuICAgIGxvY3MgPSBzdGF0ZS5sb2NzSW5Eb20oKVxuICAgIHBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpXG4gICAgdXJsID0gKFwiLyN7bG9jcz9baWR4XSBvciAndmlldyd9LyN7cGFnZX1cIiBmb3IgcGFnZSwgaWR4IGluIHBhZ2VzKS5qb2luKCcnKVxuICAgIHVubGVzcyB1cmwgaXMgJChsb2NhdGlvbikuYXR0cigncGF0aG5hbWUnKVxuICAgICAgaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgdXJsKVxuXG5zdGF0ZS5zaG93ID0gKGUpIC0+XG4gIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpXG4gIG5ld1BhZ2VzID0gc3RhdGUudXJsUGFnZXMoKVxuICBvbGRMb2NzID0gc3RhdGUubG9jc0luRG9tKClcbiAgbmV3TG9jcyA9IHN0YXRlLnVybExvY3MoKVxuXG4gIHJldHVybiBpZiAoIWxvY2F0aW9uLnBhdGhuYW1lIG9yIGxvY2F0aW9uLnBhdGhuYW1lIGlzICcvJylcblxuICBwcmV2aW91cyA9ICQoJy5wYWdlJykuZXEoMClcblxuICBmb3IgbmFtZSwgaWR4IGluIG5ld1BhZ2VzXG4gICAgdW5sZXNzIG5hbWUgaXMgb2xkUGFnZXNbaWR4XVxuICAgICAgb2xkID0gJCgnLnBhZ2UnKS5lcShpZHgpXG4gICAgICBvbGQucmVtb3ZlKCkgaWYgb2xkXG4gICAgICB3aWtpLmNyZWF0ZVBhZ2UobmFtZSwgbmV3TG9jc1tpZHhdKS5pbnNlcnRBZnRlcihwcmV2aW91cykuZWFjaCB3aWtpLnJlZnJlc2hcbiAgICBwcmV2aW91cyA9ICQoJy5wYWdlJykuZXEoaWR4KVxuXG4gIHByZXZpb3VzLm5leHRBbGwoKS5yZW1vdmUoKVxuXG4gIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG4gIGRvY3VtZW50LnRpdGxlID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKT8udGl0bGVcblxuc3RhdGUuZmlyc3QgPSAtPlxuICBzdGF0ZS5zZXRVcmwoKVxuICBmaXJzdFVybFBhZ2VzID0gc3RhdGUudXJsUGFnZXMoKVxuICBmaXJzdFVybExvY3MgPSBzdGF0ZS51cmxMb2NzKClcbiAgb2xkUGFnZXMgPSBzdGF0ZS5wYWdlc0luRG9tKClcbiAgZm9yIHVybFBhZ2UsIGlkeCBpbiBmaXJzdFVybFBhZ2VzIHdoZW4gdXJsUGFnZSBub3QgaW4gb2xkUGFnZXNcbiAgICB3aWtpLmNyZWF0ZVBhZ2UodXJsUGFnZSwgZmlyc3RVcmxMb2NzW2lkeF0pLmFwcGVuZFRvKCcubWFpbicpIHVubGVzcyB1cmxQYWdlIGlzICcnXG5cbiIsIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlJ1xuXG53aWtpID0gcmVxdWlyZSAnLi93aWtpLmNvZmZlZSdcbnV0aWwgPSByZXF1aXJlICcuL3V0aWwuY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcbnJldmlzaW9uID0gcmVxdWlyZSAnLi9yZXZpc2lvbi5jb2ZmZWUnXG5hZGRUb0pvdXJuYWwgPSByZXF1aXJlICcuL2FkZFRvSm91cm5hbC5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gcGFnZUhhbmRsZXIgPSB7fVxuXG5wYWdlRnJvbUxvY2FsU3RvcmFnZSA9IChzbHVnKS0+XG4gIGlmIGpzb24gPSBsb2NhbFN0b3JhZ2Vbc2x1Z11cbiAgICBKU09OLnBhcnNlKGpzb24pXG4gIGVsc2VcbiAgICB1bmRlZmluZWRcblxucmVjdXJzaXZlR2V0ID0gKHtwYWdlSW5mb3JtYXRpb24sIHdoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW4sIGxvY2FsQ29udGV4dH0pIC0+XG4gIHtzbHVnLHJldixzaXRlfSA9IHBhZ2VJbmZvcm1hdGlvblxuXG4gIGlmIHNpdGVcbiAgICBsb2NhbENvbnRleHQgPSBbXVxuICBlbHNlXG4gICAgc2l0ZSA9IGxvY2FsQ29udGV4dC5zaGlmdCgpXG5cbiAgc2l0ZSA9IG51bGwgaWYgc2l0ZT09J3ZpZXcnXG5cbiAgaWYgc2l0ZT9cbiAgICBpZiBzaXRlID09ICdsb2NhbCdcbiAgICAgIGlmIGxvY2FsUGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VJbmZvcm1hdGlvbi5zbHVnKVxuICAgICAgICByZXR1cm4gd2hlbkdvdHRlbiggbG9jYWxQYWdlLCAnbG9jYWwnIClcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIHdoZW5Ob3RHb3R0ZW4oKVxuICAgIGVsc2VcbiAgICAgIGlmIHNpdGUgPT0gJ29yaWdpbidcbiAgICAgICAgdXJsID0gXCIvI3tzbHVnfS5qc29uXCJcbiAgICAgIGVsc2VcbiAgICAgICAgdXJsID0gXCJodHRwOi8vI3tzaXRlfS8je3NsdWd9Lmpzb25cIlxuICBlbHNlXG4gICAgdXJsID0gXCIvI3tzbHVnfS5qc29uXCJcblxuICAkLmFqYXhcbiAgICB0eXBlOiAnR0VUJ1xuICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICB1cmw6IHVybCArIFwiP3JhbmRvbT0je3V0aWwucmFuZG9tQnl0ZXMoNCl9XCJcbiAgICBzdWNjZXNzOiAocGFnZSkgLT5cbiAgICAgIHBhZ2UgPSByZXZpc2lvbi5jcmVhdGUgcmV2LCBwYWdlIGlmIHJldlxuICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4ocGFnZSxzaXRlKVxuICAgIGVycm9yOiAoeGhyLCB0eXBlLCBtc2cpIC0+XG4gICAgICBpZiAoeGhyLnN0YXR1cyAhPSA0MDQpIGFuZCAoeGhyLnN0YXR1cyAhPSAwKVxuICAgICAgICB3aWtpLmxvZyAncGFnZUhhbmRsZXIuZ2V0IGVycm9yJywgeGhyLCB4aHIuc3RhdHVzLCB0eXBlLCBtc2dcbiAgICAgICAgcmVwb3J0ID1cbiAgICAgICAgICAndGl0bGUnOiBcIiN7eGhyLnN0YXR1c30gI3ttc2d9XCJcbiAgICAgICAgICAnc3RvcnknOiBbXG4gICAgICAgICAgICAndHlwZSc6ICdwYXJhZ3JhcGgnXG4gICAgICAgICAgICAnaWQnOiAnOTI4NzM5MTg3MjQzJ1xuICAgICAgICAgICAgJ3RleHQnOiBcIjxwcmU+I3t4aHIucmVzcG9uc2VUZXh0fVwiXG4gICAgICAgICAgXVxuICAgICAgICByZXR1cm4gd2hlbkdvdHRlbiByZXBvcnQsICdsb2NhbCdcbiAgICAgIGlmIGxvY2FsQ29udGV4dC5sZW5ndGggPiAwXG4gICAgICAgIHJlY3Vyc2l2ZUdldCgge3BhZ2VJbmZvcm1hdGlvbiwgd2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbiwgbG9jYWxDb250ZXh0fSApXG4gICAgICBlbHNlXG4gICAgICAgIHdoZW5Ob3RHb3R0ZW4oKVxuXG5wYWdlSGFuZGxlci5nZXQgPSAoe3doZW5Hb3R0ZW4sd2hlbk5vdEdvdHRlbixwYWdlSW5mb3JtYXRpb259ICApIC0+XG5cbiAgdW5sZXNzIHBhZ2VJbmZvcm1hdGlvbi5zaXRlXG4gICAgaWYgbG9jYWxQYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZUluZm9ybWF0aW9uLnNsdWcpXG4gICAgICBsb2NhbFBhZ2UgPSByZXZpc2lvbi5jcmVhdGUgcGFnZUluZm9ybWF0aW9uLnJldiwgbG9jYWxQYWdlIGlmIHBhZ2VJbmZvcm1hdGlvbi5yZXZcbiAgICAgIHJldHVybiB3aGVuR290dGVuKCBsb2NhbFBhZ2UsICdsb2NhbCcgKVxuXG4gIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbJ3ZpZXcnXSB1bmxlc3MgcGFnZUhhbmRsZXIuY29udGV4dC5sZW5ndGhcblxuICByZWN1cnNpdmVHZXRcbiAgICBwYWdlSW5mb3JtYXRpb246IHBhZ2VJbmZvcm1hdGlvblxuICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW5cbiAgICB3aGVuTm90R290dGVuOiB3aGVuTm90R290dGVuXG4gICAgbG9jYWxDb250ZXh0OiBfLmNsb25lKHBhZ2VIYW5kbGVyLmNvbnRleHQpXG5cblxucGFnZUhhbmRsZXIuY29udGV4dCA9IFtdXG5cbnB1c2hUb0xvY2FsID0gKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKSAtPlxuICBwYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UgcGFnZVB1dEluZm8uc2x1Z1xuICBwYWdlID0ge3RpdGxlOiBhY3Rpb24uaXRlbS50aXRsZX0gaWYgYWN0aW9uLnR5cGUgPT0gJ2NyZWF0ZSdcbiAgcGFnZSB8fD0gcGFnZUVsZW1lbnQuZGF0YShcImRhdGFcIilcbiAgcGFnZS5qb3VybmFsID0gW10gdW5sZXNzIHBhZ2Uuam91cm5hbD9cbiAgaWYgKHNpdGU9YWN0aW9uWydmb3JrJ10pP1xuICAgIHBhZ2Uuam91cm5hbCA9IHBhZ2Uuam91cm5hbC5jb25jYXQoeyd0eXBlJzonZm9yaycsJ3NpdGUnOnNpdGV9KVxuICAgIGRlbGV0ZSBhY3Rpb25bJ2ZvcmsnXVxuICBwYWdlLmpvdXJuYWwgPSBwYWdlLmpvdXJuYWwuY29uY2F0KGFjdGlvbilcbiAgcGFnZS5zdG9yeSA9ICQocGFnZUVsZW1lbnQpLmZpbmQoXCIuaXRlbVwiKS5tYXAoLT4gJChAKS5kYXRhKFwiaXRlbVwiKSkuZ2V0KClcbiAgbG9jYWxTdG9yYWdlW3BhZ2VQdXRJbmZvLnNsdWddID0gSlNPTi5zdHJpbmdpZnkocGFnZSlcbiAgYWRkVG9Kb3VybmFsIHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksIGFjdGlvblxuXG5wdXNoVG9TZXJ2ZXIgPSAocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pIC0+XG4gICQuYWpheFxuICAgIHR5cGU6ICdQVVQnXG4gICAgdXJsOiBcIi9wYWdlLyN7cGFnZVB1dEluZm8uc2x1Z30vYWN0aW9uXCJcbiAgICBkYXRhOlxuICAgICAgJ2FjdGlvbic6IEpTT04uc3RyaW5naWZ5KGFjdGlvbilcbiAgICBzdWNjZXNzOiAoKSAtPlxuICAgICAgYWRkVG9Kb3VybmFsIHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksIGFjdGlvblxuICAgICAgaWYgYWN0aW9uLnR5cGUgPT0gJ2ZvcmsnICMgcHVzaFxuICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSBwYWdlRWxlbWVudC5hdHRyKCdpZCcpXG4gICAgICAgIHN0YXRlLnNldFVybFxuICAgIGVycm9yOiAoeGhyLCB0eXBlLCBtc2cpIC0+XG4gICAgICB3aWtpLmxvZyBcInBhZ2VIYW5kbGVyLnB1dCBhamF4IGVycm9yIGNhbGxiYWNrXCIsIHR5cGUsIG1zZ1xuXG5wYWdlSGFuZGxlci5wdXQgPSAocGFnZUVsZW1lbnQsIGFjdGlvbikgLT5cblxuICBjaGVja2VkU2l0ZSA9ICgpIC0+XG4gICAgc3dpdGNoIHNpdGUgPSBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJylcbiAgICAgIHdoZW4gJ29yaWdpbicsICdsb2NhbCcsICd2aWV3JyB0aGVuIG51bGxcbiAgICAgIHdoZW4gbG9jYXRpb24uaG9zdCB0aGVuIG51bGxcbiAgICAgIGVsc2Ugc2l0ZVxuXG4gICMgYWJvdXQgdGhlIHBhZ2Ugd2UgaGF2ZVxuICBwYWdlUHV0SW5mbyA9IHtcbiAgICBzbHVnOiBwYWdlRWxlbWVudC5hdHRyKCdpZCcpLnNwbGl0KCdfcmV2JylbMF1cbiAgICByZXY6IHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVsxXVxuICAgIHNpdGU6IGNoZWNrZWRTaXRlKClcbiAgICBsb2NhbDogcGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2xvY2FsJylcbiAgfVxuICBmb3JrRnJvbSA9IHBhZ2VQdXRJbmZvLnNpdGVcbiAgd2lraS5sb2cgJ3BhZ2VIYW5kbGVyLnB1dCcsIGFjdGlvbiwgcGFnZVB1dEluZm9cblxuICAjIGRldGVjdCB3aGVuIGZvcmsgdG8gbG9jYWwgc3RvcmFnZVxuICBpZiB3aWtpLnVzZUxvY2FsU3RvcmFnZSgpXG4gICAgaWYgcGFnZVB1dEluZm8uc2l0ZT9cbiAgICAgIHdpa2kubG9nICdyZW1vdGUgPT4gbG9jYWwnXG4gICAgZWxzZSBpZiAhcGFnZVB1dEluZm8ubG9jYWxcbiAgICAgIHdpa2kubG9nICdvcmlnaW4gPT4gbG9jYWwnXG4gICAgICBhY3Rpb24uc2l0ZSA9IGZvcmtGcm9tID0gbG9jYXRpb24uaG9zdFxuICAgICMgZWxzZSBpZiAhcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZVB1dEluZm8uc2x1ZylcbiAgICAjICAgd2lraS5sb2cgJydcbiAgICAjICAgYWN0aW9uLnNpdGUgPSBmb3JrRnJvbSA9IHBhZ2VQdXRJbmZvLnNpdGVcbiAgICAjICAgd2lraS5sb2cgJ2xvY2FsIHN0b3JhZ2UgZmlyc3QgdGltZScsIGFjdGlvbiwgJ2ZvcmtGcm9tJywgZm9ya0Zyb21cblxuICAjIHR3ZWVrIGFjdGlvbiBiZWZvcmUgc2F2aW5nXG4gIGFjdGlvbi5kYXRlID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKVxuICBkZWxldGUgYWN0aW9uLnNpdGUgaWYgYWN0aW9uLnNpdGUgPT0gJ29yaWdpbidcblxuICAjIHVwZGF0ZSBkb20gd2hlbiBmb3JraW5nXG4gIGlmIGZvcmtGcm9tXG4gICAgIyBwdWxsIHJlbW90ZSBzaXRlIGNsb3NlciB0byB1c1xuICAgIHBhZ2VFbGVtZW50LmZpbmQoJ2gxIGltZycpLmF0dHIoJ3NyYycsICcvZmF2aWNvbi5wbmcnKVxuICAgIHBhZ2VFbGVtZW50LmZpbmQoJ2gxIGEnKS5hdHRyKCdocmVmJywgJy8nKVxuICAgIHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnLCBudWxsKVxuICAgIHBhZ2VFbGVtZW50LnJlbW92ZUNsYXNzKCdyZW1vdGUnKVxuICAgIHN0YXRlLnNldFVybCgpXG4gICAgaWYgYWN0aW9uLnR5cGUgIT0gJ2ZvcmsnXG4gICAgICAjIGJ1bmRsZSBpbXBsaWNpdCBmb3JrIHdpdGggbmV4dCBhY3Rpb25cbiAgICAgIGFjdGlvbi5mb3JrID0gZm9ya0Zyb21cbiAgICAgIGFkZFRvSm91cm5hbCBwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLFxuICAgICAgICB0eXBlOiAnZm9yaydcbiAgICAgICAgc2l0ZTogZm9ya0Zyb21cbiAgICAgICAgZGF0ZTogYWN0aW9uLmRhdGVcblxuICAjIHN0b3JlIGFzIGFwcHJvcHJpYXRlXG4gIGlmIHdpa2kudXNlTG9jYWxTdG9yYWdlKCkgb3IgcGFnZVB1dEluZm8uc2l0ZSA9PSAnbG9jYWwnXG4gICAgcHVzaFRvTG9jYWwocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pXG4gICAgcGFnZUVsZW1lbnQuYWRkQ2xhc3MoXCJsb2NhbFwiKVxuICBlbHNlXG4gICAgcHVzaFRvU2VydmVyKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKVxuXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcblxudXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5wYWdlSGFuZGxlciA9IHJlcXVpcmUgJy4vcGFnZUhhbmRsZXIuY29mZmVlJ1xucGx1Z2luID0gcmVxdWlyZSAnLi9wbHVnaW4uY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcbm5laWdoYm9yaG9vZCA9IHJlcXVpcmUgJy4vbmVpZ2hib3Job29kLmNvZmZlZSdcbmFkZFRvSm91cm5hbCA9IHJlcXVpcmUgJy4vYWRkVG9Kb3VybmFsLmNvZmZlZSdcbndpa2kgPSByZXF1aXJlKCcuL3dpa2kuY29mZmVlJylcblxuaGFuZGxlRHJhZ2dpbmcgPSAoZXZ0LCB1aSkgLT5cbiAgaXRlbUVsZW1lbnQgPSB1aS5pdGVtXG5cbiAgaXRlbSA9IHdpa2kuZ2V0SXRlbShpdGVtRWxlbWVudClcbiAgdGhpc1BhZ2VFbGVtZW50ID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIHNvdXJjZVBhZ2VFbGVtZW50ID0gaXRlbUVsZW1lbnQuZGF0YSgncGFnZUVsZW1lbnQnKVxuICBzb3VyY2VTaXRlID0gc291cmNlUGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpXG5cbiAgZGVzdGluYXRpb25QYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnBhcmVudHMoJy5wYWdlOmZpcnN0JylcbiAgZXF1YWxzID0gKGEsIGIpIC0+IGEgYW5kIGIgYW5kIGEuZ2V0KDApID09IGIuZ2V0KDApXG5cbiAgbW92ZVdpdGhpblBhZ2UgPSBub3Qgc291cmNlUGFnZUVsZW1lbnQgb3IgZXF1YWxzKHNvdXJjZVBhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KVxuICBtb3ZlRnJvbVBhZ2UgPSBub3QgbW92ZVdpdGhpblBhZ2UgYW5kIGVxdWFscyh0aGlzUGFnZUVsZW1lbnQsIHNvdXJjZVBhZ2VFbGVtZW50KVxuICBtb3ZlVG9QYWdlID0gbm90IG1vdmVXaXRoaW5QYWdlIGFuZCBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBkZXN0aW5hdGlvblBhZ2VFbGVtZW50KVxuXG4gIGlmIG1vdmVGcm9tUGFnZVxuICAgIGlmIHNvdXJjZVBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdnaG9zdCcpIG9yXG4gICAgICBzb3VyY2VQYWdlRWxlbWVudC5hdHRyKCdpZCcpID09IGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQuYXR0cignaWQnKVxuICAgICAgICAjIHN0ZW0gdGhlIGRhbWFnZSwgYmV0dGVyIGlkZWFzIGhlcmU6XG4gICAgICAgICMgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zOTE2MDg5L2pxdWVyeS11aS1zb3J0YWJsZXMtY29ubmVjdC1saXN0cy1jb3B5LWl0ZW1zXG4gICAgICAgIHJldHVyblxuXG4gIGFjdGlvbiA9IGlmIG1vdmVXaXRoaW5QYWdlXG4gICAgb3JkZXIgPSAkKHRoaXMpLmNoaWxkcmVuKCkubWFwKChfLCB2YWx1ZSkgLT4gJCh2YWx1ZSkuYXR0cignZGF0YS1pZCcpKS5nZXQoKVxuICAgIHt0eXBlOiAnbW92ZScsIG9yZGVyOiBvcmRlcn1cbiAgZWxzZSBpZiBtb3ZlRnJvbVBhZ2VcbiAgICB3aWtpLmxvZyAnZHJhZyBmcm9tJywgc291cmNlUGFnZUVsZW1lbnQuZmluZCgnaDEnKS50ZXh0KClcbiAgICB7dHlwZTogJ3JlbW92ZSd9XG4gIGVsc2UgaWYgbW92ZVRvUGFnZVxuICAgIGl0ZW1FbGVtZW50LmRhdGEgJ3BhZ2VFbGVtZW50JywgdGhpc1BhZ2VFbGVtZW50XG4gICAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJylcbiAgICBiZWZvcmUgPSB3aWtpLmdldEl0ZW0oYmVmb3JlRWxlbWVudClcbiAgICB7dHlwZTogJ2FkZCcsIGl0ZW06IGl0ZW0sIGFmdGVyOiBiZWZvcmU/LmlkfVxuICBhY3Rpb24uaWQgPSBpdGVtLmlkXG4gIHBhZ2VIYW5kbGVyLnB1dCB0aGlzUGFnZUVsZW1lbnQsIGFjdGlvblxuXG5pbml0RHJhZ2dpbmcgPSAoJHBhZ2UpIC0+XG4gICRzdG9yeSA9ICRwYWdlLmZpbmQoJy5zdG9yeScpXG4gICRzdG9yeS5zb3J0YWJsZShjb25uZWN0V2l0aDogJy5wYWdlIC5zdG9yeScpLm9uKFwic29ydHVwZGF0ZVwiLCBoYW5kbGVEcmFnZ2luZylcblxuXG5pbml0QWRkQnV0dG9uID0gKCRwYWdlKSAtPlxuICAkcGFnZS5maW5kKFwiLmFkZC1mYWN0b3J5XCIpLmxpdmUgXCJjbGlja1wiLCAoZXZ0KSAtPlxuICAgIHJldHVybiBpZiAkcGFnZS5oYXNDbGFzcyAnZ2hvc3QnXG4gICAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgICBjcmVhdGVGYWN0b3J5KCRwYWdlKVxuXG5jcmVhdGVGYWN0b3J5ID0gKCRwYWdlKSAtPlxuICBpdGVtID1cbiAgICB0eXBlOiBcImZhY3RvcnlcIlxuICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gIGl0ZW1FbGVtZW50ID0gJChcIjxkaXYgLz5cIiwgY2xhc3M6IFwiaXRlbSBmYWN0b3J5XCIpLmRhdGEoJ2l0ZW0nLGl0ZW0pLmF0dHIoJ2RhdGEtaWQnLCBpdGVtLmlkKVxuICBpdGVtRWxlbWVudC5kYXRhICdwYWdlRWxlbWVudCcsICRwYWdlXG4gICRwYWdlLmZpbmQoXCIuc3RvcnlcIikuYXBwZW5kKGl0ZW1FbGVtZW50KVxuICBwbHVnaW4uZG8gaXRlbUVsZW1lbnQsIGl0ZW1cbiAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJylcbiAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpXG4gIHBhZ2VIYW5kbGVyLnB1dCAkcGFnZSwge2l0ZW06IGl0ZW0sIGlkOiBpdGVtLmlkLCB0eXBlOiBcImFkZFwiLCBhZnRlcjogYmVmb3JlPy5pZH1cblxuYnVpbGRQYWdlSGVhZGVyID0gKHtwYWdlLHRvb2x0aXAsaGVhZGVyX2hyZWYsZmF2aWNvbl9zcmN9KS0+XG4gIHRvb2x0aXAgKz0gXCJcXG4je3BhZ2UucGx1Z2lufSBwbHVnaW5cIiBpZiBwYWdlLnBsdWdpblxuICBcIlwiXCI8aDEgdGl0bGU9XCIje3Rvb2x0aXB9XCI+PGEgaHJlZj1cIiN7aGVhZGVyX2hyZWZ9XCI+PGltZyBzcmM9XCIje2Zhdmljb25fc3JjfVwiIGhlaWdodD1cIjMycHhcIiBjbGFzcz1cImZhdmljb25cIj48L2E+ICN7cGFnZS50aXRsZX08L2gxPlwiXCJcIlxuXG5lbWl0SGVhZGVyID0gKCRoZWFkZXIsICRwYWdlLCBwYWdlKSAtPlxuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpXG4gIGlzUmVtb3RlUGFnZSA9IHNpdGU/IGFuZCBzaXRlICE9ICdsb2NhbCcgYW5kIHNpdGUgIT0gJ29yaWdpbicgYW5kIHNpdGUgIT0gJ3ZpZXcnXG4gIGhlYWRlciA9ICcnXG5cbiAgdmlld0hlcmUgPSBpZiB3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKSBpcyAnd2VsY29tZS12aXNpdG9ycycgdGhlbiBcIlwiXG4gIGVsc2UgXCIvdmlldy8je3dpa2kuYXNTbHVnKHBhZ2UudGl0bGUpfVwiXG4gIHBhZ2VIZWFkZXIgPSBpZiBpc1JlbW90ZVBhZ2VcbiAgICBidWlsZFBhZ2VIZWFkZXJcbiAgICAgIHRvb2x0aXA6IHNpdGVcbiAgICAgIGhlYWRlcl9ocmVmOiBcIi8vI3tzaXRlfS92aWV3L3dlbGNvbWUtdmlzaXRvcnMje3ZpZXdIZXJlfVwiXG4gICAgICBmYXZpY29uX3NyYzogXCJodHRwOi8vI3tzaXRlfS9mYXZpY29uLnBuZ1wiXG4gICAgICBwYWdlOiBwYWdlXG4gIGVsc2VcbiAgICBidWlsZFBhZ2VIZWFkZXJcbiAgICAgIHRvb2x0aXA6IGxvY2F0aW9uLmhvc3RcbiAgICAgIGhlYWRlcl9ocmVmOiBcIi92aWV3L3dlbGNvbWUtdmlzaXRvcnMje3ZpZXdIZXJlfVwiXG4gICAgICBmYXZpY29uX3NyYzogXCIvZmF2aWNvbi5wbmdcIlxuICAgICAgcGFnZTogcGFnZVxuXG4gICRoZWFkZXIuYXBwZW5kKCBwYWdlSGVhZGVyIClcbiAgXG4gIHVubGVzcyBpc1JlbW90ZVBhZ2VcbiAgICAkKCdpbWcuZmF2aWNvbicsJHBhZ2UpLmVycm9yIChlKS0+XG4gICAgICBwbHVnaW4uZ2V0ICdmYXZpY29uJywgKGZhdmljb24pIC0+XG4gICAgICAgIGZhdmljb24uY3JlYXRlKClcblxuICBpZiAkcGFnZS5hdHRyKCdpZCcpLm1hdGNoIC9fcmV2L1xuICAgIHJldiA9IHBhZ2Uuam91cm5hbC5sZW5ndGgtMVxuICAgIGRhdGUgPSBwYWdlLmpvdXJuYWxbcmV2XS5kYXRlXG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ2dob3N0JykuZGF0YSgncmV2JyxyZXYpXG4gICAgJGhlYWRlci5hcHBlbmQgJCBcIlwiXCJcbiAgICAgIDxoMiBjbGFzcz1cInJldmlzaW9uXCI+XG4gICAgICAgIDxzcGFuPlxuICAgICAgICAgICN7aWYgZGF0ZT8gdGhlbiB1dGlsLmZvcm1hdERhdGUoZGF0ZSkgZWxzZSBcIlJldmlzaW9uICN7cmV2fVwifVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2gyPlxuICAgIFwiXCJcIlxuXG5lbWl0VHdpbnMgPSB3aWtpLmVtaXRUd2lucyA9ICgkcGFnZSkgLT5cbiAgcGFnZSA9ICRwYWdlLmRhdGEgJ2RhdGEnXG4gIHNpdGUgPSAkcGFnZS5kYXRhKCdzaXRlJykgb3Igd2luZG93LmxvY2F0aW9uLmhvc3RcbiAgc2l0ZSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0IGlmIHNpdGUgaW4gWyd2aWV3JywgJ29yaWdpbiddXG4gIHNsdWcgPSB3aWtpLmFzU2x1ZyBwYWdlLnRpdGxlXG4gIGlmIChhY3Rpb25zID0gcGFnZS5qb3VybmFsPy5sZW5ndGgpPyBhbmQgKHZpZXdpbmcgPSBwYWdlLmpvdXJuYWxbYWN0aW9ucy0xXT8uZGF0ZSk/XG4gICAgdmlld2luZyA9IE1hdGguZmxvb3Iodmlld2luZy8xMDAwKSoxMDAwXG4gICAgYmlucyA9IHtuZXdlcjpbXSwgc2FtZTpbXSwgb2xkZXI6W119XG4gICAgIyB7ZmVkLndpa2kub3JnOiBbe3NsdWc6IFwiaGFwcGVuaW5nc1wiLCB0aXRsZTogXCJIYXBwZW5pbmdzXCIsIGRhdGU6IDEzNTg5NzUzMDMwMDAsIHN5bm9wc2lzOiBcIkNoYW5nZXMgaGVyZSAuLi5cIn1dfVxuICAgIGZvciByZW1vdGVTaXRlLCBpbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgICBpZiByZW1vdGVTaXRlICE9IHNpdGUgYW5kIGluZm8uc2l0ZW1hcD9cbiAgICAgICAgZm9yIGl0ZW0gaW4gaW5mby5zaXRlbWFwXG4gICAgICAgICAgaWYgaXRlbS5zbHVnID09IHNsdWdcbiAgICAgICAgICAgIGJpbiA9IGlmIGl0ZW0uZGF0ZSA+IHZpZXdpbmcgdGhlbiBiaW5zLm5ld2VyXG4gICAgICAgICAgICBlbHNlIGlmIGl0ZW0uZGF0ZSA8IHZpZXdpbmcgdGhlbiBiaW5zLm9sZGVyXG4gICAgICAgICAgICBlbHNlIGJpbnMuc2FtZVxuICAgICAgICAgICAgYmluLnB1c2gge3JlbW90ZVNpdGUsIGl0ZW19XG4gICAgdHdpbnMgPSBbXVxuICAgICMge25ld2VyOltyZW1vdGVTaXRlOiBcImZlZC53aWtpLm9yZ1wiLCBpdGVtOiB7c2x1ZzogLi4uLCBkYXRlOiAuLi59LCAuLi5dfVxuICAgIGZvciBsZWdlbmQsIGJpbiBvZiBiaW5zXG4gICAgICBjb250aW51ZSB1bmxlc3MgYmluLmxlbmd0aFxuICAgICAgYmluLnNvcnQgKGEsYikgLT5cbiAgICAgICAgYS5pdGVtLmRhdGUgPCBiLml0ZW0uZGF0ZVxuICAgICAgZmxhZ3MgPSBmb3Ige3JlbW90ZVNpdGUsIGl0ZW19LCBpIGluIGJpblxuICAgICAgICBicmVhayBpZiBpID49IDhcbiAgICAgICAgXCJcIlwiPGltZyBjbGFzcz1cInJlbW90ZVwiXG4gICAgICAgICAgc3JjPVwiaHR0cDovLyN7cmVtb3RlU2l0ZX0vZmF2aWNvbi5wbmdcIlxuICAgICAgICAgIGRhdGEtc2x1Zz1cIiN7c2x1Z31cIlxuICAgICAgICAgIGRhdGEtc2l0ZT1cIiN7cmVtb3RlU2l0ZX1cIlxuICAgICAgICAgIHRpdGxlPVwiI3tyZW1vdGVTaXRlfVwiPlxuICAgICAgICBcIlwiXCJcbiAgICAgIHR3aW5zLnB1c2ggXCIje2ZsYWdzLmpvaW4gJyZuYnNwOyd9ICN7bGVnZW5kfVwiXG4gICAgJHBhZ2UuZmluZCgnLnR3aW5zJykuaHRtbCBcIlwiXCI8cD4je3R3aW5zLmpvaW4gXCIsIFwifTwvcD5cIlwiXCIgaWYgdHdpbnNcblxucmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCA9IChwYWdlRGF0YSwkcGFnZSwgc2l0ZUZvdW5kKSAtPlxuICBwYWdlID0gJC5leHRlbmQodXRpbC5lbXB0eVBhZ2UoKSwgcGFnZURhdGEpXG4gICRwYWdlLmRhdGEoXCJkYXRhXCIsIHBhZ2UpXG4gIHNsdWcgPSAkcGFnZS5hdHRyKCdpZCcpXG4gIHNpdGUgPSAkcGFnZS5kYXRhKCdzaXRlJylcblxuICBjb250ZXh0ID0gWyd2aWV3J11cbiAgY29udGV4dC5wdXNoIHNpdGUgaWYgc2l0ZT9cbiAgYWRkQ29udGV4dCA9IChzaXRlKSAtPiBjb250ZXh0LnB1c2ggc2l0ZSBpZiBzaXRlPyBhbmQgbm90IF8uaW5jbHVkZSBjb250ZXh0LCBzaXRlXG4gIGFkZENvbnRleHQgYWN0aW9uLnNpdGUgZm9yIGFjdGlvbiBpbiBwYWdlLmpvdXJuYWwuc2xpY2UoMCkucmV2ZXJzZSgpXG5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dCA9IGNvbnRleHRcblxuICAkcGFnZS5lbXB0eSgpXG4gIFskdHdpbnMsICRoZWFkZXIsICRzdG9yeSwgJGpvdXJuYWwsICRmb290ZXJdID0gWyd0d2lucycsICdoZWFkZXInLCAnc3RvcnknLCAnam91cm5hbCcsICdmb290ZXInXS5tYXAgKGNsYXNzTmFtZSkgLT5cbiAgICAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcyhjbGFzc05hbWUpLmFwcGVuZFRvKCRwYWdlKVxuXG4gIGVtaXRIZWFkZXIgJGhlYWRlciwgJHBhZ2UsIHBhZ2VcblxuICBlbWl0SXRlbSA9IChpKSAtPlxuICAgIHJldHVybiBpZiBpID49IHBhZ2Uuc3RvcnkubGVuZ3RoXG4gICAgaXRlbSA9IHBhZ2Uuc3RvcnlbaV1cbiAgICBpZiBpdGVtPy50eXBlIGFuZCBpdGVtPy5pZFxuICAgICAgJGl0ZW0gPSAkIFwiXCJcIjxkaXYgY2xhc3M9XCJpdGVtICN7aXRlbS50eXBlfVwiIGRhdGEtaWQ9XCIje2l0ZW0uaWR9XCI+XCJcIlwiXG4gICAgICAkc3RvcnkuYXBwZW5kICRpdGVtXG4gICAgICBwbHVnaW4uZG8gJGl0ZW0sIGl0ZW0sIC0+IGVtaXRJdGVtIGkrMVxuICAgIGVsc2VcbiAgICAgICRzdG9yeS5hcHBlbmQgJCBcIlwiXCI8ZGl2PjxwIGNsYXNzPVwiZXJyb3JcIj5DYW4ndCBtYWtlIHNlbnNlIG9mIHN0b3J5WyN7aX1dPC9wPjwvZGl2PlwiXCJcIlxuICAgICAgZW1pdEl0ZW0gaSsxXG4gIGVtaXRJdGVtIDBcblxuICBmb3IgYWN0aW9uIGluIHBhZ2Uuam91cm5hbFxuICAgIGFkZFRvSm91cm5hbCAkam91cm5hbCwgYWN0aW9uXG5cbiAgZW1pdFR3aW5zICRwYWdlXG5cbiAgJGpvdXJuYWwuYXBwZW5kIFwiXCJcIlxuICAgIDxkaXYgY2xhc3M9XCJjb250cm9sLWJ1dHRvbnNcIj5cbiAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidXR0b24gZm9yay1wYWdlXCIgdGl0bGU9XCJmb3JrIHRoaXMgcGFnZVwiPiN7dXRpbC5zeW1ib2xzWydmb3JrJ119PC9hPlxuICAgICAgPGEgaHJlZj1cIiNcIiBjbGFzcz1cImJ1dHRvbiBhZGQtZmFjdG9yeVwiIHRpdGxlPVwiYWRkIHBhcmFncmFwaFwiPiN7dXRpbC5zeW1ib2xzWydhZGQnXX08L2E+XG4gICAgPC9kaXY+XG4gIFwiXCJcIlxuXG4gICRmb290ZXIuYXBwZW5kIFwiXCJcIlxuICAgIDxhIGlkPVwibGljZW5zZVwiIGhyZWY9XCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvXCI+Q0MgQlktU0EgMy4wPC9hPiAuXG4gICAgPGEgY2xhc3M9XCJzaG93LXBhZ2Utc291cmNlXCIgaHJlZj1cIi8je3NsdWd9Lmpzb24/cmFuZG9tPSN7dXRpbC5yYW5kb21CeXRlcyg0KX1cIiB0aXRsZT1cInNvdXJjZVwiPkpTT048L2E+IC5cbiAgICA8YSBocmVmPSBcIi8vI3tzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdH0vI3tzbHVnfS5odG1sXCI+I3tzaXRlRm91bmQgfHwgbG9jYXRpb24uaG9zdH08L2E+XG4gIFwiXCJcIlxuXG5cbndpa2kuYnVpbGRQYWdlID0gKGRhdGEsc2l0ZUZvdW5kLCRwYWdlKSAtPlxuXG4gIGlmIHNpdGVGb3VuZCA9PSAnbG9jYWwnXG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ2xvY2FsJylcbiAgZWxzZSBpZiBzaXRlRm91bmRcbiAgICBzaXRlRm91bmQgPSAnb3JpZ2luJyBpZiBzaXRlRm91bmQgaXMgd2luZG93LmxvY2F0aW9uLmhvc3RcbiAgICAkcGFnZS5hZGRDbGFzcygncmVtb3RlJykgdW5sZXNzIHNpdGVGb3VuZCBpbiBbJ3ZpZXcnLCAnb3JpZ2luJ11cbiAgICAkcGFnZS5kYXRhKCdzaXRlJywgc2l0ZUZvdW5kKVxuICBpZiBkYXRhLnBsdWdpbj9cbiAgICAkcGFnZS5hZGRDbGFzcygncGx1Z2luJylcblxuICAjVE9ETzogYXZvaWQgcGFzc2luZyBzaXRlRm91bmRcbiAgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCggZGF0YSwgJHBhZ2UsIHNpdGVGb3VuZCApXG5cbiAgc3RhdGUuc2V0VXJsKClcblxuICBpbml0RHJhZ2dpbmcgJHBhZ2VcbiAgaW5pdEFkZEJ1dHRvbiAkcGFnZVxuICAkcGFnZVxuXG5cbm1vZHVsZS5leHBvcnRzID0gcmVmcmVzaCA9IHdpa2kucmVmcmVzaCA9IC0+XG4gICRwYWdlID0gJCh0aGlzKVxuXG4gIFtzbHVnLCByZXZdID0gJHBhZ2UuYXR0cignaWQnKS5zcGxpdCgnX3JldicpXG4gIHBhZ2VJbmZvcm1hdGlvbiA9IHtcbiAgICBzbHVnOiBzbHVnXG4gICAgcmV2OiByZXZcbiAgICBzaXRlOiAkcGFnZS5kYXRhKCdzaXRlJylcbiAgfVxuXG4gIGNyZWF0ZUdob3N0UGFnZSA9IC0+XG4gICAgdGl0bGUgPSAkKFwiXCJcImFbaHJlZj1cIi8je3NsdWd9Lmh0bWxcIl06bGFzdFwiXCJcIikudGV4dCgpIG9yIHNsdWdcbiAgICBwYWdlID1cbiAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICAnc3RvcnknOiBbXG4gICAgICAgICdpZCc6IHV0aWwucmFuZG9tQnl0ZXMgOFxuICAgICAgICAndHlwZSc6ICdmdXR1cmUnXG4gICAgICAgICd0ZXh0JzogJ1dlIGNvdWxkIG5vdCBmaW5kIHRoaXMgcGFnZS4nXG4gICAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICBdXG4gICAgaGVhZGluZyA9XG4gICAgICAndHlwZSc6ICdwYXJhZ3JhcGgnXG4gICAgICAnaWQnOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAndGV4dCc6IFwiV2UgZGlkIGZpbmQgdGhlIHBhZ2UgaW4geW91ciBjdXJyZW50IG5laWdoYm9yaG9vZC5cIlxuICAgIGhpdHMgPSBbXVxuICAgIGZvciBzaXRlLCBpbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgICBpZiBpbmZvLnNpdGVtYXA/XG4gICAgICAgIHJlc3VsdCA9IF8uZmluZCBpbmZvLnNpdGVtYXAsIChlYWNoKSAtPlxuICAgICAgICAgIGVhY2guc2x1ZyA9PSBzbHVnXG4gICAgICAgIGlmIHJlc3VsdD9cbiAgICAgICAgICBoaXRzLnB1c2hcbiAgICAgICAgICAgIFwidHlwZVwiOiBcInJlZmVyZW5jZVwiXG4gICAgICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgICAgICAgIFwic2l0ZVwiOiBzaXRlXG4gICAgICAgICAgICBcInNsdWdcIjogc2x1Z1xuICAgICAgICAgICAgXCJ0aXRsZVwiOiByZXN1bHQudGl0bGUgfHwgc2x1Z1xuICAgICAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5zeW5vcHNpcyB8fCAnJ1xuICAgIGlmIGhpdHMubGVuZ3RoID4gMFxuICAgICAgcGFnZS5zdG9yeS5wdXNoIGhlYWRpbmcsIGhpdHMuLi5cbiAgICAgIHBhZ2Uuc3RvcnlbMF0udGV4dCA9ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UgaW4gdGhlIGV4cGVjdGVkIGNvbnRleHQuJ1xuXG4gICAgd2lraS5idWlsZFBhZ2UoIHBhZ2UsIHVuZGVmaW5lZCwgJHBhZ2UgKS5hZGRDbGFzcygnZ2hvc3QnKVxuXG4gIHJlZ2lzdGVyTmVpZ2hib3JzID0gKGRhdGEsIHNpdGUpIC0+XG4gICAgaWYgXy5pbmNsdWRlIFsnbG9jYWwnLCAnb3JpZ2luJywgJ3ZpZXcnLCBudWxsLCB1bmRlZmluZWRdLCBzaXRlXG4gICAgICBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciBsb2NhdGlvbi5ob3N0XG4gICAgZWxzZVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3Igc2l0ZVxuICAgIGZvciBpdGVtIGluIChkYXRhLnN0b3J5IHx8IFtdKVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgaXRlbS5zaXRlIGlmIGl0ZW0uc2l0ZT9cbiAgICBmb3IgYWN0aW9uIGluIChkYXRhLmpvdXJuYWwgfHwgW10pXG4gICAgICBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciBhY3Rpb24uc2l0ZSBpZiBhY3Rpb24uc2l0ZT9cblxuICB3aGVuR290dGVuID0gKGRhdGEsc2l0ZUZvdW5kKSAtPlxuICAgIHdpa2kuYnVpbGRQYWdlKCBkYXRhLCBzaXRlRm91bmQsICRwYWdlIClcbiAgICByZWdpc3Rlck5laWdoYm9ycyggZGF0YSwgc2l0ZUZvdW5kIClcblxuICBwYWdlSGFuZGxlci5nZXRcbiAgICB3aGVuR290dGVuOiB3aGVuR290dGVuXG4gICAgd2hlbk5vdEdvdHRlbjogY3JlYXRlR2hvc3RQYWdlXG4gICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cblxuIiwiIyAqKnJldmlzaW9uLmNvZmZlZSoqXG4jIFRoaXMgbW9kdWxlIGdlbmVyYXRlcyBhIHBhc3QgcmV2aXNpb24gb2YgYSBkYXRhIGZpbGUgYW5kIGNhY2hlcyBpdCBpbiAnZGF0YS9yZXYnLlxuI1xuIyBUaGUgc2F2ZWQgZmlsZSBoYXMgdGhlIG5hbWUgb2YgdGhlIGlkIG9mIHRoZSBwb2ludCBpbiB0aGUgam91cm5hbCdzIGhpc3RvcnlcbiMgdGhhdCB0aGUgcmV2aXNpb24gcmVwcmVzZW50cy5cblxuY3JlYXRlID0gKHJldkluZGV4LCBkYXRhKSAtPlxuICBqb3VybmFsID0gZGF0YS5qb3VybmFsXG4gIHJldlRpdGxlID0gZGF0YS50aXRsZVxuICByZXZTdG9yeSA9IFtdXG4gIHJldkpvdXJuYWwgPSBqb3VybmFsWzAuLigrcmV2SW5kZXgpXVxuICBmb3Igam91cm5hbEVudHJ5IGluIHJldkpvdXJuYWxcbiAgICByZXZTdG9yeUlkcyA9IHJldlN0b3J5Lm1hcCAoc3RvcnlJdGVtKSAtPiBzdG9yeUl0ZW0uaWRcbiAgICBzd2l0Y2ggam91cm5hbEVudHJ5LnR5cGVcbiAgICAgIHdoZW4gJ2NyZWF0ZSdcbiAgICAgICAgaWYgam91cm5hbEVudHJ5Lml0ZW0udGl0bGU/XG4gICAgICAgICAgcmV2VGl0bGUgPSBqb3VybmFsRW50cnkuaXRlbS50aXRsZVxuICAgICAgICAgIHJldlN0b3J5ID0gam91cm5hbEVudHJ5Lml0ZW0uc3RvcnkgfHwgW11cbiAgICAgIHdoZW4gJ2FkZCdcbiAgICAgICAgaWYgKGFmdGVySW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5hZnRlcikgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UoYWZ0ZXJJbmRleCsxLDAsam91cm5hbEVudHJ5Lml0ZW0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXZTdG9yeS5wdXNoIGpvdXJuYWxFbnRyeS5pdGVtXG4gICAgICB3aGVuICdlZGl0J1xuICAgICAgICBpZiAoZWRpdEluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuaWQpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGVkaXRJbmRleCwxLGpvdXJuYWxFbnRyeS5pdGVtKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV2U3RvcnkucHVzaCBqb3VybmFsRW50cnkuaXRlbVxuICAgICAgd2hlbiAnbW92ZSdcbiAgICAgICAgaXRlbXMgPSB7fVxuICAgICAgICBmb3Igc3RvcnlJdGVtIGluIHJldlN0b3J5XG4gICAgICAgICAgaXRlbXNbc3RvcnlJdGVtLmlkXSA9IHN0b3J5SXRlbVxuICAgICAgICByZXZTdG9yeSA9IFtdXG4gICAgICAgIGZvciBpdGVtSWQgaW4gam91cm5hbEVudHJ5Lm9yZGVyXG4gICAgICAgICAgcmV2U3RvcnkucHVzaChpdGVtc1tpdGVtSWRdKSBpZiBpdGVtc1tpdGVtSWRdP1xuICAgICAgd2hlbiAncmVtb3ZlJ1xuICAgICAgICBpZiAocmVtb3ZlSW5kZXggPSByZXZTdG9yeUlkcy5pbmRleE9mIGpvdXJuYWxFbnRyeS5pZCkgIT0gLTFcbiAgICAgICAgICByZXZTdG9yeS5zcGxpY2UocmVtb3ZlSW5kZXgsMSlcbiAgICAgICN3aGVuICdmb3JrJyAgICMgZG8gbm90aGluZyB3aGVuIGZvcmtcbiAgcmV0dXJuIHtzdG9yeTogcmV2U3RvcnksIGpvdXJuYWw6IHJldkpvdXJuYWwsIHRpdGxlOiByZXZUaXRsZX1cblxuZXhwb3J0cy5jcmVhdGUgPSBjcmVhdGUiLCIoZnVuY3Rpb24oKXsvLyAgICAgVW5kZXJzY29yZS5qcyAxLjQuNFxuLy8gICAgIGh0dHA6Ly91bmRlcnNjb3JlanMub3JnXG4vLyAgICAgKGMpIDIwMDktMjAxMyBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgSW5jLlxuLy8gICAgIFVuZGVyc2NvcmUgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG5cbihmdW5jdGlvbigpIHtcblxuICAvLyBCYXNlbGluZSBzZXR1cFxuICAvLyAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEVzdGFibGlzaCB0aGUgcm9vdCBvYmplY3QsIGB3aW5kb3dgIGluIHRoZSBicm93c2VyLCBvciBgZ2xvYmFsYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBFc3RhYmxpc2ggdGhlIG9iamVjdCB0aGF0IGdldHMgcmV0dXJuZWQgdG8gYnJlYWsgb3V0IG9mIGEgbG9vcCBpdGVyYXRpb24uXG4gIHZhciBicmVha2VyID0ge307XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXIgcHVzaCAgICAgICAgICAgICA9IEFycmF5UHJvdG8ucHVzaCxcbiAgICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgICAgY29uY2F0ICAgICAgICAgICA9IEFycmF5UHJvdG8uY29uY2F0LFxuICAgICAgdG9TdHJpbmcgICAgICAgICA9IE9ialByb3RvLnRvU3RyaW5nLFxuICAgICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlRm9yRWFjaCAgICAgID0gQXJyYXlQcm90by5mb3JFYWNoLFxuICAgIG5hdGl2ZU1hcCAgICAgICAgICA9IEFycmF5UHJvdG8ubWFwLFxuICAgIG5hdGl2ZVJlZHVjZSAgICAgICA9IEFycmF5UHJvdG8ucmVkdWNlLFxuICAgIG5hdGl2ZVJlZHVjZVJpZ2h0ICA9IEFycmF5UHJvdG8ucmVkdWNlUmlnaHQsXG4gICAgbmF0aXZlRmlsdGVyICAgICAgID0gQXJyYXlQcm90by5maWx0ZXIsXG4gICAgbmF0aXZlRXZlcnkgICAgICAgID0gQXJyYXlQcm90by5ldmVyeSxcbiAgICBuYXRpdmVTb21lICAgICAgICAgPSBBcnJheVByb3RvLnNvbWUsXG4gICAgbmF0aXZlSW5kZXhPZiAgICAgID0gQXJyYXlQcm90by5pbmRleE9mLFxuICAgIG5hdGl2ZUxhc3RJbmRleE9mICA9IEFycmF5UHJvdG8ubGFzdEluZGV4T2YsXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZDtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyIFwiYWR2YW5jZWRcIiBtb2RlLlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjQuNCc7XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyBvYmplY3RzIHdpdGggdGhlIGJ1aWx0LWluIGBmb3JFYWNoYCwgYXJyYXlzLCBhbmQgcmF3IG9iamVjdHMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmb3JFYWNoYCBpZiBhdmFpbGFibGUuXG4gIHZhciBlYWNoID0gXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvYmoubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIGlmIChfLmhhcyhvYmosIGtleSkpIHtcbiAgICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSByZXN1bHRzIG9mIGFwcGx5aW5nIHRoZSBpdGVyYXRvciB0byBlYWNoIGVsZW1lbnQuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBtYXBgIGlmIGF2YWlsYWJsZS5cbiAgXy5tYXAgPSBfLmNvbGxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVNYXAgJiYgb2JqLm1hcCA9PT0gbmF0aXZlTWFwKSByZXR1cm4gb2JqLm1hcChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmVzdWx0c1tyZXN1bHRzLmxlbmd0aF0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgdmFyIHJlZHVjZUVycm9yID0gJ1JlZHVjZSBvZiBlbXB0eSBhcnJheSB3aXRoIG5vIGluaXRpYWwgdmFsdWUnO1xuXG4gIC8vICoqUmVkdWNlKiogYnVpbGRzIHVwIGEgc2luZ2xlIHJlc3VsdCBmcm9tIGEgbGlzdCBvZiB2YWx1ZXMsIGFrYSBgaW5qZWN0YCxcbiAgLy8gb3IgYGZvbGRsYC4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHJlZHVjZWAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZSA9IF8uZm9sZGwgPSBfLmluamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZSAmJiBvYmoucmVkdWNlID09PSBuYXRpdmVSZWR1Y2UpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2UoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZShpdGVyYXRvcik7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghaW5pdGlhbCkge1xuICAgICAgICBtZW1vID0gdmFsdWU7XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFRoZSByaWdodC1hc3NvY2lhdGl2ZSB2ZXJzaW9uIG9mIHJlZHVjZSwgYWxzbyBrbm93biBhcyBgZm9sZHJgLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlUmlnaHRgIGlmIGF2YWlsYWJsZS5cbiAgXy5yZWR1Y2VSaWdodCA9IF8uZm9sZHIgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBtZW1vLCBjb250ZXh0KSB7XG4gICAgdmFyIGluaXRpYWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcbiAgICBpZiAob2JqID09IG51bGwpIG9iaiA9IFtdO1xuICAgIGlmIChuYXRpdmVSZWR1Y2VSaWdodCAmJiBvYmoucmVkdWNlUmlnaHQgPT09IG5hdGl2ZVJlZHVjZVJpZ2h0KSB7XG4gICAgICBpZiAoY29udGV4dCkgaXRlcmF0b3IgPSBfLmJpbmQoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGluaXRpYWwgPyBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IsIG1lbW8pIDogb2JqLnJlZHVjZVJpZ2h0KGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCAhPT0gK2xlbmd0aCkge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGxlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgIH1cbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICBpbmRleCA9IGtleXMgPyBrZXlzWy0tbGVuZ3RoXSA6IC0tbGVuZ3RoO1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSBvYmpbaW5kZXhdO1xuICAgICAgICBpbml0aWFsID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lbW8gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG1lbW8sIG9ialtpbmRleF0sIGluZGV4LCBsaXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWluaXRpYWwpIHRocm93IG5ldyBUeXBlRXJyb3IocmVkdWNlRXJyb3IpO1xuICAgIHJldHVybiBtZW1vO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgZmlyc3QgdmFsdWUgd2hpY2ggcGFzc2VzIGEgdHJ1dGggdGVzdC4gQWxpYXNlZCBhcyBgZGV0ZWN0YC5cbiAgXy5maW5kID0gXy5kZXRlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdDtcbiAgICBhbnkob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHtcbiAgICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgdGhhdCBwYXNzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZpbHRlcmAgaWYgYXZhaWxhYmxlLlxuICAvLyBBbGlhc2VkIGFzIGBzZWxlY3RgLlxuICBfLmZpbHRlciA9IF8uc2VsZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0cztcbiAgICBpZiAobmF0aXZlRmlsdGVyICYmIG9iai5maWx0ZXIgPT09IG5hdGl2ZUZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gdmFsdWU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGFsbCB0aGUgZWxlbWVudHMgZm9yIHdoaWNoIGEgdHJ1dGggdGVzdCBmYWlscy5cbiAgXy5yZWplY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXR1cm4gIWl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9LCBjb250ZXh0KTtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciBhbGwgb2YgdGhlIGVsZW1lbnRzIG1hdGNoIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGV2ZXJ5YCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFsbGAuXG4gIF8uZXZlcnkgPSBfLmFsbCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZUV2ZXJ5ICYmIG9iai5ldmVyeSA9PT0gbmF0aXZlRXZlcnkpIHJldHVybiBvYmouZXZlcnkoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmICghKHJlc3VsdCA9IHJlc3VsdCAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpKSByZXR1cm4gYnJlYWtlcjtcbiAgICB9KTtcbiAgICByZXR1cm4gISFyZXN1bHQ7XG4gIH07XG5cbiAgLy8gRGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSBlbGVtZW50IGluIHRoZSBvYmplY3QgbWF0Y2hlcyBhIHRydXRoIHRlc3QuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBzb21lYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYGFueWAuXG4gIHZhciBhbnkgPSBfLnNvbWUgPSBfLmFueSA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciB8fCAoaXRlcmF0b3IgPSBfLmlkZW50aXR5KTtcbiAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIGlmIChuYXRpdmVTb21lICYmIG9iai5zb21lID09PSBuYXRpdmVTb21lKSByZXR1cm4gb2JqLnNvbWUoaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGlmIChyZXN1bHQgfHwgKHJlc3VsdCA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgdGhlIGFycmF5IG9yIG9iamVjdCBjb250YWlucyBhIGdpdmVuIHZhbHVlICh1c2luZyBgPT09YCkuXG4gIC8vIEFsaWFzZWQgYXMgYGluY2x1ZGVgLlxuICBfLmNvbnRhaW5zID0gXy5pbmNsdWRlID0gZnVuY3Rpb24ob2JqLCB0YXJnZXQpIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmF0aXZlSW5kZXhPZiAmJiBvYmouaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIG9iai5pbmRleE9mKHRhcmdldCkgIT0gLTE7XG4gICAgcmV0dXJuIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBJbnZva2UgYSBtZXRob2QgKHdpdGggYXJndW1lbnRzKSBvbiBldmVyeSBpdGVtIGluIGEgY29sbGVjdGlvbi5cbiAgXy5pbnZva2UgPSBmdW5jdGlvbihvYmosIG1ldGhvZCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBpc0Z1bmMgPSBfLmlzRnVuY3Rpb24obWV0aG9kKTtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmV0dXJuIChpc0Z1bmMgPyBtZXRob2QgOiB2YWx1ZVttZXRob2RdKS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgbWFwYDogZmV0Y2hpbmcgYSBwcm9wZXJ0eS5cbiAgXy5wbHVjayA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIF8ubWFwKG9iaiwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gdmFsdWVba2V5XTsgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmlsdGVyYDogc2VsZWN0aW5nIG9ubHkgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLndoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycywgZmlyc3QpIHtcbiAgICBpZiAoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuIGZpcnN0ID8gbnVsbCA6IFtdO1xuICAgIHJldHVybiBfW2ZpcnN0ID8gJ2ZpbmQnIDogJ2ZpbHRlciddKG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBhdHRycykge1xuICAgICAgICBpZiAoYXR0cnNba2V5XSAhPT0gdmFsdWVba2V5XSkgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ29udmVuaWVuY2UgdmVyc2lvbiBvZiBhIGNvbW1vbiB1c2UgY2FzZSBvZiBgZmluZGA6IGdldHRpbmcgdGhlIGZpcnN0IG9iamVjdFxuICAvLyBjb250YWluaW5nIHNwZWNpZmljIGBrZXk6dmFsdWVgIHBhaXJzLlxuICBfLmZpbmRXaGVyZSA9IGZ1bmN0aW9uKG9iaiwgYXR0cnMpIHtcbiAgICByZXR1cm4gXy53aGVyZShvYmosIGF0dHJzLCB0cnVlKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1heGltdW0gZWxlbWVudCBvciAoZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIC8vIENhbid0IG9wdGltaXplIGFycmF5cyBvZiBpbnRlZ2VycyBsb25nZXIgdGhhbiA2NSw1MzUgZWxlbWVudHMuXG4gIC8vIFNlZTogaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTgwNzk3XG4gIF8ubWF4ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiAtSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IC1JbmZpbml0eSwgdmFsdWU6IC1JbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkID49IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWluaW11bSBlbGVtZW50IChvciBlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgXy5taW4gPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5taW4uYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIEluZmluaXR5O1xuICAgIHZhciByZXN1bHQgPSB7Y29tcHV0ZWQgOiBJbmZpbml0eSwgdmFsdWU6IEluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPCByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBTaHVmZmxlIGFuIGFycmF5LlxuICBfLnNodWZmbGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmFuZDtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzaHVmZmxlZCA9IFtdO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKGluZGV4KyspO1xuICAgICAgc2h1ZmZsZWRbaW5kZXggLSAxXSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgbG9va3VwIGl0ZXJhdG9ycy5cbiAgdmFyIGxvb2t1cEl0ZXJhdG9yID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlIDogZnVuY3Rpb24ob2JqKXsgcmV0dXJuIG9ialt2YWx1ZV07IH07XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdG9yLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlIDogdmFsdWUsXG4gICAgICAgIGluZGV4IDogaW5kZXgsXG4gICAgICAgIGNyaXRlcmlhIDogaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggPCByaWdodC5pbmRleCA/IC0xIDogMTtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0LCBiZWhhdmlvcikge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcih2YWx1ZSB8fCBfLmlkZW50aXR5KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICB2YXIga2V5ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIG9iaik7XG4gICAgICBiZWhhdmlvcihyZXN1bHQsIGtleSwgdmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gR3JvdXBzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24uIFBhc3MgZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZVxuICAvLyB0byBncm91cCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGNyaXRlcmlvbi5cbiAgXy5ncm91cEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBncm91cChvYmosIHZhbHVlLCBjb250ZXh0LCBmdW5jdGlvbihyZXN1bHQsIGtleSwgdmFsdWUpIHtcbiAgICAgIChfLmhhcyhyZXN1bHQsIGtleSkgPyByZXN1bHRba2V5XSA6IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gQ291bnRzIGluc3RhbmNlcyBvZiBhbiBvYmplY3QgdGhhdCBncm91cCBieSBhIGNlcnRhaW4gY3JpdGVyaW9uLiBQYXNzXG4gIC8vIGVpdGhlciBhIHN0cmluZyBhdHRyaWJ1dGUgdG8gY291bnQgYnksIG9yIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZVxuICAvLyBjcml0ZXJpb24uXG4gIF8uY291bnRCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gZ3JvdXAob2JqLCB2YWx1ZSwgY29udGV4dCwgZnVuY3Rpb24ocmVzdWx0LCBrZXkpIHtcbiAgICAgIGlmICghXy5oYXMocmVzdWx0LCBrZXkpKSByZXN1bHRba2V5XSA9IDA7XG4gICAgICByZXN1bHRba2V5XSsrO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciA9IGl0ZXJhdG9yID09IG51bGwgPyBfLmlkZW50aXR5IDogbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgYXJyYXlbbWlkXSkgPCB2YWx1ZSA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjb252ZXJ0IGFueXRoaW5nIGl0ZXJhYmxlIGludG8gYSByZWFsLCBsaXZlIGFycmF5LlxuICBfLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuIFtdO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSkgcmV0dXJuIHNsaWNlLmNhbGwob2JqKTtcbiAgICBpZiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHJldHVybiBfLm1hcChvYmosIF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBfLnZhbHVlcyhvYmopO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGluIGFuIG9iamVjdC5cbiAgXy5zaXplID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gMDtcbiAgICByZXR1cm4gKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSA/IG9iai5sZW5ndGggOiBfLmtleXMob2JqKS5sZW5ndGg7XG4gIH07XG5cbiAgLy8gQXJyYXkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIEdldCB0aGUgZmlyc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgZmlyc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBBbGlhc2VkIGFzIGBoZWFkYCBhbmQgYHRha2VgLiBUaGUgKipndWFyZCoqIGNoZWNrXG4gIC8vIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5maXJzdCA9IF8uaGVhZCA9IF8udGFrZSA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIHJldHVybiAobiAhPSBudWxsKSAmJiAhZ3VhcmQgPyBzbGljZS5jYWxsKGFycmF5LCAwLCBuKSA6IGFycmF5WzBdO1xuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGxhc3QgZW50cnkgb2YgdGhlIGFycmF5LiBFc3BlY2lhbGx5IHVzZWZ1bCBvblxuICAvLyB0aGUgYXJndW1lbnRzIG9iamVjdC4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiBhbGwgdGhlIHZhbHVlcyBpblxuICAvLyB0aGUgYXJyYXksIGV4Y2x1ZGluZyB0aGUgbGFzdCBOLiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGhcbiAgLy8gYF8ubWFwYC5cbiAgXy5pbml0aWFsID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIDAsIGFycmF5Lmxlbmd0aCAtICgobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKSk7XG4gIH07XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGVsZW1lbnQgb2YgYW4gYXJyYXkuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gdGhlIGxhc3QgTlxuICAvLyB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5sYXN0ID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgaWYgKChuICE9IG51bGwpICYmICFndWFyZCkge1xuICAgICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIE1hdGgubWF4KGFycmF5Lmxlbmd0aCAtIG4sIDApKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKlxuICAvLyBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIG91dHB1dCkge1xuICAgIGVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICBzaGFsbG93ID8gcHVzaC5hcHBseShvdXRwdXQsIHZhbHVlKSA6IGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIG91dHB1dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb21wbGV0ZWx5IGZsYXR0ZW5lZCB2ZXJzaW9uIG9mIGFuIGFycmF5LlxuICBfLmZsYXR0ZW4gPSBmdW5jdGlvbihhcnJheSwgc2hhbGxvdykge1xuICAgIHJldHVybiBmbGF0dGVuKGFycmF5LCBzaGFsbG93LCBbXSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgdmVyc2lvbiBvZiB0aGUgYXJyYXkgdGhhdCBkb2VzIG5vdCBjb250YWluIHRoZSBzcGVjaWZpZWQgdmFsdWUocykuXG4gIF8ud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZGlmZmVyZW5jZShhcnJheSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGEgZHVwbGljYXRlLWZyZWUgdmVyc2lvbiBvZiB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgYWxyZWFkeVxuICAvLyBiZWVuIHNvcnRlZCwgeW91IGhhdmUgdGhlIG9wdGlvbiBvZiB1c2luZyBhIGZhc3RlciBhbGdvcml0aG0uXG4gIC8vIEFsaWFzZWQgYXMgYHVuaXF1ZWAuXG4gIF8udW5pcSA9IF8udW5pcXVlID0gZnVuY3Rpb24oYXJyYXksIGlzU29ydGVkLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChfLmlzRnVuY3Rpb24oaXNTb3J0ZWQpKSB7XG4gICAgICBjb250ZXh0ID0gaXRlcmF0b3I7XG4gICAgICBpdGVyYXRvciA9IGlzU29ydGVkO1xuICAgICAgaXNTb3J0ZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGluaXRpYWwgPSBpdGVyYXRvciA/IF8ubWFwKGFycmF5LCBpdGVyYXRvciwgY29udGV4dCkgOiBhcnJheTtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciBzZWVuID0gW107XG4gICAgZWFjaChpbml0aWFsLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIGlmIChpc1NvcnRlZCA/ICghaW5kZXggfHwgc2VlbltzZWVuLmxlbmd0aCAtIDFdICE9PSB2YWx1ZSkgOiAhXy5jb250YWlucyhzZWVuLCB2YWx1ZSkpIHtcbiAgICAgICAgc2Vlbi5wdXNoKHZhbHVlKTtcbiAgICAgICAgcmVzdWx0cy5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSB1bmlvbjogZWFjaCBkaXN0aW5jdCBlbGVtZW50IGZyb20gYWxsIG9mXG4gIC8vIHRoZSBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLnVuaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8udW5pcShjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgYXJndW1lbnRzKSk7XG4gIH07XG5cbiAgLy8gUHJvZHVjZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIGV2ZXJ5IGl0ZW0gc2hhcmVkIGJldHdlZW4gYWxsIHRoZVxuICAvLyBwYXNzZWQtaW4gYXJyYXlzLlxuICBfLmludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF8uZmlsdGVyKF8udW5pcShhcnJheSksIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiBfLmV2ZXJ5KHJlc3QsIGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICAgIHJldHVybiBfLmluZGV4T2Yob3RoZXIsIGl0ZW0pID49IDA7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBUYWtlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gb25lIGFycmF5IGFuZCBhIG51bWJlciBvZiBvdGhlciBhcnJheXMuXG4gIC8vIE9ubHkgdGhlIGVsZW1lbnRzIHByZXNlbnQgaW4ganVzdCB0aGUgZmlyc3QgYXJyYXkgd2lsbCByZW1haW4uXG4gIF8uZGlmZmVyZW5jZSA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3QgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKXsgcmV0dXJuICFfLmNvbnRhaW5zKHJlc3QsIHZhbHVlKTsgfSk7XG4gIH07XG5cbiAgLy8gWmlwIHRvZ2V0aGVyIG11bHRpcGxlIGxpc3RzIGludG8gYSBzaW5nbGUgYXJyYXkgLS0gZWxlbWVudHMgdGhhdCBzaGFyZVxuICAvLyBhbiBpbmRleCBnbyB0b2dldGhlci5cbiAgXy56aXAgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICB2YXIgbGVuZ3RoID0gXy5tYXgoXy5wbHVjayhhcmdzLCAnbGVuZ3RoJykpO1xuICAgIHZhciByZXN1bHRzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0c1tpXSA9IF8ucGx1Y2soYXJncywgXCJcIiArIGkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBDb252ZXJ0cyBsaXN0cyBpbnRvIG9iamVjdHMuIFBhc3MgZWl0aGVyIGEgc2luZ2xlIGFycmF5IG9mIGBba2V5LCB2YWx1ZV1gXG4gIC8vIHBhaXJzLCBvciB0d28gcGFyYWxsZWwgYXJyYXlzIG9mIHRoZSBzYW1lIGxlbmd0aCAtLSBvbmUgb2Yga2V5cywgYW5kIG9uZSBvZlxuICAvLyB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXMuXG4gIF8ub2JqZWN0ID0gZnVuY3Rpb24obGlzdCwgdmFsdWVzKSB7XG4gICAgaWYgKGxpc3QgPT0gbnVsbCkgcmV0dXJuIHt9O1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpc3QubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldXSA9IHZhbHVlc1tpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdFtsaXN0W2ldWzBdXSA9IGxpc3RbaV1bMV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgLy8gSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwbHkgdXMgd2l0aCBpbmRleE9mIChJJ20gbG9va2luZyBhdCB5b3UsICoqTVNJRSoqKSxcbiAgLy8gd2UgbmVlZCB0aGlzIGZ1bmN0aW9uLiBSZXR1cm4gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGFuXG4gIC8vIGl0ZW0gaW4gYW4gYXJyYXksIG9yIC0xIGlmIHRoZSBpdGVtIGlzIG5vdCBpbmNsdWRlZCBpbiB0aGUgYXJyYXkuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBpbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIC8vIElmIHRoZSBhcnJheSBpcyBsYXJnZSBhbmQgYWxyZWFkeSBpbiBzb3J0IG9yZGVyLCBwYXNzIGB0cnVlYFxuICAvLyBmb3IgKippc1NvcnRlZCoqIHRvIHVzZSBiaW5hcnkgc2VhcmNoLlxuICBfLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgaXNTb3J0ZWQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIC0xO1xuICAgIHZhciBpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDtcbiAgICBpZiAoaXNTb3J0ZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgaXNTb3J0ZWQgPT0gJ251bWJlcicpIHtcbiAgICAgICAgaSA9IChpc1NvcnRlZCA8IDAgPyBNYXRoLm1heCgwLCBsICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaV0gPT09IGl0ZW0gPyBpIDogLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIGFycmF5LmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBhcnJheS5pbmRleE9mKGl0ZW0sIGlzU29ydGVkKTtcbiAgICBmb3IgKDsgaSA8IGw7IGkrKykgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGxhc3RJbmRleE9mYCBpZiBhdmFpbGFibGUuXG4gIF8ubGFzdEluZGV4T2YgPSBmdW5jdGlvbihhcnJheSwgaXRlbSwgZnJvbSkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGhhc0luZGV4ID0gZnJvbSAhPSBudWxsO1xuICAgIGlmIChuYXRpdmVMYXN0SW5kZXhPZiAmJiBhcnJheS5sYXN0SW5kZXhPZiA9PT0gbmF0aXZlTGFzdEluZGV4T2YpIHtcbiAgICAgIHJldHVybiBoYXNJbmRleCA/IGFycmF5Lmxhc3RJbmRleE9mKGl0ZW0sIGZyb20pIDogYXJyYXkubGFzdEluZGV4T2YoaXRlbSk7XG4gICAgfVxuICAgIHZhciBpID0gKGhhc0luZGV4ID8gZnJvbSA6IGFycmF5Lmxlbmd0aCk7XG4gICAgd2hpbGUgKGktLSkgaWYgKGFycmF5W2ldID09PSBpdGVtKSByZXR1cm4gaTtcbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgYW4gaW50ZWdlciBBcnJheSBjb250YWluaW5nIGFuIGFyaXRobWV0aWMgcHJvZ3Jlc3Npb24uIEEgcG9ydCBvZlxuICAvLyB0aGUgbmF0aXZlIFB5dGhvbiBgcmFuZ2UoKWAgZnVuY3Rpb24uIFNlZVxuICAvLyBbdGhlIFB5dGhvbiBkb2N1bWVudGF0aW9uXShodHRwOi8vZG9jcy5weXRob24ub3JnL2xpYnJhcnkvZnVuY3Rpb25zLmh0bWwjcmFuZ2UpLlxuICBfLnJhbmdlID0gZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8PSAxKSB7XG4gICAgICBzdG9wID0gc3RhcnQgfHwgMDtcbiAgICAgIHN0YXJ0ID0gMDtcbiAgICB9XG4gICAgc3RlcCA9IGFyZ3VtZW50c1syXSB8fCAxO1xuXG4gICAgdmFyIGxlbiA9IE1hdGgubWF4KE1hdGguY2VpbCgoc3RvcCAtIHN0YXJ0KSAvIHN0ZXApLCAwKTtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgQXJyYXkobGVuKTtcblxuICAgIHdoaWxlKGlkeCA8IGxlbikge1xuICAgICAgcmFuZ2VbaWR4KytdID0gc3RhcnQ7XG4gICAgICBzdGFydCArPSBzdGVwO1xuICAgIH1cblxuICAgIHJldHVybiByYW5nZTtcbiAgfTtcblxuICAvLyBGdW5jdGlvbiAoYWhlbSkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIENyZWF0ZSBhIGZ1bmN0aW9uIGJvdW5kIHRvIGEgZ2l2ZW4gb2JqZWN0IChhc3NpZ25pbmcgYHRoaXNgLCBhbmQgYXJndW1lbnRzLFxuICAvLyBvcHRpb25hbGx5KS4gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYEZ1bmN0aW9uLmJpbmRgIGlmXG4gIC8vIGF2YWlsYWJsZS5cbiAgXy5iaW5kID0gZnVuY3Rpb24oZnVuYywgY29udGV4dCkge1xuICAgIGlmIChmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQgJiYgbmF0aXZlQmluZCkgcmV0dXJuIG5hdGl2ZUJpbmQuYXBwbHkoZnVuYywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFBhcnRpYWxseSBhcHBseSBhIGZ1bmN0aW9uIGJ5IGNyZWF0aW5nIGEgdmVyc2lvbiB0aGF0IGhhcyBoYWQgc29tZSBvZiBpdHNcbiAgLy8gYXJndW1lbnRzIHByZS1maWxsZWQsIHdpdGhvdXQgY2hhbmdpbmcgaXRzIGR5bmFtaWMgYHRoaXNgIGNvbnRleHQuXG4gIF8ucGFydGlhbCA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIEJpbmQgYWxsIG9mIGFuIG9iamVjdCdzIG1ldGhvZHMgdG8gdGhhdCBvYmplY3QuIFVzZWZ1bCBmb3IgZW5zdXJpbmcgdGhhdFxuICAvLyBhbGwgY2FsbGJhY2tzIGRlZmluZWQgb24gYW4gb2JqZWN0IGJlbG9uZyB0byBpdC5cbiAgXy5iaW5kQWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGZ1bmNzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGlmIChmdW5jcy5sZW5ndGggPT09IDApIGZ1bmNzID0gXy5mdW5jdGlvbnMob2JqKTtcbiAgICBlYWNoKGZ1bmNzLCBmdW5jdGlvbihmKSB7IG9ialtmXSA9IF8uYmluZChvYmpbZl0sIG9iaik7IH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW8gPSB7fTtcbiAgICBoYXNoZXIgfHwgKGhhc2hlciA9IF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfLmhhcyhtZW1vLCBrZXkpID8gbWVtb1trZXldIDogKG1lbW9ba2V5XSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpeyByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTsgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgcmV0dXJuIF8uZGVsYXkuYXBwbHkoXywgW2Z1bmMsIDFdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0KSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHRpbWVvdXQsIHJlc3VsdDtcbiAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBuZXcgRGF0ZTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIHJlc3VsdDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIGlmICghaW1tZWRpYXRlKSByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfTtcbiAgICAgIHZhciBjYWxsTm93ID0gaW1tZWRpYXRlICYmICF0aW1lb3V0O1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHdhaXQpO1xuICAgICAgaWYgKGNhbGxOb3cpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBleGVjdXRlZCBhdCBtb3N0IG9uZSB0aW1lLCBubyBtYXR0ZXIgaG93XG4gIC8vIG9mdGVuIHlvdSBjYWxsIGl0LiBVc2VmdWwgZm9yIGxhenkgaW5pdGlhbGl6YXRpb24uXG4gIF8ub25jZSA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgcmFuID0gZmFsc2UsIG1lbW87XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHJhbikgcmV0dXJuIG1lbW87XG4gICAgICByYW4gPSB0cnVlO1xuICAgICAgbWVtbyA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIGZ1bmMgPSBudWxsO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIHRoZSBmaXJzdCBmdW5jdGlvbiBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIHNlY29uZCxcbiAgLy8gYWxsb3dpbmcgeW91IHRvIGFkanVzdCBhcmd1bWVudHMsIHJ1biBjb2RlIGJlZm9yZSBhbmQgYWZ0ZXIsIGFuZFxuICAvLyBjb25kaXRpb25hbGx5IGV4ZWN1dGUgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLlxuICBfLndyYXAgPSBmdW5jdGlvbihmdW5jLCB3cmFwcGVyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbZnVuY107XG4gICAgICBwdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGlzIHRoZSBjb21wb3NpdGlvbiBvZiBhIGxpc3Qgb2YgZnVuY3Rpb25zLCBlYWNoXG4gIC8vIGNvbnN1bWluZyB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBmdW5jdGlvbiB0aGF0IGZvbGxvd3MuXG4gIF8uY29tcG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBmdW5jcyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGZvciAodmFyIGkgPSBmdW5jcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBhcmdzID0gW2Z1bmNzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhcmdzWzBdO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGFmdGVyIGJlaW5nIGNhbGxlZCBOIHRpbWVzLlxuICBfLmFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICBpZiAodGltZXMgPD0gMCkgcmV0dXJuIGZ1bmMoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoLS10aW1lcyA8IDEpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG4gIC8vIE9iamVjdCBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFJldHJpZXZlIHRoZSBuYW1lcyBvZiBhbiBvYmplY3QncyBwcm9wZXJ0aWVzLlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgT2JqZWN0LmtleXNgXG4gIF8ua2V5cyA9IG5hdGl2ZUtleXMgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKG9iaiAhPT0gT2JqZWN0KG9iaikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgb2JqZWN0Jyk7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBrZXlzW2tleXMubGVuZ3RoXSA9IGtleTtcbiAgICByZXR1cm4ga2V5cztcbiAgfTtcblxuICAvLyBSZXRyaWV2ZSB0aGUgdmFsdWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIF8udmFsdWVzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHZhbHVlcy5wdXNoKG9ialtrZXldKTtcbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHBhaXJzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcGFpcnMucHVzaChba2V5LCBvYmpba2V5XV0pO1xuICAgIHJldHVybiBwYWlycztcbiAgfTtcblxuICAvLyBJbnZlcnQgdGhlIGtleXMgYW5kIHZhbHVlcyBvZiBhbiBvYmplY3QuIFRoZSB2YWx1ZXMgbXVzdCBiZSBzZXJpYWxpemFibGUuXG4gIF8uaW52ZXJ0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJlc3VsdFtvYmpba2V5XV0gPSBrZXk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBzb3J0ZWQgbGlzdCBvZiB0aGUgZnVuY3Rpb24gbmFtZXMgYXZhaWxhYmxlIG9uIHRoZSBvYmplY3QuXG4gIC8vIEFsaWFzZWQgYXMgYG1ldGhvZHNgXG4gIF8uZnVuY3Rpb25zID0gXy5tZXRob2RzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIG5hbWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihvYmpba2V5XSkpIG5hbWVzLnB1c2goa2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzLnNvcnQoKTtcbiAgfTtcblxuICAvLyBFeHRlbmQgYSBnaXZlbiBvYmplY3Qgd2l0aCBhbGwgdGhlIHByb3BlcnRpZXMgaW4gcGFzc2VkLWluIG9iamVjdChzKS5cbiAgXy5leHRlbmQgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgb25seSBjb250YWluaW5nIHRoZSB3aGl0ZWxpc3RlZCBwcm9wZXJ0aWVzLlxuICBfLnBpY2sgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgY29weSA9IHt9O1xuICAgIHZhciBrZXlzID0gY29uY2F0LmFwcGx5KEFycmF5UHJvdG8sIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgZWFjaChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChrZXkgaW4gb2JqKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICAgLy8gUmV0dXJuIGEgY29weSBvZiB0aGUgb2JqZWN0IHdpdGhvdXQgdGhlIGJsYWNrbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ub21pdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoIV8uY29udGFpbnMoa2V5cywga2V5KSkgY29weVtrZXldID0gb2JqW2tleV07XG4gICAgfVxuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIC8vIEZpbGwgaW4gYSBnaXZlbiBvYmplY3Qgd2l0aCBkZWZhdWx0IHByb3BlcnRpZXMuXG4gIF8uZGVmYXVsdHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICBpZiAoc291cmNlKSB7XG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgaWYgKG9ialtwcm9wXSA9PSBudWxsKSBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIENyZWF0ZSBhIChzaGFsbG93LWNsb25lZCkgZHVwbGljYXRlIG9mIGFuIG9iamVjdC5cbiAgXy5jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghXy5pc09iamVjdChvYmopKSByZXR1cm4gb2JqO1xuICAgIHJldHVybiBfLmlzQXJyYXkob2JqKSA/IG9iai5zbGljZSgpIDogXy5leHRlbmQoe30sIG9iaik7XG4gIH07XG5cbiAgLy8gSW52b2tlcyBpbnRlcmNlcHRvciB3aXRoIHRoZSBvYmosIGFuZCB0aGVuIHJldHVybnMgb2JqLlxuICAvLyBUaGUgcHJpbWFyeSBwdXJwb3NlIG9mIHRoaXMgbWV0aG9kIGlzIHRvIFwidGFwIGludG9cIiBhIG1ldGhvZCBjaGFpbiwgaW5cbiAgLy8gb3JkZXIgdG8gcGVyZm9ybSBvcGVyYXRpb25zIG9uIGludGVybWVkaWF0ZSByZXN1bHRzIHdpdGhpbiB0aGUgY2hhaW4uXG4gIF8udGFwID0gZnVuY3Rpb24ob2JqLCBpbnRlcmNlcHRvcikge1xuICAgIGludGVyY2VwdG9yKG9iaik7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCByZWN1cnNpdmUgY29tcGFyaXNvbiBmdW5jdGlvbiBmb3IgYGlzRXF1YWxgLlxuICB2YXIgZXEgPSBmdW5jdGlvbihhLCBiLCBhU3RhY2ssIGJTdGFjaykge1xuICAgIC8vIElkZW50aWNhbCBvYmplY3RzIGFyZSBlcXVhbC4gYDAgPT09IC0wYCwgYnV0IHRoZXkgYXJlbid0IGlkZW50aWNhbC5cbiAgICAvLyBTZWUgdGhlIEhhcm1vbnkgYGVnYWxgIHByb3Bvc2FsOiBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmVnYWwuXG4gICAgaWYgKGEgPT09IGIpIHJldHVybiBhICE9PSAwIHx8IDEgLyBhID09IDEgLyBiO1xuICAgIC8vIEEgc3RyaWN0IGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5IGJlY2F1c2UgYG51bGwgPT0gdW5kZWZpbmVkYC5cbiAgICBpZiAoYSA9PSBudWxsIHx8IGIgPT0gbnVsbCkgcmV0dXJuIGEgPT09IGI7XG4gICAgLy8gVW53cmFwIGFueSB3cmFwcGVkIG9iamVjdHMuXG4gICAgaWYgKGEgaW5zdGFuY2VvZiBfKSBhID0gYS5fd3JhcHBlZDtcbiAgICBpZiAoYiBpbnN0YW5jZW9mIF8pIGIgPSBiLl93cmFwcGVkO1xuICAgIC8vIENvbXBhcmUgYFtbQ2xhc3NdXWAgbmFtZXMuXG4gICAgdmFyIGNsYXNzTmFtZSA9IHRvU3RyaW5nLmNhbGwoYSk7XG4gICAgaWYgKGNsYXNzTmFtZSAhPSB0b1N0cmluZy5jYWxsKGIpKSByZXR1cm4gZmFsc2U7XG4gICAgc3dpdGNoIChjbGFzc05hbWUpIHtcbiAgICAgIC8vIFN0cmluZ3MsIG51bWJlcnMsIGRhdGVzLCBhbmQgYm9vbGVhbnMgYXJlIGNvbXBhcmVkIGJ5IHZhbHVlLlxuICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgLy8gUHJpbWl0aXZlcyBhbmQgdGhlaXIgY29ycmVzcG9uZGluZyBvYmplY3Qgd3JhcHBlcnMgYXJlIGVxdWl2YWxlbnQ7IHRodXMsIGBcIjVcImAgaXNcbiAgICAgICAgLy8gZXF1aXZhbGVudCB0byBgbmV3IFN0cmluZyhcIjVcIilgLlxuICAgICAgICByZXR1cm4gYSA9PSBTdHJpbmcoYik7XG4gICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAvLyBgTmFOYHMgYXJlIGVxdWl2YWxlbnQsIGJ1dCBub24tcmVmbGV4aXZlLiBBbiBgZWdhbGAgY29tcGFyaXNvbiBpcyBwZXJmb3JtZWQgZm9yXG4gICAgICAgIC8vIG90aGVyIG51bWVyaWMgdmFsdWVzLlxuICAgICAgICByZXR1cm4gYSAhPSArYSA/IGIgIT0gK2IgOiAoYSA9PSAwID8gMSAvIGEgPT0gMSAvIGIgOiBhID09ICtiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgY2FzZSAnW29iamVjdCBCb29sZWFuXSc6XG4gICAgICAgIC8vIENvZXJjZSBkYXRlcyBhbmQgYm9vbGVhbnMgdG8gbnVtZXJpYyBwcmltaXRpdmUgdmFsdWVzLiBEYXRlcyBhcmUgY29tcGFyZWQgYnkgdGhlaXJcbiAgICAgICAgLy8gbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zLiBOb3RlIHRoYXQgaW52YWxpZCBkYXRlcyB3aXRoIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9uc1xuICAgICAgICAvLyBvZiBgTmFOYCBhcmUgbm90IGVxdWl2YWxlbnQuXG4gICAgICAgIHJldHVybiArYSA9PSArYjtcbiAgICAgIC8vIFJlZ0V4cHMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyIHNvdXJjZSBwYXR0ZXJucyBhbmQgZmxhZ3MuXG4gICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICByZXR1cm4gYS5zb3VyY2UgPT0gYi5zb3VyY2UgJiZcbiAgICAgICAgICAgICAgIGEuZ2xvYmFsID09IGIuZ2xvYmFsICYmXG4gICAgICAgICAgICAgICBhLm11bHRpbGluZSA9PSBiLm11bHRpbGluZSAmJlxuICAgICAgICAgICAgICAgYS5pZ25vcmVDYXNlID09IGIuaWdub3JlQ2FzZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhICE9ICdvYmplY3QnIHx8IHR5cGVvZiBiICE9ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgLy8gQXNzdW1lIGVxdWFsaXR5IGZvciBjeWNsaWMgc3RydWN0dXJlcy4gVGhlIGFsZ29yaXRobSBmb3IgZGV0ZWN0aW5nIGN5Y2xpY1xuICAgIC8vIHN0cnVjdHVyZXMgaXMgYWRhcHRlZCBmcm9tIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMsIGFic3RyYWN0IG9wZXJhdGlvbiBgSk9gLlxuICAgIHZhciBsZW5ndGggPSBhU3RhY2subGVuZ3RoO1xuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgLy8gTGluZWFyIHNlYXJjaC4gUGVyZm9ybWFuY2UgaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mXG4gICAgICAvLyB1bmlxdWUgbmVzdGVkIHN0cnVjdHVyZXMuXG4gICAgICBpZiAoYVN0YWNrW2xlbmd0aF0gPT0gYSkgcmV0dXJuIGJTdGFja1tsZW5ndGhdID09IGI7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucHVzaChhKTtcbiAgICBiU3RhY2sucHVzaChiKTtcbiAgICB2YXIgc2l6ZSA9IDAsIHJlc3VsdCA9IHRydWU7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYi5sZW5ndGg7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBlcShhW3NpemVdLCBiW3NpemVdLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPYmplY3RzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWl2YWxlbnQsIGJ1dCBgT2JqZWN0YHNcbiAgICAgIC8vIGZyb20gZGlmZmVyZW50IGZyYW1lcyBhcmUuXG4gICAgICB2YXIgYUN0b3IgPSBhLmNvbnN0cnVjdG9yLCBiQ3RvciA9IGIuY29uc3RydWN0b3I7XG4gICAgICBpZiAoYUN0b3IgIT09IGJDdG9yICYmICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiAoYUN0b3IgaW5zdGFuY2VvZiBhQ3RvcikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmlzRnVuY3Rpb24oYkN0b3IpICYmIChiQ3RvciBpbnN0YW5jZW9mIGJDdG9yKSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gRGVlcCBjb21wYXJlIG9iamVjdHMuXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgICBpZiAoXy5oYXMoYSwga2V5KSkge1xuICAgICAgICAgIC8vIENvdW50IHRoZSBleHBlY3RlZCBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgLy8gRGVlcCBjb21wYXJlIGVhY2ggbWVtYmVyLlxuICAgICAgICAgIGlmICghKHJlc3VsdCA9IF8uaGFzKGIsIGtleSkgJiYgZXEoYVtrZXldLCBiW2tleV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBFbnN1cmUgdGhhdCBib3RoIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBudW1iZXIgb2YgcHJvcGVydGllcy5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgZm9yIChrZXkgaW4gYikge1xuICAgICAgICAgIGlmIChfLmhhcyhiLCBrZXkpICYmICEoc2l6ZS0tKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gIXNpemU7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFJlbW92ZSB0aGUgZmlyc3Qgb2JqZWN0IGZyb20gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wb3AoKTtcbiAgICBiU3RhY2sucG9wKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBQZXJmb3JtIGEgZGVlcCBjb21wYXJpc29uIHRvIGNoZWNrIGlmIHR3byBvYmplY3RzIGFyZSBlcXVhbC5cbiAgXy5pc0VxdWFsID0gZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBlcShhLCBiLCBbXSwgW10pO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gYXJyYXksIHN0cmluZywgb3Igb2JqZWN0IGVtcHR5P1xuICAvLyBBbiBcImVtcHR5XCIgb2JqZWN0IGhhcyBubyBlbnVtZXJhYmxlIG93bi1wcm9wZXJ0aWVzLlxuICBfLmlzRW1wdHkgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChfLmlzQXJyYXkob2JqKSB8fCBfLmlzU3RyaW5nKG9iaikpIHJldHVybiBvYmoubGVuZ3RoID09PSAwO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgRE9NIGVsZW1lbnQ/XG4gIF8uaXNFbGVtZW50ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuICEhKG9iaiAmJiBvYmoubm9kZVR5cGUgPT09IDEpO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYW4gYXJyYXk/XG4gIC8vIERlbGVnYXRlcyB0byBFQ01BNSdzIG5hdGl2ZSBBcnJheS5pc0FycmF5XG4gIF8uaXNBcnJheSA9IG5hdGl2ZUlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFyaWFibGUgYW4gb2JqZWN0P1xuICBfLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gT2JqZWN0KG9iaik7XG4gIH07XG5cbiAgLy8gQWRkIHNvbWUgaXNUeXBlIG1ldGhvZHM6IGlzQXJndW1lbnRzLCBpc0Z1bmN0aW9uLCBpc1N0cmluZywgaXNOdW1iZXIsIGlzRGF0ZSwgaXNSZWdFeHAuXG4gIGVhY2goWydBcmd1bWVudHMnLCAnRnVuY3Rpb24nLCAnU3RyaW5nJywgJ051bWJlcicsICdEYXRlJywgJ1JlZ0V4cCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgX1snaXMnICsgbmFtZV0gPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gICAgfTtcbiAgfSk7XG5cbiAgLy8gRGVmaW5lIGEgZmFsbGJhY2sgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIGluIGJyb3dzZXJzIChhaGVtLCBJRSksIHdoZXJlXG4gIC8vIHRoZXJlIGlzbid0IGFueSBpbnNwZWN0YWJsZSBcIkFyZ3VtZW50c1wiIHR5cGUuXG4gIGlmICghXy5pc0FyZ3VtZW50cyhhcmd1bWVudHMpKSB7XG4gICAgXy5pc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuICEhKG9iaiAmJiBfLmhhcyhvYmosICdjYWxsZWUnKSk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIE9wdGltaXplIGBpc0Z1bmN0aW9uYCBpZiBhcHByb3ByaWF0ZS5cbiAgaWYgKHR5cGVvZiAoLy4vKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIF8uaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbic7XG4gICAgfTtcbiAgfVxuXG4gIC8vIElzIGEgZ2l2ZW4gb2JqZWN0IGEgZmluaXRlIG51bWJlcj9cbiAgXy5pc0Zpbml0ZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBpc0Zpbml0ZShvYmopICYmICFpc05hTihwYXJzZUZsb2F0KG9iaikpO1xuICB9O1xuXG4gIC8vIElzIHRoZSBnaXZlbiB2YWx1ZSBgTmFOYD8gKE5hTiBpcyB0aGUgb25seSBudW1iZXIgd2hpY2ggZG9lcyBub3QgZXF1YWwgaXRzZWxmKS5cbiAgXy5pc05hTiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBfLmlzTnVtYmVyKG9iaikgJiYgb2JqICE9ICtvYmo7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhIGJvb2xlYW4/XG4gIF8uaXNCb29sZWFuID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gdHJ1ZSB8fCBvYmogPT09IGZhbHNlIHx8IHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBCb29sZWFuXSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBlcXVhbCB0byBudWxsP1xuICBfLmlzTnVsbCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IG51bGw7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSB1bmRlZmluZWQ/XG4gIF8uaXNVbmRlZmluZWQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB2b2lkIDA7XG4gIH07XG5cbiAgLy8gU2hvcnRjdXQgZnVuY3Rpb24gZm9yIGNoZWNraW5nIGlmIGFuIG9iamVjdCBoYXMgYSBnaXZlbiBwcm9wZXJ0eSBkaXJlY3RseVxuICAvLyBvbiBpdHNlbGYgKGluIG90aGVyIHdvcmRzLCBub3Qgb24gYSBwcm90b3R5cGUpLlxuICBfLmhhcyA9IGZ1bmN0aW9uKG9iaiwga2V5KSB7XG4gICAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpO1xuICB9O1xuXG4gIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUnVuIFVuZGVyc2NvcmUuanMgaW4gKm5vQ29uZmxpY3QqIG1vZGUsIHJldHVybmluZyB0aGUgYF9gIHZhcmlhYmxlIHRvIGl0c1xuICAvLyBwcmV2aW91cyBvd25lci4gUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHJvb3QuXyA9IHByZXZpb3VzVW5kZXJzY29yZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvLyBLZWVwIHRoZSBpZGVudGl0eSBmdW5jdGlvbiBhcm91bmQgZm9yIGRlZmF1bHQgaXRlcmF0b3JzLlxuICBfLmlkZW50aXR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgLy8gUnVuIGEgZnVuY3Rpb24gKipuKiogdGltZXMuXG4gIF8udGltZXMgPSBmdW5jdGlvbihuLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIHZhciBhY2N1bSA9IEFycmF5KG4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgZXNjYXBlOiB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyYjeDI3OycsXG4gICAgICAnLyc6ICcmI3gyRjsnXG4gICAgfVxuICB9O1xuICBlbnRpdHlNYXAudW5lc2NhcGUgPSBfLmludmVydChlbnRpdHlNYXAuZXNjYXBlKTtcblxuICAvLyBSZWdleGVzIGNvbnRhaW5pbmcgdGhlIGtleXMgYW5kIHZhbHVlcyBsaXN0ZWQgaW1tZWRpYXRlbHkgYWJvdmUuXG4gIHZhciBlbnRpdHlSZWdleGVzID0ge1xuICAgIGVzY2FwZTogICBuZXcgUmVnRXhwKCdbJyArIF8ua2V5cyhlbnRpdHlNYXAuZXNjYXBlKS5qb2luKCcnKSArICddJywgJ2cnKSxcbiAgICB1bmVzY2FwZTogbmV3IFJlZ0V4cCgnKCcgKyBfLmtleXMoZW50aXR5TWFwLnVuZXNjYXBlKS5qb2luKCd8JykgKyAnKScsICdnJylcbiAgfTtcblxuICAvLyBGdW5jdGlvbnMgZm9yIGVzY2FwaW5nIGFuZCB1bmVzY2FwaW5nIHN0cmluZ3MgdG8vZnJvbSBIVE1MIGludGVycG9sYXRpb24uXG4gIF8uZWFjaChbJ2VzY2FwZScsICd1bmVzY2FwZSddLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgICBfW21ldGhvZF0gPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgIGlmIChzdHJpbmcgPT0gbnVsbCkgcmV0dXJuICcnO1xuICAgICAgcmV0dXJuICgnJyArIHN0cmluZykucmVwbGFjZShlbnRpdHlSZWdleGVzW21ldGhvZF0sIGZ1bmN0aW9uKG1hdGNoKSB7XG4gICAgICAgIHJldHVybiBlbnRpdHlNYXBbbWV0aG9kXVttYXRjaF07XG4gICAgICB9KTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBJZiB0aGUgdmFsdWUgb2YgdGhlIG5hbWVkIHByb3BlcnR5IGlzIGEgZnVuY3Rpb24gdGhlbiBpbnZva2UgaXQ7XG4gIC8vIG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgcmV0dXJuIF8uaXNGdW5jdGlvbih2YWx1ZSkgPyB2YWx1ZS5jYWxsKG9iamVjdCkgOiB2YWx1ZTtcbiAgfTtcblxuICAvLyBBZGQgeW91ciBvd24gY3VzdG9tIGZ1bmN0aW9ucyB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QuXG4gIF8ubWl4aW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICBlYWNoKF8uZnVuY3Rpb25zKG9iaiksIGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdCc6ICAgICAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdHxcXHUyMDI4fFxcdTIwMjkvZztcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgZGF0YSwgc2V0dGluZ3MpIHtcbiAgICB2YXIgcmVuZGVyO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAgIC5yZXBsYWNlKGVzY2FwZXIsIGZ1bmN0aW9uKG1hdGNoKSB7IHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTsgfSk7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyBcInJldHVybiBfX3A7XFxuXCI7XG5cbiAgICB0cnkge1xuICAgICAgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGlmIChkYXRhKSByZXR1cm4gcmVuZGVyKGRhdGEsIF8pO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24gc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonKSArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLCB3aGljaCB3aWxsIGRlbGVnYXRlIHRvIHRoZSB3cmFwcGVyLlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8ob2JqKS5jaGFpbigpO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PSAnc2hpZnQnIHx8IG5hbWUgPT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgb2JqKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYWxsIGFjY2Vzc29yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICBfLmV4dGVuZChfLnByb3RvdHlwZSwge1xuXG4gICAgLy8gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2NoYWluID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgICB9XG5cbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG5cbn0pKCkiLCJ1dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSAoam91cm5hbEVsZW1lbnQsIGFjdGlvbikgLT5cbiAgcGFnZUVsZW1lbnQgPSBqb3VybmFsRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIHByZXYgPSBqb3VybmFsRWxlbWVudC5maW5kKFwiLmVkaXRbZGF0YS1pZD0je2FjdGlvbi5pZCB8fCAwfV1cIikgaWYgYWN0aW9uLnR5cGUgPT0gJ2VkaXQnXG4gIGFjdGlvblRpdGxlID0gYWN0aW9uLnR5cGVcbiAgYWN0aW9uVGl0bGUgKz0gXCIgI3t1dGlsLmZvcm1hdEVsYXBzZWRUaW1lKGFjdGlvbi5kYXRlKX1cIiBpZiBhY3Rpb24uZGF0ZT9cbiAgYWN0aW9uRWxlbWVudCA9ICQoXCJcIlwiPGEgaHJlZj1cIiNcIiAvPiBcIlwiXCIpLmFkZENsYXNzKFwiYWN0aW9uXCIpLmFkZENsYXNzKGFjdGlvbi50eXBlKVxuICAgIC50ZXh0KHV0aWwuc3ltYm9sc1thY3Rpb24udHlwZV0pXG4gICAgLmF0dHIoJ3RpdGxlJyxhY3Rpb25UaXRsZSlcbiAgICAuYXR0cignZGF0YS1pZCcsIGFjdGlvbi5pZCB8fCBcIjBcIilcbiAgICAuZGF0YSgnYWN0aW9uJywgYWN0aW9uKVxuICBjb250cm9scyA9IGpvdXJuYWxFbGVtZW50LmNoaWxkcmVuKCcuY29udHJvbC1idXR0b25zJylcbiAgaWYgY29udHJvbHMubGVuZ3RoID4gMFxuICAgIGFjdGlvbkVsZW1lbnQuaW5zZXJ0QmVmb3JlKGNvbnRyb2xzKVxuICBlbHNlXG4gICAgYWN0aW9uRWxlbWVudC5hcHBlbmRUbyhqb3VybmFsRWxlbWVudClcbiAgaWYgYWN0aW9uLnR5cGUgPT0gJ2ZvcmsnIGFuZCBhY3Rpb24uc2l0ZT9cbiAgICBhY3Rpb25FbGVtZW50XG4gICAgICAuY3NzKFwiYmFja2dyb3VuZC1pbWFnZVwiLCBcInVybCgvLyN7YWN0aW9uLnNpdGV9L2Zhdmljb24ucG5nKVwiKVxuICAgICAgLmF0dHIoXCJocmVmXCIsIFwiLy8je2FjdGlvbi5zaXRlfS8je3BhZ2VFbGVtZW50LmF0dHIoJ2lkJyl9Lmh0bWxcIilcbiAgICAgIC5kYXRhKFwic2l0ZVwiLCBhY3Rpb24uc2l0ZSlcbiAgICAgIC5kYXRhKFwic2x1Z1wiLCBwYWdlRWxlbWVudC5hdHRyKCdpZCcpKVxuXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcblxud2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbmNyZWF0ZVNlYXJjaCA9IHJlcXVpcmUgJy4vc2VhcmNoLmNvZmZlZSdcblxubW9kdWxlLmV4cG9ydHMgPSBuZWlnaGJvcmhvb2QgPSB7fVxuXG5cbndpa2kubmVpZ2hib3Job29kID89IHt9XG5uZXh0QXZhaWxhYmxlRmV0Y2ggPSAwXG5uZXh0RmV0Y2hJbnRlcnZhbCA9IDIwMDBcblxucG9wdWxhdGVTaXRlSW5mb0ZvciA9IChzaXRlLG5laWdoYm9ySW5mbyktPlxuICByZXR1cm4gaWYgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHRcbiAgbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSB0cnVlXG5cbiAgdHJhbnNpdGlvbiA9IChzaXRlLCBmcm9tLCB0bykgLT5cbiAgICAkKFwiXCJcIi5uZWlnaGJvcltkYXRhLXNpdGU9XCIje3NpdGV9XCJdXCJcIlwiKVxuICAgICAgLmZpbmQoJ2RpdicpXG4gICAgICAucmVtb3ZlQ2xhc3MoZnJvbSlcbiAgICAgIC5hZGRDbGFzcyh0bylcblxuICBmZXRjaE1hcCA9IC0+XG4gICAgc2l0ZW1hcFVybCA9IFwiaHR0cDovLyN7c2l0ZX0vc3lzdGVtL3NpdGVtYXAuanNvblwiXG4gICAgdHJhbnNpdGlvbiBzaXRlLCAnd2FpdCcsICdmZXRjaCdcbiAgICByZXF1ZXN0ID0gJC5hamF4XG4gICAgICB0eXBlOiAnR0VUJ1xuICAgICAgZGF0YVR5cGU6ICdqc29uJ1xuICAgICAgdXJsOiBzaXRlbWFwVXJsXG4gICAgcmVxdWVzdFxuICAgICAgLmFsd2F5cyggLT4gbmVpZ2hib3JJbmZvLnNpdGVtYXBSZXF1ZXN0SW5mbGlnaHQgPSBmYWxzZSApXG4gICAgICAuZG9uZSAoZGF0YSktPlxuICAgICAgICBuZWlnaGJvckluZm8uc2l0ZW1hcCA9IGRhdGFcbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZG9uZSdcbiAgICAgICAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvci1kb25lJywgc2l0ZVxuICAgICAgLmZhaWwgKGRhdGEpLT5cbiAgICAgICAgdHJhbnNpdGlvbiBzaXRlLCAnZmV0Y2gnLCAnZmFpbCdcblxuICBub3cgPSBEYXRlLm5vdygpXG4gIGlmIG5vdyA+IG5leHRBdmFpbGFibGVGZXRjaFxuICAgIG5leHRBdmFpbGFibGVGZXRjaCA9IG5vdyArIG5leHRGZXRjaEludGVydmFsXG4gICAgc2V0VGltZW91dCBmZXRjaE1hcCwgMTAwXG4gIGVsc2VcbiAgICBzZXRUaW1lb3V0IGZldGNoTWFwLCBuZXh0QXZhaWxhYmxlRmV0Y2ggLSBub3dcbiAgICBuZXh0QXZhaWxhYmxlRmV0Y2ggKz0gbmV4dEZldGNoSW50ZXJ2YWxcblxuXG53aWtpLnJlZ2lzdGVyTmVpZ2hib3IgPSBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciA9IChzaXRlKS0+XG4gIHJldHVybiBpZiB3aWtpLm5laWdoYm9yaG9vZFtzaXRlXT9cbiAgbmVpZ2hib3JJbmZvID0ge31cbiAgd2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0gPSBuZWlnaGJvckluZm9cbiAgcG9wdWxhdGVTaXRlSW5mb0Zvciggc2l0ZSwgbmVpZ2hib3JJbmZvIClcbiAgJCgnYm9keScpLnRyaWdnZXIgJ25ldy1uZWlnaGJvcicsIHNpdGVcblxubmVpZ2hib3Job29kLmxpc3ROZWlnaGJvcnMgPSAoKS0+XG4gIF8ua2V5cyggd2lraS5uZWlnaGJvcmhvb2QgKVxuXG5uZWlnaGJvcmhvb2Quc2VhcmNoID0gKHNlYXJjaFF1ZXJ5KS0+XG4gIGZpbmRzID0gW11cbiAgdGFsbHkgPSB7fVxuXG4gIHRpY2sgPSAoa2V5KSAtPlxuICAgIGlmIHRhbGx5W2tleV0/IHRoZW4gdGFsbHlba2V5XSsrIGVsc2UgdGFsbHlba2V5XSA9IDFcblxuICBtYXRjaCA9IChrZXksIHRleHQpIC0+XG4gICAgaGl0ID0gdGV4dD8gYW5kIHRleHQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCBzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpICkgPj0gMFxuICAgIHRpY2sga2V5IGlmIGhpdFxuICAgIGhpdFxuXG4gIHN0YXJ0ID0gRGF0ZS5ub3coKVxuICBmb3Igb3duIG5laWdoYm9yU2l0ZSxuZWlnaGJvckluZm8gb2Ygd2lraS5uZWlnaGJvcmhvb2RcbiAgICBzaXRlbWFwID0gbmVpZ2hib3JJbmZvLnNpdGVtYXBcbiAgICB0aWNrICdzaXRlcycgaWYgc2l0ZW1hcD9cbiAgICBtYXRjaGluZ1BhZ2VzID0gXy5lYWNoIHNpdGVtYXAsIChwYWdlKS0+XG4gICAgICB0aWNrICdwYWdlcydcbiAgICAgIHJldHVybiB1bmxlc3MgbWF0Y2goJ3RpdGxlJywgcGFnZS50aXRsZSkgb3IgbWF0Y2goJ3RleHQnLCBwYWdlLnN5bm9wc2lzKSBvciBtYXRjaCgnc2x1ZycsIHBhZ2Uuc2x1ZylcbiAgICAgIHRpY2sgJ2ZpbmRzJ1xuICAgICAgZmluZHMucHVzaFxuICAgICAgICBwYWdlOiBwYWdlLFxuICAgICAgICBzaXRlOiBuZWlnaGJvclNpdGUsXG4gICAgICAgIHJhbms6IDEgIyBIQVJEQ09ERUQgRk9SIE5PV1xuICB0YWxseVsnbXNlYyddID0gRGF0ZS5ub3coKSAtIHN0YXJ0XG4gIHsgZmluZHMsIHRhbGx5IH1cblxuXG4kIC0+XG4gICRuZWlnaGJvcmhvb2QgPSAkKCcubmVpZ2hib3Job29kJylcblxuICBmbGFnID0gKHNpdGUpIC0+XG4gICAgIyBzdGF0dXMgY2xhc3MgcHJvZ3Jlc3Npb246IC53YWl0LCAuZmV0Y2gsIC5mYWlsIG9yIC5kb25lXG4gICAgXCJcIlwiXG4gICAgICA8c3BhbiBjbGFzcz1cIm5laWdoYm9yXCIgZGF0YS1zaXRlPVwiI3tzaXRlfVwiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwid2FpdFwiPlxuICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cDovLyN7c2l0ZX0vZmF2aWNvbi5wbmdcIiB0aXRsZT1cIiN7c2l0ZX1cIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L3NwYW4+XG4gICAgXCJcIlwiXG5cbiAgJCgnYm9keScpXG4gICAgLm9uICduZXctbmVpZ2hib3InLCAoZSwgc2l0ZSkgLT5cbiAgICAgICRuZWlnaGJvcmhvb2QuYXBwZW5kIGZsYWcgc2l0ZVxuICAgIC5kZWxlZ2F0ZSAnLm5laWdoYm9yIGltZycsICdjbGljaycsIChlKSAtPlxuICAgICAgd2lraS5kb0ludGVybmFsTGluayAnd2VsY29tZS12aXNpdG9ycycsIG51bGwsIEAudGl0bGVcblxuICBzZWFyY2ggPSBjcmVhdGVTZWFyY2goe25laWdoYm9yaG9vZH0pXG5cbiAgJCgnaW5wdXQuc2VhcmNoJykub24gJ2tleXByZXNzJywgKGUpLT5cbiAgICByZXR1cm4gaWYgZS5rZXlDb2RlICE9IDEzICMgMTMgPT0gcmV0dXJuXG4gICAgc2VhcmNoUXVlcnkgPSAkKHRoaXMpLnZhbCgpXG4gICAgc2VhcmNoLnBlcmZvcm1TZWFyY2goIHNlYXJjaFF1ZXJ5IClcbiAgICAkKHRoaXMpLnZhbChcIlwiKVxuIiwid2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbmFjdGl2ZSA9IHJlcXVpcmUgJy4vYWN0aXZlLmNvZmZlZSdcblxuY3JlYXRlU2VhcmNoID0gKHtuZWlnaGJvcmhvb2R9KS0+XG4gIHBlcmZvcm1TZWFyY2ggPSAoc2VhcmNoUXVlcnkpLT5cbiAgICBzZWFyY2hSZXN1bHRzID0gbmVpZ2hib3Job29kLnNlYXJjaChzZWFyY2hRdWVyeSlcbiAgICB0YWxseSA9IHNlYXJjaFJlc3VsdHMudGFsbHlcblxuXG4gICAgZXhwbGFuYXRvcnlQYXJhID0ge1xuICAgICAgdHlwZTogJ3BhcmFncmFwaCdcbiAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgU3RyaW5nICcje3NlYXJjaFF1ZXJ5fScgZm91bmQgb24gI3t0YWxseS5maW5kc3x8J25vbmUnfSBvZiAje3RhbGx5LnBhZ2VzfHwnbm8nfSBwYWdlcyBmcm9tICN7dGFsbHkuc2l0ZXN8fCdubyd9IHNpdGVzLlxuICAgICAgICBUZXh0IG1hdGNoZWQgb24gI3t0YWxseS50aXRsZXx8J25vJ30gdGl0bGVzLCAje3RhbGx5LnRleHR8fCdubyd9IHBhcmFncmFwaHMsIGFuZCAje3RhbGx5LnNsdWd8fCdubyd9IHNsdWdzLlxuICAgICAgICBFbGFwc2VkIHRpbWUgI3t0YWxseS5tc2VjfSBtaWxsaXNlY29uZHMuXG4gICAgICBcIlwiXCJcbiAgICB9XG4gICAgc2VhcmNoUmVzdWx0UmVmZXJlbmNlcyA9IGZvciByZXN1bHQgaW4gc2VhcmNoUmVzdWx0cy5maW5kc1xuICAgICAge1xuICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIlxuICAgICAgICBcImlkXCI6IHV0aWwucmFuZG9tQnl0ZXMoOClcbiAgICAgICAgXCJzaXRlXCI6IHJlc3VsdC5zaXRlXG4gICAgICAgIFwic2x1Z1wiOiByZXN1bHQucGFnZS5zbHVnXG4gICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnBhZ2UudGl0bGVcbiAgICAgICAgXCJ0ZXh0XCI6IHJlc3VsdC5wYWdlLnN5bm9wc2lzIHx8ICcnXG4gICAgICB9XG4gICAgc2VhcmNoUmVzdWx0UGFnZURhdGEgPSB7XG4gICAgICB0aXRsZTogXCJTZWFyY2ggUmVzdWx0c1wiXG4gICAgICBzdG9yeTogW2V4cGxhbmF0b3J5UGFyYV0uY29uY2F0KHNlYXJjaFJlc3VsdFJlZmVyZW5jZXMpXG4gICAgfVxuICAgICRzZWFyY2hSZXN1bHRQYWdlID0gd2lraS5jcmVhdGVQYWdlKCdzZWFyY2gtcmVzdWx0cycpLmFkZENsYXNzKCdnaG9zdCcpXG4gICAgJHNlYXJjaFJlc3VsdFBhZ2UuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICB3aWtpLmJ1aWxkUGFnZSggc2VhcmNoUmVzdWx0UGFnZURhdGEsIG51bGwsICRzZWFyY2hSZXN1bHRQYWdlIClcbiAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuXG5cbiAge1xuICAgIHBlcmZvcm1TZWFyY2hcbiAgfVxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVTZWFyY2hcbiJdfQ==
;