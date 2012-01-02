# server.coffee
express = require('express')
fs = require('fs')
path = require('path')
http = require('http')
_ = require('../../../client/js/underscore-min.js')
pagehandler = require('./page.coffee')
favicon = require('./favicon.coffee')

# App configuration

module.exports = (argv) ->
  app = express.createServer()

  app.configure( ->
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
    '/view/welcome-visitors'
    #res.sendfile("#{argv.r}/server/sinatra/views/static.html")
  )

  # Get routes

  app.get('/', (req, res) ->
    res.redirect('index')
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
    elements = req.params[0].split('/')
    #pages = while ((site = elements.shift()) and (id = elements.shift()))
    #  if site is 'view' or site is 'my'
    #    {id}
    #  else
    #    {id, site}
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
    favicon.get(path.join(argv.status, "favicon.png"), (loc) ->
      res.sendfile(loc)
    )
  )


  app.get('/*', (req, res, next) ->
    file = req.params[0]
    next()
  )

  app.get(///^/remote/([a-zA-Z0-9:\.-]+)/([a-z0-9-]+)\.json$///, (req, res)->
    console.log req.params
    getopts = {
      host: req.params[0]
      port: 80
      path: req.params[1]
    }
    console.log getopts
    http.get(getopts, (resp) ->
      res.sendfile(resp.body)
    )
  )

  # Put routes

  app.put(/^\/page\/([a-z0-9-]+)\/action$/i, (req, res) ->
    action = JSON.parse(req.body.action)
    actionCB = (page) ->
      console.log page if argv.debug
      switch action.type
        when 'move'
          page.story = _(action.order).map((i) ->
            _(page.story).find( (story) ->
              console.log i, story
              i is story.id
            )
          )
          
        when 'add'
          before = -1
          for item, index in page.story
            if item.id is action.after
              before = action.after
          page.story.splice(index, 0, action.item)

        when 'remove'
          page.story = (item for item in page.story when item?.id isnt action.id)

        when 'edit'
          page.story = _(page.story).map( (i) ->
            if i.id is action.id
              action.item
            else
              i
          )

        else
          console.log "Unfamiliar action: #{action}"
      if not page.journal
        page.journal = []
      page.journal.push(action)
      pagehandler.put(path.join(argv.db, req.params[0]), page, (err) =>
        if err then throw err
        res.send('ok')
        console.log 'saved' if argv.debug
      )
    console.log(action) if argv.debug
    # TODO: implement action.fork
    pagehandler.get(path.join(argv.db, req.params[0]), actionCB)
  )

  app.listen(argv.p, argv.o if argv.o)

  console.log("Smallest Federated Wiki server listening on #{app.address().port} in mode: #{app.settings.env}")
