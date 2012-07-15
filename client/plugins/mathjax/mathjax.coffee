window.plugins.mathjax =
  emit: (div, item) ->
    typeset = ->
      window.MathJax.Hub.Queue ["Typeset", MathJax.Hub]

    wiki.getScript 'http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML', typeset
    div.append "<p>#{wiki.resolveLinks(item.text)}</p>"
    
  bind: (div, item) ->
    typeset = ->
      window.MathJax.Hub.Queue ["Typeset", MathJax.Hub, div.get(0)]
    
    wiki.getScript 'http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML', typeset
    div.dblclick -> wiki.textEditor div, item