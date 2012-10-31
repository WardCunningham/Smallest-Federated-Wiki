window.plugins.efficiency =
  efficiencyDIV: null

  emit: (div, item) ->
    wiki.log 'efficiency', div, item
    div.addClass 'data'
    $('<p />').addClass('readout').appendTo(div).text("0%")
    this.efficiencyDIV = div
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
      data = getImageData(div);
      value = calculatePercentage(data);
      setEfficiencyReadoutValue value

    getImageData = (div) ->
      src = $(div).find('img').get(0)
      c = $ '<canvas id="myCanvas" width="200" height="100" style="border:1px solid #c3c3c3;">'
      d = c.get(0).getContext("2d");
      img=new Image()
      img.src=src
      d.drawImage(src,0,0);
      #TODO change getImageData call to use dimensions like c.width, c.height), 
      #they are currently both zero for some reason, and that triggers an exception.
      #wiki.log 'c.width c.height ', c.width(), c.height()
      imageData = d.getImageData(0, 0, 200, 100);
      imageData.data

    calculatePercentage = (data) ->
      #wiki.log  'Efficiency calcPercentage  Start'
      # TODO add real calcs here. Returning a constant now to work out the update issues.
      # Data format info. CanvasPixelArray
      # https://developer.mozilla.org/en-US/docs/DOM/CanvasPixelArray
      # http://www.w3.org/TR/2011/WD-2dcontext-20110525/#canvaspixelarray
      # https://developer.mozilla.org/en-US/docs/HTML/Canvas/Pixel_manipulation_with_canvas
      # Thinking of 4-Bins, to track the distribution of 8-bit data in 4D. RGB + Transparency.
      # Find the bins is with greatest numbers of pixels, with a gap between bins. Calc percentage.
      #wiki.log 'Efficiency calculatePercentage num Bytes of data (4 per pixel) ', data.length
      #wiki.log 'Efficiency calculatePercentage some bytes doe 1st pixel. R, G, B, T ', data[0], data[1], data[2], data[3]
      return 47
      #wiki.log  'Efficiency calculatePercentage  End'

    setEfficiencyReadoutValue = (value) =>
      if this.efficiencyDIV
        $(this.efficiencyDIV)[0].innerHTML = '<p class="readout">' + value + '%</p><p>Pattern Efficiency from Photographic Statistics</p>'
	
    calculate locate()