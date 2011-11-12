window.plugins.calculator =
  emit: (div, item) ->
    text = calculate(item.text).join "\n"
    pre = $('<pre style="font-size: 16px;"/>').text text
    div.append pre
  bind: (div, item) ->
    div.dblclick -> wiki.textEditor div, item

calculate = (text) ->
  [sums, sum] = [{}, 0]
  for line in text.split "\n"
    col = line.split /\s+/
    col[0] = col[0].replace /^[A-Z]+$/, (x) ->
      [sums[x], sum] = [sum, 0] unless sums[x]? && x != 'SUM' 
      sums[x].toFixed 2
    col[0] = col[0].replace /^\-?[0-9\.]+$/, (x) ->
      sum = sum + switch col[1]
        when 'CR', 'DB' then x/-1
        when '*' then x*col[2]
        when '/' then x/col[2]
        else x/1
      (x/1).toFixed 2
    sum = 0 if line.match /^\s*$/
    col.join ' '

