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


},{"./synopsis.coffee":4}],3:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":5,"./pageHandler.coffee":6,"./plugin.coffee":7,"./state.coffee":8,"./active.coffee":9,"./refresh.coffee":10}],4:[function(require,module,exports){
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


},{}],9:[function(require,module,exports){
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


},{}],5:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":5}],8:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./active.coffee":9}],6:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":5,"./state.coffee":8,"./revision.coffee":11,"./addToJournal.coffee":12,"underscore":13}],10:[function(require,module,exports){
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


},{"./util.coffee":5,"./pageHandler.coffee":6,"./plugin.coffee":7,"./state.coffee":8,"./neighborhood.coffee":14,"./addToJournal.coffee":12,"./wiki.coffee":2,"underscore":13}],13:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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


},{}],12:[function(require,module,exports){
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


},{"./util.coffee":5}],14:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./active.coffee":9,"./util.coffee":5,"./search.coffee":15,"underscore":13}],15:[function(require,module,exports){
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


},{"./wiki.coffee":2,"./util.coffee":5,"./active.coffee":9}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2NsaWVudC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi93aWtpLmNvZmZlZSIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL2xlZ2FjeS5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9zeW5vcHNpcy5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9hY3RpdmUuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvdXRpbC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9wbHVnaW4uY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvc3RhdGUuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcGFnZUhhbmRsZXIuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvcmVmcmVzaC5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9yZXZpc2lvbi5jb2ZmZWUiLCIvVXNlcnMvd2N1bm5pbmdoYW0vU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L2xpYi9hZGRUb0pvdXJuYWwuY29mZmVlIiwiL1VzZXJzL3djdW5uaW5naGFtL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9saWIvbmVpZ2hib3Job29kLmNvZmZlZSIsIi9Vc2Vycy93Y3VubmluZ2hhbS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbGliL3NlYXJjaC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLENBQU8sRUFBTyxDQUFkLEVBQU0sQ0FBUSxZQUFBOztBQUNkLENBREEsTUFDQSxjQUFBOzs7O0FDREEsSUFBQSxnQkFBQTtHQUFBLGVBQUE7O0FBQUEsQ0FBQSxFQUFpQixJQUFBLE9BQWpCLEtBQWlCOztBQUVqQixDQUZBLEVBRU8sQ0FBUDtDQUFPLENBQUUsWUFBRjtDQUZQLENBQUE7O0FBSUEsQ0FKQSxFQUlBLENBQUksS0FBTztDQUNULEtBQUE7Q0FBQSxDQURVLHFEQUNWO0NBQUEsQ0FBQSxFQUF5QiwrRUFBekI7Q0FBUSxFQUFSLEdBQUEsQ0FBTyxJQUFQLEtBQVk7SUFESDtDQUFBOztBQUdYLENBUEEsRUFPYyxDQUFWLEVBQUosR0FBZTtDQUNSLENBQWUsQ0FBcEIsQ0FBSSxDQUFKLEVBQUEsRUFBQSxFQUFBLEtBQUE7Q0FEWTs7QUFJZCxDQVhBLEVBV3VCLENBQW5CLEtBQW1CLE1BQXZCO0NBQ0UsRUFBcUIsR0FBckIsRUFBQSxDQUFBO0NBRHFCOztBQUd2QixDQWRBLENBQUEsQ0FjeUIsQ0FBckIsYUFBSjs7QUFFQSxDQWhCQSxDQWdCOEIsQ0FBWCxDQUFmLElBQWUsQ0FBQyxFQUFwQjtDQUNFLENBQUEsRUFBSSxJQUFKLFNBQXNCO0NBQ3RCO0NBQ0UsT0FBQSxHQUFBO0lBREY7Q0FHRSxFQUFBLENBQUEsYUFBc0I7SUFMUDtDQUFBOztBQU9uQixDQXZCQSxFQXVCZSxDQUFYLEdBQUosRUFBZ0I7Q0FDZCxLQUFBLEVBQUE7Q0FB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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Q0FBZ0IsTUFBQyxFQUFELEVBQWhCO0NBQ0UsT0FBQSxzR0FBQTtDQUFBLEVBQWdCLENBQWhCLEVBQWdCLEtBQUEsQ0FBWSxDQUE1QjtDQUFBLEVBQ1EsQ0FBUixDQUFBLFFBQXFCO0NBRHJCLEVBSWtCLENBQWxCLFdBQUE7Q0FBa0IsQ0FDVixFQUFOLEVBQUEsS0FEZ0I7Q0FBQSxDQUVoQixFQUFRLEVBQVIsS0FBSTtDQUZZLENBR1AsQ0FDUCxDQURGLENBQ2dDLENBRGhDLElBQVMsQ0FBQSxFQUFBLENBQUEsRUFITyxHQUdQLEtBQUEsR0FBQTtDQVBYLEtBQUE7Q0FBQSxHQWFBLGtCQUFBOztDQUF5QjtDQUFBO1lBQUEsK0JBQUE7MkJBQUE7Q0FDdkI7Q0FBQSxDQUNVLElBQVIsSUFBQSxDQURGO0NBQUEsQ0FFUSxFQUFOLE1BQUEsQ0FBTTtDQUZSLENBR1UsRUFIVixFQUdFLElBQUE7Q0FIRixDQUlVLEVBQVcsRUFBbkIsSUFBQTtDQUpGLENBS1csRUFBVyxDQUx0QixDQUtpQixDQUFmLEdBQUE7Q0FMRixDQU1VLEVBQVcsRUFBbkIsRUFBUSxFQUFSO0NBTkY7Q0FEdUI7O0NBYnpCO0NBQUEsRUFzQnVCLENBQXZCLGdCQUFBO0NBQXVCLENBQ2QsR0FBUCxDQUFBLFVBRHFCO0NBQUEsQ0FFZCxHQUFQLENBQUEsU0FBTyxPQUFBO0NBeEJULEtBQUE7Q0FBQSxFQTBCb0IsQ0FBcEIsR0FBb0IsQ0FBQSxFQUFBLE1BQUEsQ0FBcEI7Q0ExQkEsR0EyQkEsR0FBMkIsQ0FBM0IsU0FBaUI7Q0EzQmpCLENBNEJzQyxFQUF0QyxLQUFBLFFBQUEsR0FBQTtDQUNPLEVBQVAsQ0FBVyxFQUFMLENBQUssSUFBWDtDQTlCRixFQUFnQjtTQWlDaEI7Q0FBQSxDQUNFLEVBQUEsU0FERjtDQWxDYTtDQUFBOztBQXFDZixDQXpDQSxFQXlDaUIsR0FBWCxDQUFOLEtBekNBIiwic291cmNlc0NvbnRlbnQiOlsid2luZG93Lndpa2kgPSByZXF1aXJlKCcuL2xpYi93aWtpLmNvZmZlZScpXG5yZXF1aXJlKCcuL2xpYi9sZWdhY3kuY29mZmVlJylcblxuIiwiY3JlYXRlU3lub3BzaXMgPSByZXF1aXJlICcuL3N5bm9wc2lzLmNvZmZlZSdcblxud2lraSA9IHsgY3JlYXRlU3lub3BzaXMgfVxuXG53aWtpLmxvZyA9ICh0aGluZ3MuLi4pIC0+XG4gIGNvbnNvbGUubG9nIHRoaW5ncy4uLiBpZiBjb25zb2xlPy5sb2c/XG5cbndpa2kuYXNTbHVnID0gKG5hbWUpIC0+XG4gIG5hbWUucmVwbGFjZSgvXFxzL2csICctJykucmVwbGFjZSgvW15BLVphLXowLTktXS9nLCAnJykudG9Mb3dlckNhc2UoKVxuXG5cbndpa2kudXNlTG9jYWxTdG9yYWdlID0gLT5cbiAgJChcIi5sb2dpblwiKS5sZW5ndGggPiAwXG5cbndpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBbXVxuXG53aWtpLnJlc29sdmVGcm9tID0gKGFkZGl0aW9uLCBjYWxsYmFjaykgLT5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wdXNoIGFkZGl0aW9uXG4gIHRyeVxuICAgIGNhbGxiYWNrKClcbiAgZmluYWxseVxuICAgIHdpa2kucmVzb2x1dGlvbkNvbnRleHQucG9wKClcblxud2lraS5nZXREYXRhID0gKHZpcykgLT5cbiAgaWYgdmlzXG4gICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpXG4gICAgd2hvID0gJChcIi5pdGVtOmx0KCN7aWR4fSlcIikuZmlsdGVyKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KClcbiAgICBpZiB3aG8/IHRoZW4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhIGVsc2Uge31cbiAgZWxzZVxuICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKVxuICAgIGlmIHdobz8gdGhlbiB3aG8uZGF0YSgnaXRlbScpLmRhdGEgZWxzZSB7fVxuXG53aWtpLmdldERhdGFOb2RlcyA9ICh2aXMpIC0+XG4gIGlmIHZpc1xuICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKVxuICAgIHdobyA9ICQoXCIuaXRlbTpsdCgje2lkeH0pXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuICBlbHNlXG4gICAgd2hvID0gJCgnLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKVxuICAgICQod2hvKVxuXG53aWtpLmNyZWF0ZVBhZ2UgPSAobmFtZSwgbG9jKSAtPlxuICBzaXRlID0gbG9jIGlmIGxvYyBhbmQgbG9jIGlzbnQgJ3ZpZXcnXG4gICRwYWdlID0gJCBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwicGFnZVwiIGlkPVwiI3tuYW1lfVwiPlxuICAgICAgPGRpdiBjbGFzcz1cInR3aW5zXCI+IDxwPiA8L3A+IDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICA8aDE+IDxpbWcgY2xhc3M9XCJmYXZpY29uXCIgc3JjPVwiI3sgaWYgc2l0ZSB0aGVuIFwiLy8je3NpdGV9XCIgZWxzZSBcIlwiIH0vZmF2aWNvbi5wbmdcIiBoZWlnaHQ9XCIzMnB4XCI+ICN7bmFtZX0gPC9oMT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICBcIlwiXCJcbiAgJHBhZ2UuZmluZCgnLnBhZ2UnKS5hdHRyKCdkYXRhLXNpdGUnLCBzaXRlKSBpZiBzaXRlXG4gICRwYWdlXG5cbndpa2kuZ2V0SXRlbSA9IChlbGVtZW50KSAtPlxuICAkKGVsZW1lbnQpLmRhdGEoXCJpdGVtXCIpIG9yICQoZWxlbWVudCkuZGF0YSgnc3RhdGljSXRlbScpIGlmICQoZWxlbWVudCkubGVuZ3RoID4gMFxuXG53aWtpLnJlc29sdmVMaW5rcyA9IChzdHJpbmcpIC0+XG4gIHJlbmRlckludGVybmFsTGluayA9IChtYXRjaCwgbmFtZSkgLT5cbiAgICAjIHNwYWNlcyBiZWNvbWUgJ3NsdWdzJywgbm9uLWFscGhhLW51bSBnZXQgcmVtb3ZlZFxuICAgIHNsdWcgPSB3aWtpLmFzU2x1ZyBuYW1lXG4gICAgXCI8YSBjbGFzcz1cXFwiaW50ZXJuYWxcXFwiIGhyZWY9XFxcIi8je3NsdWd9Lmh0bWxcXFwiIGRhdGEtcGFnZS1uYW1lPVxcXCIje3NsdWd9XFxcIiB0aXRsZT1cXFwiI3t3aWtpLnJlc29sdXRpb25Db250ZXh0LmpvaW4oJyA9PiAnKX1cXFwiPiN7bmFtZX08L2E+XCJcbiAgc3RyaW5nXG4gICAgLnJlcGxhY2UoL1xcW1xcWyhbXlxcXV0rKVxcXVxcXS9naSwgcmVuZGVySW50ZXJuYWxMaW5rKVxuICAgIC5yZXBsYWNlKC9cXFsoaHR0cC4qPykgKC4qPylcXF0vZ2ksIFwiXCJcIjxhIGNsYXNzPVwiZXh0ZXJuYWxcIiB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiJDFcIiB0aXRsZT1cIiQxXCIgcmVsPVwibm9mb2xsb3dcIj4kMiA8aW1nIHNyYz1cIi9pbWFnZXMvZXh0ZXJuYWwtbGluay1sdHItaWNvbi5wbmdcIj48L2E+XCJcIlwiKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdpa2lcblxuIiwid2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbnBhZ2VIYW5kbGVyID0gd2lraS5wYWdlSGFuZGxlciA9IHJlcXVpcmUgJy4vcGFnZUhhbmRsZXIuY29mZmVlJ1xucGx1Z2luID0gcmVxdWlyZSAnLi9wbHVnaW4uY29mZmVlJ1xuc3RhdGUgPSByZXF1aXJlICcuL3N0YXRlLmNvZmZlZSdcbmFjdGl2ZSA9IHJlcXVpcmUgJy4vYWN0aXZlLmNvZmZlZSdcbnJlZnJlc2ggPSByZXF1aXJlICcuL3JlZnJlc2guY29mZmVlJ1xuXG5BcnJheTo6bGFzdCA9IC0+XG4gIHRoaXNbQGxlbmd0aCAtIDFdXG5cbiQgLT5cbiMgRUxFTUVOVFMgdXNlZCBmb3IgZGV0YWlscyBwb3B1cFxuXG4gICMgIyBleHRlbnNpb24gZnJvbSBodHRwOi8vd3d3LmRyb3B0b2ZyYW1lLmNvbS8/cD0zNVxuICAjICAgIyAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItdHJhbnNmZXJ7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgcmlnaHQ6IDIzcHg7IHRvcDogNTAlOyB3aWR0aDogMTlweDsgbWFyZ2luOiAtMTBweCAwIDAgMDsgcGFkZGluZzogMXB4OyBoZWlnaHQ6IDE4cHg7IH1cbiAgIyAgICMgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyIHNwYW4geyBkaXNwbGF5OiBibG9jazsgbWFyZ2luOiAxcHg7IH1cbiAgIyAgICMgLnVpLWRpYWxvZyAudWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyOmhvdmVyLCAudWktZGlhbG9nIC51aS1kaWFsb2ctdGl0bGViYXItbWluOmZvY3VzIHsgcGFkZGluZzogMDsgfVxuICAjIF9pbml0ID0gJC51aS5kaWFsb2cucHJvdG90eXBlLl9pbml0XG4gICMgX3VpRGlhbG9nVGl0bGViYXIgPSBudWxsXG4gICMgJC51aS5kaWFsb2cucHJvdG90eXBlLl9pbml0ID0gLT5cbiAgIyAgIHNlbGYgPSB0aGlzXG4gICMgICBfaW5pdC5hcHBseSB0aGlzLCBhcmd1bWVudHNcbiAgIyAgIHVpRGlhbG9nVGl0bGViYXIgPSB0aGlzLnVpRGlhbG9nVGl0bGViYXJcbiAgIyAgIHVpRGlhbG9nVGl0bGViYXIuYXBwZW5kICc8YSBocmVmPVwiI1wiIGlkPVwiZGlhbG9nLXRyYW5zZmVyXCIgY2xhc3M9XCJkaWFsb2ctdHJhbnNmZXIgdWktZGlhbG9nLXRpdGxlYmFyLXRyYW5zZmVyXCI+PHNwYW4gY2xhc3M9XCJ1aS1pY29uIHVpLWljb24tdHJhbnNmZXJ0aGljay1lLXdcIj48L3NwYW4+PC9hPidcbiAgIyAkLmV4dGVuZCAkLnVpLmRpYWxvZy5wcm90b3R5cGUsIC0+XG4gICMgICAkKCcuZGlhbG9nLXRyYW5zZmVyJywgdGhpcy51aURpYWxvZ1RpdGxlYmFyKVxuICAjICAgICAuaG92ZXIgLT4gJCh0aGlzKS50b2dnbGVDbGFzcygndWktc3RhdGUtaG92ZXInKVxuICAjICAgICAuY2xpY2soKSAtPlxuICAjICAgICAgIHNlbGYudHJhbnNmZXIoKVxuICAjICAgICAgIHJldHVybiBmYWxzZVxuICB3aW5kb3cuZGlhbG9nID0gJCgnPGRpdj48L2Rpdj4nKVxuXHQgIC5odG1sKCdUaGlzIGRpYWxvZyB3aWxsIHNob3cgZXZlcnkgdGltZSEnKVxuXHQgIC5kaWFsb2cgeyBhdXRvT3BlbjogZmFsc2UsIHRpdGxlOiAnQmFzaWMgRGlhbG9nJywgaGVpZ2h0OiA2MDAsIHdpZHRoOiA4MDAgfVxuICB3aWtpLmRpYWxvZyA9ICh0aXRsZSwgaHRtbCkgLT5cbiAgICB3aW5kb3cuZGlhbG9nLmh0bWwgaHRtbFxuICAgIHdpbmRvdy5kaWFsb2cuZGlhbG9nIFwib3B0aW9uXCIsIFwidGl0bGVcIiwgd2lraS5yZXNvbHZlTGlua3ModGl0bGUpXG4gICAgd2luZG93LmRpYWxvZy5kaWFsb2cgJ29wZW4nXG5cbiMgRlVOQ1RJT05TIHVzZWQgYnkgcGx1Z2lucyBhbmQgZWxzZXdoZXJlXG5cbiAgc2xlZXAgPSAodGltZSwgZG9uZSkgLT4gc2V0VGltZW91dCBkb25lLCB0aW1lXG5cbiAgd2lraS5yZW1vdmVJdGVtID0gKCRpdGVtLCBpdGVtKSAtPlxuICAgIHBhZ2VIYW5kbGVyLnB1dCAkaXRlbS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7dHlwZTogJ3JlbW92ZScsIGlkOiBpdGVtLmlkfVxuICAgICRpdGVtLnJlbW92ZSgpXG5cbiAgd2lraS5jcmVhdGVJdGVtID0gKCRwYWdlLCAkYmVmb3JlLCBpdGVtKSAtPlxuICAgICRwYWdlID0gJGJlZm9yZS5wYXJlbnRzKCcucGFnZScpIHVubGVzcyAkcGFnZT9cbiAgICBpdGVtLmlkID0gdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICRpdGVtID0gJCBcIlwiXCJcbiAgICAgIDxkaXYgY2xhc3M9XCJpdGVtICN7aXRlbS50eXBlfVwiIGRhdGEtaWQ9XCIje31cIjwvZGl2PlxuICAgIFwiXCJcIlxuICAgICRpdGVtXG4gICAgICAuZGF0YSgnaXRlbScsIGl0ZW0pXG4gICAgICAuZGF0YSgncGFnZUVsZW1lbnQnLCAkcGFnZSlcbiAgICBpZiAkYmVmb3JlP1xuICAgICAgJGJlZm9yZS5hZnRlciAkaXRlbVxuICAgIGVsc2VcbiAgICAgICRwYWdlLmZpbmQoJy5zdG9yeScpLmFwcGVuZCAkaXRlbVxuICAgIHBsdWdpbi5kbyAkaXRlbSwgaXRlbVxuICAgIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbSAkYmVmb3JlXG4gICAgc2xlZXAgNTAwLCAtPlxuICAgICAgcGFnZUhhbmRsZXIucHV0ICRwYWdlLCB7aXRlbSwgaWQ6IGl0ZW0uaWQsIHR5cGU6ICdhZGQnLCBhZnRlcjogYmVmb3JlPy5pZH1cbiAgICAkaXRlbVxuXG4gIGNyZWF0ZVRleHRFbGVtZW50ID0gKHBhZ2VFbGVtZW50LCBiZWZvcmVFbGVtZW50LCBpbml0aWFsVGV4dCkgLT5cbiAgICBpdGVtID1cbiAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnXG4gICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgdGV4dDogaW5pdGlhbFRleHRcbiAgICBpdGVtRWxlbWVudCA9ICQgXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbSBwYXJhZ3JhcGhcIiBkYXRhLWlkPSN7aXRlbS5pZH0+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIFwiXCJcIlxuICAgIGl0ZW1FbGVtZW50XG4gICAgICAuZGF0YSgnaXRlbScsIGl0ZW0pXG4gICAgICAuZGF0YSgncGFnZUVsZW1lbnQnLCBwYWdlRWxlbWVudClcbiAgICBiZWZvcmVFbGVtZW50LmFmdGVyIGl0ZW1FbGVtZW50XG4gICAgcGx1Z2luLmRvIGl0ZW1FbGVtZW50LCBpdGVtXG4gICAgaXRlbUJlZm9yZSA9IHdpa2kuZ2V0SXRlbSBiZWZvcmVFbGVtZW50XG4gICAgd2lraS50ZXh0RWRpdG9yIGl0ZW1FbGVtZW50LCBpdGVtXG4gICAgc2xlZXAgNTAwLCAtPiBwYWdlSGFuZGxlci5wdXQgcGFnZUVsZW1lbnQsIHtpdGVtOiBpdGVtLCBpZDogaXRlbS5pZCwgdHlwZTogJ2FkZCcsIGFmdGVyOiBpdGVtQmVmb3JlPy5pZH1cblxuICB0ZXh0RWRpdG9yID0gd2lraS50ZXh0RWRpdG9yID0gKGRpdiwgaXRlbSwgY2FyZXRQb3MsIGRvdWJsZUNsaWNrZWQpIC0+XG4gICAgcmV0dXJuIGlmIGRpdi5oYXNDbGFzcyAndGV4dEVkaXRpbmcnXG4gICAgZGl2LmFkZENsYXNzICd0ZXh0RWRpdGluZydcbiAgICB0ZXh0YXJlYSA9ICQoXCI8dGV4dGFyZWE+I3tvcmlnaW5hbCA9IGl0ZW0udGV4dCA/ICcnfTwvdGV4dGFyZWE+XCIpXG4gICAgICAuZm9jdXNvdXQgLT5cbiAgICAgICAgZGl2LnJlbW92ZUNsYXNzICd0ZXh0RWRpdGluZydcbiAgICAgICAgaWYgaXRlbS50ZXh0ID0gdGV4dGFyZWEudmFsKClcbiAgICAgICAgICBwbHVnaW4uZG8gZGl2LmVtcHR5KCksIGl0ZW1cbiAgICAgICAgICByZXR1cm4gaWYgaXRlbS50ZXh0ID09IG9yaWdpbmFsXG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IGRpdi5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7dHlwZTogJ2VkaXQnLCBpZDogaXRlbS5pZCwgaXRlbTogaXRlbX1cbiAgICAgICAgZWxzZVxuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dCBkaXYucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge3R5cGU6ICdyZW1vdmUnLCBpZDogaXRlbS5pZH1cbiAgICAgICAgICBkaXYucmVtb3ZlKClcbiAgICAgICAgbnVsbFxuICAgICAgIyAuYmluZCAncGFzdGUnLCAoZSkgLT5cbiAgICAgICMgICB3aWtpLmxvZyAndGV4dGVkaXQgcGFzdGUnLCBlXG4gICAgICAjICAgd2lraS5sb2cgZS5vcmlnaW5hbEV2ZW50LmNsaXBib2FyZERhdGEuZ2V0RGF0YSgndGV4dCcpXG4gICAgICAuYmluZCAna2V5ZG93bicsIChlKSAtPlxuICAgICAgICBpZiAoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSBhbmQgZS53aGljaCA9PSA4MyAjYWx0LXNcbiAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIGlmIChlLmFsdEtleSB8fCBlLmN0bEtleSB8fCBlLm1ldGFLZXkpIGFuZCBlLndoaWNoID09IDczICNhbHQtaVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpIHVubGVzcyBlLnNoaWZ0S2V5XG4gICAgICAgICAgZG9JbnRlcm5hbExpbmsgXCJhYm91dCAje2l0ZW0udHlwZX0gcGx1Z2luXCIsIHBhZ2VcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgIyBwcm92aWRlcyBhdXRvbWF0aWMgbmV3IHBhcmFncmFwaHMgb24gZW50ZXIgYW5kIGNvbmNhdGVuYXRpb24gb24gYmFja3NwYWNlXG4gICAgICAgIGlmIGl0ZW0udHlwZSBpcyAncGFyYWdyYXBoJyBcbiAgICAgICAgICBzZWwgPSB1dGlsLmdldFNlbGVjdGlvblBvcyh0ZXh0YXJlYSkgIyBwb3NpdGlvbiBvZiBjYXJldCBvciBzZWxlY3RlZCB0ZXh0IGNvb3Jkc1xuICAgICAgICAgIGlmIGUud2hpY2ggaXMgJC51aS5rZXlDb2RlLkJBQ0tTUEFDRSBhbmQgc2VsLnN0YXJ0IGlzIDAgYW5kIHNlbC5zdGFydCBpcyBzZWwuZW5kIFxuICAgICAgICAgICAgcHJldkl0ZW0gPSB3aWtpLmdldEl0ZW0oZGl2LnByZXYoKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgcHJldkl0ZW0udHlwZSBpcyAncGFyYWdyYXBoJ1xuICAgICAgICAgICAgcHJldlRleHRMZW4gPSBwcmV2SXRlbS50ZXh0Lmxlbmd0aFxuICAgICAgICAgICAgcHJldkl0ZW0udGV4dCArPSB0ZXh0YXJlYS52YWwoKVxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKCcnKSAjIE5lZWQgY3VycmVudCB0ZXh0IGFyZWEgdG8gYmUgZW1wdHkuIEl0ZW0gdGhlbiBnZXRzIGRlbGV0ZWQuXG4gICAgICAgICAgICAjIGNhcmV0IG5lZWRzIHRvIGJlIGJldHdlZW4gdGhlIG9sZCB0ZXh0IGFuZCB0aGUgbmV3IGFwcGVuZGVkIHRleHRcbiAgICAgICAgICAgIHRleHRFZGl0b3IgZGl2LnByZXYoKSwgcHJldkl0ZW0sIHByZXZUZXh0TGVuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICBlbHNlIGlmIGUud2hpY2ggaXMgJC51aS5rZXlDb2RlLkVOVEVSIGFuZCBpdGVtLnR5cGUgaXMgJ3BhcmFncmFwaCdcbiAgICAgICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3Mgc2VsXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dGFyZWEudmFsKClcbiAgICAgICAgICAgIHByZWZpeCA9IHRleHQuc3Vic3RyaW5nIDAsIHNlbC5zdGFydFxuICAgICAgICAgICAgbWlkZGxlID0gdGV4dC5zdWJzdHJpbmcoc2VsLnN0YXJ0LCBzZWwuZW5kKSBpZiBzZWwuc3RhcnQgaXNudCBzZWwuZW5kXG4gICAgICAgICAgICBzdWZmaXggPSB0ZXh0LnN1YnN0cmluZyhzZWwuZW5kKVxuICAgICAgICAgICAgaWYgcHJlZml4IGlzICcnXG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnICcpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgIHRleHRhcmVhLnZhbChwcmVmaXgpXG4gICAgICAgICAgICB0ZXh0YXJlYS5mb2N1c291dCgpXG4gICAgICAgICAgICBwYWdlRWxlbWVudCA9IGRpdi5wYXJlbnQoKS5wYXJlbnQoKVxuICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgc3VmZml4KVxuICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgbWlkZGxlKSBpZiBtaWRkbGU/XG4gICAgICAgICAgICBjcmVhdGVUZXh0RWxlbWVudChwYWdlRWxlbWVudCwgZGl2LCAnJykgaWYgcHJlZml4IGlzICcnXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICBkaXYuaHRtbCB0ZXh0YXJlYVxuICAgIGlmIGNhcmV0UG9zP1xuICAgICAgdXRpbC5zZXRDYXJldFBvc2l0aW9uIHRleHRhcmVhLCBjYXJldFBvc1xuICAgIGVsc2UgaWYgZG91YmxlQ2xpY2tlZCAjIHdlIHdhbnQgdGhlIGNhcmV0IHRvIGJlIGF0IHRoZSBlbmRcbiAgICAgIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbiB0ZXh0YXJlYSwgdGV4dGFyZWEudmFsKCkubGVuZ3RoXG4gICAgICAjc2Nyb2xscyB0byBib3R0b20gb2YgdGV4dCBhcmVhXG4gICAgICB0ZXh0YXJlYS5zY3JvbGxUb3AodGV4dGFyZWFbMF0uc2Nyb2xsSGVpZ2h0IC0gdGV4dGFyZWEuaGVpZ2h0KCkpXG4gICAgZWxzZVxuICAgICAgdGV4dGFyZWEuZm9jdXMoKVxuXG4gIGRvSW50ZXJuYWxMaW5rID0gd2lraS5kb0ludGVybmFsTGluayA9IChuYW1lLCBwYWdlLCBzaXRlPW51bGwpIC0+XG4gICAgbmFtZSA9IHdpa2kuYXNTbHVnKG5hbWUpXG4gICAgJChwYWdlKS5uZXh0QWxsKCkucmVtb3ZlKCkgaWYgcGFnZT9cbiAgICB3aWtpLmNyZWF0ZVBhZ2UobmFtZSxzaXRlKVxuICAgICAgLmFwcGVuZFRvKCQoJy5tYWluJykpXG4gICAgICAuZWFjaCByZWZyZXNoXG4gICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcblxuICBMRUZUQVJST1cgPSAzN1xuICBSSUdIVEFSUk9XID0gMzlcblxuICAkKGRvY3VtZW50KS5rZXlkb3duIChldmVudCkgLT5cbiAgICBkaXJlY3Rpb24gPSBzd2l0Y2ggZXZlbnQud2hpY2hcbiAgICAgIHdoZW4gTEVGVEFSUk9XIHRoZW4gLTFcbiAgICAgIHdoZW4gUklHSFRBUlJPVyB0aGVuICsxXG4gICAgaWYgZGlyZWN0aW9uICYmIG5vdCAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgaXMgXCJURVhUQVJFQVwiKVxuICAgICAgcGFnZXMgPSAkKCcucGFnZScpXG4gICAgICBuZXdJbmRleCA9IHBhZ2VzLmluZGV4KCQoJy5hY3RpdmUnKSkgKyBkaXJlY3Rpb25cbiAgICAgIGlmIDAgPD0gbmV3SW5kZXggPCBwYWdlcy5sZW5ndGhcbiAgICAgICAgYWN0aXZlLnNldChwYWdlcy5lcShuZXdJbmRleCkpXG5cbiMgSEFORExFUlMgZm9yIGpRdWVyeSBldmVudHNcblxuICAkKHdpbmRvdykub24gJ3BvcHN0YXRlJywgc3RhdGUuc2hvd1xuXG4gICQoZG9jdW1lbnQpXG4gICAgLmFqYXhFcnJvciAoZXZlbnQsIHJlcXVlc3QsIHNldHRpbmdzKSAtPlxuICAgICAgcmV0dXJuIGlmIHJlcXVlc3Quc3RhdHVzID09IDAgb3IgcmVxdWVzdC5zdGF0dXMgPT0gNDA0XG4gICAgICB3aWtpLmxvZyAnYWpheCBlcnJvcicsIGV2ZW50LCByZXF1ZXN0LCBzZXR0aW5nc1xuICAgICAgJCgnLm1haW4nKS5wcmVwZW5kIFwiXCJcIlxuICAgICAgICA8bGkgY2xhc3M9J2Vycm9yJz5cbiAgICAgICAgICBFcnJvciBvbiAje3NldHRpbmdzLnVybH06ICN7cmVxdWVzdC5yZXNwb25zZVRleHR9XG4gICAgICAgIDwvbGk+XG4gICAgICBcIlwiXCJcblxuICBnZXRUZW1wbGF0ZSA9IChzbHVnLCBkb25lKSAtPlxuICAgIHJldHVybiBkb25lKG51bGwpIHVubGVzcyBzbHVnXG4gICAgd2lraS5sb2cgJ2dldFRlbXBsYXRlJywgc2x1Z1xuICAgIHBhZ2VIYW5kbGVyLmdldFxuICAgICAgd2hlbkdvdHRlbjogKGRhdGEsc2l0ZUZvdW5kKSAtPiBkb25lKGRhdGEuc3RvcnkpXG4gICAgICB3aGVuTm90R290dGVuOiAtPiBkb25lKG51bGwpXG4gICAgICBwYWdlSW5mb3JtYXRpb246IHtzbHVnOiBzbHVnfVxuXG4gIGZpbmlzaENsaWNrID0gKGUsIG5hbWUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgcGFnZSA9ICQoZS50YXJnZXQpLnBhcmVudHMoJy5wYWdlJykgdW5sZXNzIGUuc2hpZnRLZXlcbiAgICBkb0ludGVybmFsTGluayBuYW1lLCBwYWdlLCAkKGUudGFyZ2V0KS5kYXRhKCdzaXRlJylcbiAgICByZXR1cm4gZmFsc2VcblxuICAkKCcubWFpbicpXG4gICAgLmRlbGVnYXRlICcuc2hvdy1wYWdlLXNvdXJjZScsICdjbGljaycsIChlKSAtPlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBwYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50KCkucGFyZW50KClcbiAgICAgIGpzb24gPSBwYWdlRWxlbWVudC5kYXRhKCdkYXRhJylcbiAgICAgIHdpa2kuZGlhbG9nIFwiSlNPTiBmb3IgI3tqc29uLnRpdGxlfVwiLCAgJCgnPHByZS8+JykudGV4dChKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAyKSlcblxuICAgIC5kZWxlZ2F0ZSAnLnBhZ2UnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGFjdGl2ZS5zZXQgdGhpcyB1bmxlc3MgJChlLnRhcmdldCkuaXMoXCJhXCIpXG5cbiAgICAuZGVsZWdhdGUgJy5pbnRlcm5hbCcsICdjbGljaycsIChlKSAtPlxuICAgICAgbmFtZSA9ICQoZS50YXJnZXQpLmRhdGEgJ3BhZ2VOYW1lJ1xuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9ICQoZS50YXJnZXQpLmF0dHIoJ3RpdGxlJykuc3BsaXQoJyA9PiAnKVxuICAgICAgZmluaXNoQ2xpY2sgZSwgbmFtZVxuXG4gICAgLmRlbGVnYXRlICdpbWcucmVtb3RlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBuYW1lID0gJChlLnRhcmdldCkuZGF0YSgnc2x1ZycpXG4gICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyQoZS50YXJnZXQpLmRhdGEoJ3NpdGUnKV1cbiAgICAgIGZpbmlzaENsaWNrIGUsIG5hbWVcblxuICAgIC5kZWxlZ2F0ZSAnLnJldmlzaW9uJywgJ2RibGNsaWNrJywgKGUpIC0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICRwYWdlID0gJCh0aGlzKS5wYXJlbnRzKCcucGFnZScpXG4gICAgICBwYWdlID0gJHBhZ2UuZGF0YSgnZGF0YScpXG4gICAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoLTFcbiAgICAgIGFjdGlvbiA9IHBhZ2Uuam91cm5hbFtyZXZdXG4gICAgICBqc29uID0gSlNPTi5zdHJpbmdpZnkoYWN0aW9uLCBudWxsLCAyKVxuICAgICAgd2lraS5kaWFsb2cgXCJSZXZpc2lvbiAje3Jldn0sICN7YWN0aW9uLnR5cGV9IGFjdGlvblwiLCAkKCc8cHJlLz4nKS50ZXh0KGpzb24pXG5cbiAgICAuZGVsZWdhdGUgJy5hY3Rpb24nLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgJGFjdGlvbiA9ICQoZS50YXJnZXQpXG4gICAgICBpZiAkYWN0aW9uLmlzKCcuZm9yaycpIGFuZCAobmFtZSA9ICRhY3Rpb24uZGF0YSgnc2x1ZycpKT9cbiAgICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFskYWN0aW9uLmRhdGEoJ3NpdGUnKV1cbiAgICAgICAgZmluaXNoQ2xpY2sgZSwgKG5hbWUuc3BsaXQgJ18nKVswXVxuICAgICAgZWxzZVxuICAgICAgICAkcGFnZSA9ICQodGhpcykucGFyZW50cygnLnBhZ2UnKVxuICAgICAgICBzbHVnID0gd2lraS5hc1NsdWcoJHBhZ2UuZGF0YSgnZGF0YScpLnRpdGxlKVxuICAgICAgICByZXYgPSAkKHRoaXMpLnBhcmVudCgpLmNoaWxkcmVuKCkuaW5kZXgoJGFjdGlvbilcbiAgICAgICAgJHBhZ2UubmV4dEFsbCgpLnJlbW92ZSgpIHVubGVzcyBlLnNoaWZ0S2V5XG4gICAgICAgIHdpa2kuY3JlYXRlUGFnZShcIiN7c2x1Z31fcmV2I3tyZXZ9XCIsICRwYWdlLmRhdGEoJ3NpdGUnKSlcbiAgICAgICAgICAuYXBwZW5kVG8oJCgnLm1haW4nKSlcbiAgICAgICAgICAuZWFjaCByZWZyZXNoXG4gICAgICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG5cbiAgICAuZGVsZWdhdGUgJy5mb3JrLXBhZ2UnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIHBhZ2VFbGVtZW50ID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKVxuICAgICAgaWYgcGFnZUVsZW1lbnQuaGFzQ2xhc3MoJ2xvY2FsJylcbiAgICAgICAgdW5sZXNzIHdpa2kudXNlTG9jYWxTdG9yYWdlKClcbiAgICAgICAgICBpdGVtID0gcGFnZUVsZW1lbnQuZGF0YSgnZGF0YScpXG4gICAgICAgICAgcGFnZUVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2xvY2FsJylcbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQgcGFnZUVsZW1lbnQsIHt0eXBlOiAnZm9yaycsIGl0ZW19ICMgcHVzaFxuICAgICAgZWxzZVxuICAgICAgICBpZiAocmVtb3RlU2l0ZSA9IHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKSk/XG4gICAgICAgICAgcGFnZUhhbmRsZXIucHV0IHBhZ2VFbGVtZW50LCB7dHlwZTonZm9yaycsIHNpdGU6IHJlbW90ZVNpdGV9ICMgcHVsbFxuXG4gICAgLmRlbGVnYXRlICcuYWN0aW9uJywgJ2hvdmVyJywgLT5cbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJylcbiAgICAgICQoXCJbZGF0YS1pZD0je2lkfV1cIikudG9nZ2xlQ2xhc3MoJ3RhcmdldCcpXG4gICAgICAkKCcubWFpbicpLnRyaWdnZXIoJ3JldicpXG5cbiAgICAuZGVsZWdhdGUgJy5pdGVtJywgJ2hvdmVyJywgLT5cbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJylcbiAgICAgICQoXCIuYWN0aW9uW2RhdGEtaWQ9I3tpZH1dXCIpLnRvZ2dsZUNsYXNzKCd0YXJnZXQnKVxuXG4gICAgLmRlbGVnYXRlICdidXR0b24uY3JlYXRlJywgJ2NsaWNrJywgKGUpIC0+XG4gICAgICBnZXRUZW1wbGF0ZSAkKGUudGFyZ2V0KS5kYXRhKCdzbHVnJyksIChzdG9yeSkgLT5cbiAgICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gICAgICAgICRwYWdlLnJlbW92ZUNsYXNzICdnaG9zdCdcbiAgICAgICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKVxuICAgICAgICBwYWdlLnN0b3J5ID0gc3Rvcnl8fFtdXG4gICAgICAgIHBhZ2VIYW5kbGVyLnB1dCAkcGFnZSwge3R5cGU6ICdjcmVhdGUnLCBpZDogcGFnZS5pZCwgaXRlbToge3RpdGxlOnBhZ2UudGl0bGUsIHN0b3J5OiBzdG9yeXx8dW5kZWZpbmVkfX1cbiAgICAgICAgd2lraS5idWlsZFBhZ2UgcGFnZSwgbnVsbCwgJHBhZ2UuZW1wdHkoKVxuXG4gICAgLmRlbGVnYXRlICcuZ2hvc3QnLCAncmV2JywgKGUpIC0+XG4gICAgICB3aWtpLmxvZyAncmV2JywgZVxuICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gICAgICAkaXRlbSA9ICRwYWdlLmZpbmQoJy50YXJnZXQnKVxuICAgICAgcG9zaXRpb24gPSAkaXRlbS5vZmZzZXQoKS50b3AgKyAkcGFnZS5zY3JvbGxUb3AoKSAtICRwYWdlLmhlaWdodCgpLzJcbiAgICAgIHdpa2kubG9nICdzY3JvbGwnLCAkcGFnZSwgJGl0ZW0sIHBvc2l0aW9uXG4gICAgICAkcGFnZS5zdG9wKCkuYW5pbWF0ZSB7c2Nyb2xsVG9wOiBwb3N0aW9ufSwgJ3Nsb3cnXG5cbiAgICAuZGVsZWdhdGUgJy5zY29yZScsICdob3ZlcicsIChlKSAtPlxuICAgICAgJCgnLm1haW4nKS50cmlnZ2VyICd0aHVtYicsICQoZS50YXJnZXQpLmRhdGEoJ3RodW1iJylcblxuICAkKFwiLnByb3ZpZGVyIGlucHV0XCIpLmNsaWNrIC0+XG4gICAgJChcImZvb3RlciBpbnB1dDpmaXJzdFwiKS52YWwgJCh0aGlzKS5hdHRyKCdkYXRhLXByb3ZpZGVyJylcbiAgICAkKFwiZm9vdGVyIGZvcm1cIikuc3VibWl0KClcblxuICAkKCdib2R5Jykub24gJ25ldy1uZWlnaGJvci1kb25lJywgKGUsIG5laWdoYm9yKSAtPlxuICAgICQoJy5wYWdlJykuZWFjaCAoaW5kZXgsIGVsZW1lbnQpIC0+XG4gICAgICB3aWtpLmVtaXRUd2lucyAkKGVsZW1lbnQpXG5cbiAgJCAtPlxuICAgIHN0YXRlLmZpcnN0KClcbiAgICAkKCcucGFnZScpLmVhY2ggcmVmcmVzaFxuICAgIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpXG5cbiIsIm1vZHVsZS5leHBvcnRzID0gKHBhZ2UpIC0+XG4gIHN5bm9wc2lzID0gcGFnZS5zeW5vcHNpc1xuICBpZiBwYWdlPyAmJiBwYWdlLnN0b3J5P1xuICAgIHAxID0gcGFnZS5zdG9yeVswXVxuICAgIHAyID0gcGFnZS5zdG9yeVsxXVxuICAgIHN5bm9wc2lzIHx8PSBwMS50ZXh0IGlmIHAxICYmIHAxLnR5cGUgPT0gJ3BhcmFncmFwaCdcbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50eXBlID09ICdwYXJhZ3JhcGgnXG4gICAgc3lub3BzaXMgfHw9IHAxLnRleHQgaWYgcDEgJiYgcDEudGV4dD9cbiAgICBzeW5vcHNpcyB8fD0gcDIudGV4dCBpZiBwMiAmJiBwMi50ZXh0P1xuICAgIHN5bm9wc2lzIHx8PSBwYWdlLnN0b3J5PyAmJiBcIkEgcGFnZSB3aXRoICN7cGFnZS5zdG9yeS5sZW5ndGh9IGl0ZW1zLlwiXG4gIGVsc2VcbiAgICBzeW5vcHNpcyA9ICdBIHBhZ2Ugd2l0aCBubyBzdG9yeS4nXG4gIHJldHVybiBzeW5vcHNpc1xuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFjdGl2ZSA9IHt9XG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIHRoZSBhY3RpdmUgcGFnZSwgYW5kIHNjcm9sbCB2aWV3cG9ydCB0byBzaG93IGl0XG5cbmFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSB1bmRlZmluZWRcbmZpbmRTY3JvbGxDb250YWluZXIgPSAtPlxuICBzY3JvbGxlZCA9ICQoXCJib2R5LCBodG1sXCIpLmZpbHRlciAtPiAkKHRoaXMpLnNjcm9sbExlZnQoKSA+IDBcbiAgaWYgc2Nyb2xsZWQubGVuZ3RoID4gMFxuICAgIHNjcm9sbGVkXG4gIGVsc2VcbiAgICAkKFwiYm9keSwgaHRtbFwiKS5zY3JvbGxMZWZ0KDEyKS5maWx0ZXIoLT4gJCh0aGlzKS5zY3JvbGxMZWZ0KCkgPiAwKS5zY3JvbGxUb3AoMClcblxuc2Nyb2xsVG8gPSAoZWwpIC0+XG4gIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPz0gZmluZFNjcm9sbENvbnRhaW5lcigpXG4gIGJvZHlXaWR0aCA9ICQoXCJib2R5XCIpLndpZHRoKClcbiAgbWluWCA9IGFjdGl2ZS5zY3JvbGxDb250YWluZXIuc2Nyb2xsTGVmdCgpXG4gIG1heFggPSBtaW5YICsgYm9keVdpZHRoXG4gIHRhcmdldCA9IGVsLnBvc2l0aW9uKCkubGVmdFxuICB3aWR0aCA9IGVsLm91dGVyV2lkdGgodHJ1ZSlcbiAgY29udGVudFdpZHRoID0gJChcIi5wYWdlXCIpLm91dGVyV2lkdGgodHJ1ZSkgKiAkKFwiLnBhZ2VcIikuc2l6ZSgpXG5cbiAgaWYgdGFyZ2V0IDwgbWluWFxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiB0YXJnZXRcbiAgZWxzZSBpZiB0YXJnZXQgKyB3aWR0aCA+IG1heFhcbiAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUgc2Nyb2xsTGVmdDogdGFyZ2V0IC0gKGJvZHlXaWR0aCAtIHdpZHRoKVxuICBlbHNlIGlmIG1heFggPiAkKFwiLnBhZ2VzXCIpLm91dGVyV2lkdGgoKVxuICAgIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSBzY3JvbGxMZWZ0OiBNYXRoLm1pbih0YXJnZXQsIGNvbnRlbnRXaWR0aCAtIGJvZHlXaWR0aClcblxuYWN0aXZlLnNldCA9IChlbCkgLT5cbiAgZWwgPSAkKGVsKVxuICAkKFwiLmFjdGl2ZVwiKS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKVxuICBzY3JvbGxUbyBlbC5hZGRDbGFzcyhcImFjdGl2ZVwiKVxuXG4iLCJ3aWtpID0gcmVxdWlyZSAnLi93aWtpLmNvZmZlZSdcbm1vZHVsZS5leHBvcnRzID0gd2lraS51dGlsID0gdXRpbCA9IHt9XG5cbnV0aWwuc3ltYm9scyA9XG4gIGNyZWF0ZTogJ+KYvCdcbiAgYWRkOiAnKydcbiAgZWRpdDogJ+KcjidcbiAgZm9yazogJ+KakSdcbiAgbW92ZTogJ+KGlSdcbiAgcmVtb3ZlOiAn4pyVJ1xuXG51dGlsLnJhbmRvbUJ5dGUgPSAtPlxuICAoKCgxK01hdGgucmFuZG9tKCkpKjB4MTAwKXwwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpXG5cbnV0aWwucmFuZG9tQnl0ZXMgPSAobikgLT5cbiAgKHV0aWwucmFuZG9tQnl0ZSgpIGZvciBbMS4ubl0pLmpvaW4oJycpXG5cbiMgZm9yIGNoYXJ0IHBsdWctaW5cbnV0aWwuZm9ybWF0VGltZSA9ICh0aW1lKSAtPlxuICBkID0gbmV3IERhdGUgKGlmIHRpbWUgPiAxMDAwMDAwMDAwMCB0aGVuIHRpbWUgZWxzZSB0aW1lKjEwMDApXG4gIG1vID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddW2QuZ2V0TW9udGgoKV1cbiAgaCA9IGQuZ2V0SG91cnMoKVxuICBhbSA9IGlmIGggPCAxMiB0aGVuICdBTScgZWxzZSAnUE0nXG4gIGggPSBpZiBoID09IDAgdGhlbiAxMiBlbHNlIGlmIGggPiAxMiB0aGVuIGggLSAxMiBlbHNlIGhcbiAgbWkgPSAoaWYgZC5nZXRNaW51dGVzKCkgPCAxMCB0aGVuIFwiMFwiIGVsc2UgXCJcIikgKyBkLmdldE1pbnV0ZXMoKVxuICBcIiN7aH06I3ttaX0gI3thbX08YnI+I3tkLmdldERhdGUoKX0gI3ttb30gI3tkLmdldEZ1bGxZZWFyKCl9XCJcblxuIyBmb3Igam91cm5hbCBtb3VzZS1vdmVycyBhbmQgcG9zc2libHkgZm9yIGRhdGUgaGVhZGVyXG51dGlsLmZvcm1hdERhdGUgPSAobXNTaW5jZUVwb2NoKSAtPlxuICBkID0gbmV3IERhdGUobXNTaW5jZUVwb2NoKVxuICB3ayA9IFsnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J11bZC5nZXREYXkoKV1cbiAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXVxuICBkYXkgPSBkLmdldERhdGUoKTtcbiAgeXIgPSBkLmdldEZ1bGxZZWFyKCk7XG4gIGggPSBkLmdldEhvdXJzKClcbiAgYW0gPSBpZiBoIDwgMTIgdGhlbiAnQU0nIGVsc2UgJ1BNJ1xuICBoID0gaWYgaCA9PSAwIHRoZW4gMTIgZWxzZSBpZiBoID4gMTIgdGhlbiBoIC0gMTIgZWxzZSBoXG4gIG1pID0gKGlmIGQuZ2V0TWludXRlcygpIDwgMTAgdGhlbiBcIjBcIiBlbHNlIFwiXCIpICsgZC5nZXRNaW51dGVzKClcbiAgc2VjID0gKGlmIGQuZ2V0U2Vjb25kcygpIDwgMTAgdGhlbiBcIjBcIiBlbHNlIFwiXCIpICsgZC5nZXRTZWNvbmRzKClcbiAgXCIje3drfSAje21vfSAje2RheX0sICN7eXJ9PGJyPiN7aH06I3ttaX06I3tzZWN9ICN7YW19XCJcblxudXRpbC5mb3JtYXRFbGFwc2VkVGltZSA9IChtc1NpbmNlRXBvY2gpIC0+XG4gIG1zZWNzID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbXNTaW5jZUVwb2NoKVxuICByZXR1cm4gXCIje01hdGguZmxvb3IgbXNlY3N9IG1pbGxpc2Vjb25kcyBhZ29cIiBpZiAoc2VjcyA9IG1zZWNzLzEwMDApIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3Igc2Vjc30gc2Vjb25kcyBhZ29cIiBpZiAobWlucyA9IHNlY3MvNjApIDwgMlxuICByZXR1cm4gXCIje01hdGguZmxvb3IgbWluc30gbWludXRlcyBhZ29cIiBpZiAoaHJzID0gbWlucy82MCkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBocnN9IGhvdXJzIGFnb1wiIGlmIChkYXlzID0gaHJzLzI0KSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIGRheXN9IGRheXMgYWdvXCIgaWYgKHdlZWtzID0gZGF5cy83KSA8IDJcbiAgcmV0dXJuIFwiI3tNYXRoLmZsb29yIHdlZWtzfSB3ZWVrcyBhZ29cIiBpZiAobW9udGhzID0gZGF5cy8zMSkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciBtb250aHN9IG1vbnRocyBhZ29cIiBpZiAoeWVhcnMgPSBkYXlzLzM2NSkgPCAyXG4gIHJldHVybiBcIiN7TWF0aC5mbG9vciB5ZWFyc30geWVhcnMgYWdvXCJcblxuIyBERUZBVUxUUyBmb3IgcmVxdWlyZWQgZmllbGRzXG5cbnV0aWwuZW1wdHlQYWdlID0gKCkgLT5cbiAgdGl0bGU6ICdlbXB0eSdcbiAgc3Rvcnk6IFtdXG4gIGpvdXJuYWw6IFtdXG5cblxuIyBJZiB0aGUgc2VsZWN0aW9uIHN0YXJ0IGFuZCBzZWxlY3Rpb24gZW5kIGFyZSBib3RoIHRoZSBzYW1lLFxuIyB0aGVuIHlvdSBoYXZlIHRoZSBjYXJldCBwb3NpdGlvbi4gSWYgdGhlcmUgaXMgc2VsZWN0ZWQgdGV4dCwgXG4jIHRoZSBicm93c2VyIHdpbGwgbm90IHRlbGwgeW91IHdoZXJlIHRoZSBjYXJldCBpcywgYnV0IGl0IHdpbGwgXG4jIGVpdGhlciBiZSBhdCB0aGUgYmVnaW5uaW5nIG9yIHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvbiBcbiMoZGVwZW5kaW5nIG9uIHRoZSBkaXJlY3Rpb24gb2YgdGhlIHNlbGVjdGlvbikuXG51dGlsLmdldFNlbGVjdGlvblBvcyA9IChqUXVlcnlFbGVtZW50KSAtPiBcbiAgZWwgPSBqUXVlcnlFbGVtZW50LmdldCgwKSAjIGdldHMgRE9NIE5vZGUgZnJvbSBmcm9tIGpRdWVyeSB3cmFwcGVyXG4gIGlmIGRvY3VtZW50LnNlbGVjdGlvbiAjIElFXG4gICAgZWwuZm9jdXMoKVxuICAgIHNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpXG4gICAgc2VsLm1vdmVTdGFydCAnY2hhcmFjdGVyJywgLWVsLnZhbHVlLmxlbmd0aFxuICAgIGllUG9zID0gc2VsLnRleHQubGVuZ3RoXG4gICAge3N0YXJ0OiBpZVBvcywgZW5kOiBpZVBvc31cbiAgZWxzZVxuICAgIHtzdGFydDogZWwuc2VsZWN0aW9uU3RhcnQsIGVuZDogZWwuc2VsZWN0aW9uRW5kfVxuXG51dGlsLnNldENhcmV0UG9zaXRpb24gPSAoalF1ZXJ5RWxlbWVudCwgY2FyZXRQb3MpIC0+XG4gIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMClcbiAgaWYgZWw/XG4gICAgaWYgZWwuY3JlYXRlVGV4dFJhbmdlICMgSUVcbiAgICAgIHJhbmdlID0gZWwuY3JlYXRlVGV4dFJhbmdlKClcbiAgICAgIHJhbmdlLm1vdmUgXCJjaGFyYWN0ZXJcIiwgY2FyZXRQb3NcbiAgICAgIHJhbmdlLnNlbGVjdCgpXG4gICAgZWxzZSAjIHJlc3Qgb2YgdGhlIHdvcmxkXG4gICAgICBlbC5zZXRTZWxlY3Rpb25SYW5nZSBjYXJldFBvcywgY2FyZXRQb3NcbiAgICBlbC5mb2N1cygpXG5cbiIsInV0aWwgPSByZXF1aXJlKCcuL3V0aWwuY29mZmVlJylcbndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBsdWdpbiA9IHt9XG5cbiMgVE9ETzogUmVtb3ZlIHRoZXNlIG1ldGhvZHMgZnJvbSB3aWtpIG9iamVjdD9cbiNcblxuc2NyaXB0cyA9IHt9XG5nZXRTY3JpcHQgPSB3aWtpLmdldFNjcmlwdCA9ICh1cmwsIGNhbGxiYWNrID0gKCkgLT4pIC0+XG4gIGlmIHNjcmlwdHNbdXJsXT9cbiAgICBjYWxsYmFjaygpXG4gIGVsc2VcbiAgICAkLmdldFNjcmlwdCh1cmwpXG4gICAgICAuZG9uZSAtPlxuICAgICAgICBzY3JpcHRzW3VybF0gPSB0cnVlXG4gICAgICAgIGNhbGxiYWNrKClcbiAgICAgIC5mYWlsIC0+XG4gICAgICAgIGNhbGxiYWNrKClcblxucGx1Z2luLmdldCA9IHdpa2kuZ2V0UGx1Z2luID0gKG5hbWUsIGNhbGxiYWNrKSAtPlxuICByZXR1cm4gY2FsbGJhY2sod2luZG93LnBsdWdpbnNbbmFtZV0pIGlmIHdpbmRvdy5wbHVnaW5zW25hbWVdXG4gIGdldFNjcmlwdCBcIi9wbHVnaW5zLyN7bmFtZX0vI3tuYW1lfS5qc1wiLCAoKSAtPlxuICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSkgaWYgd2luZG93LnBsdWdpbnNbbmFtZV1cbiAgICBnZXRTY3JpcHQgXCIvcGx1Z2lucy8je25hbWV9LmpzXCIsICgpIC0+XG4gICAgICBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSlcblxucGx1Z2luLmRvID0gd2lraS5kb1BsdWdpbiA9IChkaXYsIGl0ZW0sIGRvbmU9LT4pIC0+XG4gIGVycm9yID0gKGV4KSAtPlxuICAgIGVycm9yRWxlbWVudCA9ICQoXCI8ZGl2IC8+XCIpLmFkZENsYXNzKCdlcnJvcicpXG4gICAgZXJyb3JFbGVtZW50LnRleHQoZXgudG9TdHJpbmcoKSlcbiAgICBkaXYuYXBwZW5kKGVycm9yRWxlbWVudClcblxuICBkaXYuZGF0YSAncGFnZUVsZW1lbnQnLCBkaXYucGFyZW50cyhcIi5wYWdlXCIpXG4gIGRpdi5kYXRhICdpdGVtJywgaXRlbVxuICBwbHVnaW4uZ2V0IGl0ZW0udHlwZSwgKHNjcmlwdCkgLT5cbiAgICB0cnlcbiAgICAgIHRocm93IFR5cGVFcnJvcihcIkNhbid0IGZpbmQgcGx1Z2luIGZvciAnI3tpdGVtLnR5cGV9J1wiKSB1bmxlc3Mgc2NyaXB0P1xuICAgICAgaWYgc2NyaXB0LmVtaXQubGVuZ3RoID4gMlxuICAgICAgICBzY3JpcHQuZW1pdCBkaXYsIGl0ZW0sIC0+XG4gICAgICAgICAgc2NyaXB0LmJpbmQgZGl2LCBpdGVtXG4gICAgICAgICAgZG9uZSgpXG4gICAgICBlbHNlXG4gICAgICAgIHNjcmlwdC5lbWl0IGRpdiwgaXRlbVxuICAgICAgICBzY3JpcHQuYmluZCBkaXYsIGl0ZW1cbiAgICAgICAgZG9uZSgpXG4gICAgY2F0Y2ggZXJyXG4gICAgICB3aWtpLmxvZyAncGx1Z2luIGVycm9yJywgZXJyXG4gICAgICBlcnJvcihlcnIpXG4gICAgICBkb25lKClcblxud2lraS5yZWdpc3RlclBsdWdpbiA9IChwbHVnaW5OYW1lLHBsdWdpbkZuKS0+XG4gIHdpbmRvdy5wbHVnaW5zW3BsdWdpbk5hbWVdID0gcGx1Z2luRm4oJClcblxuXG4jIFBMVUdJTlMgZm9yIGVhY2ggc3RvcnkgaXRlbSB0eXBlXG5cbndpbmRvdy5wbHVnaW5zID1cbiAgcGFyYWdyYXBoOlxuICAgIGVtaXQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBmb3IgdGV4dCBpbiBpdGVtLnRleHQuc3BsaXQgL1xcblxcbisvXG4gICAgICAgIGRpdi5hcHBlbmQgXCI8cD4je3dpa2kucmVzb2x2ZUxpbmtzKHRleHQpfTwvcD5cIiBpZiB0ZXh0Lm1hdGNoIC9cXFMvXG4gICAgYmluZDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGRpdi5kYmxjbGljayAtPiB3aWtpLnRleHRFZGl0b3IgZGl2LCBpdGVtLCBudWxsLCB0cnVlXG4gIGltYWdlOlxuICAgIGVtaXQ6IChkaXYsIGl0ZW0pIC0+XG4gICAgICBpdGVtLnRleHQgfHw9IGl0ZW0uY2FwdGlvblxuICAgICAgZGl2LmFwcGVuZCBcIjxpbWcgY2xhc3M9dGh1bWJuYWlsIHNyYz1cXFwiI3tpdGVtLnVybH1cXFwiPiA8cD4je3dpa2kucmVzb2x2ZUxpbmtzKGl0ZW0udGV4dCl9PC9wPlwiXG4gICAgYmluZDogKGRpdiwgaXRlbSkgLT5cbiAgICAgIGRpdi5kYmxjbGljayAtPiB3aWtpLnRleHRFZGl0b3IgZGl2LCBpdGVtXG4gICAgICBkaXYuZmluZCgnaW1nJykuZGJsY2xpY2sgLT4gd2lraS5kaWFsb2cgaXRlbS50ZXh0LCB0aGlzXG4gIGZ1dHVyZTpcbiAgICBlbWl0OiAoZGl2LCBpdGVtKSAtPlxuICAgICAgZGl2LmFwcGVuZCBcIlwiXCIje2l0ZW0udGV4dH08YnI+PGJyPjxidXR0b24gY2xhc3M9XCJjcmVhdGVcIj5jcmVhdGU8L2J1dHRvbj4gbmV3IGJsYW5rIHBhZ2VcIlwiXCJcbiAgICAgIGlmIChpbmZvID0gd2lraS5uZWlnaGJvcmhvb2RbbG9jYXRpb24uaG9zdF0pPyBhbmQgaW5mby5zaXRlbWFwP1xuICAgICAgICBmb3IgaXRlbSBpbiBpbmZvLnNpdGVtYXBcbiAgICAgICAgICBpZiBpdGVtLnNsdWcubWF0Y2ggLy10ZW1wbGF0ZSQvXG4gICAgICAgICAgICBkaXYuYXBwZW5kIFwiXCJcIjxicj48YnV0dG9uIGNsYXNzPVwiY3JlYXRlXCIgZGF0YS1zbHVnPSN7aXRlbS5zbHVnfT5jcmVhdGU8L2J1dHRvbj4gZnJvbSAje3dpa2kucmVzb2x2ZUxpbmtzIFwiW1sje2l0ZW0udGl0bGV9XV1cIn1cIlwiXCJcbiAgICBiaW5kOiAoZGl2LCBpdGVtKSAtPlxuIiwid2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGUgPSB7fVxuXG4jIEZVTkNUSU9OUyBhbmQgSEFORExFUlMgdG8gbWFuYWdlIGxvY2F0aW9uIGJhciBhbmQgYmFjayBidXR0b25cblxuc3RhdGUucGFnZXNJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPiBlbC5pZFxuXG5zdGF0ZS51cmxQYWdlcyA9IC0+XG4gIChpIGZvciBpIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKSBieSAyKVsxLi5dXG5cbnN0YXRlLmxvY3NJbkRvbSA9IC0+XG4gICQubWFrZUFycmF5ICQoXCIucGFnZVwiKS5tYXAgKF8sIGVsKSAtPlxuICAgICQoZWwpLmRhdGEoJ3NpdGUnKSBvciAndmlldydcblxuc3RhdGUudXJsTG9jcyA9IC0+XG4gIChqIGZvciBqIGluICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykuc3BsaXQoJy8nKVsxLi5dIGJ5IDIpXG5cbnN0YXRlLnNldFVybCA9IC0+XG4gIGRvY3VtZW50LnRpdGxlID0gJCgnLnBhZ2U6bGFzdCcpLmRhdGEoJ2RhdGEnKT8udGl0bGVcbiAgaWYgaGlzdG9yeSBhbmQgaGlzdG9yeS5wdXNoU3RhdGVcbiAgICBsb2NzID0gc3RhdGUubG9jc0luRG9tKClcbiAgICBwYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICAgIHVybCA9IChcIi8je2xvY3M/W2lkeF0gb3IgJ3ZpZXcnfS8je3BhZ2V9XCIgZm9yIHBhZ2UsIGlkeCBpbiBwYWdlcykuam9pbignJylcbiAgICB1bmxlc3MgdXJsIGlzICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJylcbiAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIHVybClcblxuc3RhdGUuc2hvdyA9IChlKSAtPlxuICBvbGRQYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKVxuICBuZXdQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgb2xkTG9jcyA9IHN0YXRlLmxvY3NJbkRvbSgpXG4gIG5ld0xvY3MgPSBzdGF0ZS51cmxMb2NzKClcblxuICByZXR1cm4gaWYgKCFsb2NhdGlvbi5wYXRobmFtZSBvciBsb2NhdGlvbi5wYXRobmFtZSBpcyAnLycpXG5cbiAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKDApXG5cbiAgZm9yIG5hbWUsIGlkeCBpbiBuZXdQYWdlc1xuICAgIHVubGVzcyBuYW1lIGlzIG9sZFBhZ2VzW2lkeF1cbiAgICAgIG9sZCA9ICQoJy5wYWdlJykuZXEoaWR4KVxuICAgICAgb2xkLnJlbW92ZSgpIGlmIG9sZFxuICAgICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsIG5ld0xvY3NbaWR4XSkuaW5zZXJ0QWZ0ZXIocHJldmlvdXMpLmVhY2ggd2lraS5yZWZyZXNoXG4gICAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKGlkeClcblxuICBwcmV2aW91cy5uZXh0QWxsKCkucmVtb3ZlKClcblxuICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKVxuICBkb2N1bWVudC50aXRsZSA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJyk/LnRpdGxlXG5cbnN0YXRlLmZpcnN0ID0gLT5cbiAgc3RhdGUuc2V0VXJsKClcbiAgZmlyc3RVcmxQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKClcbiAgZmlyc3RVcmxMb2NzID0gc3RhdGUudXJsTG9jcygpXG4gIG9sZFBhZ2VzID0gc3RhdGUucGFnZXNJbkRvbSgpXG4gIGZvciB1cmxQYWdlLCBpZHggaW4gZmlyc3RVcmxQYWdlcyB3aGVuIHVybFBhZ2Ugbm90IGluIG9sZFBhZ2VzXG4gICAgd2lraS5jcmVhdGVQYWdlKHVybFBhZ2UsIGZpcnN0VXJsTG9jc1tpZHhdKS5hcHBlbmRUbygnLm1haW4nKSB1bmxlc3MgdXJsUGFnZSBpcyAnJ1xuXG4iLCJfID0gcmVxdWlyZSAndW5kZXJzY29yZSdcblxud2lraSA9IHJlcXVpcmUgJy4vd2lraS5jb2ZmZWUnXG51dGlsID0gcmVxdWlyZSAnLi91dGlsLmNvZmZlZSdcbnN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZS5jb2ZmZWUnXG5yZXZpc2lvbiA9IHJlcXVpcmUgJy4vcmV2aXNpb24uY29mZmVlJ1xuYWRkVG9Kb3VybmFsID0gcmVxdWlyZSAnLi9hZGRUb0pvdXJuYWwuY29mZmVlJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBhZ2VIYW5kbGVyID0ge31cblxucGFnZUZyb21Mb2NhbFN0b3JhZ2UgPSAoc2x1ZyktPlxuICBpZiBqc29uID0gbG9jYWxTdG9yYWdlW3NsdWddXG4gICAgSlNPTi5wYXJzZShqc29uKVxuICBlbHNlXG4gICAgdW5kZWZpbmVkXG5cbnJlY3Vyc2l2ZUdldCA9ICh7cGFnZUluZm9ybWF0aW9uLCB3aGVuR290dGVuLCB3aGVuTm90R290dGVuLCBsb2NhbENvbnRleHR9KSAtPlxuICB7c2x1ZyxyZXYsc2l0ZX0gPSBwYWdlSW5mb3JtYXRpb25cblxuICBpZiBzaXRlXG4gICAgbG9jYWxDb250ZXh0ID0gW11cbiAgZWxzZVxuICAgIHNpdGUgPSBsb2NhbENvbnRleHQuc2hpZnQoKVxuXG4gIHNpdGUgPSBudWxsIGlmIHNpdGU9PSd2aWV3J1xuXG4gIGlmIHNpdGU/XG4gICAgaWYgc2l0ZSA9PSAnbG9jYWwnXG4gICAgICBpZiBsb2NhbFBhZ2UgPSBwYWdlRnJvbUxvY2FsU3RvcmFnZShwYWdlSW5mb3JtYXRpb24uc2x1ZylcbiAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4oIGxvY2FsUGFnZSwgJ2xvY2FsJyApXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB3aGVuTm90R290dGVuKClcbiAgICBlbHNlXG4gICAgICBpZiBzaXRlID09ICdvcmlnaW4nXG4gICAgICAgIHVybCA9IFwiLyN7c2x1Z30uanNvblwiXG4gICAgICBlbHNlXG4gICAgICAgIHVybCA9IFwiaHR0cDovLyN7c2l0ZX0vI3tzbHVnfS5qc29uXCJcbiAgZWxzZVxuICAgIHVybCA9IFwiLyN7c2x1Z30uanNvblwiXG5cbiAgJC5hamF4XG4gICAgdHlwZTogJ0dFVCdcbiAgICBkYXRhVHlwZTogJ2pzb24nXG4gICAgdXJsOiB1cmwgKyBcIj9yYW5kb209I3t1dGlsLnJhbmRvbUJ5dGVzKDQpfVwiXG4gICAgc3VjY2VzczogKHBhZ2UpIC0+XG4gICAgICBwYWdlID0gcmV2aXNpb24uY3JlYXRlIHJldiwgcGFnZSBpZiByZXZcbiAgICAgIHJldHVybiB3aGVuR290dGVuKHBhZ2Usc2l0ZSlcbiAgICBlcnJvcjogKHhociwgdHlwZSwgbXNnKSAtPlxuICAgICAgaWYgKHhoci5zdGF0dXMgIT0gNDA0KSBhbmQgKHhoci5zdGF0dXMgIT0gMClcbiAgICAgICAgd2lraS5sb2cgJ3BhZ2VIYW5kbGVyLmdldCBlcnJvcicsIHhociwgeGhyLnN0YXR1cywgdHlwZSwgbXNnXG4gICAgICAgIHJlcG9ydCA9XG4gICAgICAgICAgJ3RpdGxlJzogXCIje3hoci5zdGF0dXN9ICN7bXNnfVwiXG4gICAgICAgICAgJ3N0b3J5JzogW1xuICAgICAgICAgICAgJ3R5cGUnOiAncGFyYWdyYXBoJ1xuICAgICAgICAgICAgJ2lkJzogJzkyODczOTE4NzI0MydcbiAgICAgICAgICAgICd0ZXh0JzogXCI8cHJlPiN7eGhyLnJlc3BvbnNlVGV4dH1cIlxuICAgICAgICAgIF1cbiAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4gcmVwb3J0LCAnbG9jYWwnXG4gICAgICBpZiBsb2NhbENvbnRleHQubGVuZ3RoID4gMFxuICAgICAgICByZWN1cnNpdmVHZXQoIHtwYWdlSW5mb3JtYXRpb24sIHdoZW5Hb3R0ZW4sIHdoZW5Ob3RHb3R0ZW4sIGxvY2FsQ29udGV4dH0gKVxuICAgICAgZWxzZVxuICAgICAgICB3aGVuTm90R290dGVuKClcblxucGFnZUhhbmRsZXIuZ2V0ID0gKHt3aGVuR290dGVuLHdoZW5Ob3RHb3R0ZW4scGFnZUluZm9ybWF0aW9ufSAgKSAtPlxuXG4gIHVubGVzcyBwYWdlSW5mb3JtYXRpb24uc2l0ZVxuICAgIGlmIGxvY2FsUGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VJbmZvcm1hdGlvbi5zbHVnKVxuICAgICAgbG9jYWxQYWdlID0gcmV2aXNpb24uY3JlYXRlIHBhZ2VJbmZvcm1hdGlvbi5yZXYsIGxvY2FsUGFnZSBpZiBwYWdlSW5mb3JtYXRpb24ucmV2XG4gICAgICByZXR1cm4gd2hlbkdvdHRlbiggbG9jYWxQYWdlLCAnbG9jYWwnIClcblxuICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyd2aWV3J10gdW5sZXNzIHBhZ2VIYW5kbGVyLmNvbnRleHQubGVuZ3RoXG5cbiAgcmVjdXJzaXZlR2V0XG4gICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cbiAgICB3aGVuR290dGVuOiB3aGVuR290dGVuXG4gICAgd2hlbk5vdEdvdHRlbjogd2hlbk5vdEdvdHRlblxuICAgIGxvY2FsQ29udGV4dDogXy5jbG9uZShwYWdlSGFuZGxlci5jb250ZXh0KVxuXG5cbnBhZ2VIYW5kbGVyLmNvbnRleHQgPSBbXVxuXG5wdXNoVG9Mb2NhbCA9IChwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbikgLT5cbiAgcGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlIHBhZ2VQdXRJbmZvLnNsdWdcbiAgcGFnZSA9IHt0aXRsZTogYWN0aW9uLml0ZW0udGl0bGV9IGlmIGFjdGlvbi50eXBlID09ICdjcmVhdGUnXG4gIHBhZ2UgfHw9IHBhZ2VFbGVtZW50LmRhdGEoXCJkYXRhXCIpXG4gIHBhZ2Uuam91cm5hbCA9IFtdIHVubGVzcyBwYWdlLmpvdXJuYWw/XG4gIGlmIChzaXRlPWFjdGlvblsnZm9yayddKT9cbiAgICBwYWdlLmpvdXJuYWwgPSBwYWdlLmpvdXJuYWwuY29uY2F0KHsndHlwZSc6J2ZvcmsnLCdzaXRlJzpzaXRlfSlcbiAgICBkZWxldGUgYWN0aW9uWydmb3JrJ11cbiAgcGFnZS5qb3VybmFsID0gcGFnZS5qb3VybmFsLmNvbmNhdChhY3Rpb24pXG4gIHBhZ2Uuc3RvcnkgPSAkKHBhZ2VFbGVtZW50KS5maW5kKFwiLml0ZW1cIikubWFwKC0+ICQoQCkuZGF0YShcIml0ZW1cIikpLmdldCgpXG4gIGxvY2FsU3RvcmFnZVtwYWdlUHV0SW5mby5zbHVnXSA9IEpTT04uc3RyaW5naWZ5KHBhZ2UpXG4gIGFkZFRvSm91cm5hbCBwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCBhY3Rpb25cblxucHVzaFRvU2VydmVyID0gKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKSAtPlxuICAkLmFqYXhcbiAgICB0eXBlOiAnUFVUJ1xuICAgIHVybDogXCIvcGFnZS8je3BhZ2VQdXRJbmZvLnNsdWd9L2FjdGlvblwiXG4gICAgZGF0YTpcbiAgICAgICdhY3Rpb24nOiBKU09OLnN0cmluZ2lmeShhY3Rpb24pXG4gICAgc3VjY2VzczogKCkgLT5cbiAgICAgIGFkZFRvSm91cm5hbCBwYWdlRWxlbWVudC5maW5kKCcuam91cm5hbCcpLCBhY3Rpb25cbiAgICAgIGlmIGFjdGlvbi50eXBlID09ICdmb3JrJyAjIHB1c2hcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0gcGFnZUVsZW1lbnQuYXR0cignaWQnKVxuICAgICAgICBzdGF0ZS5zZXRVcmxcbiAgICBlcnJvcjogKHhociwgdHlwZSwgbXNnKSAtPlxuICAgICAgd2lraS5sb2cgXCJwYWdlSGFuZGxlci5wdXQgYWpheCBlcnJvciBjYWxsYmFja1wiLCB0eXBlLCBtc2dcblxucGFnZUhhbmRsZXIucHV0ID0gKHBhZ2VFbGVtZW50LCBhY3Rpb24pIC0+XG5cbiAgY2hlY2tlZFNpdGUgPSAoKSAtPlxuICAgIHN3aXRjaCBzaXRlID0gcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpXG4gICAgICB3aGVuICdvcmlnaW4nLCAnbG9jYWwnLCAndmlldycgdGhlbiBudWxsXG4gICAgICB3aGVuIGxvY2F0aW9uLmhvc3QgdGhlbiBudWxsXG4gICAgICBlbHNlIHNpdGVcblxuICAjIGFib3V0IHRoZSBwYWdlIHdlIGhhdmVcbiAgcGFnZVB1dEluZm8gPSB7XG4gICAgc2x1ZzogcGFnZUVsZW1lbnQuYXR0cignaWQnKS5zcGxpdCgnX3JldicpWzBdXG4gICAgcmV2OiBwYWdlRWxlbWVudC5hdHRyKCdpZCcpLnNwbGl0KCdfcmV2JylbMV1cbiAgICBzaXRlOiBjaGVja2VkU2l0ZSgpXG4gICAgbG9jYWw6IHBhZ2VFbGVtZW50Lmhhc0NsYXNzKCdsb2NhbCcpXG4gIH1cbiAgZm9ya0Zyb20gPSBwYWdlUHV0SW5mby5zaXRlXG4gIHdpa2kubG9nICdwYWdlSGFuZGxlci5wdXQnLCBhY3Rpb24sIHBhZ2VQdXRJbmZvXG5cbiAgIyBkZXRlY3Qgd2hlbiBmb3JrIHRvIGxvY2FsIHN0b3JhZ2VcbiAgaWYgd2lraS51c2VMb2NhbFN0b3JhZ2UoKVxuICAgIGlmIHBhZ2VQdXRJbmZvLnNpdGU/XG4gICAgICB3aWtpLmxvZyAncmVtb3RlID0+IGxvY2FsJ1xuICAgIGVsc2UgaWYgIXBhZ2VQdXRJbmZvLmxvY2FsXG4gICAgICB3aWtpLmxvZyAnb3JpZ2luID0+IGxvY2FsJ1xuICAgICAgYWN0aW9uLnNpdGUgPSBmb3JrRnJvbSA9IGxvY2F0aW9uLmhvc3RcbiAgICAjIGVsc2UgaWYgIXBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VQdXRJbmZvLnNsdWcpXG4gICAgIyAgIHdpa2kubG9nICcnXG4gICAgIyAgIGFjdGlvbi5zaXRlID0gZm9ya0Zyb20gPSBwYWdlUHV0SW5mby5zaXRlXG4gICAgIyAgIHdpa2kubG9nICdsb2NhbCBzdG9yYWdlIGZpcnN0IHRpbWUnLCBhY3Rpb24sICdmb3JrRnJvbScsIGZvcmtGcm9tXG5cbiAgIyB0d2VlayBhY3Rpb24gYmVmb3JlIHNhdmluZ1xuICBhY3Rpb24uZGF0ZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKClcbiAgZGVsZXRlIGFjdGlvbi5zaXRlIGlmIGFjdGlvbi5zaXRlID09ICdvcmlnaW4nXG5cbiAgIyB1cGRhdGUgZG9tIHdoZW4gZm9ya2luZ1xuICBpZiBmb3JrRnJvbVxuICAgICMgcHVsbCByZW1vdGUgc2l0ZSBjbG9zZXIgdG8gdXNcbiAgICBwYWdlRWxlbWVudC5maW5kKCdoMSBpbWcnKS5hdHRyKCdzcmMnLCAnL2Zhdmljb24ucG5nJylcbiAgICBwYWdlRWxlbWVudC5maW5kKCdoMSBhJykuYXR0cignaHJlZicsICcvJylcbiAgICBwYWdlRWxlbWVudC5kYXRhKCdzaXRlJywgbnVsbClcbiAgICBwYWdlRWxlbWVudC5yZW1vdmVDbGFzcygncmVtb3RlJylcbiAgICBzdGF0ZS5zZXRVcmwoKVxuICAgIGlmIGFjdGlvbi50eXBlICE9ICdmb3JrJ1xuICAgICAgIyBidW5kbGUgaW1wbGljaXQgZm9yayB3aXRoIG5leHQgYWN0aW9uXG4gICAgICBhY3Rpb24uZm9yayA9IGZvcmtGcm9tXG4gICAgICBhZGRUb0pvdXJuYWwgcGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSxcbiAgICAgICAgdHlwZTogJ2ZvcmsnXG4gICAgICAgIHNpdGU6IGZvcmtGcm9tXG4gICAgICAgIGRhdGU6IGFjdGlvbi5kYXRlXG5cbiAgIyBzdG9yZSBhcyBhcHByb3ByaWF0ZVxuICBpZiB3aWtpLnVzZUxvY2FsU3RvcmFnZSgpIG9yIHBhZ2VQdXRJbmZvLnNpdGUgPT0gJ2xvY2FsJ1xuICAgIHB1c2hUb0xvY2FsKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKVxuICAgIHBhZ2VFbGVtZW50LmFkZENsYXNzKFwibG9jYWxcIilcbiAgZWxzZVxuICAgIHB1c2hUb1NlcnZlcihwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbilcblxuIiwiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUnXG5cbnV0aWwgPSByZXF1aXJlICcuL3V0aWwuY29mZmVlJ1xucGFnZUhhbmRsZXIgPSByZXF1aXJlICcuL3BhZ2VIYW5kbGVyLmNvZmZlZSdcbnBsdWdpbiA9IHJlcXVpcmUgJy4vcGx1Z2luLmNvZmZlZSdcbnN0YXRlID0gcmVxdWlyZSAnLi9zdGF0ZS5jb2ZmZWUnXG5uZWlnaGJvcmhvb2QgPSByZXF1aXJlICcuL25laWdoYm9yaG9vZC5jb2ZmZWUnXG5hZGRUb0pvdXJuYWwgPSByZXF1aXJlICcuL2FkZFRvSm91cm5hbC5jb2ZmZWUnXG53aWtpID0gcmVxdWlyZSgnLi93aWtpLmNvZmZlZScpXG5cbmhhbmRsZURyYWdnaW5nID0gKGV2dCwgdWkpIC0+XG4gIGl0ZW1FbGVtZW50ID0gdWkuaXRlbVxuXG4gIGl0ZW0gPSB3aWtpLmdldEl0ZW0oaXRlbUVsZW1lbnQpXG4gIHRoaXNQYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50cygnLnBhZ2U6Zmlyc3QnKVxuICBzb3VyY2VQYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JylcbiAgc291cmNlU2l0ZSA9IHNvdXJjZVBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKVxuXG4gIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wYXJlbnRzKCcucGFnZTpmaXJzdCcpXG4gIGVxdWFscyA9IChhLCBiKSAtPiBhIGFuZCBiIGFuZCBhLmdldCgwKSA9PSBiLmdldCgwKVxuXG4gIG1vdmVXaXRoaW5QYWdlID0gbm90IHNvdXJjZVBhZ2VFbGVtZW50IG9yIGVxdWFscyhzb3VyY2VQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudClcbiAgbW92ZUZyb21QYWdlID0gbm90IG1vdmVXaXRoaW5QYWdlIGFuZCBlcXVhbHModGhpc1BhZ2VFbGVtZW50LCBzb3VyY2VQYWdlRWxlbWVudClcbiAgbW92ZVRvUGFnZSA9IG5vdCBtb3ZlV2l0aGluUGFnZSBhbmQgZXF1YWxzKHRoaXNQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudClcblxuICBpZiBtb3ZlRnJvbVBhZ2VcbiAgICBpZiBzb3VyY2VQYWdlRWxlbWVudC5oYXNDbGFzcygnZ2hvc3QnKSBvclxuICAgICAgc291cmNlUGFnZUVsZW1lbnQuYXR0cignaWQnKSA9PSBkZXN0aW5hdGlvblBhZ2VFbGVtZW50LmF0dHIoJ2lkJylcbiAgICAgICAgIyBzdGVtIHRoZSBkYW1hZ2UsIGJldHRlciBpZGVhcyBoZXJlOlxuICAgICAgICAjIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMzkxNjA4OS9qcXVlcnktdWktc29ydGFibGVzLWNvbm5lY3QtbGlzdHMtY29weS1pdGVtc1xuICAgICAgICByZXR1cm5cblxuICBhY3Rpb24gPSBpZiBtb3ZlV2l0aGluUGFnZVxuICAgIG9yZGVyID0gJCh0aGlzKS5jaGlsZHJlbigpLm1hcCgoXywgdmFsdWUpIC0+ICQodmFsdWUpLmF0dHIoJ2RhdGEtaWQnKSkuZ2V0KClcbiAgICB7dHlwZTogJ21vdmUnLCBvcmRlcjogb3JkZXJ9XG4gIGVsc2UgaWYgbW92ZUZyb21QYWdlXG4gICAgd2lraS5sb2cgJ2RyYWcgZnJvbScsIHNvdXJjZVBhZ2VFbGVtZW50LmZpbmQoJ2gxJykudGV4dCgpXG4gICAge3R5cGU6ICdyZW1vdmUnfVxuICBlbHNlIGlmIG1vdmVUb1BhZ2VcbiAgICBpdGVtRWxlbWVudC5kYXRhICdwYWdlRWxlbWVudCcsIHRoaXNQYWdlRWxlbWVudFxuICAgIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpXG4gICAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpXG4gICAge3R5cGU6ICdhZGQnLCBpdGVtOiBpdGVtLCBhZnRlcjogYmVmb3JlPy5pZH1cbiAgYWN0aW9uLmlkID0gaXRlbS5pZFxuICBwYWdlSGFuZGxlci5wdXQgdGhpc1BhZ2VFbGVtZW50LCBhY3Rpb25cblxuaW5pdERyYWdnaW5nID0gKCRwYWdlKSAtPlxuICAkc3RvcnkgPSAkcGFnZS5maW5kKCcuc3RvcnknKVxuICAkc3Rvcnkuc29ydGFibGUoY29ubmVjdFdpdGg6ICcucGFnZSAuc3RvcnknKS5vbihcInNvcnR1cGRhdGVcIiwgaGFuZGxlRHJhZ2dpbmcpXG5cblxuaW5pdEFkZEJ1dHRvbiA9ICgkcGFnZSkgLT5cbiAgJHBhZ2UuZmluZChcIi5hZGQtZmFjdG9yeVwiKS5saXZlIFwiY2xpY2tcIiwgKGV2dCkgLT5cbiAgICByZXR1cm4gaWYgJHBhZ2UuaGFzQ2xhc3MgJ2dob3N0J1xuICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY3JlYXRlRmFjdG9yeSgkcGFnZSlcblxuY3JlYXRlRmFjdG9yeSA9ICgkcGFnZSkgLT5cbiAgaXRlbSA9XG4gICAgdHlwZTogXCJmYWN0b3J5XCJcbiAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICBpdGVtRWxlbWVudCA9ICQoXCI8ZGl2IC8+XCIsIGNsYXNzOiBcIml0ZW0gZmFjdG9yeVwiKS5kYXRhKCdpdGVtJyxpdGVtKS5hdHRyKCdkYXRhLWlkJywgaXRlbS5pZClcbiAgaXRlbUVsZW1lbnQuZGF0YSAncGFnZUVsZW1lbnQnLCAkcGFnZVxuICAkcGFnZS5maW5kKFwiLnN0b3J5XCIpLmFwcGVuZChpdGVtRWxlbWVudClcbiAgcGx1Z2luLmRvIGl0ZW1FbGVtZW50LCBpdGVtXG4gIGJlZm9yZUVsZW1lbnQgPSBpdGVtRWxlbWVudC5wcmV2KCcuaXRlbScpXG4gIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KVxuICBwYWdlSGFuZGxlci5wdXQgJHBhZ2UsIHtpdGVtOiBpdGVtLCBpZDogaXRlbS5pZCwgdHlwZTogXCJhZGRcIiwgYWZ0ZXI6IGJlZm9yZT8uaWR9XG5cbmJ1aWxkUGFnZUhlYWRlciA9ICh7cGFnZSx0b29sdGlwLGhlYWRlcl9ocmVmLGZhdmljb25fc3JjfSktPlxuICB0b29sdGlwICs9IFwiXFxuI3twYWdlLnBsdWdpbn0gcGx1Z2luXCIgaWYgcGFnZS5wbHVnaW5cbiAgXCJcIlwiPGgxIHRpdGxlPVwiI3t0b29sdGlwfVwiPjxhIGhyZWY9XCIje2hlYWRlcl9ocmVmfVwiPjxpbWcgc3JjPVwiI3tmYXZpY29uX3NyY31cIiBoZWlnaHQ9XCIzMnB4XCIgY2xhc3M9XCJmYXZpY29uXCI+PC9hPiAje3BhZ2UudGl0bGV9PC9oMT5cIlwiXCJcblxuZW1pdEhlYWRlciA9ICgkaGVhZGVyLCAkcGFnZSwgcGFnZSkgLT5cbiAgc2l0ZSA9ICRwYWdlLmRhdGEoJ3NpdGUnKVxuICBpc1JlbW90ZVBhZ2UgPSBzaXRlPyBhbmQgc2l0ZSAhPSAnbG9jYWwnIGFuZCBzaXRlICE9ICdvcmlnaW4nIGFuZCBzaXRlICE9ICd2aWV3J1xuICBoZWFkZXIgPSAnJ1xuXG4gIHZpZXdIZXJlID0gaWYgd2lraS5hc1NsdWcocGFnZS50aXRsZSkgaXMgJ3dlbGNvbWUtdmlzaXRvcnMnIHRoZW4gXCJcIlxuICBlbHNlIFwiL3ZpZXcvI3t3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKX1cIlxuICBwYWdlSGVhZGVyID0gaWYgaXNSZW1vdGVQYWdlXG4gICAgYnVpbGRQYWdlSGVhZGVyXG4gICAgICB0b29sdGlwOiBzaXRlXG4gICAgICBoZWFkZXJfaHJlZjogXCIvLyN7c2l0ZX0vdmlldy93ZWxjb21lLXZpc2l0b3JzI3t2aWV3SGVyZX1cIlxuICAgICAgZmF2aWNvbl9zcmM6IFwiaHR0cDovLyN7c2l0ZX0vZmF2aWNvbi5wbmdcIlxuICAgICAgcGFnZTogcGFnZVxuICBlbHNlXG4gICAgYnVpbGRQYWdlSGVhZGVyXG4gICAgICB0b29sdGlwOiBsb2NhdGlvbi5ob3N0XG4gICAgICBoZWFkZXJfaHJlZjogXCIvdmlldy93ZWxjb21lLXZpc2l0b3JzI3t2aWV3SGVyZX1cIlxuICAgICAgZmF2aWNvbl9zcmM6IFwiL2Zhdmljb24ucG5nXCJcbiAgICAgIHBhZ2U6IHBhZ2VcblxuICAkaGVhZGVyLmFwcGVuZCggcGFnZUhlYWRlciApXG4gIFxuICB1bmxlc3MgaXNSZW1vdGVQYWdlXG4gICAgJCgnaW1nLmZhdmljb24nLCRwYWdlKS5lcnJvciAoZSktPlxuICAgICAgcGx1Z2luLmdldCAnZmF2aWNvbicsIChmYXZpY29uKSAtPlxuICAgICAgICBmYXZpY29uLmNyZWF0ZSgpXG5cbiAgaWYgJHBhZ2UuYXR0cignaWQnKS5tYXRjaCAvX3Jldi9cbiAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoLTFcbiAgICBkYXRlID0gcGFnZS5qb3VybmFsW3Jldl0uZGF0ZVxuICAgICRwYWdlLmFkZENsYXNzKCdnaG9zdCcpLmRhdGEoJ3JldicscmV2KVxuICAgICRoZWFkZXIuYXBwZW5kICQgXCJcIlwiXG4gICAgICA8aDIgY2xhc3M9XCJyZXZpc2lvblwiPlxuICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAje2lmIGRhdGU/IHRoZW4gdXRpbC5mb3JtYXREYXRlKGRhdGUpIGVsc2UgXCJSZXZpc2lvbiAje3Jldn1cIn1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9oMj5cbiAgICBcIlwiXCJcblxuZW1pdFR3aW5zID0gd2lraS5lbWl0VHdpbnMgPSAoJHBhZ2UpIC0+XG4gIHBhZ2UgPSAkcGFnZS5kYXRhICdkYXRhJ1xuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpIG9yIHdpbmRvdy5sb2NhdGlvbi5ob3N0XG4gIHNpdGUgPSB3aW5kb3cubG9jYXRpb24uaG9zdCBpZiBzaXRlIGluIFsndmlldycsICdvcmlnaW4nXVxuICBzbHVnID0gd2lraS5hc1NsdWcgcGFnZS50aXRsZVxuICBpZiAoYWN0aW9ucyA9IHBhZ2Uuam91cm5hbD8ubGVuZ3RoKT8gYW5kICh2aWV3aW5nID0gcGFnZS5qb3VybmFsW2FjdGlvbnMtMV0/LmRhdGUpP1xuICAgIHZpZXdpbmcgPSBNYXRoLmZsb29yKHZpZXdpbmcvMTAwMCkqMTAwMFxuICAgIGJpbnMgPSB7bmV3ZXI6W10sIHNhbWU6W10sIG9sZGVyOltdfVxuICAgICMge2ZlZC53aWtpLm9yZzogW3tzbHVnOiBcImhhcHBlbmluZ3NcIiwgdGl0bGU6IFwiSGFwcGVuaW5nc1wiLCBkYXRlOiAxMzU4OTc1MzAzMDAwLCBzeW5vcHNpczogXCJDaGFuZ2VzIGhlcmUgLi4uXCJ9XX1cbiAgICBmb3IgcmVtb3RlU2l0ZSwgaW5mbyBvZiB3aWtpLm5laWdoYm9yaG9vZFxuICAgICAgaWYgcmVtb3RlU2l0ZSAhPSBzaXRlIGFuZCBpbmZvLnNpdGVtYXA/XG4gICAgICAgIGZvciBpdGVtIGluIGluZm8uc2l0ZW1hcFxuICAgICAgICAgIGlmIGl0ZW0uc2x1ZyA9PSBzbHVnXG4gICAgICAgICAgICBiaW4gPSBpZiBpdGVtLmRhdGUgPiB2aWV3aW5nIHRoZW4gYmlucy5uZXdlclxuICAgICAgICAgICAgZWxzZSBpZiBpdGVtLmRhdGUgPCB2aWV3aW5nIHRoZW4gYmlucy5vbGRlclxuICAgICAgICAgICAgZWxzZSBiaW5zLnNhbWVcbiAgICAgICAgICAgIGJpbi5wdXNoIHtyZW1vdGVTaXRlLCBpdGVtfVxuICAgIHR3aW5zID0gW11cbiAgICAjIHtuZXdlcjpbcmVtb3RlU2l0ZTogXCJmZWQud2lraS5vcmdcIiwgaXRlbToge3NsdWc6IC4uLiwgZGF0ZTogLi4ufSwgLi4uXX1cbiAgICBmb3IgbGVnZW5kLCBiaW4gb2YgYmluc1xuICAgICAgY29udGludWUgdW5sZXNzIGJpbi5sZW5ndGhcbiAgICAgIGJpbi5zb3J0IChhLGIpIC0+XG4gICAgICAgIGEuaXRlbS5kYXRlIDwgYi5pdGVtLmRhdGVcbiAgICAgIGZsYWdzID0gZm9yIHtyZW1vdGVTaXRlLCBpdGVtfSwgaSBpbiBiaW5cbiAgICAgICAgYnJlYWsgaWYgaSA+PSA4XG4gICAgICAgIFwiXCJcIjxpbWcgY2xhc3M9XCJyZW1vdGVcIlxuICAgICAgICAgIHNyYz1cImh0dHA6Ly8je3JlbW90ZVNpdGV9L2Zhdmljb24ucG5nXCJcbiAgICAgICAgICBkYXRhLXNsdWc9XCIje3NsdWd9XCJcbiAgICAgICAgICBkYXRhLXNpdGU9XCIje3JlbW90ZVNpdGV9XCJcbiAgICAgICAgICB0aXRsZT1cIiN7cmVtb3RlU2l0ZX1cIj5cbiAgICAgICAgXCJcIlwiXG4gICAgICB0d2lucy5wdXNoIFwiI3tmbGFncy5qb2luICcmbmJzcDsnfSAje2xlZ2VuZH1cIlxuICAgICRwYWdlLmZpbmQoJy50d2lucycpLmh0bWwgXCJcIlwiPHA+I3t0d2lucy5qb2luIFwiLCBcIn08L3A+XCJcIlwiIGlmIHR3aW5zXG5cbnJlbmRlclBhZ2VJbnRvUGFnZUVsZW1lbnQgPSAocGFnZURhdGEsJHBhZ2UsIHNpdGVGb3VuZCkgLT5cbiAgcGFnZSA9ICQuZXh0ZW5kKHV0aWwuZW1wdHlQYWdlKCksIHBhZ2VEYXRhKVxuICAkcGFnZS5kYXRhKFwiZGF0YVwiLCBwYWdlKVxuICBzbHVnID0gJHBhZ2UuYXR0cignaWQnKVxuICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpXG5cbiAgY29udGV4dCA9IFsndmlldyddXG4gIGNvbnRleHQucHVzaCBzaXRlIGlmIHNpdGU/XG4gIGFkZENvbnRleHQgPSAoc2l0ZSkgLT4gY29udGV4dC5wdXNoIHNpdGUgaWYgc2l0ZT8gYW5kIG5vdCBfLmluY2x1ZGUgY29udGV4dCwgc2l0ZVxuICBhZGRDb250ZXh0IGFjdGlvbi5zaXRlIGZvciBhY3Rpb24gaW4gcGFnZS5qb3VybmFsLnNsaWNlKDApLnJldmVyc2UoKVxuXG4gIHdpa2kucmVzb2x1dGlvbkNvbnRleHQgPSBjb250ZXh0XG5cbiAgJHBhZ2UuZW1wdHkoKVxuICBbJHR3aW5zLCAkaGVhZGVyLCAkc3RvcnksICRqb3VybmFsLCAkZm9vdGVyXSA9IFsndHdpbnMnLCAnaGVhZGVyJywgJ3N0b3J5JywgJ2pvdXJuYWwnLCAnZm9vdGVyJ10ubWFwIChjbGFzc05hbWUpIC0+XG4gICAgJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoY2xhc3NOYW1lKS5hcHBlbmRUbygkcGFnZSlcblxuICBlbWl0SGVhZGVyICRoZWFkZXIsICRwYWdlLCBwYWdlXG5cbiAgZW1pdEl0ZW0gPSAoaSkgLT5cbiAgICByZXR1cm4gaWYgaSA+PSBwYWdlLnN0b3J5Lmxlbmd0aFxuICAgIGl0ZW0gPSBwYWdlLnN0b3J5W2ldXG4gICAgaWYgaXRlbT8udHlwZSBhbmQgaXRlbT8uaWRcbiAgICAgICRpdGVtID0gJCBcIlwiXCI8ZGl2IGNsYXNzPVwiaXRlbSAje2l0ZW0udHlwZX1cIiBkYXRhLWlkPVwiI3tpdGVtLmlkfVwiPlwiXCJcIlxuICAgICAgJHN0b3J5LmFwcGVuZCAkaXRlbVxuICAgICAgcGx1Z2luLmRvICRpdGVtLCBpdGVtLCAtPiBlbWl0SXRlbSBpKzFcbiAgICBlbHNlXG4gICAgICAkc3RvcnkuYXBwZW5kICQgXCJcIlwiPGRpdj48cCBjbGFzcz1cImVycm9yXCI+Q2FuJ3QgbWFrZSBzZW5zZSBvZiBzdG9yeVsje2l9XTwvcD48L2Rpdj5cIlwiXCJcbiAgICAgIGVtaXRJdGVtIGkrMVxuICBlbWl0SXRlbSAwXG5cbiAgZm9yIGFjdGlvbiBpbiBwYWdlLmpvdXJuYWxcbiAgICBhZGRUb0pvdXJuYWwgJGpvdXJuYWwsIGFjdGlvblxuXG4gIGVtaXRUd2lucyAkcGFnZVxuXG4gICRqb3VybmFsLmFwcGVuZCBcIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwiY29udHJvbC1idXR0b25zXCI+XG4gICAgICA8YSBocmVmPVwiI1wiIGNsYXNzPVwiYnV0dG9uIGZvcmstcGFnZVwiIHRpdGxlPVwiZm9yayB0aGlzIHBhZ2VcIj4je3V0aWwuc3ltYm9sc1snZm9yayddfTwvYT5cbiAgICAgIDxhIGhyZWY9XCIjXCIgY2xhc3M9XCJidXR0b24gYWRkLWZhY3RvcnlcIiB0aXRsZT1cImFkZCBwYXJhZ3JhcGhcIj4je3V0aWwuc3ltYm9sc1snYWRkJ119PC9hPlxuICAgIDwvZGl2PlxuICBcIlwiXCJcblxuICAkZm9vdGVyLmFwcGVuZCBcIlwiXCJcbiAgICA8YSBpZD1cImxpY2Vuc2VcIiBocmVmPVwiaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbGljZW5zZXMvYnktc2EvMy4wL1wiPkNDIEJZLVNBIDMuMDwvYT4gLlxuICAgIDxhIGNsYXNzPVwic2hvdy1wYWdlLXNvdXJjZVwiIGhyZWY9XCIvI3tzbHVnfS5qc29uP3JhbmRvbT0je3V0aWwucmFuZG9tQnl0ZXMoNCl9XCIgdGl0bGU9XCJzb3VyY2VcIj5KU09OPC9hPiAuXG4gICAgPGEgaHJlZj0gXCIvLyN7c2l0ZUZvdW5kIHx8IGxvY2F0aW9uLmhvc3R9LyN7c2x1Z30uaHRtbFwiPiN7c2l0ZUZvdW5kIHx8IGxvY2F0aW9uLmhvc3R9PC9hPlxuICBcIlwiXCJcblxuXG53aWtpLmJ1aWxkUGFnZSA9IChkYXRhLHNpdGVGb3VuZCwkcGFnZSkgLT5cblxuICBpZiBzaXRlRm91bmQgPT0gJ2xvY2FsJ1xuICAgICRwYWdlLmFkZENsYXNzKCdsb2NhbCcpXG4gIGVsc2UgaWYgc2l0ZUZvdW5kXG4gICAgc2l0ZUZvdW5kID0gJ29yaWdpbicgaWYgc2l0ZUZvdW5kIGlzIHdpbmRvdy5sb2NhdGlvbi5ob3N0XG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ3JlbW90ZScpIHVubGVzcyBzaXRlRm91bmQgaW4gWyd2aWV3JywgJ29yaWdpbiddXG4gICAgJHBhZ2UuZGF0YSgnc2l0ZScsIHNpdGVGb3VuZClcbiAgaWYgZGF0YS5wbHVnaW4/XG4gICAgJHBhZ2UuYWRkQ2xhc3MoJ3BsdWdpbicpXG5cbiAgI1RPRE86IGF2b2lkIHBhc3Npbmcgc2l0ZUZvdW5kXG4gIHJlbmRlclBhZ2VJbnRvUGFnZUVsZW1lbnQoIGRhdGEsICRwYWdlLCBzaXRlRm91bmQgKVxuXG4gIHN0YXRlLnNldFVybCgpXG5cbiAgaW5pdERyYWdnaW5nICRwYWdlXG4gIGluaXRBZGRCdXR0b24gJHBhZ2VcbiAgJHBhZ2VcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2ggPSB3aWtpLnJlZnJlc2ggPSAtPlxuICAkcGFnZSA9ICQodGhpcylcblxuICBbc2x1ZywgcmV2XSA9ICRwYWdlLmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVxuICBwYWdlSW5mb3JtYXRpb24gPSB7XG4gICAgc2x1Zzogc2x1Z1xuICAgIHJldjogcmV2XG4gICAgc2l0ZTogJHBhZ2UuZGF0YSgnc2l0ZScpXG4gIH1cblxuICBjcmVhdGVHaG9zdFBhZ2UgPSAtPlxuICAgIHRpdGxlID0gJChcIlwiXCJhW2hyZWY9XCIvI3tzbHVnfS5odG1sXCJdOmxhc3RcIlwiXCIpLnRleHQoKSBvciBzbHVnXG4gICAgcGFnZSA9XG4gICAgICAndGl0bGUnOiB0aXRsZVxuICAgICAgJ3N0b3J5JzogW1xuICAgICAgICAnaWQnOiB1dGlsLnJhbmRvbUJ5dGVzIDhcbiAgICAgICAgJ3R5cGUnOiAnZnV0dXJlJ1xuICAgICAgICAndGV4dCc6ICdXZSBjb3VsZCBub3QgZmluZCB0aGlzIHBhZ2UuJ1xuICAgICAgICAndGl0bGUnOiB0aXRsZVxuICAgICAgXVxuICAgIGhlYWRpbmcgPVxuICAgICAgJ3R5cGUnOiAncGFyYWdyYXBoJ1xuICAgICAgJ2lkJzogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgJ3RleHQnOiBcIldlIGRpZCBmaW5kIHRoZSBwYWdlIGluIHlvdXIgY3VycmVudCBuZWlnaGJvcmhvb2QuXCJcbiAgICBoaXRzID0gW11cbiAgICBmb3Igc2l0ZSwgaW5mbyBvZiB3aWtpLm5laWdoYm9yaG9vZFxuICAgICAgaWYgaW5mby5zaXRlbWFwP1xuICAgICAgICByZXN1bHQgPSBfLmZpbmQgaW5mby5zaXRlbWFwLCAoZWFjaCkgLT5cbiAgICAgICAgICBlYWNoLnNsdWcgPT0gc2x1Z1xuICAgICAgICBpZiByZXN1bHQ/XG4gICAgICAgICAgaGl0cy5wdXNoXG4gICAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIlxuICAgICAgICAgICAgXCJpZFwiOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAgICAgICBcInNpdGVcIjogc2l0ZVxuICAgICAgICAgICAgXCJzbHVnXCI6IHNsdWdcbiAgICAgICAgICAgIFwidGl0bGVcIjogcmVzdWx0LnRpdGxlIHx8IHNsdWdcbiAgICAgICAgICAgIFwidGV4dFwiOiByZXN1bHQuc3lub3BzaXMgfHwgJydcbiAgICBpZiBoaXRzLmxlbmd0aCA+IDBcbiAgICAgIHBhZ2Uuc3RvcnkucHVzaCBoZWFkaW5nLCBoaXRzLi4uXG4gICAgICBwYWdlLnN0b3J5WzBdLnRleHQgPSAnV2UgY291bGQgbm90IGZpbmQgdGhpcyBwYWdlIGluIHRoZSBleHBlY3RlZCBjb250ZXh0LidcblxuICAgIHdpa2kuYnVpbGRQYWdlKCBwYWdlLCB1bmRlZmluZWQsICRwYWdlICkuYWRkQ2xhc3MoJ2dob3N0JylcblxuICByZWdpc3Rlck5laWdoYm9ycyA9IChkYXRhLCBzaXRlKSAtPlxuICAgIGlmIF8uaW5jbHVkZSBbJ2xvY2FsJywgJ29yaWdpbicsICd2aWV3JywgbnVsbCwgdW5kZWZpbmVkXSwgc2l0ZVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgbG9jYXRpb24uaG9zdFxuICAgIGVsc2VcbiAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yIHNpdGVcbiAgICBmb3IgaXRlbSBpbiAoZGF0YS5zdG9yeSB8fCBbXSlcbiAgICAgIG5laWdoYm9yaG9vZC5yZWdpc3Rlck5laWdoYm9yIGl0ZW0uc2l0ZSBpZiBpdGVtLnNpdGU/XG4gICAgZm9yIGFjdGlvbiBpbiAoZGF0YS5qb3VybmFsIHx8IFtdKVxuICAgICAgbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgYWN0aW9uLnNpdGUgaWYgYWN0aW9uLnNpdGU/XG5cbiAgd2hlbkdvdHRlbiA9IChkYXRhLHNpdGVGb3VuZCkgLT5cbiAgICB3aWtpLmJ1aWxkUGFnZSggZGF0YSwgc2l0ZUZvdW5kLCAkcGFnZSApXG4gICAgcmVnaXN0ZXJOZWlnaGJvcnMoIGRhdGEsIHNpdGVGb3VuZCApXG5cbiAgcGFnZUhhbmRsZXIuZ2V0XG4gICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlblxuICAgIHdoZW5Ob3RHb3R0ZW46IGNyZWF0ZUdob3N0UGFnZVxuICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uXG5cbiIsIihmdW5jdGlvbigpey8vICAgICBVbmRlcnNjb3JlLmpzIDEuNC40XG4vLyAgICAgaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbi8vICAgICAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBJbmMuXG4vLyAgICAgVW5kZXJzY29yZSBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIEJhc2VsaW5lIHNldHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBnbG9iYWxgIG9uIHRoZSBzZXJ2ZXIuXG4gIHZhciByb290ID0gdGhpcztcblxuICAvLyBTYXZlIHRoZSBwcmV2aW91cyB2YWx1ZSBvZiB0aGUgYF9gIHZhcmlhYmxlLlxuICB2YXIgcHJldmlvdXNVbmRlcnNjb3JlID0gcm9vdC5fO1xuXG4gIC8vIEVzdGFibGlzaCB0aGUgb2JqZWN0IHRoYXQgZ2V0cyByZXR1cm5lZCB0byBicmVhayBvdXQgb2YgYSBsb29wIGl0ZXJhdGlvbi5cbiAgdmFyIGJyZWFrZXIgPSB7fTtcblxuICAvLyBTYXZlIGJ5dGVzIGluIHRoZSBtaW5pZmllZCAoYnV0IG5vdCBnemlwcGVkKSB2ZXJzaW9uOlxuICB2YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZSwgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlLCBGdW5jUHJvdG8gPSBGdW5jdGlvbi5wcm90b3R5cGU7XG5cbiAgLy8gQ3JlYXRlIHF1aWNrIHJlZmVyZW5jZSB2YXJpYWJsZXMgZm9yIHNwZWVkIGFjY2VzcyB0byBjb3JlIHByb3RvdHlwZXMuXG4gIHZhciBwdXNoICAgICAgICAgICAgID0gQXJyYXlQcm90by5wdXNoLFxuICAgICAgc2xpY2UgICAgICAgICAgICA9IEFycmF5UHJvdG8uc2xpY2UsXG4gICAgICBjb25jYXQgICAgICAgICAgID0gQXJyYXlQcm90by5jb25jYXQsXG4gICAgICB0b1N0cmluZyAgICAgICAgID0gT2JqUHJvdG8udG9TdHJpbmcsXG4gICAgICBoYXNPd25Qcm9wZXJ0eSAgID0gT2JqUHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbiAgLy8gQWxsICoqRUNNQVNjcmlwdCA1KiogbmF0aXZlIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9ucyB0aGF0IHdlIGhvcGUgdG8gdXNlXG4gIC8vIGFyZSBkZWNsYXJlZCBoZXJlLlxuICB2YXJcbiAgICBuYXRpdmVGb3JFYWNoICAgICAgPSBBcnJheVByb3RvLmZvckVhY2gsXG4gICAgbmF0aXZlTWFwICAgICAgICAgID0gQXJyYXlQcm90by5tYXAsXG4gICAgbmF0aXZlUmVkdWNlICAgICAgID0gQXJyYXlQcm90by5yZWR1Y2UsXG4gICAgbmF0aXZlUmVkdWNlUmlnaHQgID0gQXJyYXlQcm90by5yZWR1Y2VSaWdodCxcbiAgICBuYXRpdmVGaWx0ZXIgICAgICAgPSBBcnJheVByb3RvLmZpbHRlcixcbiAgICBuYXRpdmVFdmVyeSAgICAgICAgPSBBcnJheVByb3RvLmV2ZXJ5LFxuICAgIG5hdGl2ZVNvbWUgICAgICAgICA9IEFycmF5UHJvdG8uc29tZSxcbiAgICBuYXRpdmVJbmRleE9mICAgICAgPSBBcnJheVByb3RvLmluZGV4T2YsXG4gICAgbmF0aXZlTGFzdEluZGV4T2YgID0gQXJyYXlQcm90by5sYXN0SW5kZXhPZixcbiAgICBuYXRpdmVJc0FycmF5ICAgICAgPSBBcnJheS5pc0FycmF5LFxuICAgIG5hdGl2ZUtleXMgICAgICAgICA9IE9iamVjdC5rZXlzLFxuICAgIG5hdGl2ZUJpbmQgICAgICAgICA9IEZ1bmNQcm90by5iaW5kO1xuXG4gIC8vIENyZWF0ZSBhIHNhZmUgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgdXNlIGJlbG93LlxuICB2YXIgXyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBfKSByZXR1cm4gb2JqO1xuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBfKSkgcmV0dXJuIG5ldyBfKG9iaik7XG4gICAgdGhpcy5fd3JhcHBlZCA9IG9iajtcbiAgfTtcblxuICAvLyBFeHBvcnQgdGhlIFVuZGVyc2NvcmUgb2JqZWN0IGZvciAqKk5vZGUuanMqKiwgd2l0aFxuICAvLyBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eSBmb3IgdGhlIG9sZCBgcmVxdWlyZSgpYCBBUEkuIElmIHdlJ3JlIGluXG4gIC8vIHRoZSBicm93c2VyLCBhZGQgYF9gIGFzIGEgZ2xvYmFsIG9iamVjdCB2aWEgYSBzdHJpbmcgaWRlbnRpZmllcixcbiAgLy8gZm9yIENsb3N1cmUgQ29tcGlsZXIgXCJhZHZhbmNlZFwiIG1vZGUuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IF87XG4gICAgfVxuICAgIGV4cG9ydHMuXyA9IF87XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5fID0gXztcbiAgfVxuXG4gIC8vIEN1cnJlbnQgdmVyc2lvbi5cbiAgXy5WRVJTSU9OID0gJzEuNC40JztcblxuICAvLyBDb2xsZWN0aW9uIEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRoZSBjb3JuZXJzdG9uZSwgYW4gYGVhY2hgIGltcGxlbWVudGF0aW9uLCBha2EgYGZvckVhY2hgLlxuICAvLyBIYW5kbGVzIG9iamVjdHMgd2l0aCB0aGUgYnVpbHQtaW4gYGZvckVhY2hgLCBhcnJheXMsIGFuZCByYXcgb2JqZWN0cy5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGZvckVhY2hgIGlmIGF2YWlsYWJsZS5cbiAgdmFyIGVhY2ggPSBfLmVhY2ggPSBfLmZvckVhY2ggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm47XG4gICAgaWYgKG5hdGl2ZUZvckVhY2ggJiYgb2JqLmZvckVhY2ggPT09IG5hdGl2ZUZvckVhY2gpIHtcbiAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG9iai5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopID09PSBicmVha2VyKSByZXR1cm47XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKF8uaGFzKG9iaiwga2V5KSkge1xuICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXldLCBrZXksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdHMgb2YgYXBwbHlpbmcgdGhlIGl0ZXJhdG9yIHRvIGVhY2ggZWxlbWVudC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYG1hcGAgaWYgYXZhaWxhYmxlLlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZU1hcCAmJiBvYmoubWFwID09PSBuYXRpdmVNYXApIHJldHVybiBvYmoubWFwKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoXSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICB2YXIgcmVkdWNlRXJyb3IgPSAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlYCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlID0gXy5mb2xkbCA9IF8uaW5qZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlICYmIG9iai5yZWR1Y2UgPT09IG5hdGl2ZVJlZHVjZSkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZShpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlKGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSB2YWx1ZTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VSaWdodGAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZVJpZ2h0ID0gXy5mb2xkciA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZVJpZ2h0ICYmIG9iai5yZWR1Y2VSaWdodCA9PT0gbmF0aXZlUmVkdWNlUmlnaHQpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IpO1xuICAgIH1cbiAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoICE9PSArbGVuZ3RoKSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGluZGV4ID0ga2V5cyA/IGtleXNbLS1sZW5ndGhdIDogLS1sZW5ndGg7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IG9ialtpbmRleF07XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgb2JqW2luZGV4XSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBmaXJzdCB2YWx1ZSB3aGljaCBwYXNzZXMgYSB0cnV0aCB0ZXN0LiBBbGlhc2VkIGFzIGBkZXRlY3RgLlxuICBfLmZpbmQgPSBfLmRldGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZmlsdGVyYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVGaWx0ZXIgJiYgb2JqLmZpbHRlciA9PT0gbmF0aXZlRmlsdGVyKSByZXR1cm4gb2JqLmZpbHRlcihpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkgcmVzdWx0c1tyZXN1bHRzLmxlbmd0aF0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggYSB0cnV0aCB0ZXN0IGZhaWxzLlxuICBfLnJlamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiAhaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgIH0sIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZXZlcnlgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlRXZlcnkgJiYgb2JqLmV2ZXJ5ID09PSBuYXRpdmVFdmVyeSkgcmV0dXJuIG9iai5ldmVyeShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCEocmVzdWx0ID0gcmVzdWx0ICYmIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHNvbWVgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgdmFyIGFueSA9IF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZVNvbWUgJiYgb2JqLnNvbWUgPT09IG5hdGl2ZVNvbWUpIHJldHVybiBvYmouc29tZShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiB0aGUgYXJyYXkgb3Igb2JqZWN0IGNvbnRhaW5zIGEgZ2l2ZW4gdmFsdWUgKHVzaW5nIGA9PT1gKS5cbiAgLy8gQWxpYXNlZCBhcyBgaW5jbHVkZWAuXG4gIF8uY29udGFpbnMgPSBfLmluY2x1ZGUgPSBmdW5jdGlvbihvYmosIHRhcmdldCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIG9iai5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gb2JqLmluZGV4T2YodGFyZ2V0KSAhPSAtMTtcbiAgICByZXR1cm4gYW55KG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gdGFyZ2V0O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEludm9rZSBhIG1ldGhvZCAod2l0aCBhcmd1bWVudHMpIG9uIGV2ZXJ5IGl0ZW0gaW4gYSBjb2xsZWN0aW9uLlxuICBfLmludm9rZSA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGlzRnVuYyA9IF8uaXNGdW5jdGlvbihtZXRob2QpO1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gKGlzRnVuYyA/IG1ldGhvZCA6IHZhbHVlW21ldGhvZF0pLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBtYXBgOiBmZXRjaGluZyBhIHByb3BlcnR5LlxuICBfLnBsdWNrID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiB2YWx1ZVtrZXldOyB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzLCBmaXJzdCkge1xuICAgIGlmIChfLmlzRW1wdHkoYXR0cnMpKSByZXR1cm4gZmlyc3QgPyBudWxsIDogW107XG4gICAgcmV0dXJuIF9bZmlyc3QgPyAnZmluZCcgOiAnZmlsdGVyJ10ob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgICAgIGlmIChhdHRyc1trZXldICE9PSB2YWx1ZVtrZXldKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaW5kYDogZ2V0dGluZyB0aGUgZmlyc3Qgb2JqZWN0XG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8uZmluZFdoZXJlID0gZnVuY3Rpb24ob2JqLCBhdHRycykge1xuICAgIHJldHVybiBfLndoZXJlKG9iaiwgYXR0cnMsIHRydWUpO1xuICB9O1xuXG4gIC8vIFJldHVybiB0aGUgbWF4aW11bSBlbGVtZW50IG9yIChlbGVtZW50LWJhc2VkIGNvbXB1dGF0aW9uKS5cbiAgLy8gQ2FuJ3Qgb3B0aW1pemUgYXJyYXlzIG9mIGludGVnZXJzIGxvbmdlciB0aGFuIDY1LDUzNSBlbGVtZW50cy5cbiAgLy8gU2VlOiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODA3OTdcbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogLUluZmluaXR5LCB2YWx1ZTogLUluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPj0gcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtaW5pbXVtIGVsZW1lbnQgKG9yIGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICBfLm1pbiA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNBcnJheShvYmopICYmIG9ialswXSA9PT0gK29ialswXSAmJiBvYmoubGVuZ3RoIDwgNjU1MzUpIHtcbiAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShNYXRoLCBvYmopO1xuICAgIH1cbiAgICBpZiAoIWl0ZXJhdG9yICYmIF8uaXNFbXB0eShvYmopKSByZXR1cm4gSW5maW5pdHk7XG4gICAgdmFyIHJlc3VsdCA9IHtjb21wdXRlZCA6IEluZmluaXR5LCB2YWx1ZTogSW5maW5pdHl9O1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHZhciBjb21wdXRlZCA9IGl0ZXJhdG9yID8gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpIDogdmFsdWU7XG4gICAgICBjb21wdXRlZCA8IHJlc3VsdC5jb21wdXRlZCAmJiAocmVzdWx0ID0ge3ZhbHVlIDogdmFsdWUsIGNvbXB1dGVkIDogY29tcHV0ZWR9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xuICB9O1xuXG4gIC8vIFNodWZmbGUgYW4gYXJyYXkuXG4gIF8uc2h1ZmZsZSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciByYW5kO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHNodWZmbGVkID0gW107XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByYW5kID0gXy5yYW5kb20oaW5kZXgrKyk7XG4gICAgICBzaHVmZmxlZFtpbmRleCAtIDFdID0gc2h1ZmZsZWRbcmFuZF07XG4gICAgICBzaHVmZmxlZFtyYW5kXSA9IHZhbHVlO1xuICAgIH0pO1xuICAgIHJldHVybiBzaHVmZmxlZDtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB0byBnZW5lcmF0ZSBsb29rdXAgaXRlcmF0b3JzLlxuICB2YXIgbG9va3VwSXRlcmF0b3IgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUgOiBmdW5jdGlvbihvYmopeyByZXR1cm4gb2JqW3ZhbHVlXTsgfTtcbiAgfTtcblxuICAvLyBTb3J0IHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24gcHJvZHVjZWQgYnkgYW4gaXRlcmF0b3IuXG4gIF8uc29ydEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgIHZhciBpdGVyYXRvciA9IGxvb2t1cEl0ZXJhdG9yKHZhbHVlKTtcbiAgICByZXR1cm4gXy5wbHVjayhfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWUgOiB2YWx1ZSxcbiAgICAgICAgaW5kZXggOiBpbmRleCxcbiAgICAgICAgY3JpdGVyaWEgOiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdClcbiAgICAgIH07XG4gICAgfSkuc29ydChmdW5jdGlvbihsZWZ0LCByaWdodCkge1xuICAgICAgdmFyIGEgPSBsZWZ0LmNyaXRlcmlhO1xuICAgICAgdmFyIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgIGlmIChhICE9PSBiKSB7XG4gICAgICAgIGlmIChhID4gYiB8fCBhID09PSB2b2lkIDApIHJldHVybiAxO1xuICAgICAgICBpZiAoYSA8IGIgfHwgYiA9PT0gdm9pZCAwKSByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGVmdC5pbmRleCA8IHJpZ2h0LmluZGV4ID8gLTEgOiAxO1xuICAgIH0pLCAndmFsdWUnKTtcbiAgfTtcblxuICAvLyBBbiBpbnRlcm5hbCBmdW5jdGlvbiB1c2VkIGZvciBhZ2dyZWdhdGUgXCJncm91cCBieVwiIG9wZXJhdGlvbnMuXG4gIHZhciBncm91cCA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQsIGJlaGF2aW9yKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBpdGVyYXRvciA9IGxvb2t1cEl0ZXJhdG9yKHZhbHVlIHx8IF8uaWRlbnRpdHkpO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgIHZhciBrZXkgPSBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgb2JqKTtcbiAgICAgIGJlaGF2aW9yKHJlc3VsdCwga2V5LCB2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBHcm91cHMgdGhlIG9iamVjdCdzIHZhbHVlcyBieSBhIGNyaXRlcmlvbi4gUGFzcyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlXG4gIC8vIHRvIGdyb3VwIGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3JpdGVyaW9uLlxuICBfLmdyb3VwQnkgPSBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGdyb3VwKG9iaiwgdmFsdWUsIGNvbnRleHQsIGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgICAgKF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldIDogKHJlc3VsdFtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb3VudHMgaW5zdGFuY2VzIG9mIGFuIG9iamVjdCB0aGF0IGdyb3VwIGJ5IGEgY2VydGFpbiBjcml0ZXJpb24uIFBhc3NcbiAgLy8gZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZSB0byBjb3VudCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlXG4gIC8vIGNyaXRlcmlvbi5cbiAgXy5jb3VudEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWx1ZSwgY29udGV4dCkge1xuICAgIHJldHVybiBncm91cChvYmosIHZhbHVlLCBjb250ZXh0LCBmdW5jdGlvbihyZXN1bHQsIGtleSkge1xuICAgICAgaWYgKCFfLmhhcyhyZXN1bHQsIGtleSkpIHJlc3VsdFtrZXldID0gMDtcbiAgICAgIHJlc3VsdFtrZXldKys7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gVXNlIGEgY29tcGFyYXRvciBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHRoZSBzbWFsbGVzdCBpbmRleCBhdCB3aGljaFxuICAvLyBhbiBvYmplY3Qgc2hvdWxkIGJlIGluc2VydGVkIHNvIGFzIHRvIG1haW50YWluIG9yZGVyLiBVc2VzIGJpbmFyeSBzZWFyY2guXG4gIF8uc29ydGVkSW5kZXggPSBmdW5jdGlvbihhcnJheSwgb2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yID0gaXRlcmF0b3IgPT0gbnVsbCA/IF8uaWRlbnRpdHkgOiBsb29rdXBJdGVyYXRvcihpdGVyYXRvcik7XG4gICAgdmFyIHZhbHVlID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmopO1xuICAgIHZhciBsb3cgPSAwLCBoaWdoID0gYXJyYXkubGVuZ3RoO1xuICAgIHdoaWxlIChsb3cgPCBoaWdoKSB7XG4gICAgICB2YXIgbWlkID0gKGxvdyArIGhpZ2gpID4+PiAxO1xuICAgICAgaXRlcmF0b3IuY2FsbChjb250ZXh0LCBhcnJheVttaWRdKSA8IHZhbHVlID8gbG93ID0gbWlkICsgMSA6IGhpZ2ggPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsb3c7XG4gIH07XG5cbiAgLy8gU2FmZWx5IGNvbnZlcnQgYW55dGhpbmcgaXRlcmFibGUgaW50byBhIHJlYWwsIGxpdmUgYXJyYXkuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpID8gb2JqLmxlbmd0aCA6IF8ua2V5cyhvYmopLmxlbmd0aDtcbiAgfTtcblxuICAvLyBBcnJheSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBmaXJzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYGhlYWRgIGFuZCBgdGFrZWAuIFRoZSAqKmd1YXJkKiogY2hlY2tcbiAgLy8gYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmZpcnN0ID0gXy5oZWFkID0gXy50YWtlID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgcmV0dXJuIChuICE9IG51bGwpICYmICFndWFyZCA/IHNsaWNlLmNhbGwoYXJyYXksIDAsIG4pIDogYXJyYXlbMF07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBldmVyeXRoaW5nIGJ1dCB0aGUgbGFzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEVzcGVjaWFsbHkgdXNlZnVsIG9uXG4gIC8vIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIGFsbCB0aGUgdmFsdWVzIGluXG4gIC8vIHRoZSBhcnJheSwgZXhjbHVkaW5nIHRoZSBsYXN0IE4uIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aFxuICAvLyBgXy5tYXBgLlxuICBfLmluaXRpYWwgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgMCwgYXJyYXkubGVuZ3RoIC0gKChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pKTtcbiAgfTtcblxuICAvLyBHZXQgdGhlIGxhc3QgZWxlbWVudCBvZiBhbiBhcnJheS4gUGFzc2luZyAqKm4qKiB3aWxsIHJldHVybiB0aGUgbGFzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIFRoZSAqKmd1YXJkKiogY2hlY2sgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmxhc3QgPSBmdW5jdGlvbihhcnJheSwgbiwgZ3VhcmQpIHtcbiAgICBpZiAoYXJyYXkgPT0gbnVsbCkgcmV0dXJuIHZvaWQgMDtcbiAgICBpZiAoKG4gIT0gbnVsbCkgJiYgIWd1YXJkKSB7XG4gICAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgTWF0aC5tYXgoYXJyYXkubGVuZ3RoIC0gbiwgMCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gICAgfVxuICB9O1xuXG4gIC8vIFJldHVybnMgZXZlcnl0aGluZyBidXQgdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBhcnJheS4gQWxpYXNlZCBhcyBgdGFpbGAgYW5kIGBkcm9wYC5cbiAgLy8gRXNwZWNpYWxseSB1c2VmdWwgb24gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgYW4gKipuKiogd2lsbCByZXR1cm5cbiAgLy8gdGhlIHJlc3QgTiB2YWx1ZXMgaW4gdGhlIGFycmF5LiBUaGUgKipndWFyZCoqXG4gIC8vIGNoZWNrIGFsbG93cyBpdCB0byB3b3JrIHdpdGggYF8ubWFwYC5cbiAgXy5yZXN0ID0gXy50YWlsID0gXy5kcm9wID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgcmV0dXJuIHNsaWNlLmNhbGwoYXJyYXksIChuID09IG51bGwpIHx8IGd1YXJkID8gMSA6IG4pO1xuICB9O1xuXG4gIC8vIFRyaW0gb3V0IGFsbCBmYWxzeSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgXy5jb21wYWN0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIoYXJyYXksIF8uaWRlbnRpdHkpO1xuICB9O1xuXG4gIC8vIEludGVybmFsIGltcGxlbWVudGF0aW9uIG9mIGEgcmVjdXJzaXZlIGBmbGF0dGVuYCBmdW5jdGlvbi5cbiAgdmFyIGZsYXR0ZW4gPSBmdW5jdGlvbihpbnB1dCwgc2hhbGxvdywgb3V0cHV0KSB7XG4gICAgZWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGlmIChfLmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHNoYWxsb3cgPyBwdXNoLmFwcGx5KG91dHB1dCwgdmFsdWUpIDogZmxhdHRlbih2YWx1ZSwgc2hhbGxvdywgb3V0cHV0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG91dHB1dC5wdXNoKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvbXBsZXRlbHkgZmxhdHRlbmVkIHZlcnNpb24gb2YgYW4gYXJyYXkuXG4gIF8uZmxhdHRlbiA9IGZ1bmN0aW9uKGFycmF5LCBzaGFsbG93KSB7XG4gICAgcmV0dXJuIGZsYXR0ZW4oYXJyYXksIHNoYWxsb3csIFtdKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpc1NvcnRlZCkpIHtcbiAgICAgIGNvbnRleHQgPSBpdGVyYXRvcjtcbiAgICAgIGl0ZXJhdG9yID0gaXNTb3J0ZWQ7XG4gICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICB2YXIgaW5pdGlhbCA9IGl0ZXJhdG9yID8gXy5tYXAoYXJyYXksIGl0ZXJhdG9yLCBjb250ZXh0KSA6IGFycmF5O1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBlYWNoKGluaXRpYWwsIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgaWYgKGlzU29ydGVkID8gKCFpbmRleCB8fCBzZWVuW3NlZW4ubGVuZ3RoIC0gMV0gIT09IHZhbHVlKSA6ICFfLmNvbnRhaW5zKHNlZW4sIHZhbHVlKSkge1xuICAgICAgICBzZWVuLnB1c2godmFsdWUpO1xuICAgICAgICByZXN1bHRzLnB1c2goYXJyYXlbaW5kZXhdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIHVuaW9uOiBlYWNoIGRpc3RpbmN0IGVsZW1lbnQgZnJvbSBhbGwgb2ZcbiAgLy8gdGhlIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8udW5pb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bmlxKGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBhcmd1bWVudHMpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoXy51bmlxKGFycmF5KSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIF8uZXZlcnkocmVzdCwgZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIF8uaW5kZXhPZihvdGhlciwgaXRlbSkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gIV8uY29udGFpbnMocmVzdCwgdmFsdWUpOyB9KTtcbiAgfTtcblxuICAvLyBaaXAgdG9nZXRoZXIgbXVsdGlwbGUgbGlzdHMgaW50byBhIHNpbmdsZSBhcnJheSAtLSBlbGVtZW50cyB0aGF0IHNoYXJlXG4gIC8vIGFuIGluZGV4IGdvIHRvZ2V0aGVyLlxuICBfLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIHZhciBsZW5ndGggPSBfLm1heChfLnBsdWNrKGFyZ3MsICdsZW5ndGgnKSk7XG4gICAgdmFyIHJlc3VsdHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHRzW2ldID0gXy5wbHVjayhhcmdzLCBcIlwiICsgaSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vIENvbnZlcnRzIGxpc3RzIGludG8gb2JqZWN0cy4gUGFzcyBlaXRoZXIgYSBzaW5nbGUgYXJyYXkgb2YgYFtrZXksIHZhbHVlXWBcbiAgLy8gcGFpcnMsIG9yIHR3byBwYXJhbGxlbCBhcnJheXMgb2YgdGhlIHNhbWUgbGVuZ3RoIC0tIG9uZSBvZiBrZXlzLCBhbmQgb25lIG9mXG4gIC8vIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlcy5cbiAgXy5vYmplY3QgPSBmdW5jdGlvbihsaXN0LCB2YWx1ZXMpIHtcbiAgICBpZiAobGlzdCA9PSBudWxsKSByZXR1cm4ge307XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBseSB1cyB3aXRoIGluZGV4T2YgKEknbSBsb29raW5nIGF0IHlvdSwgKipNU0lFKiopLFxuICAvLyB3ZSBuZWVkIHRoaXMgZnVuY3Rpb24uIFJldHVybiB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYW5cbiAgLy8gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTEgaWYgdGhlIGl0ZW0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBhcnJheS5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgLy8gSWYgdGhlIGFycmF5IGlzIGxhcmdlIGFuZCBhbHJlYWR5IGluIHNvcnQgb3JkZXIsIHBhc3MgYHRydWVgXG4gIC8vIGZvciAqKmlzU29ydGVkKiogdG8gdXNlIGJpbmFyeSBzZWFyY2guXG4gIF8uaW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBpc1NvcnRlZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGkgPSAwLCBsID0gYXJyYXkubGVuZ3RoO1xuICAgIGlmIChpc1NvcnRlZCkge1xuICAgICAgaWYgKHR5cGVvZiBpc1NvcnRlZCA9PSAnbnVtYmVyJykge1xuICAgICAgICBpID0gKGlzU29ydGVkIDwgMCA/IE1hdGgubWF4KDAsIGwgKyBpc1NvcnRlZCkgOiBpc1NvcnRlZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gXy5zb3J0ZWRJbmRleChhcnJheSwgaXRlbSk7XG4gICAgICAgIHJldHVybiBhcnJheVtpXSA9PT0gaXRlbSA/IGkgOiAtMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5hdGl2ZUluZGV4T2YgJiYgYXJyYXkuaW5kZXhPZiA9PT0gbmF0aXZlSW5kZXhPZikgcmV0dXJuIGFycmF5LmluZGV4T2YoaXRlbSwgaXNTb3J0ZWQpO1xuICAgIGZvciAoOyBpIDwgbDsgaSsrKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbGFzdEluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgXy5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBmcm9tKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaGFzSW5kZXggPSBmcm9tICE9IG51bGw7XG4gICAgaWYgKG5hdGl2ZUxhc3RJbmRleE9mICYmIGFycmF5Lmxhc3RJbmRleE9mID09PSBuYXRpdmVMYXN0SW5kZXhPZikge1xuICAgICAgcmV0dXJuIGhhc0luZGV4ID8gYXJyYXkubGFzdEluZGV4T2YoaXRlbSwgZnJvbSkgOiBhcnJheS5sYXN0SW5kZXhPZihpdGVtKTtcbiAgICB9XG4gICAgdmFyIGkgPSAoaGFzSW5kZXggPyBmcm9tIDogYXJyYXkubGVuZ3RoKTtcbiAgICB3aGlsZSAoaS0tKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gYXJndW1lbnRzWzJdIHx8IDE7XG5cbiAgICB2YXIgbGVuID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciBpZHggPSAwO1xuICAgIHZhciByYW5nZSA9IG5ldyBBcnJheShsZW4pO1xuXG4gICAgd2hpbGUoaWR4IDwgbGVuKSB7XG4gICAgICByYW5nZVtpZHgrK10gPSBzdGFydDtcbiAgICAgIHN0YXJ0ICs9IHN0ZXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gQ3JlYXRlIGEgZnVuY3Rpb24gYm91bmQgdG8gYSBnaXZlbiBvYmplY3QgKGFzc2lnbmluZyBgdGhpc2AsIGFuZCBhcmd1bWVudHMsXG4gIC8vIG9wdGlvbmFsbHkpLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgRnVuY3Rpb24uYmluZGAgaWZcbiAgLy8gYXZhaWxhYmxlLlxuICBfLmJpbmQgPSBmdW5jdGlvbihmdW5jLCBjb250ZXh0KSB7XG4gICAgaWYgKGZ1bmMuYmluZCA9PT0gbmF0aXZlQmluZCAmJiBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQmluZCBhbGwgb2YgYW4gb2JqZWN0J3MgbWV0aG9kcyB0byB0aGF0IG9iamVjdC4gVXNlZnVsIGZvciBlbnN1cmluZyB0aGF0XG4gIC8vIGFsbCBjYWxsYmFja3MgZGVmaW5lZCBvbiBhbiBvYmplY3QgYmVsb25nIHRvIGl0LlxuICBfLmJpbmRBbGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgZnVuY3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKGZ1bmNzLmxlbmd0aCA9PT0gMCkgZnVuY3MgPSBfLmZ1bmN0aW9ucyhvYmopO1xuICAgIGVhY2goZnVuY3MsIGZ1bmN0aW9uKGYpIHsgb2JqW2ZdID0gXy5iaW5kKG9ialtmXSwgb2JqKTsgfSk7XG4gICAgcmV0dXJuIG9iajtcbiAgfTtcblxuICAvLyBNZW1vaXplIGFuIGV4cGVuc2l2ZSBmdW5jdGlvbiBieSBzdG9yaW5nIGl0cyByZXN1bHRzLlxuICBfLm1lbW9pemUgPSBmdW5jdGlvbihmdW5jLCBoYXNoZXIpIHtcbiAgICB2YXIgbWVtbyA9IHt9O1xuICAgIGhhc2hlciB8fCAoaGFzaGVyID0gXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGtleSA9IGhhc2hlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIF8uaGFzKG1lbW8sIGtleSkgPyBtZW1vW2tleV0gOiAobWVtb1trZXldID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9O1xuXG4gIC8vIERlbGF5cyBhIGZ1bmN0aW9uIGZvciB0aGUgZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcywgYW5kIHRoZW4gY2FsbHNcbiAgLy8gaXQgd2l0aCB0aGUgYXJndW1lbnRzIHN1cHBsaWVkLlxuICBfLmRlbGF5ID0gZnVuY3Rpb24oZnVuYywgd2FpdCkge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHJldHVybiBmdW5jLmFwcGx5KG51bGwsIGFyZ3MpOyB9LCB3YWl0KTtcbiAgfTtcblxuICAvLyBEZWZlcnMgYSBmdW5jdGlvbiwgc2NoZWR1bGluZyBpdCB0byBydW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXNcbiAgLy8gY2xlYXJlZC5cbiAgXy5kZWZlciA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICByZXR1cm4gXy5kZWxheS5hcHBseShfLCBbZnVuYywgMV0uY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSkpO1xuICB9O1xuXG4gIC8vIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgd2hlbiBpbnZva2VkLCB3aWxsIG9ubHkgYmUgdHJpZ2dlcmVkIGF0IG1vc3Qgb25jZVxuICAvLyBkdXJpbmcgYSBnaXZlbiB3aW5kb3cgb2YgdGltZS5cbiAgXy50aHJvdHRsZSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgY29udGV4dCwgYXJncywgdGltZW91dCwgcmVzdWx0O1xuICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICBwcmV2aW91cyA9IG5ldyBEYXRlO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlO1xuICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgfSBlbHNlIGlmICghdGltZW91dCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gIC8vIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAgLy8gTiBtaWxsaXNlY29uZHMuIElmIGBpbW1lZGlhdGVgIGlzIHBhc3NlZCwgdHJpZ2dlciB0aGUgZnVuY3Rpb24gb24gdGhlXG4gIC8vIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gIF8uZGVib3VuY2UgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBpbW1lZGlhdGUpIHtcbiAgICB2YXIgdGltZW91dCwgcmVzdWx0O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICB9O1xuICAgICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICBpZiAoY2FsbE5vdykgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGF0IG1vc3Qgb25lIHRpbWUsIG5vIG1hdHRlciBob3dcbiAgLy8gb2Z0ZW4geW91IGNhbGwgaXQuIFVzZWZ1bCBmb3IgbGF6eSBpbml0aWFsaXphdGlvbi5cbiAgXy5vbmNlID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgIHJhbiA9IHRydWU7XG4gICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgZnVuYyA9IG51bGw7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IFtmdW5jXTtcbiAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB3cmFwcGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgaXMgdGhlIGNvbXBvc2l0aW9uIG9mIGEgbGlzdCBvZiBmdW5jdGlvbnMsIGVhY2hcbiAgLy8gY29uc3VtaW5nIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIHRoYXQgZm9sbG93cy5cbiAgXy5jb21wb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZ1bmNzID0gYXJndW1lbnRzO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgZm9yICh2YXIgaSA9IGZ1bmNzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGFyZ3MgPSBbZnVuY3NbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgYWZ0ZXIgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIGlmICh0aW1lcyA8PSAwKSByZXR1cm4gZnVuYygpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gT2JqZWN0IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV0cmlldmUgdGhlIG5hbWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBPYmplY3Qua2V5c2BcbiAgXy5rZXlzID0gbmF0aXZlS2V5cyB8fCBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqICE9PSBPYmplY3Qob2JqKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBvYmplY3QnKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIGtleXNba2V5cy5sZW5ndGhdID0ga2V5O1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIHRoZSB2YWx1ZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgXy52YWx1ZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgdmFsdWVzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgdmFsdWVzLnB1c2gob2JqW2tleV0pO1xuICAgIHJldHVybiB2YWx1ZXM7XG4gIH07XG5cbiAgLy8gQ29udmVydCBhbiBvYmplY3QgaW50byBhIGxpc3Qgb2YgYFtrZXksIHZhbHVlXWAgcGFpcnMuXG4gIF8ucGFpcnMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcGFpcnMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSBpZiAoXy5oYXMob2JqLCBrZXkpKSBwYWlycy5wdXNoKFtrZXksIG9ialtrZXldXSk7XG4gICAgcmV0dXJuIHBhaXJzO1xuICB9O1xuXG4gIC8vIEludmVydCB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIGFuIG9iamVjdC4gVGhlIHZhbHVlcyBtdXN0IGJlIHNlcmlhbGl6YWJsZS5cbiAgXy5pbnZlcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcmVzdWx0W29ialtrZXldXSA9IGtleTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHNvcnRlZCBsaXN0IG9mIHRoZSBmdW5jdGlvbiBuYW1lcyBhdmFpbGFibGUgb24gdGhlIG9iamVjdC5cbiAgLy8gQWxpYXNlZCBhcyBgbWV0aG9kc2BcbiAgXy5mdW5jdGlvbnMgPSBfLm1ldGhvZHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9ialtrZXldKSkgbmFtZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXMuc29ydCgpO1xuICB9O1xuXG4gIC8vIEV4dGVuZCBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBpbiBwYXNzZWQtaW4gb2JqZWN0KHMpLlxuICBfLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBlYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSBpbiBvYmopIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH0pO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgd2l0aG91dCB0aGUgYmxhY2tsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5vbWl0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmICghXy5jb250YWlucyhrZXlzLCBrZXkpKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAob2JqW3Byb3BdID09IG51bGwpIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgKHNoYWxsb3ctY2xvbmVkKSBkdXBsaWNhdGUgb2YgYW4gb2JqZWN0LlxuICBfLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIF8uaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBfLmV4dGVuZCh7fSwgb2JqKTtcbiAgfTtcblxuICAvLyBJbnZva2VzIGludGVyY2VwdG9yIHdpdGggdGhlIG9iaiwgYW5kIHRoZW4gcmV0dXJucyBvYmouXG4gIC8vIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kIGNoYWluLCBpblxuICAvLyBvcmRlciB0byBwZXJmb3JtIG9wZXJhdGlvbnMgb24gaW50ZXJtZWRpYXRlIHJlc3VsdHMgd2l0aGluIHRoZSBjaGFpbi5cbiAgXy50YXAgPSBmdW5jdGlvbihvYmosIGludGVyY2VwdG9yKSB7XG4gICAgaW50ZXJjZXB0b3Iob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIEludGVybmFsIHJlY3Vyc2l2ZSBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBgaXNFcXVhbGAuXG4gIHZhciBlcSA9IGZ1bmN0aW9uKGEsIGIsIGFTdGFjaywgYlN0YWNrKSB7XG4gICAgLy8gSWRlbnRpY2FsIG9iamVjdHMgYXJlIGVxdWFsLiBgMCA9PT0gLTBgLCBidXQgdGhleSBhcmVuJ3QgaWRlbnRpY2FsLlxuICAgIC8vIFNlZSB0aGUgSGFybW9ueSBgZWdhbGAgcHJvcG9zYWw6IGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWhhcm1vbnk6ZWdhbC5cbiAgICBpZiAoYSA9PT0gYikgcmV0dXJuIGEgIT09IDAgfHwgMSAvIGEgPT0gMSAvIGI7XG4gICAgLy8gQSBzdHJpY3QgY29tcGFyaXNvbiBpcyBuZWNlc3NhcnkgYmVjYXVzZSBgbnVsbCA9PSB1bmRlZmluZWRgLlxuICAgIGlmIChhID09IG51bGwgfHwgYiA9PSBudWxsKSByZXR1cm4gYSA9PT0gYjtcbiAgICAvLyBVbndyYXAgYW55IHdyYXBwZWQgb2JqZWN0cy5cbiAgICBpZiAoYSBpbnN0YW5jZW9mIF8pIGEgPSBhLl93cmFwcGVkO1xuICAgIGlmIChiIGluc3RhbmNlb2YgXykgYiA9IGIuX3dyYXBwZWQ7XG4gICAgLy8gQ29tcGFyZSBgW1tDbGFzc11dYCBuYW1lcy5cbiAgICB2YXIgY2xhc3NOYW1lID0gdG9TdHJpbmcuY2FsbChhKTtcbiAgICBpZiAoY2xhc3NOYW1lICE9IHRvU3RyaW5nLmNhbGwoYikpIHJldHVybiBmYWxzZTtcbiAgICBzd2l0Y2ggKGNsYXNzTmFtZSkge1xuICAgICAgLy8gU3RyaW5ncywgbnVtYmVycywgZGF0ZXMsIGFuZCBib29sZWFucyBhcmUgY29tcGFyZWQgYnkgdmFsdWUuXG4gICAgICBjYXNlICdbb2JqZWN0IFN0cmluZ10nOlxuICAgICAgICAvLyBQcmltaXRpdmVzIGFuZCB0aGVpciBjb3JyZXNwb25kaW5nIG9iamVjdCB3cmFwcGVycyBhcmUgZXF1aXZhbGVudDsgdGh1cywgYFwiNVwiYCBpc1xuICAgICAgICAvLyBlcXVpdmFsZW50IHRvIGBuZXcgU3RyaW5nKFwiNVwiKWAuXG4gICAgICAgIHJldHVybiBhID09IFN0cmluZyhiKTtcbiAgICAgIGNhc2UgJ1tvYmplY3QgTnVtYmVyXSc6XG4gICAgICAgIC8vIGBOYU5gcyBhcmUgZXF1aXZhbGVudCwgYnV0IG5vbi1yZWZsZXhpdmUuIEFuIGBlZ2FsYCBjb21wYXJpc29uIGlzIHBlcmZvcm1lZCBmb3JcbiAgICAgICAgLy8gb3RoZXIgbnVtZXJpYyB2YWx1ZXMuXG4gICAgICAgIHJldHVybiBhICE9ICthID8gYiAhPSArYiA6IChhID09IDAgPyAxIC8gYSA9PSAxIC8gYiA6IGEgPT0gK2IpO1xuICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6XG4gICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgLy8gQ29lcmNlIGRhdGVzIGFuZCBib29sZWFucyB0byBudW1lcmljIHByaW1pdGl2ZSB2YWx1ZXMuIERhdGVzIGFyZSBjb21wYXJlZCBieSB0aGVpclxuICAgICAgICAvLyBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnMuIE5vdGUgdGhhdCBpbnZhbGlkIGRhdGVzIHdpdGggbWlsbGlzZWNvbmQgcmVwcmVzZW50YXRpb25zXG4gICAgICAgIC8vIG9mIGBOYU5gIGFyZSBub3QgZXF1aXZhbGVudC5cbiAgICAgICAgcmV0dXJuICthID09ICtiO1xuICAgICAgLy8gUmVnRXhwcyBhcmUgY29tcGFyZWQgYnkgdGhlaXIgc291cmNlIHBhdHRlcm5zIGFuZCBmbGFncy5cbiAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6XG4gICAgICAgIHJldHVybiBhLnNvdXJjZSA9PSBiLnNvdXJjZSAmJlxuICAgICAgICAgICAgICAgYS5nbG9iYWwgPT0gYi5nbG9iYWwgJiZcbiAgICAgICAgICAgICAgIGEubXVsdGlsaW5lID09IGIubXVsdGlsaW5lICYmXG4gICAgICAgICAgICAgICBhLmlnbm9yZUNhc2UgPT0gYi5pZ25vcmVDYXNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGEgIT0gJ29iamVjdCcgfHwgdHlwZW9mIGIgIT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICAvLyBBc3N1bWUgZXF1YWxpdHkgZm9yIGN5Y2xpYyBzdHJ1Y3R1cmVzLiBUaGUgYWxnb3JpdGhtIGZvciBkZXRlY3RpbmcgY3ljbGljXG4gICAgLy8gc3RydWN0dXJlcyBpcyBhZGFwdGVkIGZyb20gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMywgYWJzdHJhY3Qgb3BlcmF0aW9uIGBKT2AuXG4gICAgdmFyIGxlbmd0aCA9IGFTdGFjay5sZW5ndGg7XG4gICAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgICAvLyBMaW5lYXIgc2VhcmNoLiBQZXJmb3JtYW5jZSBpcyBpbnZlcnNlbHkgcHJvcG9ydGlvbmFsIHRvIHRoZSBudW1iZXIgb2ZcbiAgICAgIC8vIHVuaXF1ZSBuZXN0ZWQgc3RydWN0dXJlcy5cbiAgICAgIGlmIChhU3RhY2tbbGVuZ3RoXSA9PSBhKSByZXR1cm4gYlN0YWNrW2xlbmd0aF0gPT0gYjtcbiAgICB9XG4gICAgLy8gQWRkIHRoZSBmaXJzdCBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxuICAgIGFTdGFjay5wdXNoKGEpO1xuICAgIGJTdGFjay5wdXNoKGIpO1xuICAgIHZhciBzaXplID0gMCwgcmVzdWx0ID0gdHJ1ZTtcbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIG9iamVjdHMgYW5kIGFycmF5cy5cbiAgICBpZiAoY2xhc3NOYW1lID09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgIC8vIENvbXBhcmUgYXJyYXkgbGVuZ3RocyB0byBkZXRlcm1pbmUgaWYgYSBkZWVwIGNvbXBhcmlzb24gaXMgbmVjZXNzYXJ5LlxuICAgICAgc2l6ZSA9IGEubGVuZ3RoO1xuICAgICAgcmVzdWx0ID0gc2l6ZSA9PSBiLmxlbmd0aDtcbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgLy8gRGVlcCBjb21wYXJlIHRoZSBjb250ZW50cywgaWdub3Jpbmcgbm9uLW51bWVyaWMgcHJvcGVydGllcy5cbiAgICAgICAgd2hpbGUgKHNpemUtLSkge1xuICAgICAgICAgIGlmICghKHJlc3VsdCA9IGVxKGFbc2l6ZV0sIGJbc2l6ZV0sIGFTdGFjaywgYlN0YWNrKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9iamVjdHMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1aXZhbGVudCwgYnV0IGBPYmplY3Rgc1xuICAgICAgLy8gZnJvbSBkaWZmZXJlbnQgZnJhbWVzIGFyZS5cbiAgICAgIHZhciBhQ3RvciA9IGEuY29uc3RydWN0b3IsIGJDdG9yID0gYi5jb25zdHJ1Y3RvcjtcbiAgICAgIGlmIChhQ3RvciAhPT0gYkN0b3IgJiYgIShfLmlzRnVuY3Rpb24oYUN0b3IpICYmIChhQ3RvciBpbnN0YW5jZW9mIGFDdG9yKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uaXNGdW5jdGlvbihiQ3RvcikgJiYgKGJDdG9yIGluc3RhbmNlb2YgYkN0b3IpKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgb2JqZWN0cy5cbiAgICAgIGZvciAodmFyIGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChfLmhhcyhhLCBrZXkpKSB7XG4gICAgICAgICAgLy8gQ291bnQgdGhlIGV4cGVjdGVkIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXIuXG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBmb3IgKGtleSBpbiBiKSB7XG4gICAgICAgICAgaWYgKF8uaGFzKGIsIGtleSkgJiYgIShzaXplLS0pKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSAhc2l6ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIsIFtdLCBbXSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSkgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBET00gZWxlbWVudD9cbiAgXy5pc0VsZW1lbnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhbiBhcnJheT9cbiAgLy8gRGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcbiAgXy5pc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cC5cbiAgZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFKSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gISEob2JqICYmIF8uaGFzKG9iaiwgJ2NhbGxlZScpKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gT3B0aW1pemUgYGlzRnVuY3Rpb25gIGlmIGFwcHJvcHJpYXRlLlxuICBpZiAodHlwZW9mICgvLi8pICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgXy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT0gK29iajtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgYm9vbGVhbj9cbiAgXy5pc0Jvb2xlYW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRvcnMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvLyBSdW4gYSBmdW5jdGlvbiAqKm4qKiB0aW1lcy5cbiAgXy50aW1lcyA9IGZ1bmN0aW9uKG4sIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGFjY3VtID0gQXJyYXkobik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIGFjY3VtW2ldID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBpKTtcbiAgICByZXR1cm4gYWNjdW07XG4gIH07XG5cbiAgLy8gUmV0dXJuIGEgcmFuZG9tIGludGVnZXIgYmV0d2VlbiBtaW4gYW5kIG1heCAoaW5jbHVzaXZlKS5cbiAgXy5yYW5kb20gPSBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgIGlmIChtYXggPT0gbnVsbCkge1xuICAgICAgbWF4ID0gbWluO1xuICAgICAgbWluID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG1pbiArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSk7XG4gIH07XG5cbiAgLy8gTGlzdCBvZiBIVE1MIGVudGl0aWVzIGZvciBlc2NhcGluZy5cbiAgdmFyIGVudGl0eU1hcCA9IHtcbiAgICBlc2NhcGU6IHtcbiAgICAgICcmJzogJyZhbXA7JyxcbiAgICAgICc8JzogJyZsdDsnLFxuICAgICAgJz4nOiAnJmd0OycsXG4gICAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICAgIFwiJ1wiOiAnJiN4Mjc7JyxcbiAgICAgICcvJzogJyYjeDJGOydcbiAgICB9XG4gIH07XG4gIGVudGl0eU1hcC51bmVzY2FwZSA9IF8uaW52ZXJ0KGVudGl0eU1hcC5lc2NhcGUpO1xuXG4gIC8vIFJlZ2V4ZXMgY29udGFpbmluZyB0aGUga2V5cyBhbmQgdmFsdWVzIGxpc3RlZCBpbW1lZGlhdGVseSBhYm92ZS5cbiAgdmFyIGVudGl0eVJlZ2V4ZXMgPSB7XG4gICAgZXNjYXBlOiAgIG5ldyBSZWdFeHAoJ1snICsgXy5rZXlzKGVudGl0eU1hcC5lc2NhcGUpLmpvaW4oJycpICsgJ10nLCAnZycpLFxuICAgIHVuZXNjYXBlOiBuZXcgUmVnRXhwKCcoJyArIF8ua2V5cyhlbnRpdHlNYXAudW5lc2NhcGUpLmpvaW4oJ3wnKSArICcpJywgJ2cnKVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9ucyBmb3IgZXNjYXBpbmcgYW5kIHVuZXNjYXBpbmcgc3RyaW5ncyB0by9mcm9tIEhUTUwgaW50ZXJwb2xhdGlvbi5cbiAgXy5lYWNoKFsnZXNjYXBlJywgJ3VuZXNjYXBlJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIF9bbWV0aG9kXSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgaWYgKHN0cmluZyA9PSBudWxsKSByZXR1cm4gJyc7XG4gICAgICByZXR1cm4gKCcnICsgc3RyaW5nKS5yZXBsYWNlKGVudGl0eVJlZ2V4ZXNbbWV0aG9kXSwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0eU1hcFttZXRob2RdW21hdGNoXTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgbmFtZWQgcHJvcGVydHkgaXMgYSBmdW5jdGlvbiB0aGVuIGludm9rZSBpdDtcbiAgLy8gb3RoZXJ3aXNlLCByZXR1cm4gaXQuXG4gIF8ucmVzdWx0ID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGlmIChvYmplY3QgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlLmNhbGwob2JqZWN0KSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIEFkZCB5b3VyIG93biBjdXN0b20gZnVuY3Rpb25zIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5taXhpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSl7XG4gICAgICB2YXIgZnVuYyA9IF9bbmFtZV0gPSBvYmpbbmFtZV07XG4gICAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJncyA9IFt0aGlzLl93cmFwcGVkXTtcbiAgICAgICAgcHVzaC5hcHBseShhcmdzLCBhcmd1bWVudHMpO1xuICAgICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgZnVuYy5hcHBseShfLCBhcmdzKSk7XG4gICAgICB9O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEdlbmVyYXRlIGEgdW5pcXVlIGludGVnZXIgaWQgKHVuaXF1ZSB3aXRoaW4gdGhlIGVudGlyZSBjbGllbnQgc2Vzc2lvbikuXG4gIC8vIFVzZWZ1bCBmb3IgdGVtcG9yYXJ5IERPTSBpZHMuXG4gIHZhciBpZENvdW50ZXIgPSAwO1xuICBfLnVuaXF1ZUlkID0gZnVuY3Rpb24ocHJlZml4KSB7XG4gICAgdmFyIGlkID0gKytpZENvdW50ZXIgKyAnJztcbiAgICByZXR1cm4gcHJlZml4ID8gcHJlZml4ICsgaWQgOiBpZDtcbiAgfTtcblxuICAvLyBCeSBkZWZhdWx0LCBVbmRlcnNjb3JlIHVzZXMgRVJCLXN0eWxlIHRlbXBsYXRlIGRlbGltaXRlcnMsIGNoYW5nZSB0aGVcbiAgLy8gZm9sbG93aW5nIHRlbXBsYXRlIHNldHRpbmdzIHRvIHVzZSBhbHRlcm5hdGl2ZSBkZWxpbWl0ZXJzLlxuICBfLnRlbXBsYXRlU2V0dGluZ3MgPSB7XG4gICAgZXZhbHVhdGUgICAgOiAvPCUoW1xcc1xcU10rPyklPi9nLFxuICAgIGludGVycG9sYXRlIDogLzwlPShbXFxzXFxTXSs/KSU+L2csXG4gICAgZXNjYXBlICAgICAgOiAvPCUtKFtcXHNcXFNdKz8pJT4vZ1xuICB9O1xuXG4gIC8vIFdoZW4gY3VzdG9taXppbmcgYHRlbXBsYXRlU2V0dGluZ3NgLCBpZiB5b3UgZG9uJ3Qgd2FudCB0byBkZWZpbmUgYW5cbiAgLy8gaW50ZXJwb2xhdGlvbiwgZXZhbHVhdGlvbiBvciBlc2NhcGluZyByZWdleCwgd2UgbmVlZCBvbmUgdGhhdCBpc1xuICAvLyBndWFyYW50ZWVkIG5vdCB0byBtYXRjaC5cbiAgdmFyIG5vTWF0Y2ggPSAvKC4pXi87XG5cbiAgLy8gQ2VydGFpbiBjaGFyYWN0ZXJzIG5lZWQgdG8gYmUgZXNjYXBlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHB1dCBpbnRvIGFcbiAgLy8gc3RyaW5nIGxpdGVyYWwuXG4gIHZhciBlc2NhcGVzID0ge1xuICAgIFwiJ1wiOiAgICAgIFwiJ1wiLFxuICAgICdcXFxcJzogICAgICdcXFxcJyxcbiAgICAnXFxyJzogICAgICdyJyxcbiAgICAnXFxuJzogICAgICduJyxcbiAgICAnXFx0JzogICAgICd0JyxcbiAgICAnXFx1MjAyOCc6ICd1MjAyOCcsXG4gICAgJ1xcdTIwMjknOiAndTIwMjknXG4gIH07XG5cbiAgdmFyIGVzY2FwZXIgPSAvXFxcXHwnfFxccnxcXG58XFx0fFxcdTIwMjh8XFx1MjAyOS9nO1xuXG4gIC8vIEphdmFTY3JpcHQgbWljcm8tdGVtcGxhdGluZywgc2ltaWxhciB0byBKb2huIFJlc2lnJ3MgaW1wbGVtZW50YXRpb24uXG4gIC8vIFVuZGVyc2NvcmUgdGVtcGxhdGluZyBoYW5kbGVzIGFyYml0cmFyeSBkZWxpbWl0ZXJzLCBwcmVzZXJ2ZXMgd2hpdGVzcGFjZSxcbiAgLy8gYW5kIGNvcnJlY3RseSBlc2NhcGVzIHF1b3RlcyB3aXRoaW4gaW50ZXJwb2xhdGVkIGNvZGUuXG4gIF8udGVtcGxhdGUgPSBmdW5jdGlvbih0ZXh0LCBkYXRhLCBzZXR0aW5ncykge1xuICAgIHZhciByZW5kZXI7XG4gICAgc2V0dGluZ3MgPSBfLmRlZmF1bHRzKHt9LCBzZXR0aW5ncywgXy50ZW1wbGF0ZVNldHRpbmdzKTtcblxuICAgIC8vIENvbWJpbmUgZGVsaW1pdGVycyBpbnRvIG9uZSByZWd1bGFyIGV4cHJlc3Npb24gdmlhIGFsdGVybmF0aW9uLlxuICAgIHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChbXG4gICAgICAoc2V0dGluZ3MuZXNjYXBlIHx8IG5vTWF0Y2gpLnNvdXJjZSxcbiAgICAgIChzZXR0aW5ncy5pbnRlcnBvbGF0ZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuZXZhbHVhdGUgfHwgbm9NYXRjaCkuc291cmNlXG4gICAgXS5qb2luKCd8JykgKyAnfCQnLCAnZycpO1xuXG4gICAgLy8gQ29tcGlsZSB0aGUgdGVtcGxhdGUgc291cmNlLCBlc2NhcGluZyBzdHJpbmcgbGl0ZXJhbHMgYXBwcm9wcmlhdGVseS5cbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzb3VyY2UgPSBcIl9fcCs9J1wiO1xuICAgIHRleHQucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbihtYXRjaCwgZXNjYXBlLCBpbnRlcnBvbGF0ZSwgZXZhbHVhdGUsIG9mZnNldCkge1xuICAgICAgc291cmNlICs9IHRleHQuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICAgICAgLnJlcGxhY2UoZXNjYXBlciwgZnVuY3Rpb24obWF0Y2gpIHsgcmV0dXJuICdcXFxcJyArIGVzY2FwZXNbbWF0Y2hdOyB9KTtcblxuICAgICAgaWYgKGVzY2FwZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGVzY2FwZSArIFwiKSk9PW51bGw/Jyc6Xy5lc2NhcGUoX190KSkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGludGVycG9sYXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIicrXFxuKChfX3Q9KFwiICsgaW50ZXJwb2xhdGUgKyBcIikpPT1udWxsPycnOl9fdCkrXFxuJ1wiO1xuICAgICAgfVxuICAgICAgaWYgKGV2YWx1YXRlKSB7XG4gICAgICAgIHNvdXJjZSArPSBcIic7XFxuXCIgKyBldmFsdWF0ZSArIFwiXFxuX19wKz0nXCI7XG4gICAgICB9XG4gICAgICBpbmRleCA9IG9mZnNldCArIG1hdGNoLmxlbmd0aDtcbiAgICAgIHJldHVybiBtYXRjaDtcbiAgICB9KTtcbiAgICBzb3VyY2UgKz0gXCInO1xcblwiO1xuXG4gICAgLy8gSWYgYSB2YXJpYWJsZSBpcyBub3Qgc3BlY2lmaWVkLCBwbGFjZSBkYXRhIHZhbHVlcyBpbiBsb2NhbCBzY29wZS5cbiAgICBpZiAoIXNldHRpbmdzLnZhcmlhYmxlKSBzb3VyY2UgPSAnd2l0aChvYmp8fHt9KXtcXG4nICsgc291cmNlICsgJ31cXG4nO1xuXG4gICAgc291cmNlID0gXCJ2YXIgX190LF9fcD0nJyxfX2o9QXJyYXkucHJvdG90eXBlLmpvaW4sXCIgK1xuICAgICAgXCJwcmludD1mdW5jdGlvbigpe19fcCs9X19qLmNhbGwoYXJndW1lbnRzLCcnKTt9O1xcblwiICtcbiAgICAgIHNvdXJjZSArIFwicmV0dXJuIF9fcDtcXG5cIjtcblxuICAgIHRyeSB7XG4gICAgICByZW5kZXIgPSBuZXcgRnVuY3Rpb24oc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicsICdfJywgc291cmNlKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHJldHVybiByZW5kZXIoZGF0YSwgXyk7XG4gICAgdmFyIHRlbXBsYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmV0dXJuIHJlbmRlci5jYWxsKHRoaXMsIGRhdGEsIF8pO1xuICAgIH07XG5cbiAgICAvLyBQcm92aWRlIHRoZSBjb21waWxlZCBmdW5jdGlvbiBzb3VyY2UgYXMgYSBjb252ZW5pZW5jZSBmb3IgcHJlY29tcGlsYXRpb24uXG4gICAgdGVtcGxhdGUuc291cmNlID0gJ2Z1bmN0aW9uKCcgKyAoc2V0dGluZ3MudmFyaWFibGUgfHwgJ29iaicpICsgJyl7XFxuJyArIHNvdXJjZSArICd9JztcblxuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfTtcblxuICAvLyBBZGQgYSBcImNoYWluXCIgZnVuY3Rpb24sIHdoaWNoIHdpbGwgZGVsZWdhdGUgdG8gdGhlIHdyYXBwZXIuXG4gIF8uY2hhaW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gXyhvYmopLmNoYWluKCk7XG4gIH07XG5cbiAgLy8gT09QXG4gIC8vIC0tLS0tLS0tLS0tLS0tLVxuICAvLyBJZiBVbmRlcnNjb3JlIGlzIGNhbGxlZCBhcyBhIGZ1bmN0aW9uLCBpdCByZXR1cm5zIGEgd3JhcHBlZCBvYmplY3QgdGhhdFxuICAvLyBjYW4gYmUgdXNlZCBPTy1zdHlsZS4gVGhpcyB3cmFwcGVyIGhvbGRzIGFsdGVyZWQgdmVyc2lvbnMgb2YgYWxsIHRoZVxuICAvLyB1bmRlcnNjb3JlIGZ1bmN0aW9ucy4gV3JhcHBlZCBvYmplY3RzIG1heSBiZSBjaGFpbmVkLlxuXG4gIC8vIEhlbHBlciBmdW5jdGlvbiB0byBjb250aW51ZSBjaGFpbmluZyBpbnRlcm1lZGlhdGUgcmVzdWx0cy5cbiAgdmFyIHJlc3VsdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0aGlzLl9jaGFpbiA/IF8ob2JqKS5jaGFpbigpIDogb2JqO1xuICB9O1xuXG4gIC8vIEFkZCBhbGwgb2YgdGhlIFVuZGVyc2NvcmUgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyIG9iamVjdC5cbiAgXy5taXhpbihfKTtcblxuICAvLyBBZGQgYWxsIG11dGF0b3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsncG9wJywgJ3B1c2gnLCAncmV2ZXJzZScsICdzaGlmdCcsICdzb3J0JywgJ3NwbGljZScsICd1bnNoaWZ0J10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG9iaiA9IHRoaXMuX3dyYXBwZWQ7XG4gICAgICBtZXRob2QuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgaWYgKChuYW1lID09ICdzaGlmdCcgfHwgbmFtZSA9PSAnc3BsaWNlJykgJiYgb2JqLmxlbmd0aCA9PT0gMCkgZGVsZXRlIG9ialswXTtcbiAgICAgIHJldHVybiByZXN1bHQuY2FsbCh0aGlzLCBvYmopO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIEFkZCBhbGwgYWNjZXNzb3IgQXJyYXkgZnVuY3Rpb25zIHRvIHRoZSB3cmFwcGVyLlxuICBlYWNoKFsnY29uY2F0JywgJ2pvaW4nLCAnc2xpY2UnXSwgZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBtZXRob2QgPSBBcnJheVByb3RvW25hbWVdO1xuICAgIF8ucHJvdG90eXBlW25hbWVdID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgbWV0aG9kLmFwcGx5KHRoaXMuX3dyYXBwZWQsIGFyZ3VtZW50cykpO1xuICAgIH07XG4gIH0pO1xuXG4gIF8uZXh0ZW5kKF8ucHJvdG90eXBlLCB7XG5cbiAgICAvLyBTdGFydCBjaGFpbmluZyBhIHdyYXBwZWQgVW5kZXJzY29yZSBvYmplY3QuXG4gICAgY2hhaW46IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5fY2hhaW4gPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8vIEV4dHJhY3RzIHRoZSByZXN1bHQgZnJvbSBhIHdyYXBwZWQgYW5kIGNoYWluZWQgb2JqZWN0LlxuICAgIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl93cmFwcGVkO1xuICAgIH1cblxuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcblxufSkoKSIsIiMgKipyZXZpc2lvbi5jb2ZmZWUqKlxuIyBUaGlzIG1vZHVsZSBnZW5lcmF0ZXMgYSBwYXN0IHJldmlzaW9uIG9mIGEgZGF0YSBmaWxlIGFuZCBjYWNoZXMgaXQgaW4gJ2RhdGEvcmV2Jy5cbiNcbiMgVGhlIHNhdmVkIGZpbGUgaGFzIHRoZSBuYW1lIG9mIHRoZSBpZCBvZiB0aGUgcG9pbnQgaW4gdGhlIGpvdXJuYWwncyBoaXN0b3J5XG4jIHRoYXQgdGhlIHJldmlzaW9uIHJlcHJlc2VudHMuXG5cbmNyZWF0ZSA9IChyZXZJbmRleCwgZGF0YSkgLT5cbiAgam91cm5hbCA9IGRhdGEuam91cm5hbFxuICByZXZUaXRsZSA9IGRhdGEudGl0bGVcbiAgcmV2U3RvcnkgPSBbXVxuICByZXZKb3VybmFsID0gam91cm5hbFswLi4oK3JldkluZGV4KV1cbiAgZm9yIGpvdXJuYWxFbnRyeSBpbiByZXZKb3VybmFsXG4gICAgcmV2U3RvcnlJZHMgPSByZXZTdG9yeS5tYXAgKHN0b3J5SXRlbSkgLT4gc3RvcnlJdGVtLmlkXG4gICAgc3dpdGNoIGpvdXJuYWxFbnRyeS50eXBlXG4gICAgICB3aGVuICdjcmVhdGUnXG4gICAgICAgIGlmIGpvdXJuYWxFbnRyeS5pdGVtLnRpdGxlP1xuICAgICAgICAgIHJldlRpdGxlID0gam91cm5hbEVudHJ5Lml0ZW0udGl0bGVcbiAgICAgICAgICByZXZTdG9yeSA9IGpvdXJuYWxFbnRyeS5pdGVtLnN0b3J5IHx8IFtdXG4gICAgICB3aGVuICdhZGQnXG4gICAgICAgIGlmIChhZnRlckluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuYWZ0ZXIpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKGFmdGVySW5kZXgrMSwwLGpvdXJuYWxFbnRyeS5pdGVtKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV2U3RvcnkucHVzaCBqb3VybmFsRW50cnkuaXRlbVxuICAgICAgd2hlbiAnZWRpdCdcbiAgICAgICAgaWYgKGVkaXRJbmRleCA9IHJldlN0b3J5SWRzLmluZGV4T2Ygam91cm5hbEVudHJ5LmlkKSAhPSAtMVxuICAgICAgICAgIHJldlN0b3J5LnNwbGljZShlZGl0SW5kZXgsMSxqb3VybmFsRW50cnkuaXRlbSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldlN0b3J5LnB1c2ggam91cm5hbEVudHJ5Lml0ZW1cbiAgICAgIHdoZW4gJ21vdmUnXG4gICAgICAgIGl0ZW1zID0ge31cbiAgICAgICAgZm9yIHN0b3J5SXRlbSBpbiByZXZTdG9yeVxuICAgICAgICAgIGl0ZW1zW3N0b3J5SXRlbS5pZF0gPSBzdG9yeUl0ZW1cbiAgICAgICAgcmV2U3RvcnkgPSBbXVxuICAgICAgICBmb3IgaXRlbUlkIGluIGpvdXJuYWxFbnRyeS5vcmRlclxuICAgICAgICAgIHJldlN0b3J5LnB1c2goaXRlbXNbaXRlbUlkXSkgaWYgaXRlbXNbaXRlbUlkXT9cbiAgICAgIHdoZW4gJ3JlbW92ZSdcbiAgICAgICAgaWYgKHJlbW92ZUluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZiBqb3VybmFsRW50cnkuaWQpICE9IC0xXG4gICAgICAgICAgcmV2U3Rvcnkuc3BsaWNlKHJlbW92ZUluZGV4LDEpXG4gICAgICAjd2hlbiAnZm9yaycgICAjIGRvIG5vdGhpbmcgd2hlbiBmb3JrXG4gIHJldHVybiB7c3Rvcnk6IHJldlN0b3J5LCBqb3VybmFsOiByZXZKb3VybmFsLCB0aXRsZTogcmV2VGl0bGV9XG5cbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlIiwidXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gKGpvdXJuYWxFbGVtZW50LCBhY3Rpb24pIC0+XG4gIHBhZ2VFbGVtZW50ID0gam91cm5hbEVsZW1lbnQucGFyZW50cygnLnBhZ2U6Zmlyc3QnKVxuICBwcmV2ID0gam91cm5hbEVsZW1lbnQuZmluZChcIi5lZGl0W2RhdGEtaWQ9I3thY3Rpb24uaWQgfHwgMH1dXCIpIGlmIGFjdGlvbi50eXBlID09ICdlZGl0J1xuICBhY3Rpb25UaXRsZSA9IGFjdGlvbi50eXBlXG4gIGFjdGlvblRpdGxlICs9IFwiICN7dXRpbC5mb3JtYXRFbGFwc2VkVGltZShhY3Rpb24uZGF0ZSl9XCIgaWYgYWN0aW9uLmRhdGU/XG4gIGFjdGlvbkVsZW1lbnQgPSAkKFwiXCJcIjxhIGhyZWY9XCIjXCIgLz4gXCJcIlwiKS5hZGRDbGFzcyhcImFjdGlvblwiKS5hZGRDbGFzcyhhY3Rpb24udHlwZSlcbiAgICAudGV4dCh1dGlsLnN5bWJvbHNbYWN0aW9uLnR5cGVdKVxuICAgIC5hdHRyKCd0aXRsZScsYWN0aW9uVGl0bGUpXG4gICAgLmF0dHIoJ2RhdGEtaWQnLCBhY3Rpb24uaWQgfHwgXCIwXCIpXG4gICAgLmRhdGEoJ2FjdGlvbicsIGFjdGlvbilcbiAgY29udHJvbHMgPSBqb3VybmFsRWxlbWVudC5jaGlsZHJlbignLmNvbnRyb2wtYnV0dG9ucycpXG4gIGlmIGNvbnRyb2xzLmxlbmd0aCA+IDBcbiAgICBhY3Rpb25FbGVtZW50Lmluc2VydEJlZm9yZShjb250cm9scylcbiAgZWxzZVxuICAgIGFjdGlvbkVsZW1lbnQuYXBwZW5kVG8oam91cm5hbEVsZW1lbnQpXG4gIGlmIGFjdGlvbi50eXBlID09ICdmb3JrJyBhbmQgYWN0aW9uLnNpdGU/XG4gICAgYWN0aW9uRWxlbWVudFxuICAgICAgLmNzcyhcImJhY2tncm91bmQtaW1hZ2VcIiwgXCJ1cmwoLy8je2FjdGlvbi5zaXRlfS9mYXZpY29uLnBuZylcIilcbiAgICAgIC5hdHRyKFwiaHJlZlwiLCBcIi8vI3thY3Rpb24uc2l0ZX0vI3twYWdlRWxlbWVudC5hdHRyKCdpZCcpfS5odG1sXCIpXG4gICAgICAuZGF0YShcInNpdGVcIiwgYWN0aW9uLnNpdGUpXG4gICAgICAuZGF0YShcInNsdWdcIiwgcGFnZUVsZW1lbnQuYXR0cignaWQnKSlcblxuIiwiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUnXG5cbndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xuYWN0aXZlID0gcmVxdWlyZSAnLi9hY3RpdmUuY29mZmVlJ1xudXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5jcmVhdGVTZWFyY2ggPSByZXF1aXJlICcuL3NlYXJjaC5jb2ZmZWUnXG5cbm1vZHVsZS5leHBvcnRzID0gbmVpZ2hib3Job29kID0ge31cblxuXG53aWtpLm5laWdoYm9yaG9vZCA/PSB7fVxubmV4dEF2YWlsYWJsZUZldGNoID0gMFxubmV4dEZldGNoSW50ZXJ2YWwgPSAyMDAwXG5cbnBvcHVsYXRlU2l0ZUluZm9Gb3IgPSAoc2l0ZSxuZWlnaGJvckluZm8pLT5cbiAgcmV0dXJuIGlmIG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0XG4gIG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0ID0gdHJ1ZVxuXG4gIHRyYW5zaXRpb24gPSAoc2l0ZSwgZnJvbSwgdG8pIC0+XG4gICAgJChcIlwiXCIubmVpZ2hib3JbZGF0YS1zaXRlPVwiI3tzaXRlfVwiXVwiXCJcIilcbiAgICAgIC5maW5kKCdkaXYnKVxuICAgICAgLnJlbW92ZUNsYXNzKGZyb20pXG4gICAgICAuYWRkQ2xhc3ModG8pXG5cbiAgZmV0Y2hNYXAgPSAtPlxuICAgIHNpdGVtYXBVcmwgPSBcImh0dHA6Ly8je3NpdGV9L3N5c3RlbS9zaXRlbWFwLmpzb25cIlxuICAgIHRyYW5zaXRpb24gc2l0ZSwgJ3dhaXQnLCAnZmV0Y2gnXG4gICAgcmVxdWVzdCA9ICQuYWpheFxuICAgICAgdHlwZTogJ0dFVCdcbiAgICAgIGRhdGFUeXBlOiAnanNvbidcbiAgICAgIHVybDogc2l0ZW1hcFVybFxuICAgIHJlcXVlc3RcbiAgICAgIC5hbHdheXMoIC0+IG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0ID0gZmFsc2UgKVxuICAgICAgLmRvbmUgKGRhdGEpLT5cbiAgICAgICAgbmVpZ2hib3JJbmZvLnNpdGVtYXAgPSBkYXRhXG4gICAgICAgIHRyYW5zaXRpb24gc2l0ZSwgJ2ZldGNoJywgJ2RvbmUnXG4gICAgICAgICQoJ2JvZHknKS50cmlnZ2VyICduZXctbmVpZ2hib3ItZG9uZScsIHNpdGVcbiAgICAgIC5mYWlsIChkYXRhKS0+XG4gICAgICAgIHRyYW5zaXRpb24gc2l0ZSwgJ2ZldGNoJywgJ2ZhaWwnXG5cbiAgbm93ID0gRGF0ZS5ub3coKVxuICBpZiBub3cgPiBuZXh0QXZhaWxhYmxlRmV0Y2hcbiAgICBuZXh0QXZhaWxhYmxlRmV0Y2ggPSBub3cgKyBuZXh0RmV0Y2hJbnRlcnZhbFxuICAgIHNldFRpbWVvdXQgZmV0Y2hNYXAsIDEwMFxuICBlbHNlXG4gICAgc2V0VGltZW91dCBmZXRjaE1hcCwgbmV4dEF2YWlsYWJsZUZldGNoIC0gbm93XG4gICAgbmV4dEF2YWlsYWJsZUZldGNoICs9IG5leHRGZXRjaEludGVydmFsXG5cblxud2lraS5yZWdpc3Rlck5laWdoYm9yID0gbmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3IgPSAoc2l0ZSktPlxuICByZXR1cm4gaWYgd2lraS5uZWlnaGJvcmhvb2Rbc2l0ZV0/XG4gIG5laWdoYm9ySW5mbyA9IHt9XG4gIHdpa2kubmVpZ2hib3Job29kW3NpdGVdID0gbmVpZ2hib3JJbmZvXG4gIHBvcHVsYXRlU2l0ZUluZm9Gb3IoIHNpdGUsIG5laWdoYm9ySW5mbyApXG4gICQoJ2JvZHknKS50cmlnZ2VyICduZXctbmVpZ2hib3InLCBzaXRlXG5cbm5laWdoYm9yaG9vZC5saXN0TmVpZ2hib3JzID0gKCktPlxuICBfLmtleXMoIHdpa2kubmVpZ2hib3Job29kIClcblxubmVpZ2hib3Job29kLnNlYXJjaCA9IChzZWFyY2hRdWVyeSktPlxuICBmaW5kcyA9IFtdXG4gIHRhbGx5ID0ge31cblxuICB0aWNrID0gKGtleSkgLT5cbiAgICBpZiB0YWxseVtrZXldPyB0aGVuIHRhbGx5W2tleV0rKyBlbHNlIHRhbGx5W2tleV0gPSAxXG5cbiAgbWF0Y2ggPSAoa2V5LCB0ZXh0KSAtPlxuICAgIGhpdCA9IHRleHQ/IGFuZCB0ZXh0LnRvTG93ZXJDYXNlKCkuaW5kZXhPZiggc2VhcmNoUXVlcnkudG9Mb3dlckNhc2UoKSApID49IDBcbiAgICB0aWNrIGtleSBpZiBoaXRcbiAgICBoaXRcblxuICBzdGFydCA9IERhdGUubm93KClcbiAgZm9yIG93biBuZWlnaGJvclNpdGUsbmVpZ2hib3JJbmZvIG9mIHdpa2kubmVpZ2hib3Job29kXG4gICAgc2l0ZW1hcCA9IG5laWdoYm9ySW5mby5zaXRlbWFwXG4gICAgdGljayAnc2l0ZXMnIGlmIHNpdGVtYXA/XG4gICAgbWF0Y2hpbmdQYWdlcyA9IF8uZWFjaCBzaXRlbWFwLCAocGFnZSktPlxuICAgICAgdGljayAncGFnZXMnXG4gICAgICByZXR1cm4gdW5sZXNzIG1hdGNoKCd0aXRsZScsIHBhZ2UudGl0bGUpIG9yIG1hdGNoKCd0ZXh0JywgcGFnZS5zeW5vcHNpcykgb3IgbWF0Y2goJ3NsdWcnLCBwYWdlLnNsdWcpXG4gICAgICB0aWNrICdmaW5kcydcbiAgICAgIGZpbmRzLnB1c2hcbiAgICAgICAgcGFnZTogcGFnZSxcbiAgICAgICAgc2l0ZTogbmVpZ2hib3JTaXRlLFxuICAgICAgICByYW5rOiAxICMgSEFSRENPREVEIEZPUiBOT1dcbiAgdGFsbHlbJ21zZWMnXSA9IERhdGUubm93KCkgLSBzdGFydFxuICB7IGZpbmRzLCB0YWxseSB9XG5cblxuJCAtPlxuICAkbmVpZ2hib3Job29kID0gJCgnLm5laWdoYm9yaG9vZCcpXG5cbiAgZmxhZyA9IChzaXRlKSAtPlxuICAgICMgc3RhdHVzIGNsYXNzIHByb2dyZXNzaW9uOiAud2FpdCwgLmZldGNoLCAuZmFpbCBvciAuZG9uZVxuICAgIFwiXCJcIlxuICAgICAgPHNwYW4gY2xhc3M9XCJuZWlnaGJvclwiIGRhdGEtc2l0ZT1cIiN7c2l0ZX1cIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cIndhaXRcIj5cbiAgICAgICAgICA8aW1nIHNyYz1cImh0dHA6Ly8je3NpdGV9L2Zhdmljb24ucG5nXCIgdGl0bGU9XCIje3NpdGV9XCI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zcGFuPlxuICAgIFwiXCJcIlxuXG4gICQoJ2JvZHknKVxuICAgIC5vbiAnbmV3LW5laWdoYm9yJywgKGUsIHNpdGUpIC0+XG4gICAgICAkbmVpZ2hib3Job29kLmFwcGVuZCBmbGFnIHNpdGVcbiAgICAuZGVsZWdhdGUgJy5uZWlnaGJvciBpbWcnLCAnY2xpY2snLCAoZSkgLT5cbiAgICAgIHdpa2kuZG9JbnRlcm5hbExpbmsgJ3dlbGNvbWUtdmlzaXRvcnMnLCBudWxsLCBALnRpdGxlXG5cbiAgc2VhcmNoID0gY3JlYXRlU2VhcmNoKHtuZWlnaGJvcmhvb2R9KVxuXG4gICQoJ2lucHV0LnNlYXJjaCcpLm9uICdrZXlwcmVzcycsIChlKS0+XG4gICAgcmV0dXJuIGlmIGUua2V5Q29kZSAhPSAxMyAjIDEzID09IHJldHVyblxuICAgIHNlYXJjaFF1ZXJ5ID0gJCh0aGlzKS52YWwoKVxuICAgIHNlYXJjaC5wZXJmb3JtU2VhcmNoKCBzZWFyY2hRdWVyeSApXG4gICAgJCh0aGlzKS52YWwoXCJcIilcbiIsIndpa2kgPSByZXF1aXJlICcuL3dpa2kuY29mZmVlJ1xudXRpbCA9IHJlcXVpcmUgJy4vdXRpbC5jb2ZmZWUnXG5hY3RpdmUgPSByZXF1aXJlICcuL2FjdGl2ZS5jb2ZmZWUnXG5cbmNyZWF0ZVNlYXJjaCA9ICh7bmVpZ2hib3Job29kfSktPlxuICBwZXJmb3JtU2VhcmNoID0gKHNlYXJjaFF1ZXJ5KS0+XG4gICAgc2VhcmNoUmVzdWx0cyA9IG5laWdoYm9yaG9vZC5zZWFyY2goc2VhcmNoUXVlcnkpXG4gICAgdGFsbHkgPSBzZWFyY2hSZXN1bHRzLnRhbGx5XG5cblxuICAgIGV4cGxhbmF0b3J5UGFyYSA9IHtcbiAgICAgIHR5cGU6ICdwYXJhZ3JhcGgnXG4gICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIFN0cmluZyAnI3tzZWFyY2hRdWVyeX0nIGZvdW5kIG9uICN7dGFsbHkuZmluZHN8fCdub25lJ30gb2YgI3t0YWxseS5wYWdlc3x8J25vJ30gcGFnZXMgZnJvbSAje3RhbGx5LnNpdGVzfHwnbm8nfSBzaXRlcy5cbiAgICAgICAgVGV4dCBtYXRjaGVkIG9uICN7dGFsbHkudGl0bGV8fCdubyd9IHRpdGxlcywgI3t0YWxseS50ZXh0fHwnbm8nfSBwYXJhZ3JhcGhzLCBhbmQgI3t0YWxseS5zbHVnfHwnbm8nfSBzbHVncy5cbiAgICAgICAgRWxhcHNlZCB0aW1lICN7dGFsbHkubXNlY30gbWlsbGlzZWNvbmRzLlxuICAgICAgXCJcIlwiXG4gICAgfVxuICAgIHNlYXJjaFJlc3VsdFJlZmVyZW5jZXMgPSBmb3IgcmVzdWx0IGluIHNlYXJjaFJlc3VsdHMuZmluZHNcbiAgICAgIHtcbiAgICAgICAgXCJ0eXBlXCI6IFwicmVmZXJlbmNlXCJcbiAgICAgICAgXCJpZFwiOiB1dGlsLnJhbmRvbUJ5dGVzKDgpXG4gICAgICAgIFwic2l0ZVwiOiByZXN1bHQuc2l0ZVxuICAgICAgICBcInNsdWdcIjogcmVzdWx0LnBhZ2Uuc2x1Z1xuICAgICAgICBcInRpdGxlXCI6IHJlc3VsdC5wYWdlLnRpdGxlXG4gICAgICAgIFwidGV4dFwiOiByZXN1bHQucGFnZS5zeW5vcHNpcyB8fCAnJ1xuICAgICAgfVxuICAgIHNlYXJjaFJlc3VsdFBhZ2VEYXRhID0ge1xuICAgICAgdGl0bGU6IFwiU2VhcmNoIFJlc3VsdHNcIlxuICAgICAgc3Rvcnk6IFtleHBsYW5hdG9yeVBhcmFdLmNvbmNhdChzZWFyY2hSZXN1bHRSZWZlcmVuY2VzKVxuICAgIH1cbiAgICAkc2VhcmNoUmVzdWx0UGFnZSA9IHdpa2kuY3JlYXRlUGFnZSgnc2VhcmNoLXJlc3VsdHMnKS5hZGRDbGFzcygnZ2hvc3QnKVxuICAgICRzZWFyY2hSZXN1bHRQYWdlLmFwcGVuZFRvKCQoJy5tYWluJykpXG4gICAgd2lraS5idWlsZFBhZ2UoIHNlYXJjaFJlc3VsdFBhZ2VEYXRhLCBudWxsLCAkc2VhcmNoUmVzdWx0UGFnZSApXG4gICAgYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSlcblxuXG4gIHtcbiAgICBwZXJmb3JtU2VhcmNoXG4gIH1cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2VhcmNoXG4iXX0=
;