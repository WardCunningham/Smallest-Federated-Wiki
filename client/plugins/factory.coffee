window.plugins.factory =
  emit: (div, item) -> div.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'
  bind: (div, item) ->
    bindDragAndDrop(div, item, ["image", "text"])
    div.dblclick ->
      div.removeClass('factory').addClass(item.type='paragraph')
      textEditor div, item

bindDragAndDrop = (div, item, allowedTypes = []) ->
  ["dragenter", "dragover"].map (eventName) ->
    div.bind eventName, (evt) -> evt.preventDefault()

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
    console.log [dropEvent, dropEvent.originalEvent]
    file = dropEvent.originalEvent.dataTransfer.files[0]
    console.log [file.type, file]
    [majorType, minorType] = file.type.split("/")

    if allowedTypes.filter((t) -> t == majorType).length == 0
      alert("Uploads of type #{majorType} not supported for this item")
    else
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

