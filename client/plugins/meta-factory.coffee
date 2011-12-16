window.plugins.factory =
  emit: (div, item) ->
    div.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'
    if window.catalog?
      menu = div.find('p').append "<br>Or Choose a Plugin"
      for name, info of window.catalog
        menu.append "<li><a href='#' title='#{info.menu}'>#{name}</a></li>"
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

    div.find('a').click (evt)->
      div.removeClass('factory').addClass(item.type=evt.target.text.toLowerCase())
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
              result = loadEvent.target.result
              if minorType == 'csv'
                item.type = 'data'
                item.columns = (array = csvToArray result)[0]
                item.data = arrayToJson array
                item.text = file.fileName
              else
                item.type = 'paragraph'
                item.text = result
              syncEditAction()
            reader.readAsText(file)
          else
            alert "Expected text or image, got '#{join "\n", file.type}'"
        else
          alert "Expected file name, got null"

      dropEvent.preventDefault()
      if (dt = dropEvent.originalEvent.dataTransfer)?
        if 'text/uri-list' in dt.types
          console.log dt.getData('URL')
          url = dt.getData 'URL'
          if found = url.match /https?:\/\/([a-z0-9\:\.\-]+)\/.*?view\/([a-z0-9-]+)$/
            [ignore, item.site, item.slug] = found
            $.getJSON "http://#{item.site}/#{item.slug}.json", (remote) ->
              console.log remote
              item.type = 'federatedWiki'
              item.title = remote.title || item.slug
              item.text = remote.synopsis || remote.story[0].text || remote.story[1].text || 'A recently found federated wiki site.'
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

# from http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
# via http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data

csvToArray = (strData, strDelimiter) ->
  strDelimiter = (strDelimiter or ",")
  objPattern = new RegExp(("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi")
  arrData = [ [] ]
  arrMatches = null
  while arrMatches = objPattern.exec(strData)
    strMatchedDelimiter = arrMatches[1]
    arrData.push []  if strMatchedDelimiter.length and (strMatchedDelimiter isnt strDelimiter)
    if arrMatches[2]
      strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"")
    else
      strMatchedValue = arrMatches[3]
    arrData[arrData.length - 1].push strMatchedValue
  arrData

arrayToJson = (array) ->
  cols = array.shift()
  rowToObject = (row) ->
    obj = {}
    for [k, v] in _.zip(cols, row)
      obj[k] = v if v? && (v.match /\S/) && v != 'NULL'
    obj
  (rowToObject row for row in array)
