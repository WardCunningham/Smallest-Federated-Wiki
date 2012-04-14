window.wiki = {}
util = require('./util.coffee')
fetch = require('./fetch.coffee')
plugin = require('./plugin.coffee')
state = require('./state.coffee')
active = require('./active.coffee')

Array::last = ->
  this[@length - 1]

$ ->
# ELEMENTS used for details popup

  window.dialog = $('<div></div>')
	  .html('This dialog will show every time!')
	  .dialog { autoOpen: false, title: 'Basic Dialog', height: 600, width: 800 }
  wiki.dialog = (title, html) ->
    window.dialog.html html
    window.dialog.dialog "option", "title", resolveLinks(title)
    window.dialog.dialog 'open'

# FUNCTIONS used by plugins and elsewhere

  wiki.log = (things...) ->
    console.log things if console?.log?

  wiki.dump = ->
    for p in $('.page')
      wiki.log '.page', p
      wiki.log '.item', i, 'data-item', $(i).data('item') for i in $(p).find('.item')
    null

  wiki.resolutionContext = []
  resolveFrom = wiki.resolveFrom = (addition, callback) ->
    wiki.resolutionContext.push addition
    try
      callback()
    finally
      wiki.resolutionContext.pop()

  resolveLinks = wiki.resolveLinks = (string) ->
    renderInternalLink = (match, name) ->
      # spaces become 'slugs', non-alpha-num get removed
      slug = util.asSlug name
      wiki.log 'resolve', slug, 'context', wiki.resolutionContext.join(' => ')
      "<a class=\"internal\" href=\"/#{slug}.html\" data-page-name=\"#{slug}\" title=\"#{wiki.resolutionContext.join(' => ')}\">#{name}</a>"
    string
      .replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink)
      .replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\">$2</a>")

  addToJournal = (journalElement, action) ->
    pageElement = journalElement.parents('.page:first')
    actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type)
      .text(action.type[0])
      .attr('title',action.type)
      .data('itemId', action.id || "0")
      .appendTo(journalElement)
    if action.type == 'fork'
      actionElement
        .css("background-image", "url(//#{action.site}/favicon.png)")
        .attr("href", "//#{action.site}/#{pageElement.attr('id')}.html")
        .data("site", action.site)
        .data("slug", pageElement.attr('id'))

  useLocalStorage = wiki.useLocalStorage = ->
    wiki.log 'useLocalStorage', $(".login").length > 0
    $(".login").length > 0

  putAction = wiki.putAction = (pageElement, action) ->
    if (site = pageElement.data('site'))?
      action.fork = site
      pageElement.find('h1 img').attr('src', '/favicon.png')
      pageElement.find('h1 a').attr('href', '/')
      pageElement.data('site', null)
      state.setUrl()
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
    page = action.item if action.type == 'create'
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
          plugin.do div.empty(), item
          return if item.text == original
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

  getItem = (element) ->
    $(element).data("item") or JSON.parse($(element).data('staticItem')) if $(element).length > 0

  wiki.getData = ->
    who = $('.chart,.data,.calculator').last()
    if who? then who.data('item').data else {}

  doInternalLink = wiki.doInternalLink = (name, page) ->
    name = util.asSlug(name)
    $(page).nextAll().remove() if page?
    createPage(name)
      .appendTo($('.main'))
      .each refresh
    active.set($('.page').last())

  handleDragging = (evt, ui) ->
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
      order = $(this).children().map((_, value) -> $(value).attr('data-id')).get()
      {type: 'move', order: order}
    else if moveFromPage
      {type: 'remove'}
    else if moveToPage
      itemElement.data 'pageElement', thisPageElement
      beforeElement = itemElement.prev('.item')
      before = getItem(beforeElement)
      {type: 'add', item: item, after: before?.id}
    action.id = item.id
    putAction thisPageElement, action

  initDragging = (pageElement) ->
    storyElement = pageElement.find('.story')
    storyElement.sortable
      update: handleDragging
      connectWith: '.page .story'

  initAddButton = (pageElement) ->
    pageElement.find(".add-factory").live "click", (evt) ->
      evt.preventDefault()
      item =
        type: "factory"
        id: util.randomBytes(8)
      itemElement = $("<div />", class: "item factory").data('item',item).attr('data-id', item.id)
      itemElement.data 'pageElement', pageElement
      pageElement.find(".story").append(itemElement)
      plugin.do itemElement, item
      beforeElement = itemElement.prev('.item')
      before = getItem(beforeElement)
      putAction pageElement, {item: item, id: item.id, type: "add", after: before?.id}

  emitHeader = (pageElement, page) ->
    site = $(pageElement).data('site')
    if site?
      $(pageElement)
        .append "<h1><a href=\"//#{site}\"><img src = \"/remote/#{site}/favicon.png\" height = \"32px\"></a> #{page.title}</h1>"
    else
      $(pageElement)
        .append(
          $("<h1 />").append(
            $("<a />").attr('href', '/').append(
              $("<img>")
                .error((e) ->
                  plugin.get('favicon', (favicon) ->
                    favicon.create()))
                .attr('class', 'favicon')
                .attr('src', '/favicon.png')
                .attr('height', '32px')
            ), " #{page.title}"))

  refresh = wiki.refresh = ->
    pageElement = $(this)

    buildPage = (data) ->
      if not data?
        pageElement.find('.item').each (i, each) ->
          item = getItem($(each))
          plugin.get item.type, (plugin) ->
            plugin.bind $(each), item
      else
        page = $.extend(util.emptyPage(), data)
        $(pageElement).data("data", page)
        slug = $(pageElement).attr('id')
        site = $(pageElement).data('site')

        context = ['origin']
        context.push site if site?
        addContext = (site) -> context.push site if site? and not _.include context, site
        addContext action.site for action in page.journal.slice(0).reverse()
        wiki.resolutionContext = context

        wiki.log 'build', slug, 'site', site, 'context', context.join ' => '
        emitHeader pageElement, page

        [storyElement, journalElement, footerElement] = ['story', 'journal', 'footer'].map (className) ->
          $("<div />").addClass(className).appendTo(pageElement)

        $.each page.story, (i, item) ->
          item = item[0] if $.isArray item # unwrap accidentally wrapped items
          div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id)
          storyElement.append div
          plugin.do div, item

        $.each page.journal, (i, action) ->
          addToJournal journalElement, action

        footerElement
          .append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
          .append("<a class=\"show-page-source\" href=\"/#{slug}.json?random=#{util.randomBytes(4)}\" title=\"source\">JSON</a> . ")
          .append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>")

        state.setUrl()

      initDragging pageElement
      initAddButton pageElement

    fetch pageElement, buildPage


  LEFTARROW = 37
  RIGHTARROW = 39

  $(document).keydown (event) ->
    direction = switch event.which
      when LEFTARROW then -1
      when RIGHTARROW then +1
    if direction && not (event.target.tagName is "TEXTAREA")
      pages = $('.page')
      newIndex = pages.index($('.active')) + direction
      if 0 <= newIndex < pages.length
        active.set(pages.eq(newIndex))

