Array::last = ->
  this[@length - 1]

$ ->
  resolve_links = (string) ->
    string
      .replace(/\[\[([a-z0-9-]+)\]\]/g, "<a href=\"/$1.html\">$1</a>")
      .replace /\[(http.*?) (.*?)\]/g, "<a href=\"$1\">$2</a>"

  addJournal = (journalElement, action) ->
    $("<span /> ").addClass("action").addClass(action.type)
      .text(action.type[0])
      .attr('data-item-id', action.id)
      .mouseover () ->
        $("[id=#{action.id}]").addClass("target")
      .mouseout () ->
        $("[id=#{action.id}]").removeClass("target")
      .appendTo(journalElement)

  put_action = (pageElement, action) ->
    if useLocalStorage()
      pushToLocal(pageElement, action)
      pageElement.addClass("local")
    else
      pushToServer(pageElement, action)

  pushToLocal = (pageElement, action) ->
    console.log(JSON.stringify(action))
    page = localStorage[pageElement.attr("id")]
    page = JSON.parse(page) if page
    page ||= pageElement.data("data")
    page.journal.concat(action)
    page.story = $(pageElement).find(".item").map(-> $(@).data("item")).get()
    localStorage[pageElement.attr("id")] = JSON.stringify(page)
    addJournal pageElement.find('.journal'), action

  pushToServer = (pageElement, action) ->
    $.ajax
      type: 'PUT'
      url: "/page/#{pageElement.attr('id')}/action"
      data:
        'action': JSON.stringify(action)
      success: () ->
        addJournal pageElement.find('.journal'), action
      error: (xhr, type, msg) ->
        console.log "ajax error type: #{type} msg: #{msg}"

  text_editor = (div, item) ->
    textarea = $("<textarea>#{item.text ? ''}</textarea>")
      .focusout ->
        if textarea.val()
          $(div).last('p').html "<p>#{resolve_links(textarea.val())}</p>"
          return if textarea.val() == item.text
          item.text = textarea.val()
          put_action div.parents('.page:first'), {type: 'edit', id: item.id, item: item}
        else
          put_action div.parents('.page:first'), {type: 'remove', id: item.id}
          div.remove()
        null
      .bind 'keydown', (e) ->
        textarea.focusout() if e.which == 27 #esc
    div.html textarea
    textarea.focus()

  format = (time) ->
    d = new Date(time)
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
    h = d.getHours()
    am = if h < 12 then 'AM' else 'PM'
    h = if h == 0 then 12 else if h > 12 then h - 12 else h
    mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
    "#{h}:#{mi} #{am}<br>#{d.getDate()} #{mo} #{d.getFullYear()}"

  getItem = (element) ->
    $(element).data("item") or JSON.parse($(element).attr('data-static-item')) if $(element).length > 0

  plugins =
    paragraph:
      emit: (div, item) -> div.append "<p>#{resolve_links(item.text)}</p>"
      bind: (div, item) ->
        div.dblclick -> text_editor div, item
    image:
      emit: (div, item) -> div.append "<img src=\"#{item.url}\"> <p>#{resolve_links(item.caption)}</p>"
      bind: (div, item) ->
    chart:
      emit: (div, item) ->
        chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last())
        captionElement = $('<p />').html(resolve_links(item.caption)).appendTo(div)
      bind: (div, item) ->
        div.find('p:first').mousemove (e) ->
          [time, sample] = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]
          $(e.target).text sample.toFixed(1)
          $(e.target).siblings("p").last().html format(time)
    factory:
      emit: (div, item) -> div.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'
      bind: (div, item) ->
        # adapted from http://html5demos.com/file-api
        # not workig yet: missing something? interaction with sortable?
        div.get(0).ondrop = (e) ->
          e.preventDefault()
          file = e.dataTransfer.files[0]
          reader = new FileReader()
          reader.onload = (event) ->
            item.type = 'image'
            item.url = "url(#{event.target.result})"
          reader.readAsDataURL(file)
          false
        div.dblclick ->
          div.removeClass('factory').addClass(item.type='paragraph')
          text_editor div, item
    changes:
      emit: (div, item) ->
        div.append ul = $('<ul />').append $('<input type="button" value="clear" />')
        for i in [0...localStorage.length]
          ul.append($('<li />').append(localStorage.key(i)))
      bind: (div, item) ->
        div.find('input').click ->
          localStorage.clear()
          div.find('li').remove()

  refresh = ->
    pageElement = $(this)
    page_name = $(pageElement).attr('id')

    initDragging = ->
      storyElement = pageElement.find('.story')
      storyElement.sortable
        update: (evt, ui) ->
          itemElement = ui.item
          item = getItem(itemElement)
          thisPageElement = $(this).parents('.page:first')
          sourcePageElement = itemElement.data('pageElement')
          destinationPageElement = itemElement.parents('.page:first')
          journalElement = thisPageElement.find('.journal')
          equals = (a, b) -> a and b and a.get(0) == b.get(0)

          moveWithinPage = not sourcePageElement or equals(sourcePageElement, destinationPageElement)
          moveFromPage = not moveWithinPage and equals(thisPageElement, sourcePageElement)
          moveToPage = not moveWithinPage and equals(thisPageElement, destinationPageElement)

          action = if moveWithinPage
            order = $(this).children().map((_, value) -> value.id).get()
            {type: 'move', order: order}
          else if moveFromPage
            {type: 'remove'}
          else if moveToPage
            itemElement.data 'pageElement', thisPageElement
            beforeElement = itemElement.prev('.item')
            before = getItem(beforeElement)
            {type: 'add', item: item, after: before?.id}

          action.id = item.id
          put_action pageElement, action

        connectWith: '.page .story'

    buildPage = (data) ->
      empty =
        title: 'empty'
        synopsys: 'empty'
        story: []
        journal: []

      page = $.extend(empty, data)
      $(pageElement).data("data", data)

      $(pageElement).append '<h1><a href="/"><img src = "/favicon.png" height = "32px"></a> ' + page.title + '</h1>'

      [storyElement, journalElement, footerElement] = ['story', 'journal', 'footer'].map (className) ->
        $("<div />").addClass(className).appendTo(pageElement)

      $.each page.story, (i, item) ->
        div = $("<div class=\"item #{item.type}\" id=\"#{item.id}\" />")
        storyElement.append div
        try
          div.data 'pageElement', pageElement
          div.data 'item', item
          plugin = plugins[item.type]
          plugin.emit(div, item)
          plugin.bind(div, item)
        catch err
          div.append "<p class='error'>#{err}</p>"

      $.each page.journal, (i, action) ->
        addJournal journalElement, action

      footerElement
        .append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
        .append "<a href=\"/#{page_name}.json\">JSON</a>"

    if $(pageElement).attr('data-server-generated') == 'true'
      initDragging()
      pageElement.find('.item').each (i, each) ->
        div = $(each)
        item = getItem(div)
        plugins[item.type].bind div, item
    else
      if page_json = localStorage[pageElement.attr("id")]
        pageElement.addClass("local")
        buildPage JSON.parse(page_json)
        initDragging()
      else
        $.get "/#{page_name}.json", "", (page) ->
          buildPage page
          initDragging()

  $(document).ajaxError (event, request, settings) ->
    $('.main').prepend "<li><font color=red>Error on #{settings.url}</li>"

  $('.page').each refresh

  useLocalStorage = -> $(".local-editing").is(":checked")
