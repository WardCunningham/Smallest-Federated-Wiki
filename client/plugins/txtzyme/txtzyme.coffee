parse = (text) ->
  defn = {}
  for line in text.split /\n+/
    words = line.split /\s+/
    if words[0]
      defn[words[0]] = prev = words[1..999]
    else
      prev.push word for word in words[1..999]
  defn

value = (type, number, arg) ->
  switch type
    when 'A'
      if number.length then arg[+number] else arg
    when 'B'
      1 & (arg >> (number or 0))
    when 'C'
      string = arg.toString()
      if number < string.length
        string.charCodeAt number
      else
        32
    when 'D'
      48 + Math.floor(+arg / (Math.pow(10, number)) % 10)
    when ''
      number

apply = (defn, call, arg, emit) ->
  return unless (words = defn[call]?.slice(0))
  do (stack = [{call, arg, words}], result = []) ->
    send = ->
      return unless result.length
      text = "#{result.join(' ')}\n"
      result = []
      emit text, stack, next
    next = ->
      return unless stack.length
      word = stack[stack.length-1]?.words.shift()
      arg = stack[stack.length-1]?.arg
      if word is undefined
        stack.pop()
      else if word is 'NL'
        return send()
      else if m = word.match /^([ABCD])([0-9]*)$/
        result.push value(m[1], m[2], arg)
      else if m = word.match  /^([A-Z][A-Z0-9]*)(\/([ABCD]?)([0-9]*))?$/
        if stack.length < 10 and (words = defn[m[1]]?.slice(0))
          arg = value(m[3], m[4], arg) if m[2]
          stack.push {call:word, arg, words}
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

  $page = $item.parents('.page:first')
  host = $page.data('site') or location.host
  host = location.host if host is 'origin' or host is 'local'
  socket = new WebSocket("ws://#{host}/plugin/txtzyme")
  sent = rcvd = 0
  srept = rrept = ""
  oldresponse = response = []
  if item.text.replace(/_.*?_/g,'').match /p/
    $item.addClass 'sequence-source'
    $item.get(0).getSequenceData = ->
      if response.length then response else oldresponse

  frame = 0
  tick = ->
    frame = frame%40 + 1
    now = new Date()
    arg = [now.getSeconds(), now.getMinutes(), now.getHours()]
    trigger 'SECOND', arg
    return if arg[0]; trigger 'MINUTE', arg
    return if arg[1]; trigger 'HOUR', arg
    return if arg[2]; trigger 'DAY', arg

  timer = null
  startTicking = ->
    timer = setInterval tick, 25
    tick()

  setTimeout startTicking, 1000-(new Date().getMilliseconds())


  $item.dblclick ->
    clearInterval timer
    socket?.close()
    wiki.textEditor $item, item

  $(".main").on 'thumb', (evt, thumb) ->
    trigger 'THUMB', thumb

  $item.delegate '.rcvd', 'click', ->
    wiki.dialog "Txtzyme Responses", """<pre>#{response.join "\n"}"""

  trigger = (word, arg=0) ->
    apply defn, word, arg, (message, stack, done) ->
      todo = ("#{call} #{words.join ' '}<br>" for {call, words} in stack).join ''
      $item.find('p.report').html "#{todo}#{message}"
      if socket
        progress (srept = " #{++sent} sent ") + rrept
        if response.length
          window.dialog.html """<pre>#{response.join "\n"}"""
          $item.trigger 'sequence', [response]
        response = []
        socket.send message
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
        response.push line

  socket.onclose = ->
    progress "closed"
    socket = null


window.plugins.txtzyme = {emit, bind} if window?