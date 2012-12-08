window.plugins.federatedWiki =
  emit: ($item, item) ->
    slug = item.slug or 'welcome-visitors'
    site = item.site
    wiki.resolveFrom site, ->
      $item.append """
        <p style='margin-bottom:3px;'>
          <img class='remote'
            src='//#{site}/favicon.png'
            title='#{site}'
            data-site="#{site}"
            data-slug="#{slug}"
          >
          #{wiki.resolveLinks "[[#{item.title or slug}]]"}
        </p>
        <div>
          #{wiki.resolveLinks(item.text)}
        </div>
      """
  bind: ($item, item) ->
    $item.dblclick -> wiki.textEditor $item, item
