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
      # Call real calcs here. 
      # By calling a strategy function here, we can try multiple strategy functions,
      # keeping the algorithm code separate from the setup and reporting. (For now at least)
      # Data format info. CanvasPixelArray
      # https://developer.mozilla.org/en-US/docs/DOM/CanvasPixelArray
      # http://www.w3.org/TR/2011/WD-2dcontext-20110525/#canvaspixelarray
      # https://developer.mozilla.org/en-US/docs/HTML/Canvas/Pixel_manipulation_with_canvas
      return calculateStrategy_GrayBinary(data)

    calculateStrategy_GrayBinary = (data) ->
	  # a very simple first attempt, using two bins of gray scale values.
      numPix = data.length / 4    # bytes divided by four bytes per pixel. RGB + transparency
	
      lumaMin = 255
      lumaMax = 0
      lumas = []

      for i in [0..numPix]
        R = data[ i * 4 + 0 ]
        G = data[ i * 4 + 1 ]
        B = data[ i * 4 + 2 ]
        # Get gray scale vaue, by weighting RGB values (various literature references on this)
        luma = lumas[i] = 0.299 * R + 0.587 * G + 0.114 * B
        if luma > lumaMax  then lumaMax = luma
        if luma < lumaMin  then lumaMin = luma
      
      # count the values high and low
      lumaMid = (lumaMax - lumaMin ) /2
      lumaLowCount = 0
      lumaHighCount = 0
      for l in lumas
        if (l <= lumaMid)
          lumaLowCount++
        else
          lumaHighCount++
		
      percentage = lumaHighCount/numPix
      return percentage

    setEfficiencyReadoutValue = (value) =>
      if this.efficiencyDIV
        $(this.efficiencyDIV)[0].innerHTML = '<p class="readout">' + value + '%</p><p>Pattern Efficiency from Photographic Statistics</p>'
	
    calculate locate()