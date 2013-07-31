# Middleware and Backend for Persona based verified email addresses

https = require 'https'
qs = require('qs')

module.exports = exports = (log, loga, argv) ->
  persona = {}
  persona.authenticate_session = (getOwner) ->
    (req, res, next) ->
      req.isAuthenticated = ->
        log 'isAuthenticated? owner=', getOwner(), 'req.session.email=', req.session.email, getOwner() is req.session.email
        if getOwner() == ''
            return true
        !! req.session.email and getOwner() is req.session.email
      next()

  persona.verify_assertion = (getOwner, setOwner) ->
    (req, res) ->
      sent = false
      fail = ->
        res.send "FAIL", 401  unless sent
        sent = true

      postBody = qs.stringify(
        assertion: req.body.assertion
        audience: argv.u
      )

      opts =
        host: "verifier.login.persona.org"
        port: 443
        path: "/verify"
        method: "POST"
        headers:
          "Content-Length": postBody.length
          "Content-Type": "application/x-www-form-urlencoded"

      d = ''
      originalRes = res

      verifier = https.request opts, (res) ->
        if 200 is res.statusCode
          res.setEncoding "utf8"
          res.on "data", (data) ->
            d += data

          res.on "end", (a, b, c) ->
            verified = JSON.parse(d)
            if "okay" is verified.status and !!verified.email
              req.session.email = verified.email
              owner = getOwner()
              if owner is ''
                setOwner verified.email, ->
                  loga 'Owner was not claimed, setting owner'
              else if owner is verified.email
                log 'Welcome back! Creating session'
              else
                log 'Expected ', owner, ' but got ', verified.email
                delete req.session.email
                return originalRes.send JSON.stringify {
                  status: 'wrong-address',
                  email: verified.email
                }
              log "Verified Email=", verified.email
              originalRes.send JSON.stringify {
                status: 'okay',
                email: verified.email
              }
            else
              fail()

        else
          loga "STATUS: " + res.statusCode
          loga "HEADERS: " + JSON.stringify(res.headers)
          fail()

      verifier.write postBody
      verifier.on "error", (e) ->
        loga e
        fail()

      verifier.end()
  persona