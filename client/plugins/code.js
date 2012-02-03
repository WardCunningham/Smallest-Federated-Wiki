(function() {

  window.plugins.code = {
    emit: function(div, item) {
      return div.append("<pre class='prettyprint'>" + (prettyPrintOne(item.text)) + "</pre>");
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };

}).call(this);
