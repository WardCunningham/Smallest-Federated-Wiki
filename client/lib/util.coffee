module.exports = util = {}

util.randomByte = ->
  (((1+Math.random())*0x100)|0).toString(16).substring(1)

util.randomBytes = (n) ->
  (util.randomByte() for [1..n]).join('')

util.formatTime = (time) ->
  d = new Date (if time > 10000000000 then time else time*1000)
  mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  h = d.getHours()
  am = if h < 12 then 'AM' else 'PM'
  h = if h == 0 then 12 else if h > 12 then h - 12 else h
  mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
  "#{h}:#{mi} #{am}<br>#{d.getDate()} #{mo} #{d.getFullYear()}"

util.asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

# DEFAULTS for required fields

util.emptyPage = () ->
  title: 'empty'
  story: []
  journal: []

