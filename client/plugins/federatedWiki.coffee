window.plugins.federatedWiki =
  emit: (div, item) ->
    icon = $("<a href='//#{item.site}/view/welcome-visitors' class='remote'><img src='//#{item.site}/favicon.png' width='24px' height='24px'></a>")
    icon.find('img').data('slug', 'welcome-visitors')
    icon.find('img').data('site', item.site)
    div.append ($("<p> #{wiki.resolveLinks(item.text)}</p>").prepend(icon))       
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item
