# Simple bullet list editor
# renders a new bullet foreach line - blank lines are still a bullet
# spaces are lost

window.plugins.lists =
  description: "Simple Bullet list editor"
  emit: (div, item) ->
    wiki.log 'lists', item
    for line in item.text.split "\n"
        div.append $('<li/>').append(wiki.resolveLinks(line))
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item

