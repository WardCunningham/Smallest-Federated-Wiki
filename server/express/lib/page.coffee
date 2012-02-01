# **page.coffee**
# Module for interacting with pages persisted on the server.
# Everything is stored using json flat files.

#### Require some stuff, nothing special here. ####
fs = require('fs')
path = require('path')
mkdirp = require('mkdirp')
random_id = require('./random_id')

# Export a function that generates a page handler when called options object.
module.exports = exports = (argv) ->

  #### Private utility methods. ####
  load_parse = (loc, cb) ->
    fs.readFile(loc, (err, data) ->
      if err then throw err
      cb(JSON.parse(data))
    )
  
  load_parse_copy = (defloc, file, cb) ->
    fs.readFile(defloc, (err, data) ->
      if err then throw err
      page = JSON.parse(data)
      cb(page)
      itself.put(file, page, (err) ->
        if err then throw err
      )
    )

  # Reads and writes are async, but serially queued to avoid race conditions.
  queue = []

  # Main file io function, when called without page it reads, when called with page
  # it writes.
  fileio = (file, page, cb) ->
    loc = path.join(argv.db, file)
    unless page?
      path.exists(loc, (exists) =>
        if exists
          load_parse(loc, cb)
        else
          defloc = path.join(argv.r, 'default-data', 'pages', file)
          path.exists(defloc, (exists) ->
            if exists
              load_parse_copy(defloc, file, cb)
            else
              cb('Page not found', 404)
          )
      )
    else
      page = JSON.stringify(page, null, 2)
      path.exists(path.dirname(loc), (exists) ->
        if exists
          fs.writeFile(loc, page, (err) ->
            cb(err)
          )
        else
          mkdirp(path.dirname(loc), 0777, (err) ->
            if err then throw err
            fs.writeFile(loc, page, (err) ->
              cb(err)
            )
          )
      )

  # Control variable that tells if the serial queue is currently happening.
  # Set back to 0 when all jobs are complete.
  working = 0

  # Keep file io working on queued jobs, but don't block the main thread.
  serial = (item) ->
    if item
      working = 1
      fileio(item.file, item.page, (data, status) ->
        process.nextTick( ->
          serial(queue.shift())
        )
        item.cb(data, status)
      )
    else
      working = 0
  
  itself = {}
  # get takes a slug and a callback, it then calls the callback with the page
  # it wanted, or the same named page from default-data, or a 404 status and message
  # and sends it back.
  itself.get = (file, cb) ->
    queue.push({file, page: null, cb})
    serial(queue.shift()) unless working
  
    
  # put takes a slugged name, the page as a json object, and a callback.
  # calls cb with an err if anything goes wrong.
  itself.put =  (file, page, cb) ->
      queue.push({file, page, cb})
      serial(queue.shift()) unless working

  itself
