module.exports = (owner) ->
  $("#user-email").hide()
  $("#persona-login-btn").hide()
  $("#persona-logout-btn").hide()
  navigator.id.watch
    loggedInUser: owner
    onlogin: (assertion) ->
      console.log "assertion=", assertion
      $.post "/persona_login",
        assertion: assertion
      , (verified) ->
        verified = JSON.parse(verified)
        console.log verified
        if "okay" is verified.status
          console.log('Setting email to ' + verified.email)
          $("#user-email").text(verified.email).show()
          $("#persona-login-btn").hide()
          $("#persona-logout-btn").show()
        else
          
          # Verification failed
          navigator.id.logout()
          window.location = "/oops"  if "wrong-address" is verified.status


    onlogout: ->
      console.log "logging out"
      $.post "/persona_logout"
      $("#user-email").hide()
      $("#persona-login-btn").show()
      $("#persona-logout-btn").hide()

    onmatch: ->
      console.log "It is safe to render the UI"
      if owner
        $("#user-email").text(owner).show()
        $("#persona-login-btn").hide()
        $("#persona-logout-btn").show()
      else
        $("#user-email").hide()
        $("#persona-login-btn").show()
        $("#persona-logout-btn").hide()

  $("#persona-login-btn").click (e) ->
    e.preventDefault()
    navigator.id.request {}

  $("#persona-logout-btn").click (e) ->
    e.preventDefault()
    navigator.id.logout()
