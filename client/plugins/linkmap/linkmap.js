(function() {
  var bind, emit, forceData, linkdata, linkmap, stats;

  linkdata = "{}";

  linkmap = {};

  forceData = function() {
    var div, i, link, links, nodeGroup, nodeNum, nodes, slug, slugs, source, target, _i, _j, _len, _len1, _ref;
    nodes = [];
    links = [];
    nodeNum = {};
    nodeGroup = {};
    _ref = $('.page');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      div = _ref[_i];
      nodeGroup[div.id] = 1;
    }
    for (slug in linkmap) {
      nodeNum[slug] = nodes.length;
      nodes.push({
        name: slug,
        group: nodeGroup[slug] || 3
      });
    }
    for (slug in linkmap) {
      slugs = linkmap[slug];
      source = nodeNum[slug];
      for (i = _j = 0, _len1 = slugs.length; _j < _len1; i = ++_j) {
        link = slugs[i];
        if (i < 4 && ((target = nodeNum[link]) != null)) {
          links.push({
            source: source,
            target: target,
            value: 6
          });
        }
      }
    }
    return {
      nodes: nodes,
      links: links
    };
  };

  stats = function() {
    var force;
    force = forceData();
    return "" + force.nodes.length + " nodes, " + force.links.length + " links";
  };

  emit = function($item, item) {
    $item.css("background-color", "#eee");
    $item.css("padding", 5);
    return $item.append("<p>Starting Linkmap</p>");
  };

  bind = function($item, item) {
    var $page, host, progress, socket;
    $item.addClass('force-source');
    $item.get(0).forceData = forceData;
    $item.dblclick(function() {
      return wiki.dialog("linkdata", "<pre>" + linkdata + "</pre>");
    });
    $page = $item.parents('.page:first');
    host = $page.data('site') || location.host;
    if (host === 'origin' || host === 'local') {
      host = location.host;
    }
    socket = new WebSocket("ws://" + host + "/plugin/linkmap");
    progress = function(m) {
      return $item.append($("<p>Linkmap " + m + "</p>"));
    };
    socket.onopen = function() {
      return progress("opened");
    };
    socket.onmessage = function(e) {
      linkmap = JSON.parse(linkdata = e.data);
      progress(stats());
      return socket.close();
    };
    return socket.onclose = function() {
      return progress("closed");
    };
  };

  window.plugins.linkmap = {
    emit: emit,
    bind: bind
  };

}).call(this);
