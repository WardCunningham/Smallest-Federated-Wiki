
window.plugins.parse =
  emit: (div, item) ->
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item

    nextOp = (state) ->
      switch item.state
        when undefined then "Start"
        when "running" then "Stop"
        when "stopped", "finished" then "Discard"

    isNumber = (n) ->
      !isNaN(parseFloat(n)) and isFinite(n)

    stats = () ->
      rows = []
      for key in ['state', 'grammar', 'parsed']
        if value = item[key]
          if isNumber value
            value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          rows.push "<tr><td>#{key}<td>#{value}"
      rows.join "\n"

    div.append """
      <div style="background:#eee; padding:.8em; margin-bottom:5px;">
        <table>#{stats()}</table>
        <button type="button">#{nextOp item.state} Parse</button>
      </div>
    """

    assemble = ->
      return unless item.state == undefined
      idx = $('.item').index(div)
      peg = $(".item:lt(#{idx})").filter('.code')
      wiki.log 'peg', idx, peg, peg.text()

    assemble()

    tick = ->
      return unless item.state == 'running'
      return stop('finished') if item.parsed > 130000000
      item.parsed += Math.round(1666666*Math.random())
      div.find('table').html stats()
      timer = setTimeout tick, 100

    start = ->
      wiki.log "start parse", item
      wiki.createItem null, div, $.extend(true, {}, item, {state: "running", parsed: 0})

    stop = (state) ->
      clearTimeout timer
      timer = null
      item.state = state || 'stopped'
      div.find('table').html stats()
      div.find('button').text "#{nextOp item.state} Parse"

    discard = ->
      wiki.removeItem div, item

    div.find('button').click (event) ->
      switch item.state
        when undefined then start()
        when "running" then stop()
        when "stopped", "finished" then discard()

    tick()

    # socket = new WebSocket('ws://'+window.document.location.host+'/system/parse')

    # print = (m) ->
    #   div.append $("<li>").html(m)

    # socket.onopen = ->
    #   print "WebSocket Connection Opened."

    # socket.onmessage = (e) ->
    #   msg = JSON.parse e.data
    #   print wiki.resolveLinks("[[#{msg.title}]]")

    # socket.onclose = ->
    #   print "WebSocket Connection Closed."
