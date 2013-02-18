parse = (text) ->
  defn = {}
  for line in text.split /\n+/
    words = line.split /\s+/
    if words[0]
      defn[words[0]] = prev = words[1..999]
    else
      prev.push word for word in words[1..999]
  defn

apply = (defn, call, arg, emit) ->
  return unless (words = defn[call]?.slice(0))
  do (stack = [{call, words}], result = []) ->
    send = ->
      return unless result.length
      text = "#{result.join(' ')}\n"
      result = []
      emit text, stack, next
    next = ->
      return unless stack.length
      word = stack[stack.length-1]?.words.shift()
      if word is undefined
        stack.pop()
      else if word is 'NL'
        return send()
      else if word.match /^[A-Z][A-Z0-9]*$/
        if stack.length < 10 and (words = defn[word]?.slice(0))
          stack.push {call:word, words}
      else
        result.push word
      if stack.length
        next()
      else
        return send()
    next() if words.length

report = (defn) ->
  report = []
  for key, words of defn
    report.push """<li class="#{key}"><span>#{key}</span>"""
    for word in words
      report.push """<span>#{word}</span>"""
  report.join ' '

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
  host = location.host if host is 'origin' or host is 'local'
  socket = new WebSocket("ws://#{host}/plugin/txtzyme")
  sent = rcvd = 0
  srept = rrept = ""
  report = []

  tic = ->
    now = new Date()
    trigger 'SECOND'
    return if now.getSeconds(); trigger 'MINUTE'
    return if now.getMinutes(); trigger 'HOUR'
    return if now.getHours(); trigger 'DAY'

  timer = setInterval tic, 1000

  $item.dblclick ->
    clearInterval timer
    socket?.close()
    wiki.textEditor $item, item

  $(".main").on 'thumb', (evt, thumb) ->
    trigger 'THUMB'

  $item.delegate '.rcvd', 'click', ->
    wiki.dialog "Txtzyme Responses", """<pre>#{report.join "\n"}"""

  trigger = (word, arg=0) ->
    apply defn, word, arg, (message, stack, done) ->
      todo = ("#{call} #{words.join ' '}" for {call, words} in stack).join '<br>'
      $item.find('p.report').html "#{todo}<br>#{message}"
      if socket
        socket.send message
        progress (srept = " #{++sent} sent ") + rrept
        report = []
      setTimeout done, 200

  progress = (m) ->
    # wiki.log 'txtzyme', m
    $item.find('p.caption').html m

  socket.onopen = ->
    progress "opened"
    trigger 'OPEN'

  socket.onmessage = (e) ->
    for line in e.data.split /\r?\n/
      if line
        progress srept + (rrept = "<span class=rcvd> #{++rcvd} rcvd #{line} </span>")
        report.push line

  socket.onclose = ->
    progress "closed"
    socket = null


window.plugins.txtzyme = {emit, bind} if window?