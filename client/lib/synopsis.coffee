module.exports = (page) ->
  synopsis = page.synopsis
  if page? && page.story?
    p1 = page.story[0]
    p2 = page.story[1]
    synopsis ||= p1.text if p1 && p1.type == 'paragraph'
    synopsis ||= p2.text if p2 && p2.type == 'paragraph'
    synopsis ||= p1.text if p1 && p1.text?
    synopsis ||= p2.text if p2 && p2.text?
    synopsis ||= page.story? && "A page with #{page.story.length} items."
  else
    synopsis = 'A page with no story.'
  return synopsis

