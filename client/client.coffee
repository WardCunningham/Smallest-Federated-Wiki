Array::last = ->
  this[@length - 1]

$ ->
  window.wiki = {}
  dataDash = wiki.dataDash = DataDash({stats: true})

#prepare a Dialog to popup
  window.dialog = $('<div></div>')
	  .html('This dialog will show every time!')
	  .dialog { autoOpen: false, title: 'Basic Dialog', height: 600, width: 800 }
  wiki.dialog = (title, html) ->
    window.dialog.html html
    window.dialog.dialog "option", "title", resolveLinks(title)
    window.dialog.dialog 'open'

# FUNCTIONS used by plugins and elsewhere

  randomByte = -> (((1+Math.random())*0x100)|0).toString(16).substring(1)
  randomBytes = (n) -> (randomByte() for [1..n]).join('')

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
      .replace(/\[(http.*?) (.*?)\]/gi, "<a class=\"external\" target=\"_blank\" href=\"$1\">$2</a>")

  addToJournal = (journalElement, action) ->
    pageElement = journalElement.parents('.page:first')
    actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type)
      .text(action.type[0])
      .dataDash(action)
      .appendTo(journalElement)
    if action.type == 'fork'
      actionElement
        .css("background-image", "url(//#{action.site}/favicon.png)")
        .attr("href", "//#{action.site}/#{pageElement.dataDash('slug')[0]}.html")
        .dataDash("site", action.site)
        .dataDash("slug", pageElement.dataDash('slug')[0])

  putAction = wiki.putAction = (pageElement, action) ->
    if (site = pageElement.dataDash('site')[0])?
      action.fork = site
      pageElement.find('h1 img').attr('src', '/favicon.png')
      pageElement.find('h1 a').attr('href', '/')
      pageElement.dataDash('site', null)
      setUrl()
      addToJournal pageElement.find('.journal'),
        type: 'fork'
        site: site
        id: 0
    if useLocalStorage()
      pushToLocal(pageElement, action)
      pageElement.addClass("local")
    else
      pushToServer(pageElement, action)

  pushToLocal = (pageElement, action) ->
    page = action.item if action.type == 'create'
    addToJournal pageElement.find('.journal'), action
    page ||= pageToJson(pageElement)
    page.journal = [] unless page.journal?
    localStorage[pageElement.dataDash('slug')[0]] = JSON.stringify(page)

  pushToServer = (pageElement, action) ->
    $.ajax
      type: 'PUT'
      url: "/page/#{pageElement.dataDash('slug')[0]}/action"
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
          doPlugin div.empty(), item
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

  formatTime = (time) ->
    d = new Date (if time > 10000000000 then time else time*1000)
    mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
    h = d.getHours()
    am = if h < 12 then 'AM' else 'PM'
    h = if h == 0 then 12 else if h > 12 then h - 12 else h
    mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
    "#{h}:#{mi} #{am}<br>#{d.getDate()} #{mo} #{d.getFullYear()}"

  getItem = (element) ->
    $(element).dataDash() or JSON.parse($(element).dataDash('staticItem')[0]) if $(element).length > 0

  wiki.getDataNodes = (vis) ->
    if vis
      idx = $('.item').index(vis)
      who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').toArray().reverse()
      $(who)
    else
      who = $('.chart,.data,.calculator').toArray().reverse()
      $(who)

  wiki.getData = (vis) ->
    if vis
      idx = $('.item').index(vis)
      who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').last()
      if who then who.dataDash('data')[0] else {}
    else
      who = $('.chart,.data,.calculator').last()
      if who then who.dataDash('data')[0] else {}

  scripts = {}
  wiki.getScript = (url, callback = () ->) ->
    if scripts[url]?
      callback()
    else
      $.getScript(url, ->
        scripts[url] = true
        callback()
      )

  wiki.dump = ->
    for p in $('.page')
      wiki.log '.page', p
      wiki.log '.item', i, 'data-item', $(i).dataDash() for i in $(p).find('.item')
    null

  getPlugin = wiki.getPlugin = (name, callback) ->
    return callback(plugin) if plugin = window.plugins[name]
    wiki.getScript "/plugins/#{name}.js", () ->
      callback(window.plugins[name])

  doPlugin = wiki.doPlugin = (div, item) ->
    error = (ex) ->
      errorElement = $("<div />").addClass('error')
      errorElement.text(ex.toString())
      div.append(errorElement)

    try
      div.data 'pageElement', div.parents(".page")
      div.dataDash item
      getPlugin item.type, (plugin) ->
        throw TypeError("Can't find plugin for '#{item.type}'") unless plugin?
        try
          plugin.emit div, item
          plugin.bind div, item
        catch err
          error(err)
    catch err
      error(err)

  doInternalLink = wiki.doInternalLink = (name, page) ->
    name = asSlug(name)
    $(page).nextAll().remove() if page?
    createPage(name)
      .appendTo($('.main'))
      .each refresh
    setActive($('.page').last())

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

