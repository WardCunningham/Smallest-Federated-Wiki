window.plugins.rollup =
  emit: (div, item) ->
  bind: (div, item) ->

    div.dblclick -> wiki.textEditor div, item

    div.append """
      <style>
        td.material {overflow:hidden;}
        td.score {text-align:right; width:25px}
      </style>
    """

    asValue = (obj) ->
      return NaN unless obj?
      switch obj.constructor
        when Number then obj
        when String then +obj
        when Array then asValue(obj[0])
        when Object then asValue(obj.value)
        when Function then obj()
        else NaN

    attach = (search) ->
      wiki.log 'attach', wiki.getDataNodes div
      for elem in wiki.getDataNodes div
        wiki.log 'attach loop', $(elem).data('item').text
        if (source = $(elem).data('item')).text.indexOf(search) >= 0
          return source
      throw new Error "can't find dataset with caption #{search}"

    reference = attach "Materials Summary"

    display = (calculated, state) ->
      row = state.row
      $row = state.$row
      for col in reference.columns
        if col == 'Material'
          label = wiki.resolveLinks "[[#{row.Material}]]"
          if calculated
            if state.errors.length > 0
              errors = (e.message.replace(/"/g,"'") for e in state.errors).join "\n"
              $row.append """<td class="material">#{label} <span style="color:red;" title="#{errors}">✘</span></td>"""
            else
              $row.append """<td class="material">#{label}</td>"""
          else
            $row.append """<td class="material">#{label}</td>"""
        else
          old = asValue row[col]
          now = asValue state.input[col]
          if calculated && now?
            color = if old.toFixed(4) == now.toFixed(4)
              'green'
            else if old.toFixed(0) == now.toFixed(0)
              'orange'
            else
              'red'
            title = "#{row.Material}\n#{col}\nold #{old.toFixed 4}\nnow #{now.toFixed 4}"
            $row.append """<td class="score" title="#{title}" data-thumb="#{col}" style="color:#{color};">#{old.toFixed 0}</td>"""
          else
            title = "#{row.Material}\n#{col}\n#{old.toFixed 4}"
            $row.append """<td class="score" title="#{title}" data-thumb="#{col}">#{old.toFixed 0}</td>"""

    perform = (state, plugin, done) ->
      if state.methods.length > 0
        plugin.eval state, state.methods.shift(), state.input, (state, output) ->
           state.output = output
           _.extend state.input, output
           perform state, plugin, done
      else
        return done state

    timeout = (delay, done) ->
      setTimeout done, delay

    recalculate = (delay, state, done) ->
      timeout delay, ->
        wiki.getPlugin 'method', (plugin) ->
          $.getJSON "/#{state.slug}.json", (data) ->
            state.methods = _.filter data.story, (item) -> item.type == 'method'
            perform state, plugin, done

    radar = (input={}) ->
      candidates = $(".item:lt(#{$('.item').index(div)})")
      output = _.extend {}, input
      for elem in candidates
        elem = $(elem)
        if elem.hasClass 'radar-source'
          _.extend output, elem.get(0).radarData()
        else if elem.hasClass 'data'
          _.extend output, elem.data('item').data[0]
      return output

    reindex = (results) ->
      wiki.log 'reindex', results
      sorted = _.sortBy results, (state) -> -asValue(state.input['Total Score'])
      for state, index in sorted
        state.input.Rank = "#{index+1}"
      for state in results
        state.$row.empty()
        display true, state

    div.append ($table = $ """<table/>""")
    rows = _.sortBy reference.data, (row) -> -asValue(row['Total Score'])
    delay = 0
    results = []
    remaining = rows.length
    for row in rows
      slug = wiki.asSlug row.Material
      $table.append ($row = $ """<tr class="#{slug}">""")
      state = {$row, row, slug, input: radar(), errors: []}
      display false, state
      delay += 200
      recalculate delay, state, (state)->
        state.$row.empty()
        state.input.Rank = state.row.Rank
        display true, state
        results.push state
        remaining -= 1
        reindex(results) unless remaining
