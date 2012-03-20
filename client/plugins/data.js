(function() {
  var readout, summary, thumbs,
    __hasProp = Object.prototype.hasOwnProperty;

  window.plugins.data = {
    emit: function(div, item) {
      $('<p />').addClass('readout').appendTo(div).text(summary(item));
      return $('<p />').html(wiki.resolveLinks(item.text || 'data')).appendTo(div);
    },
    bind: function(div, item) {
      return div.find('p:first').mousemove(function(e) {
        var thumb;
        thumb = thumbs(item)[Math.floor(thumbs(item).length * e.offsetX / e.target.offsetWidth)];
        $(e.target).siblings("p").last().html(thumb);
        if (item.data.object != null) $(e.target).text(readout(item.data[thumb]));
        return $(div).triggerHandler('thumb', thumb);
      });
    }
  };

  summary = function(item) {
    if (item.columns != null) {
      return "" + item.data.length + "x" + item.columns.length;
    }
    if ((item.data != null) && (item.data.nodes != null) && (item.data.links != null)) {
      return "" + item.data.nodes.length + "/" + item.data.links.length;
    }
    return "1x" + (thumbs(item).length);
    return "data";
  };

  readout = function(field) {
    if (field.value != null) return "" + field.value;
    if (field.constructor === Number) return "" + (field.toFixed(2));
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
