listItemHtml = (slug, page)->
  """
    <li>
      <a class="internal" href="#" title="origin" data-page-name="#{slug}"> 
        #{page.title}
      </a> 
      <button class="delete">✕</button>
    </li>
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
        success: (data, textStatus, jqXHR) ->
          wiki.log "ajax submit success", data, textStatus, jqXHR
          # wiki.addToJournal pageElement.find('.journal'), action
        error: (xhr, type, msg) ->
          wiki.log "ajax error callback", type, msg


    $div.dblclick ->
      wiki.dialog "JSON bundle for #{length} pages",  $('<pre/>').text(JSON.stringify(pageBundle(), null, 2))

  {
    emit: emit
    bind: bind
  }

wiki.registerPlugin( 'changes', constructor )

module.exports = constructor if module?
