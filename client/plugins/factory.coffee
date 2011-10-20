window.plugins.factory =
  emit: (div, item) -> div.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'
  bind: (div, item) ->

    syncEditAction = () ->
      console.log item
      div.empty().unbind()
      div.removeClass("factory").addClass(item.type)
      pageElement = div.parents('.page:first')
      try
        div.data 'pageElement', pageElement
        div.data 'item', item
        plugin = wiki.getPlugin item.type
        plugin.emit div, item
        plugin.bind div, item
      catch err
        div.append "<p class='error'>#{err}</p>"
      wiki.putAction pageElement, {type: 'edit', id: item.id, item: item}

    div.dblclick ->
      div.removeClass('factory').addClass(item.type='paragraph')
      wiki.textEditor div, item
    div.bind 'dragenter', (evt) -> evt.preventDefault()
    div.bind 'dragover', (evt) -> evt.preventDefault()
    div.bind "drop", (dropEvent) ->

      readFile = (file) ->
        if file?
          [majorType, minorType] = file.type.split("/")
          reader = new FileReader()
          if majorType == "image"
            reader.onload = (loadEvent) ->
              item.type = 'image'
              item.url = loadEvent.target.result
              item.caption ||= "Uploaded image"
              syncEditAction()
            reader.readAsDataURL(file)
          else if majorType == "text"
            reader.onload = (loadEvent) ->
              item.type = 'paragraph'
              item.text = loadEvent.target.result
              syncEditAction()
            reader.readAsText(file)
          else
            alert "Expected text or image, got '#{join "\n", file.type}'"
        else
          alert "Expected file name, got null"

      dropEvent.preventDefault()
      if (dt = dropEvent.originalEvent.dataTransfer)?
        if 'text/uri-list' in dt.types
          console.log dt
          console.log dt.getData('URL')
          url = dt.getData 'URL'
          if found = url.match /https?:\/\/([a-z0-9\:\.\-]+)\/view\/([a-z0-9-]+)/
            item.type = 'federatedWiki'
            item.text = 'A serecently found federated site.'
            [ignore, item.site, item.slug] = found
            syncEditAction()
          else
            alert "Can't drop #{url}"
        else if 'Files' in dt.types
          readFile dt.files[0]
        else
          console.log dt.types
          alert "Can't read any of #{dt.types}"
      else
        alert "Expected dataTransfer, got null"


