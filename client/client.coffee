Array::last = ->
  this[@length - 1]

$ ->
  window.wiki = {}

#prepare a Dialog to popup
  window.dialog = $('<div></div>')
	  .html('This dialog will show every time!')
	  .dialog { autoOpen: false, title: 'Basic Dialog', height: 600, width: 800 }

# FUNCTIONS used by plugins and elsewhere

  randomByte = -> (((1+Math.random())*0x100)|0).toString(16).substring(1)
  randomBytes = (n) -> (randomByte() for [1..n]).join('')
  
  renderInternalLink = (match, name) ->
    # spaces become 'slugs', non-alpha-num get removed
    slug = name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()
    "<a class=\"internal\" href=\"/"+slug+".html\" data-page-name=\""+slug+"\">"+name+"</a>"

  resolveLinks = (string) ->
    string
      .replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink)
      .replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" href=\"$1\">$2</a>")

  addToJournal = (journalElement, action) ->
    pageElement = journalElement.parents('.page:first')
    actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type)
      .text(action.type[0])
      .data('itemId', action.id || "0")
      .appendTo(journalElement)
    if action.type == 'fork'
      actionElement
        .css("background-image", "url(//#{action.site}/favicon.png)")
        .attr("href", "//#{action.site}/#{pageElement.attr('id')}.html")
        .data("site", action.site)
        .data("slug", pageElement.attr('id'))

  putAction = (pageElement, action) ->
    if useLocalStorage()
      pushToLocal(pageElement, action)
      pageElement.addClass("local")
    else
      pushToServer(pageElement, action)

  pushToLocal = (pageElement, action) ->
    page = localStorage[pageElement.attr("id")]
    page = JSON.parse(page) if page
    page ||= pageElement.data("data")
    page.journal = [] unless page.journal?
    page.journal.concat(action)
    page.story = $(pageElement).find(".item").map(-> $(@).data("item")).get()
    localStorage[pageElement.attr("id")] = JSON.stringify(page)
    addToJournal pageElement.find('.journal'), action

  pushToServer = (pageElement, action) ->
    $.ajax
      type: 'PUT'
      url: "/page/#{pageElement.attr('id')}/action"
      data:
        'action': JSON.stringify(action)
      success: () ->
        addToJournal pageElement.find('.journal'), action
      error: (xhr, type, msg) ->
        console.log "ajax error type: #{type} msg: #{msg}"

  textEditor = (div, item) ->
    textarea = $("<textarea>#{item.text ? ''}</textarea>")
      .focusout ->
        if textarea.val()
          $(div).last('p').html "<p>#{resolveLinks(textarea.val())}</p>"
          return if textarea.val() == item.text
          item.text = textarea.val()
          putAction div.parents('.page:first'), {type: 'edit', id: item.id, item: item}
        else
          putAction div.parents('.page:first'), {type: 'remove', id: item.id}
          div.remove()
        null
      .bind 'keydown', (e) ->
        if (e.altKey || e.ctlKey || e.metaKey) and e.which == 83 #alt-s
          textarea.focusout()
          return false
      .bind 'dblclick', (e) ->
        return false; #don't pass dblclick on to the div, as it'll reload

    div.html textarea
    textarea.focus()

  formatTime = (time) ->
    d = new Date (if time > 10000000000 then time else time*1000)
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
    h = d.getHours()
    am = if h < 12 then 'AM' else 'PM'
    h = if h == 0 then 12 else if h > 12 then h - 12 else h
    mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
    "#{h}:#{mi} #{am}<br>#{d.getDate()} #{mo} #{d.getFullYear()}"

  getItem = (element) ->
    $(element).data("item") or JSON.parse($(element).data('staticItem')) if $(element).length > 0

  wiki.getData = ->
    $('.chart,.data').last().data('item').data

  scripts = {}
  wiki.getScript = (paths...) ->
    for path in paths
      unless scripts[path]?
        scripts[path] = true
        $('<script type="text/javascript"/>').attr('src',"/#{path}").prependTo($('script:first'))

  wiki.log = ->
    for p in $('.page')
      console.log p
      for i in $(p).find('.item')
        console.log i
        console.dir $(i).data('item')
    null

  getPlugin = (plugin) ->
    wiki.getScript "plugins/#{plugin}.js" unless window.plugins[plugin]?
    window.plugins[plugin]

  bindDragAndDrop = (div, item, allowedTypes = []) ->
    ["dragenter", "dragover"].map (eventName) ->
      div.bind eventName, (evt) -> evt.preventDefault()

    div.bind "drop", (dropEvent) ->

      finishDrop = (type, handler) ->
        (loadEvent) ->
          item.type = type
          handler loadEvent
          div.empty()
          div.removeClass("factory").addClass(type)
          pageDiv = div.parents('.page:first')
          action = {type: 'edit', id: item.id, item: item}
          putAction(pageDiv, action)
          getPlugin(type).emit(div, item)

      dropEvent.preventDefault()
      file = dropEvent.originalEvent.dataTransfer.files[0]
      [majorType, minorType] = file.type.split("/")

      if allowedTypes.filter((t) -> t == majorType).length == 0
        alert("Uploads of type #{majorType} not supported for this item")
      else
        reader = new FileReader()
        if majorType == "image"
          reader.onload = finishDrop "image", (loadEvent) ->
            item.url = loadEvent.target.result
            item.caption ||= "Uploaded image"
          reader.readAsDataURL(file)
        else if majorType == "text"
          reader.onload = finishDrop "paragraph", (loadEvent) ->
            item.text = loadEvent.target.result
          reader.readAsText(file)

