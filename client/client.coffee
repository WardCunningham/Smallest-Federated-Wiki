Array::last = ->
  this[@length - 1]

$ ->
  resolve_links = (string) ->
    string.replace(/\[\[([a-z-]+)\]\]/g, "<a href=\"/$1\">$1</a>").replace /\[(http.*?) (.*?)\]/g, "<a href=\"$1\">$2</a>"
  refresh = ->
    pageElement = $(this)
    page_name = $(pageElement).attr("id")

    getItem = (element) ->
      $(element).data("item") or JSON.parse($(element).attr("data-static-item"))  if $(element).length > 0

    initDragging = ->
      storyElement = pageElement.find(".story")
      storyElement.sortable
        update: (evt, ui) ->
          itemElement = ui.item
          item = getItem(itemElement)
          thisPageElement = $(this).parents(".page:first")
          sourcePageElement = itemElement.data("pageElement")
          destinationPageElement = itemElement.parents(".page:first")
          journalElement = thisPageElement.find(".journal")
          equals = (a, b) ->
            a and b and a.get(0) == b.get(0)

          moveWithinPage = not sourcePageElement or equals(sourcePageElement, destinationPageElement)
          moveFromPage = not moveWithinPage and equals(thisPageElement, sourcePageElement)
          moveToPage = not moveWithinPage and equals(thisPageElement, destinationPageElement)
          if moveWithinPage
            order = $(this).children().map((key, value) ->
              value.id
            ).get()
            edit =
              type: "move"
              order: order

            console.log JSON.stringify(edit)
          else if moveFromPage
            edit =
              type: "remove"
              id: item.id

            console.log JSON.stringify(edit)
            journalElement.prepend $("<span />").addClass("edit").addClass("remove").text("r")
          else if moveToPage
            itemElement.data "pageElement", thisPageElement
            beforeElement = itemElement.prev(".item")
            before = getItem(beforeElement)
            beforeId = (if before then before.id else null)
            edit =
              type: "add"
              item: item
              previousSibling: beforeId

            console.log JSON.stringify(edit)
            journalElement.prepend $("<span />").addClass("edit").addClass("add").text("a")

        connectWith: ".page .story"

    initChartElement = (chartElement) ->
      $(chartElement).mousemove (e) ->
        item = getItem($(e.target).parent(".chart"))
        sample = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]
        d = new Date(sample[0])
        m = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ][d.getMonth()]
        h = d.getHours()
        am = (if h < 12 then "AM" else "PM")
        h = (if h == 0 then 12 else (if h > 12 then h - 12 else h))
        time = h + ":" + (if d.getMinutes() < 10 then "0" else "") + d.getMinutes() + " " + am + "<br>" + d.getDate() + " " + m + " " + d.getFullYear()
        $(e.target).text sample[1].toFixed(1)
        $(e.target).siblings("p").last().html time

    buildPage = (data) ->
      empty =
        title: "empty"
        synopsys: "empty"
        story: []
        journal: []

      page = $.extend(empty, data)
      $(pageElement).append "<h1><a href=\"/\"><img src = \"/favicon.png\" height = \"32px\"></a> " + page.title + "</h1>"
      storyElement = $("<div />").addClass("story").appendTo(pageElement)
      journalElement = $("<div />").addClass("journal").appendTo(pageElement)
      pageElement.append "<div class=\"footer\" />"
      $.each page.story, ->
        item = this
        div = $("<div class=\"item " + item.type + "\" id=\"" + item.id + "\" />")
        $(pageElement).children(".story").append div
        try
          div.data "pageElement", pageElement
          div.data "item", item
          if item.type == "paragraph"
            div.append "<p>" + resolve_links(item.text) + "</p>"
            div.dblclick ->
              textarea = $("<textarea>" + item.text + "</textarea>")
              textarea.focusout ->
                item.text = textarea.val()
                $(div).last("p").html "<p>" + resolve_links(item.text) + "</p>"

              div.html textarea
              textarea.focus()
          div.append "<img src=\"" + item.url + "\"> <p>" + resolve_links(item.caption) + "</p>"  if item.type == "image"
          if item.type == "chart"
            chartElement = $("<p />").addClass("readout").appendTo(div).text(item.data.last().last())
            captionElement = $("<p />").text(resolve_links(item.caption)).appendTo(div)
            initChartElement chartElement
        catch err
          $("#" + item.id).append "<p>" + err + "</p>"

      $.each page.journal.reverse(), (i, item) ->
        journalElement.append "<span> <span class=\"edit " + item.type + "\">" + item.type[0] + "</span></span>"

      $(pageElement).children(".footer").append("<a id=\"license\" href=\"http://creativecommons.org/licenses/by-sa/3.0/\">CC BY-SA 3.0</a> . ").append "<a href=\"/" + page_name + "/json\">JSON</a>"

    if $(pageElement).attr("data-server-generated") == "true"
      initDragging()
      $(".readout").each ->
        initChartElement this
    else
      $.get "/" + page_name + "/json", "", (page_json) ->
        buildPage JSON.parse(page_json)
        initDragging()
  $(document).ajaxError (event, request, settings) ->
    $(".main").prepend "<li><font color=red>Error on " + settings.url + "</li>"

  $(".page").each refresh