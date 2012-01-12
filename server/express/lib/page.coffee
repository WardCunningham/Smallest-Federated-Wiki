# page.coffee
# Module for interacting with pages on file system

fs = require('fs')
path = require('path')
mkdirp = require('mkdirp')
random_id = require('./random_id')

itself = {}

load_parse = (loc, cb) ->
  fs.readFile(loc, (err, data) ->
    if err then throw err
    cb(JSON.parse(data))
  )

load_parse_copy = (defloc, loc, cb) ->
  fs.readFile(defloc, (err, data) ->
    if err then throw err
    page = JSON.parse(data)
    cb(page)
    itself.put(loc, page, (err) ->
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

# Exported functions

itself.setup = (opts) ->
  @argv = opts


itself.get = (file, cb) ->
  loc = path.join(@argv.db, file)
  path.exists(loc, (exists) =>
    if exists
      load_parse(loc, cb)
    else
      defloc = path.join(@argv.r, 'default-data', 'pages', file)
      path.exists(defloc, (exists) ->
        if exists
          load_parse_copy(defloc, loc, cb)
        else
          blank_page(loc, cb)
      )
  )
  

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

module.exports = itself