# FUNCTIONS sensing extant and desired page configurations


  createPage = wiki.createPage = (name, loc) ->
    if loc and (loc isnt ('view' or 'my'))
      $("<div/>").attr('id', name).attr('data-site', loc).addClass("page")
    else
      $("<div/>").attr('id', name).addClass("page")

# HANDLERS for jQuery events

  $(window).on 'popstate', state.show

  $(document)
    .ajaxError (event, request, settings) ->
      wiki.log 'ajax error', event, request, settings
      msg = "<li class='error'>Error on #{settings.url}: #{request.responseText}</li>"
      $('.main').prepend msg unless request.status == 404

  $('.main')
    .delegate '.show-page-source', 'click', (e) ->
      e.preventDefault()
      pageElement = $(this).parent().parent()
      json = pageElement.data('data')
      wiki.dialog "JSON for #{json.title}",  $('<pre/>').text(JSON.stringify(json, null, 2))

    .delegate '.page', 'click', (e) ->
      active.set this unless $(e.target).is("a")

    .delegate '.internal', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).data 'pageName'
      fetch.context = $(e.target).attr('title').split(' => ')
      wiki.log 'click', name, 'context', fetch.context
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      createPage(name).appendTo('.main').each refresh
      active.set($('.page').last())
      # FIXME: can open page multiple times with shift key

    .delegate '.action', 'hover', ->
      id = $(this).data('itemId')
      $("[data-id=#{id}]").toggleClass('target')

    .delegate '.action.fork, .remote', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).data('slug')
      wiki.log 'click', name, 'site', $(e.target).data('site')
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      createPage(name)
        .data('site',$(e.target).data('site'))
        .appendTo($('.main'))
        .each refresh
      active.set($('.page').last())

  $(".provider input").click ->
    $("footer input:first").val $(this).attr('data-provider')
    $("footer form").submit()

# CODE that gets the web page application started
  state.first()

  $('.page').each refresh
  active.set($('.page').last())

