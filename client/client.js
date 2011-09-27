(function() {
  var __slice = Array.prototype.slice;
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
  $(function() {
    var addToJournal, bindDragAndDrop, formatTime, getItem, getPlugin, pushToLocal, pushToServer, putAction, randomByte, randomBytes, refresh, resolveLinks, scripts, textEditor, useLocalStorage;
    window.wiki = {};
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
    resolveLinks = function(string) {
      return string.replace(/\[\[([a-z0-9-]+)\]\]/g, "<a class=\"internal\" href=\"/$1.html\" data-page-name=\"$1\">$1</a>").replace(/\[(http.*?) (.*?)\]/g, "<a class=\"external\" href=\"$1\">$2</a>");
    };
    addToJournal = function(journalElement, action) {
      var actionElement, pageElement;
      pageElement = journalElement.parents('.page:first');
      actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type).text(action.type[0]).attr('data-item-id', action.id || "0").appendTo(journalElement);
      if (action.type === 'fork') {
        return actionElement.css("background-image", "url(//" + action.site + "/favicon.png)").attr("href", "//" + action.site + "/" + (pageElement.attr('id')) + ".html").attr("data-site", action.site).attr("data-slug", pageElement.attr('id'));
      }
    };
    putAction = function(pageElement, action) {
      var now;
      now = new Date();
      action['date'] = now.toJSON();
      action['userTZ'] = now.getTimezoneOffset();
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
      if (page) {
        page = JSON.parse(page);
      }
      page || (page = pageElement.data("data"));
      if (page.journal == null) {
        page.journal = [];
      }
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
          return console.log("ajax error type: " + type + " msg: " + msg);
        }
      });
    };
    textEditor = function(div, item) {
      var textarea, _ref;
      textarea = $("<textarea>" + ((_ref = item.text) != null ? _ref : '') + "</textarea>").focusout(function() {
        if (textarea.val()) {
          $(div).last('p').html("<p>" + (resolveLinks(textarea.val())) + "</p>");
          if (textarea.val() === item.text) {
            return;
          }
          item.text = textarea.val();
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
        if (e.which === 27) {
          return textarea.focusout();
        }
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
        return $(element).data("item") || JSON.parse($(element).attr('data-static-item'));
      }
    };
    wiki.getData = function() {
      var chart;
      return chart = $('.chart:first').data('item').data;
    };
    scripts = {};
    wiki.getScript = function() {
      var path, paths, _i, _len, _results;
      paths = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = paths.length; _i < _len; _i++) {
        path = paths[_i];
        _results.push(scripts[path] == null ? (scripts[path] = true, $('<script type="text/javascript"/>').attr('src', "/" + path).prependTo($('script:first'))) : void 0);
      }
      return _results;
    };
    getPlugin = function(plugin) {
      if (window.plugins[plugin] == null) {
        wiki.getScript("plugins/" + plugin + ".js");
      }
      return window.plugins[plugin];
    };
    bindDragAndDrop = function(div, item, allowedTypes) {
      if (allowedTypes == null) {
        allowedTypes = [];
      }
      ["dragenter", "dragover"].map(function(eventName) {
        return div.bind(eventName, function(evt) {
          return evt.preventDefault();
        });
      });
      return div.bind("drop", function(dropEvent) {
        var file, finishDrop, majorType, minorType, reader, _ref;
        finishDrop = function(type, handler) {
          return function(loadEvent) {
            var action, pageDiv;
            item.type = type;
            handler(loadEvent);
            div.empty();
            div.removeClass("factory").addClass(type);
            pageDiv = div.parents('.page:first');
            action = {
              type: 'edit',
              id: item.id,
              item: item
            };
            putAction(pageDiv, action);
            return getPlugin(type).emit(div, item);
          };
        };
        dropEvent.preventDefault();
        file = dropEvent.originalEvent.dataTransfer.files[0];
        _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
        if (allowedTypes.filter(function(t) {
          return t === majorType;
        }).length === 0) {
          return alert("Uploads of type " + majorType + " not supported for this item");
        } else {
          reader = new FileReader();
          if (majorType === "image") {
            reader.onload = finishDrop("image", function(loadEvent) {
              item.url = loadEvent.target.result;
              return item.caption || (item.caption = "Uploaded image");
            });
            return reader.readAsDataURL(file);
          } else if (majorType === "text") {
            reader.onload = finishDrop("paragraph", function(loadEvent) {
              return item.text = loadEvent.target.result;
            });
            return reader.readAsText(file);
          }
        }
      });
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
        bind: function(div, item) {
          return bindDragAndDrop(div, item, ["image"]);
        }
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
      factory: {
        emit: function(div, item) {
          return div.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');
        },
        bind: function(div, item) {
          bindDragAndDrop(div, item, ["image", "text"]);
          return div.dblclick(function() {
            div.removeClass('factory').addClass(item.type = 'paragraph');
            return textEditor(div, item);
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
            a = $('<a class="internal" href="#" />').append(key).attr('data-page-name', key);
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
      site = $(pageElement).attr('data-site');
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
        });
        pageElement.find(".story").append(itemElement);
        plugins.factory.emit(itemElement, item);
        plugins.factory.bind(itemElement, item);
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
        var empty, footerElement, icon, journalElement, page, storyElement, _ref;
        empty = {
          title: 'empty',
          synopsys: 'empty',
          story: [],
          journal: []
        };
        page = $.extend(empty, data);
        $(pageElement).data("data", data);
        icon = site != null ? "/remote/" + site + "/favicon.png" : "/favicon.png";
        $(pageElement).append('<h1><a href="/"><img src = "' + icon + '" height = "32px"></a> ' + page.title + '</h1>');
        _ref = ['story', 'journal', 'footer'].map(function(className) {
          return $("<div />").addClass(className).appendTo(pageElement);
        }), storyElement = _ref[0], journalElement = _ref[1], footerElement = _ref[2];
        $.each(page.story, function(i, item) {
          var div, plugin;
          div = $("<div class=\"item " + item.type + "\" id=\"" + item.id + "\" />");
          storyElement.append(div);
          try {
            div.data('pageElement', pageElement);
            div.data('item', item);
            plugin = getPlugin(item.type);
            plugin.emit(div, item);
            return plugin.bind(div, item);
          } catch (err) {
            return div.append("<p class='error'>" + err + "</p>");
          }
        });
        $.each(page.journal, function(i, action) {
          return addToJournal(journalElement, action);
        });
        return footerElement.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ').append("<a href=\"/" + slug + ".json?random=" + (randomBytes(4)) + "\" title=\"source\">JSON</a> . ").append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>");
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
        if (json = localStorage[pageElement.attr("id")]) {
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
    $(document).ajaxError(function(event, request, settings) {
      console.log([event, request, settings]);
      return $('.main').prepend("<li class='error'>Error on " + settings.url + "<br/>" + request.responseText + "</li>");
    });
    $('.page').each(refresh);
    $('.main').delegate('.internal', 'click', function(e) {
      e.preventDefault();
      if (!e.shiftKey) {
        $(e.target).parents('.page').nextAll().remove();
      }
      return $("<div id=\"" + ($(e.target).attr('data-page-name')) + "\"/>").addClass("page").appendTo($('.main')).each(refresh);
    }).delegate('.action', 'hover', function() {
      return $('#' + $(this).data('itemId')).toggleClass('target');
    }).delegate('.action.fork', 'click', function(e) {
      e.preventDefault();
      if (!e.shiftKey) {
        $(e.target).parents('.page').nextAll().remove();
      }
      return $("<div />").attr('id', $(e.target).attr('data-slug')).attr('data-site', $(e.target).attr('data-site')).addClass("page").appendTo($('.main')).each(refresh);
    });
    return useLocalStorage = function() {
      return $('#localEditing').is(':checked');
    };
  });
}).call(this);
