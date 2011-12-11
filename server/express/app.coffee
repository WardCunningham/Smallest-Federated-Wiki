# app.coffee

express = require('express')
fs = require('fs')
path = require('path')
http = require('http')


# All user defineable options

opt =
  port: 3000
  host: ''                                # Anything falsey will accept all hosts
  root: path.normalize("#{__dirname}/../..") # App root defaults to one level above cwd
  db: path.normalize("#{__dirname}/../../spec/data/pages")

# App configuration

app = module.exports = express.createServer()

app.configure( ->
  #app.set('views', '../server/views')
  #app.register('.haml', require('hamljs'))
  #app.set('view engine', 'haml')
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static("#{opt.root}/client"))
)

app.configure('development', ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
)

app.configure('production', ->
  app.use(express.errorHandler())
)

# Redirects

app.redirect('index', (req, res) ->
  '/static.html'
  )

# Get routes

app.get('/', (req, res) ->
  res.redirect('index')
)

app.get('*.json', (req, res) ->
  file = req.params[0]
  fs.readFile(path.join(opt.db, file), (err, data) =>
    if err then throw err
    res.json(JSON.parse(data))
  )
)

viewdomain = /// ^/(
  (view|([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+))
  /[a-z0-9-]+(/
  (view|([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+))
  /[a-z0-9-]+)*
)$ ///

app.get(viewdomain, (req, res) ->
  # TODO: Make this actually render the template instead of redirecting to index
  elements = req.params[0].split('/')
  pages = while ((site = elements.shift()) and (id = elements.shift()))
    if site is 'view' or site is 'my'
      {id}
    else
      {id, site}
  res.redirect('index')
)

app.get('/plugins/factory.js', (req, res) ->
  catalog = """
            window.catalog = {
              "ByteBeat": {"menu": "8-bit Music by Formula"},
              "MathJax": {"menu": "TeX Formatted Equations"},
              "Calculator": {"menu": "Running Sums for Expenses"}
            };

            """
  fs.readFile("#{opt.root}/client/plugins/meta-factory.js", (err, data) =>
    if err then throw err
    res.header('Content-Type', 'application/javascript')
    res.send(catalog + data)
  )
)

app.get('/*', (req, res, next) ->
  file = req.params[0]
  next()
)

# Put routes

app.put(/^\/page\/([a-z0-9-]+)\/action$/i, (req, res) ->
  action = JSON.parse(req.body.action)
  # TODO: implement action.fork
  fs.readFile(path.join(opt.db, req.params[0]), (err, page) =>
    if err then throw err
    page = JSON.parse(page)
    switch action.type
      when 'move'
        oldstory = page.story
        page.story = []
        for id in action.order
          for p in oldstory
            if id is p.id
              page.story.push p

      when 'add'
        before = -1
        for i in page.story
          if action.after is i.id
            before = page.story.indexOf(i)
        before += 1
        page.story.splice(before, 0, action.item)

      when 'remove'
        for i in page.story
          if i.id is action.id
            page.story.splice(page.story.indexOf(i), 1)

      when 'edit'
        for i in page.story
          if i.id is action.id
            page.story.splice(page.story.indexOf(i), 1, action.item)

      else
        console.log "Unfamiliar action: #{action}"

    if not page.journal
      page.journal = []
    page.journal.push(action)
    fs.writeFile(path.join(opt.db, req.params[0]), JSON.stringify(page), (err) =>
      if err then throw err
      res.send('ok')
      console.log 'saved'
    )
  )
)

app.listen(opt.port, opt.host if opt.host)


console.log("Smallest Federated Wiki server listening on #{app.address().port} in mode: #{app.settings.env}")
