# server.coffee

express = require('express')
fs = require('fs')
path = require('path')
http = require('http')
_ = require('../../client/js/underscore-min.js')

# All user defineable options

opt = {
  port: 3000
  host: ''                                    # Anything falsey will accept all hosts
  root: path.join("#{__dirname}", '..', '..') # App root defaults to two levels above cwd
}

# paths relative to opt.root
opt.db = path.relative("#{__dirname}", "#{opt.root}/data/pages")
opt.client = path.relative("#{__dirname}", "#{opt.root}/client")

# App configuration

app = module.exports = express.createServer()

app.configure( ->
  #app.set('views', '../views')
  #app.register('.haml', require('hamljs'))
  #app.set('view engine', 'haml')
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(opt.client))
)

app.configure('development', ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
  opt.debug = console? and true
)

app.configure('production', ->
  app.use(express.errorHandler())
  opt.debug = false
)

# Redirects

app.redirect('index', (req, res) ->
  '/static.html'
  )

# Get routes

app.get('/', (req, res) ->
  res.sendfile("#{opt.root}/server/sinatra/views/static.html")
)

app.get('*.json', (req, res) ->
  file = req.params[0]
  fs.readFile(path.join(opt.db, file), (err, data) =>
    if err then throw err
    res.json(JSON.parse(data))
  )
)

app.get('*style.css', (req, res) ->
  res.sendfile("#{opt.root}/server/views/sinatra/style.css")
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
  #res.redirect('index')
  res.sendfile("#{opt.root}/server/views/static.html")
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

app.get('/favicon.png', (req,res) ->
  res.sendfile("#{opt.root}/data/status/favicon.png")
)


app.get('/*', (req, res, next) ->
  file = req.params[0]
  next()
)

# Put routes

app.put(/^\/page\/([a-z0-9-]+)\/action$/i, (req, res) ->
  action = JSON.parse(req.body.action)
  console.log(action) if opt.debug
  # TODO: implement action.fork
  fs.readFile(path.join(opt.db, req.params[0]), (err, page) =>
    if err then throw err
    page = JSON.parse(page)
    console.log page.story if opt.debug
    page.story = switch action.type
      when 'move'
        _(action.order).chain()
          .map((i) ->
            _(page.story).find( (item) ->
              i is item.id
            )
          ).value()
        
      when 'add'
        _(page.story).chain()
          .map( (i) ->
            if i.id is action.after
              [i, action.item]
            else
              i
          ).flatten()
          .value()

      when 'remove'
        _(page.story).reject( (i) ->
          i.id is action.id
        )

      when 'edit'
        _(page.story).map( (i) ->
            if i.id is action.id
              action.item
            else
              i
        )

      else
        console.log "Unfamiliar action: #{action}"
        page.story

    if not page.journal
      page.journal = []
    page.journal.push(action)
    fs.writeFile(path.join(opt.db, req.params[0]), JSON.stringify(page), (err) =>
      if err then throw err
      res.send('ok')
      console.log 'saved' if opt.debug
    )
  )
)

app.listen(opt.port, opt.host if opt.host)

console.log("Smallest Federated Wiki server listening on #{app.address().port} in mode: #{app.settings.env}")
