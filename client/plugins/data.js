(function() {
  var readout, thumbs,
    __hasProp = Object.prototype.hasOwnProperty;

  window.plugins.data = {
    emit: function(div, item) {
      $('<p />').addClass('readout').appendTo(div).text(readout(item));
      return $('<p />').html(wiki.resolveLinks(item.text || 'data')).appendTo(div);
    },
    bind: function(div, item) {
      return div.find('p:first').mousemove(function(e) {
        var thumb;
        thumb = thumbs(item)[Math.floor(thumbs(item).length * e.offsetX / e.target.offsetWidth)];
        return $(e.target).siblings("p").last().html(thumb);
      });
    }
  };

  readout = function(item) {
    if (item.columns != null) {
      return "" + item.data.length + "x" + item.columns.length;
    }
    if ((item.data.nodes != null) && (item.data.links != null)) {
      return "" + item.data.nodes.length + "/" + item.data.links.length;
    }
    return "data";
  };

  thumbs = function(item) {
    var key, _ref, _results;
    if (item.columns != null) return item.columns;
    _ref = item.data;
    _results = [];
    for (key in _ref) {
      if (!__hasProp.call(_ref, key)) continue;
      _results.push(key);
    }
    return _results;
  };

}).call(this);
