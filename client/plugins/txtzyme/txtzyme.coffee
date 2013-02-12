parse = (text) ->
  defn = {}
  for line in text.split /\n/
    words = line.match /\S+/
    defn[words[0]] = words[1.999]
  defn

apply = (defn, call) ->
  result = ''
  return unless words = defn[call]
  for word in words
    result += if word.match /^[A-Z][A-Z0-9]*$/
      apply defn, word
    else
      word

emit = ($item, item) ->
  $item.css {width:"95%", background:"#eee", padding:".8em", 'margin-bottom':"5px"}
  $item.append """
    <p class="report">
      #{item.text}
    </p>
    <p class="caption">
      status here
    </p>
  """

bind = ($item, item) ->
  socket = new WebSocket('ws://'+window.document.location.host+'/plugin/txtzyme')
  sent = rcvd = 0

  $item.dblclick -> wiki.textEditor $item, item

  $(".main").on 'thumb', (evt, thumb) ->
    message = item.text.replace /THUMB/, thumb
    $item.find('p.report').text message
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