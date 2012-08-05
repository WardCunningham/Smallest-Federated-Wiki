listItemHtml = (slug, page)->
  """
    <li>
      <a class="internal" href="#" title="origin" data-page-name="#{slug}"> 
        #{page.title}
      </a> 
      <button>✕</button>
    </li>
  """

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
      ul.prepend listItemHtml(slug,page)

  bind = ($div, item) ->
    $div.on 'click', 'button', ->
      slug = $(this).siblings('a.internal').data('pageName')
      localStorage.removeItem(slug)
      emit( $div.empty(), item )

    $div.dblclick ->
      bundle = {}
      length = localStorage.length
      for i in [0...length]
        slug = localStorage.key i
        bundle[slug] = JSON.parse localStorage.getItem slug
      wiki.dialog "JSON bundle for #{length} pages",  $('<pre/>').text(JSON.stringify(bundle, null, 2))

  {
    emit: emit
    bind: bind
  }

wiki.registerPlugin( 'changes', constructor )

module.exports = constructor if module?
