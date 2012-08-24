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

    attach = (search) ->
      for elem in wiki.getDataNodes div
        if (source = $(elem).data('item')).text.indexOf(search) >= 0
          return source.data
      throw new Error "can't find dataset with caption #{search}"

    # http://stella.laurenzo.org/2011/03/bulletproof-node-js-coding/

    sum = (v) ->
      _.reduce v,
        (s,n) -> s += n
        0

    avg = (v) ->
      sum(v)/v.length

    lookup = (v) ->
      table = attach 'Tier3ExposurePercentages'
      row = _.find table, (row) ->
        asValue(row.Exposure)==v[0] and asValue(row.Raw)==v[1]
      throw new Error "can't find exposure #{v[0]} and raw #{v[1]}" unless row?
      asValue(row.Percentage)

    polynomial = (v, subtype) ->
      table = attach 'Tier3Polynomials'
      row = _.find table, (row) ->
        row.SubType == subtype and asValue(row.Min) <= v and asValue(row.Max) > v
      throw new Error "can't find applicable polynomial for #{v} in '#{subtype}'" unless row?
      result  = asValue(row.C0)
      result += asValue(row.C1) * v
      result += asValue(row.C2) * Math.pow(v,2)
      result += asValue(row.C3) * Math.pow(v,3)
      result += asValue(row.C4) * Math.pow(v,4)
      result += asValue(row.C5) * Math.pow(v,5)
      result += asValue(row.C6) * Math.pow(v,6)
      if asValue(row['One minus'])
        1 - result
      else
        result

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
        value = comment = hover = null
        hours = ''
        line = lines.shift()
        return done report unless line?

        next_dispatch = ->
          list.push +value if value? and ! isNaN +value
          long = ''
          if line.length > 40
            long = line
            line = "#{line.substr 0, 20} ... #{line.substr -15}"
          report.push """
            <tr style="background:#{color};">
              <td style="width: 20%; text-align: right;" title="#{hover||''}">
                <b>#{round value}</b>
              <td title="#{long}">#{line}#{annotate comment}
            """
          dispatch list, allocated, lines, report, done

        apply = (name, list, label) ->
          color = '#ddd'
          switch name
            when 'SUM' then sum list
            when 'AVG', 'AVERAGE' then avg list
            when 'MIN', 'MINIMUM' then _.min list
            when 'MAX', 'MAXIMUM' then _.max list
            when 'FIRST' then list[0]
            when 'PRODUCT' then _.reduce list, (p,n) -> p *= n
            when 'LOOKUP' then lookup list
            when 'POLYNOMIAL' then polynomial list[0], label
            else throw new Error "don't know how to #{name}"

        try
          if args = line.match /^([0-9.eE-]+) +([\w \/%(){},&-]+)$/
            result = hours = +args[1]
            line = args[2]
            output[line] = value = result
          else if args = line.match /^([A-Z]+) +([\w \/%(){},&-]+)$/
            [value, list, count] = [apply(args[1], list, args[2]), [], list.length]
            hover = "#{args[1]} of #{count} numbers\n= #{value}"
            line = args[2]
            if (output[line]? or input[line]?) and !item.silent
              previous = asValue(output[line]||input[line])
              if Math.abs(change = value/previous-1) > 0.0001
                comment = "previously #{previous}\nΔ #{round(change*100)}%"
                wiki.log 'method', args[0], value, '!=', previous
            output[line] = value
          else if args = line.match /^([A-Z]+)$/
            [value, list, count] = [apply(args[1], list), [], list.length]
            hover = "#{args[1]} of #{count} numbers\n= #{value}"
          else if line.match /^[0-9\.eE-]+$/
            value = +line
            line = ''
          else if args = line.match /^ *([\w \/%(){},&-]+)$/
            if output[args[1]]?
              value = output[args[1]]
            else if input[args[1]]?
              value = asValue(input[args[1]])
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