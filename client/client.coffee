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

  wiki.log = (things...) ->
    console.log things if console.log?

  wiki.resolutionContext = []
  resolveFrom = wiki.resolveFrom = (addition, callback) ->
    wiki.resolutionContext.push addition
    try
      callback()
    finally
      wiki.resolutionContext.pop()

  asSlug = (name) ->
    name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

  resolveLinks = wiki.resolveLinks = (string) ->
    renderInternalLink = (match, name) ->
      # spaces become 'slugs', non-alpha-num get removed
      slug = asSlug name
      wiki.log 'resolve', slug, 'context', wiki.resolutionContext.join(' => ')
      "<a class=\"internal\" href=\"/#{slug}.html\" data-page-name=\"#{slug}\" title=\"#{wiki.resolutionContext.join(' => ')}\">#{name}</a>"
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

  putAction = wiki.putAction = (pageElement, action) ->
    if (site = pageElement.data('site'))?
      action.fork = site
      pageElement.find('h1 img').attr('src', '/favicon.png')
      pageElement.find('h1 a').attr('href', '/')
      pageElement.data('site', null)
      addToJournal pageElement.find('.journal'),
        type: 'fork'
        site: site
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
        wiki.log "ajax error callback", type, msg

  textEditor = wiki.textEditor = (div, item) ->
    textarea = $("<textarea>#{original = item.text ? ''}</textarea>")
      .focusout ->
        if item.text = textarea.val()
          # $(div).last('p').html "<p>#{resolveLinks(textarea.val())}</p>"
          doPlugin div.empty(), item
          return if item.text == original
          # item.text = textarea.val()
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
        $('<script type="text/javascript"/>').attr('src',path).prependTo($('script:first'))

  wiki.dump = ->
    for p in $('.page')
      wiki.log '.page', p
      wiki.log '.item', i, 'data-item', $(i).data('item') for i in $(p).find('.item')
    null

  getPlugin = wiki.getPlugin = (plugin) ->
    wiki.getScript "/plugins/#{plugin}.js" unless window.plugins[plugin]?
    window.plugins[plugin]

  doPlugin = wiki.doPlugin = (div, item) ->
    try
      div.data 'pageElement', div.parents(".page")
      div.data 'item', item
      plugin = getPlugin item.type
      throw TypeError("Can't find plugin for '#{item.type}'") unless plugin?
      plugin.emit div, item
      plugin.bind div, item
    catch err
      div.append "<p class='error'>#{err}</p>"

  doInternalLink = wiki.doInternalLink = (name, page) ->
    $(page).nextAll().remove() if page?
    scrollTo createPage(asSlug(name))
      .appendTo($('.main'))
      .each refresh


  scrollTo = (el) ->
    minX = $("body").scrollLeft()
    maxX = minX + $("body").width()
    target = el.position().left
    width = el.outerWidth(true)
    contentWidth = $(".page").outerWidth(true) * $(".page").size()

    if target < minX
      $("body").animate scrollLeft: target
    else if target + width > maxX
      $("body").animate scrollLeft: target - ($("body").width() - width)
    else if maxX > $(".pages").outerWidth()
      $("body").animate scrollLeft: Math.min(target, contentWidth - $("body").width())


# PLUGINS for each story item type

  window.plugins =
    paragraph:
      emit: (div, item) -> div.append "<p>#{resolveLinks(item.text)}</p>"
      bind: (div, item) ->
        div.dblclick -> textEditor div, item
    image:
      emit: (div, item) -> div.append "<img src=\"#{item.url}\"> <p>#{resolveLinks(item.caption)}</p>"
      bind: (div, item) ->
    chart:
      emit: (div, item) ->
        chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last())
        captionElement = $('<p />').html(resolveLinks(item.caption)).appendTo(div)
      bind: (div, item) ->
        div.find('p:first').mousemove (e) ->
          [time, sample] = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]
          $(e.target).text sample.toFixed(1)
          $(e.target).siblings("p").last().html formatTime(time)
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
      doPlugin itemElement, item
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

      context = ['origin']
      addContext = (string) ->
        if string?
          context = _.without context, string
          context.push string
      addContext action.site for action in page.journal
      addContext site
      wiki.log 'build', slug, 'context', context.join ' => '
      wiki.resolutionContext = context

      if site?
        $(pageElement).append "<h1><a href=\"//#{site}\"><img src = \"/remote/#{site}/favicon.png\" height = \"32px\"></a> #{page.title}</h1>"
      else
        $(pageElement).append "<h1><a href=\"/\"><img src = \"/favicon.png\" height = \"32px\"></a> #{page.title}</h1>"

      [storyElement, journalElement, footerElement] = ['story', 'journal', 'footer'].map (className) ->
        $("<div />").addClass(className).appendTo(pageElement)

      $.each page.story, (i, item) ->
        div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id)
        storyElement.append div
        doPlugin div, item

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

