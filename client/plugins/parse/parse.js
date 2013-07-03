(function() {
  var isNumber, nextOp, stats;

  nextOp = function(state) {
    switch (state) {
      case void 0:
        return "Start";
      case "starting":
      case "running":
        return "Stop";
      case "stopped":
      case "finished":
        return "Discard";
    }
  };

  isNumber = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  stats = function(item) {
    var key, rows, value, _i, _len, _ref;
    rows = [];
    _ref = ['state', 'server', 'parsed'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (value = item[key]) {
        if (isNumber(value)) {
          value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        rows.push("<tr><td>" + key + "<td>" + value);
      }
    }
    return rows.join("\n");
  };

  window.plugins.parse = {
    emit: function(div, item) {
      return div.append("<div style=\"background:#eee; padding:.8em; margin-bottom:5px;\">\n  <table></table>\n  <button type=\"button\">" + (nextOp(item.state)) + " Parse</button>\n</div>");
    },
    bind: function(div, item) {
      var $page, assemble, discard, display, host, progress, socket, start, stop, tick;
      div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
      display = function(item) {
        return div.find('table').html(stats(item));
      };
      display(item);
      assemble = function() {
        var idx, peg;
        if (item.state !== void 0) {
          return;
        }
        idx = $('.item').index(div);
        return peg = $(".item:lt(" + idx + ")").filter('.code');
      };
      assemble();
      tick = function() {
        var timer;
        if (item.state !== 'running') {
          return;
        }
        if (item.parsed > 130000000) {
          return stop('finished');
        }
        item.parsed += Math.round(1666666 * Math.random());
        socket.send("counting " + item.parsed);
        display(item);
        return timer = setTimeout(tick, 100);
      };
      start = function() {
        wiki.log("start parse", item);
        return wiki.createItem(null, div, $.extend(true, {}, item, {
          state: "starting",
          parsed: 0
        }));
      };
      stop = function(state) {
        var timer;
        clearTimeout(timer);
        timer = null;
        item.state = state || 'stopped';
        display(item);
        return div.find('button').text("" + (nextOp(item.state)) + " Parse");
      };
      discard = function() {
        if (typeof socket !== "undefined" && socket !== null) {
          socket.close();
        }
        return wiki.removeItem(div, item);
      };
      div.find('button').click(function(event) {
        switch (item.state) {
          case void 0:
            return start();
          case "starting":
          case "running":
            return stop();
          case "stopped":
          case "finished":
            return discard();
        }
      });
      if (item.state === 'starting') {
        $page = div.parents('.page:first');
        host = $page.data('site') || location.host;
        if (host === 'origin' || host === 'local') {
          host = location.host;
        }
        socket = new WebSocket("ws://" + host + "/plugin/parse");
        if (item.state === 'starting') {
          item.state = 'running';
        }
        progress = function(m) {
          item.server = m;
          return display(item);
        };
        socket.onopen = function() {
          progress("opened");
          return tick();
        };
        socket.onmessage = function(e) {
          var action, count, message, _ref;
          _ref = message = JSON.parse(e.data), action = _ref.action, count = _ref.count;
          progress("" + action + " " + count);
          return console.log(message.tally);
        };
        return socket.onclose = function() {
          item.state = "stopped";
          return progress("closed");
        };
      }
    }
  };

}).call(this);
