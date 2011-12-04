window.plugins.bytebeat =
  emit: (div, item) ->
    div.append "<p>#{colorCode(item.text)} <a href='#'>&#9654;</a><div id='player'></div></p>"
    audioCheck()
  bind: (div, item) ->
    div.find('a').click -> play item.text
    div.dblclick -> 
      stop()
      wiki.textEditor div, item

colorCode = (text) ->
  text
    .replace(/\bt((<<|>>)\d+)?\b/g, (m) -> "<font color='red'>#{m}</font>")
    .replace(/\n/g, '<br>')

play = (text)->
  playDataURI makeURL text

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

generateSound = (f)->
  frequency = 8000
  seconds = 32.767
  sampleArray = []
  t = 0
  while t < frequency * seconds
    sample = (f(t)) & 0xff
    sample *= 256
    sample = 0  if sample < 0
    sample = 65535  if sample > 65535
    sampleArray.push sample
    t++
  [ frequency, sampleArray ]

b = (values) ->
  out = ""
  i = 0
  while i < values.length
    hex = values[i].toString(16)
    hex = "0" + hex  if hex.length is 1
    out += "%" + hex
    i++
  out.toUpperCase()

c = (str) ->
  if str.length is 1
    str.charCodeAt 0
  else
    out = []
    i = 0

    while i < str.length
      out.push c(str[i])
      i++
    out

split32bitValueToBytes = (l) ->
  [ l & 0xff, (l & 0xff00) >> 8, (l & 0xff0000) >> 16, (l & 0xff000000) >> 24 ]

FMTSubChunk = (channels, bitsPerSample, frequency) ->
  byteRate = frequency * channels * bitsPerSample / 8
  blockAlign = channels * bitsPerSample / 8
  [].concat c("fmt "), split32bitValueToBytes(16), [ 1, 0 ], [ channels, 0 ], split32bitValueToBytes(frequency), split32bitValueToBytes(byteRate), [ blockAlign, 0 ], [ bitsPerSample, 0 ]

sampleArrayToData = (sampleArray, bitsPerSample) ->
  return sampleArray  if bitsPerSample is 8
  if bitsPerSample isnt 16
    alert "Only 8 or 16 bit supported."
    return
  data = []
  i = 0
  while i < sampleArray.length
    data.push 0xff & sampleArray[i]
    data.push (0xff00 & sampleArray[i]) >> 8
    i++
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
  generated = generateSound makeSampleFunction text
  frequency = generated[0]
  samples = generated[1]
  channels = 1
  "data:audio/x-wav," + b(RIFFChunk(channels, bitsPerSample, frequency, samples))

el = undefined

stop = ->
  document.getElementById("player").removeChild el  if el
  el = null

playDataURI = (uri) ->
  stop()
  el = document.createElement("audio")
  el.setAttribute "autoplay", true
  el.setAttribute "src", uri
  el.setAttribute "controls", "controls"
  document.getElementById("player").appendChild el
