# **server.coffee** is the main guts of the express version
# of (Smallest Federated Wiki)[https://github.com/WardCunningham/Smallest-Federated-Wiki].
# The CLI and Farm are just front ends
# for setting arguments, and spawning servers.  In a complex system
# you would probably want to replace the CLI/Farm with your own code,
# and use server.coffee directly.
#
#### Dependencies ####
# anything not in the standard library is included in the repo, or
# can be installed with an:
#     npm install
mkdirp = require('mkdirp')
express = require('express')
fs = require('fs')
path = require('path')
http = require('http')
hbs = require('hbs')
child_process = require('child_process')
random = require('./random_id')
passportImport = require('passport')
OpenIDstrat = require('passport-openid').Strategy
defargs = require('./defaultargs')

# pageFactory can be easily replaced here by requiring your own page handler
# factory, which gets called with the argv object, and then has get and put
# methods that accept the same arguments and callbacks. That would be the
# easiest way to use the Smallest Federated Wiki with a database backend.
pageFactory = require('./page')

# When server factory is first started attempt to
# set version to the git sha id of the last commit.
version = ''
gitVersion = child_process.exec('git rev-parse HEAD', (err, stdout, stderr) ->
  version = stdout
  )

# Set export objects for node and coffee to a function that generates a sfw server.
module.exports = exports = (argv) ->
  # Create the main application object, app.
  app = express.createServer()
  # defaultargs.coffee exports a function that takes the argv object
  # that is passed in and then does its
  # best to supply sane defaults for any arguments that are missing.
  argv = defargs(argv)
  app.startOpts = do ->
    options = {}
    for own k, v of argv
      options[k] = v
    options
  # Construct authentication handler.
  passport = new passportImport.Passport()
  # Tell pagehandler where to find data, and default data.
  app.pagehandler = pagehandler = pageFactory(argv)

  #### Setting up Authentication ####
  # The owner of a server is simply the open id url that the wiki
  # has been claimed with.  It is persisted at argv.status/open_id.identity,
  # and kept in memory as owner.  A falsy owner implies an unclaimed wiki.
  owner = ''

  # Attempt to figure out if the wiki is claimed or not,
  # if it is return the owner, if not set the owner
  # to the id if it is provided.
  setOwner = (id, cb) ->
    path.exists(argv.id, (exists) ->
      if exists
        fs.readFile(argv.id, (err, data) ->
          if err then throw err
          owner += data
          cb())
      else if id
        fs.writeFile(argv.id, id, (err) ->
          if err then throw err
          console.log("Claimed by #{id}")
          owner = id
          cb())
      else
        cb()
    )

  # If claimed, make sure that an action can only be taken
  # by the owner, and returns 403 if someone else tries.
  authenticated = (req, res, next) ->
    unless owner
      next()
    else if req.isAuthenticated() and req.user.id is owner
      next()
    else res.send('Access Forbidden', 403)

  # Simplest possible way to serialize and deserialize a user.
  passport.serializeUser( (user, done) ->
    done(null, user.id)
  )

  passport.deserializeUser( (id, done) ->
    done(null, {id})
  )

  # Tell passport to use the OpenID strategy. And establish
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
        setOwner id, ->
          done(null, {id})
    )
  )))

  # Handle errors thrown by passport openid by returning the oops page
  # with the error message.
  openIDErr = (err, req, res, next) ->
    console.log err
    if err.message[0..5] is 'OpenID'
      res.render('oops.html', {status: 401, msg:err.message})
    else
      next(err)


  remoteGet = (remote, slug, cb) ->
    [host, port] = remote.split(':')
    getopts = {
      host: host
      port: port or 80
      path: "/#{slug}.json"
    }
    # TODO: This needs more robust error handling, just trying to
    # keep it from taking down the server.
    http.get(getopts, (resp) ->
      responsedata = ''
      resp.on('data', (chunk) ->
        responsedata += chunk
      )
      resp.on('error', (e) ->
        cb(e, 'Page not found', 404)
      )
      resp.on('end', ->
        if responsedata
          cb(null, JSON.parse(responsedata), resp.statusCode)
        else
          cb(null, 'Page not found', 404)
      )
    ).on('error', (e) ->
      cb(e, 'Page not found', 404)
    )

  #### Express configuration ####
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
    app.use(openIDErr)
  )

  ##### Set up standard environments. #####
  # In dev mode turn on console.log debugging as well as showing the stack on err.
  app.configure('development', ->
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
    argv.debug = console? and true
  )

  # Show all of the options a server is using.
  console.log argv if argv.debug

  # Swallow errors when in production.
  app.configure('production', ->
    app.use(express.errorHandler())
  )

  #### Routes ####
  # Routes currently make up the bulk of the Express port of
  # Smallest Federated Wiki. Most routes use literal names,
  # or regexes to match, and then access req.params directly.

  ##### Redirects #####
  # Common redirects that may get used throughout the routes.
  app.redirect('index', (req, res) ->
    '/view/welcome-visitors'
  )

  app.redirect('remotefav', (req, res) ->
    "http://#{req.params[0]}"
  )

  app.redirect('oops', (req, res) ->
    '/oops'
  )

  ##### Get routes #####
  # Routes have mostly been kept together by http verb, with the exception
  # of the openID related routes which are at the end together.

  app.get('/style.css', (req, res) ->
    res.sendfile("#{argv.r}/server/express/views/style.css")
  )

  # Main route for initial contact.  Allows us to
  # link into a specific set of pages, local and remote.
  # Can also be handled by the client, but it also sets up
  # the login status, and related footer html, which the client
  # relies on to know if it is logged in or not.
  app.get(///^((/[a-zA-Z0-9:.-]+/[a-z0-9-]+)+)/?$///, (req, res) ->
    urlPages = (i for i in req.params[0].split('/') by 2)[1..]
    urlLocs = (j for j in req.params[0].split('/')[1..] by 2)
    info = {
      pages: []
      authenticated: req.isAuthenticated()
      loginStatus: if owner
        if req.isAuthenticated()
          'logout'
        else 'login'
      else 'claim'
      sha: version
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

  ###### Json Routes ######
  # Handle fetching local and remote json pages.
  # Local pages are handled by the pagehandler module.
  app.get(///^/([a-z0-9-]+)\.json$///, (req, res) ->
    file = req.params[0]
    pagehandler.get(file, (e, page, status) ->
      if e then throw e
      res.json(page, status)
    )
  )

  # Remote pages use the http client to retrieve the page
  # and sends it to the client.  TODO: consider caching remote pages locally.
  app.get(///^/remote/([a-zA-Z0-9:\.-]+)/([a-z0-9-]+)\.json$///, (req, res) ->
    remoteGet(req.params[0], req.params[1], (e, page, status) ->
      if e then console.log "remoteGet error:", e if argv.debug
      res.send(page, status)
    )
  )

  ###### Favicon Routes ######
  # If favLoc doesn't exist send 404 and let the client
  # deal with it.
  favLoc = path.join(argv.status, 'favicon.png')
  app.get('/favicon.png', (req,res) ->
    res.sendfile(favLoc)
  )

  # Accept favicon image posted to the server, and if it does not already exist
  # save it.
  app.post('/favicon.png', authenticated, (req, res) ->
    favicon = req.body.image.replace(///^data:image/png;base64,///, "")
    buf = new Buffer(favicon, 'base64')
    path.exists(argv.status, (exists) ->
      if exists
        fs.writeFile(favLoc, buf, (e) ->
          if e then throw e
          res.send('Favicon Saved')
        )
      else
        mkdirp(argv.status, 0777, ->
          fs.writeFile(favLoc, buf, (e) ->
            if e then throw e
            res.send('Favicon Saved')
          )
        )
    )
  )

  # Redirect remote favicons to the server they are needed from.
  app.get(///^/remote/([a-zA-Z0-9:\.-]+/favicon.png)$///, (req, res) ->
    res.redirect('remotefav')
  )

  ###### Meta Routes ######
  # Send an array of pages in the database via json
  app.get('/system/slugs.json', (req, res) ->
    fs.readdir(argv.db, (err, files) ->
      res.send(files)
    )
  )

  ##### Put routes #####

  app.put(/^\/page\/([a-z0-9-]+)\/action$/i, authenticated, (req, res) ->
    action = JSON.parse(req.body.action)
    # Handle all of the possible actions to be taken on a page,
    actionCB = (e, page, status) ->
      if e then throw e
      if status is 404
        res.send(page, status)
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

        when 'create'
          page.story or []

        else
          console.log "Unfamiliar action: #{action}"
          page.story

      # Add a blank journal if it does not exist.
      # And add what happened to the journal.
      if not page.journal
        page.journal = []
      if action.fork
        page.journal.push({type: "fork", site: action.fork})
        delete action.fork
      page.journal.push(action)
      console.log page
      pagehandler.put(req.params[0], page, (e) ->
        if e then throw e
        res.send('ok')
        console.log 'saved' if argv.debug
      )

    console.log(action) if argv.debug
    # If the action is a fork, get the page from the remote server,
    # otherwise ask pagehandler for it.
    if action.fork
      remoteGet(action.fork, req.params[0], actionCB)
    else if action.type is 'create'
      # Prevent attempt to write circular structure
      itemCopy = JSON.parse(JSON.stringify(action.item))
      pagehandler.get(req.params[0], (e, page, status) ->
        unless status is 404
          res.send('Page already exists.', 409)
        else
          actionCB(null, itemCopy)
      )
    else
      pagehandler.get(req.params[0], actionCB)
  )

  ##### Routes used for openID authentication #####
  # Redirect to oops when login fails.
  app.post('/login',
    passport.authenticate('openid', { failureRedirect: 'oops'}),
    (req, res) ->
      res.redirect('index')
  )

  # Logout when /logout is hit with any http method.
  app.all('/logout', (req, res) ->
    req.logout()
    res.redirect('index')
  )

  # Route that the openID provider redirects user to after login.
  app.get('/login/openid/complete',
    passport.authenticate('openid', { failureRedirect: 'oops'}),
    (req, res) ->
      res.redirect('index')
  )

  # Return the oops page when login fails.
  app.get('/oops', (req, res) ->
    res.render('oops.html', {status: 403, msg:'This is not your wiki!'})
  )

  # Traditional request to / redirects to index :)
  app.get('/', (req, res) ->
    res.redirect('index')
  )

  #### Start the server ####
  # Wait to make sure owner is known before listening.
  setOwner( null, ->
    app.listen(argv.p, argv.o if argv.o)
    console.log("Smallest Federated Wiki server listening on #{app.address().port} in mode: #{app.settings.env}")
  )
  # Return app when called, so that it can be watched for events and shutdown with .close() externally.
  app
