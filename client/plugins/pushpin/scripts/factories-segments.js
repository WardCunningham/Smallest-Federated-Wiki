(function() {
  var data, report, tally;

  data = require('../factories.json');

  report = function(object) {
    return console.log(JSON.stringify(object, null, '\t'));
  };

  tally = function(join) {
    var factory, process, result, _i, _len;
    result = {};
    process = function(factory) {
      var key;
      key = join(factory);
      result[key] || (result[key] = 0);
      return result[key] += 1;
    };
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      factory = data[_i];
      process(factory);
    }
    return report(result);
  };

  report(data[0]);

  tally(function(factory) {
    return "" + factory.fy;
  });

  tally(function(factory) {
    return "" + factory.region;
  });

  tally(function(factory) {
    return "" + factory.fy + " " + factory.region;
  });

  tally(function(factory) {
    return "" + factory.brand;
  });

  tally(function(factory) {
    return "" + factory.bu;
  });

  tally(function(factory) {
    return "" + factory.brand + " " + factory.bu;
  });

  tally(function(factory) {
    return "" + factory.fy + " " + factory.region + " " + factory.brand;
  });

  tally(function(factory) {
    return "" + factory.fy + " " + factory.region + " " + factory.bu;
  });

  tally(function(factory) {
    return "" + factory.fy + " " + factory.region + " " + factory.brand + " " + factory.bu;
  });

}).call(this);
