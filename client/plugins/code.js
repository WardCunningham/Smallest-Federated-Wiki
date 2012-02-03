(function() {

  window.plugins.code = {
    emit: function(div, item) {
      return div.append("<pre>" + item.text + "</pre>");
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return textEditor(div, item);
      });
    }
  };

}).call(this);
