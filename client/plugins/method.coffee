window.plugins.method =
  emit: (div, item) ->
  bind: (div, item) ->
    title = div.parents('.page:first').find('h1').text().trim()
    data = wiki.getData()
    throw "can't find data" unless data?
    for row in data
      input = row if row.Material == title
    throw "can't find #{title} in data" unless input?

    sum = (v) ->
      _.reduce v, (s,n) -> s += n

    avg = (v) ->
      sum(v)/v.length

    round = (n) ->
      return '?' unless n?
      if n.toString().match /\.\d\d\d/
        n.toFixed 2
      else
        n

    annotate = (text) ->
      return '' unless text?
      " <span title=\"#{text}\">*</span>"

    calculate = (item) ->
      list = []
      for line in item.text.split "\n"
        color = '#eee'
        value = comment = null
        try
          if input[line]?
            value = input[line]
            comment = input["#{line} Assumptions"] || null
          else if line.match /^[0-9\.-]+$/
            value = +line
          else if line == 'SUM'
            color = '#ddd'
            [value, list] = [sum(list), []]
          else if line == 'AVG'
            color = '#ddd'
            [value, list] = [avg(list), []]
          else
            color = '#edd'
        catch err
          color = '#edd'
          value = null
          comment = err.message

        list.push +value if value? and ! isNaN +value

        "<tr style=\"background:#{color};\"><td style=\"width: 70%;\">#{line}#{annotate comment}<td><b>#{round value}</b>"

    text = calculate(item).join "\n"
    table = $(title+'<table style="width:100%; background:#eee; padding:.8em;"/>').html text
    div.append table
    div.dblclick -> wiki.textEditor div, item
