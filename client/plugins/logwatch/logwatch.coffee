window.plugins.logwatch =
  bind: (div, item) ->
  emit: (div, item) ->
      wiki.getScript 'http://cdn.sockjs.org/sockjs-0.3.min.js', ->
        sockjs = new SockJS "/system/logwatch"

        print = (m) ->
          div.append $("<li>").html(m)

        sockjs.onopen = ->
          print "Connection Opened #{JSON.stringify sockjs.protocol}",
        sockjs.onmessage = (e) ->
          msg = JSON.parse e.data
          print wiki.resolveLinks("[[#{msg.title}]]")
        sockjs.onclose = ->
          print "Connection Closed"


