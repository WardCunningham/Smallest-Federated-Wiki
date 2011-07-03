// client side javascript for drag & drop wiki editor

$(function() {
	$(document).ajaxError(function(event, request, settings){
	  $('.main').prepend("<li><font color=red>Error on " + settings.url + "</li>");
	});
	$( "#story" ).sortable({
		update: function(event, ui) {
			edit = {"type": "move", "order": $(this).children().map(function(key,value){return value.id}).get()};
			$.ajax({ type: 'PUT', url: 'page/'+page_name+'/edit', data: {'edit': JSON.stringify(edit)}, success: function(){
				$("#journal").prepend('<span class="edit move">m</a>')
			} });
		}
	});
	$( "#sortable" ).disableSelection();
});
