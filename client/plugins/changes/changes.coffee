listItemHtml = (slug,wikiPage)->
  """
    <li>
      <a class="internal" href="#" title="origin" data-page-name="#{slug}"> 
        #{wikiPage.title}
      </a> 
      <button>✕</button>
    </li>
  """

constructor = ($, dependencies={})->
  localStorage = dependencies.localStorage || window.localStorage

  emit = ($div, item) ->
    if( localStorage.length == 0 )
      $div.append( '<p>empty</p>' )
      return

    $div.append( ul = $('<ul />') )
    for i in [0...localStorage.length]
      slug = localStorage.key(i)
      wikiPage = JSON.parse(localStorage.getItem(slug))
      ul.prepend listItemHtml(slug,wikiPage)

  bind = ($div, item) ->
    $div.on 'click', 'button', ->
      slug = $(this).siblings('a.internal').data('pageName')
      localStorage.removeItem(slug)
      # re-render
      emit( $div.empty(), item )

  {
    emit: emit
    bind: bind
  }

wiki.registerPlugin( 'changes', constructor )

module.exports = constructor if module?
