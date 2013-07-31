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

# Standard lib
fs = require 'fs'
path = require 'path'
http = require 'http'
child_process = require 'child_process'
spawn = child_process.spawn

# From npm
mkdirp = require 'mkdirp'
express = require 'express'
hbs = require 'hbs'
glob = require 'glob'
es = require 'event-stream'
JSONStream = require 'JSONStream'
async = require 'async'
f = require('flates')


# Local files
random = require './random_id'
defargs = require './defaultargs'
wiki = require '../client/lib/wiki'
pluginsFactory = require './plugins'
Persona = require './persona_auth'

# pageFactory can be easily replaced here by requiring your own page handler
# factory, which gets called with the argv object, and then has get and put
# methods that accept the same arguments and callbacks.
# Currently './page' and './leveldb' are provided.
pageFactory = require './page'

render = (page) ->
  return f.h1(
    f.a({href: '/', style: 'text-decoration: none'},
      f.img({height: '32px', src: '/favicon.png'})) +
      ' ' + page.title) +
    f.div {class: "story"},
      page.story.map((story) ->
        if story.type is 'paragraph'
          f.div {class: "item paragraph"}, f.p(story.text)
        else if story.type is 'image'
          f.div {class: "item image"},
            f.img({class: "thumbnail", src: story.url}),
            f.p(story.text or story.caption or 'uploaded image')
        else f.div {class: "item error"}, f.p(story.type)
      ).join('\n')

