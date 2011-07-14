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

Array.prototype.last = function() {return this[this.length-1];}

function resolve_links(string){
    return string.
      replace(/\[\[([a-z-]+)\]\]/g, '<a href="/$1">$1</a>').
      replace(/\[(http.*?) (.*?)\]/g, '<a href="$1">$2</a>')
}

function refresh(name) {
	$.get('/'+name+'/json', '', function(page_json){
		var page = JSON.parse(page_json);
		$('.body').append('<h1><a href="/"><img src = "/favicon.png" height = "32px"></a> ' + page.title + '</h1><div class="story" /> <div class="journal" />')
		for (var i in page.story){
			var item = page.story[i];
			var div = $('<div class="'+item.type+'" id="'+item.id+'" />').appendTo('.story');
			try {
				if (item.type == 'paragraph') {
					div.append('<p>'+resolve_links(item.text)+'</p>');
				}
				if (item.type == 'image') {
					div.append('<img src="'+item.url+'"> <p>'+resolve_links(item.caption)+'</p>');
				}
				if (item.type == 'chart') {
					div.append('<p class="readout">'+item.data.last().last()+'</p> <p>'+resolve_links(item.caption)+'</p>');
				}
			}
			catch(err) {
				$('#'+item.id).append('<p>'+err+'</p>');
			}
		}
	})
}

