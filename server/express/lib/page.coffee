# ** page.coffee **
# This is the module for interacting with pages persisted on the server.
# Right now everything is stored using json flat files.

#### Require some stuff, nothing special here.
fs = require('fs')
path = require('path')
mkdirp = require('mkdirp')
random_id = require('./random_id')

# Set up an empty object named itself that will have public methods
# added to it and be exported.
module.exports = exports = itself = {}

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

blank_page = (loc, cb) ->
  freshpage = {
    title: path.basename(loc)
    story: [
      { type: 'factory', id: random_id() }
    ]
    journal: []
  }
  itself.put(loc, freshpage, (err) ->
    if err then throw err
  )
  cb(freshpage)

#### Exported functions
# Setup just takes the same argv element as everywhere else, so that
# page.coffee can find everything it needs
itself.setup = (@argv) ->

# get takes a slug and a callback, it then calls the callback with the page
# it wanted, or the same named page from default-data, or creates a blank page
# and sends it back.
itself.get = (file, cb) ->
  loc = path.join(@argv.db, file)
  path.exists(loc, (exists) =>
    if exists
      load_parse(loc, cb)
    else
      defloc = path.join(@argv.r, 'default-data', 'pages', file)
      path.exists(defloc, (exists) ->
        if exists
          load_parse_copy(defloc, file, cb)
        else
          blank_page(loc, cb)
      )
  )
  
# put takes a slugged name, the page as a json object, and a callback.
# calls cb with an err if anything goes wrong.
itself.put = (file, page, cb) ->
  loc = path.join(@argv.db, file)
  page = JSON.stringify(page)
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

