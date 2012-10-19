geocoder = require 'geocoder'

# geocoder.geocode 'CHINA', (err, geo) ->
#   console.log  JSON.stringify(geo, null, '\t')

data = require '../factories.json'
result ={}

report = ->
  console.log JSON.stringify result, null, '\t'

process = ->
  if data.length == 0
    report()
  else
    country = data.shift().country
    if result[country] 
      process()
    else
      name = if country == 'BOSNIA' then 'Bosnia and Herzegovina' else country
      geocoder.geocode name, (err, geo) ->
        console.log [country, err] if err
        res = geo.results[0]
        adr = res.address_components[0]
        result[country] =
          name: adr.long_name
          code: adr.short_name
          location: res.geometry.location
          bounds: res.geometry.bounds
        setTimeout process, 500

process()

