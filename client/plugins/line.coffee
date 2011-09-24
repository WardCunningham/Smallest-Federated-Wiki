window.plugins.line =
  emit: (div, item) ->
    wiki.getScript 'js/d3/d3.js'
    div.append '''
      <style>
      svg {
        font: 10px sans-serif;
      }

      .rule line {
        stroke: #eee;
        shape-rendering: crispEdges;
      }

      .rule line.axis {
        stroke: #000;
      }

      .line {
        fill: none;
        stroke: steelblue;
        stroke-width: 1.5px;
      }

      circle.line {
        fill: #fff;
      }
      </style>
    '''
  bind: (div, item) ->
    data = d3.range(20).map((i) ->
      x: i / 19
      y: (Math.sin(i / 3) + 1) / 2
    )
    series = wiki.getData()
    data = ({x: (p[0]-series[0][0])/3600/48/1000, y:p[1]/100.0} for p in series)
    console.log data
    w = 380
    h = 275
    p = 20
    x = d3.scale.linear().domain([ 0, 1 ]).range([ 0, w ])
    y = d3.scale.linear().domain([ 0, 1 ]).range([ h, 0 ])
    vis = d3.select(div.get(0)).data([ data ]).append("svg:svg").attr("width", w + p * 2).attr("height", h + p * 2).append("svg:g").attr("transform", "translate(" + p + "," + p + ")")
    rules = vis.selectAll("g.rule").data(x.ticks(10)).enter().append("svg:g").attr("class", "rule")
    rules.append("svg:line").attr("x1", x).attr("x2", x).attr("y1", 0).attr "y2", h - 1
    rules.append("svg:line").attr("class", (d) ->
      (if d then null else "axis")
    ).attr("y1", y).attr("y2", y).attr("x1", 0).attr "x2", w + 1
    rules.append("svg:text").attr("x", x).attr("y", h + 3).attr("dy", ".71em").attr("text-anchor", "middle").text x.tickFormat(10)
    rules.append("svg:text").attr("y", y).attr("x", -3).attr("dy", ".35em").attr("text-anchor", "end").text y.tickFormat(10)
    vis.append("svg:path").attr("class", "line").attr "d", d3.svg.line().x((d) ->
      x d.x
    ).y((d) ->
      y d.y
    )
    vis.selectAll("circle.line").data(data).enter().append("svg:circle").attr("class", "line").attr("cx", (d) ->
      x d.x
    ).attr("cy", (d) ->
      y d.y
    ).attr "r", 3.5