# PLUGINS for each story item type

  window.plugins =
    paragraph:
      emit: (div, item) -> div.append "<p>#{resolveLinks(item.text)}</p>"
      bind: (div, item) ->
        div.dblclick -> textEditor div, item
    image:
      emit: (div, item) ->
        item.text ||= item.caption
        wiki.log 'image', item
        div.append "<img src=\"#{item.url}\"> <p>#{resolveLinks(item.text)}</p>"
      bind: (div, item) ->
        div.dblclick -> textEditor div, item
        div.find('img').dblclick -> wiki.dialog item.text, this
    chart:
      emit: (div, item) ->
        chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last())
        captionElement = $('<p />').html(resolveLinks(item.caption)).appendTo(div)
      bind: (div, item) ->
        div.find('p:first').mousemove (e) ->
          [time, sample] = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]
          $(e.target).text sample.toFixed(1)
          $(e.target).siblings("p").last().html formatTime(time)
        .dblclick ->
          wiki.dialog "JSON for #{item.caption}", $('<pre/>').text(JSON.stringify(item.data, null, 2))
    changes:
      emit: (div, item) ->
        div.append ul = $('<ul />').append if localStorage.length then $('<input type="button" value="discard all" />').css('margin-top','10px') else $('<p>empty</p>')
        for i in [0...localStorage.length]
          key = localStorage.key(i)
          a = $('<a class="internal" href="#" />').append(key).dataDash('pageName', key)
          ul.prepend($('<li />').append(a))
      bind: (div, item) ->
        div.find('input').click ->
          localStorage.clear()
          div.find('li').remove()
    stats:
      emit: (div, item) ->
        div.append($('<input type="button" value="update" />').css('margin-top', '10px'))
          .append("<pre>#{JSON.stringify(wiki.dataDash.stats(), null, 2)}</pre></p>")
      bind: (div, item) ->
        div.find('input').click ->
          div.find('pre').html(JSON.stringify(wiki.dataDash.stats(), null, 2))

# RENDERING for a page when found or retrieved

  refresh = ->
    pageElement = $(this)

    slug = pageElement.dataDash('slug')[0]
    site = pageElement.dataDash('site')[0]

    pageElement.find(".add-factory").live "click", (evt) ->
      evt.preventDefault()
      item =
        type: "factory"
        id: randomBytes(8)
      itemElement = $("<div />", class: "item factory").dataDash(item)
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
            order = $(this).find('.item').dataDash('id')
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
      {title} = data
      $(pageElement).dataDash({title})

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
        $(pageElement)
          .append "<h1><a href=\"//#{site}\"><img src = \"/remote/#{site}/favicon.png\" height = \"32px\"></a> #{page.title}</h1>"
      else
        $(pageElement)
          .append(
            $("<h1 />").append(
              $("<a />").attr('href', '/').append(
                $("<img>")
                  .error((e) ->
                    getPlugin('favicon', (plugin) ->
                      plugin.create()))
                  .attr('class', 'favicon')
                  .attr('src', '/favicon.png')
                  .attr('height', '32px')
              ), " #{page.title}"))

      [storyElement, journalElement, footerElement] = ['story', 'journal', 'footer'].map (className) ->
        $("<div />").addClass(className).appendTo(pageElement)

      $.each page.story, (i, item) ->
        div = $("<div />").addClass("item").addClass(item.type).dataDash(item)
        storyElement.append div
        doPlugin div, item

      $.each page.journal, (i, action) ->
        addToJournal journalElement, action

      footerElement
        .append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
        .append("<a class=\"show-page-source\" href=\"/#{slug}.json?random=#{randomBytes(4)}\" title=\"source\">JSON</a> . ")
        .append("<a href=\"#\" class=\"add-factory\" title=\"add paragraph\">[+]</a>")

      setUrl()

    fetch = (slug, callback, localContext) ->
      wiki.fetchContext = ['origin'] unless wiki.fetchContext.length > 0
      localContext ?= (i for own i in wiki.fetchContext)
      site = localContext.shift()
      resource = if site=='origin'
        site = null
        slug
      else
        "remote/#{site}/#{slug}"
      wiki.log 'fetch', resource
      $.ajax
        type: 'GET'
        dataType: 'json'
        url: "/#{resource}.json?random=#{randomBytes(4)}"
        success: (page) ->
          wiki.log 'fetch success', page, site || 'origin'
          $(pageElement).dataDash({site})
          callback(page)
        error: (xhr, type, msg) ->
          if localContext.length > 0
            fetch(slug, callback, localContext)
          else
            site = null
            callback(null)

    create = (slug, callback) ->
      title = $("""a[href="/#{slug}.html"]""").html()
      title or= slug
      page = {title}
      putAction $(pageElement), {type: 'create', id: randomBytes(8), item: page}
      callback page

    if $(pageElement).dataDash('server-generated')[0] == 'true'
      initDragging()
      pageElement.find('.item').each (i, each) ->
        div = $(each)
        item = getItem(div)
        getPlugin item.type, (plugin) ->
          plugin.bind div, item
    else
      if useLocalStorage() and json = localStorage[pageElement.dataDash('slug')[0]]
        pageElement.addClass("local")
        buildPage JSON.parse(json)
        initDragging()
      else
        if site?
          $.get "/remote/#{site}/#{slug}.json?random=#{randomBytes(4)}", "", (page) ->
            buildPage page
            initDragging()
        else
          fetch slug, (page) ->
            if page?
              buildPage page
              initDragging()
            else
              create slug, (page) ->
                buildPage page
                initDragging()

