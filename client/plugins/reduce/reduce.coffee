

# interpret item's markup

parse = (text) ->
  program = {}
  for line in text.split /\n/
    words = line.match /\S+/g
    if words is null or words.length < 1
      # ignore it
    else if words[0] is 'FOLD'
      program.find = words[1..999].join ' '
    else if words[0] is 'WATCH'
      program.watch = words[1..999].join ' '
    else if words[0] is 'SLIDE'
      program.slide = words[1..999].join ' '
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
            titles.push {title: link.substr(2, link.length-4)}
  titles

format = (program, titles) ->
  rows = []
  rows.push """<tr><td><p class="error">#{program.error.line} <span title="#{program.error.message}">*""" if program.error
  rows.push """<tr><td>#{title.title}<td style="text-align:right;">50""" for title in titles
  rows.join "\n"

# translate to functional form (excel)

emitrow = (context, label, funct) ->
  context.vars[label] = context.ops.length if label
  context.ops.push "#{label or ''}\t#{funct or ''}"

generate = (context, text) ->
  loc = context.ops.length+1
  for line in text.split /\n/
    console.log line, context
    if args = line.match /^([0-9.eE-]+) +([\w \/%(){},&-]+)$/
      emitrow context, args[2], args[1]
    else if args = line.match /^([A-Z]+) +([\w \/%(){},&-]+)$/
      emitrow context, args[2], "=#{args[1]}(B#{loc}:B#{context.ops.length})"
      loc = context.ops.length
    else if args = line.match /^([A-Z]+)$/
      emitrow context, null, "=#{args[1]}(B#{loc}:B#{context.ops.length})"
      loc = context.ops.length
    else if args = line.match /^([0-9\.eE-]+)$/
      emitrow context, null, args[1]
    else if args = line.match /^ *([\w \/%(){},&-]+)$/
      emitrow context, args[1], "=B#{context.vars[args[1]]+1}"
    else
      emitrow context, "can't parse '#{line}'"

compile = (program, titles, done) ->
  fetch = ($.getJSON "/#{wiki.asSlug title.title}.json" for title in titles)
  $.when(fetch...).then (xhrs...) ->
    context = {ops:[], vars:{}}
    if program.slide
      emitrow context, program.slide, 50
    for xhr in xhrs
      emitrow context
      emitrow context, xhr[0].title
      for item in xhr[0].story
        switch item.type
          when 'method' then generate context, item.text
    console.log context
    done context.ops.join("\n")

code = ($item, item, done) ->
  program = parse item.text
  page = $item.parents('.page').data('data')
  titles = find program, page
  compile program, titles, done

prefetch = (titles, done) ->
  fetch = ($.getJSON "/#{wiki.asSlug title.title}.json" for title in titles)
  $.when(fetch...).then (xhrs...) ->
    for i in [0..titles.length-1]
      title = titles[i]
      xhr = xhrs[i]
      title.items =[]
      for item in xhr[0].story
        switch item.type
          when 'method' then title.items.push(item)
    done titles

performMethod = (state, done) ->
  if state.methods.length > 0
    state.plugin.eval state, state.methods.shift(), state.input, (state, output) ->
       state.output = output
       _.extend state.input, output
       performMethod state, done
  else
    return done state

performTitle = (state, done) ->
  if state.titles.length > 0
    state.methods = (item for item in state.titles[0].items)
    performMethod state, (state) ->
      value = state.input[state.program.watch or state.program.slide]
      state.titles[0].row.find('td:last').text value.toFixed 2
      state.titles.shift()
      performTitle state, done
  else
    return done state

recalculate = (program, input, titles, done) ->
  wiki.getPlugin 'method', (plugin) ->
    state = {program, plugin, input, titles:(t for t in titles), errors:[]}
    performTitle state, done

# render in the wiki page

emit = ($item, item) ->
  program = parse item.text
  page = $item.parents('.page').data('data')
  titles = find program, page

  input = {}
  output = {}

  candidates = $(".item:lt(#{$('.item').index($item)})")
  for elem in candidates
    elem = $(elem)
    if elem.hasClass 'radar-source'
      _.extend input, elem.get(0).radarData()
    else if elem.hasClass 'data'
      _.extend input, elem.data('item').data[0]

  $item.append (slider = $ '<div class=slider />')
  if program.slide
    nominal = output[program.slide] = +input[program.slide] or 50
    sign = if nominal < 0 then -1 else 1
    $item.addClass 'radar-source'
    $item.get(0).radarData = -> output
    slider.slider
      animate: 'fast'
      value: Math.abs(nominal)
      max: Math.abs(nominal)*2
      slide: (event, ui) ->
        input[program.slide] = output[program.slide] = value = ui.value * sign
        $item.find('tr:first td:last').text value
        recalculate program, input, titles, ->
          $item.trigger 'thumb', ui.value * sign
  $item.append """
    <table style="width:100%; background:#eee; padding:.8em; margin-bottom:5px;">
      <tr><td>#{program.slide}<td style="text-align:right;">#{nominal}
    </table>"""
  for title in titles
    title.row = row = $ """<tr><td>#{title.title}<td style="text-align:right;">"""
    $item.find('table').append title.row
  prefetch titles, (titles) ->
    input[program.slide] = nominal
    recalculate program, input, titles, ->
      console.log 'emit/prefetch/recalculate complete'

bind = ($item, item) ->
  $item.find('table').dblclick -> wiki.textEditor $item, item
  $item.find('.slider').dblclick -> 
    code $item, item, (formula) ->
      wiki.dialog "Slider Computation", "<pre>#{formula}</pre>"

window.plugins.reduce = {emit, bind}