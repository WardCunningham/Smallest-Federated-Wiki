parse = (text) ->
  program = {}
  for line in text.split /\n/
    words = line.match /\S+/g
    if words[0] is 'FIND'
      program.find = words[1..999].join ' '
    else if words[0] is 'APPLY'
      program.apply = words[1..999].join ' '
    else if words[0] is 'SLIDE'
      program.slide = true
    else
      program.error = {line, message: "can't make sense of line"}
  program

find = (program, page) ->
  titles = []
  if program.find
    for item in page.story
      if item.type is 'pagefold'
        parsing = item.text is program.find
      else if parsing and item.type is 'paragraph'
        if links = item.text.match /\[\[.*?\]\]/g
          for link in links
            titles.push link.substr(2, link.length-4)
  titles

format = (program, titles) ->
  rows = []
  rows.push """<tr><td><p class="error">#{program.error.line} <span title="#{program.error.message}">*""" if program.error
  rows.push """<tr><td>#{title}<td>50%""" for title in titles
  rows.join "\n"

emit = ($item, item) ->
  program = parse item.text
  page = $item.parents('.page').data('data')
  titles = find program, page
  $item.append """
    <table style="width:100%; background:#eee; padding:.8em; margin-bottom:5px;">
      #{format program, titles}
    </table>"""
  $item.append (slider = $ '<div />')
  if program.slide
    slider.slider
      animate: 'fast'
      value: 50
      slide: (event, ui) ->
        $item.trigger 'thumb', ui.value
        $item.find('td:last').text "#{ui.value}%"

bind = ($item, item) ->
  $item.dblclick -> wiki.textEditor $item, item

window.plugins.reduce = {emit, bind}