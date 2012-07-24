util = require('./util.coffee')
pageHandler = require('./pageHandler.coffee')
plugin = require('./plugin.coffee')
state = require('./state.coffee')

handleDragging = (evt, ui) ->
  itemElement = ui.item
  item = wiki.getItem(itemElement)
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
    before = wiki.getItem(beforeElement)
    {type: 'add', item: item, after: before?.id}
  action.id = item.id
  pageHandler.put thisPageElement, action

initDragging = (pageElement) ->
  storyElement = pageElement.find('.story')
  storyElement.sortable
    update: handleDragging
    connectWith: '.page .story'

initAddButton = (pageElement) ->
  pageElement.find(".add-factory").live "click", (evt) ->
    evt.preventDefault()
    createFactory(pageElement)

createFactory = (pageElement) ->
  item =
    type: "factory"
    id: util.randomBytes(8)
  itemElement = $("<div />", class: "item factory").data('item',item).attr('data-id', item.id)
  itemElement.data 'pageElement', pageElement
  pageElement.find(".story").append(itemElement)
  plugin.do itemElement, item
  beforeElement = itemElement.prev('.item')
  before = wiki.getItem(beforeElement)
  pageHandler.put pageElement, {item: item, id: item.id, type: "add", after: before?.id} 

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
  if (rev = pageElement.attr('id').split('_rev')[1])?
    date = page.journal[page.journal.length-1].date
    $(pageElement)
      .append $('<h4 class="revision"/>')
        .html if date? then util.formatDate(date) else "Revision #{rev}"
    $(pageElement).addClass 'ghost'

module.exports = refresh = wiki.refresh = ->
  pageElement = $(this)

  buildPage = (data) ->
    if not data?
      pageElement.find('.item').each (i, each) ->
        item = wiki.getItem($(each))
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
        wiki.addToJournal journalElement, action

      journalElement.append """
        <div class="control-buttons">
          <a href="#" class="button fork-page" title="fork this page">#{util.symbols['fork']}</a>
          <a href="#" class="button add-factory" title="add paragraph">#{util.symbols['add']}</a>
        </div>
                            """
      footerElement
        .append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
        .append("<a class=\"show-page-source\" href=\"/#{slug}.json?random=#{util.randomBytes(4)}\" title=\"source\">JSON</a>")

      state.setUrl()

    initDragging pageElement
    initAddButton pageElement

  pageHandler.get pageElement, buildPage

