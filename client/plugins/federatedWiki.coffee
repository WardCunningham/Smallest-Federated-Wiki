window.plugins.federatedWiki =
  emit: (div, item) ->
    slug = item.slug or 'welcome-visitors'
    wiki.log 'emit', slug, 'site', item.site
    wiki.resolveFrom item.site, ->
      div.append($("<h3 style='margin-bottom:3px;'><img src='//#{item.site}/favicon.png' class='remote' width='16px' height='16px'> #{item.title || slug}</h3>"))
      div.append($("<div>#{wiki.resolveLinks(item.text)}</div>"))
      # div.append($("<div class='cite' style='margin-top:3px;'>http://#{item.site}/view/#{slug}</div>"))
      div.find('img').data('slug', slug).data('site', item.site)
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item
