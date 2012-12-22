child = require 'child_process'
fs = require 'fs'
report = require './report.js'
farm = '../../../data/farm'
print = (arg...) -> console.log arg...

# Fetch data from wiki farm files

pagePaths = (sufix, done) ->
  child.exec "ls #{farm}/*/pages/*-#{sufix}", (err, stdout, stderr) ->
    done stdout.split /\n/

pageObject = (path, done) ->
  text = fs.readFile path, 'utf8', (err, text) ->
    done JSON.parse text

findSchedule = (page) ->
  for item in page.story
    return report.decode(item.text) if item.type is 'report'
  null

findPubs = (done) ->
  pagePaths 'report', (paths) ->
    path = paths[0]
    [x,x,x,x,x,site,x,slug] = path.split '/'
    pageObject path, (page) ->
      if schedule = findSchedule page
        for issue in schedule
          if issue.interval? and issue.recipients?.length
            done {site, slug, page, schedule, issue}


# Compose and send email

fold = (text) ->
  text.match(/(\S*\s*){1,9}/g).join "\n"

header = (fields) ->
  ("#{k}: #{v}" for k, v of fields).join "\n"

compose = (page) ->
  result = []
  for item in page.story
    if item.type is 'paragraph'
      result.push fold item.text 
  result.join "\n"

ready = ({issue, now, period}) ->
  window = period*60*1000
  thisIssue = report.advance(now, issue.interval, 0)
  lapse = now.getTime() - thisIssue.getTime()
  lapse < window

enclose = ({site, port, slug, page, issue, summary}) ->
  [header
    To: issue.recipients.join ", "
    'Reply-to': issue.recipients.join ", "
    Subject: "#{page.title} (#{issue.interval})"
  summary
  "See details at http://#{site}#{port}/#{slug}.html"].join "\n\n"

send = (pub) ->
  send = child.spawn 'sendmail', ['-fward@wiki.org', '-t']
  send.stdin.write pub.message
  send.stdin.end()

findPubs (pub) ->
  pub.port = ':1111'
  pub.now = new Date(2012,12-1,21,0,0,3)
  pub.period = 10
  if ready pub
    pub.summary = compose pub.page
    pub.message = enclose pub
    send pub
    