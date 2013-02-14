parse = (text) ->
  defn = {}
  for line in text.split /\n+/
    words = line.split /\s+/
    if words[0]
      defn[words[0]] = prev = words[1..999]
    else
      prev.push word for word in words[1..999]
  defn

apply = (defn, call, arg, depth=0) ->
  result = []
  return unless words = defn[call]
  for word in words
    result.push if word is 'NL'
      "\n"
    else if word.match /^[A-Z][A-Z0-9]*$/
      apply defn, word, arg, depth+1 unless depth >= 10
    else
      word
  result.join(' ')

module.exports = {parse, apply} if module?

emit = ($item, item) ->
  $item.append """
    <div style="width:93%; background:#eee; padding:.8em; margin-bottom:5px;">
      <p class="report" style="white-space: pre; white-space: pre-wrap;">#{item.text}</p>
      <p class="caption">status here</p>
    </div>
  """

bind = ($item, item) ->
  defn = parse item.text
  wiki.log defn

  $page = $item.parents('.page:first')
  host = $page.data('site') or location.host
  socket = new WebSocket("ws://#{host}/plugin/txtzyme")
  sent = rcvd = 0

  tic = ->
    now = new Date()
    trigger 'SECOND'
    return if now.getSeconds(); trigger 'MINUTE'
    return if now.getMinutes(); trigger 'HOUR'
    return if now.getHours(); trigger 'DAY'

  timer = setInterval tic, 1000

  $item.dblclick -> wiki.textEditor $item, item

  $(".main").on 'thumb', (evt, thumb) ->
    trigger 'THUMB'

  trigger = (word) ->
    return unless message = apply defn, word
    $item.find('p.report').text "#{word} #{message}"
    if socket
      socket.send message
      progress "#{++sent} sent"

  progress = (m) ->
    wiki.log 'txtzyme', m
    $item.find('p.caption').text m

  socket.onopen = ->
    progress "opened"

  socket.onmessage = (e) ->
    progress "rcvd #{e.data}"

  socket.onclose = ->
    progress "closed"
    socket = null


window.plugins.txtzyme = {emit, bind} if window?