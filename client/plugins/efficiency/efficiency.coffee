window.plugins.efficiency =
  emit: (div, item) ->
    wiki.log 'efficiency', div, item
    div.addClass 'data'
    $('<p />').addClass('readout').appendTo(div).text("63%")
    $('<p />').html(wiki.resolveLinks(item.text||'efficiency')).appendTo(div)
  bind: (div, item) ->
    lastThumb = null
    div.find('p:first')
      # .mousemove (e) ->
        # thumb = thumbs(item)[Math.floor(thumbs(item).length * e.offsetX / e.target.offsetWidth)]
        # return if thumb == lastThumb || null == (lastThumb = thumb)
        # $(e.target).siblings("p").last().html "62%"
        # $(e.target).text(readout(thumb))
        # $(div).triggerHandler('thumb', thumb)
      .dblclick (e) ->
        wiki.dialog "JSON for #{item.text}",  $('<pre/>').text("something good")
    div.find('p:last')
      .dblclick ->
        wiki.textEditor div, item

    locate = ->
      idx = $('.item').index(div)
      who = $(".item:lt(#{idx})").filter('.image').toArray().reverse()
      who.last()

    calculate = (div) ->
      src = $(div).find('img').get(0).src
      c = $ '<canvas id="myCanvas" width="200" height="100" style="border:1px solid #c3c3c3;">'
      d = c.get(0).getContext("2d");
      img=new Image()
      img.src=src
      d.drawImage(img,0,0);
      e = d.getImageData(0, 0, c.width, c.height);
      console.log e

    calculate locate()