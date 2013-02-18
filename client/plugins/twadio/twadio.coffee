parse = (text) ->
	defn = {freq: 14.042, tune: 30}

emit = ($item, item) ->
	defn = parse item.text
	$item.append """
		<div style="background-color:#eee; padding: 1em;">
			<button class="send">Send</button> psk-31 on #{defn.freq} MHz<br>
			<button class="tune">Tune</button> for #{defn.tune} seconds<br>
			<p class="caption">status here</p>
			<h4>Pages Ready to Send</h4>
			<div class="schedule">
				<a href="#">Jeremy McDermond NH6Z Notes</a><br>
				<a href='#'>Ward Cunningham K9OX Notes</a>
			</div>
		</div>
	"""

bind = ($item, item) ->
	defn = parse item.text
	status = {}
	wiki.log defn

	$send = $item.find 'button.send'
	$tune = $item.find 'button.tune'
	$schedule = $item.find 'div.schedule'

	$page = $item.parents '.page:first'
	host = $page.data('site') or location.host
	host = location.host if host is 'origin' or host is 'local'
	socket = new WebSocket("ws://#{host}/plugin/twadio")

	$item.dblclick ->
	  wiki.textEditor $item, item

	progress = (m) ->
	  $item.find('p.caption').html m

	request = (action) ->
		progress "send #{message = JSON.stringify action}"
		socket.send message if socket

	$send.on 'click', -> request {action: if status.mode is 'send' then 'stop' else 'send'}
	$tune.on 'click', -> request {action: if status.mode is 'tune' then 'stop' else 'tune'}

	socket.onopen = ->
	  progress "opened"

	socket.onmessage = (e) ->
		progress "message #{e.data}"
		status = JSON.parse e.data
		$send.html if status.mode is 'send' then 'Stop' else 'Send'
		$tune.html if status.mode is 'tune' then 'Stop' else 'Tune'

	socket.onclose = ->
	  progress "closed"
	  socket = null

window.plugins.twadio = {emit, bind} if window?