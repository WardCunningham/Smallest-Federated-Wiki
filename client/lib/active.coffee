module.exports = active = {}
# FUNCTIONS and HANDLERS to manage the active page, and scroll viewport to show it

active.scrollContainer = undefined
findScrollContainer = ->
  scrolled = $("body, html").filter -> $(this).scrollLeft() > 0
  if scrolled.length > 0
    scrolled
  else
    $("body, html").scrollLeft(12).filter(-> $(this).scrollLeft() > 0).scrollTop(0)

scrollTo = (el) ->
  active.scrollContainer ?= findScrollContainer()
  bodyWidth = $("body").width()
  minX = active.scrollContainer.scrollLeft()
  maxX = minX + bodyWidth
  target = el.position().left
  width = el.outerWidth(true)
  contentWidth = $(".page").outerWidth(true) * $(".page").size()

  if target < minX
    active.scrollContainer.animate scrollLeft: target
  else if target + width > maxX
    active.scrollContainer.animate scrollLeft: target - (bodyWidth - width)
  else if maxX > $(".pages").outerWidth()
    active.scrollContainer.animate scrollLeft: Math.min(target, contentWidth - bodyWidth)

active.set = (el) ->
  el = $(el)
  $(".active").removeClass("active")
  scrollTo el.addClass("active")

