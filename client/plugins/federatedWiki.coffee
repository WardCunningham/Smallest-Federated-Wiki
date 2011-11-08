window.plugins.federatedWiki =
  emit: (div, item) ->
    slug = item.slug or 'welcome-visitors'
    div.append($("<h3><img src='//#{item.site}/favicon.png' class='remote' width='16px' height='16px'> #{item.title || slug}</h3>"))
    div.append($("<p>#{wiki.resolveLinks(item.text)}</p>"))
    div.append($("<p class='cite'>http://#{item.site}/view/#{slug}</p>"))
    div.find('img').data('slug', slug).data('site', item.site)
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item
