# **server.coffee** is the main guts of the express version
# of (Smallest Federated Wiki)[https://github.com/WardCunningham/Smallest-Federated-Wiki].
# The CLI and Farm are just front ends
# for setting arguments, and spawning servers.  In a complex system
# you would probably want to replace the CLI/Farm with your own code,
# and use server.coffee directly.

# Set export objects for node and coffee to a function that generates a sfw server.
module.exports = exports = (argv) ->
  #### Dependencies 
  # anything not in the standard library is included in the repo, or
  # can be installed with an:
  #     npm install
  express = require('express')
  fs = require('fs')
  path = require('path')
  http = require('http')
  hbs = require('hbs')
  favicon = require('./favicon.coffee')
  passport = require('passport')
  OpenIDstrat = require('passport-openid').Strategy
  # defaultargs.coffee exports a function that takes the argv object that is passed in and then does its
  # best to supply sane defaults for any arguments that are missing.
  argv = require('./defaultargs')(argv)

  # Tell pagehandler where to find data, and default data.
  pagehandler = require('./page')(argv)

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

  # Make sure that an action can only be taken
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
    console.log(id, done) #if argv.debug
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
  # Set up all the standard express server options,
  # including hbs to use handlebars/mustache templates
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

  ##### Set up standard environments.
  # Turn on console.log debugging as well as showing the stack on err.
  app.configure('development', ->
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
    argv.debug = console? and true
  )

  # Show all of the options a server is using when it is started in dev mode.
  console.log argv if argv.debug

  # Swallow errors when in production.
  app.configure('production', ->
    app.use(express.errorHandler())
  )

  #### Routes
  # Routes currently make up the bulk of the Express port of
  # Smallest Federated Wiki. Most routes use literal names,
  # or regexes to match, and then access req.params directly.

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

  app.get('/style.css', (req, res) ->
    res.sendfile("#{argv.r}/server/express/views/style.css")
  )

  # Main route for initial contact.  This is what allows us to
  # link into a specific set of pages, local and remote.
  # This can also be handled by the client, but it also sets up
  # the login status, and related footer html, which the client
  # relies on to know if it is logged in or not.
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

  ###### Json Routes
  # These handle fetching local and remote json pages.
  # Local pages are handled by the pagehandler, module.
  app.get(///^/([a-z0-9-]+)\.json$///, (req, res) ->
    file = req.params[0]
    pagehandler.get(file, (page) =>
      res.json(page)
    )
  )

  # Remote pages use the http client to retrieve the page
  # and sends it to the client.  TODO: consider caching remote pages locally.
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

  ###### Favicon Routes
  # Local favicons are handled by the favicon module.
  app.get('/favicon.png', (req,res) ->
    favicon.get(path.join(argv.status, "favicon.png"), (loc) ->
      res.sendfile(loc)
    )
  )

  # Remote favicons redirect to the server they are needed from.
  app.get(///^/remote/([a-zA-Z0-9:\.-]+/favicon.png)$///, (req, res) ->
    res.redirect('remotefav')
  )

  ##### Put routes

  # actionCB returns a function that handles all of the possible actions to be taken on a page,
    

  app.put(/^\/page\/([a-z0-9-]+)\/action$/i, authenticated, (req, res) ->
    action = JSON.parse(req.body.action)
    actionCB = (page) ->
      console.log page if argv.debug
      # Using Coffee-Scripts implicit returns we assign page.story to the
      # result of a list comprehension by way of a switch expression.
      page.story = switch action.type
        when 'move'
          (stuff for stuff in page.story when item is stuff.id)[0] for item in action.order

        when 'add'
          before = 0
          for item, index in page.story
            if item.id is action.after
              before = 1 + index
          page.story[before...before] = action.item
          page.story

        when 'remove'
          item for item in page.story when item?.id isnt action.id

        when 'edit'
          (if item.id is action.id then action.item else item) for item in page.story

        else
          console.log "Unfamiliar action: #{action}"
          page.story

      if not page.journal
        page.journal = []
      page.journal.push(action)
      pagehandler.put(req.params[0], page, (err) =>
        if err then throw err
        res.send('ok')
        console.log 'saved' if argv.debug
      )
    console.log(action) if argv.debug
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
        resp.on('end', -
          actionCB(JSON.parse(responsedata))
        )
      ).on('error', (e) ->
        console.log "Error: #{e}"
      )
    else
      pagehandler.get(req.params[0], actionCB)
  )

  ##### Routes used for openID authentication
  # Currently throws an error to next(err) when id is blank.
  # TODO: Handle that error more gracefully.
  app.post('/login',
    passport.authenticate('openid', { failureRedirect: 'notyourwiki'}),
    (req, res) ->
      res.redirect('index')
  )

  # Get and post routes to logout.  The post one is the only one that
  # gets used from client, but the get logout route seemed useful as well.
  app.post('/logout', (req, res) ->
    req.logout()
    res.redirect('index')
  )

  app.get('/logout', (req, res) ->
    req.logout()
    res.redirect('index')
  )

  # Route that the openID provider redirects user to after login.
  app.get('/login/openid/complete',
    passport.authenticate('openid', { failureRedirect: 'notyourwiki'}),
    (req, res) ->
      res.redirect('index')
  )

  # Simple Access forbidden message when someone tries to log into a wiki
  # they do not own.
  app.get('/notyourwiki', (req, res) ->
    res.send('This is not your wiki!', 403)
  )

  # Traditional request to / redirects to index :)
  app.get('/', (req, res) ->
    res.redirect('index')
  )

  #### Starting the server.
  app.listen(argv.p, argv.o if argv.o)
  console.log("Smallest Federated Wiki server listening on #{app.address().port} in mode: #{app.settings.env}")
  app
