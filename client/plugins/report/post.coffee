child = require 'child_process'
fs = require 'fs'
report = require './report.js'
print = (arg...) -> console.log arg...


# */10 * * * * (cd wiki/client/plugins/report; Port=:1111 /usr/local/bin/node post.js)

port = process.env.Port or ''
farm = process.env.Farm or '../../../data/farm'

# Fetch data from wiki farm files

findPaths = (sufix, done) ->
  child.exec "ls #{farm}/*/pages/*-#{sufix}", (err, stdout, stderr) ->
    done stdout.split /\n/

fetchPage = (path, done) ->
  text = fs.readFile path, 'utf8', (err, text) ->
    done JSON.parse text

findSchedule = (page) ->
  for item in page.story
    return report.parse(item.text) if item.type is 'report'
  null

findPubs = (done) ->
  findPaths 'report', (paths) ->
    path = paths[0]
    [x,x,x,x,x,site,x,slug] = path.split '/'
    fetchPage path, (page) ->
      if schedule = findSchedule page
        for issue in schedule
          if issue.interval? and issue.recipients?.length
            done {site, slug, page, schedule, issue}



# Compose summary from story and journal

fold = (text) ->
  text.match(/(\S*\s*){1,9}/g).join "\n"

compose = (page) ->
  result = []
  for item in page.story
    if item.type is 'paragraph'
      result.push fold item.text 
  result.join "\n"

ready = ({issue, now, period}) ->
  window = period*60*1000
  thisIssue = report.advance(now, issue, 0)
  lapse = now.getTime() - thisIssue.getTime()
  lapse < window



# Hand off to sendmail for distribution

header = (fields) ->
  ("#{k}: #{v}" for k, v of fields).join "\n"

enclose = ({site, slug, page, issue, summary}) ->
  [header
    To: issue.recipients.join ", "
    'Reply-to': issue.recipients.join ", "
    Subject: "#{page.title} (#{issue.interval})"
  summary
  "See details at http://#{site}#{port}/#{slug}.html"].join "\n\n"

send = (pub) ->
  output = []
  send = child.spawn '/usr/sbin/sendmail', ['-fward@wiki.org', '-t']
  send.stdin.write pub.message
  send.stdin.end()
  send.stderr.setEncoding 'utf8'
  send.stderr.on 'data', (data) -> output.push data
  send.on 'exit', (code) ->
    print "sent #{pub.page.title} (#{pub.issue.interval}), code: #{code}"
    print output



# Main program loops over all publications

findPubs (pub) ->
  pub.now = new Date(2012,12-1,21,0,0,3)
  pub.now = new Date()
  pub.period = 10
  if ready pub
    pub.summary = compose pub.page
    pub.message = enclose pub
    send pub
    