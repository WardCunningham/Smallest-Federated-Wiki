(function() {
  var calculate;

  window.plugins.calculator = {
    emit: function(div, item) {
      var pre, text;
      text = calculate(item.text).join("\n");
      pre = $('<pre style="font-size: 16px;"/>').text(text);
      return div.append(pre);
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };

  calculate = function(text) {
    var col, line, sum, sums, _i, _len, _ref, _ref2, _results;
    _ref = [{}, 0], sums = _ref[0], sum = _ref[1];
    _ref2 = text.split("\n");
    _results = [];
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      line = _ref2[_i];
      col = line.split(/\s+/);
      col[0] = col[0].replace(/^[A-Z]+$/, function(x) {
        var _ref3;
        if (!((sums[x] != null) && x !== 'SUM')) {
          _ref3 = [sum, 0], sums[x] = _ref3[0], sum = _ref3[1];
        }
        return sums[x].toFixed(2);
      });
      col[0] = col[0].replace(/^\-?[0-9\.]+$/, function(x) {
        sum = sum + (function() {
          switch (col[1]) {
            case 'CR':
            case 'DB':
              return x / -1;
            case '*':
              return x * col[2];
            case '/':
              return x / col[2];
            default:
              return x / 1;
          }
        })();
        return (x / 1).toFixed(2);
      });
      if (line.match(/^\s*$/)) sum = 0;
      _results.push(col.join(' '));
    }
    return _results;
  };

}).call(this);
