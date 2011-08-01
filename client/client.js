(function() {
  Array.prototype.last = function() {
    return this[this.length - 1];
  };
  $(function() {
    var refresh, resolve_links;
    resolve_links = function(string) {
      return string.replace(/\[\[([a-z-]+)\]\]/g, "<a href=\"/$1\">$1</a>").replace(/\[(http.*?) (.*?)\]/g, "<a href=\"$1\">$2</a>");
    };
    refresh = function() {
      var buildPage, getItem, initChartElement, initDragging, pageElement, page_name;
      pageElement = $(this);
      page_name = $(pageElement).attr("id");
      getItem = function(element) {
        if ($(element).length > 0) {
          return $(element).data("item") || JSON.parse($(element).attr("data-static-item"));
        }
      };
      initDragging = function() {
        var storyElement;
        storyElement = pageElement.find(".story");
        return storyElement.sortable({
          update: function(evt, ui) {
            var before, beforeElement, beforeId, destinationPageElement, edit, equals, item, itemElement, journalElement, moveFromPage, moveToPage, moveWithinPage, order, sourcePageElement, thisPageElement;
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
            if (moveWithinPage) {
              order = $(this).children().map(function(key, value) {
                return value.id;
              }).get();
              edit = {
                type: "move",
                order: order
              };
              return console.log(JSON.stringify(edit));
            } else if (moveFromPage) {
              edit = {
                type: "remove",
                id: item.id
              };
              console.log(JSON.stringify(edit));
              return journalElement.prepend($("<span />").addClass("edit").addClass("remove").text("r"));
            } else if (moveToPage) {
              itemElement.data("pageElement", thisPageElement);
              beforeElement = itemElement.prev(".item");
              before = getItem(beforeElement);
              beforeId = (before ? before.id : null);
              edit = {
                type: "add",
                item: item,
                previousSibling: beforeId
              };
              console.log(JSON.stringify(edit));
              return journalElement.prepend($("<span />").addClass("edit").addClass("add").text("a"));
            }
          },
          connectWith: ".page .story"
        });
      };
      initChartElement = function(chartElement) {
        return $(chartElement).mousemove(function(e) {
          var am, d, h, item, m, sample, time;
          item = getItem($(e.target).parent(".chart"));
          sample = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)];
          d = new Date(sample[0]);
          m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()];
          h = d.getHours();
          am = (h < 12 ? "AM" : "PM");
          h = (h === 0 ? 12 : (h > 12 ? h - 12 : h));
          time = h + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes() + " " + am + "<br>" + d.getDate() + " " + m + " " + d.getFullYear();
          $(e.target).text(sample[1].toFixed(1));
          return $(e.target).siblings("p").last().html(time);
        });
      };
      buildPage = function(data) {
        var empty, journalElement, page, storyElement;
        empty = {
          title: "empty",
          synopsys: "empty",
          story: [],
          journal: []
        };
        page = $.extend(empty, data);
        $(pageElement).append("<h1><a href=\"/\"><img src = \"/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>");
        storyElement = $("<div />").addClass("story").appendTo(pageElement);
        journalElement = $("<div />").addClass("journal").appendTo(pageElement);
        pageElement.append("<div class=\"footer\" />");
        $.each(page.story, function() {
          var captionElement, chartElement, div, item;
          item = this;
          div = $("<div class=\"item " + item.type + "\" id=\"" + item.id + "\" />");
          $(pageElement).children(".story").append(div);
          try {
            div.data("pageElement", pageElement);
            div.data("item", item);
            if (item.type === "paragraph") {
              div.append("<p>" + resolve_links(item.text) + "</p>");
              div.dblclick(function() {
                var textarea;
                textarea = $("<textarea>" + item.text + "</textarea>");
                textarea.focusout(function() {
                  item.text = textarea.val();
                  return $(div).last("p").html("<p>" + resolve_links(item.text) + "</p>");
                });
                div.html(textarea);
                return textarea.focus();
              });
            }
            if (item.type === "image") {
              div.append("<img src=\"" + item.url + "\"> <p>" + resolve_links(item.caption) + "</p>");
            }
            if (item.type === "chart") {
              chartElement = $("<p />").addClass("readout").appendTo(div).text(item.data.last().last());
              captionElement = $("<p />").text(resolve_links(item.caption)).appendTo(div);
              return initChartElement(chartElement);
            }
          } catch (err) {
            return $("#" + item.id).append("<p>" + err + "</p>");
          }
        });
        $.each(page.journal.reverse(), function(i, item) {
          return journalElement.append("<span> <span class=\"edit " + item.type + "\">" + item.type[0] + "</span></span>");
        });
        return $(pageElement).children(".footer").append("<a id=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/\">CC BY-SA 3.0</a> . ").append("<a href=\"/" + page_name + "/json\">JSON</a>");
      };
      if ($(pageElement).attr("data-server-generated") === "true") {
        initDragging();
        return $(".readout").each(function() {
          return initChartElement(this);
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