# PLUGINS for each story item type

  window.plugins =
    paragraph:
      emit: (div, item) -> div.append "<p>#{resolveLinks(item.text)}</p>"
      bind: (div, item) ->
        div.dblclick -> textEditor div, item
    image:
      emit: (div, item) -> div.append "<img src=\"#{item.url}\"> <p>#{resolveLinks(item.caption)}</p>"
      bind: (div, item) -> bindDragAndDrop(div, item, ["image"])
    chart:
      emit: (div, item) ->
        chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last())
        captionElement = $('<p />').html(resolveLinks(item.caption)).appendTo(div)
      bind: (div, item) ->
        div.find('p:first').mousemove (e) ->
          [time, sample] = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]
          $(e.target).text sample.toFixed(1)
          $(e.target).siblings("p").last().html formatTime(time)
    factory:
      emit: (div, item) -> div.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'
      bind: (div, item) ->
        bindDragAndDrop(div, item, ["image", "text"])
        div.dblclick ->
          div.removeClass('factory').addClass(item.type='paragraph')
          textEditor div, item
    changes:
      emit: (div, item) ->
        div.append ul = $('<ul />').append if localStorage.length then $('<input type="button" value="discard all" />').css('margin-top','10px') else $('<p>empty</p>')
        for i in [0...localStorage.length]
          key = localStorage.key(i)
          a = $('<a class="internal" href="#" />').append(key).data('pageName', key)
          ul.prepend($('<li />').append(a))
      bind: (div, item) ->
        div.find('input').click ->
          localStorage.clear()
          div.find('li').remove()

