(function() {

  window.plugins.radar = {
    bind: function(div, item) {},
    emit: function(div, item) {
      return wiki.getScript('/js/d3/d3.js', function() {
        return wiki.getScript('/js/d3/d3.time.js', function() {
          var centerXPos, centerYPos, circleAxes, circleConstraint, colorSelector, d, data, dimension, fill, h, heightCircleConstraint, hours, i, keys, limit, lineAxes, maxVal, minVal, percents, radialTicks, radius, radiusLength, ruleColor, series, viz, vizBody, vizPadding, w, widthCircleConstraint, _i, _ref, _results;
          div.append(' <style>\n svg { font: 10px sans-serif; }\n</style>');
          limit = {
            "Carcinogenicity": 7,
            "Acute Toxicity": 7,
            "Chronic Toxicity": 7,
            "Reproductive/Endocrine Disrupter Toxicity": 4,
            "Chemistry Total": 25,
            "Energy Intensity": 10,
            "GHG Emissions Intensity": 15,
            "Energy/GHG Emissions Total": 25,
            "Water Intensity": 18,
            "Land Use Intensity": 7,
            "Water/ Land Use Total": 25,
            "Hazardous Waste": 10,
            "MSW": 6.25,
            "Industrial waste": 5,
            "Recyclable/ Compostable waste": 2.5,
            "Mineral waste": 1.25,
            "Physical Waste Total": 25,
            "Total score": 100
          };
          keys = Object.keys(limit);
          percents = function(obj) {
            var k, _i, _len, _ref, _results;
            _ref = keys.concat(keys[0]);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              k = _ref[_i];
              _results.push(100.0 * obj[k] / limit[k]);
            }
            return _results;
          };
          data = (function() {
            var _i, _len, _ref, _results;
            _ref = wiki.getDataNodes(div).dataDash('data');
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              i = _ref[_i];
              _results.push(i[0]);
            }
            return _results;
          })();
          w = 400;
          h = 400;
          vizPadding = {
            top: 10,
            right: 0,
            bottom: 15,
            left: 0
          };
          dimension = keys.length;
          ruleColor = "#CCC";
          series = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = data.length; _i < _len; _i++) {
              d = data[_i];
              _results.push(percents(d));
            }
            return _results;
          })();
          hours = (function() {
            _results = [];
            for (var _i = 0, _ref = dimension - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
            return _results;
          }).apply(this);
          minVal = 0;
          maxVal = 100;
          viz = d3.select(div.get(0)).append("svg:svg").attr("width", w).attr("height", h).attr("class", "vizSvg");
          vizBody = viz.append("svg:g").attr("id", "body");
          heightCircleConstraint = h - vizPadding.top - vizPadding.bottom;
          widthCircleConstraint = w - vizPadding.left - vizPadding.right;
          circleConstraint = d3.min([heightCircleConstraint, widthCircleConstraint]);
          radius = d3.scale.linear().domain([minVal, maxVal]).range([0, circleConstraint / 2]);
          radiusLength = radius(maxVal);
          centerXPos = widthCircleConstraint / 2 + vizPadding.left;
          centerYPos = heightCircleConstraint / 2 + vizPadding.top;
          vizBody.attr("transform", "translate(" + centerXPos + ", " + centerYPos + ")");
          radialTicks = radius.ticks(5);
          circleAxes = vizBody.selectAll(".circle-ticks").data(radialTicks).enter().append("svg:g").attr("class", "circle-ticks");
          circleAxes.append("svg:circle").attr("r", function(d, i) {
            return radius(d);
          }).attr("class", "circle").style("stroke", ruleColor).style("fill", "none");
          circleAxes.append("svg:text").attr("text-anchor", "end").style("stroke", ruleColor).attr("dy", function(d) {
            return -1 * radius(d);
          }).text(String);
          lineAxes = vizBody.selectAll(".line-ticks").data(hours).enter().append("svg:g").attr("transform", function(d, i) {
            return "rotate(" + ((i / hours.length * 360) - 90) + ")translate(" + radius(maxVal) + ")";
          }).attr("class", "line-ticks");
          lineAxes.append("svg:line").attr("x2", -1 * radius(maxVal)).style("stroke", ruleColor).style("fill", "none");
          lineAxes.append("svg:text").text(function(d, i) {
            return keys[i];
          }).attr("text-anchor", "start").style("stroke", ruleColor).attr("transform", "rotate(180)");
          fill = d3.scale.category10();
          colorSelector = function(d, i) {
            return fill(i);
          };
          return vizBody.selectAll(".series").data(series).enter().append("svg:g").attr("class", "series").append("svg:path").attr("class", "line").style("fill", colorSelector).style("stroke", colorSelector).style("stroke-width", 3).style("fill-opacity", .1).style("fill", colorSelector).attr("d", d3.svg.line.radial().radius(function(d) {
            return radius(d);
          }).angle(function(d, i) {
            return (i / dimension) * 2 * Math.PI;
          })).append("svg:title").text(function(d, i) {
            return data[i]["Material name"];
          });
        });
      });
    }
  };

}).call(this);
