window.plugins.factory =
  emit: (div, item) -> div.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'
  bind: (div, item) ->
    div.dblclick ->
      div.removeClass('factory').addClass(item.type='paragraph')
      wiki.textEditor div, item
    div.bind 'dragenter', (evt) -> evt.preventDefault()
    div.bind 'dragover', (evt) -> evt.preventDefault()
    div.bind "drop", (dropEvent) ->

      readHandler = (type, handler) ->
        (loadEvent) ->
          item.type = type
          handler loadEvent
          div.empty().unbind()
          div.removeClass("factory").addClass(type)
          pageElement = div.parents('.page:first')
          try
            div.data 'pageElement', pageElement
            div.data 'item', item
            plugin = wiki.getPlugin item.type
            plugin.emit div, item
            plugin.bind div, item
          catch err
            div.append "<p class='error'>#{err}</p>"
          action = {type: 'edit', id: item.id, item: item}
          wiki.putAction(pageElement, action)

      readFile = (file) ->
        if file?
          [majorType, minorType] = file.type.split("/")
          reader = new FileReader()
          if majorType == "image"
            reader.onload = readHandler "image", (loadEvent) ->
              item.url = loadEvent.target.result
              item.caption ||= "Uploaded image"
            reader.readAsDataURL(file)
          else if majorType == "text"
            reader.onload = readHandler "paragraph", (loadEvent) ->
              item.text = loadEvent.target.result
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
        else if 'Files' in dt.types
          readFile dt.files[0]
        else
          console.log dt.types
          alert "Can't read any of #{dt.types}"
      else
        alert "Expected dataTransfer, got null"


