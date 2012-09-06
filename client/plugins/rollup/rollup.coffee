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
      for elem in wiki.getDataNodes div
        if (source = $(elem).data('item')).text.indexOf(search) >= 0
          return source
        throw new Error "can't find dataset with caption #{search}"

    reference = attach "Materials Summary"

    display = ($row, row, context) ->
      for col in reference.columns
        if col == 'Material'
          label = wiki.resolveLinks "[[#{row.Material}]]"
          if context != {}
            title = ("#{k}: #{asValue(v).toString().replace /0000*\d$/, ''}" for k,v of context).join "\n"
            $row.append """<td class="material">#{label} <span title="#{title}">✔</span></td>"""
          else
            $row.append """<td class="material">#{label}</td>"""
        else
          old = asValue row[col]
          if (now = context[col])
            color = if old.toFixed(4) == now.toFixed(4) then 'green' else 'red'
            title = "#{row.Material}\n#{col}\nold #{old.toFixed 2}\nnow #{now.toFixed 2}"
            $row.append """<td class="score" title="#{title}" data-thumb="#{col}" style="color:#{color};">#{old.toFixed 0}</td>"""
          else
            title = "#{row.Material}\n#{col}\n#{old.toFixed 2}"
            $row.append """<td class="score" title="#{title}" data-thumb="#{col}">#{old.toFixed 0}</td>"""

    perform = ($row, row, context, plugin, methods, done) ->
      if methods.length > 0
        plugin.eval div, methods.shift(), context, (output) ->
          wiki.log 'output', ("#{k}: #{v}" for k,v of output).join ", "
          _.extend context, output
          wiki.log 'context', ("#{k}: #{v}" for k,v of output).join ", "
          perform $row, row, context, plugin, methods, done
      else
        # title = ("#{k}: #{asValue(v).toString().replace /0000*\d$/, ''}" for k,v of context).join "\n"
        # $row.find("td:first").append(""" <span title="#{title}"">##{context.foo}""")
        return done $row, row, context

    recalculate = ($row, row, context, done) ->
      wiki.getPlugin 'method', (plugin) ->
        slug = wiki.asSlug row.Material
        $.getJSON "/#{slug}.json", (data) ->
          methods = _.filter data.story, (item) -> item.type == 'method'
          perform $row, row, context, plugin, methods, done

    div.append ($table = $ """<table/>""")
    wiki.log 'rollup', reference, reference.data, $table

    rows = _.sortBy reference.data, (row) -> -asValue(row['Total Score'])
    for row in rows
      slug = wiki.asSlug row.Material
      $table.append ($row = $ """<tr class="#{slug}">""")
      display $row, row, {}
      recalculate $row, row, {foo: 0}, ($row, row, context)->
        wiki.log 'rollup redisplay', wiki.asSlug row.Material
        $row.empty()
        display $row, row, context