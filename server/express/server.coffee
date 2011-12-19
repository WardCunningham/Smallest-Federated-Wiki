# server.coffee

express = require('express')
fs = require('fs')
path = require('path')
http = require('http')
_ = require('../../client/js/underscore-min.js')
pagehandler = require('./page.coffee')
favicon = require('./favicon.coffee')
optimist = require('optimist')

# Handle command line options
argv = optimist
  .usage('Usage: $0')
  .options('d',
    alias     : 'data'
    default   : ''
    describe  : 'location of flat file data'
  )
  .options('h',
    alias     : 'help'
    boolean   : true
    describe  : 'Show this help info and exit'
  )
  .options('o',
    alias     : 'host'
    default   : ''
    describe  : 'Host to accept connections on, falsy == any'
  )
  .options('p',
    alias     : 'port'
    default   : 3000
    describe  : 'Port'
  )
  .options('r',
    alias     : 'root'
    default   : path.join("#{__dirname}", '..', '..')
    describe  : 'Aplication root folder'
  )
  .argv

if argv.h
  optimist.showHelp()
  process.exit()
if not argv.d
  argv.d = path.relative("#{__dirname}", "#{argv.r}/data")
if not argv.c
  argv.c = path.relative("#{__dirname}", "#{argv.r}/client")
argv.db = path.join(argv.d, 'pages')

# App configuration

app = module.exports = express.createServer()

app.configure( ->
  #app.set('views', '../views')
  #app.register('.haml', require('hamljs'))
  #app.set('view engine', 'haml')
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use(express.static(argv.c))
)

app.configure('development', ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
  argv.debug = console? and true
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
  res.sendfile("#{argv.r}/server/sinatra/views/static.html")
)

app.get('*.json', (req, res) ->
  file = req.params[0]
  pagehandler.get(path.join(argv.db, file), (page) =>
    res.json(page)
  )
)

app.get('*style.css', (req, res) ->
  res.sendfile("#{argv.r}/server/sinatra/views/style.css")
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
  res.sendfile("#{argv.r}/server/sinatra/views/static.html")
)

app.get('/plugins/factory.js', (req, res) ->
  catalog = """
            window.catalog = {
              "ByteBeat": {"menu": "8-bit Music by Formula"},
              "MathJax": {"menu": "TeX Formatted Equations"},
              "Calculator": {"menu": "Running Sums for Expenses"}
            };

            """
  fs.readFile("#{argv.r}/client/plugins/meta-factory.js", (err, data) =>
    if err then throw err
    res.header('Content-Type', 'application/javascript')
    res.send(catalog + data)
  )
)

app.get('/favicon.png', (req,res) ->
  favicon.get("#{argv.status}/favicon.png", (loc) ->
    res.sendfile(loc)
  )
)


app.get('/*', (req, res, next) ->
  file = req.params[0]
  next()
)

# Put routes

app.put(/^\/page\/([a-z0-9-]+)\/action$/i, (req, res) ->
  action = JSON.parse(req.body.action)
  console.log(action) if argv.debug
  # TODO: implement action.fork
  pagehandler.get(path.join(argv.db, req.params[0]), (page) ->
    console.log page.story if argv.debug
    page.story = switch action.type
      when 'move'
        _(action.order).map((i) ->
          _(page.story).find( (story) ->
            console.log i, story
            i is story.id
          )
        )
        
      when 'add'
        before = -1
        for i in page.story
          if i.id = action.after
            before = page.story.indexOf(i)
        before += 1
        page.story.splice(before, 0, action.item)
        page.story


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
    pagehandler.put(path.join(argv.db, req.params[0]), page, (err) =>
      if err then throw err
      res.send('ok')
      console.log 'saved' if argv.debug
    )
  )
)

app.listen(argv.p, argv.o if argv.o)

console.log("Smallest Federated Wiki server listening on #{app.address().port} in mode: #{app.settings.env}")
