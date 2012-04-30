module.exports = active = {}
# FUNCTIONS and HANDLERS to manage the active page, and scroll viewport to show it

active.scrollContainer = undefined
findScrollContainer = ->
  scrolled = $("body, html").filter -> $(this).scrollLeft() > 0
  if scrolled.length > 0
    scrolled
  else
    $("body, html").scrollLeft(4).filter(-> $(this).scrollLeft() > 0).scrollTop(0)

scrollTo = (el) ->
  active.scrollContainer ?= findScrollContainer()
  bodyWidth = $("body").width()
  minX = active.scrollContainer.scrollLeft()
  maxX = minX + bodyWidth
  wiki.log 'scrollTo', el, el.position()
  target = el.position().left
  width = el.outerWidth(true)
  contentWidth = $(".page").outerWidth(true) * $(".page").size()

  if target < minX
    #subtract 60 to make it easier for users to scroll back to first page
    #this should be replaced by a visible scrollbar along the bottom so we have a UI reference
    active.scrollContainer.animate scrollLeft: target-60
  else if target + width > maxX
    wiki.log "scrollLeft 2 ", target - (bodyWidth - width)
    active.scrollContainer.animate scrollLeft: target - (bodyWidth - width)
  else if maxX > $(".pages").outerWidth()
    wiki.log "scrollLeft 3 ", Math.min(target, contentWidth - bodyWidth)
    active.scrollContainer.animate scrollLeft: Math.min(target, contentWidth - bodyWidth)

active.set = (el) ->
  el = $(el)
  wiki.log 'set active', el
  $(".active").removeClass("active")
  scrollTo el.addClass("active")

