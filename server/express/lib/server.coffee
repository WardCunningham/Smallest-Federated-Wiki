# **server.coffee** is the main guts of the express version
# of Smallest Federated Wiki.  The CLI and Farm are just front ends
# for setting arguments, and spawning servers.  In a complex system
# you would probably want to replace the CLI/Farm with your own code,
# and use server.coffee directly.
#
#### Dependencies 
# anything not in the standard library is included in the repo, or
# can be installed with an:
#     npm install
express = require('express')
fs = require('fs')
path = require('path')
http = require('http')
hbs = require('hbs')
pagehandler = require('./page.coffee')
_ = require('../../../client/js/underscore-min.js')
favicon = require('./favicon.coffee')
passport = require('passport')
OpenIDstrat = require('passport-openid').Strategy

module.exports = exports = (argv) ->
  # This takes the argv object that is passed in and then does its
  # best to supply sane defaults for any arguments that are missing.
  argv = require('./defaultargs')(argv)

  # Passes the arguments to the pagehandler, so it knows where to find
  # data, and default data.
  pagehandler.setup(argv)

  #### Setting up Authentication
  # The owner of a server is simply the open id url that the wiki
  # has been claimed with.  It is persisted at argv.status/open_id.identity,
  # and kept in memory as owner
  owner = ''

  # Attempts figure out if the wiki is claimed or not,
  # if it is it returns the owner, if not it sets the owner
  # to the id, if it is provided.
  setOwner = (id) ->
    idpath = "#{argv.status}/open_id.identity"
    path.exists(idpath, (exists) ->
      if exists
        fs.readFile(idpath, (err, data) ->
          if err then throw err
          owner += data)
      else if id
        fs.writeFile(idpath, id, (err) ->
          if err then throw err
          console.log("Claimed by #{id}")
          owner = id
        )
    )

  setOwner()

  # This is the middleware that make sure that an action can only be taken
  # by the owner, and returns 403 if someone else tries.
  authenticated = (req, res, next) ->
    console.log(owner) if argv.debug
    console.log(req.user?.id) if argv.debug
    if req.isAuthenticated() and req.user.id is owner
      next()
    else res.send('Access forbidden', 403)

  # Simplest possible way to serialize and deserialize a user.
  passport.serializeUser( (user, done) ->
    done(null, user.id)
  )

  passport.deserializeUser( (id, done) ->
    done(null, {id})
  )

  # Telling passport to use the OpenID strategy. And establish
  # owner as the test of id.
  passport.use(new OpenIDstrat({
    returnURL: "#{argv.u}/login/openid/complete"
    realm: "#{argv.u}"
    identifierField: 'identifier'
  },
  ((id, done) ->
    console.log(id, done) if argv.debug
    process.nextTick( ->
      if owner
        if id is owner
          done(null, {id})
        else
          done(null, false)
      else
        setOwner(id)
        done(null, {id})
    )
  )))

  #### Express configuration
  app = express.createServer()

  # This sets up all the standard express server options,
  # including setting up hbs to use handlebars/mustache templates
  # saved with a .html extension, and no layout.
  app.configure( ->
    app.set('views', path.join(__dirname, '..', '/views'))
    app.set('view engine', 'hbs')
    app.register('.html', hbs)
    app.set('view options', layout: false)
    app.use(express.cookieParser())
    app.use(express.bodyParser())
    app.use(express.methodOverride())
    app.use(express.session({ secret: 'notsecret'}))
    app.use(passport.initialize())
    app.use(passport.session())
    app.use(app.router)
    app.use(express.static(argv.c))
  )

  # Sets up standard environments.
  # Dev turns on console.log debugging as well as showing the stack on err.
  app.configure('development', ->
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
    argv.debug = console? and true
  )

  # Shows all of the options a server is using when it is started in dev mode.
  console.log argv if argv.debug

  # Production swallows errors as best it can.
  app.configure('production', ->
    app.use(express.errorHandler())
  )

  ##### Redirects
  # Common redirects that may get used throughout the routes.
  app.redirect('index', (req, res) ->
    '/view/welcome-visitors'
  )

  app.redirect('remotefav', (req, res) ->
    "http://#{req.params[0]}"
  )

  app.redirect('notyourwiki', (req, res) ->
    '/notyourwiki'
  )

  ##### Get routes
  # Routes have mostly been kept together by http verb, with the exception
  # of the openID related routes which are at the end together.
  app.get(///^/remote/([a-zA-Z0-9:\.-]+)/([a-z0-9-]+)\.json$///, (req, res) ->
    getopts = {
      host: req.params[0]
      port: 80
      path: "/#{req.params[1]}.json"
    }
    # TODO: This needs more robust error handling, just trying to
    # keep it from taking down the server.
    http.get(getopts, (resp) ->
      responsedata = ''
      resp.on('data', (chunk) ->
        responsedata += chunk
      )
      resp.on('error', (e) ->
        console.log("Error: #{e}")
      )
      resp.on('end', ->
        res.json(JSON.parse(responsedata))
      )
    ).on('error', (e) ->
      console.log "Error: #{e}"
    )
  )

  app.get('*.json', (req, res) ->
    file = req.params[0]
    pagehandler.get(file, (page) =>
      res.json(page)
    )
  )

  app.get('*style.css', (req, res) ->
    res.sendfile("#{argv.r}/server/express/views/style.css")
  )

  app.get(///^((/[a-zA-Z0-9:.-]+/[a-z0-9-]+)+)$///, (req, res) ->
    #res.sendfile("#{argv.r}/server/sinatra/views/static.html")
    urlPages = (i for i in req.params[0].split('/') by 2)[1..]
    urlLocs = (j for j in req.params[0].split('/')[1..] by 2)
    info = {
      pages: []
      authenticated: req.isAuthenticated()
      status: if owner
        if req.isAuthenticated()
          'logout'
        else 'login'
      else 'claim'
    }
    for page, idx in urlPages
      if urlLocs[idx] is 'view'
        pageDiv = {page}
      else
        pageDiv = {page, origin: "data-site=#{urlLocs[idx]}"}
      info.pages.push(pageDiv)
    res.render('static.html', info)
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

  app.get(///^/remote/([a-zA-Z0-9:\.-]+/favicon.png)$///, (req, res) ->
        res.redirect('remotefav')
  )

  ##### Put routes

  app.put(/^\/page\/([a-z0-9-]+)\/action$/i, authenticated, (req, res) ->
    action = JSON.parse(req.body.action)
    # actionCB handles all of the possible actions to be taken on a page,
    actionCB = (page) ->
      console.log page if argv.debug
      switch action.type
        when 'move'
          page.story = _(action.order).map((i) ->
            _(page.story).find( (story) ->
              console.log(i, story) if argv.debug
              i is story.id
            )
          )
          
        when 'add'
          before = 0
          for item, index in page.story
            if item.id is action.after
              before = index
          page.story[before...before] = action.item

        when 'remove'
          page.story = (item for item in page.story when item?.id isnt action.id)

        when 'edit'
          page.story = ((if item.id is action.id then action.item else item) for item in page.story)

        else
          console.log "Unfamiliar action: #{action}"
      if not page.journal
        page.journal = []
      page.journal.push(action)
      pagehandler.put(req.params[0], page, (err) =>
        if err then throw err
        res.send('ok')
        console.log 'saved' if argv.debug
      )
    console.log(action) if argv.debug
    # TODO: test action.fork
    if action.fork
      getopts = {
        host: action.fork
        port: 80
        path: "/#{req.params[0]}.json"
      }
      # TODO: This needs more robust error handling, just trying to
      # keep it from taking down the server.
      http.get(getopts, (resp) ->
        responsedata = ''
        resp.on('data', (chunk) ->
          responsedata += chunk
        )
        resp.on('error', (e) ->
          console.log("Error: #{e}")
        )
        resp.on('end', ->
          actionCB(JSON.parse(responsedata))
        )
      ).on('error', (e) ->
        console.log "Error: #{e}"
      )
    else
      pagehandler.get(req.params[0], actionCB)
  )

  ##### Routes used for openID authentication

  app.post('/login',
    passport.authenticate('openid', { failureRedirect: 'notyourwiki'}),
    (req, res) ->
      res.redirect('index')
  )

  app.post('/logout', (req, res) ->
    req.logout()
    res.redirect('index')
  )

  app.get('/logout', (req, res) ->
    req.logout()
    res.redirect('index')
  )

  app.get('/login/openid/complete',
    passport.authenticate('openid', { failureRedirect: 'notyourwiki'}),
    (req, res) ->
      res.redirect('index')
  )

  app.get('/notyourwiki', (req, res) ->
    res.send('This is not your wiki!', 403)
  )

  app.get('/', (req, res) ->
    res.redirect('index')
  )

  #### Starting the server.
  app.listen(argv.p, argv.o if argv.o)
  console.log("Smallest Federated Wiki server listening on #{app.address().port} in mode: #{app.settings.env}")