# Set export objects for node and coffee to a function that generates a sfw server.
module.exports = exports = (argv) ->
  # Create the main application object, app.
  app = express()

  # defaultargs.coffee exports a function that takes the argv object
  # that is passed in and then does its
  # best to supply sane defaults for any arguments that are missing.
  argv = defargs(argv)

  app.startOpts = do ->
    options = {}
    for own k, v of argv
      options[k] = v
    options

  log = (stuff...) ->
    console.log stuff if argv.debug

  loga = (stuff...) ->
    console.log stuff


  errorHandler = (req, res, next) ->
    fired = false
    res.e = (error, status) ->
      if !fired
        fired = true
        res.statusCode = status or 500
        res.end 'Server ' + error
        log "Res sent:", res.statusCode, error
      else
        log "Allready fired", error
    next()

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
    fs.exists argv.id, (exists) ->
      if exists
        fs.readFile(argv.id, (err, data) ->
          if err then return cb err
          owner += data
          cb())
      else if id
        fs.writeFile(argv.id, id, (err) ->
          if err then return cb err
          loga "Claimed by #{id}"
          owner = id
          cb())
      else
        cb()

  #### Middleware ####
  #
  # Allow json to be got cross origin.
  cors = (req, res, next) ->
    res.header('Access-Control-Allow-Origin', '*')
    next()


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
      resp.on 'data', (chunk) ->
        responsedata += chunk

      resp.on 'error', (e) ->
        cb(e, 'Page not found', 404)

      resp.on 'end', ->
        if resp.statusCode == 404
          cb(null, 'Page not found', 404)
        else if responsedata
          cb(null, JSON.parse(responsedata), resp.statusCode)
        else
          cb(null, 'Page not found', 404)

    ).on 'error', (e) ->
      cb(e, 'Page not found', 404)

  persona = Persona(log, loga, argv)

  # Persona middleware needs access to this module's owner variable
  getOwner = ->
    owner

  #### Express configuration ####
  # Set up all the standard express server options,
  # including hbs to use handlebars/mustache templates
  # saved with a .html extension, and no layout.
  app.configure ->
    app.set('views', path.join(__dirname, '..', '/views'))
    app.set('view engine', 'html')
    app.engine('html', hbs.__express)
    app.set('view options', layout: false)
    app.use(express.cookieParser())
    app.use(express.bodyParser())
    app.use(express.methodOverride())
    app.use(express.session({ secret: 'notsecret'}))
    app.use(persona.authenticate_session(getOwner))
    app.use(errorHandler)
    app.use(app.router)
    app.use(express.static(argv.c))

  ##### Set up standard environments. #####
  # In dev mode turn on console.log debugging as well as showing the stack on err.
  app.configure 'development', ->
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
    argv.debug = console? and true

  # Show all of the options a server is using.
  log argv

  # Swallow errors when in production.
  app.configure 'production', ->
    app.use(express.errorHandler())

  # authenticated indicates that we have a logged in user.
  # The req.isAuthenticated returns true on an unclaimed wiki
  # so we must also check that we have a logged in user
  is_authenticated = (req) ->
    if req.isAuthenticated()
      if !! req.session.email
        return true
    return false

  #### Routes ####
  # Routes currently make up the bulk of the Express port of
  # Smallest Federated Wiki. Most routes use literal names,
  # or regexes to match, and then access req.params directly.

  ##### Redirects #####
  # Common redirects that may get used throughout the routes.
  index = argv.s + '.html'

  oops = '/oops'

  ##### Get routes #####
  # Routes have mostly been kept together by http verb, with the exception
  # of the openID related routes which are at the end together.

  # Main route for initial contact.  Allows us to
  # link into a specific set of pages, local and remote.
  # Can also be handled by the client, but it also sets up
  # the login status, and related footer html, which the client
  # relies on to know if it is logged in or not.
  app.get ///^((/[a-zA-Z0-9:.-]+/[a-z0-9-]+(_rev\d+)?)+)/?$///, (req, res) ->
    urlPages = (i for i in req.params[0].split('/') by 2)[1..]
    urlLocs = (j for j in req.params[0].split('/')[1..] by 2)
    info = {
      pages: []
      authenticated: is_authenticated(req)
      user: req.session.email
      loginStatus: if owner
        if req.isAuthenticated()
          'logout'
        else 'login'
      else 'claim'
    }
    for page, idx in urlPages
      if urlLocs[idx] is 'view'
        pageDiv = {page}
      else
        pageDiv = {page, origin: """data-site=#{urlLocs[idx]}"""}
      info.pages.push(pageDiv)
    res.render('static.html', info)

  app.get ///([a-z0-9-]+)\.html$///, (req, res, next) ->
    file = req.params[0]
    log(file)
    if file is 'runtests'
      return next()
    pagehandler.get file, (e, page, status) ->
      if e then return res.e e
      if status is 404
        return res.send page, status
      info = {
      	pages: [
      	  page: file
      	  generated: """data-server-generated=true"""
      	  story: wiki.resolveLinks(render(page))
      	]
      	user: req.session.email
      	authenticated: is_authenticated(req)
      	loginStatus: if owner
      	  if req.isAuthenticated()
      	    'logout'
      	  else 'login'
      	else 'claim'
      }
      res.render('static.html', info)

  app.get ///system/factories.json///, (req, res) ->
    res.status(200)
    res.header('Content-Type', 'application/json')
    glob path.join(argv.c, 'plugins', '*', 'factory.json'), (e, files) ->
      if e then return res.e(e)
      files = files.map (file) ->
        return fs.createReadStream(file).on('error', res.e).pipe(JSONStream.parse())

      es.concat.apply(null, files)
        .on('error', res.e)
        .pipe(JSONStream.stringify())
        .pipe(res)


  ###### Json Routes ######
  # Handle fetching local and remote json pages.
  # Local pages are handled by the pagehandler module.
  app.get ///^/([a-z0-9-]+)\.json$///, cors, (req, res) ->
    file = req.params[0]
    pagehandler.get file, (e, page, status) ->
      if e then return res.e e
      res.send(status or 200, page)

  # Remote pages use the http client to retrieve the page
  # and sends it to the client.  TODO: consider caching remote pages locally.
  app.get ///^/remote/([a-zA-Z0-9:\.-]+)/([a-z0-9-]+)\.json$///, (req, res) ->
    remoteGet req.params[0], req.params[1], (e, page, status) ->
      if e
        log "remoteGet error:", e
        return res.e e
      res.send(status or 200, page)

  ###### Favicon Routes ######
  # If favLoc doesn't exist send 404 and let the client
  # deal with it.
  favLoc = path.join(argv.status, 'favicon.png')
  app.get '/favicon.png', cors, (req,res) ->
    res.sendfile(favLoc)

  authenticated = (req, res, next) ->
    if req.isAuthenticated()
      next()
    else
      console.log 'rejecting', req.path
      res.send(403)

  # Accept favicon image posted to the server, and if it does not already exist
  # save it.
  app.post '/favicon.png', authenticated, (req, res) ->
    favicon = req.body.image.replace(///^data:image/png;base64,///, "")
    buf = new Buffer(favicon, 'base64')
    fs.exists argv.status, (exists) ->
      if exists
        fs.writeFile favLoc, buf, (e) ->
          if e then return res.e e
          res.send('Favicon Saved')

      else
        mkdirp argv.status, ->
          fs.writeFile favLoc, buf, (e) ->
            if e then return res.e e
            res.send('Favicon Saved')

  # Redirect remote favicons to the server they are needed from.
  app.get ///^/remote/([a-zA-Z0-9:\.-]+/favicon.png)$///, (req, res) ->
    remotefav = "http://#{req.params[0]}"

    res.redirect(remotefav)

  ###### Meta Routes ######
  # Send an array of pages in the database via json
  app.get '/system/slugs.json', cors, (req, res) ->
    fs.readdir argv.db, (e, files) ->
      if e then return res.e e
      res.send(files)

  app.get '/system/plugins.json', cors, (req, res) ->
    fs.readdir path.join(argv.c, 'plugins'), (e, files) ->
      if e then return res.e e
      res.send(files)

  app.get '/system/sitemap.json', cors, (req, res) ->
    pagehandler.pages (e, sitemap) ->
      return res.e(e) if e
      res.json(sitemap)


  app.post '/persona_login',
           cors,
           persona.verify_assertion(getOwner, setOwner)


  app.post '/persona_logout', cors, (req, res) ->
    req.session.destroy (err) ->
      res.send(err || "OK")

  ##### Put routes #####

  app.put /^\/page\/([a-z0-9-]+)\/action$/i, authenticated, (req, res) ->
    action = JSON.parse(req.body.action)
    # Handle all of the possible actions to be taken on a page,
    actionCB = (e, page, status) ->
      #if e then return res.e e
      if status is 404
        res.send(page, status)
      # Using Coffee-Scripts implicit returns we assign page.story to the
      # result of a list comprehension by way of a switch expression.
      try
        page.story = switch action.type
          when 'move'
            action.order.map (id) ->
              page.story.filter((para) ->
                id == para.id
              )[0] or throw('Ignoring move. Try reload.')

          when 'add'
            idx = page.story.map((para) -> para.id).indexOf(action.after) + 1
            page.story.splice(idx, 0, action.item)
            page.story

          when 'remove'
            page.story.filter (para) ->
              para?.id != action.id

          when 'edit'
            page.story.map (para) ->
              if para.id is action.id
                action.item
              else
                para


          when 'create', 'fork'
            page.story or []

          else
            log "Unfamiliar action:", action
            page.story
      catch e
        return res.e e

      # Add a blank journal if it does not exist.
      # And add what happened to the journal.
      if not page.journal
        page.journal = []
      if action.fork
        page.journal.push({type: "fork", site: action.fork})
        delete action.fork
      page.journal.push(action)
      pagehandler.put req.params[0], page, (e) ->
        if e then return res.e e
        res.send('ok')
        log 'saved'

    log action
    # If the action is a fork, get the page from the remote server,
    # otherwise ask pagehandler for it.
    if action.fork
      remoteGet(action.fork, req.params[0], actionCB)
    else if action.type is 'create'
      # Prevent attempt to write circular structure
      itemCopy = JSON.parse(JSON.stringify(action.item))
      pagehandler.get req.params[0], (e, page, status) ->
        if e then return actionCB(e)
        unless status is 404
          res.send('Page already exists.', 409)
        else
          actionCB(null, itemCopy)

    else if action.type == 'fork'
      if action.item # push
        itemCopy = JSON.parse(JSON.stringify(action.item))
        delete action.item
        actionCB(null, itemCopy)
      else # pull
        remoteGet(action.site, req.params[0], actionCB)
    else
      pagehandler.get(req.params[0], actionCB)

  # Return the oops page when login fails.
  app.get '/oops', (req, res) ->
    res.statusCode = 403
    res.render('oops.html', {msg:'This is not your wiki!'})

  # Traditional request to / redirects to index :)
  app.get '/', (req, res) ->
    res.redirect(index)


  #### Start the server ####
  # Wait to make sure owner is known before listening.
  setOwner null, (e) ->
    # Throw if you can't find the initial owner
    if e then throw e
    server = app.listen argv.p, argv.o, ->
      app.emit 'listening'
      loga "Smallest Federated Wiki server listening on", argv.p, "in mode:", app.settings.env
    ### Plugins ###
    # Should replace most WebSocketServers below.
    plugins = pluginsFactory(argv)
    plugins.startServers({server: server, argv})

  # Return app when called, so that it can be watched for events and shutdown with .close() externally.
  app

