# favicon.coffee

Canvas = require('canvas')
fs = require('fs')
mkdirp = require('mkdirp')
path = require('path')

itself = {}

# Utility functions
hsltorgb = (h, s, l) ->
  h = (h % 360) / 360
  m2 = if l <= .05 then l * (s + 1) else l + s - l * s
  m1 = l * 2 - m2
  hue = (h) ->
    h = if h < 0 then h + 1 else (if h > 1 then h - 1 else h)
    if h * 6 < 1
      m1 + (m2 - m1) * h * 6
    else if h * 2 < 1
      m2
    else if h * 3 < 2
      m1 + (m2 - m1) * (2/3 -h) * 6
    else
      m1
  [Math.floor(hue(h+1/2)*256), Math.floor(hue(h) * 256), Math.floor(hue(h - 1/3) * 256)]


create = (loc, cb) ->
  canvas = new Canvas(32, 32)
  ctx = canvas.getContext('2d')
  out = fs.createWriteStream(loc)
  stream = canvas.createPNGStream()
  stream.on('data', (chunk) ->
    out.write(chunk)
  )
  stream.on('end', () ->
    console.log('saved png')
    console.log loc, cb
    setTimeout( ->
      cb(loc)
    , 1000
    )
  )
  light = hsltorgb(Math.floor(Math.random() * 256), .78, .50)
  dark = hsltorgb(Math.floor(Math.random() * 256), .78, .25)
  angle = 2 * (Math.random() - 0.5)
  sin = Math.sin angle
  cos = Math.cos angle
  scale = (Math.abs(sin) + Math.abs(cos))
  for x in [0..31]
    for y in [0..31]
      p = if sin >= 0 then sin * x + cos * y else ((0-sin) * (31 - x) + cos * y)
      p = p / 31
      p = p / scale
      color = "rgba(#{Math.floor(light[0]*p + dark[0]*(1-p))}, #{Math.floor(light[1]*p + dark[1]*(1-p))}, #{Math.floor(light[2]*p + dark[2]*(1-p))}, 1)"
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)

# Exported functions


itself.get = (loc, cb) ->
  path.exists(loc, (exists) ->
    if exists
      cb(loc)
    else
      locroot = path.dirname(loc)
      console.log locroot
      path.exists(locroot, (exists) ->
        if exists
          create(loc, cb)
        else
          mkdirp(locroot, 0777, ->
            create(loc, cb)
          )
      )
  )

module.exports = itself
