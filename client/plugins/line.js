(function() {

  window.plugins.line = {
    emit: function(div, item) {
      wiki.getScript('/js/d3/d3.js');
      return div.append('<style>\nsvg {\n  font: 10px sans-serif;\n}\n\n.rule line {\n  stroke: #eee;\n  shape-rendering: crispEdges;\n}\n\n.rule line.axis {\n  stroke: #000;\n}\n\n.line {\n  fill: none;\n  stroke: steelblue;\n  stroke-width: 1.5px;\n}\n\ncircle.line {\n  fill: #fff;\n}\n</style>');
    },
    bind: function(div, item) {
      var data, extent, h, p, series, start, vis, w, x, xrules, y, yrules;
      series = wiki.getData();
      data = (start = series[0][0]) > 1000000000000 ? (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = series.length; _i < _len; _i++) {
          p = series[_i];
          _results.push({
            x: (p[0] - start) / 24 / 3600 / 1000,
            y: p[1]
          });
        }
        return _results;
      })() : start > 1000000000 ? (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = series.length; _i < _len; _i++) {
          p = series[_i];
          _results.push({
            x: (p[0] - start) / 24 / 3600,
            y: p[1]
          });
        }
        return _results;
      })() : (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = series.length; _i < _len; _i++) {
          p = series[_i];
          _results.push({
            x: p[0],
            y: p[1]
          });
        }
        return _results;
      })();
      extent = function(f) {
        var hi, lo, step, _ref;
        _ref = [d3.min(data, f), d3.max(data, f)], lo = _ref[0], hi = _ref[1];
        step = Math.pow(10, Math.floor(Math.log(hi - lo) / Math.log(10)));
        return [step * Math.floor(lo / step), step * Math.ceil(hi / step)];
      };
      w = 380;
      h = 275;
      p = 40;
      x = d3.scale.linear().domain(extent(function(p) {
        return p.x;
      })).range([0, w]);
      y = d3.scale.linear().domain(extent(function(p) {
        return p.y;
      })).range([h, 0]);
      vis = d3.select(div.get(0)).data([data]).append("svg:svg").attr("width", w + p * 2).attr("height", h + p * 2).append("svg:g").attr("transform", "translate(" + p + "," + p + ")");
      xrules = vis.selectAll("g.xrule").data(x.ticks(10)).enter().append("svg:g").attr("class", "rule");
      xrules.append("svg:line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", h - 1);
      xrules.append("svg:text").attr("x", x).attr("y", h + 3).attr("dy", ".71em").attr("text-anchor", "middle").text(x.tickFormat(10));
      yrules = vis.selectAll("g.yrule").data(y.ticks(10)).enter().append("svg:g").attr("class", "rule");
      yrules.append("svg:line").attr("class", function(d) {
        if (d) {
          return null;
        } else {
          return "axis";
        }
      }).attr("y1", y).attr("y2", y).attr("x1", 0).attr("x2", w + 1);
      yrules.append("svg:text").attr("y", y).attr("x", -3).attr("dy", ".35em").attr("text-anchor", "end").text(y.tickFormat(10));
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
