# **random_id.coffee**
# Simple random hex generator, takes an optional number of
# chars that defaults to 16 and returns a random id.

random_id = (chars = 16) ->
  [0...chars].map( ->
    Math.floor(Math.random() * 16).toString(16)
  ).join('')

module.exports = random_id.random_id = random_id
