window.plugins.rollup =
  emit: (div, item) ->
  bind: (div, item) ->

    div.dblclick -> wiki.textEditor div, item

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
    context = {foo: 0}

    recalculate = ($row, slug) ->
      wiki.getPlugin 'method', (plugin) ->
        $.getJSON "/#{slug}.json", (data) ->
          plugin.eval context, item, ->
            $row.find("td:first").append(" ##{context.foo}")

    div.append """
      <style>
        td.material {overflow:hidden;}
        td.score {text-align:right; width:25px}
      </style>
    """

    div.append ($table = $ """<table/>""")
    wiki.log 'rollup', reference, reference.data, $table

    rows = _.sortBy reference.data, (row) -> -asValue(row['Total Score'])
    for row in rows
      label = wiki.resolveLinks "[[#{row.Material}]]"
      slug = wiki.asSlug row.Material
      $table.append ($row = $ """
        <tr class="#{slug}">
          <td class="material">#{label}</td>
      """)
      for col in reference.columns
        continue if col == 'Material'
        value = asValue row[col]
        title = "#{row.Material}\n#{col}\n#{value.toFixed 2}"
        $row.append """<td class="score" title="#{title}" data-thumb="#{col}">#{value.toFixed 0}</td>"""
      recalculate $row, slug