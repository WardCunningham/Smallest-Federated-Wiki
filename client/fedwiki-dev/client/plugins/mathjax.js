(function() {

  window.plugins.mathjax = {
    emit: function(div, item) {
      var typeset;
      typeset = function() {
        return window.MathJax.Hub.Typeset(div.get(0));
      };
      wiki.getScript('http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML', typeset);
      return div.append("<p>" + (wiki.resolveLinks(item.text)) + "</p>");
    },
    bind: function(div, item) {
      return div.dblclick(function() {
        return wiki.textEditor(div, item);
      });
    }
  };

}).call(this);
