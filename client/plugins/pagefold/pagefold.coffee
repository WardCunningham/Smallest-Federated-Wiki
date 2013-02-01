# http://stackoverflow.com/questions/5214127/css-technique-for-a-horizontal-line-with-words-in-the-middle

emit = ($item, item) ->
	$item.append """
		<div style="height: 10px; border-top: 2px solid lightgray; margin-top: 24px; text-align: center; position: relative; clear: both;">
			<span style="position: relative; top: -.8em; background: white; display: inline-block; color: gray; ">
				&nbsp; #{item.text} &nbsp;
			</span>
		</div>
	"""

bind = ($item, item) ->
	$item.dblclick -> wiki.textEditor $item, item

window.plugins.pagefold = {emit, bind}