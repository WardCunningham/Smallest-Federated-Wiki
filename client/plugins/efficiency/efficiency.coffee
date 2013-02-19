window.plugins.efficiency =

  emit: (div, item) ->
    div.addClass 'data'
    $('<p />').addClass('readout').appendTo(div).text("0%")
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
      $(".item:lt(#{idx})").filter('.image:last')

    calculate = (div) ->
      calculatePercentage getImageData(div)

    display = (value) ->
      div.find('p:first').text "#{value.toFixed 1}%"

    getImageData = (div) ->
      img = new Image;
      img.src = $(div).data('item').url
      w = img.width
      h = img.height
      c = $ '<canvas id="myCanvas" width="#{w}" height="#{h}">'
      d = c.get(0).getContext("2d");
      d.drawImage(img,0,0);
      #TODO change getImageData call to use dimensions like c.width, c.height), 
      #they are currently both zero for some reason, and that triggers an exception.
      # wiki.log 'efficiency img w, h', w, h, 'c w, h ', c.width(), c.height()
      imageData = d.getImageData(0, 0, w, h);  
      imageData.data

    calculatePercentage = (data) ->
      # Call real calcs here. 
      # By calling a strategy function here, we can try multiple strategy functions,
      # keeping the algorithm code separate from the setup and reporting. (For now at least)
      # Data format info. CanvasPixelArray
      # https://developer.mozilla.org/en-US/docs/DOM/CanvasPixelArray
      # http://www.w3.org/TR/2011/WD-2dcontext-20110525/#canvaspixelarray
      # https://developer.mozilla.org/en-US/docs/HTML/Canvas/Pixel_manipulation_with_canvas
      # Different calc strategies follow:
      lumas = window.plugins.efficiency.getGrayLumaFromRGBT(data)
      return window.plugins.efficiency.calculateStrategy_GrayBinary(lumas)
      #return window.plugins.efficiency.calculateStrategy_GrayIterativeClustering(lumas)

    display calculate locate()


  getGrayLumaFromRGBT: (rgbt) ->
    numPix = rgbt.length / 4    # bytes divided by four bytes per pixel. RGB + transparency
    # wiki.log 'getGrayLumaFromRGBT numPix: ', numPix
    lumas = []
    for i in [0..(numPix-1)]
      R = rgbt[ i * 4 + 0 ]
      G = rgbt[ i * 4 + 1 ]
      B = rgbt[ i * 4 + 2 ]
      # Get gray scale vaue, by weighting RGB values (various literature references on this)
      #lumas[i] = 0.299 * R + 0.587 * G + 0.114 * B  
      lumas[i] = (0.30 * R) + (0.60 * G) + (0.10 * B)   # close to above, but convenient for test expectations.

    return lumas

  calculateStrategy_GrayBinary: (lumas) ->
	  # a very simple first attempt, using two bins of gray scale values.

      lumaMin = Math.min lumas...
      lumaMax = Math.max lumas...
      numLumas = lumas.length

      # count the values high and low
      lumaMid = (lumaMax - lumaMin ) /2.0 + lumaMin
      # wiki.log 'lumaMin, lumaMax, lumaMid: ', lumaMin, lumaMax, lumaMid
      lumaLowCount = 0
      lumaHighCount = 0
      for l in lumas
        if (l <= lumaMid)
          lumaLowCount++
        else
          lumaHighCount++

      # wiki.log 'calculateStrategy_GrayBinary: numLumas, lowCount, high count: ', numLumas, lumaLowCount, lumaHighCount

      percentage = lumaHighCount/numLumas * 100
      return percentage

  calculateStrategy_GrayIterativeClustering: (lumas) ->
      # iterative algorithm. a special one-dimensional case of the k-means clustering algorithm.
      # stops once a threshold Convergence Goal is met
      # TODO fix/find bug whereby refreshing the view yields a different result than initial result.
	  # CAUTION: This algorithm has been proven to converge at a local minimum—meaning that a different 
	  # initial threshold may give a different final result.
	  # http://en.wikipedia.org/wiki/Thresholding_%28image_processing%29

      THRESHOLD_CONVERGENCE_GOAL = 5
      MAX_TRIES = 10

      lumaMin = Math.min lumas...
      lumaMax = Math.max lumas...
      numLumas = lumas.length
      numPix = numLumas

      # initial threshold guess
      thresholdInitial = (lumaMax - lumaMin )/2 + lumaMin
      threshold = thresholdInitial

      lumaHighCount = 0

      # Loop until threashold doesn't change much. Emulating a Do/While loop w/ break at end
      numTries = 0 # increment it here to prevent a surprise infinite loop
      while (numTries < MAX_TRIES)
        numTries++  

        # Segment image into object and background pixels, creating two sets:
        lumasLow = []
        lumasHigh = []
        lumaLowCount = 0
        lumaHighCount = 0
        for l in lumas
          if (l <= threshold)
            #lumasLow[lumaLowCount] = l
            lumasLow.push(l)
            lumaLowCount++
          else
            #lumasHigh[lumaHighCount] = l
            if (l isnt NaN)
              lumasHigh.push(l)
              lumaHighCount++

        # compute average of each set. (Could do this as part of upper step, for speed, but less reuse.)
        lumaLowTotal = 0
        for low in lumasLow
          if (!isNaN(low))
            lumaLowTotal += low
          else
            # wiki.log 'Found a NaN low ', low

        lumaAvgLow = 0
        if (lumaLowCount > 0)
          lumaAvgLow = lumaLowTotal/lumaLowCount

        lumaHighTotal = 0
        # wiki.log 'lumasHigh ', lumasHigh
        for high in lumasHigh
          if (!isNaN(high))
            lumaHighTotal += high
          else
            # wiki.log 'Found a NaN high', high
          ## wiki.log 'lumaHighTotal ', lumaHighTotal, '  high ', high

        lumaAvgHigh = 0
        if (lumaHighCount > 0)
          lumaAvgHigh = lumaHighTotal/lumaHighCount

        # Calc new threshold ihat is the average of the two sets above
        # wiki.log 'lumaLowCount ', lumaLowCount, '  lumaHighCount ', lumaHighCount
        # wiki.log 'lumaLowTotal ', lumaLowTotal, '  lumaHighTotal ', lumaHighTotal
        # wiki.log 'lumaAvgLow ', lumaAvgLow, '  lumaAvgHigh ', lumaAvgHigh

        threshold = (lumaAvgHigh - lumaAvgLow) / 2  + lumaAvgLow

        thresholdDiff = Math.abs(threshold - thresholdInitial)
        # wiki.log 'numTries ', numTries, '  thresholdDiff ', thresholdDiff, '  thresholdInitial ', thresholdInitial, '  threshold new ', threshold
        if (thresholdDiff <= THRESHOLD_CONVERGENCE_GOAL  or numTries > MAX_TRIES)
          # wiki.log "we're done"
          break  # were done iterating
        else
          thresholdInitial = threshold

      percentage = lumaHighCount/numPix * 100
      if (percentage > 100.0) then percentage = 100
      return percentage
      # End of above calc stratgey function  TODO make it smaller and remove this comment