# RENDERING for a page when found or retrieved

  refresh = ->
    pageElement = $(this)
    slug = $(pageElement).attr('id')
    site = $(pageElement).data('site')

    pageElement.find(".add-factory").live "click", (evt) ->
      evt.preventDefault()
      item =
        type: "factory"
        id: randomBytes(8)
      itemElement = $("<div />", class: "item factory", id: item.id).data('item',item)
      itemElement.data 'pageElement', pageElement
      pageElement.find(".story").append(itemElement)
      plugins.factory.emit itemElement, item
      plugins.factory.bind itemElement, item
      beforeElement = itemElement.prev('.item')
      before = getItem(beforeElement)
      putAction pageElement, {item: item, id: item.id, type: "add", after: before?.id} 

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
          putAction pageElement, action

        connectWith: '.page .story'

    buildPage = (data) ->
      empty =
        title: 'empty'
        synopsys: 'empty'
        story: []
        journal: []

      page = $.extend(empty, data)
      $(pageElement).data("data", data)

      if site?
        $(pageElement).append "<h1><a href=\"//#{site}\"><img src = \"/remote/#{site}/favicon.png\" height = \"32px\"></a> #{page.title}</h1>"
      else
        $(pageElement).append "<h1><a href=\"/\"><img src = \"/favicon.png\" height = \"32px\"></a> #{page.title}</h1>"

      [storyElement, journalElement, footerElement] = ['story', 'journal', 'footer'].map (className) ->
        $("<div />").addClass(className).appendTo(pageElement)

      $.each page.story, (i, item) ->
        div = $("<div class=\"item #{item.type}\" id=\"#{item.id}\" />")
        storyElement.append div
        try
          div.data 'pageElement', pageElement
          div.data 'item', item
          plugin = getPlugin item.type
          plugin.emit div, item
          plugin.bind div, item
        catch err
          div.append "<p class='error'>#{err}</p>"

      $.each page.journal, (i, action) ->
        addToJournal journalElement, action

      footerElement
        .append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
        .append("<a class=\"show-page-source\" href=\"/#{slug}.json?random=#{randomBytes(4)}\" title=\"source\">JSON</a> . ")
        .append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>")

    if $(pageElement).attr('data-server-generated') == 'true'
      initDragging()
      pageElement.find('.item').each (i, each) ->
        div = $(each)
        item = getItem(div)
        getPlugin(item.type).bind div, item
    else
      if useLocalStorage() and json = localStorage[pageElement.attr("id")]
        pageElement.addClass("local")
        buildPage JSON.parse(json)
        initDragging()
      else
        resource = if site? then "remote/#{site}/#{slug}" else slug
        $.get "/#{resource}.json?random=#{randomBytes(4)}", "", (page) ->
          buildPage page
          initDragging()

# HANDLERS for jQuery events
	  
  $(document).ajaxError (event, request, settings) ->
    console.log [event,request,settings]
    $('.main').prepend "<li class='error'>Error on #{settings.url}<br/>#{request.responseText}</li>"

  $('.main')
    .delegate '.show-page-source', 'click', (e) ->
      e.preventDefault()
      #TODO: this is a cut,paste&hack from a few lines above - refactor out 
      if useLocalStorage() and json = localStorage[pageElement.attr("id")]
        #set the dialog content..
        window.dialog.dialog('open');
      else
        pageElement = $(this).parent().parent()
        slug = $(pageElement).attr('id')
        site = $(pageElement).data('site')

        resource = if site? then "remote/#{site}/#{slug}" else slug
        $.get "/#{resource}.json?random=#{randomBytes(4)}", "", (page) -> 
          window.dialog.html('<pre>'+JSON.stringify(page, null, 2)+'</pre>')
          window.dialog.dialog( "option", "title", "Source for: "+slug );
          window.dialog.dialog('open')

    .delegate '.internal', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).data 'pageName'
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      $("<div/>").attr('id', name).addClass("page").appendTo('.main').each refresh
      
      if History.enabled
        pages = $.makeArray $(".page").map (_, el) -> el.id
        History.pushState {pages: pages}, name, ("/view/#{page}" for page in pages).join ''

    .delegate '.action', 'hover', ->
      $('#'+$(this).data('itemId')).toggleClass('target')

    .delegate '.action.fork', 'click', (e) ->
      e.preventDefault()
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      $("<div />")
        .attr('id',$(e.target).data('slug'))
        .data('site',$(e.target).data('site'))
        .addClass("page")
        .appendTo($('.main'))
        .each refresh

  useLocalStorage = () -> $('#localEditing').is(':checked')

  $('.page').each refresh
