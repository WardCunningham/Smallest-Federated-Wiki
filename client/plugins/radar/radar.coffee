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

        limitsFromData = (data) ->
          max = -Infinity
          keys = {}
          for d in data
            for k,v of d
              keys[k] = 1
              max = if v>max then v else max
          limit = {}
          for k,v of keys
            limit[k] = max

        candidates = $(".item:lt(#{$('.item').index(div)})")
        if (who = candidates.filter ".radar-source").size()
          limitsFromData (data = (d.radarData() for d in who))
        else if (who = candidates.filter ".data").size()
          who = who.filter (d) -> $(this).data('item').data.length == 1
          data = ($(d).data('item').data[0] for d in who)
        else throw "Can't find suitable data"

        # if item.text?
        #   for line in item.text.split /\n/
        #     console.log ['line', line]

        keys = Object.keys(limit)

        value = (obj) ->
          return NaN unless obj?
          switch obj.constructor
            when Number then obj
            when String then +obj
            when Array then value(obj[0])
            when Object then value(obj.value)
            when Function then obj()
            else NaN

        percents = (obj) ->
          (100.0*value(obj[k])/limit[k] for k in keys.concat(keys[0]))

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

        angle = (i) ->
          (i / dimension) * 2 * Math.PI
        rotate = (i) ->
          "rotate(#{((i / dimension * 360) - 90)})"
        translate = (percent) ->
         "translate(#{radius maxVal * percent/100 })"

        series = (percents(d) for d in data)
        comments = []
        for m in [0..data.length-1]
          for d in [0..dimension-1]
            if (o = data[m][keys[d]])?
             if (c = o.comment)?
              comments.push
                material: m, dimension: d, comment: c

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
        vizBody.attr "transform", "translate(#{centerXPos},#{centerYPos})" + rotate(0)

        lastThumb = null
        who.bind 'thumb', (e, thumb) ->
          return if thumb == lastThumb || -1 == (index = keys.indexOf lastThumb = thumb)
          vizBody.transition().duration(750)
            .attr "transform", "translate(#{centerXPos},#{centerYPos})" + rotate(-index)

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
          .attr("transform", (d, i) -> rotate(i)+translate(100) )
          .attr("class", "line-ticks")
        lineAxes.append("svg:line")
          .attr("x2", -1 * radius(maxVal))
          .style("stroke", ruleColor)
          .style "fill", "none"
        lineAxes.append("svg:text")
          .text((d,i) -> keys[i])
          .attr("text-anchor", "start")
          .style("stroke", ruleColor)
          .style("cursor", 'pointer')
          .attr("transform", "rotate(180)")
          .on("click", (d,i) ->
            wiki.doInternalLink keys[i], $(div).parents('.page')
          )

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
            .radius((d) -> radius(if d? and !isNaN(d) then d else 0))
            .angle((d, i) -> angle i ))
          .append("svg:title").text((d,i) -> data[i]["Material name"])

          vizBody.selectAll(".comments")
            .data(comments)
            .enter()
            .append("svg:g")
            .attr("class", "comments")
            .append("svg:text")
            .style("font-size", "40px")
            .style("fill", colorSelector)
            .attr("text-anchor", "mid")
            .attr("transform", (d) ->
              percent = series[d.material][d.dimension]
              rotate(d.dimension)+translate(percent) )
            .text('*')
            .append("svg:title").text((d) -> d.comment)
