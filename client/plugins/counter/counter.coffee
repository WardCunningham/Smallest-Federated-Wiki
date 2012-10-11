window.plugins.counter =
  bind: (div, item) ->
  emit: (div, item) ->
    socket = new WebSocket('ws://'+window.document.location.host+'/system/counter')

    print = (m) ->
      div.append $("<li>").html(m)

    socket.onopen = ->
      print "WebSocket Connection Opened."

    socket.onmessage = (e) ->
      print e.data

    socket.onclose = ->
      print "WebSocket Connection Closed."
