window.plugins.logwatch =
  bind: (div, item) ->
  emit: (div, item) ->
    wiki.getScript 'http://cdn.sockjs.org/sockjs-0.3.min.js', ->
      div.append("""
          <style>
            .logwatch .box {
                width: 300px;
                float: left;
                margin: 0 20px 0 20px;
            }
            .logwatch .box div, .logwatch .box input {
                border: 1px solid;
                -moz-border-radius: 4px;
                border-radius: 4px;
                width: 100%;
                padding: 0px;
                margin: 5px;
            }
            .logwatch .box div {
                border-color: grey;
                height: 300px;
                overflow: auto;
            }
          </style>

          <div id="first" class="box">
            <div></div>
          </div>                  """)

      sockjs_url = "/system/logwatch"
      sockjs = new SockJS(sockjs_url)
      div = $("#first div")
      form = $("#first form")
      print = (m, p) ->
        p = (if (p is `undefined`) then "" else JSON.stringify(p))
        div.append $("<p>").html(m + " " + p)
        div.append $("</p>")
        div.scrollTop div.scrollTop() + 10000

      sockjs.onopen = ->
        print "WebSocket Connection Opened", sockjs.protocol

      sockjs.onmessage = (e) ->
        print wiki.resolveLinks("Page Viewed: [[#{JSON.parse(e.data).title}]]")
      sockjs.onclose = ->
        print "WebSocket Connection Closed"


