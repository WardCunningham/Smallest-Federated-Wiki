(function() {
  var shape;
  shape = function(data) {
    return data.toString();
  };
  window.plugins.data = {
    emit: function(div, item) {
      return $("<p>" + (shape(item.data)) + "</p>").appendTo(div);
    },
    bind: function(div, item) {}
  };
}).call(this);
