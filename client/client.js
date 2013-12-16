;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
window.wiki = require('wiki-client/lib/wiki');

require('wiki-client/lib/legacy');


},{"wiki-client/lib/legacy":3,"wiki-client/lib/wiki":2}],3:[function(require,module,exports){
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
      return wiki.log('ajax error', event, request, settings);
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
        rev = $(this).parent().children().not('.separator').index($action);
        if (rev < 0) {
          return;
        }
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

},{"./active":8,"./page":10,"./pageHandler":5,"./plugin":6,"./refresh":9,"./state":7,"./util":4,"./wiki":2}],2:[function(require,module,exports){
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

},{"./persona":12,"./synopsis":11}],8:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
(function() {
  module.exports = function(owner) {
    var failureDlg;
    $("#user-email").hide();
    $("#persona-login-btn").hide();
    $("#persona-logout-btn").hide();
    failureDlg = function(message) {
      return $("<div></div>").dialog({
        open: function(event, ui) {
          return $(".ui-dialog-titlebar-close").hide();
        },
        buttons: {
          "Ok": function() {
            $(this).dialog("close");
            return navigator.id.logout();
          }
        },
        close: function(event, ui) {
          return $(this).remove();
        },
        resizable: false,
        title: "Login Failure",
        modal: true
      }).html(message);
    };
    navigator.id.watch({
      loggedInUser: owner,
      onlogin: function(assertion) {
        return $.post("/persona_login", {
          assertion: assertion
        }, function(verified) {
          var failureMsg;
          verified = JSON.parse(verified);
          if ("okay" === verified.status) {
            return window.location = "/";
          } else if ("wrong-address" === verified.status) {
            return failureDlg("<p>Sign in is currently only available for the site owner.</p>");
          } else if ("failure" === verified.status) {
            if (/domain mismatch/.test(verified.reason)) {
              failureMsg = "<p>It looks as if you are accessing the site using an alternative address.</p>" + "<p>Please check that you are using the correct address to access this site.</p>";
            } else {
              failureMsg = "<p>Unable to log you in.</p>";
            }
            return failureDlg(failureMsg);
          } else {
            return navigator.id.logout();
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

},{}],6:[function(require,module,exports){
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

},{"./factory":14,"./reference":13,"./util":4,"./wiki":2}],4:[function(require,module,exports){
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

},{"./wiki":2}],7:[function(require,module,exports){
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

},{"./active":8,"./wiki":2}],15:[function(require,module,exports){
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

},{"./util":4}],5:[function(require,module,exports){
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
        var troublePageObject;
        if ((xhr.status !== 404) && (xhr.status !== 0)) {
          wiki.log('pageHandler.get error', xhr, xhr.status, type, msg);
          troublePageObject = newPage({
            title: "Trouble: Can't Get Page"
          }, null);
          troublePageObject.addParagraph("The page handler has run into problems with this   request.\n<pre class=error>" + (JSON.stringify(pageInformation)) + "</pre>\nThe requested url.\n<pre class=error>" + url + "</pre>\nThe server reported status.\n<pre class=error>" + xhr.status + "</pre>\nThe error type.\n<pre class=error>" + type + "</pre>\nThe error message.\n<pre class=error>" + msg + "</pre>\nThese problems are rarely solved by reporting issues.\nThere could be additional information reported in the browser's console.log.\nMore information might be accessible by fetching the page outside of wiki.\n<a href=\"" + url + "\" target=\"_blank\">try-now</a>");
          return whenGotten(troublePageObject);
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

},{"./addToJournal":16,"./page":10,"./revision":15,"./state":7,"./util":4,"./wiki":2,"underscore":17}],10:[function(require,module,exports){
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

},{"./util":4,"underscore":17}],9:[function(require,module,exports){
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

},{"./addToJournal":16,"./neighborhood":18,"./page":10,"./pageHandler":5,"./plugin":6,"./state":7,"./util":4,"./wiki":2,"underscore":17}],17:[function(require,module,exports){
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

},{"./active":8,"./page":10,"./util":4,"./wiki":2}],18:[function(require,module,exports){
(function() {
  var active, createSearch, neighborhood, nextAvailableFetch, nextFetchInterval, populateSiteInfoFor, totalPages, util, wiki, _,
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

  totalPages = 0;

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
    }).on('new-neighbor-done', function(e, site) {
      var img, pageCount;
      pageCount = wiki.neighborhood[site].sitemap.length;
      img = $(".neighborhood .neighbor[data-site=\"" + site + "\"]").find('img');
      img.attr('title', "" + site + "\n " + pageCount + " pages");
      totalPages += pageCount;
      return $('.searchbox .pages').text("" + totalPages + " pages");
    }).delegate('.neighbor img', 'click', function(e) {
      return wiki.doInternalLink('welcome-visitors', null, this.title.split("\n")[0]);
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

},{"./active":8,"./search":19,"./util":4,"./wiki":2,"underscore":17}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvY2xpZW50LmNvZmZlZSIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL2xlZ2FjeS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3dpa2kuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9hY3RpdmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9zeW5vcHNpcy5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3BlcnNvbmEuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9wbHVnaW4uanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi91dGlsLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL0ZlZFdpa2kvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy93aWtpLWNsaWVudC9saWIvc3RhdGUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9yZXZpc2lvbi5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3JlZmVyZW5jZS5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL2ZhY3RvcnkuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9hZGRUb0pvdXJuYWwuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9wYWdlSGFuZGxlci5qcyIsIi9Vc2Vycy93Y3VubmluZ2hhbS9GZWRXaWtpL1NtYWxsZXN0LUZlZGVyYXRlZC1XaWtpL2NsaWVudC9ub2RlX21vZHVsZXMvd2lraS1jbGllbnQvbGliL3BhZ2UuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9yZWZyZXNoLmpzIiwiL1VzZXJzL3djdW5uaW5naGFtL0ZlZFdpa2kvU21hbGxlc3QtRmVkZXJhdGVkLVdpa2kvY2xpZW50L25vZGVfbW9kdWxlcy91bmRlcnNjb3JlL3VuZGVyc2NvcmUuanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9zZWFyY2guanMiLCIvVXNlcnMvd2N1bm5pbmdoYW0vRmVkV2lraS9TbWFsbGVzdC1GZWRlcmF0ZWQtV2lraS9jbGllbnQvbm9kZV9tb2R1bGVzL3dpa2ktY2xpZW50L2xpYi9uZWlnaGJvcmhvb2QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLENBQU8sRUFBTyxDQUFkLEVBQU0sQ0FBUSxlQUFBOztBQUNkLENBREEsTUFDQSxpQkFBQTs7OztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3dkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsid2luZG93Lndpa2kgPSByZXF1aXJlKCd3aWtpLWNsaWVudC9saWIvd2lraScpXG5yZXF1aXJlKCd3aWtpLWNsaWVudC9saWIvbGVnYWN5JylcblxuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBuZXdQYWdlLCBwYWdlSGFuZGxlciwgcGx1Z2luLCByZWZyZXNoLCBzdGF0ZSwgdXRpbCwgd2lraTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIHBhZ2VIYW5kbGVyID0gd2lraS5wYWdlSGFuZGxlciA9IHJlcXVpcmUoJy4vcGFnZUhhbmRsZXInKTtcblxuICBwbHVnaW4gPSByZXF1aXJlKCcuL3BsdWdpbicpO1xuXG4gIHN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZScpO1xuXG4gIGFjdGl2ZSA9IHJlcXVpcmUoJy4vYWN0aXZlJyk7XG5cbiAgcmVmcmVzaCA9IHJlcXVpcmUoJy4vcmVmcmVzaCcpO1xuXG4gIG5ld1BhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKS5uZXdQYWdlO1xuXG4gIEFycmF5LnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXNbdGhpcy5sZW5ndGggLSAxXTtcbiAgfTtcblxuICAkKGZ1bmN0aW9uKCkge1xuICAgIHZhciBMRUZUQVJST1csIFJJR0hUQVJST1csIGNyZWF0ZVRleHRFbGVtZW50LCBkb0ludGVybmFsTGluaywgZmluaXNoQ2xpY2ssIGdldFRlbXBsYXRlLCBzbGVlcCwgdGV4dEVkaXRvcjtcbiAgICB3aW5kb3cuZGlhbG9nID0gJCgnPGRpdj48L2Rpdj4nKS5odG1sKCdUaGlzIGRpYWxvZyB3aWxsIHNob3cgZXZlcnkgdGltZSEnKS5kaWFsb2coe1xuICAgICAgYXV0b09wZW46IGZhbHNlLFxuICAgICAgdGl0bGU6ICdCYXNpYyBEaWFsb2cnLFxuICAgICAgaGVpZ2h0OiA2MDAsXG4gICAgICB3aWR0aDogODAwXG4gICAgfSk7XG4gICAgd2lraS5kaWFsb2cgPSBmdW5jdGlvbih0aXRsZSwgaHRtbCkge1xuICAgICAgd2luZG93LmRpYWxvZy5odG1sKGh0bWwpO1xuICAgICAgd2luZG93LmRpYWxvZy5kaWFsb2coXCJvcHRpb25cIiwgXCJ0aXRsZVwiLCB3aWtpLnJlc29sdmVMaW5rcyh0aXRsZSkpO1xuICAgICAgcmV0dXJuIHdpbmRvdy5kaWFsb2cuZGlhbG9nKCdvcGVuJyk7XG4gICAgfTtcbiAgICBzbGVlcCA9IGZ1bmN0aW9uKHRpbWUsIGRvbmUpIHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KGRvbmUsIHRpbWUpO1xuICAgIH07XG4gICAgd2lraS5yZW1vdmVJdGVtID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICAgIHBhZ2VIYW5kbGVyLnB1dCgkaXRlbS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpLCB7XG4gICAgICAgIHR5cGU6ICdyZW1vdmUnLFxuICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gJGl0ZW0ucmVtb3ZlKCk7XG4gICAgfTtcbiAgICB3aWtpLmNyZWF0ZUl0ZW0gPSBmdW5jdGlvbigkcGFnZSwgJGJlZm9yZSwgaXRlbSkge1xuICAgICAgdmFyICRpdGVtLCBiZWZvcmU7XG4gICAgICBpZiAoJHBhZ2UgPT0gbnVsbCkge1xuICAgICAgICAkcGFnZSA9ICRiZWZvcmUucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgIH1cbiAgICAgIGl0ZW0uaWQgPSB1dGlsLnJhbmRvbUJ5dGVzKDgpO1xuICAgICAgJGl0ZW0gPSAkKFwiPGRpdiBjbGFzcz1cXFwiaXRlbSBcIiArIGl0ZW0udHlwZSArIFwiXFxcIiBkYXRhLWlkPVxcXCJcIiArIFwiXFxcIjwvZGl2PlwiKTtcbiAgICAgICRpdGVtLmRhdGEoJ2l0ZW0nLCBpdGVtKS5kYXRhKCdwYWdlRWxlbWVudCcsICRwYWdlKTtcbiAgICAgIGlmICgkYmVmb3JlICE9IG51bGwpIHtcbiAgICAgICAgJGJlZm9yZS5hZnRlcigkaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZS5maW5kKCcuc3RvcnknKS5hcHBlbmQoJGl0ZW0pO1xuICAgICAgfVxuICAgICAgcGx1Z2luW1wiZG9cIl0oJGl0ZW0sIGl0ZW0pO1xuICAgICAgYmVmb3JlID0gd2lraS5nZXRJdGVtKCRiZWZvcmUpO1xuICAgICAgc2xlZXAoNTAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dCgkcGFnZSwge1xuICAgICAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICAgICAgYWZ0ZXI6IGJlZm9yZSAhPSBudWxsID8gYmVmb3JlLmlkIDogdm9pZCAwXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gJGl0ZW07XG4gICAgfTtcbiAgICBjcmVhdGVUZXh0RWxlbWVudCA9IGZ1bmN0aW9uKHBhZ2VFbGVtZW50LCBiZWZvcmVFbGVtZW50LCBpbml0aWFsVGV4dCkge1xuICAgICAgdmFyIGl0ZW0sIGl0ZW1CZWZvcmUsIGl0ZW1FbGVtZW50O1xuICAgICAgaXRlbSA9IHtcbiAgICAgICAgdHlwZTogJ3BhcmFncmFwaCcsXG4gICAgICAgIGlkOiB1dGlsLnJhbmRvbUJ5dGVzKDgpLFxuICAgICAgICB0ZXh0OiBpbml0aWFsVGV4dFxuICAgICAgfTtcbiAgICAgIGl0ZW1FbGVtZW50ID0gJChcIjxkaXYgY2xhc3M9XFxcIml0ZW0gcGFyYWdyYXBoXFxcIiBkYXRhLWlkPVwiICsgaXRlbS5pZCArIFwiPjwvZGl2PlwiKTtcbiAgICAgIGl0ZW1FbGVtZW50LmRhdGEoJ2l0ZW0nLCBpdGVtKS5kYXRhKCdwYWdlRWxlbWVudCcsIHBhZ2VFbGVtZW50KTtcbiAgICAgIGJlZm9yZUVsZW1lbnQuYWZ0ZXIoaXRlbUVsZW1lbnQpO1xuICAgICAgcGx1Z2luW1wiZG9cIl0oaXRlbUVsZW1lbnQsIGl0ZW0pO1xuICAgICAgaXRlbUJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KTtcbiAgICAgIHdpa2kudGV4dEVkaXRvcihpdGVtRWxlbWVudCwgaXRlbSk7XG4gICAgICByZXR1cm4gc2xlZXAoNTAwLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dChwYWdlRWxlbWVudCwge1xuICAgICAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICAgICAgaWQ6IGl0ZW0uaWQsXG4gICAgICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICAgICAgYWZ0ZXI6IGl0ZW1CZWZvcmUgIT0gbnVsbCA/IGl0ZW1CZWZvcmUuaWQgOiB2b2lkIDBcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHRleHRFZGl0b3IgPSB3aWtpLnRleHRFZGl0b3IgPSBmdW5jdGlvbihkaXYsIGl0ZW0sIGNhcmV0UG9zLCBkb3VibGVDbGlja2VkKSB7XG4gICAgICB2YXIgb3JpZ2luYWwsIHRleHRhcmVhLCBfcmVmO1xuICAgICAgaWYgKGRpdi5oYXNDbGFzcygndGV4dEVkaXRpbmcnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBkaXYuYWRkQ2xhc3MoJ3RleHRFZGl0aW5nJyk7XG4gICAgICB0ZXh0YXJlYSA9ICQoXCI8dGV4dGFyZWE+XCIgKyAob3JpZ2luYWwgPSAoX3JlZiA9IGl0ZW0udGV4dCkgIT0gbnVsbCA/IF9yZWYgOiAnJykgKyBcIjwvdGV4dGFyZWE+XCIpLmZvY3Vzb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBkaXYucmVtb3ZlQ2xhc3MoJ3RleHRFZGl0aW5nJyk7XG4gICAgICAgIGlmIChpdGVtLnRleHQgPSB0ZXh0YXJlYS52YWwoKSkge1xuICAgICAgICAgIHBsdWdpbltcImRvXCJdKGRpdi5lbXB0eSgpLCBpdGVtKTtcbiAgICAgICAgICBpZiAoaXRlbS50ZXh0ID09PSBvcmlnaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwYWdlSGFuZGxlci5wdXQoZGl2LnBhcmVudHMoJy5wYWdlOmZpcnN0JyksIHtcbiAgICAgICAgICAgIHR5cGU6ICdlZGl0JyxcbiAgICAgICAgICAgIGlkOiBpdGVtLmlkLFxuICAgICAgICAgICAgaXRlbTogaXRlbVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhZ2VIYW5kbGVyLnB1dChkaXYucGFyZW50cygnLnBhZ2U6Zmlyc3QnKSwge1xuICAgICAgICAgICAgdHlwZTogJ3JlbW92ZScsXG4gICAgICAgICAgICBpZDogaXRlbS5pZFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGRpdi5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0pLmJpbmQoJ2tleWRvd24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBtaWRkbGUsIHBhZ2UsIHBhZ2VFbGVtZW50LCBwcmVmaXgsIHByZXZJdGVtLCBwcmV2VGV4dExlbiwgc2VsLCBzdWZmaXgsIHRleHQ7XG4gICAgICAgIGlmICgoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSAmJiBlLndoaWNoID09PSA4Mykge1xuICAgICAgICAgIHRleHRhcmVhLmZvY3Vzb3V0KCk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoZS5hbHRLZXkgfHwgZS5jdGxLZXkgfHwgZS5tZXRhS2V5KSAmJiBlLndoaWNoID09PSA3Mykge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBpZiAoIWUuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkb0ludGVybmFsTGluayhcImFib3V0IFwiICsgaXRlbS50eXBlICsgXCIgcGx1Z2luXCIsIHBhZ2UpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbS50eXBlID09PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgIHNlbCA9IHV0aWwuZ2V0U2VsZWN0aW9uUG9zKHRleHRhcmVhKTtcbiAgICAgICAgICBpZiAoZS53aGljaCA9PT0gJC51aS5rZXlDb2RlLkJBQ0tTUEFDRSAmJiBzZWwuc3RhcnQgPT09IDAgJiYgc2VsLnN0YXJ0ID09PSBzZWwuZW5kKSB7XG4gICAgICAgICAgICBwcmV2SXRlbSA9IHdpa2kuZ2V0SXRlbShkaXYucHJldigpKTtcbiAgICAgICAgICAgIGlmIChwcmV2SXRlbS50eXBlICE9PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2VGV4dExlbiA9IHByZXZJdGVtLnRleHQubGVuZ3RoO1xuICAgICAgICAgICAgcHJldkl0ZW0udGV4dCArPSB0ZXh0YXJlYS52YWwoKTtcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbCgnJyk7XG4gICAgICAgICAgICB0ZXh0RWRpdG9yKGRpdi5wcmV2KCksIHByZXZJdGVtLCBwcmV2VGV4dExlbik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIGlmIChlLndoaWNoID09PSAkLnVpLmtleUNvZGUuRU5URVIgJiYgaXRlbS50eXBlID09PSAncGFyYWdyYXBoJykge1xuICAgICAgICAgICAgaWYgKCFzZWwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGV4dCA9IHRleHRhcmVhLnZhbCgpO1xuICAgICAgICAgICAgcHJlZml4ID0gdGV4dC5zdWJzdHJpbmcoMCwgc2VsLnN0YXJ0KTtcbiAgICAgICAgICAgIGlmIChzZWwuc3RhcnQgIT09IHNlbC5lbmQpIHtcbiAgICAgICAgICAgICAgbWlkZGxlID0gdGV4dC5zdWJzdHJpbmcoc2VsLnN0YXJ0LCBzZWwuZW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN1ZmZpeCA9IHRleHQuc3Vic3RyaW5nKHNlbC5lbmQpO1xuICAgICAgICAgICAgaWYgKHByZWZpeCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgdGV4dGFyZWEudmFsKCcgJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0ZXh0YXJlYS52YWwocHJlZml4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHRhcmVhLmZvY3Vzb3V0KCk7XG4gICAgICAgICAgICBwYWdlRWxlbWVudCA9IGRpdi5wYXJlbnQoKS5wYXJlbnQoKTtcbiAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsIHN1ZmZpeCk7XG4gICAgICAgICAgICBpZiAobWlkZGxlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgY3JlYXRlVGV4dEVsZW1lbnQocGFnZUVsZW1lbnQsIGRpdiwgbWlkZGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcmVmaXggPT09ICcnKSB7XG4gICAgICAgICAgICAgIGNyZWF0ZVRleHRFbGVtZW50KHBhZ2VFbGVtZW50LCBkaXYsICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgZGl2Lmh0bWwodGV4dGFyZWEpO1xuICAgICAgaWYgKGNhcmV0UG9zICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbih0ZXh0YXJlYSwgY2FyZXRQb3MpO1xuICAgICAgfSBlbHNlIGlmIChkb3VibGVDbGlja2VkKSB7XG4gICAgICAgIHV0aWwuc2V0Q2FyZXRQb3NpdGlvbih0ZXh0YXJlYSwgdGV4dGFyZWEudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIHRleHRhcmVhLnNjcm9sbFRvcCh0ZXh0YXJlYVswXS5zY3JvbGxIZWlnaHQgLSB0ZXh0YXJlYS5oZWlnaHQoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGV4dGFyZWEuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGRvSW50ZXJuYWxMaW5rID0gd2lraS5kb0ludGVybmFsTGluayA9IGZ1bmN0aW9uKG5hbWUsIHBhZ2UsIHNpdGUpIHtcbiAgICAgIGlmIChzaXRlID09IG51bGwpIHtcbiAgICAgICAgc2l0ZSA9IG51bGw7XG4gICAgICB9XG4gICAgICBuYW1lID0gd2lraS5hc1NsdWcobmFtZSk7XG4gICAgICBpZiAocGFnZSAhPSBudWxsKSB7XG4gICAgICAgICQocGFnZSkubmV4dEFsbCgpLnJlbW92ZSgpO1xuICAgICAgfVxuICAgICAgd2lraS5jcmVhdGVQYWdlKG5hbWUsIHNpdGUpLmFwcGVuZFRvKCQoJy5tYWluJykpLmVhY2gocmVmcmVzaCk7XG4gICAgICByZXR1cm4gYWN0aXZlLnNldCgkKCcucGFnZScpLmxhc3QoKSk7XG4gICAgfTtcbiAgICBMRUZUQVJST1cgPSAzNztcbiAgICBSSUdIVEFSUk9XID0gMzk7XG4gICAgJChkb2N1bWVudCkua2V5ZG93bihmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGRpcmVjdGlvbiwgbmV3SW5kZXgsIHBhZ2VzO1xuICAgICAgZGlyZWN0aW9uID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICBzd2l0Y2ggKGV2ZW50LndoaWNoKSB7XG4gICAgICAgICAgY2FzZSBMRUZUQVJST1c6XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgY2FzZSBSSUdIVEFSUk9XOlxuICAgICAgICAgICAgcmV0dXJuICsxO1xuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgICAgaWYgKGRpcmVjdGlvbiAmJiAhKGV2ZW50LnRhcmdldC50YWdOYW1lID09PSBcIlRFWFRBUkVBXCIpKSB7XG4gICAgICAgIHBhZ2VzID0gJCgnLnBhZ2UnKTtcbiAgICAgICAgbmV3SW5kZXggPSBwYWdlcy5pbmRleCgkKCcuYWN0aXZlJykpICsgZGlyZWN0aW9uO1xuICAgICAgICBpZiAoKDAgPD0gbmV3SW5kZXggJiYgbmV3SW5kZXggPCBwYWdlcy5sZW5ndGgpKSB7XG4gICAgICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQocGFnZXMuZXEobmV3SW5kZXgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgICQod2luZG93KS5vbigncG9wc3RhdGUnLCBzdGF0ZS5zaG93KTtcbiAgICAkKGRvY3VtZW50KS5hamF4RXJyb3IoZnVuY3Rpb24oZXZlbnQsIHJlcXVlc3QsIHNldHRpbmdzKSB7XG4gICAgICBpZiAocmVxdWVzdC5zdGF0dXMgPT09IDAgfHwgcmVxdWVzdC5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICByZXR1cm4gd2lraS5sb2coJ2FqYXggZXJyb3InLCBldmVudCwgcmVxdWVzdCwgc2V0dGluZ3MpO1xuICAgIH0pO1xuICAgIGdldFRlbXBsYXRlID0gZnVuY3Rpb24oc2x1ZywgZG9uZSkge1xuICAgICAgaWYgKCFzbHVnKSB7XG4gICAgICAgIHJldHVybiBkb25lKG51bGwpO1xuICAgICAgfVxuICAgICAgd2lraS5sb2coJ2dldFRlbXBsYXRlJywgc2x1Zyk7XG4gICAgICByZXR1cm4gcGFnZUhhbmRsZXIuZ2V0KHtcbiAgICAgICAgd2hlbkdvdHRlbjogZnVuY3Rpb24oZGF0YSwgc2l0ZUZvdW5kKSB7XG4gICAgICAgICAgcmV0dXJuIGRvbmUoZGF0YS5zdG9yeSk7XG4gICAgICAgIH0sXG4gICAgICAgIHdoZW5Ob3RHb3R0ZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBkb25lKG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBwYWdlSW5mb3JtYXRpb246IHtcbiAgICAgICAgICBzbHVnOiBzbHVnXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG4gICAgZmluaXNoQ2xpY2sgPSBmdW5jdGlvbihlLCBuYW1lKSB7XG4gICAgICB2YXIgcGFnZTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICghZS5zaGlmdEtleSkge1xuICAgICAgICBwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgIH1cbiAgICAgIGRvSW50ZXJuYWxMaW5rKG5hbWUsIHBhZ2UsICQoZS50YXJnZXQpLmRhdGEoJ3NpdGUnKSk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICAkKCcubWFpbicpLmRlbGVnYXRlKCcuc2hvdy1wYWdlLXNvdXJjZScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBqc29uLCBwYWdlRWxlbWVudDtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHBhZ2VFbGVtZW50ID0gJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKTtcbiAgICAgIGpzb24gPSBwYWdlRWxlbWVudC5kYXRhKCdkYXRhJyk7XG4gICAgICByZXR1cm4gd2lraS5kaWFsb2coXCJKU09OIGZvciBcIiArIGpzb24udGl0bGUsICQoJzxwcmUvPicpLnRleHQoSlNPTi5zdHJpbmdpZnkoanNvbiwgbnVsbCwgMikpKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLnBhZ2UnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoISQoZS50YXJnZXQpLmlzKFwiYVwiKSkge1xuICAgICAgICByZXR1cm4gYWN0aXZlLnNldCh0aGlzKTtcbiAgICAgIH1cbiAgICB9KS5kZWxlZ2F0ZSgnLmludGVybmFsJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIG5hbWU7XG4gICAgICBuYW1lID0gJChlLnRhcmdldCkuZGF0YSgncGFnZU5hbWUnKTtcbiAgICAgIHBhZ2VIYW5kbGVyLmNvbnRleHQgPSAkKGUudGFyZ2V0KS5hdHRyKCd0aXRsZScpLnNwbGl0KCcgPT4gJyk7XG4gICAgICByZXR1cm4gZmluaXNoQ2xpY2soZSwgbmFtZSk7XG4gICAgfSkuZGVsZWdhdGUoJ2ltZy5yZW1vdGUnLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgbmFtZTtcbiAgICAgIG5hbWUgPSAkKGUudGFyZ2V0KS5kYXRhKCdzbHVnJyk7XG4gICAgICBwYWdlSGFuZGxlci5jb250ZXh0ID0gWyQoZS50YXJnZXQpLmRhdGEoJ3NpdGUnKV07XG4gICAgICByZXR1cm4gZmluaXNoQ2xpY2soZSwgbmFtZSk7XG4gICAgfSkuZGVsZWdhdGUoJy5yZXZpc2lvbicsICdkYmxjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkcGFnZSwgYWN0aW9uLCBqc29uLCBwYWdlLCByZXY7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAkcGFnZSA9ICQodGhpcykucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgIHBhZ2UgPSAkcGFnZS5kYXRhKCdkYXRhJyk7XG4gICAgICByZXYgPSBwYWdlLmpvdXJuYWwubGVuZ3RoIC0gMTtcbiAgICAgIGFjdGlvbiA9IHBhZ2Uuam91cm5hbFtyZXZdO1xuICAgICAganNvbiA9IEpTT04uc3RyaW5naWZ5KGFjdGlvbiwgbnVsbCwgMik7XG4gICAgICByZXR1cm4gd2lraS5kaWFsb2coXCJSZXZpc2lvbiBcIiArIHJldiArIFwiLCBcIiArIGFjdGlvbi50eXBlICsgXCIgYWN0aW9uXCIsICQoJzxwcmUvPicpLnRleHQoanNvbikpO1xuICAgIH0pLmRlbGVnYXRlKCcuYWN0aW9uJywgJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgdmFyICRhY3Rpb24sICRwYWdlLCBuYW1lLCByZXYsIHNsdWc7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAkYWN0aW9uID0gJChlLnRhcmdldCk7XG4gICAgICBpZiAoJGFjdGlvbi5pcygnLmZvcmsnKSAmJiAoKG5hbWUgPSAkYWN0aW9uLmRhdGEoJ3NsdWcnKSkgIT0gbnVsbCkpIHtcbiAgICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFskYWN0aW9uLmRhdGEoJ3NpdGUnKV07XG4gICAgICAgIHJldHVybiBmaW5pc2hDbGljayhlLCAobmFtZS5zcGxpdCgnXycpKVswXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkcGFnZSA9ICQodGhpcykucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgICAgc2x1ZyA9IHdpa2kuYXNTbHVnKCRwYWdlLmRhdGEoJ2RhdGEnKS50aXRsZSk7XG4gICAgICAgIHJldiA9ICQodGhpcykucGFyZW50KCkuY2hpbGRyZW4oKS5ub3QoJy5zZXBhcmF0b3InKS5pbmRleCgkYWN0aW9uKTtcbiAgICAgICAgaWYgKHJldiA8IDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgJHBhZ2UubmV4dEFsbCgpLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHdpa2kuY3JlYXRlUGFnZShcIlwiICsgc2x1ZyArIFwiX3JldlwiICsgcmV2LCAkcGFnZS5kYXRhKCdzaXRlJykpLmFwcGVuZFRvKCQoJy5tYWluJykpLmVhY2gocmVmcmVzaCk7XG4gICAgICAgIHJldHVybiBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKTtcbiAgICAgIH1cbiAgICB9KS5kZWxlZ2F0ZSgnLmZvcmstcGFnZScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBpdGVtLCBwYWdlRWxlbWVudCwgcmVtb3RlU2l0ZTtcbiAgICAgIHBhZ2VFbGVtZW50ID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2UnKTtcbiAgICAgIGlmIChwYWdlRWxlbWVudC5oYXNDbGFzcygnbG9jYWwnKSkge1xuICAgICAgICBpZiAoIXdpa2kudXNlTG9jYWxTdG9yYWdlKCkpIHtcbiAgICAgICAgICBpdGVtID0gcGFnZUVsZW1lbnQuZGF0YSgnZGF0YScpO1xuICAgICAgICAgIHBhZ2VFbGVtZW50LnJlbW92ZUNsYXNzKCdsb2NhbCcpO1xuICAgICAgICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQocGFnZUVsZW1lbnQsIHtcbiAgICAgICAgICAgIHR5cGU6ICdmb3JrJyxcbiAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKChyZW1vdGVTaXRlID0gcGFnZUVsZW1lbnQuZGF0YSgnc2l0ZScpKSAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIHBhZ2VIYW5kbGVyLnB1dChwYWdlRWxlbWVudCwge1xuICAgICAgICAgICAgdHlwZTogJ2ZvcmsnLFxuICAgICAgICAgICAgc2l0ZTogcmVtb3RlU2l0ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkuZGVsZWdhdGUoJy5hY3Rpb24nLCAnaG92ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpZDtcbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJyk7XG4gICAgICAkKFwiW2RhdGEtaWQ9XCIgKyBpZCArIFwiXVwiKS50b2dnbGVDbGFzcygndGFyZ2V0Jyk7XG4gICAgICByZXR1cm4gJCgnLm1haW4nKS50cmlnZ2VyKCdyZXYnKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLml0ZW0nLCAnaG92ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBpZDtcbiAgICAgIGlkID0gJCh0aGlzKS5hdHRyKCdkYXRhLWlkJyk7XG4gICAgICByZXR1cm4gJChcIi5hY3Rpb25bZGF0YS1pZD1cIiArIGlkICsgXCJdXCIpLnRvZ2dsZUNsYXNzKCd0YXJnZXQnKTtcbiAgICB9KS5kZWxlZ2F0ZSgnYnV0dG9uLmNyZWF0ZScsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiBnZXRUZW1wbGF0ZSgkKGUudGFyZ2V0KS5kYXRhKCdzbHVnJyksIGZ1bmN0aW9uKHN0b3J5KSB7XG4gICAgICAgIHZhciAkcGFnZSwgcGFnZSwgcGFnZU9iamVjdDtcbiAgICAgICAgJHBhZ2UgPSAkKGUudGFyZ2V0KS5wYXJlbnRzKCcucGFnZTpmaXJzdCcpO1xuICAgICAgICAkcGFnZS5yZW1vdmVDbGFzcygnZ2hvc3QnKTtcbiAgICAgICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKTtcbiAgICAgICAgcGFnZS5zdG9yeSA9IHN0b3J5IHx8IFtdO1xuICAgICAgICBwYWdlT2JqZWN0ID0gbmV3UGFnZShwYWdlLCBudWxsKTtcbiAgICAgICAgcGFnZSA9IHBhZ2VPYmplY3QuZ2V0UmF3UGFnZSgpO1xuICAgICAgICBwYWdlSGFuZGxlci5wdXQoJHBhZ2UsIHtcbiAgICAgICAgICB0eXBlOiAnY3JlYXRlJyxcbiAgICAgICAgICBpZDogcGFnZS5pZCxcbiAgICAgICAgICBpdGVtOiB7XG4gICAgICAgICAgICB0aXRsZTogcGFnZS50aXRsZSxcbiAgICAgICAgICAgIHN0b3J5OiBwYWdlLnN0b3J5XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHdpa2kuYnVpbGRQYWdlKHBhZ2VPYmplY3QsICRwYWdlLmVtcHR5KCkpO1xuICAgICAgfSk7XG4gICAgfSkuZGVsZWdhdGUoJy5naG9zdCcsICdyZXYnLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGl0ZW0sICRwYWdlLCBwb3NpdGlvbjtcbiAgICAgIHdpa2kubG9nKCdyZXYnLCBlKTtcbiAgICAgICRwYWdlID0gJChlLnRhcmdldCkucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICAgICRpdGVtID0gJHBhZ2UuZmluZCgnLnRhcmdldCcpO1xuICAgICAgcG9zaXRpb24gPSAkaXRlbS5vZmZzZXQoKS50b3AgKyAkcGFnZS5zY3JvbGxUb3AoKSAtICRwYWdlLmhlaWdodCgpIC8gMjtcbiAgICAgIHdpa2kubG9nKCdzY3JvbGwnLCAkcGFnZSwgJGl0ZW0sIHBvc2l0aW9uKTtcbiAgICAgIHJldHVybiAkcGFnZS5zdG9wKCkuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogcG9zdGlvblxuICAgICAgfSwgJ3Nsb3cnKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLnNjb3JlJywgJ2hvdmVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgcmV0dXJuICQoJy5tYWluJykudHJpZ2dlcigndGh1bWInLCAkKGUudGFyZ2V0KS5kYXRhKCd0aHVtYicpKTtcbiAgICB9KTtcbiAgICAkKFwiLnByb3ZpZGVyIGlucHV0XCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgJChcImZvb3RlciBpbnB1dDpmaXJzdFwiKS52YWwoJCh0aGlzKS5hdHRyKCdkYXRhLXByb3ZpZGVyJykpO1xuICAgICAgcmV0dXJuICQoXCJmb290ZXIgZm9ybVwiKS5zdWJtaXQoKTtcbiAgICB9KTtcbiAgICAkKCdib2R5Jykub24oJ25ldy1uZWlnaGJvci1kb25lJywgZnVuY3Rpb24oZSwgbmVpZ2hib3IpIHtcbiAgICAgIHJldHVybiAkKCcucGFnZScpLmVhY2goZnVuY3Rpb24oaW5kZXgsIGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHdpa2kuZW1pdFR3aW5zKCQoZWxlbWVudCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICQoZnVuY3Rpb24oKSB7XG4gICAgICBzdGF0ZS5maXJzdCgpO1xuICAgICAgJCgnLnBhZ2UnKS5lYWNoKHJlZnJlc2gpO1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIH0pO1xuICB9KTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGNyZWF0ZVN5bm9wc2lzLCB3aWtpLFxuICAgIF9fc2xpY2UgPSBbXS5zbGljZTtcblxuICBjcmVhdGVTeW5vcHNpcyA9IHJlcXVpcmUoJy4vc3lub3BzaXMnKTtcblxuICB3aWtpID0ge1xuICAgIGNyZWF0ZVN5bm9wc2lzOiBjcmVhdGVTeW5vcHNpc1xuICB9O1xuXG4gIHdpa2kucGVyc29uYSA9IHJlcXVpcmUoJy4vcGVyc29uYScpO1xuXG4gIHdpa2kubG9nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoaW5ncztcbiAgICB0aGluZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIGlmICgodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgY29uc29sZSAhPT0gbnVsbCA/IGNvbnNvbGUubG9nIDogdm9pZCAwKSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgdGhpbmdzKTtcbiAgICB9XG4gIH07XG5cbiAgd2lraS5hc1NsdWcgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWUucmVwbGFjZSgvXFxzL2csICctJykucmVwbGFjZSgvW15BLVphLXowLTktXS9nLCAnJykudG9Mb3dlckNhc2UoKTtcbiAgfTtcblxuICB3aWtpLnVzZUxvY2FsU3RvcmFnZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAkKFwiLmxvZ2luXCIpLmxlbmd0aCA+IDA7XG4gIH07XG5cbiAgd2lraS5yZXNvbHV0aW9uQ29udGV4dCA9IFtdO1xuXG4gIHdpa2kucmVzb2x2ZUZyb20gPSBmdW5jdGlvbihhZGRpdGlvbiwgY2FsbGJhY2spIHtcbiAgICB3aWtpLnJlc29sdXRpb25Db250ZXh0LnB1c2goYWRkaXRpb24pO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgd2lraS5yZXNvbHV0aW9uQ29udGV4dC5wb3AoKTtcbiAgICB9XG4gIH07XG5cbiAgd2lraS5nZXREYXRhID0gZnVuY3Rpb24odmlzKSB7XG4gICAgdmFyIGlkeCwgd2hvO1xuICAgIGlmICh2aXMpIHtcbiAgICAgIGlkeCA9ICQoJy5pdGVtJykuaW5kZXgodmlzKTtcbiAgICAgIHdobyA9ICQoXCIuaXRlbTpsdChcIiArIGlkeCArIFwiKVwiKS5maWx0ZXIoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLmxhc3QoKTtcbiAgICAgIGlmICh3aG8gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gd2hvLmRhdGEoJ2l0ZW0nKS5kYXRhO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aG8gPSAkKCcuY2hhcnQsLmRhdGEsLmNhbGN1bGF0b3InKS5sYXN0KCk7XG4gICAgICBpZiAod2hvICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHdoby5kYXRhKCdpdGVtJykuZGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgd2lraS5nZXREYXRhTm9kZXMgPSBmdW5jdGlvbih2aXMpIHtcbiAgICB2YXIgaWR4LCB3aG87XG4gICAgaWYgKHZpcykge1xuICAgICAgaWR4ID0gJCgnLml0ZW0nKS5pbmRleCh2aXMpO1xuICAgICAgd2hvID0gJChcIi5pdGVtOmx0KFwiICsgaWR4ICsgXCIpXCIpLmZpbHRlcignLmNoYXJ0LC5kYXRhLC5jYWxjdWxhdG9yJykudG9BcnJheSgpLnJldmVyc2UoKTtcbiAgICAgIHJldHVybiAkKHdobyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdobyA9ICQoJy5jaGFydCwuZGF0YSwuY2FsY3VsYXRvcicpLnRvQXJyYXkoKS5yZXZlcnNlKCk7XG4gICAgICByZXR1cm4gJCh3aG8pO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLmNyZWF0ZVBhZ2UgPSBmdW5jdGlvbihuYW1lLCBsb2MpIHtcbiAgICB2YXIgJHBhZ2UsIHNpdGU7XG4gICAgaWYgKGxvYyAmJiBsb2MgIT09ICd2aWV3Jykge1xuICAgICAgc2l0ZSA9IGxvYztcbiAgICB9XG4gICAgJHBhZ2UgPSAkKFwiPGRpdiBjbGFzcz1cXFwicGFnZVxcXCIgaWQ9XFxcIlwiICsgbmFtZSArIFwiXFxcIj5cXG4gIDxkaXYgY2xhc3M9XFxcInR3aW5zXFxcIj4gPHA+IDwvcD4gPC9kaXY+XFxuICA8ZGl2IGNsYXNzPVxcXCJoZWFkZXJcXFwiPlxcbiAgICA8aDE+IDxpbWcgY2xhc3M9XFxcImZhdmljb25cXFwiIHNyYz1cXFwiXCIgKyAoc2l0ZSA/IFwiLy9cIiArIHNpdGUgOiBcIlwiKSArIFwiL2Zhdmljb24ucG5nXFxcIiBoZWlnaHQ9XFxcIjMycHhcXFwiPiBcIiArIG5hbWUgKyBcIiA8L2gxPlxcbiAgPC9kaXY+XFxuPC9kaXY+XCIpO1xuICAgIGlmIChzaXRlKSB7XG4gICAgICAkcGFnZS5kYXRhKCdzaXRlJywgc2l0ZSk7XG4gICAgfVxuICAgIHJldHVybiAkcGFnZTtcbiAgfTtcblxuICB3aWtpLmdldEl0ZW0gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKCQoZWxlbWVudCkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuICQoZWxlbWVudCkuZGF0YShcIml0ZW1cIikgfHwgJChlbGVtZW50KS5kYXRhKCdzdGF0aWNJdGVtJyk7XG4gICAgfVxuICB9O1xuXG4gIHdpa2kucmVzb2x2ZUxpbmtzID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgdmFyIHJlbmRlckludGVybmFsTGluaztcbiAgICByZW5kZXJJbnRlcm5hbExpbmsgPSBmdW5jdGlvbihtYXRjaCwgbmFtZSkge1xuICAgICAgdmFyIHNsdWc7XG4gICAgICBzbHVnID0gd2lraS5hc1NsdWcobmFtZSk7XG4gICAgICByZXR1cm4gXCI8YSBjbGFzcz1cXFwiaW50ZXJuYWxcXFwiIGhyZWY9XFxcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIiBkYXRhLXBhZ2UtbmFtZT1cXFwiXCIgKyBzbHVnICsgXCJcXFwiIHRpdGxlPVxcXCJcIiArICh3aWtpLnJlc29sdXRpb25Db250ZXh0LmpvaW4oJyA9PiAnKSkgKyBcIlxcXCI+XCIgKyBuYW1lICsgXCI8L2E+XCI7XG4gICAgfTtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1xcW1xcWyhbXlxcXV0rKVxcXVxcXS9naSwgcmVuZGVySW50ZXJuYWxMaW5rKS5yZXBsYWNlKC9cXFsoaHR0cC4qPykgKC4qPylcXF0vZ2ksIFwiPGEgY2xhc3M9XFxcImV4dGVybmFsXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCIgaHJlZj1cXFwiJDFcXFwiIHRpdGxlPVxcXCIkMVxcXCIgcmVsPVxcXCJub2ZvbGxvd1xcXCI+JDIgPGltZyBzcmM9XFxcIi9pbWFnZXMvZXh0ZXJuYWwtbGluay1sdHItaWNvbi5wbmdcXFwiPjwvYT5cIik7XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3aWtpO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBmaW5kU2Nyb2xsQ29udGFpbmVyLCBzY3JvbGxUbztcblxuICBtb2R1bGUuZXhwb3J0cyA9IGFjdGl2ZSA9IHt9O1xuXG4gIGFjdGl2ZS5zY3JvbGxDb250YWluZXIgPSB2b2lkIDA7XG5cbiAgZmluZFNjcm9sbENvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzY3JvbGxlZDtcbiAgICBzY3JvbGxlZCA9ICQoXCJib2R5LCBodG1sXCIpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkKHRoaXMpLnNjcm9sbExlZnQoKSA+IDA7XG4gICAgfSk7XG4gICAgaWYgKHNjcm9sbGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBzY3JvbGxlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICQoXCJib2R5LCBodG1sXCIpLnNjcm9sbExlZnQoMTIpLmZpbHRlcihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICQodGhpcykuc2Nyb2xsTGVmdCgpID4gMDtcbiAgICAgIH0pLnNjcm9sbFRvcCgwKTtcbiAgICB9XG4gIH07XG5cbiAgc2Nyb2xsVG8gPSBmdW5jdGlvbihlbCkge1xuICAgIHZhciBib2R5V2lkdGgsIGNvbnRlbnRXaWR0aCwgbWF4WCwgbWluWCwgdGFyZ2V0LCB3aWR0aDtcbiAgICBpZiAoYWN0aXZlLnNjcm9sbENvbnRhaW5lciA9PSBudWxsKSB7XG4gICAgICBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyID0gZmluZFNjcm9sbENvbnRhaW5lcigpO1xuICAgIH1cbiAgICBib2R5V2lkdGggPSAkKFwiYm9keVwiKS53aWR0aCgpO1xuICAgIG1pblggPSBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLnNjcm9sbExlZnQoKTtcbiAgICBtYXhYID0gbWluWCArIGJvZHlXaWR0aDtcbiAgICB0YXJnZXQgPSBlbC5wb3NpdGlvbigpLmxlZnQ7XG4gICAgd2lkdGggPSBlbC5vdXRlcldpZHRoKHRydWUpO1xuICAgIGNvbnRlbnRXaWR0aCA9ICQoXCIucGFnZVwiKS5vdXRlcldpZHRoKHRydWUpICogJChcIi5wYWdlXCIpLnNpemUoKTtcbiAgICBpZiAodGFyZ2V0IDwgbWluWCkge1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbExlZnQ6IHRhcmdldFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0YXJnZXQgKyB3aWR0aCA+IG1heFgpIHtcbiAgICAgIHJldHVybiBhY3RpdmUuc2Nyb2xsQ29udGFpbmVyLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxMZWZ0OiB0YXJnZXQgLSAoYm9keVdpZHRoIC0gd2lkdGgpXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG1heFggPiAkKFwiLnBhZ2VzXCIpLm91dGVyV2lkdGgoKSkge1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zY3JvbGxDb250YWluZXIuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbExlZnQ6IE1hdGgubWluKHRhcmdldCwgY29udGVudFdpZHRoIC0gYm9keVdpZHRoKVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGFjdGl2ZS5zZXQgPSBmdW5jdGlvbihlbCkge1xuICAgIGVsID0gJChlbCk7XG4gICAgJChcIi5hY3RpdmVcIikucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgcmV0dXJuIHNjcm9sbFRvKGVsLmFkZENsYXNzKFwiYWN0aXZlXCIpKTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwYWdlKSB7XG4gICAgdmFyIHAxLCBwMiwgc3lub3BzaXM7XG4gICAgc3lub3BzaXMgPSBwYWdlLnN5bm9wc2lzO1xuICAgIGlmICgocGFnZSAhPSBudWxsKSAmJiAocGFnZS5zdG9yeSAhPSBudWxsKSkge1xuICAgICAgcDEgPSBwYWdlLnN0b3J5WzBdO1xuICAgICAgcDIgPSBwYWdlLnN0b3J5WzFdO1xuICAgICAgaWYgKHAxICYmIHAxLnR5cGUgPT09ICdwYXJhZ3JhcGgnKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAxLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHAyICYmIHAyLnR5cGUgPT09ICdwYXJhZ3JhcGgnKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAyLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHAxICYmIChwMS50ZXh0ICE9IG51bGwpKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAxLnRleHQpO1xuICAgICAgfVxuICAgICAgaWYgKHAyICYmIChwMi50ZXh0ICE9IG51bGwpKSB7XG4gICAgICAgIHN5bm9wc2lzIHx8IChzeW5vcHNpcyA9IHAyLnRleHQpO1xuICAgICAgfVxuICAgICAgc3lub3BzaXMgfHwgKHN5bm9wc2lzID0gKHBhZ2Uuc3RvcnkgIT0gbnVsbCkgJiYgKFwiQSBwYWdlIHdpdGggXCIgKyBwYWdlLnN0b3J5Lmxlbmd0aCArIFwiIGl0ZW1zLlwiKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN5bm9wc2lzID0gJ0EgcGFnZSB3aXRoIG5vIHN0b3J5Lic7XG4gICAgfVxuICAgIHJldHVybiBzeW5vcHNpcztcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvd25lcikge1xuICAgIHZhciBmYWlsdXJlRGxnO1xuICAgICQoXCIjdXNlci1lbWFpbFwiKS5oaWRlKCk7XG4gICAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5oaWRlKCk7XG4gICAgJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuaGlkZSgpO1xuICAgIGZhaWx1cmVEbGcgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICByZXR1cm4gJChcIjxkaXY+PC9kaXY+XCIpLmRpYWxvZyh7XG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKGV2ZW50LCB1aSkge1xuICAgICAgICAgIHJldHVybiAkKFwiLnVpLWRpYWxvZy10aXRsZWJhci1jbG9zZVwiKS5oaWRlKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGJ1dHRvbnM6IHtcbiAgICAgICAgICBcIk9rXCI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzKS5kaWFsb2coXCJjbG9zZVwiKTtcbiAgICAgICAgICAgIHJldHVybiBuYXZpZ2F0b3IuaWQubG9nb3V0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oZXZlbnQsIHVpKSB7XG4gICAgICAgICAgcmV0dXJuICQodGhpcykucmVtb3ZlKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlc2l6YWJsZTogZmFsc2UsXG4gICAgICAgIHRpdGxlOiBcIkxvZ2luIEZhaWx1cmVcIixcbiAgICAgICAgbW9kYWw6IHRydWVcbiAgICAgIH0pLmh0bWwobWVzc2FnZSk7XG4gICAgfTtcbiAgICBuYXZpZ2F0b3IuaWQud2F0Y2goe1xuICAgICAgbG9nZ2VkSW5Vc2VyOiBvd25lcixcbiAgICAgIG9ubG9naW46IGZ1bmN0aW9uKGFzc2VydGlvbikge1xuICAgICAgICByZXR1cm4gJC5wb3N0KFwiL3BlcnNvbmFfbG9naW5cIiwge1xuICAgICAgICAgIGFzc2VydGlvbjogYXNzZXJ0aW9uXG4gICAgICAgIH0sIGZ1bmN0aW9uKHZlcmlmaWVkKSB7XG4gICAgICAgICAgdmFyIGZhaWx1cmVNc2c7XG4gICAgICAgICAgdmVyaWZpZWQgPSBKU09OLnBhcnNlKHZlcmlmaWVkKTtcbiAgICAgICAgICBpZiAoXCJva2F5XCIgPT09IHZlcmlmaWVkLnN0YXR1cykge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbiA9IFwiL1wiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXCJ3cm9uZy1hZGRyZXNzXCIgPT09IHZlcmlmaWVkLnN0YXR1cykge1xuICAgICAgICAgICAgcmV0dXJuIGZhaWx1cmVEbGcoXCI8cD5TaWduIGluIGlzIGN1cnJlbnRseSBvbmx5IGF2YWlsYWJsZSBmb3IgdGhlIHNpdGUgb3duZXIuPC9wPlwiKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFwiZmFpbHVyZVwiID09PSB2ZXJpZmllZC5zdGF0dXMpIHtcbiAgICAgICAgICAgIGlmICgvZG9tYWluIG1pc21hdGNoLy50ZXN0KHZlcmlmaWVkLnJlYXNvbikpIHtcbiAgICAgICAgICAgICAgZmFpbHVyZU1zZyA9IFwiPHA+SXQgbG9va3MgYXMgaWYgeW91IGFyZSBhY2Nlc3NpbmcgdGhlIHNpdGUgdXNpbmcgYW4gYWx0ZXJuYXRpdmUgYWRkcmVzcy48L3A+XCIgKyBcIjxwPlBsZWFzZSBjaGVjayB0aGF0IHlvdSBhcmUgdXNpbmcgdGhlIGNvcnJlY3QgYWRkcmVzcyB0byBhY2Nlc3MgdGhpcyBzaXRlLjwvcD5cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZhaWx1cmVNc2cgPSBcIjxwPlVuYWJsZSB0byBsb2cgeW91IGluLjwvcD5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWlsdXJlRGxnKGZhaWx1cmVNc2cpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmF2aWdhdG9yLmlkLmxvZ291dCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgb25sb2dvdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gJC5wb3N0KFwiL3BlcnNvbmFfbG9nb3V0XCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24gPSBcIi9cIjtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgICAgb25yZWFkeTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChvd25lcikge1xuICAgICAgICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuaGlkZSgpO1xuICAgICAgICAgIHJldHVybiAkKFwiI3BlcnNvbmEtbG9nb3V0LWJ0blwiKS5zaG93KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJChcIiNwZXJzb25hLWxvZ2luLWJ0blwiKS5zaG93KCk7XG4gICAgICAgICAgcmV0dXJuICQoXCIjcGVyc29uYS1sb2dvdXQtYnRuXCIpLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgICQoXCIjcGVyc29uYS1sb2dpbi1idG5cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuIG5hdmlnYXRvci5pZC5yZXF1ZXN0KHt9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gJChcIiNwZXJzb25hLWxvZ291dC1idG5cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuIG5hdmlnYXRvci5pZC5sb2dvdXQoKTtcbiAgICB9KTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGdldFNjcmlwdCwgcGx1Z2luLCBzY3JpcHRzLCB1dGlsLCB3aWtpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwbHVnaW4gPSB7fTtcblxuICBzY3JpcHRzID0ge307XG5cbiAgZ2V0U2NyaXB0ID0gd2lraS5nZXRTY3JpcHQgPSBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gICAgaWYgKHNjcmlwdHNbdXJsXSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICQuZ2V0U2NyaXB0KHVybCkuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2NyaXB0c1t1cmxdID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICB9KS5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBwbHVnaW4uZ2V0ID0gd2lraS5nZXRQbHVnaW4gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICh3aW5kb3cucGx1Z2luc1tuYW1lXSkge1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKHdpbmRvdy5wbHVnaW5zW25hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIGdldFNjcmlwdChcIi9wbHVnaW5zL1wiICsgbmFtZSArIFwiL1wiICsgbmFtZSArIFwiLmpzXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHdpbmRvdy5wbHVnaW5zW25hbWVdKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZ2V0U2NyaXB0KFwiL3BsdWdpbnMvXCIgKyBuYW1lICsgXCIuanNcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayh3aW5kb3cucGx1Z2luc1tuYW1lXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBwbHVnaW5bXCJkb1wiXSA9IHdpa2kuZG9QbHVnaW4gPSBmdW5jdGlvbihkaXYsIGl0ZW0sIGRvbmUpIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGRvbmUgPT0gbnVsbCkge1xuICAgICAgZG9uZSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICAgIGVycm9yID0gZnVuY3Rpb24oZXgpIHtcbiAgICAgIHZhciBlcnJvckVsZW1lbnQ7XG4gICAgICBlcnJvckVsZW1lbnQgPSAkKFwiPGRpdiAvPlwiKS5hZGRDbGFzcygnZXJyb3InKTtcbiAgICAgIGVycm9yRWxlbWVudC50ZXh0KGV4LnRvU3RyaW5nKCkpO1xuICAgICAgcmV0dXJuIGRpdi5hcHBlbmQoZXJyb3JFbGVtZW50KTtcbiAgICB9O1xuICAgIGRpdi5kYXRhKCdwYWdlRWxlbWVudCcsIGRpdi5wYXJlbnRzKFwiLnBhZ2VcIikpO1xuICAgIGRpdi5kYXRhKCdpdGVtJywgaXRlbSk7XG4gICAgcmV0dXJuIHBsdWdpbi5nZXQoaXRlbS50eXBlLCBmdW5jdGlvbihzY3JpcHQpIHtcbiAgICAgIHZhciBlcnI7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2NyaXB0ID09IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBmaW5kIHBsdWdpbiBmb3IgJ1wiICsgaXRlbS50eXBlICsgXCInXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY3JpcHQuZW1pdC5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgcmV0dXJuIHNjcmlwdC5lbWl0KGRpdiwgaXRlbSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzY3JpcHQuYmluZChkaXYsIGl0ZW0pO1xuICAgICAgICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY3JpcHQuZW1pdChkaXYsIGl0ZW0pO1xuICAgICAgICAgIHNjcmlwdC5iaW5kKGRpdiwgaXRlbSk7XG4gICAgICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGVyciA9IF9lcnJvcjtcbiAgICAgICAgd2lraS5sb2coJ3BsdWdpbiBlcnJvcicsIGVycik7XG4gICAgICAgIGVycm9yKGVycik7XG4gICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgd2lraS5yZWdpc3RlclBsdWdpbiA9IGZ1bmN0aW9uKHBsdWdpbk5hbWUsIHBsdWdpbkZuKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5wbHVnaW5zW3BsdWdpbk5hbWVdID0gcGx1Z2luRm4oJCk7XG4gIH07XG5cbiAgd2luZG93LnBsdWdpbnMgPSB7XG4gICAgcmVmZXJlbmNlOiByZXF1aXJlKCcuL3JlZmVyZW5jZScpLFxuICAgIGZhY3Rvcnk6IHJlcXVpcmUoJy4vZmFjdG9yeScpLFxuICAgIHBhcmFncmFwaDoge1xuICAgICAgZW1pdDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHZhciB0ZXh0LCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIF9yZWYgPSBpdGVtLnRleHQuc3BsaXQoL1xcblxcbisvKTtcbiAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgdGV4dCA9IF9yZWZbX2ldO1xuICAgICAgICAgIGlmICh0ZXh0Lm1hdGNoKC9cXFMvKSkge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaChkaXYuYXBwZW5kKFwiPHA+XCIgKyAod2lraS5yZXNvbHZlTGlua3ModGV4dCkpICsgXCI8L3A+XCIpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9LFxuICAgICAgYmluZDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHJldHVybiBkaXYuZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHdpa2kudGV4dEVkaXRvcihkaXYsIGl0ZW0sIG51bGwsIHRydWUpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGltYWdlOiB7XG4gICAgICBlbWl0OiBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICAgICAgaXRlbS50ZXh0IHx8IChpdGVtLnRleHQgPSBpdGVtLmNhcHRpb24pO1xuICAgICAgICByZXR1cm4gZGl2LmFwcGVuZChcIjxpbWcgY2xhc3M9dGh1bWJuYWlsIHNyYz1cXFwiXCIgKyBpdGVtLnVybCArIFwiXFxcIj4gPHA+XCIgKyAod2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0KSkgKyBcIjwvcD5cIik7XG4gICAgICB9LFxuICAgICAgYmluZDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIGRpdi5kYmxjbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKGRpdiwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGl2LmZpbmQoJ2ltZycpLmRibGNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB3aWtpLmRpYWxvZyhpdGVtLnRleHQsIHRoaXMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGZ1dHVyZToge1xuICAgICAgZW1pdDogZnVuY3Rpb24oZGl2LCBpdGVtKSB7XG4gICAgICAgIHZhciBpbmZvLCBfaSwgX2xlbiwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICAgIGRpdi5hcHBlbmQoXCJcIiArIGl0ZW0udGV4dCArIFwiPGJyPjxicj48YnV0dG9uIGNsYXNzPVxcXCJjcmVhdGVcXFwiPmNyZWF0ZTwvYnV0dG9uPiBuZXcgYmxhbmsgcGFnZVwiKTtcbiAgICAgICAgaWYgKCgoaW5mbyA9IHdpa2kubmVpZ2hib3Job29kW2xvY2F0aW9uLmhvc3RdKSAhPSBudWxsKSAmJiAoaW5mby5zaXRlbWFwICE9IG51bGwpKSB7XG4gICAgICAgICAgX3JlZiA9IGluZm8uc2l0ZW1hcDtcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgICAgaXRlbSA9IF9yZWZbX2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0uc2x1Zy5tYXRjaCgvLXRlbXBsYXRlJC8pKSB7XG4gICAgICAgICAgICAgIF9yZXN1bHRzLnB1c2goZGl2LmFwcGVuZChcIjxicj48YnV0dG9uIGNsYXNzPVxcXCJjcmVhdGVcXFwiIGRhdGEtc2x1Zz1cIiArIGl0ZW0uc2x1ZyArIFwiPmNyZWF0ZTwvYnV0dG9uPiBmcm9tIFwiICsgKHdpa2kucmVzb2x2ZUxpbmtzKFwiW1tcIiArIGl0ZW0udGl0bGUgKyBcIl1dXCIpKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBiaW5kOiBmdW5jdGlvbihkaXYsIGl0ZW0pIHt9XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgdXRpbCwgd2lraTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB3aWtpLnV0aWwgPSB1dGlsID0ge307XG5cbiAgdXRpbC5zeW1ib2xzID0ge1xuICAgIGNyZWF0ZTogJ+KYvCcsXG4gICAgYWRkOiAnKycsXG4gICAgZWRpdDogJ+KcjicsXG4gICAgZm9yazogJ+KakScsXG4gICAgbW92ZTogJ+KGlScsXG4gICAgcmVtb3ZlOiAn4pyVJ1xuICB9O1xuXG4gIHV0aWwucmFuZG9tQnl0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xuICB9O1xuXG4gIHV0aWwucmFuZG9tQnl0ZXMgPSBmdW5jdGlvbihuKSB7XG4gICAgcmV0dXJuICgoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgX2ksIF9yZXN1bHRzO1xuICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAxOyAxIDw9IG4gPyBfaSA8PSBuIDogX2kgPj0gbjsgMSA8PSBuID8gX2krKyA6IF9pLS0pIHtcbiAgICAgICAgX3Jlc3VsdHMucHVzaCh1dGlsLnJhbmRvbUJ5dGUoKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgfSkoKSkuam9pbignJyk7XG4gIH07XG5cbiAgdXRpbC5mb3JtYXRUaW1lID0gZnVuY3Rpb24odGltZSkge1xuICAgIHZhciBhbSwgZCwgaCwgbWksIG1vO1xuICAgIGQgPSBuZXcgRGF0ZSgodGltZSA+IDEwMDAwMDAwMDAwID8gdGltZSA6IHRpbWUgKiAxMDAwKSk7XG4gICAgbW8gPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ11bZC5nZXRNb250aCgpXTtcbiAgICBoID0gZC5nZXRIb3VycygpO1xuICAgIGFtID0gaCA8IDEyID8gJ0FNJyA6ICdQTSc7XG4gICAgaCA9IGggPT09IDAgPyAxMiA6IGggPiAxMiA/IGggLSAxMiA6IGg7XG4gICAgbWkgPSAoZC5nZXRNaW51dGVzKCkgPCAxMCA/IFwiMFwiIDogXCJcIikgKyBkLmdldE1pbnV0ZXMoKTtcbiAgICByZXR1cm4gXCJcIiArIGggKyBcIjpcIiArIG1pICsgXCIgXCIgKyBhbSArIFwiPGJyPlwiICsgKGQuZ2V0RGF0ZSgpKSArIFwiIFwiICsgbW8gKyBcIiBcIiArIChkLmdldEZ1bGxZZWFyKCkpO1xuICB9O1xuXG4gIHV0aWwuZm9ybWF0RGF0ZSA9IGZ1bmN0aW9uKG1zU2luY2VFcG9jaCkge1xuICAgIHZhciBhbSwgZCwgZGF5LCBoLCBtaSwgbW8sIHNlYywgd2ssIHlyO1xuICAgIGQgPSBuZXcgRGF0ZShtc1NpbmNlRXBvY2gpO1xuICAgIHdrID0gWydTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXVtkLmdldERheSgpXTtcbiAgICBtbyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXVtkLmdldE1vbnRoKCldO1xuICAgIGRheSA9IGQuZ2V0RGF0ZSgpO1xuICAgIHlyID0gZC5nZXRGdWxsWWVhcigpO1xuICAgIGggPSBkLmdldEhvdXJzKCk7XG4gICAgYW0gPSBoIDwgMTIgPyAnQU0nIDogJ1BNJztcbiAgICBoID0gaCA9PT0gMCA/IDEyIDogaCA+IDEyID8gaCAtIDEyIDogaDtcbiAgICBtaSA9IChkLmdldE1pbnV0ZXMoKSA8IDEwID8gXCIwXCIgOiBcIlwiKSArIGQuZ2V0TWludXRlcygpO1xuICAgIHNlYyA9IChkLmdldFNlY29uZHMoKSA8IDEwID8gXCIwXCIgOiBcIlwiKSArIGQuZ2V0U2Vjb25kcygpO1xuICAgIHJldHVybiBcIlwiICsgd2sgKyBcIiBcIiArIG1vICsgXCIgXCIgKyBkYXkgKyBcIiwgXCIgKyB5ciArIFwiPGJyPlwiICsgaCArIFwiOlwiICsgbWkgKyBcIjpcIiArIHNlYyArIFwiIFwiICsgYW07XG4gIH07XG5cbiAgdXRpbC5mb3JtYXRFbGFwc2VkVGltZSA9IGZ1bmN0aW9uKG1zU2luY2VFcG9jaCkge1xuICAgIHZhciBkYXlzLCBocnMsIG1pbnMsIG1vbnRocywgbXNlY3MsIHNlY3MsIHdlZWtzLCB5ZWFycztcbiAgICBtc2VjcyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbXNTaW5jZUVwb2NoO1xuICAgIGlmICgoc2VjcyA9IG1zZWNzIC8gMTAwMCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKG1zZWNzKSkgKyBcIiBtaWxsaXNlY29uZHMgYWdvXCI7XG4gICAgfVxuICAgIGlmICgobWlucyA9IHNlY3MgLyA2MCkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHNlY3MpKSArIFwiIHNlY29uZHMgYWdvXCI7XG4gICAgfVxuICAgIGlmICgoaHJzID0gbWlucyAvIDYwKSA8IDIpIHtcbiAgICAgIHJldHVybiBcIlwiICsgKE1hdGguZmxvb3IobWlucykpICsgXCIgbWludXRlcyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKChkYXlzID0gaHJzIC8gMjQpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihocnMpKSArIFwiIGhvdXJzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKHdlZWtzID0gZGF5cyAvIDcpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihkYXlzKSkgKyBcIiBkYXlzIGFnb1wiO1xuICAgIH1cbiAgICBpZiAoKG1vbnRocyA9IGRheXMgLyAzMSkgPCAyKSB7XG4gICAgICByZXR1cm4gXCJcIiArIChNYXRoLmZsb29yKHdlZWtzKSkgKyBcIiB3ZWVrcyBhZ29cIjtcbiAgICB9XG4gICAgaWYgKCh5ZWFycyA9IGRheXMgLyAzNjUpIDwgMikge1xuICAgICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcihtb250aHMpKSArIFwiIG1vbnRocyBhZ29cIjtcbiAgICB9XG4gICAgcmV0dXJuIFwiXCIgKyAoTWF0aC5mbG9vcih5ZWFycykpICsgXCIgeWVhcnMgYWdvXCI7XG4gIH07XG5cbiAgdXRpbC5lbXB0eVBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGU6ICdlbXB0eScsXG4gICAgICBzdG9yeTogW10sXG4gICAgICBqb3VybmFsOiBbXVxuICAgIH07XG4gIH07XG5cbiAgdXRpbC5nZXRTZWxlY3Rpb25Qb3MgPSBmdW5jdGlvbihqUXVlcnlFbGVtZW50KSB7XG4gICAgdmFyIGVsLCBpZVBvcywgc2VsO1xuICAgIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCk7XG4gICAgaWYgKGRvY3VtZW50LnNlbGVjdGlvbikge1xuICAgICAgZWwuZm9jdXMoKTtcbiAgICAgIHNlbCA9IGRvY3VtZW50LnNlbGVjdGlvbi5jcmVhdGVSYW5nZSgpO1xuICAgICAgc2VsLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgLWVsLnZhbHVlLmxlbmd0aCk7XG4gICAgICBpZVBvcyA9IHNlbC50ZXh0Lmxlbmd0aDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiBpZVBvcyxcbiAgICAgICAgZW5kOiBpZVBvc1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnQ6IGVsLnNlbGVjdGlvblN0YXJ0LFxuICAgICAgICBlbmQ6IGVsLnNlbGVjdGlvbkVuZFxuICAgICAgfTtcbiAgICB9XG4gIH07XG5cbiAgdXRpbC5zZXRDYXJldFBvc2l0aW9uID0gZnVuY3Rpb24oalF1ZXJ5RWxlbWVudCwgY2FyZXRQb3MpIHtcbiAgICB2YXIgZWwsIHJhbmdlO1xuICAgIGVsID0galF1ZXJ5RWxlbWVudC5nZXQoMCk7XG4gICAgaWYgKGVsICE9IG51bGwpIHtcbiAgICAgIGlmIChlbC5jcmVhdGVUZXh0UmFuZ2UpIHtcbiAgICAgICAgcmFuZ2UgPSBlbC5jcmVhdGVUZXh0UmFuZ2UoKTtcbiAgICAgICAgcmFuZ2UubW92ZShcImNoYXJhY3RlclwiLCBjYXJldFBvcyk7XG4gICAgICAgIHJhbmdlLnNlbGVjdCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuc2V0U2VsZWN0aW9uUmFuZ2UoY2FyZXRQb3MsIGNhcmV0UG9zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbC5mb2N1cygpO1xuICAgIH1cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFjdGl2ZSwgc3RhdGUsIHdpa2ksXG4gICAgX19pbmRleE9mID0gW10uaW5kZXhPZiB8fCBmdW5jdGlvbihpdGVtKSB7IGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHsgaWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSByZXR1cm4gaTsgfSByZXR1cm4gLTE7IH07XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIGFjdGl2ZSA9IHJlcXVpcmUoJy4vYWN0aXZlJyk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBzdGF0ZSA9IHt9O1xuXG4gIHN0YXRlLnBhZ2VzSW5Eb20gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJC5tYWtlQXJyYXkoJChcIi5wYWdlXCIpLm1hcChmdW5jdGlvbihfLCBlbCkge1xuICAgICAgcmV0dXJuIGVsLmlkO1xuICAgIH0pKTtcbiAgfTtcblxuICBzdGF0ZS51cmxQYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpO1xuICAgIHJldHVybiAoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIF9pLCBfbGVuLCBfcmVmLCBfcmVzdWx0cztcbiAgICAgIF9yZWYgPSAkKGxvY2F0aW9uKS5hdHRyKCdwYXRobmFtZScpLnNwbGl0KCcvJyk7XG4gICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSArPSAyKSB7XG4gICAgICAgIGkgPSBfcmVmW19pXTtcbiAgICAgICAgX3Jlc3VsdHMucHVzaChpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBfcmVzdWx0cztcbiAgICB9KSgpKS5zbGljZSgxKTtcbiAgfTtcblxuICBzdGF0ZS5sb2NzSW5Eb20gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJC5tYWtlQXJyYXkoJChcIi5wYWdlXCIpLm1hcChmdW5jdGlvbihfLCBlbCkge1xuICAgICAgcmV0dXJuICQoZWwpLmRhdGEoJ3NpdGUnKSB8fCAndmlldyc7XG4gICAgfSkpO1xuICB9O1xuXG4gIHN0YXRlLnVybExvY3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaiwgX2ksIF9sZW4sIF9yZWYsIF9yZXN1bHRzO1xuICAgIF9yZWYgPSAkKGxvY2F0aW9uKS5hdHRyKCdwYXRobmFtZScpLnNwbGl0KCcvJykuc2xpY2UoMSk7XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pICs9IDIpIHtcbiAgICAgIGogPSBfcmVmW19pXTtcbiAgICAgIF9yZXN1bHRzLnB1c2goaik7XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxuICBzdGF0ZS5zZXRVcmwgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaWR4LCBsb2NzLCBwYWdlLCBwYWdlcywgdXJsLCBfcmVmO1xuICAgIGRvY3VtZW50LnRpdGxlID0gKF9yZWYgPSAkKCcucGFnZTpsYXN0JykuZGF0YSgnZGF0YScpKSAhPSBudWxsID8gX3JlZi50aXRsZSA6IHZvaWQgMDtcbiAgICBpZiAoaGlzdG9yeSAmJiBoaXN0b3J5LnB1c2hTdGF0ZSkge1xuICAgICAgbG9jcyA9IHN0YXRlLmxvY3NJbkRvbSgpO1xuICAgICAgcGFnZXMgPSBzdGF0ZS5wYWdlc0luRG9tKCk7XG4gICAgICB1cmwgPSAoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKGlkeCA9IF9pID0gMCwgX2xlbiA9IHBhZ2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBpZHggPSArK19pKSB7XG4gICAgICAgICAgcGFnZSA9IHBhZ2VzW2lkeF07XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaChcIi9cIiArICgobG9jcyAhPSBudWxsID8gbG9jc1tpZHhdIDogdm9pZCAwKSB8fCAndmlldycpICsgXCIvXCIgKyBwYWdlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICB9KSgpKS5qb2luKCcnKTtcbiAgICAgIGlmICh1cmwgIT09ICQobG9jYXRpb24pLmF0dHIoJ3BhdGhuYW1lJykpIHtcbiAgICAgICAgcmV0dXJuIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIHVybCk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHN0YXRlLnNob3cgPSBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGlkeCwgbmFtZSwgbmV3TG9jcywgbmV3UGFnZXMsIG9sZCwgb2xkTG9jcywgb2xkUGFnZXMsIHByZXZpb3VzLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBvbGRQYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKTtcbiAgICBuZXdQYWdlcyA9IHN0YXRlLnVybFBhZ2VzKCk7XG4gICAgb2xkTG9jcyA9IHN0YXRlLmxvY3NJbkRvbSgpO1xuICAgIG5ld0xvY3MgPSBzdGF0ZS51cmxMb2NzKCk7XG4gICAgaWYgKCFsb2NhdGlvbi5wYXRobmFtZSB8fCBsb2NhdGlvbi5wYXRobmFtZSA9PT0gJy8nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHByZXZpb3VzID0gJCgnLnBhZ2UnKS5lcSgwKTtcbiAgICBmb3IgKGlkeCA9IF9pID0gMCwgX2xlbiA9IG5ld1BhZ2VzLmxlbmd0aDsgX2kgPCBfbGVuOyBpZHggPSArK19pKSB7XG4gICAgICBuYW1lID0gbmV3UGFnZXNbaWR4XTtcbiAgICAgIGlmIChuYW1lICE9PSBvbGRQYWdlc1tpZHhdKSB7XG4gICAgICAgIG9sZCA9ICQoJy5wYWdlJykuZXEoaWR4KTtcbiAgICAgICAgaWYgKG9sZCkge1xuICAgICAgICAgIG9sZC5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICB3aWtpLmNyZWF0ZVBhZ2UobmFtZSwgbmV3TG9jc1tpZHhdKS5pbnNlcnRBZnRlcihwcmV2aW91cykuZWFjaCh3aWtpLnJlZnJlc2gpO1xuICAgICAgfVxuICAgICAgcHJldmlvdXMgPSAkKCcucGFnZScpLmVxKGlkeCk7XG4gICAgfVxuICAgIHByZXZpb3VzLm5leHRBbGwoKS5yZW1vdmUoKTtcbiAgICBhY3RpdmUuc2V0KCQoJy5wYWdlJykubGFzdCgpKTtcbiAgICByZXR1cm4gZG9jdW1lbnQudGl0bGUgPSAoX3JlZiA9ICQoJy5wYWdlOmxhc3QnKS5kYXRhKCdkYXRhJykpICE9IG51bGwgPyBfcmVmLnRpdGxlIDogdm9pZCAwO1xuICB9O1xuXG4gIHN0YXRlLmZpcnN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZpcnN0VXJsTG9jcywgZmlyc3RVcmxQYWdlcywgaWR4LCBvbGRQYWdlcywgdXJsUGFnZSwgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgIHN0YXRlLnNldFVybCgpO1xuICAgIGZpcnN0VXJsUGFnZXMgPSBzdGF0ZS51cmxQYWdlcygpO1xuICAgIGZpcnN0VXJsTG9jcyA9IHN0YXRlLnVybExvY3MoKTtcbiAgICBvbGRQYWdlcyA9IHN0YXRlLnBhZ2VzSW5Eb20oKTtcbiAgICBfcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoaWR4ID0gX2kgPSAwLCBfbGVuID0gZmlyc3RVcmxQYWdlcy5sZW5ndGg7IF9pIDwgX2xlbjsgaWR4ID0gKytfaSkge1xuICAgICAgdXJsUGFnZSA9IGZpcnN0VXJsUGFnZXNbaWR4XTtcbiAgICAgIGlmIChfX2luZGV4T2YuY2FsbChvbGRQYWdlcywgdXJsUGFnZSkgPCAwKSB7XG4gICAgICAgIGlmICh1cmxQYWdlICE9PSAnJykge1xuICAgICAgICAgIF9yZXN1bHRzLnB1c2god2lraS5jcmVhdGVQYWdlKHVybFBhZ2UsIGZpcnN0VXJsTG9jc1tpZHhdKS5hcHBlbmRUbygnLm1haW4nKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgX3Jlc3VsdHMucHVzaCh2b2lkIDApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBfcmVzdWx0cztcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGNyZWF0ZTtcblxuICBjcmVhdGUgPSBmdW5jdGlvbihyZXZJbmRleCwgZGF0YSkge1xuICAgIHZhciBhZnRlckluZGV4LCBlZGl0SW5kZXgsIGl0ZW1JZCwgaXRlbXMsIGpvdXJuYWwsIGpvdXJuYWxFbnRyeSwgcmVtb3ZlSW5kZXgsIHJldkpvdXJuYWwsIHJldlN0b3J5LCByZXZTdG9yeUlkcywgcmV2VGl0bGUsIHN0b3J5SXRlbSwgX2ksIF9qLCBfaywgX2xlbiwgX2xlbjEsIF9sZW4yLCBfcmVmO1xuICAgIGpvdXJuYWwgPSBkYXRhLmpvdXJuYWw7XG4gICAgcmV2VGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgIHJldlN0b3J5ID0gW107XG4gICAgcmV2Sm91cm5hbCA9IGpvdXJuYWwuc2xpY2UoMCwgKygrcmV2SW5kZXgpICsgMSB8fCA5ZTkpO1xuICAgIGZvciAoX2kgPSAwLCBfbGVuID0gcmV2Sm91cm5hbC5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgam91cm5hbEVudHJ5ID0gcmV2Sm91cm5hbFtfaV07XG4gICAgICByZXZTdG9yeUlkcyA9IHJldlN0b3J5Lm1hcChmdW5jdGlvbihzdG9yeUl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIHN0b3J5SXRlbS5pZDtcbiAgICAgIH0pO1xuICAgICAgc3dpdGNoIChqb3VybmFsRW50cnkudHlwZSkge1xuICAgICAgICBjYXNlICdjcmVhdGUnOlxuICAgICAgICAgIGlmIChqb3VybmFsRW50cnkuaXRlbS50aXRsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXZUaXRsZSA9IGpvdXJuYWxFbnRyeS5pdGVtLnRpdGxlO1xuICAgICAgICAgICAgcmV2U3RvcnkgPSBqb3VybmFsRW50cnkuaXRlbS5zdG9yeSB8fCBbXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2FkZCc6XG4gICAgICAgICAgaWYgKChhZnRlckluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZihqb3VybmFsRW50cnkuYWZ0ZXIpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldlN0b3J5LnNwbGljZShhZnRlckluZGV4ICsgMSwgMCwgam91cm5hbEVudHJ5Lml0ZW0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXZTdG9yeS5wdXNoKGpvdXJuYWxFbnRyeS5pdGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2VkaXQnOlxuICAgICAgICAgIGlmICgoZWRpdEluZGV4ID0gcmV2U3RvcnlJZHMuaW5kZXhPZihqb3VybmFsRW50cnkuaWQpKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldlN0b3J5LnNwbGljZShlZGl0SW5kZXgsIDEsIGpvdXJuYWxFbnRyeS5pdGVtKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV2U3RvcnkucHVzaChqb3VybmFsRW50cnkuaXRlbSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtb3ZlJzpcbiAgICAgICAgICBpdGVtcyA9IHt9O1xuICAgICAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IHJldlN0b3J5Lmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgICAgc3RvcnlJdGVtID0gcmV2U3RvcnlbX2pdO1xuICAgICAgICAgICAgaXRlbXNbc3RvcnlJdGVtLmlkXSA9IHN0b3J5SXRlbTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV2U3RvcnkgPSBbXTtcbiAgICAgICAgICBfcmVmID0gam91cm5hbEVudHJ5Lm9yZGVyO1xuICAgICAgICAgIGZvciAoX2sgPSAwLCBfbGVuMiA9IF9yZWYubGVuZ3RoOyBfayA8IF9sZW4yOyBfaysrKSB7XG4gICAgICAgICAgICBpdGVtSWQgPSBfcmVmW19rXTtcbiAgICAgICAgICAgIGlmIChpdGVtc1tpdGVtSWRdICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV2U3RvcnkucHVzaChpdGVtc1tpdGVtSWRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JlbW92ZSc6XG4gICAgICAgICAgaWYgKChyZW1vdmVJbmRleCA9IHJldlN0b3J5SWRzLmluZGV4T2Yoam91cm5hbEVudHJ5LmlkKSkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXZTdG9yeS5zcGxpY2UocmVtb3ZlSW5kZXgsIDEpO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0b3J5OiByZXZTdG9yeSxcbiAgICAgIGpvdXJuYWw6IHJldkpvdXJuYWwsXG4gICAgICB0aXRsZTogcmV2VGl0bGVcbiAgICB9O1xuICB9O1xuXG4gIGV4cG9ydHMuY3JlYXRlID0gY3JlYXRlO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYmluZCwgZW1pdDtcblxuICBlbWl0ID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICB2YXIgc2l0ZSwgc2x1ZztcbiAgICBzbHVnID0gaXRlbS5zbHVnIHx8ICd3ZWxjb21lLXZpc2l0b3JzJztcbiAgICBzaXRlID0gaXRlbS5zaXRlO1xuICAgIHJldHVybiB3aWtpLnJlc29sdmVGcm9tKHNpdGUsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRpdGVtLmFwcGVuZChcIjxwIHN0eWxlPSdtYXJnaW4tYm90dG9tOjNweDsnPlxcbiAgPGltZyBjbGFzcz0ncmVtb3RlJ1xcbiAgICBzcmM9Jy8vXCIgKyBzaXRlICsgXCIvZmF2aWNvbi5wbmcnXFxuICAgIHRpdGxlPSdcIiArIHNpdGUgKyBcIidcXG4gICAgZGF0YS1zaXRlPVxcXCJcIiArIHNpdGUgKyBcIlxcXCJcXG4gICAgZGF0YS1zbHVnPVxcXCJcIiArIHNsdWcgKyBcIlxcXCJcXG4gID5cXG4gIFwiICsgKHdpa2kucmVzb2x2ZUxpbmtzKFwiW1tcIiArIChpdGVtLnRpdGxlIHx8IHNsdWcpICsgXCJdXVwiKSkgKyBcIlxcbjwvcD5cXG48ZGl2PlxcbiAgXCIgKyAod2lraS5yZXNvbHZlTGlua3MoaXRlbS50ZXh0KSkgKyBcIlxcbjwvZGl2PlwiKTtcbiAgICB9KTtcbiAgfTtcblxuICBiaW5kID0gZnVuY3Rpb24oJGl0ZW0sIGl0ZW0pIHtcbiAgICByZXR1cm4gJGl0ZW0uZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKCRpdGVtLCBpdGVtKTtcbiAgICB9KTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBlbWl0OiBlbWl0LFxuICAgIGJpbmQ6IGJpbmRcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFycmF5VG9Kc29uLCBiaW5kLCBjc3ZUb0FycmF5LCBlbWl0LFxuICAgIF9faW5kZXhPZiA9IFtdLmluZGV4T2YgfHwgZnVuY3Rpb24oaXRlbSkgeyBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7IGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkgcmV0dXJuIGk7IH0gcmV0dXJuIC0xOyB9O1xuXG4gIGVtaXQgPSBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICB2YXIgc2hvd01lbnUsIHNob3dQcm9tcHQ7XG4gICAgZGl2LmFwcGVuZCgnPHA+RG91YmxlLUNsaWNrIHRvIEVkaXQ8YnI+RHJvcCBUZXh0IG9yIEltYWdlIHRvIEluc2VydDwvcD4nKTtcbiAgICBzaG93TWVudSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGluZm8sIG1lbnUsIG1lbnVJdGVtLCBuYW1lLCBfaSwgX2xlbiwgX3JlZiwgX3JlZjE7XG4gICAgICBtZW51ID0gZGl2LmZpbmQoJ3AnKS5hcHBlbmQoXCI8YnI+T3IgQ2hvb3NlIGEgUGx1Z2luXCIpO1xuICAgICAgbWVudUl0ZW0gPSBmdW5jdGlvbih0aXRsZSwgbmFtZSkge1xuICAgICAgICByZXR1cm4gbWVudS5hcHBlbmQoXCI8bGk+PGEgY2xhc3M9XFxcIm1lbnVcXFwiIGhyZWY9XFxcIiNcXFwiIHRpdGxlPVxcXCJcIiArIHRpdGxlICsgXCJcXFwiPlwiICsgbmFtZSArIFwiPC9hPjwvbGk+XCIpO1xuICAgICAgfTtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KHdpbmRvdy5jYXRhbG9nKSkge1xuICAgICAgICBfcmVmID0gd2luZG93LmNhdGFsb2c7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGluZm8gPSBfcmVmW19pXTtcbiAgICAgICAgICBtZW51SXRlbShpbmZvLnRpdGxlLCBpbmZvLm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfcmVmMSA9IHdpbmRvdy5jYXRhbG9nO1xuICAgICAgICBmb3IgKG5hbWUgaW4gX3JlZjEpIHtcbiAgICAgICAgICBpbmZvID0gX3JlZjFbbmFtZV07XG4gICAgICAgICAgbWVudUl0ZW0oaW5mby5tZW51LCBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1lbnUuZmluZCgnYS5tZW51JykuY2xpY2soZnVuY3Rpb24oZXZ0KSB7XG4gICAgICAgIGRpdi5yZW1vdmVDbGFzcygnZmFjdG9yeScpLmFkZENsYXNzKGl0ZW0udHlwZSA9IGV2dC50YXJnZXQudGV4dC50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgZGl2LnVuYmluZCgpO1xuICAgICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKGRpdiwgaXRlbSk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIHNob3dQcm9tcHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkaXYuYXBwZW5kKFwiPHA+XCIgKyAod2lraS5yZXNvbHZlTGlua3MoaXRlbS5wcm9tcHQpKSArIFwiPC9iPlwiKTtcbiAgICB9O1xuICAgIGlmIChpdGVtLnByb21wdCkge1xuICAgICAgcmV0dXJuIHNob3dQcm9tcHQoKTtcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5jYXRhbG9nICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBzaG93TWVudSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJC5nZXRKU09OKCcvc3lzdGVtL2ZhY3Rvcmllcy5qc29uJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB3aW5kb3cuY2F0YWxvZyA9IGRhdGE7XG4gICAgICAgIHJldHVybiBzaG93TWVudSgpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIGJpbmQgPSBmdW5jdGlvbihkaXYsIGl0ZW0pIHtcbiAgICB2YXIgc3luY0VkaXRBY3Rpb247XG4gICAgc3luY0VkaXRBY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBlcnIsIHBhZ2VFbGVtZW50O1xuICAgICAgd2lraS5sb2coJ2ZhY3RvcnkgaXRlbScsIGl0ZW0pO1xuICAgICAgZGl2LmVtcHR5KCkudW5iaW5kKCk7XG4gICAgICBkaXYucmVtb3ZlQ2xhc3MoXCJmYWN0b3J5XCIpLmFkZENsYXNzKGl0ZW0udHlwZSk7XG4gICAgICBwYWdlRWxlbWVudCA9IGRpdi5wYXJlbnRzKCcucGFnZTpmaXJzdCcpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGl2LmRhdGEoJ3BhZ2VFbGVtZW50JywgcGFnZUVsZW1lbnQpO1xuICAgICAgICBkaXYuZGF0YSgnaXRlbScsIGl0ZW0pO1xuICAgICAgICB3aWtpLmdldFBsdWdpbihpdGVtLnR5cGUsIGZ1bmN0aW9uKHBsdWdpbikge1xuICAgICAgICAgIHBsdWdpbi5lbWl0KGRpdiwgaXRlbSk7XG4gICAgICAgICAgcmV0dXJuIHBsdWdpbi5iaW5kKGRpdiwgaXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgIGVyciA9IF9lcnJvcjtcbiAgICAgICAgZGl2LmFwcGVuZChcIjxwIGNsYXNzPSdlcnJvcic+XCIgKyBlcnIgKyBcIjwvcD5cIik7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2lraS5wYWdlSGFuZGxlci5wdXQocGFnZUVsZW1lbnQsIHtcbiAgICAgICAgdHlwZTogJ2VkaXQnLFxuICAgICAgICBpZDogaXRlbS5pZCxcbiAgICAgICAgaXRlbTogaXRlbVxuICAgICAgfSk7XG4gICAgfTtcbiAgICBkaXYuZGJsY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICBkaXYucmVtb3ZlQ2xhc3MoJ2ZhY3RvcnknKS5hZGRDbGFzcyhpdGVtLnR5cGUgPSAncGFyYWdyYXBoJyk7XG4gICAgICBkaXYudW5iaW5kKCk7XG4gICAgICByZXR1cm4gd2lraS50ZXh0RWRpdG9yKGRpdiwgaXRlbSk7XG4gICAgfSk7XG4gICAgZGl2LmJpbmQoJ2RyYWdlbnRlcicsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgcmV0dXJuIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuICAgIGRpdi5iaW5kKCdkcmFnb3ZlcicsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgcmV0dXJuIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0pO1xuICAgIHJldHVybiBkaXYuYmluZChcImRyb3BcIiwgZnVuY3Rpb24oZHJvcEV2ZW50KSB7XG4gICAgICB2YXIgZHQsIGZvdW5kLCBpZ25vcmUsIG9yaWdpbiwgcHVudCwgcmVhZEZpbGUsIHVybDtcbiAgICAgIHB1bnQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGl0ZW0ucHJvbXB0ID0gXCI8Yj5VbmV4cGVjdGVkIEl0ZW08L2I+PGJyPldlIGNhbid0IG1ha2Ugc2Vuc2Ugb2YgdGhlIGRyb3AuPGJyPlwiICsgKEpTT04uc3RyaW5naWZ5KGRhdGEpKSArIFwiPGJyPlRyeSBzb21ldGhpbmcgZWxzZSBvciBzZWUgW1tBYm91dCBGYWN0b3J5IFBsdWdpbl1dLlwiO1xuICAgICAgICBkYXRhLnVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgICAgIGl0ZW0ucHVudCA9IGRhdGE7XG4gICAgICAgIHdpa2kubG9nKCdmYWN0b3J5IHB1bnQnLCBkcm9wRXZlbnQpO1xuICAgICAgICByZXR1cm4gc3luY0VkaXRBY3Rpb24oKTtcbiAgICAgIH07XG4gICAgICByZWFkRmlsZSA9IGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgdmFyIG1ham9yVHlwZSwgbWlub3JUeXBlLCByZWFkZXIsIF9yZWY7XG4gICAgICAgIGlmIChmaWxlICE9IG51bGwpIHtcbiAgICAgICAgICBfcmVmID0gZmlsZS50eXBlLnNwbGl0KFwiL1wiKSwgbWFqb3JUeXBlID0gX3JlZlswXSwgbWlub3JUeXBlID0gX3JlZlsxXTtcbiAgICAgICAgICByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgIGlmIChtYWpvclR5cGUgPT09IFwiaW1hZ2VcIikge1xuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGxvYWRFdmVudCkge1xuICAgICAgICAgICAgICBpdGVtLnR5cGUgPSAnaW1hZ2UnO1xuICAgICAgICAgICAgICBpdGVtLnVybCA9IGxvYWRFdmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICBpdGVtLmNhcHRpb24gfHwgKGl0ZW0uY2FwdGlvbiA9IFwiVXBsb2FkZWQgaW1hZ2VcIik7XG4gICAgICAgICAgICAgIHJldHVybiBzeW5jRWRpdEFjdGlvbigpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG1ham9yVHlwZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihsb2FkRXZlbnQpIHtcbiAgICAgICAgICAgICAgdmFyIGFycmF5LCByZXN1bHQ7XG4gICAgICAgICAgICAgIHJlc3VsdCA9IGxvYWRFdmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgICBpZiAobWlub3JUeXBlID09PSAnY3N2Jykge1xuICAgICAgICAgICAgICAgIGl0ZW0udHlwZSA9ICdkYXRhJztcbiAgICAgICAgICAgICAgICBpdGVtLmNvbHVtbnMgPSAoYXJyYXkgPSBjc3ZUb0FycmF5KHJlc3VsdCkpWzBdO1xuICAgICAgICAgICAgICAgIGl0ZW0uZGF0YSA9IGFycmF5VG9Kc29uKGFycmF5KTtcbiAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSBmaWxlLmZpbGVOYW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGl0ZW0udHlwZSA9ICdwYXJhZ3JhcGgnO1xuICAgICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHJlc3VsdDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gc3luY0VkaXRBY3Rpb24oKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gcmVhZGVyLnJlYWRBc1RleHQoZmlsZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwdW50KHtcbiAgICAgICAgICAgICAgbnVtYmVyOiAxLFxuICAgICAgICAgICAgICBuYW1lOiBmaWxlLmZpbGVOYW1lLFxuICAgICAgICAgICAgICB0eXBlOiBmaWxlLnR5cGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcHVudCh7XG4gICAgICAgICAgICBudW1iZXI6IDIsXG4gICAgICAgICAgICB0eXBlczogZHJvcEV2ZW50Lm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBkcm9wRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGlmICgoZHQgPSBkcm9wRXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIpICE9IG51bGwpIHtcbiAgICAgICAgaWYgKChkdC50eXBlcyAhPSBudWxsKSAmJiAoX19pbmRleE9mLmNhbGwoZHQudHlwZXMsICd0ZXh0L3VyaS1saXN0JykgPj0gMCB8fCBfX2luZGV4T2YuY2FsbChkdC50eXBlcywgJ3RleHQveC1tb3otdXJsJykgPj0gMCkgJiYgIShfX2luZGV4T2YuY2FsbChkdC50eXBlcywgJ0ZpbGVzJykgPj0gMCkpIHtcbiAgICAgICAgICB1cmwgPSBkdC5nZXREYXRhKCdVUkwnKTtcbiAgICAgICAgICBpZiAoZm91bmQgPSB1cmwubWF0Y2goL15odHRwOlxcL1xcLyhbYS16QS1aMC05Oi4tXSspKFxcLyhbYS16QS1aMC05Oi4tXSspXFwvKFthLXowLTktXSsoX3JldlxcZCspPykpKyQvKSkge1xuICAgICAgICAgICAgd2lraS5sb2coJ2ZhY3RvcnkgZHJvcCB1cmwnLCBmb3VuZCk7XG4gICAgICAgICAgICBpZ25vcmUgPSBmb3VuZFswXSwgb3JpZ2luID0gZm91bmRbMV0sIGlnbm9yZSA9IGZvdW5kWzJdLCBpdGVtLnNpdGUgPSBmb3VuZFszXSwgaXRlbS5zbHVnID0gZm91bmRbNF0sIGlnbm9yZSA9IGZvdW5kWzVdO1xuICAgICAgICAgICAgaWYgKCQuaW5BcnJheShpdGVtLnNpdGUsIFsndmlldycsICdsb2NhbCcsICdvcmlnaW4nXSkgPj0gMCkge1xuICAgICAgICAgICAgICBpdGVtLnNpdGUgPSBvcmlnaW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJC5nZXRKU09OKFwiaHR0cDovL1wiICsgaXRlbS5zaXRlICsgXCIvXCIgKyBpdGVtLnNsdWcgKyBcIi5qc29uXCIsIGZ1bmN0aW9uKHJlbW90ZSkge1xuICAgICAgICAgICAgICB3aWtpLmxvZygnZmFjdG9yeSByZW1vdGUnLCByZW1vdGUpO1xuICAgICAgICAgICAgICBpdGVtLnR5cGUgPSAncmVmZXJlbmNlJztcbiAgICAgICAgICAgICAgaXRlbS50aXRsZSA9IHJlbW90ZS50aXRsZSB8fCBpdGVtLnNsdWc7XG4gICAgICAgICAgICAgIGl0ZW0udGV4dCA9IHdpa2kuY3JlYXRlU3lub3BzaXMocmVtb3RlKTtcbiAgICAgICAgICAgICAgc3luY0VkaXRBY3Rpb24oKTtcbiAgICAgICAgICAgICAgaWYgKGl0ZW0uc2l0ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdpa2kucmVnaXN0ZXJOZWlnaGJvcihpdGVtLnNpdGUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHB1bnQoe1xuICAgICAgICAgICAgICBudW1iZXI6IDQsXG4gICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICB0eXBlczogZHQudHlwZXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChfX2luZGV4T2YuY2FsbChkdC50eXBlcywgJ0ZpbGVzJykgPj0gMCkge1xuICAgICAgICAgIHJldHVybiByZWFkRmlsZShkdC5maWxlc1swXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHB1bnQoe1xuICAgICAgICAgICAgbnVtYmVyOiA1LFxuICAgICAgICAgICAgdHlwZXM6IGR0LnR5cGVzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBwdW50KHtcbiAgICAgICAgICBudW1iZXI6IDYsXG4gICAgICAgICAgdHJvdWJsZTogXCJubyBkYXRhIHRyYW5zZmVyIG9iamVjdFwiXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIGNzdlRvQXJyYXkgPSBmdW5jdGlvbihzdHJEYXRhLCBzdHJEZWxpbWl0ZXIpIHtcbiAgICB2YXIgYXJyRGF0YSwgYXJyTWF0Y2hlcywgb2JqUGF0dGVybiwgc3RyTWF0Y2hlZERlbGltaXRlciwgc3RyTWF0Y2hlZFZhbHVlO1xuICAgIHN0ckRlbGltaXRlciA9IHN0ckRlbGltaXRlciB8fCBcIixcIjtcbiAgICBvYmpQYXR0ZXJuID0gbmV3IFJlZ0V4cChcIihcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcInxcXFxccj9cXFxcbnxcXFxccnxeKVwiICsgXCIoPzpcXFwiKFteXFxcIl0qKD86XFxcIlxcXCJbXlxcXCJdKikqKVxcXCJ8XCIgKyBcIihbXlxcXCJcXFxcXCIgKyBzdHJEZWxpbWl0ZXIgKyBcIlxcXFxyXFxcXG5dKikpXCIsIFwiZ2lcIik7XG4gICAgYXJyRGF0YSA9IFtbXV07XG4gICAgYXJyTWF0Y2hlcyA9IG51bGw7XG4gICAgd2hpbGUgKGFyck1hdGNoZXMgPSBvYmpQYXR0ZXJuLmV4ZWMoc3RyRGF0YSkpIHtcbiAgICAgIHN0ck1hdGNoZWREZWxpbWl0ZXIgPSBhcnJNYXRjaGVzWzFdO1xuICAgICAgaWYgKHN0ck1hdGNoZWREZWxpbWl0ZXIubGVuZ3RoICYmIChzdHJNYXRjaGVkRGVsaW1pdGVyICE9PSBzdHJEZWxpbWl0ZXIpKSB7XG4gICAgICAgIGFyckRhdGEucHVzaChbXSk7XG4gICAgICB9XG4gICAgICBpZiAoYXJyTWF0Y2hlc1syXSkge1xuICAgICAgICBzdHJNYXRjaGVkVmFsdWUgPSBhcnJNYXRjaGVzWzJdLnJlcGxhY2UobmV3IFJlZ0V4cChcIlxcXCJcXFwiXCIsIFwiZ1wiKSwgXCJcXFwiXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyTWF0Y2hlZFZhbHVlID0gYXJyTWF0Y2hlc1szXTtcbiAgICAgIH1cbiAgICAgIGFyckRhdGFbYXJyRGF0YS5sZW5ndGggLSAxXS5wdXNoKHN0ck1hdGNoZWRWYWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJEYXRhO1xuICB9O1xuXG4gIGFycmF5VG9Kc29uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgY29scywgcm93LCByb3dUb09iamVjdCwgX2ksIF9sZW4sIF9yZXN1bHRzO1xuICAgIGNvbHMgPSBhcnJheS5zaGlmdCgpO1xuICAgIHJvd1RvT2JqZWN0ID0gZnVuY3Rpb24ocm93KSB7XG4gICAgICB2YXIgaywgb2JqLCB2LCBfaSwgX2xlbiwgX3JlZiwgX3JlZjE7XG4gICAgICBvYmogPSB7fTtcbiAgICAgIF9yZWYgPSBfLnppcChjb2xzLCByb3cpO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIF9yZWYxID0gX3JlZltfaV0sIGsgPSBfcmVmMVswXSwgdiA9IF9yZWYxWzFdO1xuICAgICAgICBpZiAoKHYgIT0gbnVsbCkgJiYgKHYubWF0Y2goL1xcUy8pKSAmJiB2ICE9PSAnTlVMTCcpIHtcbiAgICAgICAgICBvYmpba10gPSB2O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH07XG4gICAgX3Jlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGFycmF5Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICByb3cgPSBhcnJheVtfaV07XG4gICAgICBfcmVzdWx0cy5wdXNoKHJvd1RvT2JqZWN0KHJvdykpO1xuICAgIH1cbiAgICByZXR1cm4gX3Jlc3VsdHM7XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZW1pdDogZW1pdCxcbiAgICBiaW5kOiBiaW5kXG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciB1dGlsO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGpvdXJuYWxFbGVtZW50LCBhY3Rpb24pIHtcbiAgICB2YXIgYWN0aW9uRWxlbWVudCwgYWN0aW9uVGl0bGUsIGNvbnRyb2xzLCBwYWdlRWxlbWVudDtcbiAgICBwYWdlRWxlbWVudCA9IGpvdXJuYWxFbGVtZW50LnBhcmVudHMoJy5wYWdlOmZpcnN0Jyk7XG4gICAgYWN0aW9uVGl0bGUgPSBhY3Rpb24udHlwZSB8fCAnc2VwYXJhdG9yJztcbiAgICBpZiAoYWN0aW9uLmRhdGUgIT0gbnVsbCkge1xuICAgICAgYWN0aW9uVGl0bGUgKz0gXCIgXCIgKyAodXRpbC5mb3JtYXRFbGFwc2VkVGltZShhY3Rpb24uZGF0ZSkpO1xuICAgIH1cbiAgICBhY3Rpb25FbGVtZW50ID0gJChcIjxhIGhyZWY9XFxcIiNcXFwiIC8+IFwiKS5hZGRDbGFzcyhcImFjdGlvblwiKS5hZGRDbGFzcyhhY3Rpb24udHlwZSB8fCAnc2VwYXJhdG9yJykudGV4dChhY3Rpb24uc3ltYm9sIHx8IHV0aWwuc3ltYm9sc1thY3Rpb24udHlwZV0pLmF0dHIoJ3RpdGxlJywgYWN0aW9uVGl0bGUpLmF0dHIoJ2RhdGEtaWQnLCBhY3Rpb24uaWQgfHwgXCIwXCIpLmRhdGEoJ2FjdGlvbicsIGFjdGlvbik7XG4gICAgY29udHJvbHMgPSBqb3VybmFsRWxlbWVudC5jaGlsZHJlbignLmNvbnRyb2wtYnV0dG9ucycpO1xuICAgIGlmIChjb250cm9scy5sZW5ndGggPiAwKSB7XG4gICAgICBhY3Rpb25FbGVtZW50Lmluc2VydEJlZm9yZShjb250cm9scyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFjdGlvbkVsZW1lbnQuYXBwZW5kVG8oam91cm5hbEVsZW1lbnQpO1xuICAgIH1cbiAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdmb3JrJyAmJiAoYWN0aW9uLnNpdGUgIT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiBhY3Rpb25FbGVtZW50LmNzcyhcImJhY2tncm91bmQtaW1hZ2VcIiwgXCJ1cmwoLy9cIiArIGFjdGlvbi5zaXRlICsgXCIvZmF2aWNvbi5wbmcpXCIpLmF0dHIoXCJocmVmXCIsIFwiLy9cIiArIGFjdGlvbi5zaXRlICsgXCIvXCIgKyAocGFnZUVsZW1lbnQuYXR0cignaWQnKSkgKyBcIi5odG1sXCIpLmRhdGEoXCJzaXRlXCIsIGFjdGlvbi5zaXRlKS5kYXRhKFwic2x1Z1wiLCBwYWdlRWxlbWVudC5hdHRyKCdpZCcpKTtcbiAgICB9XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBhZGRUb0pvdXJuYWwsIG5ld1BhZ2UsIHBhZ2VGcm9tTG9jYWxTdG9yYWdlLCBwYWdlSGFuZGxlciwgcHVzaFRvTG9jYWwsIHB1c2hUb1NlcnZlciwgcmVjdXJzaXZlR2V0LCByZXZpc2lvbiwgc3RhdGUsIHV0aWwsIHdpa2ksIF87XG5cbiAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuICB3aWtpID0gcmVxdWlyZSgnLi93aWtpJyk7XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIHN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZScpO1xuXG4gIHJldmlzaW9uID0gcmVxdWlyZSgnLi9yZXZpc2lvbicpO1xuXG4gIGFkZFRvSm91cm5hbCA9IHJlcXVpcmUoJy4vYWRkVG9Kb3VybmFsJyk7XG5cbiAgbmV3UGFnZSA9IHJlcXVpcmUoJy4vcGFnZScpLm5ld1BhZ2U7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwYWdlSGFuZGxlciA9IHt9O1xuXG4gIHBhZ2VGcm9tTG9jYWxTdG9yYWdlID0gZnVuY3Rpb24oc2x1Zykge1xuICAgIHZhciBqc29uO1xuICAgIGlmIChqc29uID0gbG9jYWxTdG9yYWdlW3NsdWddKSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShqc29uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG4gIH07XG5cbiAgcmVjdXJzaXZlR2V0ID0gZnVuY3Rpb24oX2FyZykge1xuICAgIHZhciBsb2NhbENvbnRleHQsIGxvY2FsUGFnZSwgcGFnZUluZm9ybWF0aW9uLCByZXYsIHNpdGUsIHNsdWcsIHVybCwgd2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbjtcbiAgICBwYWdlSW5mb3JtYXRpb24gPSBfYXJnLnBhZ2VJbmZvcm1hdGlvbiwgd2hlbkdvdHRlbiA9IF9hcmcud2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbiA9IF9hcmcud2hlbk5vdEdvdHRlbiwgbG9jYWxDb250ZXh0ID0gX2FyZy5sb2NhbENvbnRleHQ7XG4gICAgc2x1ZyA9IHBhZ2VJbmZvcm1hdGlvbi5zbHVnLCByZXYgPSBwYWdlSW5mb3JtYXRpb24ucmV2LCBzaXRlID0gcGFnZUluZm9ybWF0aW9uLnNpdGU7XG4gICAgaWYgKHNpdGUpIHtcbiAgICAgIGxvY2FsQ29udGV4dCA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaXRlID0gbG9jYWxDb250ZXh0LnNoaWZ0KCk7XG4gICAgfVxuICAgIGlmIChzaXRlID09PSB3aW5kb3cubG9jYXRpb24uaG9zdCkge1xuICAgICAgc2l0ZSA9ICdvcmlnaW4nO1xuICAgIH1cbiAgICBpZiAoc2l0ZSA9PT0gJ3ZpZXcnKSB7XG4gICAgICBzaXRlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHNpdGUgIT0gbnVsbCkge1xuICAgICAgaWYgKHNpdGUgPT09ICdsb2NhbCcpIHtcbiAgICAgICAgaWYgKGxvY2FsUGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VJbmZvcm1hdGlvbi5zbHVnKSkge1xuICAgICAgICAgIHJldHVybiB3aGVuR290dGVuKG5ld1BhZ2UobG9jYWxQYWdlLCAnbG9jYWwnKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHdoZW5Ob3RHb3R0ZW4oKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHNpdGUgPT09ICdvcmlnaW4nKSB7XG4gICAgICAgICAgdXJsID0gXCIvXCIgKyBzbHVnICsgXCIuanNvblwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVybCA9IFwiaHR0cDovL1wiICsgc2l0ZSArIFwiL1wiICsgc2x1ZyArIFwiLmpzb25cIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB1cmwgPSBcIi9cIiArIHNsdWcgKyBcIi5qc29uXCI7XG4gICAgfVxuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgdHlwZTogJ0dFVCcsXG4gICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgdXJsOiB1cmwgKyAoXCI/cmFuZG9tPVwiICsgKHV0aWwucmFuZG9tQnl0ZXMoNCkpKSxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKHBhZ2UpIHtcbiAgICAgICAgaWYgKHJldikge1xuICAgICAgICAgIHBhZ2UgPSByZXZpc2lvbi5jcmVhdGUocmV2LCBwYWdlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2hlbkdvdHRlbihuZXdQYWdlKHBhZ2UsIHNpdGUpKTtcbiAgICAgIH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oeGhyLCB0eXBlLCBtc2cpIHtcbiAgICAgICAgdmFyIHRyb3VibGVQYWdlT2JqZWN0O1xuICAgICAgICBpZiAoKHhoci5zdGF0dXMgIT09IDQwNCkgJiYgKHhoci5zdGF0dXMgIT09IDApKSB7XG4gICAgICAgICAgd2lraS5sb2coJ3BhZ2VIYW5kbGVyLmdldCBlcnJvcicsIHhociwgeGhyLnN0YXR1cywgdHlwZSwgbXNnKTtcbiAgICAgICAgICB0cm91YmxlUGFnZU9iamVjdCA9IG5ld1BhZ2Uoe1xuICAgICAgICAgICAgdGl0bGU6IFwiVHJvdWJsZTogQ2FuJ3QgR2V0IFBhZ2VcIlxuICAgICAgICAgIH0sIG51bGwpO1xuICAgICAgICAgIHRyb3VibGVQYWdlT2JqZWN0LmFkZFBhcmFncmFwaChcIlRoZSBwYWdlIGhhbmRsZXIgaGFzIHJ1biBpbnRvIHByb2JsZW1zIHdpdGggdGhpcyAgIHJlcXVlc3QuXFxuPHByZSBjbGFzcz1lcnJvcj5cIiArIChKU09OLnN0cmluZ2lmeShwYWdlSW5mb3JtYXRpb24pKSArIFwiPC9wcmU+XFxuVGhlIHJlcXVlc3RlZCB1cmwuXFxuPHByZSBjbGFzcz1lcnJvcj5cIiArIHVybCArIFwiPC9wcmU+XFxuVGhlIHNlcnZlciByZXBvcnRlZCBzdGF0dXMuXFxuPHByZSBjbGFzcz1lcnJvcj5cIiArIHhoci5zdGF0dXMgKyBcIjwvcHJlPlxcblRoZSBlcnJvciB0eXBlLlxcbjxwcmUgY2xhc3M9ZXJyb3I+XCIgKyB0eXBlICsgXCI8L3ByZT5cXG5UaGUgZXJyb3IgbWVzc2FnZS5cXG48cHJlIGNsYXNzPWVycm9yPlwiICsgbXNnICsgXCI8L3ByZT5cXG5UaGVzZSBwcm9ibGVtcyBhcmUgcmFyZWx5IHNvbHZlZCBieSByZXBvcnRpbmcgaXNzdWVzLlxcblRoZXJlIGNvdWxkIGJlIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gcmVwb3J0ZWQgaW4gdGhlIGJyb3dzZXIncyBjb25zb2xlLmxvZy5cXG5Nb3JlIGluZm9ybWF0aW9uIG1pZ2h0IGJlIGFjY2Vzc2libGUgYnkgZmV0Y2hpbmcgdGhlIHBhZ2Ugb3V0c2lkZSBvZiB3aWtpLlxcbjxhIGhyZWY9XFxcIlwiICsgdXJsICsgXCJcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj50cnktbm93PC9hPlwiKTtcbiAgICAgICAgICByZXR1cm4gd2hlbkdvdHRlbih0cm91YmxlUGFnZU9iamVjdCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxvY2FsQ29udGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIHJlY3Vyc2l2ZUdldCh7XG4gICAgICAgICAgICBwYWdlSW5mb3JtYXRpb246IHBhZ2VJbmZvcm1hdGlvbixcbiAgICAgICAgICAgIHdoZW5Hb3R0ZW46IHdoZW5Hb3R0ZW4sXG4gICAgICAgICAgICB3aGVuTm90R290dGVuOiB3aGVuTm90R290dGVuLFxuICAgICAgICAgICAgbG9jYWxDb250ZXh0OiBsb2NhbENvbnRleHRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gd2hlbk5vdEdvdHRlbigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgcGFnZUhhbmRsZXIuZ2V0ID0gZnVuY3Rpb24oX2FyZykge1xuICAgIHZhciBsb2NhbFBhZ2UsIHBhZ2VJbmZvcm1hdGlvbiwgd2hlbkdvdHRlbiwgd2hlbk5vdEdvdHRlbjtcbiAgICB3aGVuR290dGVuID0gX2FyZy53aGVuR290dGVuLCB3aGVuTm90R290dGVuID0gX2FyZy53aGVuTm90R290dGVuLCBwYWdlSW5mb3JtYXRpb24gPSBfYXJnLnBhZ2VJbmZvcm1hdGlvbjtcbiAgICBpZiAoIXBhZ2VJbmZvcm1hdGlvbi5zaXRlKSB7XG4gICAgICBpZiAobG9jYWxQYWdlID0gcGFnZUZyb21Mb2NhbFN0b3JhZ2UocGFnZUluZm9ybWF0aW9uLnNsdWcpKSB7XG4gICAgICAgIGlmIChwYWdlSW5mb3JtYXRpb24ucmV2KSB7XG4gICAgICAgICAgbG9jYWxQYWdlID0gcmV2aXNpb24uY3JlYXRlKHBhZ2VJbmZvcm1hdGlvbi5yZXYsIGxvY2FsUGFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdoZW5Hb3R0ZW4obmV3UGFnZShsb2NhbFBhZ2UsICdsb2NhbCcpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwYWdlSGFuZGxlci5jb250ZXh0Lmxlbmd0aCkge1xuICAgICAgcGFnZUhhbmRsZXIuY29udGV4dCA9IFsndmlldyddO1xuICAgIH1cbiAgICByZXR1cm4gcmVjdXJzaXZlR2V0KHtcbiAgICAgIHBhZ2VJbmZvcm1hdGlvbjogcGFnZUluZm9ybWF0aW9uLFxuICAgICAgd2hlbkdvdHRlbjogd2hlbkdvdHRlbixcbiAgICAgIHdoZW5Ob3RHb3R0ZW46IHdoZW5Ob3RHb3R0ZW4sXG4gICAgICBsb2NhbENvbnRleHQ6IF8uY2xvbmUocGFnZUhhbmRsZXIuY29udGV4dClcbiAgICB9KTtcbiAgfTtcblxuICBwYWdlSGFuZGxlci5jb250ZXh0ID0gW107XG5cbiAgcHVzaFRvTG9jYWwgPSBmdW5jdGlvbihwYWdlRWxlbWVudCwgcGFnZVB1dEluZm8sIGFjdGlvbikge1xuICAgIHZhciBwYWdlLCBzaXRlO1xuICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ2NyZWF0ZScpIHtcbiAgICAgIHBhZ2UgPSB7XG4gICAgICAgIHRpdGxlOiBhY3Rpb24uaXRlbS50aXRsZSxcbiAgICAgICAgc3Rvcnk6IFtdLFxuICAgICAgICBqb3VybmFsOiBbXVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZSA9IHBhZ2VGcm9tTG9jYWxTdG9yYWdlKHBhZ2VQdXRJbmZvLnNsdWcpO1xuICAgICAgcGFnZSB8fCAocGFnZSA9IHBhZ2VFbGVtZW50LmRhdGEoXCJkYXRhXCIpKTtcbiAgICAgIGlmIChwYWdlLmpvdXJuYWwgPT0gbnVsbCkge1xuICAgICAgICBwYWdlLmpvdXJuYWwgPSBbXTtcbiAgICAgIH1cbiAgICAgIGlmICgoc2l0ZSA9IGFjdGlvblsnZm9yayddKSAhPSBudWxsKSB7XG4gICAgICAgIHBhZ2Uuam91cm5hbCA9IHBhZ2Uuam91cm5hbC5jb25jYXQoe1xuICAgICAgICAgICd0eXBlJzogJ2ZvcmsnLFxuICAgICAgICAgICdzaXRlJzogc2l0ZVxuICAgICAgICB9KTtcbiAgICAgICAgZGVsZXRlIGFjdGlvblsnZm9yayddO1xuICAgICAgfVxuICAgICAgcGFnZS5zdG9yeSA9ICQocGFnZUVsZW1lbnQpLmZpbmQoXCIuaXRlbVwiKS5tYXAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAkKHRoaXMpLmRhdGEoXCJpdGVtXCIpO1xuICAgICAgfSkuZ2V0KCk7XG4gICAgfVxuICAgIHBhZ2Uuam91cm5hbCA9IHBhZ2Uuam91cm5hbC5jb25jYXQoYWN0aW9uKTtcbiAgICBsb2NhbFN0b3JhZ2VbcGFnZVB1dEluZm8uc2x1Z10gPSBKU09OLnN0cmluZ2lmeShwYWdlKTtcbiAgICByZXR1cm4gYWRkVG9Kb3VybmFsKHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksIGFjdGlvbik7XG4gIH07XG5cbiAgcHVzaFRvU2VydmVyID0gZnVuY3Rpb24ocGFnZUVsZW1lbnQsIHBhZ2VQdXRJbmZvLCBhY3Rpb24pIHtcbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgIHR5cGU6ICdQVVQnLFxuICAgICAgdXJsOiBcIi9wYWdlL1wiICsgcGFnZVB1dEluZm8uc2x1ZyArIFwiL2FjdGlvblwiLFxuICAgICAgZGF0YToge1xuICAgICAgICAnYWN0aW9uJzogSlNPTi5zdHJpbmdpZnkoYWN0aW9uKVxuICAgICAgfSxcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICBhZGRUb0pvdXJuYWwocGFnZUVsZW1lbnQuZmluZCgnLmpvdXJuYWwnKSwgYWN0aW9uKTtcbiAgICAgICAgaWYgKGFjdGlvbi50eXBlID09PSAnZm9yaycpIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShwYWdlRWxlbWVudC5hdHRyKCdpZCcpKTtcbiAgICAgICAgICByZXR1cm4gc3RhdGUuc2V0VXJsO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uKHhociwgdHlwZSwgbXNnKSB7XG4gICAgICAgIHJldHVybiB3aWtpLmxvZyhcInBhZ2VIYW5kbGVyLnB1dCBhamF4IGVycm9yIGNhbGxiYWNrXCIsIHR5cGUsIG1zZyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgcGFnZUhhbmRsZXIucHV0ID0gZnVuY3Rpb24ocGFnZUVsZW1lbnQsIGFjdGlvbikge1xuICAgIHZhciBjaGVja2VkU2l0ZSwgZm9ya0Zyb20sIHBhZ2VQdXRJbmZvO1xuICAgIGNoZWNrZWRTaXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2l0ZTtcbiAgICAgIHN3aXRjaCAoc2l0ZSA9IHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKSkge1xuICAgICAgICBjYXNlICdvcmlnaW4nOlxuICAgICAgICBjYXNlICdsb2NhbCc6XG4gICAgICAgIGNhc2UgJ3ZpZXcnOlxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICBjYXNlIGxvY2F0aW9uLmhvc3Q6XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIHNpdGU7XG4gICAgICB9XG4gICAgfTtcbiAgICBwYWdlUHV0SW5mbyA9IHtcbiAgICAgIHNsdWc6IHBhZ2VFbGVtZW50LmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKVswXSxcbiAgICAgIHJldjogcGFnZUVsZW1lbnQuYXR0cignaWQnKS5zcGxpdCgnX3JldicpWzFdLFxuICAgICAgc2l0ZTogY2hlY2tlZFNpdGUoKSxcbiAgICAgIGxvY2FsOiBwYWdlRWxlbWVudC5oYXNDbGFzcygnbG9jYWwnKVxuICAgIH07XG4gICAgZm9ya0Zyb20gPSBwYWdlUHV0SW5mby5zaXRlO1xuICAgIHdpa2kubG9nKCdwYWdlSGFuZGxlci5wdXQnLCBhY3Rpb24sIHBhZ2VQdXRJbmZvKTtcbiAgICBpZiAod2lraS51c2VMb2NhbFN0b3JhZ2UoKSkge1xuICAgICAgaWYgKHBhZ2VQdXRJbmZvLnNpdGUgIT0gbnVsbCkge1xuICAgICAgICB3aWtpLmxvZygncmVtb3RlID0+IGxvY2FsJyk7XG4gICAgICB9IGVsc2UgaWYgKCFwYWdlUHV0SW5mby5sb2NhbCkge1xuICAgICAgICB3aWtpLmxvZygnb3JpZ2luID0+IGxvY2FsJyk7XG4gICAgICAgIGFjdGlvbi5zaXRlID0gZm9ya0Zyb20gPSBsb2NhdGlvbi5ob3N0O1xuICAgICAgfVxuICAgIH1cbiAgICBhY3Rpb24uZGF0ZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgaWYgKGFjdGlvbi5zaXRlID09PSAnb3JpZ2luJykge1xuICAgICAgZGVsZXRlIGFjdGlvbi5zaXRlO1xuICAgIH1cbiAgICBpZiAoZm9ya0Zyb20pIHtcbiAgICAgIHBhZ2VFbGVtZW50LmZpbmQoJ2gxIGltZycpLmF0dHIoJ3NyYycsICcvZmF2aWNvbi5wbmcnKTtcbiAgICAgIHBhZ2VFbGVtZW50LmZpbmQoJ2gxIGEnKS5hdHRyKCdocmVmJywgJy8nKTtcbiAgICAgIHBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnLCBudWxsKTtcbiAgICAgIHBhZ2VFbGVtZW50LnJlbW92ZUNsYXNzKCdyZW1vdGUnKTtcbiAgICAgIHN0YXRlLnNldFVybCgpO1xuICAgICAgaWYgKGFjdGlvbi50eXBlICE9PSAnZm9yaycpIHtcbiAgICAgICAgYWN0aW9uLmZvcmsgPSBmb3JrRnJvbTtcbiAgICAgICAgYWRkVG9Kb3VybmFsKHBhZ2VFbGVtZW50LmZpbmQoJy5qb3VybmFsJyksIHtcbiAgICAgICAgICB0eXBlOiAnZm9yaycsXG4gICAgICAgICAgc2l0ZTogZm9ya0Zyb20sXG4gICAgICAgICAgZGF0ZTogYWN0aW9uLmRhdGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh3aWtpLnVzZUxvY2FsU3RvcmFnZSgpIHx8IHBhZ2VQdXRJbmZvLnNpdGUgPT09ICdsb2NhbCcpIHtcbiAgICAgIHB1c2hUb0xvY2FsKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKTtcbiAgICAgIHJldHVybiBwYWdlRWxlbWVudC5hZGRDbGFzcyhcImxvY2FsXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcHVzaFRvU2VydmVyKHBhZ2VFbGVtZW50LCBwYWdlUHV0SW5mbywgYWN0aW9uKTtcbiAgICB9XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBhc1NsdWcsIGVtcHR5UGFnZSwgbmV3UGFnZSwgbm93U2VjdGlvbnMsIHV0aWwsIF87XG5cbiAgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG4gIF8gPSByZXF1aXJlKCd1bmRlcnNjb3JlJyk7XG5cbiAgYXNTbHVnID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiBuYW1lLnJlcGxhY2UoL1xccy9nLCAnLScpLnJlcGxhY2UoL1teQS1aYS16MC05LV0vZywgJycpLnRvTG93ZXJDYXNlKCk7XG4gIH07XG5cbiAgZW1wdHlQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ld1BhZ2Uoe30sIG51bGwpO1xuICB9O1xuXG4gIG5vd1NlY3Rpb25zID0gZnVuY3Rpb24obm93KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgc3ltYm9sOiAn4p2EJyxcbiAgICAgICAgZGF0ZTogbm93IC0gMTAwMCAqIDYwICogNjAgKiAyNCAqIDM2NixcbiAgICAgICAgcGVyaW9kOiAnYSBZZWFyJ1xuICAgICAgfSwge1xuICAgICAgICBzeW1ib2w6ICfimpgnLFxuICAgICAgICBkYXRlOiBub3cgLSAxMDAwICogNjAgKiA2MCAqIDI0ICogMzEgKiAzLFxuICAgICAgICBwZXJpb2Q6ICdhIFNlYXNvbidcbiAgICAgIH0sIHtcbiAgICAgICAgc3ltYm9sOiAn4pqqJyxcbiAgICAgICAgZGF0ZTogbm93IC0gMTAwMCAqIDYwICogNjAgKiAyNCAqIDMxLFxuICAgICAgICBwZXJpb2Q6ICdhIE1vbnRoJ1xuICAgICAgfSwge1xuICAgICAgICBzeW1ib2w6ICfimL0nLFxuICAgICAgICBkYXRlOiBub3cgLSAxMDAwICogNjAgKiA2MCAqIDI0ICogNyxcbiAgICAgICAgcGVyaW9kOiAnYSBXZWVrJ1xuICAgICAgfSwge1xuICAgICAgICBzeW1ib2w6ICfimIAnLFxuICAgICAgICBkYXRlOiBub3cgLSAxMDAwICogNjAgKiA2MCAqIDI0LFxuICAgICAgICBwZXJpb2Q6ICdhIERheSdcbiAgICAgIH0sIHtcbiAgICAgICAgc3ltYm9sOiAn4oyaJyxcbiAgICAgICAgZGF0ZTogbm93IC0gMTAwMCAqIDYwICogNjAsXG4gICAgICAgIHBlcmlvZDogJ2FuIEhvdXInXG4gICAgICB9XG4gICAgXTtcbiAgfTtcblxuICBuZXdQYWdlID0gZnVuY3Rpb24oanNvbiwgc2l0ZSkge1xuICAgIHZhciBhZGRJdGVtLCBhZGRQYXJhZ3JhcGgsIGdldENvbnRleHQsIGdldE5laWdoYm9ycywgZ2V0UmF3UGFnZSwgZ2V0UmVtb3RlU2l0ZSwgZ2V0U2x1ZywgaXNMb2NhbCwgaXNQbHVnaW4sIGlzUmVtb3RlLCBwYWdlLCBzZXFBY3Rpb25zLCBzZXFJdGVtcywgc2V0VGl0bGU7XG4gICAgcGFnZSA9IF8uZXh0ZW5kKHt9LCB1dGlsLmVtcHR5UGFnZSgpLCBqc29uKTtcbiAgICBwYWdlLnN0b3J5IHx8IChwYWdlLnN0b3J5ID0gW10pO1xuICAgIHBhZ2Uuam91cm5hbCB8fCAocGFnZS5qb3VybmFsID0gW10pO1xuICAgIGdldFJhd1BhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBwYWdlO1xuICAgIH07XG4gICAgZ2V0Q29udGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFjdGlvbiwgYWRkQ29udGV4dCwgY29udGV4dCwgX2ksIF9sZW4sIF9yZWY7XG4gICAgICBjb250ZXh0ID0gWyd2aWV3J107XG4gICAgICBpZiAoaXNSZW1vdGUoKSkge1xuICAgICAgICBjb250ZXh0LnB1c2goc2l0ZSk7XG4gICAgICB9XG4gICAgICBhZGRDb250ZXh0ID0gZnVuY3Rpb24oc2l0ZSkge1xuICAgICAgICBpZiAoKHNpdGUgIT0gbnVsbCkgJiYgIV8uaW5jbHVkZShjb250ZXh0LCBzaXRlKSkge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0LnB1c2goc2l0ZSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBfcmVmID0gcGFnZS5qb3VybmFsLnNsaWNlKDApLnJldmVyc2UoKTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZi5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBhY3Rpb24gPSBfcmVmW19pXTtcbiAgICAgICAgYWRkQ29udGV4dChhY3Rpb24uc2l0ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29udGV4dDtcbiAgICB9O1xuICAgIGlzUGx1Z2luID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcGFnZS5wbHVnaW4gIT0gbnVsbDtcbiAgICB9O1xuICAgIGlzUmVtb3RlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gIShzaXRlID09PSAodm9pZCAwKSB8fCBzaXRlID09PSBudWxsIHx8IHNpdGUgPT09ICd2aWV3JyB8fCBzaXRlID09PSAnb3JpZ2luJyB8fCBzaXRlID09PSAnbG9jYWwnKTtcbiAgICB9O1xuICAgIGlzTG9jYWwgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzaXRlID09PSAnbG9jYWwnO1xuICAgIH07XG4gICAgZ2V0UmVtb3RlU2l0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKGlzUmVtb3RlKCkpIHtcbiAgICAgICAgcmV0dXJuIHNpdGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIGdldFNsdWcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBhc1NsdWcocGFnZS50aXRsZSk7XG4gICAgfTtcbiAgICBnZXROZWlnaGJvcnMgPSBmdW5jdGlvbihob3N0KSB7XG4gICAgICB2YXIgYWN0aW9uLCBpdGVtLCBuZWlnaGJvcnMsIF9pLCBfaiwgX2xlbiwgX2xlbjEsIF9yZWYsIF9yZWYxO1xuICAgICAgbmVpZ2hib3JzID0gW107XG4gICAgICBpZiAoaXNSZW1vdGUoKSkge1xuICAgICAgICBuZWlnaGJvcnMucHVzaChzaXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChob3N0ICE9IG51bGwpIHtcbiAgICAgICAgICBuZWlnaGJvcnMucHVzaChob3N0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX3JlZiA9IHBhZ2Uuc3Rvcnk7XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgaXRlbSA9IF9yZWZbX2ldO1xuICAgICAgICBpZiAoaXRlbS5zaXRlICE9IG51bGwpIHtcbiAgICAgICAgICBuZWlnaGJvcnMucHVzaChpdGVtLnNpdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfcmVmMSA9IHBhZ2Uuam91cm5hbDtcbiAgICAgIGZvciAoX2ogPSAwLCBfbGVuMSA9IF9yZWYxLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICBhY3Rpb24gPSBfcmVmMVtfal07XG4gICAgICAgIGlmIChhY3Rpb24uc2l0ZSAhPSBudWxsKSB7XG4gICAgICAgICAgbmVpZ2hib3JzLnB1c2goYWN0aW9uLnNpdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gXy51bmlxKG5laWdoYm9ycyk7XG4gICAgfTtcbiAgICBzZXRUaXRsZSA9IGZ1bmN0aW9uKHRpdGxlKSB7XG4gICAgICByZXR1cm4gcGFnZS50aXRsZSA9IHRpdGxlO1xuICAgIH07XG4gICAgYWRkSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIGl0ZW0gPSBfLmV4dGVuZCh7fSwge1xuICAgICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgICAgfSwgaXRlbSk7XG4gICAgICByZXR1cm4gcGFnZS5zdG9yeS5wdXNoKGl0ZW0pO1xuICAgIH07XG4gICAgc2VxSXRlbXMgPSBmdW5jdGlvbihlYWNoKSB7XG4gICAgICB2YXIgZW1pdEl0ZW07XG4gICAgICBlbWl0SXRlbSA9IGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKGkgPj0gcGFnZS5zdG9yeS5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVhY2gocGFnZS5zdG9yeVtpXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGVtaXRJdGVtKGkgKyAxKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGVtaXRJdGVtKDApO1xuICAgIH07XG4gICAgYWRkUGFyYWdyYXBoID0gZnVuY3Rpb24odGV4dCkge1xuICAgICAgdmFyIHR5cGU7XG4gICAgICB0eXBlID0gXCJwYXJhZ3JhcGhcIjtcbiAgICAgIHJldHVybiBhZGRJdGVtKHtcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgdGV4dDogdGV4dFxuICAgICAgfSk7XG4gICAgfTtcbiAgICBzZXFBY3Rpb25zID0gZnVuY3Rpb24oZWFjaCkge1xuICAgICAgdmFyIGVtaXRBY3Rpb24sIHNlY3Rpb25zLCBzbWFsbGVyO1xuICAgICAgc21hbGxlciA9IDA7XG4gICAgICBzZWN0aW9ucyA9IG5vd1NlY3Rpb25zKChuZXcgRGF0ZSkuZ2V0VGltZSgpKTtcbiAgICAgIGVtaXRBY3Rpb24gPSBmdW5jdGlvbihpKSB7XG4gICAgICAgIHZhciBhY3Rpb24sIGJpZ2dlciwgc2VjdGlvbiwgc2VwYXJhdG9yLCBfaSwgX2xlbjtcbiAgICAgICAgaWYgKGkgPj0gcGFnZS5qb3VybmFsLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBhY3Rpb24gPSBwYWdlLmpvdXJuYWxbaV07XG4gICAgICAgIGJpZ2dlciA9IGFjdGlvbi5kYXRlIHx8IDA7XG4gICAgICAgIHNlcGFyYXRvciA9IG51bGw7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gc2VjdGlvbnMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICBzZWN0aW9uID0gc2VjdGlvbnNbX2ldO1xuICAgICAgICAgIGlmIChzZWN0aW9uLmRhdGUgPiBzbWFsbGVyICYmIHNlY3Rpb24uZGF0ZSA8IGJpZ2dlcikge1xuICAgICAgICAgICAgc2VwYXJhdG9yID0gc2VjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc21hbGxlciA9IGJpZ2dlcjtcbiAgICAgICAgcmV0dXJuIGVhY2goe1xuICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICAgIHNlcGFyYXRvcjogc2VwYXJhdG9yXG4gICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBlbWl0QWN0aW9uKGkgKyAxKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGVtaXRBY3Rpb24oMCk7XG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0UmF3UGFnZTogZ2V0UmF3UGFnZSxcbiAgICAgIGdldENvbnRleHQ6IGdldENvbnRleHQsXG4gICAgICBpc1BsdWdpbjogaXNQbHVnaW4sXG4gICAgICBpc1JlbW90ZTogaXNSZW1vdGUsXG4gICAgICBpc0xvY2FsOiBpc0xvY2FsLFxuICAgICAgZ2V0UmVtb3RlU2l0ZTogZ2V0UmVtb3RlU2l0ZSxcbiAgICAgIGdldFNsdWc6IGdldFNsdWcsXG4gICAgICBnZXROZWlnaGJvcnM6IGdldE5laWdoYm9ycyxcbiAgICAgIHNldFRpdGxlOiBzZXRUaXRsZSxcbiAgICAgIGFkZEl0ZW06IGFkZEl0ZW0sXG4gICAgICBhZGRQYXJhZ3JhcGg6IGFkZFBhcmFncmFwaCxcbiAgICAgIHNlcUl0ZW1zOiBzZXFJdGVtcyxcbiAgICAgIHNlcUFjdGlvbnM6IHNlcUFjdGlvbnNcbiAgICB9O1xuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0ge1xuICAgIG5ld1BhZ2U6IG5ld1BhZ2UsXG4gICAgZW1wdHlQYWdlOiBlbXB0eVBhZ2VcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgdmFyIGFkZFRvSm91cm5hbCwgYnVpbGRQYWdlSGVhZGVyLCBjcmVhdGVGYWN0b3J5LCBlbWl0SGVhZGVyLCBlbWl0VHdpbnMsIGhhbmRsZURyYWdnaW5nLCBpbml0QWRkQnV0dG9uLCBpbml0RHJhZ2dpbmcsIG5laWdoYm9yaG9vZCwgcGFnZUhhbmRsZXIsIHBsdWdpbiwgcmVmcmVzaCwgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCwgc3RhdGUsIHV0aWwsIHdpa2ksIF87XG5cbiAgXyA9IHJlcXVpcmUoJ3VuZGVyc2NvcmUnKTtcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgcGFnZUhhbmRsZXIgPSByZXF1aXJlKCcuL3BhZ2VIYW5kbGVyJyk7XG5cbiAgcGx1Z2luID0gcmVxdWlyZSgnLi9wbHVnaW4nKTtcblxuICBzdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGUnKTtcblxuICBuZWlnaGJvcmhvb2QgPSByZXF1aXJlKCcuL25laWdoYm9yaG9vZCcpO1xuXG4gIGFkZFRvSm91cm5hbCA9IHJlcXVpcmUoJy4vYWRkVG9Kb3VybmFsJyk7XG5cbiAgd2lraSA9IHJlcXVpcmUoJy4vd2lraScpO1xuXG4gIGhhbmRsZURyYWdnaW5nID0gZnVuY3Rpb24oZXZ0LCB1aSkge1xuICAgIHZhciBhY3Rpb24sIGJlZm9yZSwgYmVmb3JlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudCwgZXF1YWxzLCBpdGVtLCBpdGVtRWxlbWVudCwgbW92ZUZyb21QYWdlLCBtb3ZlVG9QYWdlLCBtb3ZlV2l0aGluUGFnZSwgb3JkZXIsIHNvdXJjZVBhZ2VFbGVtZW50LCBzb3VyY2VTaXRlLCB0aGlzUGFnZUVsZW1lbnQ7XG4gICAgaXRlbUVsZW1lbnQgPSB1aS5pdGVtO1xuICAgIGl0ZW0gPSB3aWtpLmdldEl0ZW0oaXRlbUVsZW1lbnQpO1xuICAgIHRoaXNQYWdlRWxlbWVudCA9ICQodGhpcykucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICBzb3VyY2VQYWdlRWxlbWVudCA9IGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50Jyk7XG4gICAgc291cmNlU2l0ZSA9IHNvdXJjZVBhZ2VFbGVtZW50LmRhdGEoJ3NpdGUnKTtcbiAgICBkZXN0aW5hdGlvblBhZ2VFbGVtZW50ID0gaXRlbUVsZW1lbnQucGFyZW50cygnLnBhZ2U6Zmlyc3QnKTtcbiAgICBlcXVhbHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICByZXR1cm4gYSAmJiBiICYmIGEuZ2V0KDApID09PSBiLmdldCgwKTtcbiAgICB9O1xuICAgIG1vdmVXaXRoaW5QYWdlID0gIXNvdXJjZVBhZ2VFbGVtZW50IHx8IGVxdWFscyhzb3VyY2VQYWdlRWxlbWVudCwgZGVzdGluYXRpb25QYWdlRWxlbWVudCk7XG4gICAgbW92ZUZyb21QYWdlID0gIW1vdmVXaXRoaW5QYWdlICYmIGVxdWFscyh0aGlzUGFnZUVsZW1lbnQsIHNvdXJjZVBhZ2VFbGVtZW50KTtcbiAgICBtb3ZlVG9QYWdlID0gIW1vdmVXaXRoaW5QYWdlICYmIGVxdWFscyh0aGlzUGFnZUVsZW1lbnQsIGRlc3RpbmF0aW9uUGFnZUVsZW1lbnQpO1xuICAgIGlmIChtb3ZlRnJvbVBhZ2UpIHtcbiAgICAgIGlmIChzb3VyY2VQYWdlRWxlbWVudC5oYXNDbGFzcygnZ2hvc3QnKSB8fCBzb3VyY2VQYWdlRWxlbWVudC5hdHRyKCdpZCcpID09PSBkZXN0aW5hdGlvblBhZ2VFbGVtZW50LmF0dHIoJ2lkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICBhY3Rpb24gPSBtb3ZlV2l0aGluUGFnZSA/IChvcmRlciA9ICQodGhpcykuY2hpbGRyZW4oKS5tYXAoZnVuY3Rpb24oXywgdmFsdWUpIHtcbiAgICAgIHJldHVybiAkKHZhbHVlKS5hdHRyKCdkYXRhLWlkJyk7XG4gICAgfSkuZ2V0KCksIHtcbiAgICAgIHR5cGU6ICdtb3ZlJyxcbiAgICAgIG9yZGVyOiBvcmRlclxuICAgIH0pIDogbW92ZUZyb21QYWdlID8gKHdpa2kubG9nKCdkcmFnIGZyb20nLCBzb3VyY2VQYWdlRWxlbWVudC5maW5kKCdoMScpLnRleHQoKSksIHtcbiAgICAgIHR5cGU6ICdyZW1vdmUnXG4gICAgfSkgOiBtb3ZlVG9QYWdlID8gKGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JywgdGhpc1BhZ2VFbGVtZW50KSwgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJyksIGJlZm9yZSA9IHdpa2kuZ2V0SXRlbShiZWZvcmVFbGVtZW50KSwge1xuICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICBpdGVtOiBpdGVtLFxuICAgICAgYWZ0ZXI6IGJlZm9yZSAhPSBudWxsID8gYmVmb3JlLmlkIDogdm9pZCAwXG4gICAgfSkgOiB2b2lkIDA7XG4gICAgYWN0aW9uLmlkID0gaXRlbS5pZDtcbiAgICByZXR1cm4gcGFnZUhhbmRsZXIucHV0KHRoaXNQYWdlRWxlbWVudCwgYWN0aW9uKTtcbiAgfTtcblxuICBpbml0RHJhZ2dpbmcgPSBmdW5jdGlvbigkcGFnZSkge1xuICAgIHZhciAkc3Rvcnk7XG4gICAgJHN0b3J5ID0gJHBhZ2UuZmluZCgnLnN0b3J5Jyk7XG4gICAgcmV0dXJuICRzdG9yeS5zb3J0YWJsZSh7XG4gICAgICBjb25uZWN0V2l0aDogJy5wYWdlIC5zdG9yeSdcbiAgICB9KS5vbihcInNvcnR1cGRhdGVcIiwgaGFuZGxlRHJhZ2dpbmcpO1xuICB9O1xuXG4gIGluaXRBZGRCdXR0b24gPSBmdW5jdGlvbigkcGFnZSkge1xuICAgIHJldHVybiAkcGFnZS5maW5kKFwiLmFkZC1mYWN0b3J5XCIpLmxpdmUoXCJjbGlja1wiLCBmdW5jdGlvbihldnQpIHtcbiAgICAgIGlmICgkcGFnZS5oYXNDbGFzcygnZ2hvc3QnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBjcmVhdGVGYWN0b3J5KCRwYWdlKTtcbiAgICB9KTtcbiAgfTtcblxuICBjcmVhdGVGYWN0b3J5ID0gZnVuY3Rpb24oJHBhZ2UpIHtcbiAgICB2YXIgYmVmb3JlLCBiZWZvcmVFbGVtZW50LCBpdGVtLCBpdGVtRWxlbWVudDtcbiAgICBpdGVtID0ge1xuICAgICAgdHlwZTogXCJmYWN0b3J5XCIsXG4gICAgICBpZDogdXRpbC5yYW5kb21CeXRlcyg4KVxuICAgIH07XG4gICAgaXRlbUVsZW1lbnQgPSAkKFwiPGRpdiAvPlwiLCB7XG4gICAgICBcImNsYXNzXCI6IFwiaXRlbSBmYWN0b3J5XCJcbiAgICB9KS5kYXRhKCdpdGVtJywgaXRlbSkuYXR0cignZGF0YS1pZCcsIGl0ZW0uaWQpO1xuICAgIGl0ZW1FbGVtZW50LmRhdGEoJ3BhZ2VFbGVtZW50JywgJHBhZ2UpO1xuICAgICRwYWdlLmZpbmQoXCIuc3RvcnlcIikuYXBwZW5kKGl0ZW1FbGVtZW50KTtcbiAgICBwbHVnaW5bXCJkb1wiXShpdGVtRWxlbWVudCwgaXRlbSk7XG4gICAgYmVmb3JlRWxlbWVudCA9IGl0ZW1FbGVtZW50LnByZXYoJy5pdGVtJyk7XG4gICAgYmVmb3JlID0gd2lraS5nZXRJdGVtKGJlZm9yZUVsZW1lbnQpO1xuICAgIHJldHVybiBwYWdlSGFuZGxlci5wdXQoJHBhZ2UsIHtcbiAgICAgIGl0ZW06IGl0ZW0sXG4gICAgICBpZDogaXRlbS5pZCxcbiAgICAgIHR5cGU6IFwiYWRkXCIsXG4gICAgICBhZnRlcjogYmVmb3JlICE9IG51bGwgPyBiZWZvcmUuaWQgOiB2b2lkIDBcbiAgICB9KTtcbiAgfTtcblxuICBidWlsZFBhZ2VIZWFkZXIgPSBmdW5jdGlvbihfYXJnKSB7XG4gICAgdmFyIGZhdmljb25fc3JjLCBoZWFkZXJfaHJlZiwgcGFnZSwgdG9vbHRpcDtcbiAgICBwYWdlID0gX2FyZy5wYWdlLCB0b29sdGlwID0gX2FyZy50b29sdGlwLCBoZWFkZXJfaHJlZiA9IF9hcmcuaGVhZGVyX2hyZWYsIGZhdmljb25fc3JjID0gX2FyZy5mYXZpY29uX3NyYztcbiAgICBpZiAocGFnZS5wbHVnaW4pIHtcbiAgICAgIHRvb2x0aXAgKz0gXCJcXG5cIiArIHBhZ2UucGx1Z2luICsgXCIgcGx1Z2luXCI7XG4gICAgfVxuICAgIHJldHVybiBcIjxoMSB0aXRsZT1cXFwiXCIgKyB0b29sdGlwICsgXCJcXFwiPjxhIGhyZWY9XFxcIlwiICsgaGVhZGVyX2hyZWYgKyBcIlxcXCI+PGltZyBzcmM9XFxcIlwiICsgZmF2aWNvbl9zcmMgKyBcIlxcXCIgaGVpZ2h0PVxcXCIzMnB4XFxcIiBjbGFzcz1cXFwiZmF2aWNvblxcXCI+PC9hPiBcIiArIHBhZ2UudGl0bGUgKyBcIjwvaDE+XCI7XG4gIH07XG5cbiAgZW1pdEhlYWRlciA9IGZ1bmN0aW9uKCRoZWFkZXIsICRwYWdlLCBwYWdlT2JqZWN0KSB7XG4gICAgdmFyIGRhdGUsIGhlYWRlciwgaXNSZW1vdGVQYWdlLCBwYWdlLCBwYWdlSGVhZGVyLCByZXYsIHZpZXdIZXJlO1xuICAgIHBhZ2UgPSBwYWdlT2JqZWN0LmdldFJhd1BhZ2UoKTtcbiAgICBpc1JlbW90ZVBhZ2UgPSBwYWdlT2JqZWN0LmlzUmVtb3RlKCk7XG4gICAgaGVhZGVyID0gJyc7XG4gICAgdmlld0hlcmUgPSB3aWtpLmFzU2x1ZyhwYWdlLnRpdGxlKSA9PT0gJ3dlbGNvbWUtdmlzaXRvcnMnID8gXCJcIiA6IFwiL3ZpZXcvXCIgKyAocGFnZU9iamVjdC5nZXRTbHVnKCkpO1xuICAgIHBhZ2VIZWFkZXIgPSBpc1JlbW90ZVBhZ2UgPyBidWlsZFBhZ2VIZWFkZXIoe1xuICAgICAgdG9vbHRpcDogcGFnZU9iamVjdC5nZXRSZW1vdGVTaXRlKCksXG4gICAgICBoZWFkZXJfaHJlZjogXCIvL1wiICsgKHBhZ2VPYmplY3QuZ2V0UmVtb3RlU2l0ZSgpKSArIFwiL3ZpZXcvd2VsY29tZS12aXNpdG9yc1wiICsgdmlld0hlcmUsXG4gICAgICBmYXZpY29uX3NyYzogXCJodHRwOi8vXCIgKyAocGFnZU9iamVjdC5nZXRSZW1vdGVTaXRlKCkpICsgXCIvZmF2aWNvbi5wbmdcIixcbiAgICAgIHBhZ2U6IHBhZ2VcbiAgICB9KSA6IGJ1aWxkUGFnZUhlYWRlcih7XG4gICAgICB0b29sdGlwOiBsb2NhdGlvbi5ob3N0LFxuICAgICAgaGVhZGVyX2hyZWY6IFwiL3ZpZXcvd2VsY29tZS12aXNpdG9yc1wiICsgdmlld0hlcmUsXG4gICAgICBmYXZpY29uX3NyYzogXCIvZmF2aWNvbi5wbmdcIixcbiAgICAgIHBhZ2U6IHBhZ2VcbiAgICB9KTtcbiAgICAkaGVhZGVyLmFwcGVuZChwYWdlSGVhZGVyKTtcbiAgICBpZiAoIWlzUmVtb3RlUGFnZSkge1xuICAgICAgJCgnaW1nLmZhdmljb24nLCAkcGFnZSkuZXJyb3IoZnVuY3Rpb24oZSkge1xuICAgICAgICByZXR1cm4gcGx1Z2luLmdldCgnZmF2aWNvbicsIGZ1bmN0aW9uKGZhdmljb24pIHtcbiAgICAgICAgICByZXR1cm4gZmF2aWNvbi5jcmVhdGUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKCRwYWdlLmF0dHIoJ2lkJykubWF0Y2goL19yZXYvKSkge1xuICAgICAgcmV2ID0gcGFnZS5qb3VybmFsLmxlbmd0aCAtIDE7XG4gICAgICBkYXRlID0gcGFnZS5qb3VybmFsW3Jldl0uZGF0ZTtcbiAgICAgICRwYWdlLmFkZENsYXNzKCdnaG9zdCcpLmRhdGEoJ3JldicsIHJldik7XG4gICAgICByZXR1cm4gJGhlYWRlci5hcHBlbmQoJChcIjxoMiBjbGFzcz1cXFwicmV2aXNpb25cXFwiPlxcbiAgPHNwYW4+XFxuICAgIFwiICsgKGRhdGUgIT0gbnVsbCA/IHV0aWwuZm9ybWF0RGF0ZShkYXRlKSA6IFwiUmV2aXNpb24gXCIgKyByZXYpICsgXCJcXG4gIDwvc3Bhbj5cXG48L2gyPlwiKSk7XG4gICAgfVxuICB9O1xuXG4gIGVtaXRUd2lucyA9IHdpa2kuZW1pdFR3aW5zID0gZnVuY3Rpb24oJHBhZ2UpIHtcbiAgICB2YXIgYWN0aW9ucywgYmluLCBiaW5zLCBmbGFncywgaSwgaW5mbywgaXRlbSwgbGVnZW5kLCBwYWdlLCByZW1vdGVTaXRlLCBzaXRlLCBzbHVnLCB0d2lucywgdmlld2luZywgX2ksIF9sZW4sIF9yZWYsIF9yZWYxLCBfcmVmMiwgX3JlZjM7XG4gICAgcGFnZSA9ICRwYWdlLmRhdGEoJ2RhdGEnKTtcbiAgICBzaXRlID0gJHBhZ2UuZGF0YSgnc2l0ZScpIHx8IHdpbmRvdy5sb2NhdGlvbi5ob3N0O1xuICAgIGlmIChzaXRlID09PSAndmlldycgfHwgc2l0ZSA9PT0gJ29yaWdpbicpIHtcbiAgICAgIHNpdGUgPSB3aW5kb3cubG9jYXRpb24uaG9zdDtcbiAgICB9XG4gICAgc2x1ZyA9IHdpa2kuYXNTbHVnKHBhZ2UudGl0bGUpO1xuICAgIGlmICgoKGFjdGlvbnMgPSAoX3JlZiA9IHBhZ2Uuam91cm5hbCkgIT0gbnVsbCA/IF9yZWYubGVuZ3RoIDogdm9pZCAwKSAhPSBudWxsKSAmJiAoKHZpZXdpbmcgPSAoX3JlZjEgPSBwYWdlLmpvdXJuYWxbYWN0aW9ucyAtIDFdKSAhPSBudWxsID8gX3JlZjEuZGF0ZSA6IHZvaWQgMCkgIT0gbnVsbCkpIHtcbiAgICAgIHZpZXdpbmcgPSBNYXRoLmZsb29yKHZpZXdpbmcgLyAxMDAwKSAqIDEwMDA7XG4gICAgICBiaW5zID0ge1xuICAgICAgICBuZXdlcjogW10sXG4gICAgICAgIHNhbWU6IFtdLFxuICAgICAgICBvbGRlcjogW11cbiAgICAgIH07XG4gICAgICBfcmVmMiA9IHdpa2kubmVpZ2hib3Job29kO1xuICAgICAgZm9yIChyZW1vdGVTaXRlIGluIF9yZWYyKSB7XG4gICAgICAgIGluZm8gPSBfcmVmMltyZW1vdGVTaXRlXTtcbiAgICAgICAgaWYgKHJlbW90ZVNpdGUgIT09IHNpdGUgJiYgKGluZm8uc2l0ZW1hcCAhPSBudWxsKSkge1xuICAgICAgICAgIF9yZWYzID0gaW5mby5zaXRlbWFwO1xuICAgICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gX3JlZjMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBfcmVmM1tfaV07XG4gICAgICAgICAgICBpZiAoaXRlbS5zbHVnID09PSBzbHVnKSB7XG4gICAgICAgICAgICAgIGJpbiA9IGl0ZW0uZGF0ZSA+IHZpZXdpbmcgPyBiaW5zLm5ld2VyIDogaXRlbS5kYXRlIDwgdmlld2luZyA/IGJpbnMub2xkZXIgOiBiaW5zLnNhbWU7XG4gICAgICAgICAgICAgIGJpbi5wdXNoKHtcbiAgICAgICAgICAgICAgICByZW1vdGVTaXRlOiByZW1vdGVTaXRlLFxuICAgICAgICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0d2lucyA9IFtdO1xuICAgICAgZm9yIChsZWdlbmQgaW4gYmlucykge1xuICAgICAgICBiaW4gPSBiaW5zW2xlZ2VuZF07XG4gICAgICAgIGlmICghYmluLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGJpbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gYS5pdGVtLmRhdGUgPCBiLml0ZW0uZGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGZsYWdzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBfaiwgX2xlbjEsIF9yZWY0LCBfcmVzdWx0cztcbiAgICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICAgIGZvciAoaSA9IF9qID0gMCwgX2xlbjEgPSBiaW4ubGVuZ3RoOyBfaiA8IF9sZW4xOyBpID0gKytfaikge1xuICAgICAgICAgICAgX3JlZjQgPSBiaW5baV0sIHJlbW90ZVNpdGUgPSBfcmVmNC5yZW1vdGVTaXRlLCBpdGVtID0gX3JlZjQuaXRlbTtcbiAgICAgICAgICAgIGlmIChpID49IDgpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfcmVzdWx0cy5wdXNoKFwiPGltZyBjbGFzcz1cXFwicmVtb3RlXFxcIlxcbnNyYz1cXFwiaHR0cDovL1wiICsgcmVtb3RlU2l0ZSArIFwiL2Zhdmljb24ucG5nXFxcIlxcbmRhdGEtc2x1Zz1cXFwiXCIgKyBzbHVnICsgXCJcXFwiXFxuZGF0YS1zaXRlPVxcXCJcIiArIHJlbW90ZVNpdGUgKyBcIlxcXCJcXG50aXRsZT1cXFwiXCIgKyByZW1vdGVTaXRlICsgXCJcXFwiPlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgICB9KSgpO1xuICAgICAgICB0d2lucy5wdXNoKFwiXCIgKyAoZmxhZ3Muam9pbignJm5ic3A7JykpICsgXCIgXCIgKyBsZWdlbmQpO1xuICAgICAgfVxuICAgICAgaWYgKHR3aW5zKSB7XG4gICAgICAgIHJldHVybiAkcGFnZS5maW5kKCcudHdpbnMnKS5odG1sKFwiPHA+XCIgKyAodHdpbnMuam9pbihcIiwgXCIpKSArIFwiPC9wPlwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmVuZGVyUGFnZUludG9QYWdlRWxlbWVudCA9IGZ1bmN0aW9uKHBhZ2VPYmplY3QsICRwYWdlKSB7XG4gICAgdmFyICRmb290ZXIsICRoZWFkZXIsICRqb3VybmFsLCAkc3RvcnksICR0d2lucywgaG9zdCwgc2x1ZywgX3JlZjtcbiAgICAkcGFnZS5kYXRhKFwiZGF0YVwiLCBwYWdlT2JqZWN0LmdldFJhd1BhZ2UoKSk7XG4gICAgaWYgKHBhZ2VPYmplY3QuaXNSZW1vdGUoKSkge1xuICAgICAgJHBhZ2UuZGF0YShcInNpdGVcIiwgcGFnZU9iamVjdC5nZXRSZW1vdGVTaXRlKCkpO1xuICAgIH1cbiAgICBzbHVnID0gJHBhZ2UuYXR0cignaWQnKTtcbiAgICB3aWtpLnJlc29sdXRpb25Db250ZXh0ID0gcGFnZU9iamVjdC5nZXRDb250ZXh0KCk7XG4gICAgJHBhZ2UuZW1wdHkoKTtcbiAgICBfcmVmID0gWyd0d2lucycsICdoZWFkZXInLCAnc3RvcnknLCAnam91cm5hbCcsICdmb290ZXInXS5tYXAoZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICByZXR1cm4gJChcIjxkaXYgLz5cIikuYWRkQ2xhc3MoY2xhc3NOYW1lKS5hcHBlbmRUbygkcGFnZSk7XG4gICAgfSksICR0d2lucyA9IF9yZWZbMF0sICRoZWFkZXIgPSBfcmVmWzFdLCAkc3RvcnkgPSBfcmVmWzJdLCAkam91cm5hbCA9IF9yZWZbM10sICRmb290ZXIgPSBfcmVmWzRdO1xuICAgIGVtaXRIZWFkZXIoJGhlYWRlciwgJHBhZ2UsIHBhZ2VPYmplY3QpO1xuICAgIHBhZ2VPYmplY3Quc2VxSXRlbXMoZnVuY3Rpb24oaXRlbSwgZG9uZSkge1xuICAgICAgdmFyICRpdGVtO1xuICAgICAgaWYgKChpdGVtICE9IG51bGwgPyBpdGVtLnR5cGUgOiB2b2lkIDApICYmIChpdGVtICE9IG51bGwgPyBpdGVtLmlkIDogdm9pZCAwKSkge1xuICAgICAgICAkaXRlbSA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJpdGVtIFwiICsgaXRlbS50eXBlICsgXCJcXFwiIGRhdGEtaWQ9XFxcIlwiICsgaXRlbS5pZCArIFwiXFxcIj5cIik7XG4gICAgICAgICRzdG9yeS5hcHBlbmQoJGl0ZW0pO1xuICAgICAgICByZXR1cm4gcGx1Z2luW1wiZG9cIl0oJGl0ZW0sIGl0ZW0sIGRvbmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJHN0b3J5LmFwcGVuZCgkKFwiPGRpdj48cCBjbGFzcz1cXFwiZXJyb3JcXFwiPkNhbid0IG1ha2Ugc2Vuc2Ugb2Ygc3RvcnlbXCIgKyBpICsgXCJdPC9wPjwvZGl2PlwiKSk7XG4gICAgICAgIHJldHVybiBkb25lKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcGFnZU9iamVjdC5zZXFBY3Rpb25zKGZ1bmN0aW9uKGVhY2gsIGRvbmUpIHtcbiAgICAgIGlmIChlYWNoLnNlcGFyYXRvcikge1xuICAgICAgICBhZGRUb0pvdXJuYWwoJGpvdXJuYWwsIGVhY2guc2VwYXJhdG9yKTtcbiAgICAgIH1cbiAgICAgIGFkZFRvSm91cm5hbCgkam91cm5hbCwgZWFjaC5hY3Rpb24pO1xuICAgICAgcmV0dXJuIGRvbmUoKTtcbiAgICB9KTtcbiAgICBlbWl0VHdpbnMoJHBhZ2UpO1xuICAgICRqb3VybmFsLmFwcGVuZChcIjxkaXYgY2xhc3M9XFxcImNvbnRyb2wtYnV0dG9uc1xcXCI+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGZvcmstcGFnZVxcXCIgdGl0bGU9XFxcImZvcmsgdGhpcyBwYWdlXFxcIj5cIiArIHV0aWwuc3ltYm9sc1snZm9yayddICsgXCI8L2E+XFxuICA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnV0dG9uIGFkZC1mYWN0b3J5XFxcIiB0aXRsZT1cXFwiYWRkIHBhcmFncmFwaFxcXCI+XCIgKyB1dGlsLnN5bWJvbHNbJ2FkZCddICsgXCI8L2E+XFxuPC9kaXY+XCIpO1xuICAgIGhvc3QgPSBwYWdlT2JqZWN0LmdldFJlbW90ZVNpdGUoKSB8fCBsb2NhdGlvbi5ob3N0O1xuICAgIHJldHVybiAkZm9vdGVyLmFwcGVuZChcIjxhIGlkPVxcXCJsaWNlbnNlXFxcIiBocmVmPVxcXCJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS1zYS8zLjAvXFxcIj5DQyBCWS1TQSAzLjA8L2E+IC5cXG48YSBjbGFzcz1cXFwic2hvdy1wYWdlLXNvdXJjZVxcXCIgaHJlZj1cXFwiL1wiICsgc2x1ZyArIFwiLmpzb24/cmFuZG9tPVwiICsgKHV0aWwucmFuZG9tQnl0ZXMoNCkpICsgXCJcXFwiIHRpdGxlPVxcXCJzb3VyY2VcXFwiPkpTT048L2E+IC5cXG48YSBocmVmPSBcXFwiLy9cIiArIGhvc3QgKyBcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIj5cIiArIGhvc3QgKyBcIjwvYT5cIik7XG4gIH07XG5cbiAgd2lraS5idWlsZFBhZ2UgPSBmdW5jdGlvbihwYWdlT2JqZWN0LCAkcGFnZSkge1xuICAgIGlmIChwYWdlT2JqZWN0LmlzTG9jYWwoKSkge1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ2xvY2FsJyk7XG4gICAgfVxuICAgIGlmIChwYWdlT2JqZWN0LmlzUmVtb3RlKCkpIHtcbiAgICAgICRwYWdlLmFkZENsYXNzKCdyZW1vdGUnKTtcbiAgICB9XG4gICAgaWYgKHBhZ2VPYmplY3QuaXNQbHVnaW4oKSkge1xuICAgICAgJHBhZ2UuYWRkQ2xhc3MoJ3BsdWdpbicpO1xuICAgIH1cbiAgICByZW5kZXJQYWdlSW50b1BhZ2VFbGVtZW50KHBhZ2VPYmplY3QsICRwYWdlKTtcbiAgICBzdGF0ZS5zZXRVcmwoKTtcbiAgICBpbml0RHJhZ2dpbmcoJHBhZ2UpO1xuICAgIGluaXRBZGRCdXR0b24oJHBhZ2UpO1xuICAgIHJldHVybiAkcGFnZTtcbiAgfTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IHJlZnJlc2ggPSB3aWtpLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJHBhZ2UsIGNyZWF0ZUdob3N0UGFnZSwgZW1wdHlQYWdlLCBwYWdlSW5mb3JtYXRpb24sIHJldiwgc2x1Zywgd2hlbkdvdHRlbiwgX3JlZjtcbiAgICAkcGFnZSA9ICQodGhpcyk7XG4gICAgX3JlZiA9ICRwYWdlLmF0dHIoJ2lkJykuc3BsaXQoJ19yZXYnKSwgc2x1ZyA9IF9yZWZbMF0sIHJldiA9IF9yZWZbMV07XG4gICAgcGFnZUluZm9ybWF0aW9uID0ge1xuICAgICAgc2x1Zzogc2x1ZyxcbiAgICAgIHJldjogcmV2LFxuICAgICAgc2l0ZTogJHBhZ2UuZGF0YSgnc2l0ZScpXG4gICAgfTtcbiAgICBlbXB0eVBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKS5lbXB0eVBhZ2U7XG4gICAgY3JlYXRlR2hvc3RQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaGl0LCBoaXRzLCBpbmZvLCBwYWdlT2JqZWN0LCByZXN1bHQsIHNpdGUsIHRpdGxlLCBfaSwgX2xlbiwgX3JlZjE7XG4gICAgICB0aXRsZSA9ICQoXCJhW2hyZWY9XFxcIi9cIiArIHNsdWcgKyBcIi5odG1sXFxcIl06bGFzdFwiKS50ZXh0KCkgfHwgc2x1ZztcbiAgICAgIHBhZ2VPYmplY3QgPSBlbXB0eVBhZ2UoKTtcbiAgICAgIHBhZ2VPYmplY3Quc2V0VGl0bGUodGl0bGUpO1xuICAgICAgaGl0cyA9IFtdO1xuICAgICAgX3JlZjEgPSB3aWtpLm5laWdoYm9yaG9vZDtcbiAgICAgIGZvciAoc2l0ZSBpbiBfcmVmMSkge1xuICAgICAgICBpbmZvID0gX3JlZjFbc2l0ZV07XG4gICAgICAgIGlmIChpbmZvLnNpdGVtYXAgIT0gbnVsbCkge1xuICAgICAgICAgIHJlc3VsdCA9IF8uZmluZChpbmZvLnNpdGVtYXAsIGZ1bmN0aW9uKGVhY2gpIHtcbiAgICAgICAgICAgIHJldHVybiBlYWNoLnNsdWcgPT09IHNsdWc7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBoaXRzLnB1c2goe1xuICAgICAgICAgICAgICBcInR5cGVcIjogXCJyZWZlcmVuY2VcIixcbiAgICAgICAgICAgICAgXCJzaXRlXCI6IHNpdGUsXG4gICAgICAgICAgICAgIFwic2x1Z1wiOiBzbHVnLFxuICAgICAgICAgICAgICBcInRpdGxlXCI6IHJlc3VsdC50aXRsZSB8fCBzbHVnLFxuICAgICAgICAgICAgICBcInRleHRcIjogcmVzdWx0LnN5bm9wc2lzIHx8ICcnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChoaXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcGFnZU9iamVjdC5hZGRJdGVtKHtcbiAgICAgICAgICAndHlwZSc6ICdmdXR1cmUnLFxuICAgICAgICAgICd0ZXh0JzogJ1dlIGNvdWxkIG5vdCBmaW5kIHRoaXMgcGFnZSBpbiB0aGUgZXhwZWN0ZWQgY29udGV4dC4nLFxuICAgICAgICAgICd0aXRsZSc6IHRpdGxlXG4gICAgICAgIH0pO1xuICAgICAgICBwYWdlT2JqZWN0LmFkZEl0ZW0oe1xuICAgICAgICAgICd0eXBlJzogJ3BhcmFncmFwaCcsXG4gICAgICAgICAgJ3RleHQnOiBcIldlIGRpZCBmaW5kIHRoZSBwYWdlIGluIHlvdXIgY3VycmVudCBuZWlnaGJvcmhvb2QuXCJcbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gaGl0cy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICAgIGhpdCA9IGhpdHNbX2ldO1xuICAgICAgICAgIHBhZ2VPYmplY3QuYWRkSXRlbShoaXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlT2JqZWN0LmFkZEl0ZW0oe1xuICAgICAgICAgICd0eXBlJzogJ2Z1dHVyZScsXG4gICAgICAgICAgJ3RleHQnOiAnV2UgY291bGQgbm90IGZpbmQgdGhpcyBwYWdlLicsXG4gICAgICAgICAgJ3RpdGxlJzogdGl0bGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UpLmFkZENsYXNzKCdnaG9zdCcpO1xuICAgIH07XG4gICAgd2hlbkdvdHRlbiA9IGZ1bmN0aW9uKHBhZ2VPYmplY3QpIHtcbiAgICAgIHZhciBzaXRlLCBfaSwgX2xlbiwgX3JlZjEsIF9yZXN1bHRzO1xuICAgICAgd2lraS5idWlsZFBhZ2UocGFnZU9iamVjdCwgJHBhZ2UpO1xuICAgICAgX3JlZjEgPSBwYWdlT2JqZWN0LmdldE5laWdoYm9ycyhsb2NhdGlvbi5ob3N0KTtcbiAgICAgIF9yZXN1bHRzID0gW107XG4gICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IF9yZWYxLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHNpdGUgPSBfcmVmMVtfaV07XG4gICAgICAgIF9yZXN1bHRzLnB1c2gobmVpZ2hib3Job29kLnJlZ2lzdGVyTmVpZ2hib3Ioc2l0ZSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgIH07XG4gICAgcmV0dXJuIHBhZ2VIYW5kbGVyLmdldCh7XG4gICAgICB3aGVuR290dGVuOiB3aGVuR290dGVuLFxuICAgICAgd2hlbk5vdEdvdHRlbjogY3JlYXRlR2hvc3RQYWdlLFxuICAgICAgcGFnZUluZm9ybWF0aW9uOiBwYWdlSW5mb3JtYXRpb25cbiAgICB9KTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpey8vICAgICBVbmRlcnNjb3JlLmpzIDEuNS4yXG4vLyAgICAgaHR0cDovL3VuZGVyc2NvcmVqcy5vcmdcbi8vICAgICAoYykgMjAwOS0yMDEzIEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4vLyAgICAgVW5kZXJzY29yZSBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cblxuKGZ1bmN0aW9uKCkge1xuXG4gIC8vIEJhc2VsaW5lIHNldHVwXG4gIC8vIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gRXN0YWJsaXNoIHRoZSByb290IG9iamVjdCwgYHdpbmRvd2AgaW4gdGhlIGJyb3dzZXIsIG9yIGBleHBvcnRzYCBvbiB0aGUgc2VydmVyLlxuICB2YXIgcm9vdCA9IHRoaXM7XG5cbiAgLy8gU2F2ZSB0aGUgcHJldmlvdXMgdmFsdWUgb2YgdGhlIGBfYCB2YXJpYWJsZS5cbiAgdmFyIHByZXZpb3VzVW5kZXJzY29yZSA9IHJvb3QuXztcblxuICAvLyBFc3RhYmxpc2ggdGhlIG9iamVjdCB0aGF0IGdldHMgcmV0dXJuZWQgdG8gYnJlYWsgb3V0IG9mIGEgbG9vcCBpdGVyYXRpb24uXG4gIHZhciBicmVha2VyID0ge307XG5cbiAgLy8gU2F2ZSBieXRlcyBpbiB0aGUgbWluaWZpZWQgKGJ1dCBub3QgZ3ppcHBlZCkgdmVyc2lvbjpcbiAgdmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZSwgRnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlO1xuXG4gIC8vIENyZWF0ZSBxdWljayByZWZlcmVuY2UgdmFyaWFibGVzIGZvciBzcGVlZCBhY2Nlc3MgdG8gY29yZSBwcm90b3R5cGVzLlxuICB2YXJcbiAgICBwdXNoICAgICAgICAgICAgID0gQXJyYXlQcm90by5wdXNoLFxuICAgIHNsaWNlICAgICAgICAgICAgPSBBcnJheVByb3RvLnNsaWNlLFxuICAgIGNvbmNhdCAgICAgICAgICAgPSBBcnJheVByb3RvLmNvbmNhdCxcbiAgICB0b1N0cmluZyAgICAgICAgID0gT2JqUHJvdG8udG9TdHJpbmcsXG4gICAgaGFzT3duUHJvcGVydHkgICA9IE9ialByb3RvLmhhc093blByb3BlcnR5O1xuXG4gIC8vIEFsbCAqKkVDTUFTY3JpcHQgNSoqIG5hdGl2ZSBmdW5jdGlvbiBpbXBsZW1lbnRhdGlvbnMgdGhhdCB3ZSBob3BlIHRvIHVzZVxuICAvLyBhcmUgZGVjbGFyZWQgaGVyZS5cbiAgdmFyXG4gICAgbmF0aXZlRm9yRWFjaCAgICAgID0gQXJyYXlQcm90by5mb3JFYWNoLFxuICAgIG5hdGl2ZU1hcCAgICAgICAgICA9IEFycmF5UHJvdG8ubWFwLFxuICAgIG5hdGl2ZVJlZHVjZSAgICAgICA9IEFycmF5UHJvdG8ucmVkdWNlLFxuICAgIG5hdGl2ZVJlZHVjZVJpZ2h0ICA9IEFycmF5UHJvdG8ucmVkdWNlUmlnaHQsXG4gICAgbmF0aXZlRmlsdGVyICAgICAgID0gQXJyYXlQcm90by5maWx0ZXIsXG4gICAgbmF0aXZlRXZlcnkgICAgICAgID0gQXJyYXlQcm90by5ldmVyeSxcbiAgICBuYXRpdmVTb21lICAgICAgICAgPSBBcnJheVByb3RvLnNvbWUsXG4gICAgbmF0aXZlSW5kZXhPZiAgICAgID0gQXJyYXlQcm90by5pbmRleE9mLFxuICAgIG5hdGl2ZUxhc3RJbmRleE9mICA9IEFycmF5UHJvdG8ubGFzdEluZGV4T2YsXG4gICAgbmF0aXZlSXNBcnJheSAgICAgID0gQXJyYXkuaXNBcnJheSxcbiAgICBuYXRpdmVLZXlzICAgICAgICAgPSBPYmplY3Qua2V5cyxcbiAgICBuYXRpdmVCaW5kICAgICAgICAgPSBGdW5jUHJvdG8uYmluZDtcblxuICAvLyBDcmVhdGUgYSBzYWZlIHJlZmVyZW5jZSB0byB0aGUgVW5kZXJzY29yZSBvYmplY3QgZm9yIHVzZSBiZWxvdy5cbiAgdmFyIF8gPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgXykgcmV0dXJuIG9iajtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgXykpIHJldHVybiBuZXcgXyhvYmopO1xuICAgIHRoaXMuX3dyYXBwZWQgPSBvYmo7XG4gIH07XG5cbiAgLy8gRXhwb3J0IHRoZSBVbmRlcnNjb3JlIG9iamVjdCBmb3IgKipOb2RlLmpzKiosIHdpdGhcbiAgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIHRoZSBvbGQgYHJlcXVpcmUoKWAgQVBJLiBJZiB3ZSdyZSBpblxuICAvLyB0aGUgYnJvd3NlciwgYWRkIGBfYCBhcyBhIGdsb2JhbCBvYmplY3QgdmlhIGEgc3RyaW5nIGlkZW50aWZpZXIsXG4gIC8vIGZvciBDbG9zdXJlIENvbXBpbGVyIFwiYWR2YW5jZWRcIiBtb2RlLlxuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICBleHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfO1xuICAgIH1cbiAgICBleHBvcnRzLl8gPSBfO1xuICB9IGVsc2Uge1xuICAgIHJvb3QuXyA9IF87XG4gIH1cblxuICAvLyBDdXJyZW50IHZlcnNpb24uXG4gIF8uVkVSU0lPTiA9ICcxLjUuMic7XG5cbiAgLy8gQ29sbGVjdGlvbiBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUaGUgY29ybmVyc3RvbmUsIGFuIGBlYWNoYCBpbXBsZW1lbnRhdGlvbiwgYWthIGBmb3JFYWNoYC5cbiAgLy8gSGFuZGxlcyBvYmplY3RzIHdpdGggdGhlIGJ1aWx0LWluIGBmb3JFYWNoYCwgYXJyYXlzLCBhbmQgcmF3IG9iamVjdHMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBmb3JFYWNoYCBpZiBhdmFpbGFibGUuXG4gIHZhciBlYWNoID0gXy5lYWNoID0gXy5mb3JFYWNoID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuO1xuICAgIGlmIChuYXRpdmVGb3JFYWNoICYmIG9iai5mb3JFYWNoID09PSBuYXRpdmVGb3JFYWNoKSB7XG4gICAgICBvYmouZm9yRWFjaChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IG9iai5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaikgPT09IGJyZWFrZXIpIHJldHVybjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBrZXlzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtrZXlzW2ldXSwga2V5c1tpXSwgb2JqKSA9PT0gYnJlYWtlcikgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIHJlc3VsdHMgb2YgYXBwbHlpbmcgdGhlIGl0ZXJhdG9yIHRvIGVhY2ggZWxlbWVudC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYG1hcGAgaWYgYXZhaWxhYmxlLlxuICBfLm1hcCA9IF8uY29sbGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XG4gICAgaWYgKG5hdGl2ZU1hcCAmJiBvYmoubWFwID09PSBuYXRpdmVNYXApIHJldHVybiBvYmoubWFwKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICB2YXIgcmVkdWNlRXJyb3IgPSAnUmVkdWNlIG9mIGVtcHR5IGFycmF5IHdpdGggbm8gaW5pdGlhbCB2YWx1ZSc7XG5cbiAgLy8gKipSZWR1Y2UqKiBidWlsZHMgdXAgYSBzaW5nbGUgcmVzdWx0IGZyb20gYSBsaXN0IG9mIHZhbHVlcywgYWthIGBpbmplY3RgLFxuICAvLyBvciBgZm9sZGxgLiBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgcmVkdWNlYCBpZiBhdmFpbGFibGUuXG4gIF8ucmVkdWNlID0gXy5mb2xkbCA9IF8uaW5qZWN0ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgbWVtbywgY29udGV4dCkge1xuICAgIHZhciBpbml0aWFsID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XG4gICAgaWYgKG9iaiA9PSBudWxsKSBvYmogPSBbXTtcbiAgICBpZiAobmF0aXZlUmVkdWNlICYmIG9iai5yZWR1Y2UgPT09IG5hdGl2ZVJlZHVjZSkge1xuICAgICAgaWYgKGNvbnRleHQpIGl0ZXJhdG9yID0gXy5iaW5kKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiBpbml0aWFsID8gb2JqLnJlZHVjZShpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlKGl0ZXJhdG9yKTtcbiAgICB9XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCFpbml0aWFsKSB7XG4gICAgICAgIG1lbW8gPSB2YWx1ZTtcbiAgICAgICAgaW5pdGlhbCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZW1vID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCBtZW1vLCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gVGhlIHJpZ2h0LWFzc29jaWF0aXZlIHZlcnNpb24gb2YgcmVkdWNlLCBhbHNvIGtub3duIGFzIGBmb2xkcmAuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGByZWR1Y2VSaWdodGAgaWYgYXZhaWxhYmxlLlxuICBfLnJlZHVjZVJpZ2h0ID0gXy5mb2xkciA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIG1lbW8sIGNvbnRleHQpIHtcbiAgICB2YXIgaW5pdGlhbCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICAgIGlmIChvYmogPT0gbnVsbCkgb2JqID0gW107XG4gICAgaWYgKG5hdGl2ZVJlZHVjZVJpZ2h0ICYmIG9iai5yZWR1Y2VSaWdodCA9PT0gbmF0aXZlUmVkdWNlUmlnaHQpIHtcbiAgICAgIGlmIChjb250ZXh0KSBpdGVyYXRvciA9IF8uYmluZChpdGVyYXRvciwgY29udGV4dCk7XG4gICAgICByZXR1cm4gaW5pdGlhbCA/IG9iai5yZWR1Y2VSaWdodChpdGVyYXRvciwgbWVtbykgOiBvYmoucmVkdWNlUmlnaHQoaXRlcmF0b3IpO1xuICAgIH1cbiAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICBpZiAobGVuZ3RoICE9PSArbGVuZ3RoKSB7XG4gICAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgICAgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIGluZGV4ID0ga2V5cyA/IGtleXNbLS1sZW5ndGhdIDogLS1sZW5ndGg7XG4gICAgICBpZiAoIWluaXRpYWwpIHtcbiAgICAgICAgbWVtbyA9IG9ialtpbmRleF07XG4gICAgICAgIGluaXRpYWwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVtbyA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgbWVtbywgb2JqW2luZGV4XSwgaW5kZXgsIGxpc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghaW5pdGlhbCkgdGhyb3cgbmV3IFR5cGVFcnJvcihyZWR1Y2VFcnJvcik7XG4gICAgcmV0dXJuIG1lbW87XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBmaXJzdCB2YWx1ZSB3aGljaCBwYXNzZXMgYSB0cnV0aCB0ZXN0LiBBbGlhc2VkIGFzIGBkZXRlY3RgLlxuICBfLmZpbmQgPSBfLmRldGVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIGFueShvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkge1xuICAgICAgICByZXN1bHQgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyB0aGF0IHBhc3MgYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZmlsdGVyYCBpZiBhdmFpbGFibGUuXG4gIC8vIEFsaWFzZWQgYXMgYHNlbGVjdGAuXG4gIF8uZmlsdGVyID0gXy5zZWxlY3QgPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHRzO1xuICAgIGlmIChuYXRpdmVGaWx0ZXIgJiYgb2JqLmZpbHRlciA9PT0gbmF0aXZlRmlsdGVyKSByZXR1cm4gb2JqLmZpbHRlcihpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkgcmVzdWx0cy5wdXNoKHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBSZXR1cm4gYWxsIHRoZSBlbGVtZW50cyBmb3Igd2hpY2ggYSB0cnV0aCB0ZXN0IGZhaWxzLlxuICBfLnJlamVjdCA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gXy5maWx0ZXIob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiAhaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpO1xuICAgIH0sIGNvbnRleHQpO1xuICB9O1xuXG4gIC8vIERldGVybWluZSB3aGV0aGVyIGFsbCBvZiB0aGUgZWxlbWVudHMgbWF0Y2ggYSB0cnV0aCB0ZXN0LlxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgZXZlcnlgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYWxsYC5cbiAgXy5ldmVyeSA9IF8uYWxsID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSB0cnVlO1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgICBpZiAobmF0aXZlRXZlcnkgJiYgb2JqLmV2ZXJ5ID09PSBuYXRpdmVFdmVyeSkgcmV0dXJuIG9iai5ldmVyeShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKCEocmVzdWx0ID0gcmVzdWx0ICYmIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSkpIHJldHVybiBicmVha2VyO1xuICAgIH0pO1xuICAgIHJldHVybiAhIXJlc3VsdDtcbiAgfTtcblxuICAvLyBEZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIGVsZW1lbnQgaW4gdGhlIG9iamVjdCBtYXRjaGVzIGEgdHJ1dGggdGVzdC5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYHNvbWVgIGlmIGF2YWlsYWJsZS5cbiAgLy8gQWxpYXNlZCBhcyBgYW55YC5cbiAgdmFyIGFueSA9IF8uc29tZSA9IF8uYW55ID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGl0ZXJhdG9yIHx8IChpdGVyYXRvciA9IF8uaWRlbnRpdHkpO1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiByZXN1bHQ7XG4gICAgaWYgKG5hdGl2ZVNvbWUgJiYgb2JqLnNvbWUgPT09IG5hdGl2ZVNvbWUpIHJldHVybiBvYmouc29tZShpdGVyYXRvciwgY29udGV4dCk7XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgaWYgKHJlc3VsdCB8fCAocmVzdWx0ID0gaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpKSkgcmV0dXJuIGJyZWFrZXI7XG4gICAgfSk7XG4gICAgcmV0dXJuICEhcmVzdWx0O1xuICB9O1xuXG4gIC8vIERldGVybWluZSBpZiB0aGUgYXJyYXkgb3Igb2JqZWN0IGNvbnRhaW5zIGEgZ2l2ZW4gdmFsdWUgKHVzaW5nIGA9PT1gKS5cbiAgLy8gQWxpYXNlZCBhcyBgaW5jbHVkZWAuXG4gIF8uY29udGFpbnMgPSBfLmluY2x1ZGUgPSBmdW5jdGlvbihvYmosIHRhcmdldCkge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIG9iai5pbmRleE9mID09PSBuYXRpdmVJbmRleE9mKSByZXR1cm4gb2JqLmluZGV4T2YodGFyZ2V0KSAhPSAtMTtcbiAgICByZXR1cm4gYW55KG9iaiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gdGFyZ2V0O1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIEludm9rZSBhIG1ldGhvZCAod2l0aCBhcmd1bWVudHMpIG9uIGV2ZXJ5IGl0ZW0gaW4gYSBjb2xsZWN0aW9uLlxuICBfLmludm9rZSA9IGZ1bmN0aW9uKG9iaiwgbWV0aG9kKSB7XG4gICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGlzRnVuYyA9IF8uaXNGdW5jdGlvbihtZXRob2QpO1xuICAgIHJldHVybiBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gKGlzRnVuYyA/IG1ldGhvZCA6IHZhbHVlW21ldGhvZF0pLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBtYXBgOiBmZXRjaGluZyBhIHByb3BlcnR5LlxuICBfLnBsdWNrID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSl7IHJldHVybiB2YWx1ZVtrZXldOyB9KTtcbiAgfTtcblxuICAvLyBDb252ZW5pZW5jZSB2ZXJzaW9uIG9mIGEgY29tbW9uIHVzZSBjYXNlIG9mIGBmaWx0ZXJgOiBzZWxlY3Rpbmcgb25seSBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgc3BlY2lmaWMgYGtleTp2YWx1ZWAgcGFpcnMuXG4gIF8ud2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzLCBmaXJzdCkge1xuICAgIGlmIChfLmlzRW1wdHkoYXR0cnMpKSByZXR1cm4gZmlyc3QgPyB2b2lkIDAgOiBbXTtcbiAgICByZXR1cm4gX1tmaXJzdCA/ICdmaW5kJyA6ICdmaWx0ZXInXShvYmosIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgaWYgKGF0dHJzW2tleV0gIT09IHZhbHVlW2tleV0pIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIENvbnZlbmllbmNlIHZlcnNpb24gb2YgYSBjb21tb24gdXNlIGNhc2Ugb2YgYGZpbmRgOiBnZXR0aW5nIHRoZSBmaXJzdCBvYmplY3RcbiAgLy8gY29udGFpbmluZyBzcGVjaWZpYyBga2V5OnZhbHVlYCBwYWlycy5cbiAgXy5maW5kV2hlcmUgPSBmdW5jdGlvbihvYmosIGF0dHJzKSB7XG4gICAgcmV0dXJuIF8ud2hlcmUob2JqLCBhdHRycywgdHJ1ZSk7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBtYXhpbXVtIGVsZW1lbnQgb3IgKGVsZW1lbnQtYmFzZWQgY29tcHV0YXRpb24pLlxuICAvLyBDYW4ndCBvcHRpbWl6ZSBhcnJheXMgb2YgaW50ZWdlcnMgbG9uZ2VyIHRoYW4gNjUsNTM1IGVsZW1lbnRzLlxuICAvLyBTZWUgW1dlYktpdCBCdWcgODA3OTddKGh0dHBzOi8vYnVncy53ZWJraXQub3JnL3Nob3dfYnVnLmNnaT9pZD04MDc5NylcbiAgXy5tYXggPSBmdW5jdGlvbihvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzQXJyYXkob2JqKSAmJiBvYmpbMF0gPT09ICtvYmpbMF0gJiYgb2JqLmxlbmd0aCA8IDY1NTM1KSB7XG4gICAgICByZXR1cm4gTWF0aC5tYXguYXBwbHkoTWF0aCwgb2JqKTtcbiAgICB9XG4gICAgaWYgKCFpdGVyYXRvciAmJiBfLmlzRW1wdHkob2JqKSkgcmV0dXJuIC1JbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogLUluZmluaXR5LCB2YWx1ZTogLUluZmluaXR5fTtcbiAgICBlYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGluZGV4LCBsaXN0KSB7XG4gICAgICB2YXIgY29tcHV0ZWQgPSBpdGVyYXRvciA/IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBsaXN0KSA6IHZhbHVlO1xuICAgICAgY29tcHV0ZWQgPiByZXN1bHQuY29tcHV0ZWQgJiYgKHJlc3VsdCA9IHt2YWx1ZSA6IHZhbHVlLCBjb21wdXRlZCA6IGNvbXB1dGVkfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbiAgfTtcblxuICAvLyBSZXR1cm4gdGhlIG1pbmltdW0gZWxlbWVudCAob3IgZWxlbWVudC1iYXNlZCBjb21wdXRhdGlvbikuXG4gIF8ubWluID0gZnVuY3Rpb24ob2JqLCBpdGVyYXRvciwgY29udGV4dCkge1xuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0FycmF5KG9iaikgJiYgb2JqWzBdID09PSArb2JqWzBdICYmIG9iai5sZW5ndGggPCA2NTUzNSkge1xuICAgICAgcmV0dXJuIE1hdGgubWluLmFwcGx5KE1hdGgsIG9iaik7XG4gICAgfVxuICAgIGlmICghaXRlcmF0b3IgJiYgXy5pc0VtcHR5KG9iaikpIHJldHVybiBJbmZpbml0eTtcbiAgICB2YXIgcmVzdWx0ID0ge2NvbXB1dGVkIDogSW5maW5pdHksIHZhbHVlOiBJbmZpbml0eX07XG4gICAgZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgbGlzdCkge1xuICAgICAgdmFyIGNvbXB1dGVkID0gaXRlcmF0b3IgPyBpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkgOiB2YWx1ZTtcbiAgICAgIGNvbXB1dGVkIDwgcmVzdWx0LmNvbXB1dGVkICYmIChyZXN1bHQgPSB7dmFsdWUgOiB2YWx1ZSwgY29tcHV0ZWQgOiBjb21wdXRlZH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHQudmFsdWU7XG4gIH07XG5cbiAgLy8gU2h1ZmZsZSBhbiBhcnJheSwgdXNpbmcgdGhlIG1vZGVybiB2ZXJzaW9uIG9mIHRoZSBcbiAgLy8gW0Zpc2hlci1ZYXRlcyBzaHVmZmxlXShodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Zpc2hlcuKAk1lhdGVzX3NodWZmbGUpLlxuICBfLnNodWZmbGUgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmFuZDtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBzaHVmZmxlZCA9IFtdO1xuICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcmFuZCA9IF8ucmFuZG9tKGluZGV4KyspO1xuICAgICAgc2h1ZmZsZWRbaW5kZXggLSAxXSA9IHNodWZmbGVkW3JhbmRdO1xuICAgICAgc2h1ZmZsZWRbcmFuZF0gPSB2YWx1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2h1ZmZsZWQ7XG4gIH07XG5cbiAgLy8gU2FtcGxlICoqbioqIHJhbmRvbSB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgLy8gSWYgKipuKiogaXMgbm90IHNwZWNpZmllZCwgcmV0dXJucyBhIHNpbmdsZSByYW5kb20gZWxlbWVudCBmcm9tIHRoZSBhcnJheS5cbiAgLy8gVGhlIGludGVybmFsIGBndWFyZGAgYXJndW1lbnQgYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgbWFwYC5cbiAgXy5zYW1wbGUgPSBmdW5jdGlvbihvYmosIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyIHx8IGd1YXJkKSB7XG4gICAgICByZXR1cm4gb2JqW18ucmFuZG9tKG9iai5sZW5ndGggLSAxKV07XG4gICAgfVxuICAgIHJldHVybiBfLnNodWZmbGUob2JqKS5zbGljZSgwLCBNYXRoLm1heCgwLCBuKSk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgbG9va3VwIGl0ZXJhdG9ycy5cbiAgdmFyIGxvb2t1cEl0ZXJhdG9yID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlIDogZnVuY3Rpb24ob2JqKXsgcmV0dXJuIG9ialt2YWx1ZV07IH07XG4gIH07XG5cbiAgLy8gU29ydCB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uIHByb2R1Y2VkIGJ5IGFuIGl0ZXJhdG9yLlxuICBfLnNvcnRCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsdWUsIGNvbnRleHQpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSBsb29rdXBJdGVyYXRvcih2YWx1ZSk7XG4gICAgcmV0dXJuIF8ucGx1Y2soXy5tYXAob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBjcml0ZXJpYTogaXRlcmF0b3IuY2FsbChjb250ZXh0LCB2YWx1ZSwgaW5kZXgsIGxpc3QpXG4gICAgICB9O1xuICAgIH0pLnNvcnQoZnVuY3Rpb24obGVmdCwgcmlnaHQpIHtcbiAgICAgIHZhciBhID0gbGVmdC5jcml0ZXJpYTtcbiAgICAgIHZhciBiID0gcmlnaHQuY3JpdGVyaWE7XG4gICAgICBpZiAoYSAhPT0gYikge1xuICAgICAgICBpZiAoYSA+IGIgfHwgYSA9PT0gdm9pZCAwKSByZXR1cm4gMTtcbiAgICAgICAgaWYgKGEgPCBiIHx8IGIgPT09IHZvaWQgMCkgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxlZnQuaW5kZXggLSByaWdodC5pbmRleDtcbiAgICB9KSwgJ3ZhbHVlJyk7XG4gIH07XG5cbiAgLy8gQW4gaW50ZXJuYWwgZnVuY3Rpb24gdXNlZCBmb3IgYWdncmVnYXRlIFwiZ3JvdXAgYnlcIiBvcGVyYXRpb25zLlxuICB2YXIgZ3JvdXAgPSBmdW5jdGlvbihiZWhhdmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmosIHZhbHVlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICB2YXIgaXRlcmF0b3IgPSB2YWx1ZSA9PSBudWxsID8gXy5pZGVudGl0eSA6IGxvb2t1cEl0ZXJhdG9yKHZhbHVlKTtcbiAgICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgdmFsdWUsIGluZGV4LCBvYmopO1xuICAgICAgICBiZWhhdmlvcihyZXN1bHQsIGtleSwgdmFsdWUpO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gR3JvdXBzIHRoZSBvYmplY3QncyB2YWx1ZXMgYnkgYSBjcml0ZXJpb24uIFBhc3MgZWl0aGVyIGEgc3RyaW5nIGF0dHJpYnV0ZVxuICAvLyB0byBncm91cCBieSwgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGNyaXRlcmlvbi5cbiAgXy5ncm91cEJ5ID0gZ3JvdXAoZnVuY3Rpb24ocmVzdWx0LCBrZXksIHZhbHVlKSB7XG4gICAgKF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldIDogKHJlc3VsdFtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcbiAgfSk7XG5cbiAgLy8gSW5kZXhlcyB0aGUgb2JqZWN0J3MgdmFsdWVzIGJ5IGEgY3JpdGVyaW9uLCBzaW1pbGFyIHRvIGBncm91cEJ5YCwgYnV0IGZvclxuICAvLyB3aGVuIHlvdSBrbm93IHRoYXQgeW91ciBpbmRleCB2YWx1ZXMgd2lsbCBiZSB1bmlxdWUuXG4gIF8uaW5kZXhCeSA9IGdyb3VwKGZ1bmN0aW9uKHJlc3VsdCwga2V5LCB2YWx1ZSkge1xuICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gIH0pO1xuXG4gIC8vIENvdW50cyBpbnN0YW5jZXMgb2YgYW4gb2JqZWN0IHRoYXQgZ3JvdXAgYnkgYSBjZXJ0YWluIGNyaXRlcmlvbi4gUGFzc1xuICAvLyBlaXRoZXIgYSBzdHJpbmcgYXR0cmlidXRlIHRvIGNvdW50IGJ5LCBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGVcbiAgLy8gY3JpdGVyaW9uLlxuICBfLmNvdW50QnkgPSBncm91cChmdW5jdGlvbihyZXN1bHQsIGtleSkge1xuICAgIF8uaGFzKHJlc3VsdCwga2V5KSA/IHJlc3VsdFtrZXldKysgOiByZXN1bHRba2V5XSA9IDE7XG4gIH0pO1xuXG4gIC8vIFVzZSBhIGNvbXBhcmF0b3IgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB0aGUgc21hbGxlc3QgaW5kZXggYXQgd2hpY2hcbiAgLy8gYW4gb2JqZWN0IHNob3VsZCBiZSBpbnNlcnRlZCBzbyBhcyB0byBtYWludGFpbiBvcmRlci4gVXNlcyBiaW5hcnkgc2VhcmNoLlxuICBfLnNvcnRlZEluZGV4ID0gZnVuY3Rpb24oYXJyYXksIG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICBpdGVyYXRvciA9IGl0ZXJhdG9yID09IG51bGwgPyBfLmlkZW50aXR5IDogbG9va3VwSXRlcmF0b3IoaXRlcmF0b3IpO1xuICAgIHZhciB2YWx1ZSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqKTtcbiAgICB2YXIgbG93ID0gMCwgaGlnaCA9IGFycmF5Lmxlbmd0aDtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgdmFyIG1pZCA9IChsb3cgKyBoaWdoKSA+Pj4gMTtcbiAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgYXJyYXlbbWlkXSkgPCB2YWx1ZSA/IGxvdyA9IG1pZCArIDEgOiBoaWdoID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG93O1xuICB9O1xuXG4gIC8vIFNhZmVseSBjcmVhdGUgYSByZWFsLCBsaXZlIGFycmF5IGZyb20gYW55dGhpbmcgaXRlcmFibGUuXG4gIF8udG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmICghb2JqKSByZXR1cm4gW107XG4gICAgaWYgKF8uaXNBcnJheShvYmopKSByZXR1cm4gc2xpY2UuY2FsbChvYmopO1xuICAgIGlmIChvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkgcmV0dXJuIF8ubWFwKG9iaiwgXy5pZGVudGl0eSk7XG4gICAgcmV0dXJuIF8udmFsdWVzKG9iaik7XG4gIH07XG5cbiAgLy8gUmV0dXJuIHRoZSBudW1iZXIgb2YgZWxlbWVudHMgaW4gYW4gb2JqZWN0LlxuICBfLnNpemUgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqID09IG51bGwpIHJldHVybiAwO1xuICAgIHJldHVybiAob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpID8gb2JqLmxlbmd0aCA6IF8ua2V5cyhvYmopLmxlbmd0aDtcbiAgfTtcblxuICAvLyBBcnJheSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gR2V0IHRoZSBmaXJzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBmaXJzdCBOXG4gIC8vIHZhbHVlcyBpbiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYGhlYWRgIGFuZCBgdGFrZWAuIFRoZSAqKmd1YXJkKiogY2hlY2tcbiAgLy8gYWxsb3dzIGl0IHRvIHdvcmsgd2l0aCBgXy5tYXBgLlxuICBfLmZpcnN0ID0gXy5oZWFkID0gXy50YWtlID0gZnVuY3Rpb24oYXJyYXksIG4sIGd1YXJkKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgcmV0dXJuIChuID09IG51bGwpIHx8IGd1YXJkID8gYXJyYXlbMF0gOiBzbGljZS5jYWxsKGFycmF5LCAwLCBuKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBsYXN0IGVudHJ5IG9mIHRoZSBhcnJheS4gRXNwZWNpYWxseSB1c2VmdWwgb25cbiAgLy8gdGhlIGFyZ3VtZW50cyBvYmplY3QuIFBhc3NpbmcgKipuKiogd2lsbCByZXR1cm4gYWxsIHRoZSB2YWx1ZXMgaW5cbiAgLy8gdGhlIGFycmF5LCBleGNsdWRpbmcgdGhlIGxhc3QgTi4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoXG4gIC8vIGBfLm1hcGAuXG4gIF8uaW5pdGlhbCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAwLCBhcnJheS5sZW5ndGggLSAoKG4gPT0gbnVsbCkgfHwgZ3VhcmQgPyAxIDogbikpO1xuICB9O1xuXG4gIC8vIEdldCB0aGUgbGFzdCBlbGVtZW50IG9mIGFuIGFycmF5LiBQYXNzaW5nICoqbioqIHdpbGwgcmV0dXJuIHRoZSBsYXN0IE5cbiAgLy8gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKiBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ubGFzdCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmICgobiA9PSBudWxsKSB8fCBndWFyZCkge1xuICAgICAgcmV0dXJuIGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2xpY2UuY2FsbChhcnJheSwgTWF0aC5tYXgoYXJyYXkubGVuZ3RoIC0gbiwgMCkpO1xuICAgIH1cbiAgfTtcblxuICAvLyBSZXR1cm5zIGV2ZXJ5dGhpbmcgYnV0IHRoZSBmaXJzdCBlbnRyeSBvZiB0aGUgYXJyYXkuIEFsaWFzZWQgYXMgYHRhaWxgIGFuZCBgZHJvcGAuXG4gIC8vIEVzcGVjaWFsbHkgdXNlZnVsIG9uIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBQYXNzaW5nIGFuICoqbioqIHdpbGwgcmV0dXJuXG4gIC8vIHRoZSByZXN0IE4gdmFsdWVzIGluIHRoZSBhcnJheS4gVGhlICoqZ3VhcmQqKlxuICAvLyBjaGVjayBhbGxvd3MgaXQgdG8gd29yayB3aXRoIGBfLm1hcGAuXG4gIF8ucmVzdCA9IF8udGFpbCA9IF8uZHJvcCA9IGZ1bmN0aW9uKGFycmF5LCBuLCBndWFyZCkge1xuICAgIHJldHVybiBzbGljZS5jYWxsKGFycmF5LCAobiA9PSBudWxsKSB8fCBndWFyZCA/IDEgOiBuKTtcbiAgfTtcblxuICAvLyBUcmltIG91dCBhbGwgZmFsc3kgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gIF8uY29tcGFjdCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGFycmF5LCBfLmlkZW50aXR5KTtcbiAgfTtcblxuICAvLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvbiBvZiBhIHJlY3Vyc2l2ZSBgZmxhdHRlbmAgZnVuY3Rpb24uXG4gIHZhciBmbGF0dGVuID0gZnVuY3Rpb24oaW5wdXQsIHNoYWxsb3csIG91dHB1dCkge1xuICAgIGlmIChzaGFsbG93ICYmIF8uZXZlcnkoaW5wdXQsIF8uaXNBcnJheSkpIHtcbiAgICAgIHJldHVybiBjb25jYXQuYXBwbHkob3V0cHV0LCBpbnB1dCk7XG4gICAgfVxuICAgIGVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHZhbHVlKSB8fCBfLmlzQXJndW1lbnRzKHZhbHVlKSkge1xuICAgICAgICBzaGFsbG93ID8gcHVzaC5hcHBseShvdXRwdXQsIHZhbHVlKSA6IGZsYXR0ZW4odmFsdWUsIHNoYWxsb3csIG91dHB1dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXRwdXQucHVzaCh2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcblxuICAvLyBGbGF0dGVuIG91dCBhbiBhcnJheSwgZWl0aGVyIHJlY3Vyc2l2ZWx5IChieSBkZWZhdWx0KSwgb3IganVzdCBvbmUgbGV2ZWwuXG4gIF8uZmxhdHRlbiA9IGZ1bmN0aW9uKGFycmF5LCBzaGFsbG93KSB7XG4gICAgcmV0dXJuIGZsYXR0ZW4oYXJyYXksIHNoYWxsb3csIFtdKTtcbiAgfTtcblxuICAvLyBSZXR1cm4gYSB2ZXJzaW9uIG9mIHRoZSBhcnJheSB0aGF0IGRvZXMgbm90IGNvbnRhaW4gdGhlIHNwZWNpZmllZCB2YWx1ZShzKS5cbiAgXy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICByZXR1cm4gXy5kaWZmZXJlbmNlKGFycmF5LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICB9O1xuXG4gIC8vIFByb2R1Y2UgYSBkdXBsaWNhdGUtZnJlZSB2ZXJzaW9uIG9mIHRoZSBhcnJheS4gSWYgdGhlIGFycmF5IGhhcyBhbHJlYWR5XG4gIC8vIGJlZW4gc29ydGVkLCB5b3UgaGF2ZSB0aGUgb3B0aW9uIG9mIHVzaW5nIGEgZmFzdGVyIGFsZ29yaXRobS5cbiAgLy8gQWxpYXNlZCBhcyBgdW5pcXVlYC5cbiAgXy51bmlxID0gXy51bmlxdWUgPSBmdW5jdGlvbihhcnJheSwgaXNTb3J0ZWQsIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgaWYgKF8uaXNGdW5jdGlvbihpc1NvcnRlZCkpIHtcbiAgICAgIGNvbnRleHQgPSBpdGVyYXRvcjtcbiAgICAgIGl0ZXJhdG9yID0gaXNTb3J0ZWQ7XG4gICAgICBpc1NvcnRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICB2YXIgaW5pdGlhbCA9IGl0ZXJhdG9yID8gXy5tYXAoYXJyYXksIGl0ZXJhdG9yLCBjb250ZXh0KSA6IGFycmF5O1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgdmFyIHNlZW4gPSBbXTtcbiAgICBlYWNoKGluaXRpYWwsIGZ1bmN0aW9uKHZhbHVlLCBpbmRleCkge1xuICAgICAgaWYgKGlzU29ydGVkID8gKCFpbmRleCB8fCBzZWVuW3NlZW4ubGVuZ3RoIC0gMV0gIT09IHZhbHVlKSA6ICFfLmNvbnRhaW5zKHNlZW4sIHZhbHVlKSkge1xuICAgICAgICBzZWVuLnB1c2godmFsdWUpO1xuICAgICAgICByZXN1bHRzLnB1c2goYXJyYXlbaW5kZXhdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIHVuaW9uOiBlYWNoIGRpc3RpbmN0IGVsZW1lbnQgZnJvbSBhbGwgb2ZcbiAgLy8gdGhlIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8udW5pb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXy51bmlxKF8uZmxhdHRlbihhcmd1bWVudHMsIHRydWUpKTtcbiAgfTtcblxuICAvLyBQcm9kdWNlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgZXZlcnkgaXRlbSBzaGFyZWQgYmV0d2VlbiBhbGwgdGhlXG4gIC8vIHBhc3NlZC1pbiBhcnJheXMuXG4gIF8uaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gXy5maWx0ZXIoXy51bmlxKGFycmF5KSwgZnVuY3Rpb24oaXRlbSkge1xuICAgICAgcmV0dXJuIF8uZXZlcnkocmVzdCwgZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgICAgcmV0dXJuIF8uaW5kZXhPZihvdGhlciwgaXRlbSkgPj0gMDtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIFRha2UgdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBvbmUgYXJyYXkgYW5kIGEgbnVtYmVyIG9mIG90aGVyIGFycmF5cy5cbiAgLy8gT25seSB0aGUgZWxlbWVudHMgcHJlc2VudCBpbiBqdXN0IHRoZSBmaXJzdCBhcnJheSB3aWxsIHJlbWFpbi5cbiAgXy5kaWZmZXJlbmNlID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdCA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIHJldHVybiBfLmZpbHRlcihhcnJheSwgZnVuY3Rpb24odmFsdWUpeyByZXR1cm4gIV8uY29udGFpbnMocmVzdCwgdmFsdWUpOyB9KTtcbiAgfTtcblxuICAvLyBaaXAgdG9nZXRoZXIgbXVsdGlwbGUgbGlzdHMgaW50byBhIHNpbmdsZSBhcnJheSAtLSBlbGVtZW50cyB0aGF0IHNoYXJlXG4gIC8vIGFuIGluZGV4IGdvIHRvZ2V0aGVyLlxuICBfLnppcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSBfLm1heChfLnBsdWNrKGFyZ3VtZW50cywgXCJsZW5ndGhcIikuY29uY2F0KDApKTtcbiAgICB2YXIgcmVzdWx0cyA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlc3VsdHNbaV0gPSBfLnBsdWNrKGFyZ3VtZW50cywgJycgKyBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgLy8gQ29udmVydHMgbGlzdHMgaW50byBvYmplY3RzLiBQYXNzIGVpdGhlciBhIHNpbmdsZSBhcnJheSBvZiBgW2tleSwgdmFsdWVdYFxuICAvLyBwYWlycywgb3IgdHdvIHBhcmFsbGVsIGFycmF5cyBvZiB0aGUgc2FtZSBsZW5ndGggLS0gb25lIG9mIGtleXMsIGFuZCBvbmUgb2ZcbiAgLy8gdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzLlxuICBfLm9iamVjdCA9IGZ1bmN0aW9uKGxpc3QsIHZhbHVlcykge1xuICAgIGlmIChsaXN0ID09IG51bGwpIHJldHVybiB7fTtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh2YWx1ZXMpIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1dID0gdmFsdWVzW2ldO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W2xpc3RbaV1bMF1dID0gbGlzdFtpXVsxXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICAvLyBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBseSB1cyB3aXRoIGluZGV4T2YgKEknbSBsb29raW5nIGF0IHlvdSwgKipNU0lFKiopLFxuICAvLyB3ZSBuZWVkIHRoaXMgZnVuY3Rpb24uIFJldHVybiB0aGUgcG9zaXRpb24gb2YgdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgYW5cbiAgLy8gaXRlbSBpbiBhbiBhcnJheSwgb3IgLTEgaWYgdGhlIGl0ZW0gaXMgbm90IGluY2x1ZGVkIGluIHRoZSBhcnJheS5cbiAgLy8gRGVsZWdhdGVzIHRvICoqRUNNQVNjcmlwdCA1KioncyBuYXRpdmUgYGluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgLy8gSWYgdGhlIGFycmF5IGlzIGxhcmdlIGFuZCBhbHJlYWR5IGluIHNvcnQgb3JkZXIsIHBhc3MgYHRydWVgXG4gIC8vIGZvciAqKmlzU29ydGVkKiogdG8gdXNlIGJpbmFyeSBzZWFyY2guXG4gIF8uaW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBpc1NvcnRlZCkge1xuICAgIGlmIChhcnJheSA9PSBudWxsKSByZXR1cm4gLTE7XG4gICAgdmFyIGkgPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gICAgaWYgKGlzU29ydGVkKSB7XG4gICAgICBpZiAodHlwZW9mIGlzU29ydGVkID09ICdudW1iZXInKSB7XG4gICAgICAgIGkgPSAoaXNTb3J0ZWQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgaXNTb3J0ZWQpIDogaXNTb3J0ZWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IF8uc29ydGVkSW5kZXgoYXJyYXksIGl0ZW0pO1xuICAgICAgICByZXR1cm4gYXJyYXlbaV0gPT09IGl0ZW0gPyBpIDogLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChuYXRpdmVJbmRleE9mICYmIGFycmF5LmluZGV4T2YgPT09IG5hdGl2ZUluZGV4T2YpIHJldHVybiBhcnJheS5pbmRleE9mKGl0ZW0sIGlzU29ydGVkKTtcbiAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBEZWxlZ2F0ZXMgdG8gKipFQ01BU2NyaXB0IDUqKidzIG5hdGl2ZSBgbGFzdEluZGV4T2ZgIGlmIGF2YWlsYWJsZS5cbiAgXy5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uKGFycmF5LCBpdGVtLCBmcm9tKSB7XG4gICAgaWYgKGFycmF5ID09IG51bGwpIHJldHVybiAtMTtcbiAgICB2YXIgaGFzSW5kZXggPSBmcm9tICE9IG51bGw7XG4gICAgaWYgKG5hdGl2ZUxhc3RJbmRleE9mICYmIGFycmF5Lmxhc3RJbmRleE9mID09PSBuYXRpdmVMYXN0SW5kZXhPZikge1xuICAgICAgcmV0dXJuIGhhc0luZGV4ID8gYXJyYXkubGFzdEluZGV4T2YoaXRlbSwgZnJvbSkgOiBhcnJheS5sYXN0SW5kZXhPZihpdGVtKTtcbiAgICB9XG4gICAgdmFyIGkgPSAoaGFzSW5kZXggPyBmcm9tIDogYXJyYXkubGVuZ3RoKTtcbiAgICB3aGlsZSAoaS0tKSBpZiAoYXJyYXlbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuICAgIHJldHVybiAtMTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhbiBpbnRlZ2VyIEFycmF5IGNvbnRhaW5pbmcgYW4gYXJpdGhtZXRpYyBwcm9ncmVzc2lvbi4gQSBwb3J0IG9mXG4gIC8vIHRoZSBuYXRpdmUgUHl0aG9uIGByYW5nZSgpYCBmdW5jdGlvbi4gU2VlXG4gIC8vIFt0aGUgUHl0aG9uIGRvY3VtZW50YXRpb25dKGh0dHA6Ly9kb2NzLnB5dGhvbi5vcmcvbGlicmFyeS9mdW5jdGlvbnMuaHRtbCNyYW5nZSkuXG4gIF8ucmFuZ2UgPSBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDw9IDEpIHtcbiAgICAgIHN0b3AgPSBzdGFydCB8fCAwO1xuICAgICAgc3RhcnQgPSAwO1xuICAgIH1cbiAgICBzdGVwID0gYXJndW1lbnRzWzJdIHx8IDE7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5tYXgoTWF0aC5jZWlsKChzdG9wIC0gc3RhcnQpIC8gc3RlcCksIDApO1xuICAgIHZhciBpZHggPSAwO1xuICAgIHZhciByYW5nZSA9IG5ldyBBcnJheShsZW5ndGgpO1xuXG4gICAgd2hpbGUoaWR4IDwgbGVuZ3RoKSB7XG4gICAgICByYW5nZVtpZHgrK10gPSBzdGFydDtcbiAgICAgIHN0YXJ0ICs9IHN0ZXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmdlO1xuICB9O1xuXG4gIC8vIEZ1bmN0aW9uIChhaGVtKSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV1c2FibGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHByb3RvdHlwZSBzZXR0aW5nLlxuICB2YXIgY3RvciA9IGZ1bmN0aW9uKCl7fTtcblxuICAvLyBDcmVhdGUgYSBmdW5jdGlvbiBib3VuZCB0byBhIGdpdmVuIG9iamVjdCAoYXNzaWduaW5nIGB0aGlzYCwgYW5kIGFyZ3VtZW50cyxcbiAgLy8gb3B0aW9uYWxseSkuIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBGdW5jdGlvbi5iaW5kYCBpZlxuICAvLyBhdmFpbGFibGUuXG4gIF8uYmluZCA9IGZ1bmN0aW9uKGZ1bmMsIGNvbnRleHQpIHtcbiAgICB2YXIgYXJncywgYm91bmQ7XG4gICAgaWYgKG5hdGl2ZUJpbmQgJiYgZnVuYy5iaW5kID09PSBuYXRpdmVCaW5kKSByZXR1cm4gbmF0aXZlQmluZC5hcHBseShmdW5jLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGlmICghXy5pc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yO1xuICAgIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGJvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgYm91bmQpKSByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgc2VsZiA9IG5ldyBjdG9yO1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBudWxsO1xuICAgICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIHJldHVybiBzZWxmO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUGFydGlhbGx5IGFwcGx5IGEgZnVuY3Rpb24gYnkgY3JlYXRpbmcgYSB2ZXJzaW9uIHRoYXQgaGFzIGhhZCBzb21lIG9mIGl0c1xuICAvLyBhcmd1bWVudHMgcHJlLWZpbGxlZCwgd2l0aG91dCBjaGFuZ2luZyBpdHMgZHluYW1pYyBgdGhpc2AgY29udGV4dC5cbiAgXy5wYXJ0aWFsID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gQmluZCBhbGwgb2YgYW4gb2JqZWN0J3MgbWV0aG9kcyB0byB0aGF0IG9iamVjdC4gVXNlZnVsIGZvciBlbnN1cmluZyB0aGF0XG4gIC8vIGFsbCBjYWxsYmFja3MgZGVmaW5lZCBvbiBhbiBvYmplY3QgYmVsb25nIHRvIGl0LlxuICBfLmJpbmRBbGwgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgZnVuY3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgaWYgKGZ1bmNzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiYmluZEFsbCBtdXN0IGJlIHBhc3NlZCBmdW5jdGlvbiBuYW1lc1wiKTtcbiAgICBlYWNoKGZ1bmNzLCBmdW5jdGlvbihmKSB7IG9ialtmXSA9IF8uYmluZChvYmpbZl0sIG9iaik7IH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gTWVtb2l6ZSBhbiBleHBlbnNpdmUgZnVuY3Rpb24gYnkgc3RvcmluZyBpdHMgcmVzdWx0cy5cbiAgXy5tZW1vaXplID0gZnVuY3Rpb24oZnVuYywgaGFzaGVyKSB7XG4gICAgdmFyIG1lbW8gPSB7fTtcbiAgICBoYXNoZXIgfHwgKGhhc2hlciA9IF8uaWRlbnRpdHkpO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXkgPSBoYXNoZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBfLmhhcyhtZW1vLCBrZXkpID8gbWVtb1trZXldIDogKG1lbW9ba2V5XSA9IGZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gICAgfTtcbiAgfTtcblxuICAvLyBEZWxheXMgYSBmdW5jdGlvbiBmb3IgdGhlIGdpdmVuIG51bWJlciBvZiBtaWxsaXNlY29uZHMsIGFuZCB0aGVuIGNhbGxzXG4gIC8vIGl0IHdpdGggdGhlIGFyZ3VtZW50cyBzdXBwbGllZC5cbiAgXy5kZWxheSA9IGZ1bmN0aW9uKGZ1bmMsIHdhaXQpIHtcbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpeyByZXR1cm4gZnVuYy5hcHBseShudWxsLCBhcmdzKTsgfSwgd2FpdCk7XG4gIH07XG5cbiAgLy8gRGVmZXJzIGEgZnVuY3Rpb24sIHNjaGVkdWxpbmcgaXQgdG8gcnVuIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzXG4gIC8vIGNsZWFyZWQuXG4gIF8uZGVmZXIgPSBmdW5jdGlvbihmdW5jKSB7XG4gICAgcmV0dXJuIF8uZGVsYXkuYXBwbHkoXywgW2Z1bmMsIDFdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIHdoZW4gaW52b2tlZCwgd2lsbCBvbmx5IGJlIHRyaWdnZXJlZCBhdCBtb3N0IG9uY2VcbiAgLy8gZHVyaW5nIGEgZ2l2ZW4gd2luZG93IG9mIHRpbWUuIE5vcm1hbGx5LCB0aGUgdGhyb3R0bGVkIGZ1bmN0aW9uIHdpbGwgcnVuXG4gIC8vIGFzIG11Y2ggYXMgaXQgY2FuLCB3aXRob3V0IGV2ZXIgZ29pbmcgbW9yZSB0aGFuIG9uY2UgcGVyIGB3YWl0YCBkdXJhdGlvbjtcbiAgLy8gYnV0IGlmIHlvdSdkIGxpa2UgdG8gZGlzYWJsZSB0aGUgZXhlY3V0aW9uIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIHBhc3NcbiAgLy8gYHtsZWFkaW5nOiBmYWxzZX1gLiBUbyBkaXNhYmxlIGV4ZWN1dGlvbiBvbiB0aGUgdHJhaWxpbmcgZWRnZSwgZGl0dG8uXG4gIF8udGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgdmFyIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICB2YXIgdGltZW91dCA9IG51bGw7XG4gICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IG5ldyBEYXRlO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlO1xuICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIGlmIChyZW1haW5pbmcgPD0gMCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uLCB0aGF0LCBhcyBsb25nIGFzIGl0IGNvbnRpbnVlcyB0byBiZSBpbnZva2VkLCB3aWxsIG5vdFxuICAvLyBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gIC8vIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICAvLyBsZWFkaW5nIGVkZ2UsIGluc3RlYWQgb2YgdGhlIHRyYWlsaW5nLlxuICBfLmRlYm91bmNlID0gZnVuY3Rpb24oZnVuYywgd2FpdCwgaW1tZWRpYXRlKSB7XG4gICAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgIHRpbWVzdGFtcCA9IG5ldyBEYXRlKCk7XG4gICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGxhc3QgPSAobmV3IERhdGUoKSkgLSB0aW1lc3RhbXA7XG4gICAgICAgIGlmIChsYXN0IDwgd2FpdCkge1xuICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgaWYgKCFpbW1lZGlhdGUpIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICAgIGlmICghdGltZW91dCkge1xuICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbE5vdykgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIGF0IG1vc3Qgb25lIHRpbWUsIG5vIG1hdHRlciBob3dcbiAgLy8gb2Z0ZW4geW91IGNhbGwgaXQuIFVzZWZ1bCBmb3IgbGF6eSBpbml0aWFsaXphdGlvbi5cbiAgXy5vbmNlID0gZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciByYW4gPSBmYWxzZSwgbWVtbztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocmFuKSByZXR1cm4gbWVtbztcbiAgICAgIHJhbiA9IHRydWU7XG4gICAgICBtZW1vID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgZnVuYyA9IG51bGw7XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuICB9O1xuXG4gIC8vIFJldHVybnMgdGhlIGZpcnN0IGZ1bmN0aW9uIHBhc3NlZCBhcyBhbiBhcmd1bWVudCB0byB0aGUgc2Vjb25kLFxuICAvLyBhbGxvd2luZyB5b3UgdG8gYWRqdXN0IGFyZ3VtZW50cywgcnVuIGNvZGUgYmVmb3JlIGFuZCBhZnRlciwgYW5kXG4gIC8vIGNvbmRpdGlvbmFsbHkgZXhlY3V0ZSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24uXG4gIF8ud3JhcCA9IGZ1bmN0aW9uKGZ1bmMsIHdyYXBwZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgYXJncyA9IFtmdW5jXTtcbiAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiB3cmFwcGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG4gIH07XG5cbiAgLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgaXMgdGhlIGNvbXBvc2l0aW9uIG9mIGEgbGlzdCBvZiBmdW5jdGlvbnMsIGVhY2hcbiAgLy8gY29uc3VtaW5nIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZ1bmN0aW9uIHRoYXQgZm9sbG93cy5cbiAgXy5jb21wb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGZ1bmNzID0gYXJndW1lbnRzO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgZm9yICh2YXIgaSA9IGZ1bmNzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGFyZ3MgPSBbZnVuY3NbaV0uYXBwbHkodGhpcywgYXJncyldO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFyZ3NbMF07XG4gICAgfTtcbiAgfTtcblxuICAvLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgYWZ0ZXIgYmVpbmcgY2FsbGVkIE4gdGltZXMuXG4gIF8uYWZ0ZXIgPSBmdW5jdGlvbih0aW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICgtLXRpbWVzIDwgMSkge1xuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbiAgLy8gT2JqZWN0IEZ1bmN0aW9uc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gUmV0cmlldmUgdGhlIG5hbWVzIG9mIGFuIG9iamVjdCdzIHByb3BlcnRpZXMuXG4gIC8vIERlbGVnYXRlcyB0byAqKkVDTUFTY3JpcHQgNSoqJ3MgbmF0aXZlIGBPYmplY3Qua2V5c2BcbiAgXy5rZXlzID0gbmF0aXZlS2V5cyB8fCBmdW5jdGlvbihvYmopIHtcbiAgICBpZiAob2JqICE9PSBPYmplY3Qob2JqKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBvYmplY3QnKTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIGlmIChfLmhhcyhvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICAgIHJldHVybiBrZXlzO1xuICB9O1xuXG4gIC8vIFJldHJpZXZlIHRoZSB2YWx1ZXMgb2YgYW4gb2JqZWN0J3MgcHJvcGVydGllcy5cbiAgXy52YWx1ZXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIga2V5cyA9IF8ua2V5cyhvYmopO1xuICAgIHZhciBsZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgdmFsdWVzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWVzW2ldID0gb2JqW2tleXNbaV1dO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9O1xuXG4gIC8vIENvbnZlcnQgYW4gb2JqZWN0IGludG8gYSBsaXN0IG9mIGBba2V5LCB2YWx1ZV1gIHBhaXJzLlxuICBfLnBhaXJzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICB2YXIgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIHBhaXJzID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcGFpcnNbaV0gPSBba2V5c1tpXSwgb2JqW2tleXNbaV1dXTtcbiAgICB9XG4gICAgcmV0dXJuIHBhaXJzO1xuICB9O1xuXG4gIC8vIEludmVydCB0aGUga2V5cyBhbmQgdmFsdWVzIG9mIGFuIG9iamVjdC4gVGhlIHZhbHVlcyBtdXN0IGJlIHNlcmlhbGl6YWJsZS5cbiAgXy5pbnZlcnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGtleXMgPSBfLmtleXMob2JqKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuZ3RoID0ga2V5cy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmVzdWx0W29ialtrZXlzW2ldXV0gPSBrZXlzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHNvcnRlZCBsaXN0IG9mIHRoZSBmdW5jdGlvbiBuYW1lcyBhdmFpbGFibGUgb24gdGhlIG9iamVjdC5cbiAgLy8gQWxpYXNlZCBhcyBgbWV0aG9kc2BcbiAgXy5mdW5jdGlvbnMgPSBfLm1ldGhvZHMgPSBmdW5jdGlvbihvYmopIHtcbiAgICB2YXIgbmFtZXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoXy5pc0Z1bmN0aW9uKG9ialtrZXldKSkgbmFtZXMucHVzaChrZXkpO1xuICAgIH1cbiAgICByZXR1cm4gbmFtZXMuc29ydCgpO1xuICB9O1xuXG4gIC8vIEV4dGVuZCBhIGdpdmVuIG9iamVjdCB3aXRoIGFsbCB0aGUgcHJvcGVydGllcyBpbiBwYXNzZWQtaW4gb2JqZWN0KHMpLlxuICBfLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBvYmpbcHJvcF0gPSBzb3VyY2VbcHJvcF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIGNvcHkgb2YgdGhlIG9iamVjdCBvbmx5IGNvbnRhaW5pbmcgdGhlIHdoaXRlbGlzdGVkIHByb3BlcnRpZXMuXG4gIF8ucGljayA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHZhciBjb3B5ID0ge307XG4gICAgdmFyIGtleXMgPSBjb25jYXQuYXBwbHkoQXJyYXlQcm90bywgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICBlYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKGtleSBpbiBvYmopIGNvcHlba2V5XSA9IG9ialtrZXldO1xuICAgIH0pO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gICAvLyBSZXR1cm4gYSBjb3B5IG9mIHRoZSBvYmplY3Qgd2l0aG91dCB0aGUgYmxhY2tsaXN0ZWQgcHJvcGVydGllcy5cbiAgXy5vbWl0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgdmFyIGNvcHkgPSB7fTtcbiAgICB2YXIga2V5cyA9IGNvbmNhdC5hcHBseShBcnJheVByb3RvLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmICghXy5jb250YWlucyhrZXlzLCBrZXkpKSBjb3B5W2tleV0gPSBvYmpba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgLy8gRmlsbCBpbiBhIGdpdmVuIG9iamVjdCB3aXRoIGRlZmF1bHQgcHJvcGVydGllcy5cbiAgXy5kZWZhdWx0cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgIGlmIChzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICBpZiAob2JqW3Byb3BdID09PSB2b2lkIDApIG9ialtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBvYmo7XG4gIH07XG5cbiAgLy8gQ3JlYXRlIGEgKHNoYWxsb3ctY2xvbmVkKSBkdXBsaWNhdGUgb2YgYW4gb2JqZWN0LlxuICBfLmNsb25lID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKCFfLmlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gICAgcmV0dXJuIF8uaXNBcnJheShvYmopID8gb2JqLnNsaWNlKCkgOiBfLmV4dGVuZCh7fSwgb2JqKTtcbiAgfTtcblxuICAvLyBJbnZva2VzIGludGVyY2VwdG9yIHdpdGggdGhlIG9iaiwgYW5kIHRoZW4gcmV0dXJucyBvYmouXG4gIC8vIFRoZSBwcmltYXJ5IHB1cnBvc2Ugb2YgdGhpcyBtZXRob2QgaXMgdG8gXCJ0YXAgaW50b1wiIGEgbWV0aG9kIGNoYWluLCBpblxuICAvLyBvcmRlciB0byBwZXJmb3JtIG9wZXJhdGlvbnMgb24gaW50ZXJtZWRpYXRlIHJlc3VsdHMgd2l0aGluIHRoZSBjaGFpbi5cbiAgXy50YXAgPSBmdW5jdGlvbihvYmosIGludGVyY2VwdG9yKSB7XG4gICAgaW50ZXJjZXB0b3Iob2JqKTtcbiAgICByZXR1cm4gb2JqO1xuICB9O1xuXG4gIC8vIEludGVybmFsIHJlY3Vyc2l2ZSBjb21wYXJpc29uIGZ1bmN0aW9uIGZvciBgaXNFcXVhbGAuXG4gIHZhciBlcSA9IGZ1bmN0aW9uKGEsIGIsIGFTdGFjaywgYlN0YWNrKSB7XG4gICAgLy8gSWRlbnRpY2FsIG9iamVjdHMgYXJlIGVxdWFsLiBgMCA9PT0gLTBgLCBidXQgdGhleSBhcmVuJ3QgaWRlbnRpY2FsLlxuICAgIC8vIFNlZSB0aGUgW0hhcm1vbnkgYGVnYWxgIHByb3Bvc2FsXShodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1oYXJtb255OmVnYWwpLlxuICAgIGlmIChhID09PSBiKSByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PSAxIC8gYjtcbiAgICAvLyBBIHN0cmljdCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIGBudWxsID09IHVuZGVmaW5lZGAuXG4gICAgaWYgKGEgPT0gbnVsbCB8fCBiID09IG51bGwpIHJldHVybiBhID09PSBiO1xuICAgIC8vIFVud3JhcCBhbnkgd3JhcHBlZCBvYmplY3RzLlxuICAgIGlmIChhIGluc3RhbmNlb2YgXykgYSA9IGEuX3dyYXBwZWQ7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBfKSBiID0gYi5fd3JhcHBlZDtcbiAgICAvLyBDb21wYXJlIGBbW0NsYXNzXV1gIG5hbWVzLlxuICAgIHZhciBjbGFzc05hbWUgPSB0b1N0cmluZy5jYWxsKGEpO1xuICAgIGlmIChjbGFzc05hbWUgIT0gdG9TdHJpbmcuY2FsbChiKSkgcmV0dXJuIGZhbHNlO1xuICAgIHN3aXRjaCAoY2xhc3NOYW1lKSB7XG4gICAgICAvLyBTdHJpbmdzLCBudW1iZXJzLCBkYXRlcywgYW5kIGJvb2xlYW5zIGFyZSBjb21wYXJlZCBieSB2YWx1ZS5cbiAgICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICAgIC8vIFByaW1pdGl2ZXMgYW5kIHRoZWlyIGNvcnJlc3BvbmRpbmcgb2JqZWN0IHdyYXBwZXJzIGFyZSBlcXVpdmFsZW50OyB0aHVzLCBgXCI1XCJgIGlzXG4gICAgICAgIC8vIGVxdWl2YWxlbnQgdG8gYG5ldyBTdHJpbmcoXCI1XCIpYC5cbiAgICAgICAgcmV0dXJuIGEgPT0gU3RyaW5nKGIpO1xuICAgICAgY2FzZSAnW29iamVjdCBOdW1iZXJdJzpcbiAgICAgICAgLy8gYE5hTmBzIGFyZSBlcXVpdmFsZW50LCBidXQgbm9uLXJlZmxleGl2ZS4gQW4gYGVnYWxgIGNvbXBhcmlzb24gaXMgcGVyZm9ybWVkIGZvclxuICAgICAgICAvLyBvdGhlciBudW1lcmljIHZhbHVlcy5cbiAgICAgICAgcmV0dXJuIGEgIT0gK2EgPyBiICE9ICtiIDogKGEgPT0gMCA/IDEgLyBhID09IDEgLyBiIDogYSA9PSArYik7XG4gICAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIGNhc2UgJ1tvYmplY3QgQm9vbGVhbl0nOlxuICAgICAgICAvLyBDb2VyY2UgZGF0ZXMgYW5kIGJvb2xlYW5zIHRvIG51bWVyaWMgcHJpbWl0aXZlIHZhbHVlcy4gRGF0ZXMgYXJlIGNvbXBhcmVkIGJ5IHRoZWlyXG4gICAgICAgIC8vIG1pbGxpc2Vjb25kIHJlcHJlc2VudGF0aW9ucy4gTm90ZSB0aGF0IGludmFsaWQgZGF0ZXMgd2l0aCBtaWxsaXNlY29uZCByZXByZXNlbnRhdGlvbnNcbiAgICAgICAgLy8gb2YgYE5hTmAgYXJlIG5vdCBlcXVpdmFsZW50LlxuICAgICAgICByZXR1cm4gK2EgPT0gK2I7XG4gICAgICAvLyBSZWdFeHBzIGFyZSBjb21wYXJlZCBieSB0aGVpciBzb3VyY2UgcGF0dGVybnMgYW5kIGZsYWdzLlxuICAgICAgY2FzZSAnW29iamVjdCBSZWdFeHBdJzpcbiAgICAgICAgcmV0dXJuIGEuc291cmNlID09IGIuc291cmNlICYmXG4gICAgICAgICAgICAgICBhLmdsb2JhbCA9PSBiLmdsb2JhbCAmJlxuICAgICAgICAgICAgICAgYS5tdWx0aWxpbmUgPT0gYi5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgICAgIGEuaWdub3JlQ2FzZSA9PSBiLmlnbm9yZUNhc2U7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSAhPSAnb2JqZWN0JyB8fCB0eXBlb2YgYiAhPSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIC8vIEFzc3VtZSBlcXVhbGl0eSBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoZSBhbGdvcml0aG0gZm9yIGRldGVjdGluZyBjeWNsaWNcbiAgICAvLyBzdHJ1Y3R1cmVzIGlzIGFkYXB0ZWQgZnJvbSBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zLCBhYnN0cmFjdCBvcGVyYXRpb24gYEpPYC5cbiAgICB2YXIgbGVuZ3RoID0gYVN0YWNrLmxlbmd0aDtcbiAgICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICAgIC8vIExpbmVhciBzZWFyY2guIFBlcmZvcm1hbmNlIGlzIGludmVyc2VseSBwcm9wb3J0aW9uYWwgdG8gdGhlIG51bWJlciBvZlxuICAgICAgLy8gdW5pcXVlIG5lc3RlZCBzdHJ1Y3R1cmVzLlxuICAgICAgaWYgKGFTdGFja1tsZW5ndGhdID09IGEpIHJldHVybiBiU3RhY2tbbGVuZ3RoXSA9PSBiO1xuICAgIH1cbiAgICAvLyBPYmplY3RzIHdpdGggZGlmZmVyZW50IGNvbnN0cnVjdG9ycyBhcmUgbm90IGVxdWl2YWxlbnQsIGJ1dCBgT2JqZWN0YHNcbiAgICAvLyBmcm9tIGRpZmZlcmVudCBmcmFtZXMgYXJlLlxuICAgIHZhciBhQ3RvciA9IGEuY29uc3RydWN0b3IsIGJDdG9yID0gYi5jb25zdHJ1Y3RvcjtcbiAgICBpZiAoYUN0b3IgIT09IGJDdG9yICYmICEoXy5pc0Z1bmN0aW9uKGFDdG9yKSAmJiAoYUN0b3IgaW5zdGFuY2VvZiBhQ3RvcikgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5pc0Z1bmN0aW9uKGJDdG9yKSAmJiAoYkN0b3IgaW5zdGFuY2VvZiBiQ3RvcikpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgZmlyc3Qgb2JqZWN0IHRvIHRoZSBzdGFjayBvZiB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAgICBhU3RhY2sucHVzaChhKTtcbiAgICBiU3RhY2sucHVzaChiKTtcbiAgICB2YXIgc2l6ZSA9IDAsIHJlc3VsdCA9IHRydWU7XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIGFuZCBhcnJheXMuXG4gICAgaWYgKGNsYXNzTmFtZSA9PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAvLyBDb21wYXJlIGFycmF5IGxlbmd0aHMgdG8gZGV0ZXJtaW5lIGlmIGEgZGVlcCBjb21wYXJpc29uIGlzIG5lY2Vzc2FyeS5cbiAgICAgIHNpemUgPSBhLmxlbmd0aDtcbiAgICAgIHJlc3VsdCA9IHNpemUgPT0gYi5sZW5ndGg7XG4gICAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIC8vIERlZXAgY29tcGFyZSB0aGUgY29udGVudHMsIGlnbm9yaW5nIG5vbi1udW1lcmljIHByb3BlcnRpZXMuXG4gICAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgICBpZiAoIShyZXN1bHQgPSBlcShhW3NpemVdLCBiW3NpemVdLCBhU3RhY2ssIGJTdGFjaykpKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEZWVwIGNvbXBhcmUgb2JqZWN0cy5cbiAgICAgIGZvciAodmFyIGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChfLmhhcyhhLCBrZXkpKSB7XG4gICAgICAgICAgLy8gQ291bnQgdGhlIGV4cGVjdGVkIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAvLyBEZWVwIGNvbXBhcmUgZWFjaCBtZW1iZXIuXG4gICAgICAgICAgaWYgKCEocmVzdWx0ID0gXy5oYXMoYiwga2V5KSAmJiBlcShhW2tleV0sIGJba2V5XSwgYVN0YWNrLCBiU3RhY2spKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIEVuc3VyZSB0aGF0IGJvdGggb2JqZWN0cyBjb250YWluIHRoZSBzYW1lIG51bWJlciBvZiBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICBmb3IgKGtleSBpbiBiKSB7XG4gICAgICAgICAgaWYgKF8uaGFzKGIsIGtleSkgJiYgIShzaXplLS0pKSBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSAhc2l6ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVtb3ZlIHRoZSBmaXJzdCBvYmplY3QgZnJvbSB0aGUgc3RhY2sgb2YgdHJhdmVyc2VkIG9iamVjdHMuXG4gICAgYVN0YWNrLnBvcCgpO1xuICAgIGJTdGFjay5wb3AoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIFBlcmZvcm0gYSBkZWVwIGNvbXBhcmlzb24gdG8gY2hlY2sgaWYgdHdvIG9iamVjdHMgYXJlIGVxdWFsLlxuICBfLmlzRXF1YWwgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGVxKGEsIGIsIFtdLCBbXSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiBhcnJheSwgc3RyaW5nLCBvciBvYmplY3QgZW1wdHk/XG4gIC8vIEFuIFwiZW1wdHlcIiBvYmplY3QgaGFzIG5vIGVudW1lcmFibGUgb3duLXByb3BlcnRpZXMuXG4gIF8uaXNFbXB0eSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKF8uaXNBcnJheShvYmopIHx8IF8uaXNTdHJpbmcob2JqKSkgcmV0dXJuIG9iai5sZW5ndGggPT09IDA7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKF8uaGFzKG9iaiwga2V5KSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG4gIC8vIElzIGEgZ2l2ZW4gdmFsdWUgYSBET00gZWxlbWVudD9cbiAgXy5pc0VsZW1lbnQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gISEob2JqICYmIG9iai5ub2RlVHlwZSA9PT0gMSk7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YWx1ZSBhbiBhcnJheT9cbiAgLy8gRGVsZWdhdGVzIHRvIEVDTUE1J3MgbmF0aXZlIEFycmF5LmlzQXJyYXlcbiAgXy5pc0FycmF5ID0gbmF0aXZlSXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEFycmF5XSc7XG4gIH07XG5cbiAgLy8gSXMgYSBnaXZlbiB2YXJpYWJsZSBhbiBvYmplY3Q/XG4gIF8uaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSBPYmplY3Qob2JqKTtcbiAgfTtcblxuICAvLyBBZGQgc29tZSBpc1R5cGUgbWV0aG9kczogaXNBcmd1bWVudHMsIGlzRnVuY3Rpb24sIGlzU3RyaW5nLCBpc051bWJlciwgaXNEYXRlLCBpc1JlZ0V4cC5cbiAgZWFjaChbJ0FyZ3VtZW50cycsICdGdW5jdGlvbicsICdTdHJpbmcnLCAnTnVtYmVyJywgJ0RhdGUnLCAnUmVnRXhwJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBfWydpcycgKyBuYW1lXSA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgcmV0dXJuIHRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCAnICsgbmFtZSArICddJztcbiAgICB9O1xuICB9KTtcblxuICAvLyBEZWZpbmUgYSBmYWxsYmFjayB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgaW4gYnJvd3NlcnMgKGFoZW0sIElFKSwgd2hlcmVcbiAgLy8gdGhlcmUgaXNuJ3QgYW55IGluc3BlY3RhYmxlIFwiQXJndW1lbnRzXCIgdHlwZS5cbiAgaWYgKCFfLmlzQXJndW1lbnRzKGFyZ3VtZW50cykpIHtcbiAgICBfLmlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gISEob2JqICYmIF8uaGFzKG9iaiwgJ2NhbGxlZScpKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gT3B0aW1pemUgYGlzRnVuY3Rpb25gIGlmIGFwcHJvcHJpYXRlLlxuICBpZiAodHlwZW9mICgvLi8pICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgXy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9O1xuICB9XG5cbiAgLy8gSXMgYSBnaXZlbiBvYmplY3QgYSBmaW5pdGUgbnVtYmVyP1xuICBfLmlzRmluaXRlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGlzRmluaXRlKG9iaikgJiYgIWlzTmFOKHBhcnNlRmxvYXQob2JqKSk7XG4gIH07XG5cbiAgLy8gSXMgdGhlIGdpdmVuIHZhbHVlIGBOYU5gPyAoTmFOIGlzIHRoZSBvbmx5IG51bWJlciB3aGljaCBkb2VzIG5vdCBlcXVhbCBpdHNlbGYpLlxuICBfLmlzTmFOID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8uaXNOdW1iZXIob2JqKSAmJiBvYmogIT0gK29iajtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGEgYm9vbGVhbj9cbiAgXy5pc0Jvb2xlYW4gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gb2JqID09PSB0cnVlIHx8IG9iaiA9PT0gZmFsc2UgfHwgdG9TdHJpbmcuY2FsbChvYmopID09ICdbb2JqZWN0IEJvb2xlYW5dJztcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhbHVlIGVxdWFsIHRvIG51bGw/XG4gIF8uaXNOdWxsID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIG9iaiA9PT0gbnVsbDtcbiAgfTtcblxuICAvLyBJcyBhIGdpdmVuIHZhcmlhYmxlIHVuZGVmaW5lZD9cbiAgXy5pc1VuZGVmaW5lZCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBvYmogPT09IHZvaWQgMDtcbiAgfTtcblxuICAvLyBTaG9ydGN1dCBmdW5jdGlvbiBmb3IgY2hlY2tpbmcgaWYgYW4gb2JqZWN0IGhhcyBhIGdpdmVuIHByb3BlcnR5IGRpcmVjdGx5XG4gIC8vIG9uIGl0c2VsZiAoaW4gb3RoZXIgd29yZHMsIG5vdCBvbiBhIHByb3RvdHlwZSkuXG4gIF8uaGFzID0gZnVuY3Rpb24ob2JqLCBrZXkpIHtcbiAgICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSk7XG4gIH07XG5cbiAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvLyBSdW4gVW5kZXJzY29yZS5qcyBpbiAqbm9Db25mbGljdCogbW9kZSwgcmV0dXJuaW5nIHRoZSBgX2AgdmFyaWFibGUgdG8gaXRzXG4gIC8vIHByZXZpb3VzIG93bmVyLiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgcm9vdC5fID0gcHJldmlvdXNVbmRlcnNjb3JlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8vIEtlZXAgdGhlIGlkZW50aXR5IGZ1bmN0aW9uIGFyb3VuZCBmb3IgZGVmYXVsdCBpdGVyYXRvcnMuXG4gIF8uaWRlbnRpdHkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvLyBSdW4gYSBmdW5jdGlvbiAqKm4qKiB0aW1lcy5cbiAgXy50aW1lcyA9IGZ1bmN0aW9uKG4sIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGFjY3VtID0gQXJyYXkoTWF0aC5tYXgoMCwgbikpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSBhY2N1bVtpXSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgaSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9O1xuXG4gIC8vIFJldHVybiBhIHJhbmRvbSBpbnRlZ2VyIGJldHdlZW4gbWluIGFuZCBtYXggKGluY2x1c2l2ZSkuXG4gIF8ucmFuZG9tID0gZnVuY3Rpb24obWluLCBtYXgpIHtcbiAgICBpZiAobWF4ID09IG51bGwpIHtcbiAgICAgIG1heCA9IG1pbjtcbiAgICAgIG1pbiA9IDA7XG4gICAgfVxuICAgIHJldHVybiBtaW4gKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpO1xuICB9O1xuXG4gIC8vIExpc3Qgb2YgSFRNTCBlbnRpdGllcyBmb3IgZXNjYXBpbmcuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgZXNjYXBlOiB7XG4gICAgICAnJic6ICcmYW1wOycsXG4gICAgICAnPCc6ICcmbHQ7JyxcbiAgICAgICc+JzogJyZndDsnLFxuICAgICAgJ1wiJzogJyZxdW90OycsXG4gICAgICBcIidcIjogJyYjeDI3OydcbiAgICB9XG4gIH07XG4gIGVudGl0eU1hcC51bmVzY2FwZSA9IF8uaW52ZXJ0KGVudGl0eU1hcC5lc2NhcGUpO1xuXG4gIC8vIFJlZ2V4ZXMgY29udGFpbmluZyB0aGUga2V5cyBhbmQgdmFsdWVzIGxpc3RlZCBpbW1lZGlhdGVseSBhYm92ZS5cbiAgdmFyIGVudGl0eVJlZ2V4ZXMgPSB7XG4gICAgZXNjYXBlOiAgIG5ldyBSZWdFeHAoJ1snICsgXy5rZXlzKGVudGl0eU1hcC5lc2NhcGUpLmpvaW4oJycpICsgJ10nLCAnZycpLFxuICAgIHVuZXNjYXBlOiBuZXcgUmVnRXhwKCcoJyArIF8ua2V5cyhlbnRpdHlNYXAudW5lc2NhcGUpLmpvaW4oJ3wnKSArICcpJywgJ2cnKVxuICB9O1xuXG4gIC8vIEZ1bmN0aW9ucyBmb3IgZXNjYXBpbmcgYW5kIHVuZXNjYXBpbmcgc3RyaW5ncyB0by9mcm9tIEhUTUwgaW50ZXJwb2xhdGlvbi5cbiAgXy5lYWNoKFsnZXNjYXBlJywgJ3VuZXNjYXBlJ10sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIF9bbWV0aG9kXSA9IGZ1bmN0aW9uKHN0cmluZykge1xuICAgICAgaWYgKHN0cmluZyA9PSBudWxsKSByZXR1cm4gJyc7XG4gICAgICByZXR1cm4gKCcnICsgc3RyaW5nKS5yZXBsYWNlKGVudGl0eVJlZ2V4ZXNbbWV0aG9kXSwgZnVuY3Rpb24obWF0Y2gpIHtcbiAgICAgICAgcmV0dXJuIGVudGl0eU1hcFttZXRob2RdW21hdGNoXTtcbiAgICAgIH0pO1xuICAgIH07XG4gIH0pO1xuXG4gIC8vIElmIHRoZSB2YWx1ZSBvZiB0aGUgbmFtZWQgYHByb3BlcnR5YCBpcyBhIGZ1bmN0aW9uIHRoZW4gaW52b2tlIGl0IHdpdGggdGhlXG4gIC8vIGBvYmplY3RgIGFzIGNvbnRleHQ7IG90aGVyd2lzZSwgcmV0dXJuIGl0LlxuICBfLnJlc3VsdCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHJldHVybiB2b2lkIDA7XG4gICAgdmFyIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICByZXR1cm4gXy5pc0Z1bmN0aW9uKHZhbHVlKSA/IHZhbHVlLmNhbGwob2JqZWN0KSA6IHZhbHVlO1xuICB9O1xuXG4gIC8vIEFkZCB5b3VyIG93biBjdXN0b20gZnVuY3Rpb25zIHRvIHRoZSBVbmRlcnNjb3JlIG9iamVjdC5cbiAgXy5taXhpbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGVhY2goXy5mdW5jdGlvbnMob2JqKSwgZnVuY3Rpb24obmFtZSkge1xuICAgICAgdmFyIGZ1bmMgPSBfW25hbWVdID0gb2JqW25hbWVdO1xuICAgICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBbdGhpcy5fd3JhcHBlZF07XG4gICAgICAgIHB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIGZ1bmMuYXBwbHkoXywgYXJncykpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBpbnRlZ2VyIGlkICh1bmlxdWUgd2l0aGluIHRoZSBlbnRpcmUgY2xpZW50IHNlc3Npb24pLlxuICAvLyBVc2VmdWwgZm9yIHRlbXBvcmFyeSBET00gaWRzLlxuICB2YXIgaWRDb3VudGVyID0gMDtcbiAgXy51bmlxdWVJZCA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBpZCA9ICsraWRDb3VudGVyICsgJyc7XG4gICAgcmV0dXJuIHByZWZpeCA/IHByZWZpeCArIGlkIDogaWQ7XG4gIH07XG5cbiAgLy8gQnkgZGVmYXVsdCwgVW5kZXJzY29yZSB1c2VzIEVSQi1zdHlsZSB0ZW1wbGF0ZSBkZWxpbWl0ZXJzLCBjaGFuZ2UgdGhlXG4gIC8vIGZvbGxvd2luZyB0ZW1wbGF0ZSBzZXR0aW5ncyB0byB1c2UgYWx0ZXJuYXRpdmUgZGVsaW1pdGVycy5cbiAgXy50ZW1wbGF0ZVNldHRpbmdzID0ge1xuICAgIGV2YWx1YXRlICAgIDogLzwlKFtcXHNcXFNdKz8pJT4vZyxcbiAgICBpbnRlcnBvbGF0ZSA6IC88JT0oW1xcc1xcU10rPyklPi9nLFxuICAgIGVzY2FwZSAgICAgIDogLzwlLShbXFxzXFxTXSs/KSU+L2dcbiAgfTtcblxuICAvLyBXaGVuIGN1c3RvbWl6aW5nIGB0ZW1wbGF0ZVNldHRpbmdzYCwgaWYgeW91IGRvbid0IHdhbnQgdG8gZGVmaW5lIGFuXG4gIC8vIGludGVycG9sYXRpb24sIGV2YWx1YXRpb24gb3IgZXNjYXBpbmcgcmVnZXgsIHdlIG5lZWQgb25lIHRoYXQgaXNcbiAgLy8gZ3VhcmFudGVlZCBub3QgdG8gbWF0Y2guXG4gIHZhciBub01hdGNoID0gLyguKV4vO1xuXG4gIC8vIENlcnRhaW4gY2hhcmFjdGVycyBuZWVkIHRvIGJlIGVzY2FwZWQgc28gdGhhdCB0aGV5IGNhbiBiZSBwdXQgaW50byBhXG4gIC8vIHN0cmluZyBsaXRlcmFsLlxuICB2YXIgZXNjYXBlcyA9IHtcbiAgICBcIidcIjogICAgICBcIidcIixcbiAgICAnXFxcXCc6ICAgICAnXFxcXCcsXG4gICAgJ1xccic6ICAgICAncicsXG4gICAgJ1xcbic6ICAgICAnbicsXG4gICAgJ1xcdCc6ICAgICAndCcsXG4gICAgJ1xcdTIwMjgnOiAndTIwMjgnLFxuICAgICdcXHUyMDI5JzogJ3UyMDI5J1xuICB9O1xuXG4gIHZhciBlc2NhcGVyID0gL1xcXFx8J3xcXHJ8XFxufFxcdHxcXHUyMDI4fFxcdTIwMjkvZztcblxuICAvLyBKYXZhU2NyaXB0IG1pY3JvLXRlbXBsYXRpbmcsIHNpbWlsYXIgdG8gSm9obiBSZXNpZydzIGltcGxlbWVudGF0aW9uLlxuICAvLyBVbmRlcnNjb3JlIHRlbXBsYXRpbmcgaGFuZGxlcyBhcmJpdHJhcnkgZGVsaW1pdGVycywgcHJlc2VydmVzIHdoaXRlc3BhY2UsXG4gIC8vIGFuZCBjb3JyZWN0bHkgZXNjYXBlcyBxdW90ZXMgd2l0aGluIGludGVycG9sYXRlZCBjb2RlLlxuICBfLnRlbXBsYXRlID0gZnVuY3Rpb24odGV4dCwgZGF0YSwgc2V0dGluZ3MpIHtcbiAgICB2YXIgcmVuZGVyO1xuICAgIHNldHRpbmdzID0gXy5kZWZhdWx0cyh7fSwgc2V0dGluZ3MsIF8udGVtcGxhdGVTZXR0aW5ncyk7XG5cbiAgICAvLyBDb21iaW5lIGRlbGltaXRlcnMgaW50byBvbmUgcmVndWxhciBleHByZXNzaW9uIHZpYSBhbHRlcm5hdGlvbi5cbiAgICB2YXIgbWF0Y2hlciA9IG5ldyBSZWdFeHAoW1xuICAgICAgKHNldHRpbmdzLmVzY2FwZSB8fCBub01hdGNoKS5zb3VyY2UsXG4gICAgICAoc2V0dGluZ3MuaW50ZXJwb2xhdGUgfHwgbm9NYXRjaCkuc291cmNlLFxuICAgICAgKHNldHRpbmdzLmV2YWx1YXRlIHx8IG5vTWF0Y2gpLnNvdXJjZVxuICAgIF0uam9pbignfCcpICsgJ3wkJywgJ2cnKTtcblxuICAgIC8vIENvbXBpbGUgdGhlIHRlbXBsYXRlIHNvdXJjZSwgZXNjYXBpbmcgc3RyaW5nIGxpdGVyYWxzIGFwcHJvcHJpYXRlbHkuXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgc291cmNlID0gXCJfX3ArPSdcIjtcbiAgICB0ZXh0LnJlcGxhY2UobWF0Y2hlciwgZnVuY3Rpb24obWF0Y2gsIGVzY2FwZSwgaW50ZXJwb2xhdGUsIGV2YWx1YXRlLCBvZmZzZXQpIHtcbiAgICAgIHNvdXJjZSArPSB0ZXh0LnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgICAgIC5yZXBsYWNlKGVzY2FwZXIsIGZ1bmN0aW9uKG1hdGNoKSB7IHJldHVybiAnXFxcXCcgKyBlc2NhcGVzW21hdGNoXTsgfSk7XG5cbiAgICAgIGlmIChlc2NhcGUpIHtcbiAgICAgICAgc291cmNlICs9IFwiJytcXG4oKF9fdD0oXCIgKyBlc2NhcGUgKyBcIikpPT1udWxsPycnOl8uZXNjYXBlKF9fdCkpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChpbnRlcnBvbGF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInK1xcbigoX190PShcIiArIGludGVycG9sYXRlICsgXCIpKT09bnVsbD8nJzpfX3QpK1xcbidcIjtcbiAgICAgIH1cbiAgICAgIGlmIChldmFsdWF0ZSkge1xuICAgICAgICBzb3VyY2UgKz0gXCInO1xcblwiICsgZXZhbHVhdGUgKyBcIlxcbl9fcCs9J1wiO1xuICAgICAgfVxuICAgICAgaW5kZXggPSBvZmZzZXQgKyBtYXRjaC5sZW5ndGg7XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG4gICAgc291cmNlICs9IFwiJztcXG5cIjtcblxuICAgIC8vIElmIGEgdmFyaWFibGUgaXMgbm90IHNwZWNpZmllZCwgcGxhY2UgZGF0YSB2YWx1ZXMgaW4gbG9jYWwgc2NvcGUuXG4gICAgaWYgKCFzZXR0aW5ncy52YXJpYWJsZSkgc291cmNlID0gJ3dpdGgob2JqfHx7fSl7XFxuJyArIHNvdXJjZSArICd9XFxuJztcblxuICAgIHNvdXJjZSA9IFwidmFyIF9fdCxfX3A9JycsX19qPUFycmF5LnByb3RvdHlwZS5qb2luLFwiICtcbiAgICAgIFwicHJpbnQ9ZnVuY3Rpb24oKXtfX3ArPV9fai5jYWxsKGFyZ3VtZW50cywnJyk7fTtcXG5cIiArXG4gICAgICBzb3VyY2UgKyBcInJldHVybiBfX3A7XFxuXCI7XG5cbiAgICB0cnkge1xuICAgICAgcmVuZGVyID0gbmV3IEZ1bmN0aW9uKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonLCAnXycsIHNvdXJjZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZS5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIGlmIChkYXRhKSByZXR1cm4gcmVuZGVyKGRhdGEsIF8pO1xuICAgIHZhciB0ZW1wbGF0ZSA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHJldHVybiByZW5kZXIuY2FsbCh0aGlzLCBkYXRhLCBfKTtcbiAgICB9O1xuXG4gICAgLy8gUHJvdmlkZSB0aGUgY29tcGlsZWQgZnVuY3Rpb24gc291cmNlIGFzIGEgY29udmVuaWVuY2UgZm9yIHByZWNvbXBpbGF0aW9uLlxuICAgIHRlbXBsYXRlLnNvdXJjZSA9ICdmdW5jdGlvbignICsgKHNldHRpbmdzLnZhcmlhYmxlIHx8ICdvYmonKSArICcpe1xcbicgKyBzb3VyY2UgKyAnfSc7XG5cbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH07XG5cbiAgLy8gQWRkIGEgXCJjaGFpblwiIGZ1bmN0aW9uLCB3aGljaCB3aWxsIGRlbGVnYXRlIHRvIHRoZSB3cmFwcGVyLlxuICBfLmNoYWluID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIF8ob2JqKS5jaGFpbigpO1xuICB9O1xuXG4gIC8vIE9PUFxuICAvLyAtLS0tLS0tLS0tLS0tLS1cbiAgLy8gSWYgVW5kZXJzY29yZSBpcyBjYWxsZWQgYXMgYSBmdW5jdGlvbiwgaXQgcmV0dXJucyBhIHdyYXBwZWQgb2JqZWN0IHRoYXRcbiAgLy8gY2FuIGJlIHVzZWQgT08tc3R5bGUuIFRoaXMgd3JhcHBlciBob2xkcyBhbHRlcmVkIHZlcnNpb25zIG9mIGFsbCB0aGVcbiAgLy8gdW5kZXJzY29yZSBmdW5jdGlvbnMuIFdyYXBwZWQgb2JqZWN0cyBtYXkgYmUgY2hhaW5lZC5cblxuICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gY29udGludWUgY2hhaW5pbmcgaW50ZXJtZWRpYXRlIHJlc3VsdHMuXG4gIHZhciByZXN1bHQgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdGhpcy5fY2hhaW4gPyBfKG9iaikuY2hhaW4oKSA6IG9iajtcbiAgfTtcblxuICAvLyBBZGQgYWxsIG9mIHRoZSBVbmRlcnNjb3JlIGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlciBvYmplY3QuXG4gIF8ubWl4aW4oXyk7XG5cbiAgLy8gQWRkIGFsbCBtdXRhdG9yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ3BvcCcsICdwdXNoJywgJ3JldmVyc2UnLCAnc2hpZnQnLCAnc29ydCcsICdzcGxpY2UnLCAndW5zaGlmdCddLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIG1ldGhvZCA9IEFycmF5UHJvdG9bbmFtZV07XG4gICAgXy5wcm90b3R5cGVbbmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYmogPSB0aGlzLl93cmFwcGVkO1xuICAgICAgbWV0aG9kLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIGlmICgobmFtZSA9PSAnc2hpZnQnIHx8IG5hbWUgPT0gJ3NwbGljZScpICYmIG9iai5sZW5ndGggPT09IDApIGRlbGV0ZSBvYmpbMF07XG4gICAgICByZXR1cm4gcmVzdWx0LmNhbGwodGhpcywgb2JqKTtcbiAgICB9O1xuICB9KTtcblxuICAvLyBBZGQgYWxsIGFjY2Vzc29yIEFycmF5IGZ1bmN0aW9ucyB0byB0aGUgd3JhcHBlci5cbiAgZWFjaChbJ2NvbmNhdCcsICdqb2luJywgJ3NsaWNlJ10sIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgbWV0aG9kID0gQXJyYXlQcm90b1tuYW1lXTtcbiAgICBfLnByb3RvdHlwZVtuYW1lXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdC5jYWxsKHRoaXMsIG1ldGhvZC5hcHBseSh0aGlzLl93cmFwcGVkLCBhcmd1bWVudHMpKTtcbiAgICB9O1xuICB9KTtcblxuICBfLmV4dGVuZChfLnByb3RvdHlwZSwge1xuXG4gICAgLy8gU3RhcnQgY2hhaW5pbmcgYSB3cmFwcGVkIFVuZGVyc2NvcmUgb2JqZWN0LlxuICAgIGNoYWluOiBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuX2NoYWluID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvLyBFeHRyYWN0cyB0aGUgcmVzdWx0IGZyb20gYSB3cmFwcGVkIGFuZCBjaGFpbmVkIG9iamVjdC5cbiAgICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fd3JhcHBlZDtcbiAgICB9XG5cbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG5cbn0pKCkiLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBhY3RpdmUsIGNyZWF0ZVNlYXJjaCwgZW1wdHlQYWdlLCB1dGlsLCB3aWtpO1xuXG4gIHdpa2kgPSByZXF1aXJlKCcuL3dpa2knKTtcblxuICB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbiAgYWN0aXZlID0gcmVxdWlyZSgnLi9hY3RpdmUnKTtcblxuICBlbXB0eVBhZ2UgPSByZXF1aXJlKCcuL3BhZ2UnKS5lbXB0eVBhZ2U7XG5cbiAgY3JlYXRlU2VhcmNoID0gZnVuY3Rpb24oX2FyZykge1xuICAgIHZhciBuZWlnaGJvcmhvb2QsIHBlcmZvcm1TZWFyY2g7XG4gICAgbmVpZ2hib3Job29kID0gX2FyZy5uZWlnaGJvcmhvb2Q7XG4gICAgcGVyZm9ybVNlYXJjaCA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5KSB7XG4gICAgICB2YXIgJHJlc3VsdFBhZ2UsIHJlc3VsdCwgcmVzdWx0UGFnZSwgc2VhcmNoUmVzdWx0cywgdGFsbHksIF9pLCBfbGVuLCBfcmVmO1xuICAgICAgc2VhcmNoUmVzdWx0cyA9IG5laWdoYm9yaG9vZC5zZWFyY2goc2VhcmNoUXVlcnkpO1xuICAgICAgdGFsbHkgPSBzZWFyY2hSZXN1bHRzLnRhbGx5O1xuICAgICAgcmVzdWx0UGFnZSA9IGVtcHR5UGFnZSgpO1xuICAgICAgcmVzdWx0UGFnZS5zZXRUaXRsZShcIlNlYXJjaCBmb3IgJ1wiICsgc2VhcmNoUXVlcnkgKyBcIidcIik7XG4gICAgICByZXN1bHRQYWdlLmFkZFBhcmFncmFwaChcIlN0cmluZyAnXCIgKyBzZWFyY2hRdWVyeSArIFwiJyBmb3VuZCBvbiBcIiArICh0YWxseS5maW5kcyB8fCAnbm9uZScpICsgXCIgb2YgXCIgKyAodGFsbHkucGFnZXMgfHwgJ25vJykgKyBcIiBwYWdlcyBmcm9tIFwiICsgKHRhbGx5LnNpdGVzIHx8ICdubycpICsgXCIgc2l0ZXMuXFxuVGV4dCBtYXRjaGVkIG9uIFwiICsgKHRhbGx5LnRpdGxlIHx8ICdubycpICsgXCIgdGl0bGVzLCBcIiArICh0YWxseS50ZXh0IHx8ICdubycpICsgXCIgcGFyYWdyYXBocywgYW5kIFwiICsgKHRhbGx5LnNsdWcgfHwgJ25vJykgKyBcIiBzbHVncy5cXG5FbGFwc2VkIHRpbWUgXCIgKyB0YWxseS5tc2VjICsgXCIgbWlsbGlzZWNvbmRzLlwiKTtcbiAgICAgIF9yZWYgPSBzZWFyY2hSZXN1bHRzLmZpbmRzO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIHJlc3VsdCA9IF9yZWZbX2ldO1xuICAgICAgICByZXN1bHRQYWdlLmFkZEl0ZW0oe1xuICAgICAgICAgIFwidHlwZVwiOiBcInJlZmVyZW5jZVwiLFxuICAgICAgICAgIFwic2l0ZVwiOiByZXN1bHQuc2l0ZSxcbiAgICAgICAgICBcInNsdWdcIjogcmVzdWx0LnBhZ2Uuc2x1ZyxcbiAgICAgICAgICBcInRpdGxlXCI6IHJlc3VsdC5wYWdlLnRpdGxlLFxuICAgICAgICAgIFwidGV4dFwiOiByZXN1bHQucGFnZS5zeW5vcHNpcyB8fCAnJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgICRyZXN1bHRQYWdlID0gd2lraS5jcmVhdGVQYWdlKHJlc3VsdFBhZ2UuZ2V0U2x1ZygpKS5hZGRDbGFzcygnZ2hvc3QnKTtcbiAgICAgICRyZXN1bHRQYWdlLmFwcGVuZFRvKCQoJy5tYWluJykpO1xuICAgICAgd2lraS5idWlsZFBhZ2UocmVzdWx0UGFnZSwgJHJlc3VsdFBhZ2UpO1xuICAgICAgcmV0dXJuIGFjdGl2ZS5zZXQoJCgnLnBhZ2UnKS5sYXN0KCkpO1xuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgIHBlcmZvcm1TZWFyY2g6IHBlcmZvcm1TZWFyY2hcbiAgICB9O1xuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0gY3JlYXRlU2VhcmNoO1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgYWN0aXZlLCBjcmVhdGVTZWFyY2gsIG5laWdoYm9yaG9vZCwgbmV4dEF2YWlsYWJsZUZldGNoLCBuZXh0RmV0Y2hJbnRlcnZhbCwgcG9wdWxhdGVTaXRlSW5mb0ZvciwgdG90YWxQYWdlcywgdXRpbCwgd2lraSwgXyxcbiAgICBfX2hhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICBfID0gcmVxdWlyZSgndW5kZXJzY29yZScpO1xuXG4gIHdpa2kgPSByZXF1aXJlKCcuL3dpa2knKTtcblxuICBhY3RpdmUgPSByZXF1aXJlKCcuL2FjdGl2ZScpO1xuXG4gIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcblxuICBjcmVhdGVTZWFyY2ggPSByZXF1aXJlKCcuL3NlYXJjaCcpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gbmVpZ2hib3Job29kID0ge307XG5cbiAgaWYgKHdpa2kubmVpZ2hib3Job29kID09IG51bGwpIHtcbiAgICB3aWtpLm5laWdoYm9yaG9vZCA9IHt9O1xuICB9XG5cbiAgbmV4dEF2YWlsYWJsZUZldGNoID0gMDtcblxuICBuZXh0RmV0Y2hJbnRlcnZhbCA9IDIwMDA7XG5cbiAgdG90YWxQYWdlcyA9IDA7XG5cbiAgcG9wdWxhdGVTaXRlSW5mb0ZvciA9IGZ1bmN0aW9uKHNpdGUsIG5laWdoYm9ySW5mbykge1xuICAgIHZhciBmZXRjaE1hcCwgbm93LCB0cmFuc2l0aW9uO1xuICAgIGlmIChuZWlnaGJvckluZm8uc2l0ZW1hcFJlcXVlc3RJbmZsaWdodCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBuZWlnaGJvckluZm8uc2l0ZW1hcFJlcXVlc3RJbmZsaWdodCA9IHRydWU7XG4gICAgdHJhbnNpdGlvbiA9IGZ1bmN0aW9uKHNpdGUsIGZyb20sIHRvKSB7XG4gICAgICByZXR1cm4gJChcIi5uZWlnaGJvcltkYXRhLXNpdGU9XFxcIlwiICsgc2l0ZSArIFwiXFxcIl1cIikuZmluZCgnZGl2JykucmVtb3ZlQ2xhc3MoZnJvbSkuYWRkQ2xhc3ModG8pO1xuICAgIH07XG4gICAgZmV0Y2hNYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZXF1ZXN0LCBzaXRlbWFwVXJsO1xuICAgICAgc2l0ZW1hcFVybCA9IFwiaHR0cDovL1wiICsgc2l0ZSArIFwiL3N5c3RlbS9zaXRlbWFwLmpzb25cIjtcbiAgICAgIHRyYW5zaXRpb24oc2l0ZSwgJ3dhaXQnLCAnZmV0Y2gnKTtcbiAgICAgIHJlcXVlc3QgPSAkLmFqYXgoe1xuICAgICAgICB0eXBlOiAnR0VUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgdXJsOiBzaXRlbWFwVXJsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXF1ZXN0LmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5laWdoYm9ySW5mby5zaXRlbWFwUmVxdWVzdEluZmxpZ2h0ID0gZmFsc2U7XG4gICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgbmVpZ2hib3JJbmZvLnNpdGVtYXAgPSBkYXRhO1xuICAgICAgICB0cmFuc2l0aW9uKHNpdGUsICdmZXRjaCcsICdkb25lJyk7XG4gICAgICAgIHJldHVybiAkKCdib2R5JykudHJpZ2dlcignbmV3LW5laWdoYm9yLWRvbmUnLCBzaXRlKTtcbiAgICAgIH0pLmZhaWwoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihzaXRlLCAnZmV0Y2gnLCAnZmFpbCcpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgPiBuZXh0QXZhaWxhYmxlRmV0Y2gpIHtcbiAgICAgIG5leHRBdmFpbGFibGVGZXRjaCA9IG5vdyArIG5leHRGZXRjaEludGVydmFsO1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZmV0Y2hNYXAsIDEwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFRpbWVvdXQoZmV0Y2hNYXAsIG5leHRBdmFpbGFibGVGZXRjaCAtIG5vdyk7XG4gICAgICByZXR1cm4gbmV4dEF2YWlsYWJsZUZldGNoICs9IG5leHRGZXRjaEludGVydmFsO1xuICAgIH1cbiAgfTtcblxuICB3aWtpLnJlZ2lzdGVyTmVpZ2hib3IgPSBuZWlnaGJvcmhvb2QucmVnaXN0ZXJOZWlnaGJvciA9IGZ1bmN0aW9uKHNpdGUpIHtcbiAgICB2YXIgbmVpZ2hib3JJbmZvO1xuICAgIGlmICh3aWtpLm5laWdoYm9yaG9vZFtzaXRlXSAhPSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG5laWdoYm9ySW5mbyA9IHt9O1xuICAgIHdpa2kubmVpZ2hib3Job29kW3NpdGVdID0gbmVpZ2hib3JJbmZvO1xuICAgIHBvcHVsYXRlU2l0ZUluZm9Gb3Ioc2l0ZSwgbmVpZ2hib3JJbmZvKTtcbiAgICByZXR1cm4gJCgnYm9keScpLnRyaWdnZXIoJ25ldy1uZWlnaGJvcicsIHNpdGUpO1xuICB9O1xuXG4gIG5laWdoYm9yaG9vZC5saXN0TmVpZ2hib3JzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIF8ua2V5cyh3aWtpLm5laWdoYm9yaG9vZCk7XG4gIH07XG5cbiAgbmVpZ2hib3Job29kLnNlYXJjaCA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5KSB7XG4gICAgdmFyIGZpbmRzLCBtYXRjaCwgbWF0Y2hpbmdQYWdlcywgbmVpZ2hib3JJbmZvLCBuZWlnaGJvclNpdGUsIHNpdGVtYXAsIHN0YXJ0LCB0YWxseSwgdGljaywgX3JlZjtcbiAgICBmaW5kcyA9IFtdO1xuICAgIHRhbGx5ID0ge307XG4gICAgdGljayA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgaWYgKHRhbGx5W2tleV0gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGFsbHlba2V5XSsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRhbGx5W2tleV0gPSAxO1xuICAgICAgfVxuICAgIH07XG4gICAgbWF0Y2ggPSBmdW5jdGlvbihrZXksIHRleHQpIHtcbiAgICAgIHZhciBoaXQ7XG4gICAgICBoaXQgPSAodGV4dCAhPSBudWxsKSAmJiB0ZXh0LnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpKSA+PSAwO1xuICAgICAgaWYgKGhpdCkge1xuICAgICAgICB0aWNrKGtleSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGl0O1xuICAgIH07XG4gICAgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIF9yZWYgPSB3aWtpLm5laWdoYm9yaG9vZDtcbiAgICBmb3IgKG5laWdoYm9yU2l0ZSBpbiBfcmVmKSB7XG4gICAgICBpZiAoIV9faGFzUHJvcC5jYWxsKF9yZWYsIG5laWdoYm9yU2l0ZSkpIGNvbnRpbnVlO1xuICAgICAgbmVpZ2hib3JJbmZvID0gX3JlZltuZWlnaGJvclNpdGVdO1xuICAgICAgc2l0ZW1hcCA9IG5laWdoYm9ySW5mby5zaXRlbWFwO1xuICAgICAgaWYgKHNpdGVtYXAgIT0gbnVsbCkge1xuICAgICAgICB0aWNrKCdzaXRlcycpO1xuICAgICAgfVxuICAgICAgbWF0Y2hpbmdQYWdlcyA9IF8uZWFjaChzaXRlbWFwLCBmdW5jdGlvbihwYWdlKSB7XG4gICAgICAgIHRpY2soJ3BhZ2VzJyk7XG4gICAgICAgIGlmICghKG1hdGNoKCd0aXRsZScsIHBhZ2UudGl0bGUpIHx8IG1hdGNoKCd0ZXh0JywgcGFnZS5zeW5vcHNpcykgfHwgbWF0Y2goJ3NsdWcnLCBwYWdlLnNsdWcpKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aWNrKCdmaW5kcycpO1xuICAgICAgICByZXR1cm4gZmluZHMucHVzaCh7XG4gICAgICAgICAgcGFnZTogcGFnZSxcbiAgICAgICAgICBzaXRlOiBuZWlnaGJvclNpdGUsXG4gICAgICAgICAgcmFuazogMVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0YWxseVsnbXNlYyddID0gRGF0ZS5ub3coKSAtIHN0YXJ0O1xuICAgIHJldHVybiB7XG4gICAgICBmaW5kczogZmluZHMsXG4gICAgICB0YWxseTogdGFsbHlcbiAgICB9O1xuICB9O1xuXG4gICQoZnVuY3Rpb24oKSB7XG4gICAgdmFyICRuZWlnaGJvcmhvb2QsIGZsYWcsIHNlYXJjaDtcbiAgICAkbmVpZ2hib3Job29kID0gJCgnLm5laWdoYm9yaG9vZCcpO1xuICAgIGZsYWcgPSBmdW5jdGlvbihzaXRlKSB7XG4gICAgICByZXR1cm4gXCI8c3BhbiBjbGFzcz1cXFwibmVpZ2hib3JcXFwiIGRhdGEtc2l0ZT1cXFwiXCIgKyBzaXRlICsgXCJcXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwid2FpdFxcXCI+XFxuICAgIDxpbWcgc3JjPVxcXCJodHRwOi8vXCIgKyBzaXRlICsgXCIvZmF2aWNvbi5wbmdcXFwiIHRpdGxlPVxcXCJcIiArIHNpdGUgKyBcIlxcXCI+XFxuICA8L2Rpdj5cXG48L3NwYW4+XCI7XG4gICAgfTtcbiAgICAkKCdib2R5Jykub24oJ25ldy1uZWlnaGJvcicsIGZ1bmN0aW9uKGUsIHNpdGUpIHtcbiAgICAgIHJldHVybiAkbmVpZ2hib3Job29kLmFwcGVuZChmbGFnKHNpdGUpKTtcbiAgICB9KS5vbignbmV3LW5laWdoYm9yLWRvbmUnLCBmdW5jdGlvbihlLCBzaXRlKSB7XG4gICAgICB2YXIgaW1nLCBwYWdlQ291bnQ7XG4gICAgICBwYWdlQ291bnQgPSB3aWtpLm5laWdoYm9yaG9vZFtzaXRlXS5zaXRlbWFwLmxlbmd0aDtcbiAgICAgIGltZyA9ICQoXCIubmVpZ2hib3Job29kIC5uZWlnaGJvcltkYXRhLXNpdGU9XFxcIlwiICsgc2l0ZSArIFwiXFxcIl1cIikuZmluZCgnaW1nJyk7XG4gICAgICBpbWcuYXR0cigndGl0bGUnLCBcIlwiICsgc2l0ZSArIFwiXFxuIFwiICsgcGFnZUNvdW50ICsgXCIgcGFnZXNcIik7XG4gICAgICB0b3RhbFBhZ2VzICs9IHBhZ2VDb3VudDtcbiAgICAgIHJldHVybiAkKCcuc2VhcmNoYm94IC5wYWdlcycpLnRleHQoXCJcIiArIHRvdGFsUGFnZXMgKyBcIiBwYWdlc1wiKTtcbiAgICB9KS5kZWxlZ2F0ZSgnLm5laWdoYm9yIGltZycsICdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHJldHVybiB3aWtpLmRvSW50ZXJuYWxMaW5rKCd3ZWxjb21lLXZpc2l0b3JzJywgbnVsbCwgdGhpcy50aXRsZS5zcGxpdChcIlxcblwiKVswXSk7XG4gICAgfSk7XG4gICAgc2VhcmNoID0gY3JlYXRlU2VhcmNoKHtcbiAgICAgIG5laWdoYm9yaG9vZDogbmVpZ2hib3Job29kXG4gICAgfSk7XG4gICAgcmV0dXJuICQoJ2lucHV0LnNlYXJjaCcpLm9uKCdrZXlwcmVzcycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBzZWFyY2hRdWVyeTtcbiAgICAgIGlmIChlLmtleUNvZGUgIT09IDEzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlYXJjaFF1ZXJ5ID0gJCh0aGlzKS52YWwoKTtcbiAgICAgIHNlYXJjaC5wZXJmb3JtU2VhcmNoKHNlYXJjaFF1ZXJ5KTtcbiAgICAgIHJldHVybiAkKHRoaXMpLnZhbChcIlwiKTtcbiAgICB9KTtcbiAgfSk7XG5cbn0pLmNhbGwodGhpcyk7XG4iXX0=
;