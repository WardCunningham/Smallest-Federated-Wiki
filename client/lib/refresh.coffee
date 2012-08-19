util = require('./util.coffee')
pageHandler = require('./pageHandler.coffee')
plugin = require('./plugin.coffee')
state = require('./state.coffee')
neighborhood = require('./neighborhood.coffee')

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

  if moveFromPage
    if sourcePageElement.hasClass('ghost') or
      sourcePageElement.attr('id') == destinationPageElement.attr('id')
        # stem the damage, better ideas here: 
        # http://stackoverflow.com/questions/3916089/jquery-ui-sortables-connect-lists-copy-items
        return

  action = if moveWithinPage
    order = $(this).children().map((_, value) -> $(value).attr('data-id')).get()
    {type: 'move', order: order}
  else if moveFromPage
    wiki.log 'drag from', sourcePageElement.find('h1').text()
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
  if site? and site != 'local' and site != 'origin' and site != 'view'
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
    $(pageElement).addClass('ghost').data('rev',rev).append $ """
      <h2 class="revision">
        <span>
          #{if date? then util.formatDate(date) else "Revision #{rev}"}
        </span>
      </h2>
    """

module.exports = refresh = wiki.refresh = ->
  pageElement = $(this)


  [slug, rev] = pageElement.attr('id').split('_rev')
  pageInformation = {
    slug: slug
    rev: rev
    site: pageElement.data('site')
    wasServerGenerated: pageElement.attr('data-server-generated') == 'true'
  }

  buildPage = (data,siteFound) ->

    if siteFound == 'local'
      pageElement.addClass('local') 
    else
      pageElement.data('site', siteFound)

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

      context = ['view']
      context.push site if site?
      addContext = (site) -> context.push site if site? and not _.include context, site
      addContext action.site for action in page.journal.slice(0).reverse()
      wiki.resolutionContext = context

      wiki.log 'buildPage', slug, 'site', site, 'context', context.join ' => '
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

  createPage = ->
    title = $("""a[href="/#{slug}.html"]:last""").text()
    title or= slug
    pageHandler.put $(pageElement), {type: 'create', id: util.randomBytes(8), item: {title}}
    buildPage( {title} )

  registerNeighbors = (data, site) ->
    if _.include ['local', 'origin', 'view', null, undefined], site
      neighborhood.registerNeighbor location.host
    else
      neighborhood.registerNeighbor site
    for item in (data.story || [])
      neighborhood.registerNeighbor item.site if item.site?
    for action in (data.journal || [])
      neighborhood.registerNeighbor action.site if action.site?
      
  whenGotten = (data,siteFound) ->
    buildPage( data, siteFound )
    registerNeighbors( data, siteFound )

  pageHandler.get
    whenGotten: whenGotten
    whenNotGotten: createPage
    pageInformation: pageInformation

