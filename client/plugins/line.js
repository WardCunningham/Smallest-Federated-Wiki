(function() {
  window.plugins.line = {
    emit: function(div, item) {
      wiki.getScript('js/d3/d3.js');
      return div.append('<style>\nsvg {\n  font: 10px sans-serif;\n}\n\n.rule line {\n  stroke: #eee;\n  shape-rendering: crispEdges;\n}\n\n.rule line.axis {\n  stroke: #000;\n}\n\n.line {\n  fill: none;\n  stroke: steelblue;\n  stroke-width: 1.5px;\n}\n\ncircle.line {\n  fill: #fff;\n}\n</style>');
    },
    bind: function(div, item) {
      var data, h, p, rules, series, vis, w, x, y;
      data = d3.range(20).map(function(i) {
        return {
          x: i / 19,
          y: (Math.sin(i / 3) + 1) / 2
        };
      });
      series = wiki.getData();
      data = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = series.length; _i < _len; _i++) {
          p = series[_i];
          _results.push({
            x: (p[0] - series[0][0]) / 3600 / 48 / 1000,
            y: p[1] / 100.0
          });
        }
        return _results;
      })();
      console.log(data);
      w = 380;
      h = 275;
      p = 20;
      x = d3.scale.linear().domain([0, 1]).range([0, w]);
      y = d3.scale.linear().domain([0, 1]).range([h, 0]);
      vis = d3.select(div.get(0)).data([data]).append("svg:svg").attr("width", w + p * 2).attr("height", h + p * 2).append("svg:g").attr("transform", "translate(" + p + "," + p + ")");
      rules = vis.selectAll("g.rule").data(x.ticks(10)).enter().append("svg:g").attr("class", "rule");
      rules.append("svg:line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", h - 1);
      rules.append("svg:line").attr("class", function(d) {
        if (d) {
          return null;
        } else {
          return "axis";
        }
      }).attr("y1", y).attr("y2", y).attr("x1", 0).attr("x2", w + 1);
      rules.append("svg:text").attr("x", x).attr("y", h + 3).attr("dy", ".71em").attr("text-anchor", "middle").text(x.tickFormat(10));
      rules.append("svg:text").attr("y", y).attr("x", -3).attr("dy", ".35em").attr("text-anchor", "end").text(y.tickFormat(10));
      vis.append("svg:path").attr("class", "line").attr("d", d3.svg.line().x(function(d) {
        return x(d.x);
      }).y(function(d) {
        return y(d.y);
      }));
      return vis.selectAll("circle.line").data(data).enter().append("svg:circle").attr("class", "line").attr("cx", function(d) {
        return x(d.x);
      }).attr("cy", function(d) {
        return y(d.y);
      }).attr("r", 3.5);
    }
  };
}).call(this);
