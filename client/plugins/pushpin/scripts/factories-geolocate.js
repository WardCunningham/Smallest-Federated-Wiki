(function() {
  var data, geocoder, process, report, result;

  geocoder = require('geocoder');

  data = require('../factories.json');

  result = {};

  report = function() {
    return console.log(JSON.stringify(result, null, '\t'));
  };

  process = function() {
    var country, name;
    if (data.length === 0) {
      return report();
    } else {
      country = data.shift().country;
      if (result[country]) {
        return process();
      } else {
        name = country === 'BOSNIA' ? 'Bosnia and Herzegovina' : country;
        return geocoder.geocode(name, function(err, geo) {
          var adr, res;
          if (err) {
            console.log([country, err]);
          }
          res = geo.results[0];
          adr = res.address_components[0];
          result[country] = {
            name: adr.long_name,
            code: adr.short_name,
            location: res.geometry.location,
            bounds: res.geometry.bounds
          };
          return setTimeout(process, 500);
        });
      }
    }
  };

  process();

}).call(this);
