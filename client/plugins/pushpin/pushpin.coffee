w = 426 
h = 300

fy = "FY09"       # [ 'FY05', 'FY06', 'FY07', 'FY08', 'FY09' ]
region = "N ASIA" # [ 'N ASIA', 'S ASIA', 'AMERICAS', 'EMEA' ]
brand = "NIKE"    # [ 'AFFILIATE', 'NIKE' ]
bu = "APRL"       # [ 'EQUIP', 'FTWR', 'APRL', '_NA' ]s

display = (div, item, vis, collection, locations, factories) ->

  # Use a map projection to scale lat/lng data
  xy = d3.geo.mercator().scale(2500).translate([-600, 350])
  path = d3.geo.path().projection(xy)
  fill = d3.scale.category20()

  countries = {}

  factories = factories.filter (o) ->
    o.fy is fy and
    o.region is region and
    o.brand is brand and
    o.bu is bu

  factories = factories.map (f) ->
    f.coordinates = []
    f.coordinates[0] = locations[f.country].location.lng
    f.coordinates[1] = locations[f.country].location.lat
    # Set starting position
    f.x = 0
    f.y = 0
    # Set destination position for the circle
    f.fx = xy(f.coordinates)[0]
    f.fy = xy(f.coordinates)[1]
    # Build hash of country coordinates for future use.
    countries[f.country] = xy(f.coordinates)
    f

  # Create force layout to give sense of charge.
  force = d3.layout.force()
    .nodes(factories)
    .links([])
    .size([w, h])
    .friction(.75)
    .charge(-4)
    .start()

  # Create the paths for countries

  states = vis.append("svg:g")
    .attr("id", "states")

  states.selectAll("path")
    .data(collection.features)
    .enter()
    .append("svg:path")
    .attr("d", path)
    .append("title")
    .text (d) -> d.properties.name

  # Create the marks for factories
  # Get nodes that are entering stage.
  # Set attributes on entering nodes.

  node = vis.selectAll("circle.node")
    .data(factories)
    .enter()
    .append("svg:circle")
    .attr("opacity", 0)
    .attr("class", "node")
    .attr("cx", (d) -> d.x )
    .attr("cy", (d) -> d.y )
    .attr("r", 3)
    .attr("title", (d) -> d.crcode )
    .style("fill", (d, i) -> d3.rgb(fill(d.country)).darker Math.random() )
    .call(force.drag)
    .transition()
    .duration(900)
    .attr("opacity", 1)

  force.on "tick", (e) ->
    # Push nodes toward their designated focus.
    k = .3 * e.alpha
    factories.forEach (o, i) ->
      # Push nodes towards location set above.
      o.y += (o.fy - o.y) * k
      o.x += (o.fx - o.x) * k
    # Move the marks to new location
    vis.selectAll("circle.node")
      .attr("cx", (d) -> d.x )
      .attr("cy", (d) -> d.y )

window.plugins.pushpin =
  emit: (div, item) ->
    div.append """
      <style type="text/css">
        .pushpin path { fill: #ccc; stroke: #fff; }
        .pushpin svg { border: solid 1px #ccc; background: #eee; }
      </style>
    """

  bind: (div, item) ->
    wiki.getScript '/js/d3/d3.js', ->
      vis = d3.select(div.get(0))
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
      wiki.getScript '/js/d3/d3.geo.js', ->
        wiki.getScript '/js/d3/d3.geom.js', ->
          wiki.getScript '/js/d3/d3.layout.js', ->
            d3.json "/plugins/pushpin/world-countries.json", (collection) ->
              d3.json "/plugins/pushpin/factories-locations.json", (locations) ->
                d3.json "/plugins/pushpin/factories.json", (factories) ->
                  display div, item, vis, collection, locations, factories
