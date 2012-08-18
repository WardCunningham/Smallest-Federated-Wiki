window.plugins.reference =
  emit: (div, item) ->
    slug = item.slug or 'welcome-visitors'
    site = item.site
    wiki.log 'emit', slug, 'site', site
    wiki.resolveFrom site, ->
      title = wiki.resolveLinks "[[#{item.title || slug}]]"
      div.append($("<h3 style='margin-bottom:3px;'><img src='//#{site}/favicon.png' class='remote' width='16px' height='16px' title='#{site}'> #{title}</h3>"))
      div.append($("<div>#{wiki.resolveLinks(item.text)}</div>"))
      # div.append($("<div class='cite' style='margin-top:3px;'>http://#{site}/view/#{slug}</div>"))
      div.find('img').data('slug', slug).data('site', site)
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item
