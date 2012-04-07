module.exports = util = {}

util.randomByte = ->
  (((1+Math.random())*0x100)|0).toString(16).substring(1)

util.randomBytes = (n) ->
  (util.randomByte() for [1..n]).join('')

