util = require('./util.coffee')
pageHandler = require('./pageHandler.coffee')
plugin = require('./plugin.coffee')
state = require('./state.coffee')
neighborhood = require('./neighborhood.coffee')
addToJournal = require('./addToJournal.coffee')
wiki = require('./wiki.coffee')

handleDragging = (evt, ui) ->
  itemElement = ui.item

  item = wiki.getItem(itemElement)
  thisPageElement = $(this).parents('.page:first')
  sourcePageElement = itemElement.data('pageElement')
  sourceSite = sourcePageElement.data('site')

  destinationPageElement = itemElement.parents('.page:first')
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

initDragging = ($page) ->
  $story = $page.find('.story')
  $story.sortable(connectWith: '.page .story').on("sortupdate", handleDragging)


initAddButton = ($page) ->
  $page.find(".add-factory").live "click", (evt) ->
    return if $page.hasClass 'ghost'
    evt.preventDefault()
    createFactory($page)

createFactory = ($page) ->
  item =
    type: "factory"
    id: util.randomBytes(8)
  itemElement = $("<div />", class: "item factory").data('item',item).attr('data-id', item.id)
  itemElement.data 'pageElement', $page
  $page.find(".story").append(itemElement)
  plugin.do itemElement, item
  beforeElement = itemElement.prev('.item')
  before = wiki.getItem(beforeElement)
  pageHandler.put $page, {item: item, id: item.id, type: "add", after: before?.id}

buildPageHeader = ({title,tooltip,header_href,favicon_src})->
  """<h1 title="#{tooltip}"><a href="#{header_href}"><img src="#{favicon_src}" height="32px" class="favicon"></a> #{title}</h1>"""

emitHeader = ($header, $page, page) ->
  site = $page.data('site')
  isRemotePage = site? and site != 'local' and site != 'origin' and site != 'view'
  header = ''

  viewHere = if wiki.asSlug(page.title) is 'welcome-visitors' then ""
  else "/view/#{wiki.asSlug(page.title)}"
  pageHeader = if isRemotePage
    buildPageHeader
      tooltip: site
      header_href: "//#{site}/view/welcome-visitors#{viewHere}"
      favicon_src: "http://#{site}/favicon.png"
      title: page.title
  else
    buildPageHeader
      tooltip: location.host
      header_href: "/view/welcome-visitors#{viewHere}"
      favicon_src: "/favicon.png"
      title: page.title

  $header.append( pageHeader )
  
  unless isRemotePage
    $('img.favicon',$page).error (e)->
      plugin.get 'favicon', (favicon) ->
        favicon.create()

  if $page.attr('id').match /_rev/
    rev = page.journal.length-1
    date = page.journal[rev].date
    $page.addClass('ghost').data('rev',rev)
    $header.append $ """
      <h2 class="revision">
        <span>
          #{if date? then util.formatDate(date) else "Revision #{rev}"}
        </span>
      </h2>
    """

emitTwins = wiki.emitTwins = ($page) ->
  page = $page.data 'data'
  site = $page.data('site') or window.location.host
  site = window.location.host if site in ['view', 'origin']
  slug = wiki.asSlug page.title
  if (actions = page.journal?.length)? and (viewing = page.journal[actions-1]?.date)?
    viewing = Math.floor(viewing/1000)*1000
    bins = {newer:[], same:[], older:[]}
    # {fed.wiki.org: [{slug: "happenings", title: "Happenings", date: 1358975303000, synopsis: "Changes here ..."}]}
    for remoteSite, info of wiki.neighborhood
      if remoteSite != site and info.sitemap?
        for item in info.sitemap
          if item.slug == slug
            bin = if item.date > viewing then bins.newer
            else if item.date < viewing then bins.older
            else bins.same
            bin.push {remoteSite, item}
    twins = []
    # {newer:[remoteSite: "fed.wiki.org", item: {slug: ..., date: ...}, ...]}
    for legend, bin of bins
      continue unless bin.length
      bin.sort (a,b) ->
        a.item.date < b.item.date
      flags = for {remoteSite, item}, i in bin
        break if i >= 8
        """<img class="remote"
          src="http://#{remoteSite}/favicon.png"
          data-slug="#{slug}"
          data-site="#{remoteSite}"
          title="#{remoteSite}">
        """
      twins.push "#{flags.join '&nbsp;'} #{legend}"
    $page.find('.twins').html """<p>#{twins.join ", "}</p>""" if twins

