var path = require('path')

  , levelup = require('levelup')

  , fsPage = require('./page')

module.exports = function (opts) {
  var db = levelup(path.join(opts.db, 'pagedb'), {encoding: 'json'})
    , classicPageGet = fsPage(opts).get
  function put (file, page, cb) {
    db.put(file, page, cb)
  }
  function get (file, cb) {
    db.get(file, function (e, page) {
      if (e) {
        console.log(e)
        if (e.name !== 'NotFoundError') return cb(e)
        return classicPageGet(file, cb)
      }
      cb(null, page)
    })
  }

  return { put: put, get: get }
}