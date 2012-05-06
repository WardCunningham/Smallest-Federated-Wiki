(function() {

  window.plugins.metabolism = {
    emit: function(div, item) {},
    bind: function(div, item) {
      var annotate, attach, avg, calculate, data, input, query, round, sum, table, text;
      data = [];
      input = {};
      attach = function(s) {
        data = _.select(wiki.getData(), function(row) {
          return row.Activity != null;
        });
        if (data == null) throw "can't find data";
      };
      query = function(s) {
        var choices, k, keys, n, _i, _len;
        keys = $.trim(s).split(' ');
        choices = data;
        for (_i = 0, _len = keys.length; _i < _len; _i++) {
          k = keys[_i];
          if (k === ' ') next;
          n = choices.length;
          choices = _.select(choices, function(row) {
            return row.Activity.indexOf(k) >= 0 || row.Category.indexOf(k) >= 0;
          });
          if (choices.length === 0) {
            throw new Error("Can't find " + k + " in remaining " + n + " choices");
          }
        }
        return choices;
      };
      sum = function(v) {
        return _.reduce(v, function(s, n) {
          return s += n;
        });
      };
      avg = function(v) {
        return sum(v) / v.length;
      };
      round = function(n) {
        if (n == null) return '?';
        if (n.toString().match(/\.\d\d\d/)) {
          return n.toFixed(2);
        } else {
          return n;
        }
      };
      annotate = function(text) {
        if (text == null) return '';
        return " <span title=\"" + text + "\">*</span>";
      };
      calculate = function(item) {
        var allocated, args, color, comment, hours, line, list, result, row, value, _i, _len, _ref, _ref2, _ref3, _results;
        list = [];
        allocated = 0;
        _ref = item.text.split("\n");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          line = _ref[_i];
          color = '#eee';
          value = comment = null;
          hours = '';
          try {
            if (args = line.match(/^USE ([\w ]+)$/)) {
              color = '#ddd';
              value = ' ';
              attach(line = args[1]);
            } else if (args = line.match(/^([0-9.]+) ([\w ]+)$/)) {
              allocated += hours = +args[1];
              result = query(line = args[2]);
              value = (input = result[0]).MET * hours;
              if (result.length > 1) {
                comment = ((function() {
                  var _j, _len2, _results2;
                  _results2 = [];
                  for (_j = 0, _len2 = result.length; _j < _len2; _j++) {
                    row = result[_j];
                    _results2.push("" + row.Category + " (" + row.MET + "): " + row.Activity);
                  }
                  return _results2;
                })()).join("\n\n");
              }
            } else if (input[line] != null) {
              value = input[line];
              comment = input["" + line + " Assumptions"] || null;
            } else if (line.match(/^[0-9\.-]+$/)) {
              value = +line;
            } else if (line === 'REMAINDER') {
              value = 24 - allocated;
              allocated += value;
            } else if (line === 'SUM') {
              color = '#ddd';
              _ref2 = [sum(list), []], value = _ref2[0], list = _ref2[1];
            } else if (line === 'AVG') {
              color = '#ddd';
              _ref3 = [avg(list), []], value = _ref3[0], list = _ref3[1];
            } else {
              color = '#edd';
            }
          } catch (err) {
            color = '#edd';
            value = null;
            comment = err.message;
          }
          if ((value != null) && !isNaN(+value)) list.push(+value);
          _results.push("<tr style=\"background:" + color + ";\"><td style=\"width: 70%;\">" + line + (annotate(comment)) + "<td>" + hours + "<td><b>" + (round(value)) + "</b>");
        }
        return _results;
      };
      text = calculate(item).join("\n");
      table = $('<table style="width:100%; background:#eee; padding:.8em;"/>').html(text);
      div.append(table);
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };

}).call(this);
