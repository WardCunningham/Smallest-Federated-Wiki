window.wiki = {}
util = require('./util.coffee')
fetch = require('./fetch.coffee')
plugin = require('./plugin.coffee')

Array::last = ->
  this[@length - 1]

$ ->
#prepare a Dialog to popup
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

  wiki.resolutionContext = []
  wiki.fetchContext = []
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

  putAction = wiki.putAction = (pageElement, action) ->
    if (site = pageElement.data('site'))?
      action.fork = site
      pageElement.find('h1 img').attr('src', '/favicon.png')
      pageElement.find('h1 a').attr('href', '/')
      pageElement.data('site', null)
      setUrl()
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

  wiki.dump = ->
    for p in $('.page')
      wiki.log '.page', p
      wiki.log '.item', i, 'data-item', $(i).data('item') for i in $(p).find('.item')
    null


  doInternalLink = wiki.doInternalLink = (name, page) ->
    name = util.asSlug(name)
    $(page).nextAll().remove() if page?
    createPage(name)
      .appendTo($('.main'))
      .each refresh
    setActive(name)

  # Find which element is scrollable, body or html
  scrollContainer = undefined
  findScrollContainer = ->
    scrolled = $("body, html").filter -> $(this).scrollLeft() > 0
    if scrolled.length > 0
      scrolled
    else
      $("body, html").scrollLeft(4).filter(-> $(this).scrollLeft() > 0).scrollTop(0)

  scrollTo = (el) ->
    scrollContainer ?= findScrollContainer()
    bodyWidth = $("body").width()
    minX = scrollContainer.scrollLeft()
    maxX = minX + bodyWidth
    wiki.log 'scrollTo', el, el.position()
    target = el.position().left
    width = el.outerWidth(true)
    contentWidth = $(".page").outerWidth(true) * $(".page").size()

    if target < minX
      scrollContainer.animate scrollLeft: target
    else if target + width > maxX
      scrollContainer.animate scrollLeft: target - (bodyWidth - width)
    else if maxX > $(".pages").outerWidth()
      scrollContainer.animate scrollLeft: Math.min(target, contentWidth - bodyWidth)

# RENDERING for a page when found or retrieved

  refresh = ->
    pageElement = $(this)
    slug = $(pageElement).attr('id')
    site = $(pageElement).data('site')

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
          putAction pageElement, action

        connectWith: '.page .story'

    buildPage = (data, site) ->
      # note: site may have changed due to fetch handling 404s
      unless $(pageElement).attr('data-server-generated') == 'true'
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
        wiki.log 'build', slug, 'site', site, 'context', context.join ' => '
        wiki.resolutionContext = context

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

        [storyElement, journalElement, footerElement] = ['story', 'journal', 'footer'].map (className) ->
          $("<div />").addClass(className).appendTo(pageElement)

        $.each page.story, (i, item) ->
          if $.isArray item
            wiki.log 'fixing corrupted item', i, item
            item = item[0]
          div = $("<div />").addClass("item").addClass(item.type).attr("data-id", item.id)
          storyElement.append div
          plugin.do div, item

        $.each page.journal, (i, action) ->
          addToJournal journalElement, action

        footerElement
          .append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
          .append("<a class=\"show-page-source\" href=\"/#{slug}.json?random=#{util.randomBytes(4)}\" title=\"source\">JSON</a> . ")
          .append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>")

        setUrl()

      initDragging()

    fetch({
      pageElement
      buildPage
    })

# FUNCTIONS and HANDLERS to manage location bar and back button

  setUrl = ->
    if history and history.pushState
      locs = locsInDom()
      pages = pagesInDom()
      url = ("/#{locs?[idx] or 'view'}/#{page}" for page, idx in pages).join('')
      unless url is $(location).attr('pathname')
        wiki.log 'set state', locs, pages
        history.pushState(null, null, url)

  setActive = (page) ->
    wiki.log 'set active', page
    $(".active").removeClass("active")
    scrollTo $("#"+page).addClass("active")

  showState = ->
    # show and refresh correct pages
    oldPages = pagesInDom()
    newPages = urlPages()
    oldLocs = locsInDom()
    newLocs = urlLocs()

    wiki.log 'showState', oldPages, newPages, oldLocs, newLocs

    previousPage = newPages

    return if (newPages is oldPages) and (newLocs is oldLocs)
    for name, idx in newPages
      if name in oldPages
        delete oldPages[oldPages.indexOf(name)]
      else
        createPage(name, newLocs[idx]).insertAfter(previousPage).each refresh
      previousPage = $('#'+name)

    $('#'+name)?.remove() for name in oldPages

    setActive($('.page').last().attr('id'))


  LEFTARROW = 37
  RIGHTARROW = 39

  $(document).keydown (event) ->
    direction = switch event.which
      when LEFTARROW then -1
      when RIGHTARROW then +1
    if direction && not (event.target.tagName is "TEXTAREA")
      pages = pagesInDom()
      newIndex = pages.indexOf($('.active').attr('id')) + direction
      if 0 <= newIndex < pages.length
        setActive(pages[newIndex])

# FUNCTIONS for finding the current state of pages and locations in the
# URL or DOM

  pagesInDom = ->
    $.makeArray $(".page").map (_, el) -> el.id

  urlPages = ->
    (i for i in $(location).attr('pathname').split('/') by 2)[1..]

  locsInDom = ->
    $.makeArray $(".page").map (_, el) ->
      $(el).data('site') or 'view'

  urlLocs = ->
    (j for j in $(location).attr('pathname').split('/')[1..] by 2)

  createPage = (name, loc) ->
    if loc and (loc isnt ('view' or 'my'))
      $("<div/>").attr('id', name).attr('data-site', loc).addClass("page")
    else
      $("<div/>").attr('id', name).addClass("page")

# HANDLERS for jQuery events

  $(window).on 'popstate', (event) ->
    wiki.log 'popstate', event
    showState()

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
      setActive this.id unless $(e.target).is("a")

    .delegate '.internal', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).data 'pageName'
      wiki.fetchContext = $(e.target).attr('title').split(' => ')
      wiki.log 'click', name, 'context', wiki.fetchContext
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      createPage(name).appendTo('.main').each refresh
      setActive(name)
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
      setActive(name)

  wiki.useLocalStorage = useLocalStorage = -> $(".login").length > 0

  $(".provider input").click ->
    $("footer input:first").val $(this).attr('data-provider')
    $("footer form").submit()

  setUrl()

  firstUrlPages = urlPages()
  firstUrlLocs = urlLocs()
  wiki.log 'amost createPage', firstUrlPages, firstUrlLocs, pagesInDom()
  for urlPage, idx in firstUrlPages when urlPage not in pagesInDom()
    wiki.log 'createPage', urlPage, idx
    createPage(urlPage, firstUrlLocs[idx]).appendTo('.main') unless urlPage is ''

  $('.page').each refresh
  setActive($('.page').last().attr('id'))
