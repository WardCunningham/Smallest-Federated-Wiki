window.plugins.federatedWiki =
  emit: (div, item) ->
    icon = $("<a href='//#{item.site}/view/welcome-visitors' class='remote'><img src='//#{item.site}/favicon.png' width='16px' height='16px'></a>")
    icon.find('img').data('slug', slug = item.slug or 'welcome-visitors')
    icon.find('img').data('site', item.site)
    div.append ($("<p> #{wiki.resolveLinks(item.text)}</p>").prepend(icon))
    div.append ($("<p class='cite'>(from #{item.site} page #{item.slug})</p>"))
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item
