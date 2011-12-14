# page.coffee
# Module for interacting with pages on file system

fs = require('fs')
path = require('path')
mkdirp = require('mkdirp')
random_id = require('./random_id')

itself = {}

# Untility functions

load_parse = (path, callback) ->
  fs.readFile(path, (err, data) ->
    if err then throw err
    callback(JSON.parse(data))
  )

load_parse_copy = (path, opt, name, callback) ->
  fs.readFile(path, (err, data) ->
    if err then throw err
    page = JSON.parse(data)
    callback(page)
    itself.put(opt, name, page, (err) ->
      if err then throw err
    )
  )

blank_page = (opt, name, callback) ->
  freshpage = {
    title: path.basename(name)
    story: [
      { type: 'factory', id: random_id() }
    ]
    journal: []
  }
  itself.put(opt, name, freshpage, (err) ->
    if err then throw err
  )
  callback(freshpage)

# Exported functions

itself.get = (opt, name, callback) ->
  loc = path.join(opt.db, name)
  console.log(loc) if opt.debug
  path.exists(loc, (exists) ->
    if exists
      load_parse(loc, callback)
    else
      loc = path.join(opt.root, "default-data/pages", name)
      path.exists(loc, (exists) ->
        if exists
          load_parse_copy(loc, opt, name, callback)
        else
          blank_page(opt, name, callback)
      )
  )
  

itself.put = (opt, name, page, callback) ->
  page = JSON.stringify(page)
  loc = path.join(opt.db, name)
  path.exists(opt.db, (exists) ->
    if exists
      fs.writeFile(loc, page, (err) ->
        if err then throw err
        console.log 'saved' if opt.debug
      )
    else
      mkdirp(opt.db, 0777, (err) ->
        if err then throw err
        fs.writeFile(loc, page, (err) ->
          if err then throw err
          console.log 'saved' if opt.debug
        )
      )
  )

module.exports = itself
