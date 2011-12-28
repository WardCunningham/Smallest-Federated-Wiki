window.plugins.force =
  emit: (div, item) ->
    wiki.getScript '/js/d3/d3.js'
    wiki.getScript '/js/d3/d3.geom.js'
    wiki.getScript '/js/d3/d3.layout.js'
    div.append """
      <style type="text/css">
        circle.node {
          stroke: #fff;
          stroke-width: 1.5px;
        }

        line.link {
          stroke: #999;
          stroke-opacity: .6;
        }
      </style>
    """
  bind: (div, item) ->
    w = 380
    h = 230
    fill = d3.scale.category20()

    vis = d3.select(div.get(0))
      # .append("svg:marker") 
      # .attr("id", "arrowhead") 
      # .attr("viewBox","0 0 10 10") 
      # .attr("refX","20") 
      # .attr("refY","5") 
      # .attr("markerUnits","strokeWidth") 
      # .attr("markerWidth","9") 
      # .attr("markerHeight","5") 
      # .attr("orient","auto") 
      # .append("svg:path") 
      # .attr("d","M 0 0 L 10 5 L 0 10 z") 
      # .attr("fill", "#BBBBBB");
      .append("svg:svg")
      .attr("width", w)
      .attr("height", h)
      

    json = wiki.getData()
    console.log json

    force = d3.layout.force()
      .charge(-120)
      .linkDistance(30)
      .nodes(json.nodes)
      .links(json.links)
      .size([ w, h ])
      .start()

    link = vis.selectAll("line.link")
      .data(json.links)
      .enter()
      .append("svg:line")
      .attr("class", "link")
      .style("stroke-width", (d) -> Math.sqrt d.value)
      .attr("x1", (d) -> d.source.x)
      .attr("y1", (d) -> d.source.y)
      .attr("x2", (d) -> d.target.x)
      .attr("y2", (d) -> d.target.y)
      .attr("marker-end", "url(#arrowhead)")

    node = vis.selectAll("circle.node")
      .data(json.nodes)
      .enter()
      .append("svg:circle")
      .attr("class", "node")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)
      .attr("r", 5)
      .style("fill", (d) -> fill d.group)
      .on("dblclick", (d) ->
        $(div).parents('.page').nextAll().remove()
        wiki.doInternalLink "#{d.name} Box")
      .call(force.drag)
    node.append("svg:title").text((d, i) -> d.name)

    vis
      .style("opacity", 1e-6)
      .transition()
      .duration(1000)
      .style("opacity", 1)

    force.on "tick", ->
      link
        .attr("x1", (d) -> d.source.x)
        .attr("y1", (d) -> d.source.y)
        .attr("x2", (d) -> d.target.x)
        .attr("y2", (d) -> d.target.y)
      node
        .attr("cx", (d) -> d.x)
        .attr("cy", (d) -> d.y)
