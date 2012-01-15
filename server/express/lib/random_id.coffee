# ** random_id.coffee **
# takes no arguments and returns a random id

random_id = ->
  [0..15].map( ->
    Math.floor(Math.random() * 16).toString(16)
  ).join('')

module.exports = random_id.random_id = random_id
