nextOp = (state) ->
  switch state
    when undefined then "Start"
    when "starting", "running" then "Stop"
    when "stopped", "finished" then "Discard"

isNumber = (n) ->
  !isNaN(parseFloat(n)) and isFinite(n)

stats = (item) ->
  rows = []
  for key in ['state', 'server', 'parsed']
    if value = item[key]
      if isNumber value
        value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      rows.push "<tr><td>#{key}<td>#{value}"
  rows.join "\n"

window.plugins.parse =

  emit: (div, item) ->
    div.append """
      <div style="background:#eee; padding:.8em; margin-bottom:5px;">
        <table></table>
        <button type="button">#{nextOp item.state} Parse</button>
      </div>
    """

  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item

    display = (item) ->
      div.find('table').html stats item

    display item

    assemble = ->
      return unless item.state == undefined
      idx = $('.item').index(div)
      peg = $(".item:lt(#{idx})").filter('.code')

    assemble()

    tick = ->
      return unless item.state == 'running'
      return stop('finished') if item.parsed > 130000000
      item.parsed += Math.round(1666666*Math.random())
      socket.send "counting #{item.parsed}"
      display item
      timer = setTimeout tick, 100

    start = ->
      wiki.log "start parse", item
      wiki.createItem null, div, $.extend(true, {}, item, {state: "starting", parsed: 0})

    stop = (state) ->
      clearTimeout timer
      timer = null
      item.state = state || 'stopped'
      display item
      div.find('button').text "#{nextOp item.state} Parse"

    discard = ->
      socket?.close()
      wiki.removeItem div, item

    div.find('button').click (event) ->
      switch item.state
        when undefined then start()
        when "starting", "running" then stop()
        when "stopped", "finished" then discard()

    if item.state == 'starting'
      $page = div.parents '.page:first'
      host = $page.data('site') or location.host
      host = location.host if host is 'origin' or host is 'local'
      socket = new WebSocket("ws://#{host}/plugin/parse")
      item.state = 'running' if item.state is 'starting'

      progress = (m) ->
        item.server = m
        display item

      socket.onopen = ->
        progress "opened"
        tick()

      socket.onmessage = (e) ->
        {action, count} = message = JSON.parse e.data
        progress "#{action} #{count}"
        console.log message.tally

      socket.onclose = ->
        item.state = "stopped"
        progress "closed"
