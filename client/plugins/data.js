(function() {
  window.plugins.data = {
    emit: function(div, item) {
      $('<p />').addClass('readout').appendTo(div).text("" + item.data.length + "x" + item.columns.length);
      return $('<p />').html(wiki.resolveLinks(item.text || 'data')).appendTo(div);
    },
    bind: function(div, item) {
      return div.find('p:first').mousemove(function(e) {
        var column;
        column = item.columns[Math.floor(item.columns.length * e.offsetX / e.target.offsetWidth)];
        return $(e.target).siblings("p").last().html(column);
      });
    }
  };
}).call(this);
