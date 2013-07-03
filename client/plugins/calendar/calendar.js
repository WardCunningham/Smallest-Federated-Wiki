(function() {
  var apply, bind, emit, format, months, parse, show, span, spans;

  months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  spans = ['EARLY', 'LATE', 'DECADE', 'DAY', 'MONTH', 'YEAR'];

  span = function(result, span) {
    var m;
    if ((m = spans.indexOf(result.span)) < 0) {
      return result.span = span;
    } else if ((spans.indexOf(span)) < m) {
      return result.span = span;
    }
  };

  parse = function(text) {
    var i, line, m, result, rows, word, words, _i, _j, _len, _len1, _ref;
    rows = [];
    _ref = text.split(/\n/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      result = {};
      words = line.match(/\S+/g);
      for (i = _j = 0, _len1 = words.length; _j < _len1; i = ++_j) {
        word = words[i];
        if (word.match(/^\d\d\d\d$/)) {
          result.year = +word;
          span(result, 'YEAR');
        } else if (m = word.match(/^(\d0)S$/)) {
          result.year = +m[1] + 1900;
          span(result, 'DECADE');
        } else if ((m = spans.indexOf(word)) >= 0) {
          result.span = spans[m];
        } else if ((m = months.indexOf(word.slice(0, 3))) >= 0) {
          result.month = m + 1;
          span(result, 'MONTH');
        } else if (m = word.match(/^([1-3]?[0-9])$/)) {
          result.day = +m[1];
          span(result, 'DAY');
        } else {
          result.label = words.slice(i, 1000).join(' ');
          break;
        }
      }
      rows.push(result);
    }
    return rows;
  };

  apply = function(input, output, date, rows) {
    var result, row, _i, _len, _ref, _ref1;
    result = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      if (((_ref = input[row.label]) != null ? _ref.date : void 0) != null) {
        date = input[row.label].date;
      }
      if (((_ref1 = output[row.label]) != null ? _ref1.date : void 0) != null) {
        date = output[row.label].date;
      }
      if (row.year != null) {
        date = new Date(row.year, 1 - 1);
      }
      if (row.month != null) {
        date = new Date(date.getYear() + 1900, row.month - 1);
      }
      if (row.day != null) {
        date = new Date(date.getYear() + 1900, date.getMonth(), row.day);
      }
      if (row.label != null) {
        output[row.label] = {
          date: date
        };
        if (row.span != null) {
          output[row.label].span = row.span;
        }
      }
      row.date = date;
      result.push(row);
    }
    return result;
  };

  show = function(date, span) {
    switch (span) {
      case 'YEAR':
        return date.getFullYear();
      case 'DECADE':
        return "" + (date.getFullYear()) + "'S";
      case 'EARLY':
        return "Early " + (date.getFullYear()) + "'S";
      case 'LATE':
        return "Late " + (date.getFullYear()) + "'S";
      case 'MONTH':
        return "" + months[date.getMonth()] + " " + (date.getFullYear());
      default:
        return "" + (date.getDate()) + " " + months[date.getMonth()] + " " + (date.getFullYear());
    }
  };

  format = function(rows) {
    var row, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      _results.push("<tr><td>" + (show(row.date, row.span)) + "<td>" + row.label);
    }
    return _results;
  };

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {
      parse: parse,
      apply: apply,
      format: format
    };
  }

  emit = function(div, item) {
    var results, rows;
    rows = parse(item.text);
    wiki.log('calendar rows', rows);
    results = apply({}, {}, new Date(), rows);
    wiki.log('calendar results', results);
    return div.append("<table style=\"width:100%; background:#eee; padding:.8em; margin-bottom:5px;\">" + (format(results).join('')) + "</table>");
  };

  bind = function(div, item) {
    return div.dblclick(function() {
      return wiki.textEditor(div, item);
    });
  };

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.calendar = {
      emit: emit,
      bind: bind
    };
  }

}).call(this);
