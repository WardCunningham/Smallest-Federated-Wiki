window.plugins.scatter =
  bind: (div, item) ->
  emit: (div, item) ->
    wiki.getScript '/js/d3/d3.js', ->
      wiki.getScript '/js/d3/d3.time.js', ->
        div.append '''
          <style>
          svg {
            font: 10px sans-serif;
            background: #eee;
          }
          circle {
            fill: gray;
            stroke: white;
          }
         </style>
        '''

        value = (obj) ->
          return NaN unless obj?
          switch obj.constructor
            when Number then obj
            when String then +obj
            when Array then value(obj[0])
            when Object then value(obj.value)
            when Function then obj()
            else NaN

        round = (n) ->
          return '?' unless n?
          if n.toString().match /\.\d\d\d/
            n.toFixed 2
          else
            n

        who = $('.chart,.data,.calculator').last()
        data = who.data('item').data
        horz = "Water / Land Intensity Total"
        vert = "Total Score"
        xdat = (d) -> value d[horz]
        ydat = (d) -> value d[vert]
        title = (d) ->
          """
          #{d.Material}
          #{horz}: #{round xdat d}
          #{vert}: #{round ydat d}
          Rank: #{value d['Rank']}
          """

        who.bind 'thumb', (e, thumb) ->
          return if thumb == horz
          wiki.log 'thumb', thumb
          horz = thumb
          x = d3.scale.linear().domain(extent xdat).range([ 0, w ])
          d3.selectAll("circle").transition()
            .duration(500)
            .delay((d, i) -> i * 10)
            .attr("cx", (d) -> x(xdat(d)))
            .selectAll("title").text title

        extent = (f) ->
          [lo, hi] = [d3.min(data,f), d3.max(data,f)]
          step = Math.pow 10, Math.floor Math.log(hi-lo) / Math.log(10)
          [step*Math.floor(lo/step), step*Math.ceil(hi/step)]

        w = 360
        h = 275
        p = 20
        x = d3.scale.linear().domain(extent xdat).range([ 0, w ])
        y = d3.scale.linear().domain(extent ydat).range([ h, 0 ])
        fill = d3.scale.category20()

        vis = d3.select(div.get(0))
          .data([ data ])
          .append("svg:svg")
          .attr("width", w + p * 2)
          .attr("height", h + p * 2)
          .append("svg:g")
          .attr("transform", "translate(" + p + "," + p + ")")

        vis.selectAll("circle")
          .data(data)
          .enter()
          .append("svg:circle")
          .attr("cx", (d) -> x(xdat(d)))
          .attr("cy", (d) -> y(ydat(d)))
          .style("fill", (d,i) -> fill(d.Cluster || d.Material.split(/\s+/).reverse()[0]))
          .style("cursor", 'pointer')
          .attr("r", 10)
          .on("click", (d) ->
            wiki.doInternalLink(d.Material, div.parents '.page'))
          .append("svg:title").text title