renderPageIntoPageElement = (pageData,$page, siteFound) ->
  page = $.extend(util.emptyPage(), pageData)
  $page.data("data", page)
  slug = $page.attr('id')
  site = $page.data('site')

  context = ['view']
  context.push site if site?
  addContext = (site) -> context.push site if site? and not _.include context, site
  addContext action.site for action in page.journal.slice(0).reverse()

  wiki.resolutionContext = context

  [$twins, $header, $story, $journal, $footer] = ['twins', 'header', 'story', 'journal', 'footer'].map (className) ->
    $("<div />").addClass(className).appendTo($page)

  emitHeader $header, $page, page

  emitItem = (i) ->
    return if i >= page.story.length
    item = page.story[i]
    if item?.type and item?.id
      $item = $ """<div class="item #{item.type}" data-id="#{item.id}">"""
      $story.append $item
      plugin.do $item, item, -> emitItem i+1
    else
      $story.append $ """<div><p class="error">Can't make sense of story[#{i}]</p></div>"""
      emitItem i+1
  emitItem 0

  for action in page.journal
    addToJournal $journal, action

  emitTwins $page

  $journal.append """
    <div class="control-buttons">
      <a href="#" class="button fork-page" title="fork this page">#{util.symbols['fork']}</a>
      <a href="#" class="button add-factory" title="add paragraph">#{util.symbols['add']}</a>
    </div>
  """

  $footer.append """
    <a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> .
    <a class="show-page-source" href="/#{slug}.json?random=#{util.randomBytes(4)}" title="source">JSON</a> .
    <a>#{siteFound || 'origin'}</a>
  """


wiki.buildPage = (data,siteFound,$page) ->

  if siteFound == 'local'
    $page.addClass('local')
  else if siteFound
    siteFound = 'origin' if siteFound is window.location.host
    $page.addClass('remote') unless siteFound in ['view', 'origin']
    $page.data('site', siteFound)

  #TODO: avoid passing siteFound
  renderPageIntoPageElement( data, $page, siteFound )

  state.setUrl()

  initDragging $page
  initAddButton $page
  $page


module.exports = refresh = wiki.refresh = ->
  $page = $(this)

  [slug, rev] = $page.attr('id').split('_rev')
  pageInformation = {
    slug: slug
    rev: rev
    site: $page.data('site')
  }

  createGhostPage = ->
    title = $("""a[href="/#{slug}.html"]:last""").text() or slug
    page =
      'title': title
      'story': [
        'id': util.randomBytes 8
        'type': 'future'
        'text': 'We could not find this page.'
        'title': title
      ]
    heading =
      'type': 'paragraph'
      'id': util.randomBytes(8)
      'text': "We did find the page in your current neighborhood."
    hits = []
    for site, info of wiki.neighborhood
      if info.sitemap?
        result = _.find info.sitemap, (each) ->
          each.slug == slug
        if result?
          hits.push
            "type": "reference"
            "id": util.randomBytes(8)
            "site": site
            "slug": slug
            "title": result.title || slug
            "text": result.synopsis || ''
    if hits.length > 0
      page.story.push heading, hits...
      page.story[0].text = 'We could not find this page in the expected context.'

    wiki.buildPage( page, undefined, $page ).addClass('ghost')

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
    wiki.buildPage( data, siteFound, $page )
    registerNeighbors( data, siteFound )

  pageHandler.get
    whenGotten: whenGotten
    whenNotGotten: createGhostPage
    pageInformation: pageInformation

