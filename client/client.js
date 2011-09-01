(function() {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
  $(function() {
    var addJournal, bindDragAndDrop, format, getItem, plugins, pushToLocal, pushToServer, put_action, refresh, resolve_links, text_editor, useLocalStorage;
    resolve_links = function(string) {
      return string.replace(/\[\[([a-z0-9-]+)\]\]/g, "<a class=\"internal\" href=\"/$1.html\" data-page-name=\"$1\">$1</a>").replace(/\[(http.*?) (.*?)\]/g, "<a class=\"external\" href=\"$1\">$2</a>");
    };
    $('.main').delegate('.internal', 'click', function(e) {
      e.preventDefault();
      if (!e.shiftKey) {
        $(e.target).parents('.page').nextAll().remove();
      }
      return $("<div id=\"" + ($(e.target).attr('data-page-name')) + "\"/>").addClass("page").appendTo($('.main')).each(refresh);
    });
    addJournal = function(journalElement, action) {
      return $("<span /> ").addClass("action").addClass(action.type).text(action.type[0]).attr('data-item-id', action.id).appendTo(journalElement);
    };
    $('.main').delegate('.action', 'hover', function() {
      return $('#' + $(this).data('itemId')).toggleClass('target');
    });
    put_action = function(pageElement, action) {
      if (useLocalStorage()) {
        pushToLocal(pageElement, action);
        return pageElement.addClass("local");
      } else {
        return pushToServer(pageElement, action);
      }
    };
    pushToLocal = function(pageElement, action) {
      var page;
      console.log(JSON.stringify(action));
      page = localStorage[pageElement.attr("id")];
      if (page) {
        page = JSON.parse(page);
      }
      page || (page = pageElement.data("data"));
      page.journal.concat(action);
      page.story = $(pageElement).find(".item").map(function() {
        return $(this).data("item");
      }).get();
      localStorage[pageElement.attr("id")] = JSON.stringify(page);
      return addJournal(pageElement.find('.journal'), action);
    };
    pushToServer = function(pageElement, action) {
      return $.ajax({
        type: 'PUT',
        url: "/page/" + (pageElement.attr('id')) + "/action",
        data: {
          'action': JSON.stringify(action)
        },
        success: function() {
          return addJournal(pageElement.find('.journal'), action);
        },
        error: function(xhr, type, msg) {
          return console.log("ajax error type: " + type + " msg: " + msg);
        }
      });
    };
    text_editor = function(div, item) {
      var textarea, _ref;
      textarea = $("<textarea>" + ((_ref = item.text) != null ? _ref : '') + "</textarea>").focusout(function() {
        if (textarea.val()) {
          $(div).last('p').html("<p>" + (resolve_links(textarea.val())) + "</p>");
          if (textarea.val() === item.text) {
            return;
          }
          item.text = textarea.val();
          put_action(div.parents('.page:first'), {
            type: 'edit',
            id: item.id,
            item: item
          });
        } else {
          put_action(div.parents('.page:first'), {
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
    format = function(time) {
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
    bindDragAndDrop = function(div, item, allowedTypes) {
      if (allowedTypes == null) {
        allowedTypes = [];
      }
      ["dragenter", "dragover"].map(function(eventName) {
        return div.bind(eventName, function(evt) {
          return evt.preventDefault();
        });
      });
      return div.bind("drop", function(e) {
        var file, majorType, pageDiv, reader;
        e.preventDefault();
        file = e.originalEvent.dataTransfer.files[0];
        majorType = file.type.split("/")[0];
        if (allowedTypes.filter(function(t) {
          return t === majorType;
        }).length === 0) {
          return alert("Uploads of type " + majorType + " not supported for this item");
        } else {
          pageDiv = div.parents('.page:first');
          if (majorType === "image") {
            reader = new FileReader();
            reader.onload = function(event) {
              item.type = "image";
              item.url = event.target.result;
              item.caption || (item.caption = "Uploaded image");
              div.empty();
              div.removeClass("factory").addClass("image");
              put_action(pageDiv, {
                type: 'edit',
                id: item.id,
                item: item
              });
              return plugins.image.emit(div, item);
            };
            return reader.readAsDataURL(file);
          } else if (majorType === "text") {
            reader = new FileReader();
            reader.onload = function(event) {
              item.type === "paragraph";
              item.text = event.target.result;
              div.empty();
              div.removeClass("factory").addClass("paragraph");
              put_action(pageDiv, {
                type: 'edit',
                id: item.id,
                item: item
              });
              return plugins.paragraph.emit(div, item);
            };
            return reader.readAsText(file);
          }
        }
      });
    };
    plugins = {
      paragraph: {
        emit: function(div, item) {
          return div.append("<p>" + (resolve_links(item.text)) + "</p>");
        },
        bind: function(div, item) {
          return div.dblclick(function() {
            return text_editor(div, item);
          });
        }
      },
      image: {
        emit: function(div, item) {
          return div.append("<img src=\"" + item.url + "\"> <p>" + (resolve_links(item.caption)) + "</p>");
        },
        bind: function(div, item) {
          return bindDragAndDrop(div, item, ["image"]);
        }
      },
      chart: {
        emit: function(div, item) {
          var captionElement, chartElement;
          chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last());
          return captionElement = $('<p />').html(resolve_links(item.caption)).appendTo(div);
        },
        bind: function(div, item) {
          return div.find('p:first').mousemove(function(e) {
            var sample, time, _ref;
            _ref = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)], time = _ref[0], sample = _ref[1];
            $(e.target).text(sample.toFixed(1));
            return $(e.target).siblings("p").last().html(format(time));
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
            return text_editor(div, item);
          });
        }
      },
      changes: {
        emit: function(div, item) {
          var i, ul, _ref, _results;
          div.append(ul = $('<ul />').append($('<input type="button" value="clear" />')));
          _results = [];
          for (i = 0, _ref = localStorage.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
            _results.push(ul.append($('<li />').append(localStorage.key(i))));
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
      var buildPage, initDragging, pageElement, page_json, page_name;
      pageElement = $(this);
      page_name = $(pageElement).attr('id');
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
            return put_action(pageElement, action);
          },
          connectWith: '.page .story'
        });
      };
      buildPage = function(data) {
        var empty, footerElement, journalElement, page, storyElement, _ref;
        empty = {
          title: 'empty',
          synopsys: 'empty',
          story: [],
          journal: []
        };
        page = $.extend(empty, data);
        $(pageElement).data("data", data);
        $(pageElement).append('<h1><a href="/"><img src = "/favicon.png" height = "32px"></a> ' + page.title + '</h1>');
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
            plugin = plugins[item.type];
            plugin.emit(div, item);
            return plugin.bind(div, item);
          } catch (err) {
            return div.append("<p class='error'>" + err + "</p>");
          }
        });
        $.each(page.journal, function(i, action) {
          return addJournal(journalElement, action);
        });
        return footerElement.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ').append("<a href=\"/" + page_name + ".json\">JSON</a>");
      };
      if ($(pageElement).attr('data-server-generated') === 'true') {
        initDragging();
        return pageElement.find('.item').each(function(i, each) {
          var div, item;
          div = $(each);
          item = getItem(div);
          return plugins[item.type].bind(div, item);
        });
      } else {
        if (page_json = localStorage[pageElement.attr("id")]) {
          pageElement.addClass("local");
          buildPage(JSON.parse(page_json));
          return initDragging();
        } else {
          return $.get("/" + page_name + ".json", "", function(page) {
            buildPage(page);
            return initDragging();
          });
        }
      }
    };
    $(document).ajaxError(function(event, request, settings) {
      return $('.main').prepend("<li><font color=red>Error on " + settings.url + "</li>");
    });
    $('.page').each(refresh);
    return useLocalStorage = function() {
      return $(".local-editing").is(":checked");
    };
  });
}).call(this);
