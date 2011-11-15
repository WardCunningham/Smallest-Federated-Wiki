window.plugins.line =
  emit: (div, item) ->
    wiki.getScript '/js/d3/d3.js'
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
    series = wiki.getData()
    data = if (start = series[0][0]) > 1000000000000 # js time
      ({x: (p[0]-start)/24/3600/1000, y:p[1]} for p in series)
    else if start > 1000000000 # unix time
      ({x: (p[0]-start)/24/3600, y:p[1]} for p in series)
    else
      ({x: (p[0]), y:p[1]} for p in series)
    extent = (f) ->
      [lo, hi] = [d3.min(data,f), d3.max(data,f)]
      step = Math.pow 10, Math.floor Math.log(hi-lo) / Math.log(10)
      [step*Math.floor(lo/step), step*Math.ceil(hi/step)]
    w = 380
    h = 275
    p = 40
    x = d3.scale.linear().domain(extent (p)->p.x).range([ 0, w ])
    y = d3.scale.linear().domain(extent (p)->p.y).range([ h, 0 ])

    vis = d3.select(div.get(0))
      .data([ data ])
      .append("svg:svg")
      .attr("width", w + p * 2)
      .attr("height", h + p * 2)
      .append("svg:g")
      .attr("transform", "translate(" + p + "," + p + ")")

    xrules = vis.selectAll("g.xrule")
      .data(x.ticks(10))
      .enter()
      .append("svg:g")
      .attr("class", "rule")
    xrules.append("svg:line")
      .attr("x1", x)
      .attr("x2", x)
      .attr("y1", 0)
      .attr("y2", h-1)
    xrules.append("svg:text")
      .attr("x", x)
      .attr("y", h + 3)
      .attr("dy", ".71em")
      .attr("text-anchor", "middle")
      .text(x.tickFormat(10))

    yrules = vis.selectAll("g.yrule")
      .data(y.ticks(10))
      .enter()
      .append("svg:g")
      .attr("class", "rule")
    yrules.append("svg:line")
      .attr("class", (d) -> (if d then null else "axis"))
      .attr("y1", y)
      .attr("y2", y)
      .attr("x1", 0)
      .attr("x2", w + 1)
    yrules.append("svg:text")
      .attr("y", y)
      .attr("x", -3)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(y.tickFormat(10))

    vis.append("svg:path")
      .attr("class", "line")
      .attr("d", d3.svg.line().x((d) -> x(d.x)).y((d) -> y(d.y)))
    vis.selectAll("circle.line")
      .data(data)
      .enter()
      .append("svg:circle")
      .attr("class", "line")
      .attr("cx", (d) -> x(d.x)).attr("cy", (d) -> y(d.y)).attr("r", 3.5)