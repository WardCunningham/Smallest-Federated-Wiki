(function() {
  var annotate, asValue, avg, dispatch, print, round, sum;

  asValue = function(obj) {
    if (obj == null) {
      return NaN;
    }
    switch (obj.constructor) {
      case Number:
        return obj;
      case String:
        return +obj;
      case Array:
        return asValue(obj[0]);
      case Object:
        return asValue(obj.value);
      case Function:
        return obj();
      default:
        return NaN;
    }
  };

  sum = function(v) {
    return _.reduce(v, function(s, n) {
      return s += n;
    }, 0);
  };

  avg = function(v) {
    return sum(v) / v.length;
  };

  round = function(n) {
    if (n == null) {
      return '?';
    }
    if (n.toString().match(/\.\d\d\d/)) {
      return n.toFixed(2);
    } else {
      return n;
    }
  };

  annotate = function(text) {
    if (text == null) {
      return '';
    }
    return " <span title=\"" + text + "\">*</span>";
  };

  print = function(report, value, hover, line, comment, color) {
    var long;
    if (report == null) {
      return;
    }
    long = '';
    if (line.length > 40) {
      long = line;
      line = "" + (line.substr(0, 20)) + " ... " + (line.substr(-15));
    }
    return report.push("<tr style=\"background:" + color + ";\">\n  <td style=\"width: 20%; text-align: right;\" title=\"" + (hover || '') + "\">\n    <b>" + (round(value)) + "</b>\n  <td title=\"" + long + "\">" + line + (annotate(comment)) + "</td>");
  };

  dispatch = function(state, done) {
    var apply, args, attach, change, color, comment, count, err, hover, input, line, list, lookup, output, polynomial, previous, result, s, v, value, _ref, _ref1;
    state.list || (state.list = []);
    state.lines || (state.lines = state.item.text.split("\n"));
    line = state.lines.shift();
    if (line == null) {
      return done(state);
    }
    attach = function(search) {
      var elem, source, _i, _len, _ref;
      _ref = wiki.getDataNodes(state.div);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if ((source = $(elem).data('item')).text.indexOf(search) >= 0) {
          return source.data;
        }
      }
      throw new Error("can't find dataset with caption " + search);
    };
    lookup = function(v) {
      var row, table;
      table = attach('Tier3ExposurePercentages');
      if (isNaN(v[0])) {
        return NaN;
      }
      if (isNaN(v[1])) {
        return NaN;
      }
      row = _.find(table, function(row) {
        return asValue(row.Exposure) === v[0] && asValue(row.Raw) === v[1];
      });
      if (row == null) {
        throw new Error("can't find exposure " + v[0] + " and raw " + v[1]);
      }
      return asValue(row.Percentage);
    };
    polynomial = function(v, subtype) {
      var result, row, table;
      table = attach('Tier3Polynomials');
      row = _.find(table, function(row) {
        return ("" + row.SubType + " Scaled") === subtype && asValue(row.Min) <= v && asValue(row.Max) > v;
      });
      if (row == null) {
        throw new Error("can't find applicable polynomial for " + v + " in '" + subtype + "'");
      }
      result = asValue(row.C0);
      result += asValue(row.C1) * v;
      result += asValue(row.C2) * Math.pow(v, 2);
      result += asValue(row.C3) * Math.pow(v, 3);
      result += asValue(row.C4) * Math.pow(v, 4);
      result += asValue(row.C5) * Math.pow(v, 5);
      result += asValue(row.C6) * Math.pow(v, 6);
      if (asValue(row['One minus'])) {
        result = 1 - result;
      }
      return Math.min(1, Math.max(0, result));
    };
    apply = function(name, list, label) {
      switch (name) {
        case 'SUM':
          return sum(list);
        case 'AVG':
        case 'AVERAGE':
          return avg(list);
        case 'MIN':
        case 'MINIMUM':
          return _.min(list);
        case 'MAX':
        case 'MAXIMUM':
          return _.max(list);
        case 'RATIO':
          return list[0] / list[1];
        case 'ACCUMULATE':
          return (sum(list)) + (output[label] || input[label] || 0);
        case 'FIRST':
          return list[0];
        case 'PRODUCT':
          return _.reduce(list, function(p, n) {
            return p *= n;
          });
        case 'LOOKUP':
          return lookup(list);
        case 'POLYNOMIAL':
          return polynomial(list[0], label);
        default:
          throw new Error("don't know how to " + name);
      }
    };
    color = '#eee';
    value = comment = hover = null;
    input = state.input;
    output = state.output;
    list = state.list;
    try {
      if (args = line.match(/^([0-9.eE-]+) +([\w \/%(){},&-]+)$/)) {
        result = +args[1];
        line = args[2];
        output[line] = value = result;
      } else if (args = line.match(/^([A-Z]+) +([\w \/%(){},&-]+)$/)) {
        _ref = [apply(args[1], list, args[2]), [], list.length], value = _ref[0], list = _ref[1], count = _ref[2];
        color = '#ddd';
        hover = "" + args[1] + " of " + count + " numbers\n= " + value;
        line = args[2];
        if (((output[line] != null) || (input[line] != null)) && !state.item.silent) {
          previous = asValue(output[line] || input[line]);
          if (Math.abs(change = value / previous - 1) > 0.0001) {
            comment = "previously " + previous + "\nΔ " + (round(change * 100)) + "%";
          }
        }
        output[line] = value;
        if ((s = state.item.checks) && (v = s[line]) !== void 0) {
          if (asValue(v).toFixed(4) !== value.toFixed(4)) {
            color = '#faa';
            line += " != " + (asValue(v).toFixed(4));
            if (state.caller) {
              state.caller.errors.push({
                message: line
              });
            }
          }
        }
      } else if (args = line.match(/^([A-Z]+)$/)) {
        _ref1 = [apply(args[1], list), [], list.length], value = _ref1[0], list = _ref1[1], count = _ref1[2];
        color = '#ddd';
        hover = "" + args[1] + " of " + count + " numbers\n= " + value;
      } else if (line.match(/^[0-9\.eE-]+$/)) {
        value = +line;
        line = '';
      } else if (args = line.match(/^ *([\w \/%(){},&-]+)$/)) {
        if (output[args[1]] != null) {
          value = output[args[1]];
        } else if (input[args[1]] != null) {
          value = asValue(input[args[1]]);
        } else {
          color = '#edd';
          comment = "can't find value of '" + line + "'";
        }
      } else {
        color = '#edd';
        comment = "can't parse '" + line + "'";
      }
    } catch (_error) {
      err = _error;
      color = '#edd';
      value = null;
      comment = err.message;
    }
    if ((state.caller != null) && color === '#edd') {
      state.caller.errors.push({
        message: comment
      });
    }
    state.list = list;
    if ((value != null) && !isNaN(+value)) {
      state.list.push(+value);
    }
    print(state.report, value, hover, line, comment, color);
    return dispatch(state, done);
  };

  window.plugins.method = {
    bind: function(div, item) {},
    emit: function(div, item, done) {
      var candidates, elem, input, output, state, _i, _len;
      input = {};
      output = {};
      candidates = $(".item:lt(" + ($('.item').index(div)) + ")");
      for (_i = 0, _len = candidates.length; _i < _len; _i++) {
        elem = candidates[_i];
        elem = $(elem);
        if (elem.hasClass('radar-source')) {
          _.extend(input, elem.get(0).radarData());
        } else if (elem.hasClass('data')) {
          _.extend(input, elem.data('item').data[0]);
        }
      }
      div.addClass('radar-source');
      div.get(0).radarData = function() {
        return output;
      };
      div.mousemove(function(e) {
        if ($(e.target).is('td')) {
          return $(div).triggerHandler('thumb', $(e.target).text());
        }
      });
      div.dblclick(function(e) {
        if (e.shiftKey) {
          return wiki.dialog("JSON for Method plugin", $('<pre/>').text(JSON.stringify(item, null, 2)));
        } else {
          return wiki.textEditor(state.div, state.item);
        }
      });
      state = {
        div: div,
        item: item,
        input: input,
        output: output,
        report: []
      };
      return dispatch(state, function(state, output) {
        var table, text;
        text = state.report.join("\n");
        table = $('<table style="width:100%; background:#eee; padding:.8em; margin-bottom:5px;"/>').html(text);
        state.div.append(table);
        return setTimeout(done, 10);
      });
    },
    "eval": function(caller, item, input, done) {
      var state;
      state = {
        caller: caller,
        item: item,
        input: input,
        output: {}
      };
      return dispatch(state, function(state, input) {
        return done(state.caller, state.output);
      });
    }
  };

}).call(this);
