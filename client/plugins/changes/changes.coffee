listItemHtml = (slug, page)->
  """
    <li><a class="internal" href="#" title="local" data-page-name="#{slug}" data-site="local">#{page.title}</a> <button class="delete">✕</button></li>
  """

pageBundle = ->
  bundle = {}
  length = localStorage.length
  for i in [0...length]
    slug = localStorage.key i
    bundle[slug] = JSON.parse localStorage.getItem slug
  bundle

constructor = ($, dependencies={})->
  localStorage = dependencies.localStorage || window.localStorage

  emit = ($div, item) ->
    if( localStorage.length == 0 )
      $div.append( '<ul><p>empty</p></ul>' )
      return

    $div.append( ul = $('<ul />') )
    for i in [0...localStorage.length]
      slug = localStorage.key(i)
      page = JSON.parse(localStorage.getItem(slug))
      ul.append listItemHtml(slug,page)
    ul.append """<button class="submit">Submit Changes</button>""" if item.submit?

  bind = ($div, item) ->
    $div.on 'click', '.delete', ->
      slug = $(this).siblings('a.internal').data('pageName')
      localStorage.removeItem(slug)
      emit( $div.empty(), item )

    $div.on 'click', '.submit', ->
      $.ajax
        type: 'PUT'
        url: "/submit"
        data:
          'bundle': JSON.stringify(pageBundle())
        success: (citation, textStatus, jqXHR) ->
          wiki.log "ajax submit success", citation, textStatus, jqXHR
          throw new Exception "Incomplete Submission" unless citation.type and citation.site
          pageElement = $div.parents('.page:first')
          itemElement = $("<div />", class: "item #{citation.type}").data('item',citation).attr('data-id', citation.id)
          itemElement.data 'pageElement', pageElement
          pageElement.find(".story").append(itemElement)
          wiki.doPlugin itemElement, citation
          beforeElement = itemElement.prev('.item')
          before = wiki.getItem(beforeElement)
          wiki.pageHandler.put pageElement, {item: citation, id: citation.id, type: "add", after: before?.id}
        error: (xhr, type, msg) ->
          wiki.log "ajax error callback", type, msg


    $div.dblclick ->
      bundle = pageBundle()
      count = _.size(bundle)
      wiki.dialog "JSON bundle for #{count} pages",  $('<pre/>').text(JSON.stringify(bundle, null, 2))

  {
    emit: emit
    bind: bind
  }

wiki.registerPlugin( 'changes', constructor )

module.exports = constructor if module?
