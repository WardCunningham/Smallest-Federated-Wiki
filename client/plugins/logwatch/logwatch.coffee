window.plugins.logwatch =
  bind: (div, item) ->
  emit: (div, item) ->
    socket = new WebSocket('ws://'+window.document.location.host+'/system/logwatch')

    print = (m) ->
      div.append $("<li>").html(m)

    socket.onopen = ->
      print "WebSocket Connection Opened."

    socket.onmessage = (e) ->
      msg = JSON.parse e.data
      print wiki.resolveLinks("[[#{msg.title}]] #{msg.listeners}")

    socket.onclose = ->
      print "WebSocket Connection Closed."
