(function() {

  window.plugins.method = {
    emit: function(div, item) {},
    bind: function(div, item) {
      var annotate, avg, calculate, data, input, round, row, sum, table, text, title, _i, _len;
      title = div.parents('.page:first').find('h1').text().trim();
      data = wiki.getData();
      if (data == null) throw "can't find data";
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        row = data[_i];
        if (row.Material === title) input = row;
      }
      if (input == null) throw "can't find " + title + " in data";
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
        var color, comment, line, list, value, _j, _len2, _ref, _ref2, _ref3, _results;
        list = [];
        _ref = item.text.split("\n");
        _results = [];
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          line = _ref[_j];
          color = '#eee';
          value = comment = null;
          try {
            if (input[line] != null) {
              value = input[line];
              comment = input["" + line + " Assumptions"] || null;
            } else if (line.match(/^[0-9\.-]+$/)) {
              value = +line;
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
          _results.push("<tr style=\"background:" + color + ";\"><td style=\"width: 70%;\">" + line + (annotate(comment)) + "<td><b>" + (round(value)) + "</b>");
        }
        return _results;
      };
      text = calculate(item).join("\n");
      table = $(title + '<table style="width:100%; background:#eee; padding:.8em;"/>').html(text);
      div.append(table);
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };

}).call(this);
