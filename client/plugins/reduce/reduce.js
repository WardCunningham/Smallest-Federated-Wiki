(function() {
  var bind, code, compile, emit, emitrow, find, format, generate, parse, performMethod, performTitle, prefetch, recalculate,
    __slice = [].slice;

  parse = function(text) {
    var line, program, words, _i, _len, _ref;
    program = {};
    _ref = text.split(/\n/);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      words = line.match(/\S+/g);
      if (words === null || words.length < 1) {

      } else if (words[0] === 'FOLD') {
        program.find = words.slice(1, 1000).join(' ');
      } else if (words[0] === 'WATCH') {
        program.watch = words.slice(1, 1000).join(' ');
      } else if (words[0] === 'SLIDE') {
        program.slide = words.slice(1, 1000).join(' ');
      } else {
        program.error = {
          line: line,
          message: "can't make sense of line"
        };
      }
    }
    return program;
  };

  find = function(program, page) {
    var item, link, links, parsing, titles, _i, _j, _len, _len1, _ref;
    titles = [];
    if (program.find) {
      _ref = page.story;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (item.type === 'pagefold') {
          parsing = item.text === program.find;
        } else if (parsing && item.type === 'paragraph') {
          if (links = item.text.match(/\[\[.*?\]\]/g)) {
            for (_j = 0, _len1 = links.length; _j < _len1; _j++) {
              link = links[_j];
              titles.push({
                title: link.substr(2, link.length - 4)
              });
            }
          }
        }
      }
    }
    return titles;
  };

  format = function(program, titles) {
    var rows, title, _i, _len;
    rows = [];
    if (program.error) {
      rows.push("<tr><td><p class=\"error\">" + program.error.line + " <span title=\"" + program.error.message + "\">*");
    }
    for (_i = 0, _len = titles.length; _i < _len; _i++) {
      title = titles[_i];
      rows.push("<tr><td>" + title.title + "<td style=\"text-align:right;\">50");
    }
    return rows.join("\n");
  };

  emitrow = function(context, label, funct) {
    if (label) {
      context.vars[label] = context.ops.length;
    }
    return context.ops.push("" + (label || '') + "\t" + (funct || ''));
  };

  generate = function(context, text) {
    var args, line, loc, _i, _len, _ref, _results;
    loc = context.ops.length + 1;
    _ref = text.split(/\n/);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      line = _ref[_i];
      console.log(line, context);
      if (args = line.match(/^([0-9.eE-]+) +([\w \/%(){},&-]+)$/)) {
        _results.push(emitrow(context, args[2], args[1]));
      } else if (args = line.match(/^([A-Z]+) +([\w \/%(){},&-]+)$/)) {
        emitrow(context, args[2], "=" + args[1] + "(B" + loc + ":B" + context.ops.length + ")");
        _results.push(loc = context.ops.length);
      } else if (args = line.match(/^([A-Z]+)$/)) {
        emitrow(context, null, "=" + args[1] + "(B" + loc + ":B" + context.ops.length + ")");
        _results.push(loc = context.ops.length);
      } else if (args = line.match(/^([0-9\.eE-]+)$/)) {
        _results.push(emitrow(context, null, args[1]));
      } else if (args = line.match(/^ *([\w \/%(){},&-]+)$/)) {
        _results.push(emitrow(context, args[1], "=B" + (context.vars[args[1]] + 1)));
      } else {
        _results.push(emitrow(context, "can't parse '" + line + "'"));
      }
    }
    return _results;
  };

  compile = function(program, titles, done) {
    var fetch, title;
    fetch = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = titles.length; _i < _len; _i++) {
        title = titles[_i];
        _results.push($.getJSON("/" + (wiki.asSlug(title.title)) + ".json"));
      }
      return _results;
    })();
    return $.when.apply($, fetch).then(function() {
      var context, item, xhr, xhrs, _i, _j, _len, _len1, _ref;
      xhrs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      context = {
        ops: [],
        vars: {}
      };
      if (program.slide) {
        emitrow(context, program.slide, 50);
      }
      for (_i = 0, _len = xhrs.length; _i < _len; _i++) {
        xhr = xhrs[_i];
        emitrow(context);
        emitrow(context, xhr[0].title);
        _ref = xhr[0].story;
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          item = _ref[_j];
          switch (item.type) {
            case 'method':
              generate(context, item.text);
          }
        }
      }
      console.log(context);
      return done(context.ops.join("\n"));
    });
  };

  code = function($item, item, done) {
    var page, program, titles;
    program = parse(item.text);
    page = $item.parents('.page').data('data');
    titles = find(program, page);
    return compile(program, titles, done);
  };

  prefetch = function(titles, done) {
    var fetch, title;
    fetch = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = titles.length; _i < _len; _i++) {
        title = titles[_i];
        _results.push($.getJSON("/" + (wiki.asSlug(title.title)) + ".json"));
      }
      return _results;
    })();
    return $.when.apply($, fetch).then(function() {
      var i, item, xhr, xhrs, _i, _j, _len, _ref, _ref1;
      xhrs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (i = _i = 0, _ref = titles.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        title = titles[i];
        xhr = xhrs[i];
        title.items = [];
        _ref1 = xhr[0].story;
        for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
          item = _ref1[_j];
          switch (item.type) {
            case 'method':
              title.items.push(item);
          }
        }
      }
      return done(titles);
    });
  };

  performMethod = function(state, done) {
    if (state.methods.length > 0) {
      return state.plugin["eval"](state, state.methods.shift(), state.input, function(state, output) {
        state.output = output;
        _.extend(state.input, output);
        return performMethod(state, done);
      });
    } else {
      return done(state);
    }
  };

  performTitle = function(state, done) {
    var item;
    if (state.titles.length > 0) {
      state.methods = (function() {
        var _i, _len, _ref, _results;
        _ref = state.titles[0].items;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          _results.push(item);
        }
        return _results;
      })();
      return performMethod(state, function(state) {
        var value;
        value = state.input[state.program.watch || state.program.slide];
        state.titles[0].row.find('td:last').text(value.toFixed(2));
        state.titles.shift();
        return performTitle(state, done);
      });
    } else {
      return done(state);
    }
  };

  recalculate = function(program, input, titles, done) {
    return wiki.getPlugin('method', function(plugin) {
      var state, t;
      state = {
        program: program,
        plugin: plugin,
        input: input,
        titles: (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = titles.length; _i < _len; _i++) {
            t = titles[_i];
            _results.push(t);
          }
          return _results;
        })(),
        errors: []
      };
      return performTitle(state, done);
    });
  };

  emit = function($item, item) {
    var candidates, elem, input, nominal, output, page, program, row, sign, slider, title, titles, _i, _j, _len, _len1;
    program = parse(item.text);
    page = $item.parents('.page').data('data');
    titles = find(program, page);
    input = {};
    output = {};
    candidates = $(".item:lt(" + ($('.item').index($item)) + ")");
    for (_i = 0, _len = candidates.length; _i < _len; _i++) {
      elem = candidates[_i];
      elem = $(elem);
      if (elem.hasClass('radar-source')) {
        _.extend(input, elem.get(0).radarData());
      } else if (elem.hasClass('data')) {
        _.extend(input, elem.data('item').data[0]);
      }
    }
    $item.append((slider = $('<div class=slider />')));
    if (program.slide) {
      nominal = output[program.slide] = +input[program.slide] || 50;
      sign = nominal < 0 ? -1 : 1;
      $item.addClass('radar-source');
      $item.get(0).radarData = function() {
        return output;
      };
      slider.slider({
        animate: 'fast',
        value: Math.abs(nominal),
        max: Math.abs(nominal) * 2,
        slide: function(event, ui) {
          var value;
          input[program.slide] = output[program.slide] = value = ui.value * sign;
          $item.find('tr:first td:last').text(value);
          return recalculate(program, input, titles, function() {
            return $item.trigger('thumb', ui.value * sign);
          });
        }
      });
    }
    $item.append("<table style=\"width:100%; background:#eee; padding:.8em; margin-bottom:5px;\">\n  <tr><td>" + program.slide + "<td style=\"text-align:right;\">" + nominal + "\n</table>");
    for (_j = 0, _len1 = titles.length; _j < _len1; _j++) {
      title = titles[_j];
      title.row = row = $("<tr><td>" + title.title + "<td style=\"text-align:right;\">");
      $item.find('table').append(title.row);
    }
    return prefetch(titles, function(titles) {
      input[program.slide] = nominal;
      return recalculate(program, input, titles, function() {
        return console.log('emit/prefetch/recalculate complete');
      });
    });
  };

  bind = function($item, item) {
    $item.find('table').dblclick(function() {
      return wiki.textEditor($item, item);
    });
    return $item.find('.slider').dblclick(function() {
      return code($item, item, function(formula) {
        return wiki.dialog("Slider Computation", "<pre>" + formula + "</pre>");
      });
    });
  };

  window.plugins.reduce = {
    emit: emit,
    bind: bind
  };

}).call(this);
