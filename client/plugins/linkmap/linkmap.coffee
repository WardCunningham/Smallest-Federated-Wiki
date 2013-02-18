# {"slug": ["slug"]}
linkdata = "{}"
linkmap = {}

# {nodes: [{name: string, group: 1}] links: [{source: 0, target: 33, value: 6}]}
forceData = ->
	nodes = []
	links = []
	nodeNum = {}
	nodeGroup = {}
	for div in $('.page')
		nodeGroup[div.id] = 1
	for slug of linkmap
		nodeNum[slug] = nodes.length
		nodes.push {name: slug, group: nodeGroup[slug] || 3}
	for slug, slugs of linkmap
		source = nodeNum[slug]
		for link, i in slugs
			if i<4 and (target = nodeNum[link])?
				links.push({source, target, value: 6})
	{nodes, links}

stats =  ->
	force = forceData()
	"#{force.nodes.length} nodes, #{force.links.length} links"


emit = ($item, item) ->
	$item.css "background-color", "#eee"
	$item.css "padding", 5
	$item.append """<p>Starting Linkmap</p>"""

bind = ($item, item) ->
	$item.addClass 'force-source'
	$item.get(0).forceData = forceData
	$item.dblclick -> wiki.dialog "linkdata", "<pre>#{linkdata}</pre>"

	$page = $item.parents('.page:first')
	host = $page.data('site') or location.host
	host = location.host if host is 'origin' or host is 'local'
	socket = new WebSocket("ws://#{host}/plugin/linkmap")

	progress = (m) ->
		$item.append $ "<p>Linkmap #{m}</p>"

	socket.onopen = ->
	  progress "opened"

	socket.onmessage = (e) ->
	  linkmap = JSON.parse linkdata = e.data
	  progress stats()
	  socket.close()

	socket.onclose = ->
	  progress "closed"


window.plugins.linkmap = {emit, bind}