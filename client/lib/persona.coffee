module.exports = (owner) ->
  $("#user-email").hide()
  $("#persona-login-btn").hide()
  $("#persona-logout-btn").hide()
  navigator.id.watch
    loggedInUser: owner
    onlogin: (assertion) ->
      $.post "/persona_login",
        assertion: assertion
      , (verified) ->
        verified = JSON.parse(verified)
        if "okay" is verified.status
          window.location = "/";
        else

          # Verification failed
          navigator.id.logout()
          window.location = "/oops"  if "wrong-address" is verified.status


    onlogout: ->
      $.post "/persona_logout", () ->
          window.location = "/";

    onready: ->
      # It's safe to render the UI now, Persona and
      # the Wiki's notion of a session agree
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
