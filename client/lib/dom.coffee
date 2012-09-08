wiki.createPage = (name, loc) ->
  if loc and loc isnt 'view'
    $("<div/>").attr('id', name).attr('data-site', loc).addClass("page")
  else
    $("<div/>").attr('id', name).addClass("page")