# FUNCTIONS and HANDLERS to manage location bar and back button

  setState = (state) ->
    if History.enabled
      url = ("/view/#{page}" for page in state.pages).join('') # + "##{state.active}"
      History.pushState state, state.active, url

  setActive = (page) ->
    if History.enabled
      state = History.getState().data
      state.active = page
      setState state

  showState = (state) ->
    # show and refresh correct pages
    oldPages = pagesInDom()
    newPages = state.pages
    previousPage = newPages

    return unless newPages

    for name in newPages
      if name in oldPages
        delete oldPages[oldPages.indexOf(name)]
      else
        createPage(name).insertAfter(previousPage).each refresh
      previousPage = findPage(name)

    name && findPage(name).remove() for name in oldPages

    # scroll to active
    $(".active").removeClass("active")
    scrollTo $("#"+state.active).addClass("active")

  History.Adapter.bind window, 'statechange', () ->
    showState state if state = History.getState().data

  LEFTARROW = 37
  RIGHTARROW = 39

  $(document).keydown (event) ->
    direction = switch event.which
      when LEFTARROW then -1
      when RIGHTARROW then +1
    if direction && History.enabled
      state = History.getState().data;
      newIndex = state.pages.indexOf(state.active) + direction
      if 0 <= newIndex < state.pages.length
        state.active = state.pages[newIndex]
      setState state

  pagesInDom = () ->
    $.makeArray $(".page").map (_, el) -> el.id

  createPage = (name, loc) ->
    if loc and (loc isnt ('view' or 'my'))
      $("<div/>").attr('id', name).attr('data-site', loc).addClass("page")
    else
      $("<div/>").attr('id', name).addClass("page")

  findPage = (name) ->
    $("#"+name)

# HANDLERS for jQuery events

  $(document)
    .ajaxError (event, request, settings) ->
      wiki.log 'ajax error', event, request, settings
      $('.main').prepend "<li class='error'>Error on #{settings.url}</li>"

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
          window.dialog.html($('<pre/>').text(JSON.stringify(page, null, 2)))
          window.dialog.dialog( "option", "title", "Source for: "+slug );
          window.dialog.dialog('open')

    .delegate '.page', 'click', (e) ->
      setActive this.id unless $(e.target).is("a")

    .delegate '.internal', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).data 'pageName'
      wiki.log 'click', name
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      scrollTo createPage(name).appendTo('.main').each refresh
      # FIXME: can open page multiple times with shift key

      if History.enabled
        setState {pages: pagesInDom(), active: name}

    .delegate '.action', 'hover', ->
      id = $(this).data('itemId')
      $("[data-id=#{id}]").toggleClass('target')

    .delegate '.action.fork, .remote', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).data('slug')
      wiki.log 'click', name, 'site', $(e.target).data('site')
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      scrollTo createPage(name)
        .data('site',$(e.target).data('site'))
        .appendTo($('.main'))
        .each refresh

      if History.enabled
        setState {pages: pagesInDom(), active: name}

  useLocalStorage = -> $("#authenticated").length == 0

  urlPages = (i for i in $(location).attr('pathname').split('/') by 2)[1..]
  urlLocs = (j for j in $(location).attr('pathname').split('/')[1..] by 2)
  for urlPage, idx in urlPages when urlPage not in pagesInDom()
      createPage(urlPage, urlLocs[idx]).appendTo('.main')

  $('.page').each refresh

  startPages = pagesInDom()
  setState { pages: startPages, active: startPages[startPages.length-1]}
