// client side javascript for drag & drop wiki editor

Array.prototype.last = function() {return this[this.length-1];}

$(function() {

	$(document).ajaxError(function(event, request, settings){
		$('.main').prepend("<li><font color=red>Error on " + settings.url + "</li>");
	});

	function resolve_links(string){
			return string.
				replace(/\[\[([a-z-]+)\]\]/g, '<a href="/$1">$1</a>').
				replace(/\[(http.*?) (.*?)\]/g, '<a href="$1">$2</a>')
	}

	function refresh() {
		var pageElement = $(this);
		var page_name = $(pageElement).attr('id');
		var storyElement;

		var getItem = function(element) {
			if ($(element).length > 0 ) {
				return $(element).data("item") || JSON.parse($(element).attr("data-static-item"));
			}
		};

		var initDragging = function() {
			var storyElement = pageElement.find(".story");
			storyElement.sortable({
				update: function(evt, ui) {
					var itemElement = ui.item;
					var item = getItem(itemElement);

					var thisPageElement = $(this).parents(".page:first");
					var sourcePageElement = itemElement.data("pageElement");
					var destinationPageElement = itemElement.parents(".page:first");

					var journalElement = thisPageElement.find(".journal");

					var equals = function(a, b) {
						return a && b && a.get(0) === b.get(0);
					}

					var moveWithinPage = !sourcePageElement || equals(sourcePageElement, destinationPageElement);
					var moveFromPage = !moveWithinPage && equals(thisPageElement, sourcePageElement);
					var moveToPage = !moveWithinPage && equals(thisPageElement, destinationPageElement);

					if (moveWithinPage) {
						var order = $(this).children().map(function(key,value){return value.id}).get();
						var edit = {"type": "move", "order": order};
						console.log(JSON.stringify(edit));
					} else if (moveFromPage) {
						var edit = {"type": "remove", "id": item.id};
						console.log(JSON.stringify(edit));
						journalElement.prepend($("<span />").addClass("edit").addClass("remove").text("r"));
					} else if (moveToPage) {
						itemElement.data("pageElement", thisPageElement);

						var beforeElement = itemElement.prev(".item")

						var before = getItem(beforeElement);
						var beforeId = before ? before.id : null;

						var edit = {"type": "add", "item": item, "previousSibling": beforeId};
						console.log(JSON.stringify(edit));
						journalElement.prepend($("<span />").addClass("edit").addClass("add").text("a"));
					}
				},
				connectWith: ".page .story"
			});
		};

		var initChartElement = function(chartElement) {
			$(chartElement).mousemove(function(e){
				var item = getItem($(e.target).parent('.chart'));
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
		};


		var buildPage = function(data) {
			var empty = {title:"empty",synopsys:"empty",story:[],journal:[]};
			var page = $.extend(empty, data);
			$(pageElement).append('<h1><a href="/"><img src = "/favicon.png" height = "32px"></a> ' + page.title + '</h1>');
			var storyElement = $("<div />").addClass("story").appendTo(pageElement);

			var journalElement = $("<div />").addClass("journal").appendTo(pageElement);
			pageElement.append('<div class="footer" />');

			$.each(page.story, function() {
				var item = this;
				var div = $('<div class="item '+item.type+'" id="'+item.id+'" />');
				$(pageElement).children('.story').append(div);
				try {
					div.data('pageElement', pageElement);
					div.data('item',item);
					if (item.type == 'paragraph') {
						div.append('<p>'+resolve_links(item.text)+'</p>');
						div.dblclick(function(){
							var textarea = $('<textarea>' + item.text + '</textarea>');
							textarea.focusout(function(){
								item.text = textarea.val();
								$(div).last('p').html('<p>'+resolve_links(item.text)+'</p>');
							});
							div.html(textarea);
							textarea.focus();
						});
					}
					if (item.type == 'image') {
						div.append('<img src="'+item.url+'"> <p>'+resolve_links(item.caption)+'</p>');
					}
					if (item.type == 'chart') {
						var chartElement = $("<p />").addClass("readout").appendTo(div).text(item.data.last().last());
						var captionElement = $("<p />").text(resolve_links(item.caption)).appendTo(div);
						initChartElement(chartElement);
					}
				}
				catch(err) {
					$('#'+item.id).append('<p>'+err+'</p>');
				}
			});
			$.each(page.journal.reverse(), function (i, item) {
				journalElement.append('<span> <span class="edit '+item.type+'">'+item.type[0]+'</span></span>');
			});
			$(pageElement).children('.footer')
				.append('<a id="license" href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> . ')
				.append('<a href="/'+page_name+'/json">JSON</a>');
		};

		if ($(pageElement).attr("data-server-generated") === "true") {
			initDragging();
			$(".readout").each(function() { initChartElement(this); });
		} else {
			$.get('/'+page_name+'/json', '', function(page_json) {
				buildPage(JSON.parse(page_json));
				initDragging();
			});
		}

	}

	$('.page').each(refresh);
});

