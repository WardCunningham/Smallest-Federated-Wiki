wiki = require './wiki.coffee'
util = require './util.coffee'
pageHandler = wiki.pageHandler = require './pageHandler.coffee'
plugin = require './plugin.coffee'
state = require './state.coffee'
active = require './active.coffee'
refresh = require './refresh.coffee'

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
    window.dialog.dialog "option", "title", wiki.resolveLinks(title)
    window.dialog.dialog 'open'

# FUNCTIONS used by plugins and elsewhere

  sleep = (time, done) -> setTimeout done, time

  wiki.removeItem = ($item, item) ->
    pageHandler.put $item.parents('.page:first'), {type: 'remove', id: item.id}
    $item.remove()

  wiki.createItem = ($page, $before, item) ->
    $page = $before.parents('.page') unless $page?
    item.id = util.randomBytes(8)
    $item = $ """
      <div class="item #{item.type}" data-id="#{}"</div>
    """
    $item
      .data('item', item)
      .data('pageElement', $page)
    if $before?
      $before.after $item
    else
      $page.find('.story').append $item
    plugin.do $item, item
    before = wiki.getItem $before
    sleep 500, ->
      pageHandler.put $page, {item, id: item.id, type: 'add', after: before?.id}
    $item

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
    sleep 500, -> pageHandler.put pageElement, {item: item, id: item.id, type: 'add', after: itemBefore?.id}

  textEditor = wiki.textEditor = (div, item, caretPos, doubleClicked) ->
    return if div.hasClass 'textEditing'
    div.addClass 'textEditing'
    textarea = $("<textarea>#{original = item.text ? ''}</textarea>")
      .focusout ->
        div.removeClass 'textEditing'
        if item.text = textarea.val()
          plugin.do div.empty(), item
          return if item.text == original
          pageHandler.put div.parents('.page:first'), {type: 'edit', id: item.id, item: item}
        else
          pageHandler.put div.parents('.page:first'), {type: 'remove', id: item.id}
          div.remove()
        null
      # .bind 'paste', (e) ->
      #   wiki.log 'textedit paste', e
      #   wiki.log e.originalEvent.clipboardData.getData('text')
      .bind 'keydown', (e) ->
        if (e.altKey || e.ctlKey || e.metaKey) and e.which == 83 #alt-s
          textarea.focusout()
          return false
        if (e.altKey || e.ctlKey || e.metaKey) and e.which == 73 #alt-i
          e.preventDefault()
          page = $(e.target).parents('.page') unless e.shiftKey
          doInternalLink "about #{item.type} plugin", page
          return false
        # provides automatic new paragraphs on enter and concatenation on backspace
        if item.type is 'paragraph' 
          sel = util.getSelectionPos(textarea) # position of caret or selected text coords
          if e.which is $.ui.keyCode.BACKSPACE and sel.start is 0 and sel.start is sel.end 
            prevItem = wiki.getItem(div.prev())
            return false unless prevItem.type is 'paragraph'
            prevTextLen = prevItem.text.length
            prevItem.text += textarea.val()
            textarea.val('') # Need current text area to be empty. Item then gets deleted.
            # caret needs to be between the old text and the new appended text
            textEditor div.prev(), prevItem, prevTextLen
            return false
          else if e.which is $.ui.keyCode.ENTER and item.type is 'paragraph'
            return false unless sel
            text = textarea.val()
            prefix = text.substring 0, sel.start
            middle = text.substring(sel.start, sel.end) if sel.start isnt sel.end
            suffix = text.substring(sel.end)
            if prefix is ''
              textarea.val(' ')
            else
              textarea.val(prefix)
            textarea.focusout()
            pageElement = div.parent().parent()
            createTextElement(pageElement, div, suffix)
            createTextElement(pageElement, div, middle) if middle?
            createTextElement(pageElement, div, '') if prefix is ''
            return false
    div.html textarea
    if caretPos?
      util.setCaretPosition textarea, caretPos
    else if doubleClicked # we want the caret to be at the end
      util.setCaretPosition textarea, textarea.val().length
      #scrolls to bottom of text area
      textarea.scrollTop(textarea[0].scrollHeight - textarea.height())
    else
      textarea.focus()

  doInternalLink = wiki.doInternalLink = (name, page, site=null) ->
    name = wiki.asSlug(name)
    $(page).nextAll().remove() if page?
    wiki.createPage(name,site)
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

