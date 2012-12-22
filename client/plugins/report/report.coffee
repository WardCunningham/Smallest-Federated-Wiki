enumerate = (keys...) ->
	obj = {keys}
	obj[k] = i+1 for k,i in keys
	obj

intervals = enumerate 'HOURLY','DAILY','WEEKLY','MONTHLY','YEARLY'
hours = enumerate 'MIDNIGHT','MORNING','NOON','AFTERNOON'
days = enumerate 'SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'
months = enumerate 'JANUARY','FEBUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'

decode = (text) ->
	schedule = []
	issue = null
	for word in text.match /\S+/g
		try
			if intervals[word]
				schedule.push issue =
					interval: word
					recipients: []
			else if days[word]
				issue.offset = word
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


advance = (date, interval, count) ->
	[y, m, d, h] = [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]
	switch interval
		when 'HOURLY'  then new Date y, m, d, h+count
		when 'DAILY'   then new Date y, m, d+count
		when 'WEEKLY'  then new Date y, m, d-date.getDay()+7*count
		when 'MONTHLY' then new Date y, m+count
		when 'YEARLY'  then new Date y+count

soon = (issue) ->
	now = new Date();
	next = advance now, issue.interval, 1
	human next.getTime() - now.getTime()

explain = (issue) ->
	if issue.interval?
		"reporting #{issue.interval} for #{issue.recipients.length} recipients in #{soon issue}"
	else if issue.trouble?
		"don't expect: <span class=error>#{issue.trouble}</span>"
	else
		"trouble"

module.exports = {intervals, decode, explain, advance} if module?

summarize = (schedule) ->
	(explain issue for issue in schedule).join "<br>"

emit = ($item, item) ->
	$item.append $ """
		<p>#{summarize decode item.text}</p>
	"""

bind = ($item, item) ->
	$item.dblclick -> wiki.textEditor $item, item

window.plugins.report = {emit, bind} if window?
