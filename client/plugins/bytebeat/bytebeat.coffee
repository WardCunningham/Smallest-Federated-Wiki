window.plugins.bytebeat =
  emit: (div, item) ->
    div.append "<p>#{colorCode(item.text)} <a href='#' class='play'>&#9654;</a></div></p>"
    audioCheck()
  bind: (div, item) ->
    div.find('a').click => @play div, item
    div.dblclick => 
      @stop(div)
      wiki.textEditor div, item
  play: (div, item) ->
    @stop(div)
    $("<audio>").attr({autoplay: true, src: makeURL(item.text), controls: "controls"}).appendTo(div)
  stop: (div) ->
    @audio(div).remove()
  audio: (div) ->
    div.find("audio")
    

colorCode = (text) ->
  text
    .replace(/\bt((<<|>>)\d+)?\b/g, (m) -> "<span class='symbol'>#{m}</span>")
    .replace(/\n/g, '<br>')

audioCheck = ->
  elm = document.createElement("audio")
  throw "You don't seem to have a browser that supports audio." unless typeof (elm.play)


# Adapted from ...
# Code in ~2 hours by Bemmu, idea and sound code snippet from Viznut.

makeSampleFunction = (text) ->
  js = text
    .replace(/sin/g, "Math.sin")
    .replace(/cos/g, "Math.cos")
    .replace(/tan/g, "Math.tan")
    .replace(/floor/g, "Math.floor")
    .replace(/ceil/g, "Math.ceil")
  eval "var f = function (t) {return #{js}}"
  f

frequency = 8000

generateSound = (f) ->
  seconds = 32.767
  samples = frequency * seconds
  t = 0
  while t < samples
    ((f(t++)) & 0xff) * 256

b = (values) ->
  strings = ((if num>15 then "%" else "%0") + num.toString(16) for num in values)
  strings.join('').toUpperCase()

c = (str) ->
  if str.length is 1
    str.charCodeAt 0
  else
    (c code for code in str)

split32bitValueToBytes = (l) ->
  [ l & 0xff, (l & 0xff00) >> 8, (l & 0xff0000) >> 16, (l & 0xff000000) >> 24 ]

FMTSubChunk = (channels, bitsPerSample, frequency) ->
  byteRate = frequency * channels * bitsPerSample / 8
  blockAlign = channels * bitsPerSample / 8
  [].concat c("fmt "), split32bitValueToBytes(16), [ 1, 0 ], [ channels, 0 ], split32bitValueToBytes(frequency), split32bitValueToBytes(byteRate), [ blockAlign, 0 ], [ bitsPerSample, 0 ]

sampleArrayToData = (sampleArray, bitsPerSample) ->
  return sampleArray  if bitsPerSample is 8
  throw "Only 8 or 16 bit supported." unless bitsPerSample is 16
  data = []
  for samp in sampleArray
    data.push 0xff & samp
    data.push (0xff00 & samp) >> 8
  data

dataSubChunk = (channels, bitsPerSample, sampleArray) ->
  [].concat c("data"), split32bitValueToBytes(sampleArray.length * channels * bitsPerSample / 8), sampleArrayToData(sampleArray, bitsPerSample)

chunkSize = (fmt, data) ->
  split32bitValueToBytes 4 + (8 + fmt.length) + (8 + data.length)

RIFFChunk = (channels, bitsPerSample, frequency, sampleArray) ->
  fmt = FMTSubChunk(channels, bitsPerSample, frequency)
  data = dataSubChunk(channels, bitsPerSample, sampleArray)
  header = [].concat(c("RIFF"), chunkSize(fmt, data), c("WAVE"))
  [].concat header, fmt, data

makeURL = (text) ->
  bitsPerSample = 16
  samples = generateSound makeSampleFunction text
  channels = 1
  "data:audio/x-wav," + b(RIFFChunk(channels, bitsPerSample, frequency, samples))