# HANDLERS for jQuery events

  $(window).on 'popstate', state.show

  $(document)
    .ajaxError (event, request, settings) ->
      return if request.status == 0 or request.status == 404
      wiki.log 'ajax error', event, request, settings
      $('.main').prepend """
        <li class='error'>
          Error on #{settings.url}: #{request.responseText}
        </li>
      """

  getTemplate = (slug, done) ->
    return done(null) unless slug
    wiki.log 'getTemplate', slug
    pageHandler.get
      whenGotten: (data,siteFound) -> done(data.story)
      whenNotGotten: -> done(null)
      pageInformation: {slug: slug}

  finishClick = (e, name) ->
    e.preventDefault()
    page = $(e.target).parents('.page') unless e.shiftKey
    doInternalLink name, page, $(e.target).data('site')
    return false

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

    .delegate 'img.remote', 'click', (e) ->
      name = $(e.target).data('slug')
      pageHandler.context = [$(e.target).data('site')]
      finishClick e, name

    .delegate '.revision', 'dblclick', (e) ->
      e.preventDefault()
      $page = $(this).parents('.page')
      page = $page.data('data')
      rev = page.journal.length-1
      action = page.journal[rev]
      json = JSON.stringify(action, null, 2)
      wiki.dialog "Revision #{rev}, #{action.type} action", $('<pre/>').text(json)

    .delegate '.action', 'click', (e) ->
      e.preventDefault()
      $action = $(e.target)
      if $action.is('.fork') and (name = $action.data('slug'))?
        pageHandler.context = [$action.data('site')]
        finishClick e, (name.split '_')[0]
      else
        $page = $(this).parents('.page')
        slug = wiki.asSlug($page.data('data').title)
        rev = $(this).parent().children().index($action)
        $page.nextAll().remove() unless e.shiftKey
        wiki.createPage("#{slug}_rev#{rev}", $page.data('site'))
          .appendTo($('.main'))
          .each refresh
        active.set($('.page').last())

    .delegate '.fork-page', 'click', (e) ->
      pageElement = $(e.target).parents('.page')
      if pageElement.hasClass('local')
        unless wiki.useLocalStorage()
          item = pageElement.data('data')
          pageElement.removeClass('local')
          pageHandler.put pageElement, {type: 'fork', item} # push
      else
        if (remoteSite = pageElement.data('site'))?
          pageHandler.put pageElement, {type:'fork', site: remoteSite} # pull

    .delegate '.action', 'hover', ->
      id = $(this).attr('data-id')
      $("[data-id=#{id}]").toggleClass('target')
      $('.main').trigger('rev')

    .delegate '.item', 'hover', ->
      id = $(this).attr('data-id')
      $(".action[data-id=#{id}]").toggleClass('target')

    .delegate 'button.create', 'click', (e) ->
      getTemplate $(e.target).data('slug'), (story) ->
        $page = $(e.target).parents('.page:first')
        $page.removeClass 'ghost'
        page = $page.data('data')
        page.story = story||[]
        pageHandler.put $page, {type: 'create', id: page.id, item: {title:page.title, story: story||undefined}}
        wiki.buildPage page, null, $page.empty()

    .delegate '.ghost', 'rev', (e) ->
      wiki.log 'rev', e
      $page = $(e.target).parents('.page:first')
      $item = $page.find('.target')
      position = $item.offset().top + $page.scrollTop() - $page.height()/2
      wiki.log 'scroll', $page, $item, position
      $page.stop().animate {scrollTop: postion}, 'slow'

    .delegate '.score', 'hover', (e) ->
      $('.main').trigger 'thumb', $(e.target).data('thumb')

  $(".provider input").click ->
    $("footer input:first").val $(this).attr('data-provider')
    $("footer form").submit()

  $('body').on 'new-neighbor-done', (e, neighbor) ->
    $('.page').each (index, element) ->
      wiki.emitTwins $(element)

  $ ->
    state.first()
    $('.page').each refresh
    active.set($('.page').last())

