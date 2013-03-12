util = require './util.coffee'

module.exports = (journalElement, action) ->
  pageElement = journalElement.parents('.page:first')
  prev = journalElement.find(".edit[data-id=#{action.id || 0}]") if action.type == 'edit'
  actionTitle = action.type
  actionTitle += " #{util.formatElapsedTime(action.date)}" if action.date?
  actionElement = $("""<a href="#" /> """).addClass("action").addClass(action.type)
    .text(util.symbols[action.type])
    .attr('title',actionTitle)
    .attr('data-id', action.id || "0")
    .data('action', action)
  controls = journalElement.children('.control-buttons')
  if controls.length > 0
    actionElement.insertBefore(controls)
  else
    actionElement.appendTo(journalElement)
  if action.type == 'fork' and action.site?
    actionElement
      .css("background-image", "url(//#{action.site}/favicon.png)")
      .attr("href", "//#{action.site}/#{pageElement.attr('id')}.html")
      .data("site", action.site)
      .data("slug", pageElement.attr('id'))

