window.wiki = {}
util = require('./util.coffee')
pageHandler = wiki.pageHandler = require('./pageHandler.coffee')
plugin = require('./plugin.coffee')
state = require('./state.coffee')
active = require('./active.coffee')
refresh = require('./refresh.coffee')

Array::last = ->
  this[@length - 1]

$ ->
# ELEMENTS used for details popup

  # # extension from http://www.droptoframe.com/?p=35
  #   # .ui-dialog .ui-dialog-titlebar-transfer{ position: absolute; right: 23px; top: 50%; width: 19px; margin: -10px 0 0 0; padding: 1px; height: 18px; }
  #   # .ui-dialog .ui-dialog-titlebar-transfer span { display: block; margin: 1px; }
  #   # .ui-dialog .ui-dialog-titlebar-transfer:hover, .ui-dialog .ui-dialog-titlebar-min:focus { padding: 0; }
  # _init = $.ui.dialog.prototype._init
  # _uiDialogTitlebar = null
  # $.ui.dialog.prototype._init = ->
  #   self = this
  #   _init.apply this, arguments
  #   uiDialogTitlebar = this.uiDialogTitlebar
  #   uiDialogTitlebar.append '<a href="#" id="dialog-transfer" class="dialog-transfer ui-dialog-titlebar-transfer"><span class="ui-icon ui-icon-transferthick-e-w"></span></a>'
  # $.extend $.ui.dialog.prototype, ->
  #   $('.dialog-transfer', this.uiDialogTitlebar)
  #     .hover -> $(this).toggleClass('ui-state-hover')
  #     .click() ->
  #       self.transfer()
  #       return false
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

  wiki.symbols =
    create: '☼'
    add: '+'
    edit: '✎'
    fork: '⚑'
    move: '↕'
    remove: '✕'

  addToJournal = wiki.addToJournal = (journalElement, action) ->
    pageElement = journalElement.parents('.page:first')
    prev = journalElement.find(".edit[data-id=#{action.id || 0}]") if action.type == 'edit'
    actionTitle = action.type
    actionTitle += "(#{prev.length})" if action.type == 'edit'
    actionTitle += ": #{util.formatDate(action.date)}" if action.date?
    actionElement = $("<a href=\"\#\" /> ").addClass("action").addClass(action.type)
      .text(wiki.symbols[action.type])
      .attr('title',actionTitle)
      .attr('data-id', action.id || "0")
      .data('action', action)
    controls = journalElement.children('.control-buttons')
    if controls.length > 0
      actionElement.insertBefore(controls)
    else
      actionElement.appendTo(journalElement)
    if action.type == 'fork'
      actionElement
        .css("background-image", "url(//#{action.site}/favicon.png)")
        .attr("href", "//#{action.site}/#{pageElement.attr('id')}.html")
        .data("site", action.site)
        .data("slug", pageElement.attr('id'))

  useLocalStorage = wiki.useLocalStorage = ->
    wiki.log 'useLocalStorage', $(".login").length > 0
    $(".login").length > 0

  createTextElement = (pageElement, beforeElement, initialText) ->
    item =
      type: 'paragraph'
      id: util.randomBytes(8)
      text: initialText
    itemElement = $ """
      <div class="item paragraph" data-id=#{item.id}></div>
                    """
    itemElement
      .data('item', item)
      .data('pageElement', pageElement)
    beforeElement.after itemElement
    plugin.do itemElement, item
    itemBefore = wiki.getItem beforeElement
    wiki.textEditor itemElement, item
    sleep = (time, code) -> setTimeout code, time
    sleep 500, -> pageHandler.put pageElement, {item: item, id: item.id, type: 'add', after: itemBefore?.id}

  textEditor = wiki.textEditor = (div, item, caretPos) ->
    textarea = $("<textarea>#{original = item.text ? ''}</textarea>")
      .focusout ->
        if item.text = textarea.val()
          plugin.do div.empty(), item
          return if item.text == original
          pageHandler.put div.parents('.page:first'), {type: 'edit', id: item.id, item: item}
        else
          pageHandler.put div.parents('.page:first'), {type: 'remove', id: item.id}
          div.remove()
        null
      .bind 'keydown', (e) ->
        if (e.altKey || e.ctlKey || e.metaKey) and e.which == 83 #alt-s
          textarea.focusout()
          return false
        if e.which == $.ui.keyCode.BACKSPACE and util.getCaretPosition(textarea.get(0)) == 0
          prevItem = getItem(div.prev())
          prevTextLen = prevItem.text.length
          prevItem.text += textarea.val()
          textarea.val('') # Need current text area to be empty. Item then gets deleted.
          # caret needs to be between the old text and the new appended text
          textEditor div.prev(), prevItem, prevTextLen
        else if e.which == $.ui.keyCode.ENTER
          caret = util.getCaretPosition textarea.get(0)
          return false unless caret
          text = textarea.val()
          prefix = text.substring(0,caret)
          suffix = text.substring(caret)
          textarea.val(prefix)
          textarea.focusout()
          pageElement = div.parent().parent()
          createTextElement(pageElement, div, suffix)
          return false
      .bind 'dblclick', (e) ->
        return false; #don't pass dblclick on to the div, as it'll reload

    div.html textarea
    if caretPos?
      util.setCaretPosition textarea.get(0), caretPos
    else
      util.setCaretPosition textarea.get(0), textarea.val().length

  getItem = wiki.getItem = (element) ->
    $(element).data("item") or $(element).data('staticItem') if $(element).length > 0

  wiki.getData = (vis) ->
    if vis
      idx = $('.item').index(vis)
      who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').last()
      if who? then who.data('item').data else {}
    else
      who = $('.chart,.data,.calculator').last()
      if who? then who.data('item').data else {}

  wiki.getDataNodes = (vis) ->
    if vis
      idx = $('.item').index(vis)
      who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').toArray().reverse()
      $(who)
    else
      who = $('.chart,.data,.calculator').toArray().reverse()
      $(who)

  doInternalLink = wiki.doInternalLink = (name, page) ->
    name = util.asSlug(name)
    $(page).nextAll().remove() if page?
    createPage(name)
      .appendTo($('.main'))
      .each refresh
    active.set($('.page').last())

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

  finishClick = (e, name) ->
    e.preventDefault()
    page = $(e.target).parents('.page') unless e.shiftKey
    doInternalLink name, page

  $('.main')
    .delegate '.show-page-source', 'click', (e) ->
      e.preventDefault()
      pageElement = $(this).parent().parent()
      json = pageElement.data('data')
      wiki.dialog "JSON for #{json.title}",  $('<pre/>').text(JSON.stringify(json, null, 2))

    .delegate '.page', 'click', (e) ->
      active.set this unless $(e.target).is("a")

    .delegate '.internal', 'click', (e) ->
      name = $(e.target).data 'pageName'
      pageHandler.context = $(e.target).attr('title').split(' => ')
      finishClick e, name

    .delegate '.remote', 'click', (e) ->
      name = $(e.target).data('slug')
      pageHandler.context = [$(e.target).data('site')]
      finishClick e, name

    .delegate '.action', 'click', (e) ->
      e.preventDefault()
      element = $(e.target)
      if e.shiftKey
        return wiki.dialog "#{element.data('action').type} action", $('<pre/>').text(JSON.stringify(element.data('action'), null, 2))
      if element.is('.fork')
        name = $(e.target).data('slug')
        pageHandler.context = [$(e.target).data('site')]
        finishClick e, name
      else
        journalEntryIndex = $(this).parent().children().index(element)
        data = $(this).parent().parent().data('data')
        titleUrl = util.asSlug(data.title)
        revUrl = "#{titleUrl}_rev#{journalEntryIndex}"
        e.preventDefault()
        page = $(e.target).parents('.page') unless e.shiftKey
        $(page).nextAll().remove() if page?
        createPage(revUrl)
          .appendTo($('.main'))
          .each refresh
        active.set($('.page').last())

    .delegate '.fork-page', 'click', (e) ->
      pageElement = $(e.target).parents('.page')
      return unless (remoteSite = pageElement.data('site'))?
      pageHandler.put pageElement, {type:'fork', site: remoteSite}

    .delegate '.action', 'hover', ->
      id = $(this).attr('data-id')
      $("[data-id=#{id}]").toggleClass('target')

    .delegate '.item', 'hover', ->
      id = $(this).attr('data-id')
      $(".action[data-id=#{id}]").toggleClass('target')

  $(".provider input").click ->
    $("footer input:first").val $(this).attr('data-provider')
    $("footer form").submit()

# CODE that gets the web page application started
  state.first()

  $('.page').each refresh
  active.set($('.page').last())

