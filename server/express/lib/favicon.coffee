# favicon.coffee

Canvas = require('canvas')
fs = require('fs')
mkdirp = require('mkdirp')
path = require('path')

itself = {}

# Utility functions
hsltorgb = (h, s, l) ->
  h = (h % 360) / 360
  m2 = l * (s + 1)
  m1 = ((l * 2) - m2)
  hue = (num) ->
    if num < 0
      num += 1
    else if num > 1
      num -= 1
    if (num * 6) < 1
      m1 + (m2 - m1) * num * 6
    else if (num * 2) < 1
      m2
    else if (num * 3) < 2
      m1 + (m2 - m1) * (2/3 - num) * 6
    else
      m1
  [(hue(h+1/3)*255), (hue(h) * 255), (hue(h - 1/3) * 255)]


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
    setTimeout( ->
      cb(loc)
    , 100
    )
  )
  light = hsltorgb(Math.random() * 360, .78, .50)
  dark = hsltorgb(Math.random() * 360, .78, .25)
  angle = 2 * (Math.random() - 0.5)
  sin = Math.sin angle
  cos = Math.cos angle
  scale = (Math.abs(sin) + Math.abs(cos))
  colprep = (col, p) ->
    Math.floor(light[col]*p + dark[col]*(1-p))%255
  for x in [0..31]
    for y in [0..31]
      p = if sin >= 0 then sin * x + cos * y else -sin * (31 - x) + cos * y
      p = p / 31 / scale
      ctx.fillStyle = "rgba(#{colprep(0, p)}, #{colprep(1, p)}, #{colprep(2, p)}, 1)"
      ctx.fillRect(x, y, 1, 1)

# Exported functions

itself.get = (loc, cb) ->
  console.log loc
  path.exists(loc, (exists) ->
    if exists
      cb(loc)
    else
      locroot = path.dirname(loc)
      path.exists(locroot, (exists) ->
        if exists
          create(loc, cb)
        else
          mkdirp(locroot, 0777, ->
            create(loc, cb)
          )
      )
  )

if path.basename(process.argv[1]) is 'favicon.coffee'
  # If run from the command line, create a favicon.png in provided loc or cwd and exit
  create(process.argv[2] or "#{__dirname}/favicon.png", (loc) ->
    require('child_process').spawn('chromium', ["#{loc}"])
  )


module.exports = itself
