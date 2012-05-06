window.plugins.metabolism =
  emit: (div, item) ->
  bind: (div, item) ->

    data = []
    input = {}

    attach = (s) ->
      data = _.select wiki.getData(), (row) -> row.Activity?
      throw "can't find data" unless data?

    query = (s) ->
      keys = $.trim(s).split ' '
      choices = data
      for k in keys
        next if k == ' '
        n = choices.length
        choices = _.select choices, (row) ->
          row.Activity.indexOf(k) >= 0 || row.Category.indexOf(k) >= 0
        throw new Error "Can't find #{k} in remaining #{n} choices" if choices.length == 0
      choices

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
      allocated = 0
      for line in item.text.split "\n"
        color = '#eee'
        value = comment = null
        hours = ''
        try
          if args = line.match /^USE ([\w ]+)$/
            color = '#ddd'
            value = ' '
            attach line = args[1]
          else if args = line.match /^([0-9.]+) ([\w ]+)$/
            allocated += hours = +args[1]
            result = query line = args[2]
            value = (input = result[0]).MET * hours
            if result.length > 1
              comment = ("#{row.Category} (#{row.MET}): #{row.Activity}" for row in result).join "\n\n"
          else if input[line]?
            value = input[line]
            comment = input["#{line} Assumptions"] || null
          else if line.match /^[0-9\.-]+$/
            value = +line
          else if line == 'REMAINDER'
            value = 24 - allocated
            allocated += value
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

        "<tr style=\"background:#{color};\"><td style=\"width: 70%;\">#{line}#{annotate comment}<td>#{hours}<td><b>#{round value}</b>"

    text = calculate(item).join "\n"
    table = $('<table style="width:100%; background:#eee; padding:.8em;"/>').html text
    div.append table
    div.dblclick -> wiki.textEditor div, item