# FUNCTIONS and HANDLERS to manage location bar and back button

  setUrl = ->
    if history and history.pushState
      locs = locsInDom()
      pages = pagesInDom()
      url = ("/#{locs?[idx] or 'view'}/#{page}" for page, idx in pages when page).join('')
      if url and url isnt $(location).attr('pathname')
        wiki.log 'set state', locs, pages
        history.pushState(null, null, url)

  setActive = (el) ->
    el = $(el)
    wiki.log 'set active', el
    $(".active").removeClass("active")
    scrollTo el.addClass("active")

  showState = (e) ->
    # show and refresh correct pages
    wiki.log('popstate', e)
    oldPages = pagesInDom()
    newPages = urlPages()
    oldLocs = locsInDom()
    newLocs = urlLocs()

    return if (!location.pathname or location.pathname is '/')

    wiki.log 'showState', oldPages, newPages, oldLocs, newLocs

    previous = $('.page').eq(0)
    for name, idx in newPages
      unless name is oldPages[idx]
        old = $('.page').eq(idx)
        old.remove() if old
        createPage(name, newLocs[idx]).insertAfter(previous).each refresh
      previous = $('.page').eq(idx)

    previous.nextAll().remove()

    setActive($('.page').last())


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
        setActive(pages[newIndex])

# FUNCTIONS for finding the current state of pages and locations in the
# URL or DOM

  pagesInDom = ->
    $('.page').dataDash('slug')

  urlPages = ->
    (i for i in $(location).attr('pathname').split('/') by 2)[1..]

  locsInDom = ->
    $('.page').dataDash('site')

  urlLocs = ->
    (j for j in $(location).attr('pathname').split('/')[1..] by 2)

  createPage = (slug, site) ->
    if site and (site isnt ('view' or 'my'))
      $("<div/>").dataDash({site, slug}).addClass("page")
    else
      $("<div/>").addClass("page").dataDash({slug})

# HANDLERS for jQuery events

  $(window).on 'popstate', showState

  $(document)
    .ajaxError (event, request, settings) ->
      wiki.log 'ajax error', event, request, settings
      msg = "<li class='error'>Error on #{settings.url}: #{request.responseText}</li>"
      $('.main').prepend msg unless request.status == 404

  pageToJson = (element) ->
    return {
      title: element.dataDash('title')[0]
      story: element.children('.story').children().dataDash()
      journal: element.children('.journal').children().dataDash()
    }


  $('.main')
    .delegate '.show-page-source', 'click', (e) ->
      e.preventDefault()
      pageElement = $(this).parent().parent()
      json = pageToJson(pageElement)
      wiki.dialog "JSON for #{json.title}",  $('<pre/>').text(JSON.stringify(json, null, 2))

    .delegate '.page', 'click', (e) ->
      setActive this unless $(e.target).is("a")

    .delegate '.internal', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).dataDash('pageName')[0]
      wiki.fetchContext = $(e.target).attr('title').split(' => ')
      wiki.log 'click', name, 'context', wiki.fetchContext
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      createPage(name).appendTo('.main').each refresh
      setActive(this)
      # FIXME: can open page multiple times with shift key

    .delegate '.action', 'hover', ->
      id = JSON.stringify($(this).dataDash('id')[0])
      $("[data-id=\"#{id}\"].item").toggleClass('target')

    .delegate '.action.fork, .remote', 'click', (e) ->
      e.preventDefault()
      name = $(e.target).dataDash('slug')[0]
      wiki.log 'click', name, 'site', $(e.target).dataDash('site')[0]
      $(e.target).parents('.page').nextAll().remove() unless e.shiftKey
      createPage(name)
        .dataDash('site',$(e.target).dataDash('site')[0])
        .appendTo($('.main'))
        .each refresh
      setActive(this)

  useLocalStorage = -> $(".login").length > 0

  $(".provider input").click ->
    $("footer input:first").val $(this).dataDash('provider')[0]
    $("footer form").submit()

  setUrl()

  firstUrlPages = urlPages()
  firstUrlLocs = urlLocs()
  wiki.log 'amost createPage', firstUrlPages, firstUrlLocs, pagesInDom()
  for urlPage, idx in firstUrlPages when urlPage not in pagesInDom()
    wiki.log 'createPage', urlPage, idx
    createPage(urlPage, firstUrlLocs[idx]).appendTo('.main') if urlPage

  $('.page').each refresh
  setActive($('.page').last())
