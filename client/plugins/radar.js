(function() {

  window.plugins.radar = {
    bind: function(div, item) {},
    emit: function(div, item) {
      return wiki.getScript('/js/d3/d3.js', function() {
        return wiki.getScript('/js/d3/d3.time.js', function() {
          var angle, c, centerXPos, centerYPos, circleAxes, circleConstraint, colorSelector, comments, d, data, dimension, fill, h, heightCircleConstraint, hours, idx, keys, lastThumb, limit, lineAxes, m, maxVal, minVal, percents, radialTicks, radius, radiusLength, rotate, ruleColor, series, translate, value, viz, vizBody, vizPadding, w, who, widthCircleConstraint, _i, _ref, _ref2, _ref3, _results;
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
          value = function(obj) {
            if (obj == null) return NaN;
            switch (obj.constructor) {
              case Number:
                return obj;
              case String:
                return +obj;
              case Array:
                return value(obj[0]);
              case Object:
                return value(obj.value);
              case Function:
                return obj();
              default:
                return NaN;
            }
          };
          percents = function(obj) {
            var k, _i, _len, _ref, _results;
            _ref = keys.concat(keys[0]);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              k = _ref[_i];
              _results.push(100.0 * value(obj[k]) / limit[k]);
            }
            return _results;
          };
          idx = $('.item').index(div);
          who = $(".item:lt(" + idx + ")").filter('.data');
          data = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = who.length; _i < _len; _i++) {
              d = who[_i];
              _results.push($(d).data('item').data[0]);
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
          angle = function(i) {
            return (i / dimension) * 2 * Math.PI;
          };
          rotate = function(i) {
            return "rotate(" + ((i / dimension * 360) - 90) + ")";
          };
          translate = function(percent) {
            return "translate(" + (radius(maxVal * percent / 100)) + ")";
          };
          series = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = data.length; _i < _len; _i++) {
              d = data[_i];
              _results.push(percents(d));
            }
            return _results;
          })();
          comments = [];
          for (m = 0, _ref = data.length - 1; 0 <= _ref ? m <= _ref : m >= _ref; 0 <= _ref ? m++ : m--) {
            for (d = 0, _ref2 = dimension - 1; 0 <= _ref2 ? d <= _ref2 : d >= _ref2; 0 <= _ref2 ? d++ : d--) {
              if ((c = data[m][keys[d]].comment) != null) {
                comments.push({
                  material: m,
                  dimension: d,
                  comment: c
                });
              }
            }
          }
          hours = (function() {
            _results = [];
            for (var _i = 0, _ref3 = dimension - 1; 0 <= _ref3 ? _i <= _ref3 : _i >= _ref3; 0 <= _ref3 ? _i++ : _i--){ _results.push(_i); }
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
          vizBody.attr("transform", ("translate(" + centerXPos + "," + centerYPos + ")") + rotate(0));
          lastThumb = null;
          who.bind('thumb', function(e, thumb) {
            var index;
            if (thumb === lastThumb || -1 === (index = keys.indexOf(lastThumb = thumb))) {
              return;
            }
            return vizBody.transition().duration(750).attr("transform", ("translate(" + centerXPos + "," + centerYPos + ")") + rotate(-index));
          });
          radialTicks = radius.ticks(5);
          circleAxes = vizBody.selectAll(".circle-ticks").data(radialTicks).enter().append("svg:g").attr("class", "circle-ticks");
          circleAxes.append("svg:circle").attr("r", function(d, i) {
            return radius(d);
          }).attr("class", "circle").style("stroke", ruleColor).style("fill", "none");
          circleAxes.append("svg:text").attr("text-anchor", "end").style("stroke", ruleColor).attr("dy", function(d) {
            return -1 * radius(d);
          }).text(String);
          lineAxes = vizBody.selectAll(".line-ticks").data(hours).enter().append("svg:g").attr("transform", function(d, i) {
            return rotate(i) + translate(100);
          }).attr("class", "line-ticks");
          lineAxes.append("svg:line").attr("x2", -1 * radius(maxVal)).style("stroke", ruleColor).style("fill", "none");
          lineAxes.append("svg:text").text(function(d, i) {
            return keys[i];
          }).attr("text-anchor", "start").style("stroke", ruleColor).style("cursor", 'pointer').attr("transform", "rotate(180)").on("click", function(d) {
            $(div).parents('.page').nextAll().remove();
            return wiki.doInternalLink(keys[d]);
          });
          fill = d3.scale.category10();
          colorSelector = function(d, i) {
            return fill(i);
          };
          vizBody.selectAll(".series").data(series).enter().append("svg:g").attr("class", "series").append("svg:path").attr("class", "line").style("fill", colorSelector).style("stroke", colorSelector).style("stroke-width", 3).style("fill-opacity", .1).style("fill", colorSelector).attr("d", d3.svg.line.radial().radius(function(d) {
            return radius(d);
          }).angle(function(d, i) {
            return angle(i);
          })).append("svg:title").text(function(d, i) {
            return data[i]["Material name"];
          });
          return vizBody.selectAll(".comments").data(comments).enter().append("svg:g").attr("class", "comments").append("svg:text").style("font-size", "40px").style("fill", colorSelector).attr("text-anchor", "mid").attr("transform", function(d) {
            var percent;
            percent = series[d.material][d.dimension];
            return rotate(d.dimension) + translate(percent);
          }).text('*').append("svg:title").text(function(d) {
            return d.comment;
          });
        });
      });
    }
  };

}).call(this);
