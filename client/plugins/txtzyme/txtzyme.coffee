parse = (text) ->
  defn = {}
  for line in text.split /\n/
    words = line.split /\s+/
    defn[words[0]] = words[1..999]
  defn

apply = (defn, call) ->
  result = []
  return unless words = defn[call]
  for word in words
    result.push if word.match /^[A-Z][A-Z0-9]*$/
      apply defn, word
    else
      word
  result.join ' '

emit = ($item, item) ->
  $item.css {width:"95%", background:"#eee", padding:".8em", 'margin-bottom':"5px"}
  $item.append """
    <p class="report" style="white-space: pre">#{item.text}</p>
    <p class="caption">status here</p>
  """

bind = ($item, item) ->
  defn = parse item.text
  wiki.log defn

  socket = new WebSocket('ws://'+window.document.location.host+'/plugin/txtzyme')
  sent = rcvd = 0

  tic = ->
    message = apply defn, 'SECOND'
    $item.find('p.report').text "SECOND #{message}"
    if socket
      socket.send message
      progress "#{++sent} sent"

  timer = setInterval tic, 1000

  $item.dblclick -> wiki.textEditor $item, item

  $(".main").on 'thumb', (evt, thumb) ->
    message = apply defn, 'THUMB'
    $item.find('p.report').text "THUMB #{message}"
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


window.plugins.txtzyme = {emit, bind}