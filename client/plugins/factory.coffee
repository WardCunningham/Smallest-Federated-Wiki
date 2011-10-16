window.plugins.factory =
  emit: (div, item) -> div.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'
  bind: (div, item) ->
    div.dblclick ->
      div.removeClass('factory').addClass(item.type='paragraph')
      textEditor div, item
    div.bind 'dragenter', (evt) -> evt.preventDefault()
    div.bind 'dragover', (evt) -> evt.preventDefault()
    div.bind "drop", (dropEvent) ->

      finishDrop = (type, handler) ->
        (loadEvent) ->
          item.type = type
          handler loadEvent
          div.empty()
          div.removeClass("factory").addClass(type)
          pageDiv = div.parents('.page:first')
          action = {type: 'edit', id: item.id, item: item}
          wiki.putAction(pageDiv, action)
          wiki.getPlugin(type).emit(div, item)

      dropEvent.preventDefault()
      if dropEvent.originalEvent.dataTransfer?
        console.log dropEvent.originalEvent.dataTransfer.types
        file = dropEvent.originalEvent.dataTransfer.files[0]
        if file?
          [majorType, minorType] = file.type.split("/")
          reader = new FileReader()
          if majorType == "image"
            reader.onload = finishDrop "image", (loadEvent) ->
              item.url = loadEvent.target.result
              item.caption ||= "Uploaded image"
            reader.readAsDataURL(file)
          else if majorType == "text"
            reader.onload = finishDrop "paragraph", (loadEvent) ->
              item.text = loadEvent.target.result
            reader.readAsText(file)
          else
            alert "Expected text or image, got '#{file.type}'"
        else
          alert "Expected file, got null"
      else
        alert "Expected dataTransfer, got null"

