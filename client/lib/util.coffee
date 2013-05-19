wiki = require './wiki.coffee'
module.exports = wiki.util = util = {}

util.symbols =
  create: '☼'
  add: '+'
  edit: '✎'
  fork: '⚑'
  move: '↕'
  remove: '✕'

util.randomByte = ->
  (((1+Math.random())*0x100)|0).toString(16).substring(1)

util.randomBytes = (n) ->
  (util.randomByte() for [1..n]).join('')

# for chart plug-in
util.formatTime = (time) ->
  d = new Date (if time > 10000000000 then time else time*1000)
  mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  h = d.getHours()
  am = if h < 12 then 'AM' else 'PM'
  h = if h == 0 then 12 else if h > 12 then h - 12 else h
  mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
  "#{h}:#{mi} #{am}<br>#{d.getDate()} #{mo} #{d.getFullYear()}"

# for journal mouse-overs and possibly for date header
util.formatDate = (msSinceEpoch) ->
  d = new Date(msSinceEpoch)
  wk = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  day = d.getDate();
  yr = d.getFullYear();
  h = d.getHours()
  am = if h < 12 then 'AM' else 'PM'
  h = if h == 0 then 12 else if h > 12 then h - 12 else h
  mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
  sec = (if d.getSeconds() < 10 then "0" else "") + d.getSeconds()
  "#{wk} #{mo} #{day}, #{yr}<br>#{h}:#{mi}:#{sec} #{am}"

util.formatElapsedTime = (msSinceEpoch) ->
  msecs = (new Date().getTime() - msSinceEpoch)
  return "#{Math.floor msecs} milliseconds ago" if (secs = msecs/1000) < 2
  return "#{Math.floor secs} seconds ago" if (mins = secs/60) < 2
  return "#{Math.floor mins} minutes ago" if (hrs = mins/60) < 2
  return "#{Math.floor hrs} hours ago" if (days = hrs/24) < 2
  return "#{Math.floor days} days ago" if (weeks = days/7) < 2
  return "#{Math.floor weeks} weeks ago" if (months = days/31) < 2
  return "#{Math.floor months} months ago" if (years = days/365) < 2
  return "#{Math.floor years} years ago"

# DEFAULTS for required fields

util.emptyPage = () ->
  title: 'empty'
  story: []
  journal: []


# If the selection start and selection end are both the same,
# then you have the caret position. If there is selected text, 
# the browser will not tell you where the caret is, but it will 
# either be at the beginning or the end of the selection 
#(depending on the direction of the selection).
util.getSelectionPos = (jQueryElement) -> 
  el = jQueryElement.get(0) # gets DOM Node from from jQuery wrapper
  if document.selection # IE
    el.focus()
    sel = document.selection.createRange()
    sel.moveStart 'character', -el.value.length
    iePos = sel.text.length
    {start: iePos, end: iePos}
  else
    {start: el.selectionStart, end: el.selectionEnd}

util.setCaretPosition = (jQueryElement, caretPos) ->
  el = jQueryElement.get(0)
  if el?
    if el.createTextRange # IE
      range = el.createTextRange()
      range.move "character", caretPos
      range.select()
    else # rest of the world
      el.setSelectionRange caretPos, caretPos
    el.focus()

