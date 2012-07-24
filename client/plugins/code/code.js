window.plugins.code = (function() {
  var load;

  function code() {}

  load = function(callback) {
    wiki.getScript('/js/google-code-prettify/prettify.js', callback);
    return $('<style type="text/css"></style>').html('@import url("/js/google-code-prettify/prettify.css")').appendTo("head");
  };

  code.emit = function(div, item) {
    return load(function() {
      return div.append("<pre class='prettyprint'>" + (prettyPrintOne(item.text)) + "</pre>");
    });
  };

  code.bind = function(div, item) {
    return load(function() {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    });
  };

  return code;

})();
