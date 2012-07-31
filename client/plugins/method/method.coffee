window.plugins.method =
  emit: (div, item) ->
  bind: (div, item) ->

    input = {}
    output = {}

    asValue = (obj) ->
      return NaN unless obj?
      switch obj.constructor
        when Number then obj
        when String then +obj
        when Array then asValue(obj[0])
        when Object then asValue(obj.value)
        when Function then obj()
        else NaN

    candidates = $(".item:lt(#{$('.item').index(div)})")
    for elem in candidates
      elem = $(elem)
      if elem.hasClass 'radar-source'
        _.extend input, elem.get(0).radarData()
      else if elem.hasClass 'data'
        _.extend input, elem.data('item').data[0]

    div.addClass 'radar-source'
    div.get(0).radarData = -> output
    div.mousemove (e) -> $(div).triggerHandler('thumb', $(e.target).text())

    # http://stella.laurenzo.org/2011/03/bulletproof-node-js-coding/

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
      lines = item.text.split "\n"
      report = []

      dispatch = (list, allocated, lines, report, done) ->
        color = '#eee'
        value = comment = null
        hours = ''
        line = lines.shift()
        return done report unless line?

        next_dispatch = ->
          list.push +value if value? and ! isNaN +value
          report.push "<tr style=\"background:#{color};\"><td style=\"width: 20%; text-align: right;\"><b>#{round value}</b><td>#{line}#{annotate comment}"
          dispatch list, allocated, lines, report, done

        apply = (name, list) ->
          if name == 'SUM'
            color = '#ddd'
            sum(list)
          else if name == 'AVG'
            color = '#ddd'
            avg(list)
          else
            color = '#edd'

        try
          if args = line.match /^(-?[0-9.]+) ([\w \/%()-]+)$/
            result = hours = +args[1]
            line = args[2]
            output[line] = value = result
          else if args = line.match /^([A-Z]+) ([\w \/%()-]+)$/
            [value, list] = [apply(args[1], list), []]
            line = args[2]
            if output[line]? or input[line]?
              if value != (previous = asValue(output[line]||input[line]))
                comment = "previously #{previous} Δ#{value-previous}"
            output[line] = value
          else if args = line.match /^([A-Z]+)$/
            [value, list] = [apply(args[1], list), []]
          else if line.match /^[0-9\.-]+$/
            value = +line
            line = ''
          else if line.match /^([\w \/%()-]+)$/
            if output[line]?
              value = output[line]
            else if input[line]?
              value = asValue(input[line])
            else
              color = '#edd'
              comment = "can't find value of '#{line}'"
          else
            color = '#edd'
            comment = "can't parse '#{line}'"
        catch err
          color = '#edd'
          value = null
          comment = err.message
        return next_dispatch()

      dispatch list, allocated, lines, report, (report) ->
        text = report.join "\n"
        table = $('<table style="width:100%; background:#eee; padding:.8em;"/>').html text
        div.append table
        div.dblclick -> wiki.textEditor div, item

    calculate item