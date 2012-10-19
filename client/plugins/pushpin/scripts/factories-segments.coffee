data = require '../factories.json'

report = (object)->
  console.log JSON.stringify object, null, '\t'
  # console.log (key for key of object)

tally = (join)->
  result ={}
  process = (factory)->
    key = join factory
    result[key] ||= 0
    result[key] += 1
  process factory for factory in data
  report result

report data[0]
tally (factory) -> "#{factory.fy}"
tally (factory) -> "#{factory.region}"
tally (factory) -> "#{factory.fy} #{factory.region}"
tally (factory) -> "#{factory.brand}"
tally (factory) -> "#{factory.bu}"
tally (factory) -> "#{factory.brand} #{factory.bu}"
tally (factory) -> "#{factory.fy} #{factory.region} #{factory.brand}"
tally (factory) -> "#{factory.fy} #{factory.region} #{factory.bu}"
tally (factory) -> "#{factory.fy} #{factory.region} #{factory.brand} #{factory.bu}"
