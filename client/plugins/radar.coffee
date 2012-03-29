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

        limit =
          "Carcinogenicity": 7
          "Acute Toxicity": 7
          "Chronic Toxicity": 7
          "Reproductive/Endocrine Disrupter Toxicity": 4
          "Chemistry Total": 25
          "Energy Intensity": 10
          "GHG Emissions Intensity": 15
          "Energy/GHG Emissions Total": 25
          "Water Intensity": 18
          "Land Use Intensity": 7
          "Water/ Land Use Total": 25
          "Hazardous Waste": 10
          "MSW": 6.25
          "Industrial waste": 5
          "Recyclable/ Compostable waste": 2.5
          "Mineral waste": 1.25
          "Physical Waste Total": 25
          "Total score": 100

        keys = Object.keys(limit)
        percents = (obj) ->
          (100.0*obj[k]/limit[k] for k in keys.concat(keys[0]))

        data = (i[0] for i in wiki.getDataNodes(div).dataDash('data'))

        # Adapted from https://gist.github.com/1630683

        w = 400
        h = 400
        vizPadding =
          top: 10
          right: 0
          bottom: 15
          left: 0

        dimension = keys.length
        ruleColor = "#CCC"

        series = (percents(d) for d in data)

        hours = [0..dimension-1]
        minVal = 0
        maxVal = 100

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
          .attr("text-anchor", "end")
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
          .text((d,i) -> keys[i])
          .attr("text-anchor", "start")
          .style("stroke", ruleColor)
          .attr "transform", "rotate(180)"

        fill = d3.scale.category10()
        colorSelector = (d, i) -> fill i
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
          .append("svg:title").text((d,i) -> data[i]["Material name"])

