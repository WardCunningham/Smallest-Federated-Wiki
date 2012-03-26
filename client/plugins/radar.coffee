window.plugins.radar =
  bind: (div, item) ->
  emit: (div, item) ->
    wiki.getScript '/js/d3/d3.js', ->
      wiki.getScript '/js/d3/d3.time.js', ->
        div.append '''
          <style>
          svg { font: 10px sans-serif; }
         </style>
        '''

        who = $('.chart,.data,.calculator').last()
        data = who.data('item').data

        # Adapted from https://gist.github.com/1630683

        w = 400
        h = 400
        vizPadding =
          top: 10
          right: 0
          bottom: 15
          left: 0

        dimension = 7
        ruleColor = "#CCC"

        randomFromTo = randomFromTo = (from, to) ->
          Math.floor Math.random() * (to - from + 1) + from

        series = [ [], [] ]
        hours = []
        i = 0
        while i < dimension
          series[0][i] = randomFromTo(-10, 20)
          series[1][i] = randomFromTo(5, 20)
          hours[i] = i
          i += 1
        mergedArr = series[0].concat(series[1])
        minVal = d3.min(mergedArr)
        maxVal = d3.max(mergedArr)
        maxVal = maxVal + ((maxVal - minVal) * 0.15)
        i = 0
        while i < series.length
          series[i].push series[i][0]
          i += 1

        viz = d3.select(div.get(0))
          .append("svg:svg")
          .attr("width", w)
          .attr("height", h)
          .attr("class", "vizSvg")
        vizBody = viz.append("svg:g")
          .attr("id", "body")

        heightCircleConstraint = h - vizPadding.top - vizPadding.bottom
        widthCircleConstraint = w - vizPadding.left - vizPadding.right
        circleConstraint = d3.min([ heightCircleConstraint, widthCircleConstraint ])
        radius = d3.scale.linear()
          .domain([ minVal, maxVal ])
          .range([ 0, (circleConstraint / 2) ])
        radiusLength = radius(maxVal)
        centerXPos = widthCircleConstraint / 2 + vizPadding.left
        centerYPos = heightCircleConstraint / 2 + vizPadding.top
        vizBody.attr "transform", "translate(" + centerXPos + ", " + centerYPos + ")"

        radialTicks = radius.ticks(5)
        circleAxes = vizBody.selectAll(".circle-ticks")
          .data(radialTicks)
          .enter()
          .append("svg:g")
          .attr("class", "circle-ticks")
        circleAxes.append("svg:circle")
          .attr("r", (d, i) -> radius d )
          .attr("class", "circle")
          .style("stroke", ruleColor)
          .style "fill", "none"
        circleAxes.append("svg:text")
          .attr("text-anchor", "middle")
          .style("stroke", ruleColor)
          .attr("dy", (d) -> -1 * radius(d) )
          .text String
        lineAxes = vizBody.selectAll(".line-ticks")
          .data(hours)
          .enter()
          .append("svg:g")
          .attr("transform", (d, i) -> "rotate(" + ((i / hours.length * 360) - 90) + ")translate(" + radius(maxVal) + ")" )
          .attr("class", "line-ticks")
        lineAxes.append("svg:line")
          .attr("x2", -1 * radius(maxVal))
          .style("stroke", ruleColor)
          .style "fill", "none"
        lineAxes.append("svg:text")
          .text(String)
          .attr("text-anchor", "middle")
          .style("stroke", ruleColor)
          .attr "transform", (d, i) -> (if (i / hours.length * 360) < 180 then null else "rotate(180)")

        colorSelector = (d, i) -> if i is 0 then "green" else "blue"
        vizBody.selectAll(".series")
          .data(series)
          .enter()
          .append("svg:g")
          .attr("class", "series")
          .append("svg:path")
          .attr("class", "line")
          .style("fill", colorSelector)
          .style("stroke", colorSelector)
          .style("stroke-width", 3)
          .style("fill-opacity", .1)
          .style("fill", colorSelector)
          .attr("d", d3.svg.line.radial()
            .radius((d) -> radius d )
            .angle((d, i) -> (i / dimension) * 2 * Math.PI ))
          .append("svg:title").text((d,i) -> "Material #{i+1}")
