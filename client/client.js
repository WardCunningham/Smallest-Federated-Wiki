(function() {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
  $(function() {
    var addJournal, format, getItem, plugins, refresh, resolve_links;
    resolve_links = function(string) {
      return string.replace(/\[\[([a-z-]+)\]\]/g, "<a href=\"/$1\">$1</a>").replace(/\[(http.*?) (.*?)\]/g, "<a href=\"$1\">$2</a>");
    };
    addJournal = function(journalElement, edit) {
      var editElement;
      editElement = $("<span><span class=\"edit " + edit.type + "\">" + edit.type[0] + "</span></span>").prependTo(journalElement);
      editElement.mouseover(function() {
        return $("[id=" + edit.id + "]").addClass("edited");
      });
      return editElement.mouseout(function() {
        return $("[id=" + edit.id + "]").removeClass("edited");
      });
    };
    format = function(time) {
      var am, d, h, m;
      d = new Date(time);
      m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
      h = d.getHours();
      am = (h < 12 ? "AM" : "PM");
      h = (h === 0 ? 12 : (h > 12 ? h - 12 : h));
      return h + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes() + " " + am + "<br>" + d.getDate() + " " + m + " " + d.getFullYear();
    };
    getItem = function(element) {
      if ($(element).length > 0) {
        return $(element).data("item") || JSON.parse($(element).attr("data-static-item"));
      }
    };
    plugins = {
      paragraph: {
        emit: function(div, item) {
          return div.append("<p>" + resolve_links(item.text) + "</p>");
        },
        bind: function(div, item) {
          return div.dblclick(function() {
            var textarea;
            textarea = $("<textarea>" + item.text + "</textarea>");
            textarea.focusout(function() {
              var edit, journalElement;
              item.text = textarea.val();
              $(div).last("p").html("<p>" + resolve_links(item.text) + "</p>");
              edit = {
                type: "edit",
                id: item.id,
                text: item.text
              };
              console.log(JSON.stringify(edit));
              journalElement = div.parents(".page:first").find(".journal");
              return addJournal(journalElement, edit);
            });
            div.html(textarea);
            return textarea.focus();
          });
        }
      },
      image: {
        emit: function(div, item) {
          return div.append("<img src=\"" + item.url + "\"> <p>" + resolve_links(item.caption) + "</p>");
        },
        bind: function(div, item) {
          return "";
        }
      },
      chart: {
        emit: function(div, item) {
          var captionElement, chartElement;
          chartElement = $("<p />").addClass("readout").appendTo(div).text(item.data.last().last());
          return captionElement = $("<p />").html(resolve_links(item.caption)).appendTo(div);
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
          return div.append("<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>");
        },
        bind: function(div, item) {
          return div.get(0).ondrop = function(e) {
            var file, reader;
            e.preventDefault();
            file = e.dataTransfer.files[0];
            reader = new FileReader();
            reader.onload = function(event) {
              item.type = "image";
              return item.url = 'url(' + event.target.result + ')';
            };
            reader.readAsDataURL(file);
            return false;
          };
        }
      }
    };
    refresh = function() {
      var buildPage, initDragging, pageElement, page_name;
      pageElement = $(this);
      page_name = $(pageElement).attr("id");
      initDragging = function() {
        var storyElement;
        storyElement = pageElement.find(".story");
        return storyElement.sortable({
          update: function(evt, ui) {
            var before, beforeElement, destinationPageElement, edit, equals, item, itemElement, journalElement, moveFromPage, moveToPage, moveWithinPage, order, sourcePageElement, thisPageElement;
            itemElement = ui.item;
            item = getItem(itemElement);
            thisPageElement = $(this).parents(".page:first");
            sourcePageElement = itemElement.data("pageElement");
            destinationPageElement = itemElement.parents(".page:first");
            journalElement = thisPageElement.find(".journal");
            equals = function(a, b) {
              return a && b && a.get(0) === b.get(0);
            };
            moveWithinPage = !sourcePageElement || equals(sourcePageElement, destinationPageElement);
            moveFromPage = !moveWithinPage && equals(thisPageElement, sourcePageElement);
            moveToPage = !moveWithinPage && equals(thisPageElement, destinationPageElement);
            edit = moveWithinPage ? (order = $(this).children().map(function(_, value) {
              return value.id;
            }).get(), {
              type: "move",
              order: order
            }) : moveFromPage ? {
              type: "remove"
            } : moveToPage ? (itemElement.data("pageElement", thisPageElement), beforeElement = itemElement.prev(".item"), before = getItem(beforeElement), {
              type: "add",
              item: item,
              after: before != null ? before.id : void 0
            }) : void 0;
            edit.id = item.id;
            console.log(JSON.stringify(edit));
            return addJournal(journalElement, edit);
          },
          connectWith: ".page .story"
        });
      };
      buildPage = function(data) {
        var empty, footerElement, journalElement, page, storyElement, _ref;
        empty = {
          title: "empty",
          synopsys: "empty",
          story: [],
          journal: []
        };
        page = $.extend(empty, data);
        $(pageElement).append("<h1><a href=\"/\"><img src = \"/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>");
        _ref = ["story", "journal", "footer"].map(function(className) {
          return $("<div />").addClass(className).appendTo(pageElement);
        }), storyElement = _ref[0], journalElement = _ref[1], footerElement = _ref[2];
        $.each(page.story, function(i, item) {
          var div, plugin;
          div = $("<div class=\"item " + item.type + "\" id=\"" + item.id + "\" />");
          storyElement.append(div);
          try {
            div.data("pageElement", pageElement);
            div.data("item", item);
            plugin = plugins[item.type];
            plugin.emit(div, item);
            return plugin.bind(div, item);
          } catch (err) {
            return div.append("<p class='error'>" + err + "</p>");
          }
        });
        $.each(page.journal, function(i, edit) {
          return addJournal(journalElement, edit);
        });
        return footerElement.append("<a id=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/\">CC BY-SA 3.0</a> . ").append("<a href=\"/" + page_name + "/json\">JSON</a>");
      };
      if ($(pageElement).attr("data-server-generated") === "true") {
        initDragging();
        return pageElement.find(".item").each(function(i, each) {
          var div, item;
          div = $(each);
          item = getItem(div);
          return plugins[item.type].bind(div, item);
        });
      } else {
        return $.get("/" + page_name + "/json", "", function(page_json) {
          buildPage(JSON.parse(page_json));
          return initDragging();
        });
      }
    };
    $(document).ajaxError(function(event, request, settings) {
      return $(".main").prepend("<li><font color=red>Error on " + settings.url + "</li>");
    });
    return $(".page").each(refresh);
  });
}).call(this);
