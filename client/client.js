(function() {
  var __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Array.prototype.last = function() {
    return this[this.length - 1];
  };

  $(function() {
    var LEFTARROW, RIGHTARROW, addToJournal, asSlug, createPage, doInternalLink, doPlugin, findPage, formatTime, getItem, getPlugin, i, idx, j, pagesInDom, pushToLocal, pushToServer, putAction, randomByte, randomBytes, refresh, resolveFrom, resolveLinks, scripts, scrollTo, setActive, setState, showState, startPages, textEditor, urlLocs, urlPage, urlPages, useLocalStorage, _len;
    window.wiki = {};
    window.dialog = $('<div></div>').html('This dialog will show every time!').dialog({
      autoOpen: false,
      title: 'Basic Dialog',
      height: 600,
      width: 800
    });
    randomByte = function() {
      return (((1 + Math.random()) * 0x100) | 0).toString(16).substring(1);
    };
    randomBytes = function(n) {
      return ((function() {
        var _i, _results;
        _results = [];
        for (_i = 1; 1 <= n ? _i <= n : _i >= n; 1 <= n ? _i++ : _i--) {
          _results.push(randomByte());
        }
        return _results;
      })()).join('');
    };
    wiki.log = function() {
      var things;
      things = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (console.log != null) return console.log(things);
    };
    wiki.resolutionContext = [];
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
      return string.replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink).replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" href=\"$1\">$2</a>");
    };
    addToJournal = function(journalElement, action) {
      var actionElement, pageElement;
      pageElement = journalElement.parents('.page:first');
      actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type).text(action.type[0]).data('itemId', action.id || "0").appendTo(journalElement);
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
    formatTime = function(time) {
      var am, d, h, mi, mo;
      d = new Date((time > 10000000000 ? time : time * 1000));
      mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
      h = d.getHours();
      am = h < 12 ? 'AM' : 'PM';
      h = h === 0 ? 12 : h > 12 ? h - 12 : h;
      mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
      return "" + h + ":" + mi + " " + am + "<br>" + (d.getDate()) + " " + mo + " " + (d.getFullYear());
    };
    getItem = function(element) {
      if ($(element).length > 0) {
        return $(element).data("item") || JSON.parse($(element).data('staticItem'));
      }
    };
    wiki.getData = function() {
      return $('.chart,.data').last().data('item').data;
    };
    scripts = {};
    wiki.getScript = function() {
      var path, paths, _i, _len, _results;
      paths = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = paths.length; _i < _len; _i++) {
        path = paths[_i];
        if (scripts[path] == null) {
          scripts[path] = true;
          _results.push($('<script type="text/javascript"/>').attr('src', path).prependTo($('script:first')));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
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
    getPlugin = wiki.getPlugin = function(plugin) {
      if (window.plugins[plugin] == null) {
        wiki.getScript("/plugins/" + plugin + ".js");
      }
      return window.plugins[plugin];
    };
    doPlugin = wiki.doPlugin = function(div, item) {
      var plugin;
      try {
        div.data('pageElement', div.parents(".page"));
        div.data('item', item);
        plugin = getPlugin(item.type);
        if (plugin == null) {
          throw TypeError("Can't find plugin for '" + item.type + "'");
        }
        plugin.emit(div, item);
        return plugin.bind(div, item);
      } catch (err) {
        return div.append("<p class='error'>" + err + "</p>");
      }
    };
    doInternalLink = wiki.doInternalLink = function(name, page) {
      if (page != null) $(page).nextAll().remove();
      return scrollTo(createPage(asSlug(name)).appendTo($('.main')).each(refresh));
    };
    scrollTo = function(el) {
      var contentWidth, maxX, minX, target, width;
      minX = $("body").scrollLeft();
      maxX = minX + $("body").width();
      target = el.position().left;
      width = el.outerWidth(true);
      contentWidth = $(".page").outerWidth(true) * $(".page").size();
      if (target < minX) {
        return $("body").animate({
          scrollLeft: target
        });
      } else if (target + width > maxX) {
        return $("body").animate({
          scrollLeft: target - ($("body").width() - width)
        });
      } else if (maxX > $(".pages").outerWidth()) {
        return $("body").animate({
          scrollLeft: Math.min(target, contentWidth - $("body").width())
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
          return div.append("<img src=\"" + item.url + "\"> <p>" + (resolveLinks(item.caption)) + "</p>");
        },
        bind: function(div, item) {}
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
            return $(e.target).siblings("p").last().html(formatTime(time));
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
      var buildPage, initDragging, json, pageElement, resource, site, slug;
      pageElement = $(this);
      slug = $(pageElement).attr('id');
      site = $(pageElement).data('site');
      pageElement.find(".add-factory").live("click", function(evt) {
        var before, beforeElement, item, itemElement;
        evt.preventDefault();
        item = {
          type: "factory",
          id: randomBytes(8)
        };
        itemElement = $("<div />", {
          "class": "item factory",
          id: item.id
        }).data('item', item);
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
              return value.id;
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
          $(pageElement).append("<h1><a href=\"/\"><img src = \"/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>");
        }
        _ref2 = ['story', 'journal', 'footer'].map(function(className) {
          return $("<div />").addClass(className).appendTo(pageElement);
        }), storyElement = _ref2[0], journalElement = _ref2[1], footerElement = _ref2[2];
        $.each(page.story, function(i, item) {
          var div;
          div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id);
          storyElement.append(div);
          return doPlugin(div, item);
        });
        $.each(page.journal, function(i, action) {
          return addToJournal(journalElement, action);
        });
        return footerElement.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ').append("<a class=\"show-page-source\" href=\"/" + slug + ".json?random=" + (randomBytes(4)) + "\" title=\"source\">JSON</a> . ").append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>");
      };
      if ($(pageElement).attr('data-server-generated') === 'true') {
        initDragging();
        return pageElement.find('.item').each(function(i, each) {
          var div, item;
          div = $(each);
          item = getItem(div);
          return getPlugin(item.type).bind(div, item);
        });
      } else {
        if (useLocalStorage() && (json = localStorage[pageElement.attr("id")])) {
          pageElement.addClass("local");
          buildPage(JSON.parse(json));
          return initDragging();
        } else {
          resource = site != null ? "remote/" + site + "/" + slug : slug;
          return $.get("/" + resource + ".json?random=" + (randomBytes(4)), "", function(page) {
            buildPage(page);
            return initDragging();
          });
        }
      }
    };
    setState = function(state) {
      var page, url;
      if (History.enabled) {
        url = ((function() {
          var _i, _len, _ref, _results;
          _ref = state.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push("/view/" + page);
          }
          return _results;
        })()).join('');
        return History.pushState(state, state.active, url);
      }
    };
    setActive = function(page) {
      var state;
      if (History.enabled) {
        state = History.getState().data;
        state.active = page;
        return setState(state);
      }
    };
    showState = function(state) {
      var name, newPages, oldPages, previousPage, _i, _j, _len, _len2;
      oldPages = pagesInDom();
      newPages = state.pages;
      previousPage = newPages;
      if (!newPages) return;
      for (_i = 0, _len = newPages.length; _i < _len; _i++) {
        name = newPages[_i];
        if (__indexOf.call(oldPages, name) >= 0) {
          delete oldPages[oldPages.indexOf(name)];
        } else {
          createPage(name).insertAfter(previousPage).each(refresh);
        }
        previousPage = findPage(name);
      }
      for (_j = 0, _len2 = oldPages.length; _j < _len2; _j++) {
        name = oldPages[_j];
        name && findPage(name).remove();
      }
      $(".active").removeClass("active");
      return scrollTo($("#" + state.active).addClass("active"));
    };
    History.Adapter.bind(window, 'statechange', function() {
      var state;
      if (state = History.getState().data) return showState(state);
    });
    LEFTARROW = 37;
    RIGHTARROW = 39;
    $(document).keydown(function(event) {
      var direction, newIndex, state;
      direction = (function() {
        switch (event.which) {
          case LEFTARROW:
            return -1;
          case RIGHTARROW:
            return +1;
        }
      })();
      if (direction && History.enabled) {
        state = History.getState().data;
        newIndex = state.pages.indexOf(state.active) + direction;
        if ((0 <= newIndex && newIndex < state.pages.length)) {
          state.active = state.pages[newIndex];
        }
        return setState(state);
      }
    });
    pagesInDom = function() {
      return $.makeArray($(".page").map(function(_, el) {
        return el.id;
      }));
    };
    createPage = function(name, loc) {
      if (loc && (loc !== ('view' || 'my'))) {
        return $("<div/>").attr('id', name).attr('data-site', loc).addClass("page");
      } else {
        return $("<div/>").attr('id', name).addClass("page");
      }
    };
    findPage = function(name) {
      return $("#" + name);
    };
    $(document).ajaxError(function(event, request, settings) {
      wiki.log('ajax error', event, request, settings);
      return $('.main').prepend("<li class='error'>Error on " + settings.url + "</li>");
    });
    $('.main').delegate('.show-page-source', 'click', function(e) {
      var json, pageElement, resource, site, slug;
      e.preventDefault();
      if (useLocalStorage() && (json = localStorage[pageElement.attr("id")])) {
        return window.dialog.dialog('open');
      } else {
        pageElement = $(this).parent().parent();
        slug = $(pageElement).attr('id');
        site = $(pageElement).data('site');
        resource = site != null ? "remote/" + site + "/" + slug : slug;
        return $.get("/" + resource + ".json?random=" + (randomBytes(4)), "", function(page) {
          window.dialog.html($('<pre/>').text(JSON.stringify(page, null, 2)));
          window.dialog.dialog("option", "title", "Source for: " + slug);
          return window.dialog.dialog('open');
        });
      }
    }).delegate('.page', 'click', function(e) {
      if (!$(e.target).is("a")) return setActive(this.id);
    }).delegate('.internal', 'click', function(e) {
      var name;
      e.preventDefault();
      name = $(e.target).data('pageName');
      wiki.log('click', name);
      if (!e.shiftKey) $(e.target).parents('.page').nextAll().remove();
      scrollTo(createPage(name).appendTo('.main').each(refresh));
      if (History.enabled) {
        return setState({
          pages: pagesInDom(),
          active: name
        });
      }
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
      scrollTo(createPage(name).data('site', $(e.target).data('site')).appendTo($('.main')).each(refresh));
      if (History.enabled) {
        return setState({
          pages: pagesInDom(),
          active: name
        });
      }
    });
    useLocalStorage = function() {
      return $("#authenticated").length === 0;
    };
    urlPages = ((function() {
      var _i, _len, _ref, _results, _step;
      _ref = $(location).attr('pathname').split('/');
      _results = [];
      for (_i = 0, _len = _ref.length, _step = 2; _i < _len; _i += _step) {
        i = _ref[_i];
        _results.push(i);
      }
      return _results;
    })()).slice(1);
    urlLocs = (function() {
      var _i, _len, _ref, _results, _step;
      _ref = $(location).attr('pathname').split('/').slice(1);
      _results = [];
      for (_i = 0, _len = _ref.length, _step = 2; _i < _len; _i += _step) {
        j = _ref[_i];
        _results.push(j);
      }
      return _results;
    })();
    for (idx = 0, _len = urlPages.length; idx < _len; idx++) {
      urlPage = urlPages[idx];
      if (__indexOf.call(pagesInDom(), urlPage) < 0) {
        createPage(urlPage, urlLocs[idx]).appendTo('.main');
      }
    }
    $('.page').each(refresh);
    startPages = pagesInDom();
    return setState({
      pages: startPages,
      active: startPages[startPages.length - 1]
    });
  });

}).call(this);
