# **page.coffee**
# This is the module for interacting with pages persisted on the server.
# Right now everything is stored using json flat files.

#### Require some stuff, nothing special here.
fs = require('fs')
path = require('path')
mkdirp = require('mkdirp')
random_id = require('./random_id')

# Set up an empty object named itself that will have public methods
# added to it and be exported.
module.exports = exports = (argv) ->

  #### Private utility methods.
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
  
  blank_page = (file, cb) ->
    freshpage = {
      title: file
      story: [
        { type: 'factory', id: random_id() }
      ]
      journal: []
    }
    itself.put(file, freshpage, (err) ->
      if err then throw err
    )
    cb(freshpage)
  
  queue = []
  
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
              blank_page(file, cb)
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
  
  working = 0
  serial = (item) ->
    if item
      working = 1
      fileio(item.file, item.page, (data) ->
        process.nextTick( ->
          serial(queue.shift())
        )
        item.cb(data)
      )
    else
      working = 0
  
  itself = {}
  # get takes a slug and a callback, it then calls the callback with the page
  # it wanted, or the same named page from default-data, or creates a blank page
  # and sends it back.
  itself.get = (file, cb) ->
    queue.push({file, page: null, cb})
    serial(queue.shift()) unless working
  
    
  # put takes a slugged name, the page as a json object, and a callback.
  # calls cb with an err if anything goes wrong.
  #  Async, sequential queue for persisting data.
  itself.put =  (file, page, cb) ->
      queue.push({file, page, cb})
      serial(queue.shift()) unless working

  itself
