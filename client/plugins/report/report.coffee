enumerate = (keys...) ->
	obj = {keys}
	obj[k] = i+1 for k,i in keys
	obj

intervals = enumerate 'HOURLY','DAILY','WEEKLY','MONTHLY','YEARLY'
hours = enumerate 'MIDNIGHT','MORNING','NOON','EVENING'
wdays = enumerate 'SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'
months = enumerate 'JANUARY','FEBUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'

parse = (text) ->
	schedule = []
	issue = null
	for word in text.match(/\S+/g) or []
		try
			if intervals[word]
				schedule.push issue =
					interval: word
					recipients: []
					offsets: []
			else if months[word] or wdays[word] or hours[word]
				issue.offsets.push word
			else if word.match /@/
				issue.recipients.push word
			else
			  schedule.push {trouble: word}
		catch e
			schedule.push {trouble: e.message}
	schedule

human = (msecs) ->
  return "#{Math.floor msecs} milliseconds" if (secs = msecs/1000) < 2
  return "#{Math.floor secs} seconds" if (mins = secs/60) < 2
  return "#{Math.floor mins} minutes" if (hrs = mins/60) < 2
  return "#{Math.floor hrs} hours" if (days = hrs/24) < 2
  return "#{Math.floor days} days" if (weeks = days/7) < 2
  return "#{Math.floor weeks} weeks" if (months = days/30.5) < 2
  return "#{Math.floor months} months" if (years = days/365) < 2
  return "#{Math.floor years} years"


primAdvance = (date, issue, count) ->
	[y, m, d, h] = [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]
	result = switch issue.interval
		when 'HOURLY'  then new Date y, m, d, h+count
		when 'DAILY'   then new Date y, m, d+count
		when 'WEEKLY'  then new Date y, m, d-date.getDay()+7*count
		when 'MONTHLY' then new Date y, m+count
		when 'YEARLY'  then new Date y+count, 0
	for offset in issue.offsets
		[y, m, d, h] = [result.getFullYear(), result.getMonth(), result.getDate(), result.getHours()]
		result = if months[offset]
			new Date y, months[offset]-1, d, h
		else if wdays[offset]
			new Date y, m, d+(7-result.getDay()+wdays[offset]-1)%7, h
		else if hours[offset]
			new Date y, m, d, h+6*(hours[offset]-1)
	result

advance = (date, issue, count) ->
	prim = primAdvance date, issue, 0
	if prim > date
		primAdvance date, issue, count-1 # when offset passes date
	else
		primAdvance date, issue, count

soon = (issue) ->
	now = new Date();
	next = advance now, issue, 1
	human next.getTime() - now.getTime()

explain = (issue) ->
	if issue.interval?
		"reporting #{issue.interval} for #{issue.recipients.length} recipients in #{soon issue}"
	else if issue.trouble?
		"don't expect: <span class=error>#{issue.trouble}</span>"
	else
		"trouble"

module.exports = {intervals, parse, explain, advance} if module?

summarize = (schedule) ->
	(explain issue for issue in schedule).join "<br>"

emit = ($item, item) ->
	$item.append $ """
		<p>#{summarize parse item.text}</p>
	"""

bind = ($item, item) ->
	$item.dblclick -> wiki.textEditor $item, item

window.plugins.report = {emit, bind} if window?
