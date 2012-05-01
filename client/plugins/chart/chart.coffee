formatTime = (time) ->
  d = new Date (if time > 10000000000 then time else time*1000)
  mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]
  h = d.getHours()
  am = if h < 12 then 'AM' else 'PM'
  h = if h == 0 then 12 else if h > 12 then h - 12 else h
  mi = (if d.getMinutes() < 10 then "0" else "") + d.getMinutes()
  "#{h}:#{mi} #{am}<br>#{d.getDate()} #{mo} #{d.getFullYear()}"

window.plugins.chart =
  emit: (div, item) ->
    chartElement = $('<p />').addClass('readout').appendTo(div).text(item.data.last().last())
    captionElement = $('<p />').html(wiki.resolveLinks(item.caption)).appendTo(div)
  bind: (div, item) ->
    div.find('p:first').mousemove (e) ->
      [time, sample] = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]
      $(e.target).text sample.toFixed(1)
      $(e.target).siblings("p").last().html formatTime(time)
    .dblclick ->
      wiki.dialog "JSON for #{item.caption}", $('<pre/>').text(JSON.stringify(item.data, null, 2))
      