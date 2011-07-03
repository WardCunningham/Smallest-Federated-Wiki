// client side javascript for drag & drop wiki editor

$(function() {
	function where(item) {
		prev = item.prev().attr('id');
		return prev === undefined ? "top" : prev;
	}
	$( "#sortable" ).sortable({
		start: function(event, ui) {
			ui.item.data('move_from', where(ui.item));
		},
		stop: function(event, ui) {
			was = ui.item.data('move_from');
			now = where(ui.item);
			if (was == now) return;
			console.log("move " + ui.item.attr('id') + " from " + was + " to " + now);
			console.log(ui.item.siblings().map(function(k,v){return v.id}));
		}
	});
	$( "#sortable" ).disableSelection();
});
