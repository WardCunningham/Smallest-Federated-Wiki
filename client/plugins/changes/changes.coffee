constructor = ($, dependencies={})->
  localStorage = dependencies.localStorage || window.localStorage

  emit: ($div, item) ->
    $div.append ul = $('<ul />')
    ul.append( '<p>empty</p>' ) if localStorage.length == 0
    for i in [0...localStorage.length]
      slug = localStorage.key(i)
      wikiPage = JSON.parse(localStorage[slug])
      ul.prepend """
        <li>
          <a class="internal" href="#" title="origin" data-page-name="#{slug}"> 
            #{wikiPage.title}
          </a> 
          <button>X</button>
        </li>
      """
  bind: ($div, item) ->
    $div.find('button').click ->
      slug = $(this).siblings('a.internal').data('pageName')
      localStorage.removeItem(slug)
      # re-render plugin div
      plugin.do $div.empty(), item

wiki.registerPlugin( 'changes', constructor )

module.exports = constructor if module?
