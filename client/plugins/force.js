(function() {

  window.plugins.force = {
    emit: function(div, item) {
      wiki.getScript('/js/d3/d3.js');
      wiki.getScript('/js/d3/d3.geom.js');
      wiki.getScript('/js/d3/d3.layout.js');
      return div.append("<style type=\"text/css\">\n  circle.node {\n    stroke: #fff;\n    stroke-width: 1.5px;\n  }\n\n  line.link {\n    stroke: #999;\n    stroke-opacity: .6;\n  }\n</style>");
    },
    bind: function(div, item) {
      var fill, force, h, json, link, node, vis, w;
      w = 380;
      h = 230;
      fill = d3.scale.category20();
      vis = d3.select(div.get(0)).append("svg:svg").attr("width", w).attr("height", h);
      json = wiki.getData();
      console.log(json);
      force = d3.layout.force().charge(-120).linkDistance(30).nodes(json.nodes).links(json.links).size([w, h]).start();
      link = vis.selectAll("line.link").data(json.links).enter().append("svg:line").attr("class", "link").style("stroke-width", function(d) {
        return Math.sqrt(d.value);
      }).attr("x1", function(d) {
        return d.source.x;
      }).attr("y1", function(d) {
        return d.source.y;
      }).attr("x2", function(d) {
        return d.target.x;
      }).attr("y2", function(d) {
        return d.target.y;
      }).attr("marker-end", "url(#arrowhead)");
      node = vis.selectAll("circle.node").data(json.nodes).enter().append("svg:circle").attr("class", "node").attr("cx", function(d) {
        return d.x;
      }).attr("cy", function(d) {
        return d.y;
      }).attr("r", 5).style("fill", function(d) {
        return fill(d.group);
      }).on("dblclick", function(d) {
        $(div).parents('.page').nextAll().remove();
        return wiki.doInternalLink("" + d.name + " Box");
      }).call(force.drag);
      node.append("svg:title").text(function(d, i) {
        return d.name;
      });
      vis.style("opacity", 1e-6).transition().duration(1000).style("opacity", 1);
      return force.on("tick", function() {
        link.attr("x1", function(d) {
          return d.source.x;
        }).attr("y1", function(d) {
          return d.source.y;
        }).attr("x2", function(d) {
          return d.target.x;
        }).attr("y2", function(d) {
          return d.target.y;
        });
        return node.attr("cx", function(d) {
          return d.x;
        }).attr("cy", function(d) {
          return d.y;
        });
      });
    }
  };

}).call(this);
