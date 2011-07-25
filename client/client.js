// client side javascript for drag & drop wiki editor

Array.prototype.last = function() {return this[this.length-1];}

$(function() {

	$(document).ajaxError(function(event, request, settings){
	  $('.main').prepend("<li><font color=red>Error on " + settings.url + "</li>");
	});

	function be_sortable(page_name){
		$( ".story" ).sortable({
			update: function(event, ui) {
				edit = {"type": "move", "order": $(this).children().map(function(key,value){return value.id}).get()};
				$.ajax({ type: 'PUT', url: '/page/'+page_name+'/edit', data: {'edit': JSON.stringify(edit)}, success: function(){
					$(".journal").prepend('<span class="edit move">m</span>')
				} });
			}
		});
		$( "#sortable" ).disableSelection();

		$('.readout').mousemove(function(e){
			var item = $(e.target).parent('.chart').data('item');
			var sample = item.data[Math.floor(item.data.length * e.offsetX/e.target.offsetWidth)];
			var d = new Date(sample[0]);
			var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
			var h = d.getHours();
			var am = h<12 ? "AM" : "PM";
			h = h==0 ? 12 : h>12 ? h-12 : h;
			var time = h + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes() + " " + am + "<br>" + d.getDate() + " " + m + " " + d.getFullYear();
			$(e.target).text(sample[1].toFixed(1));
			$(e.target).siblings('p').last().html(time);
	    });
	}

	function resolve_links(string){
	    return string.
	      replace(/\[\[([a-z-]+)\]\]/g, '<a href="/$1">$1</a>').
	      replace(/\[(http.*?) (.*?)\]/g, '<a href="$1">$2</a>')
	}

	function refresh(i,each) {
		var page_name = $(each).attr('id');
		$.get('/'+page_name+'/json', '', function(page_json){
			var empty = {title:"empty",synopsys:"empty",story:[],journal:[]};
			var page = $.extend(empty, JSON.parse(page_json));
			$(each)
				.append('<h1><a href="/"><img src = "/favicon.png" height = "32px"></a> ' + page.title + '</h1>')
				.append('<div class="story" /> <div class="journal" /> <div class="footer" />');
			$.each(page.story, function(i, item) {
				var item = page.story[i];
				var div = $('<div class="'+item.type+'" id="'+item.id+'" />');
				$(each).children('.story').append(div);
				try {
					if (item.type == 'paragraph') {
						div.append('<p>'+resolve_links(item.text)+'</p>');
					}
					if (item.type == 'image') {
						div.append('<img src="'+item.url+'"> <p>'+resolve_links(item.caption)+'</p>');
					}
					if (item.type == 'chart') {
						div.append('<p class="readout">'+item.data.last().last()+'</p> <p>'+resolve_links(item.caption)+'</p>');
						div.data('item',item);
					}
				}
				catch(err) {
					$('#'+item.id).append('<p>'+err+'</p>');
				}
			});
			var journal = $(each).children('.journal');
			$.each(page.journal.reverse(), function (i, item) {
				journal.append('<span> <span class="edit '+item.type+'">'+item.type[0]+'</span></span>');
			});
			$(each).children('.footer')
				.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
				.append('<a href="/'+page_name+'/json">JSON</a>');
			be_sortable(page_name);
		})
	}

	if($('.story').length){
		be_sortable($('.page').attr('id'));
	} else {
		$('.page').each(refresh);
	}
});

