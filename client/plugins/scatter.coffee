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

        who = $('.chart,.data,.calculator').last()
        data = who.dataDash('data')[0]
        horz = "Energy/GHG Emissions Intensity Total"
        vert = "Total Score"
        xdat = (d) -> +d[horz]
        ydat = (d) -> +d[vert]
        who.bind 'thumb', (e, thumb) ->
          return if thumb == horz
          wiki.log 'thumb', thumb
          horz = thumb
          x = d3.scale.linear().domain(extent xdat).range([ 0, w ])
          d3.selectAll("circle").transition()
            .duration(500)
            .delay((d, i) -> i * 10)
            .attr("cx", (d) -> x(xdat(d)))

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
          .style("fill", (d,i) -> fill(d.Material.split(/\s+/).reverse()[0]))
          .attr("r", 10)
          .on("click", (d) ->
            $(div).parents('.page').nextAll().remove()
            wiki.doInternalLink(d.Material))
          .append("svg:title").text((d) -> d.Material)

