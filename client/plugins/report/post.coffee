exec = require('child_process').exec
fs = require('fs')
report = require './report.js'
farm = '../../../data/farm'

# Sychronous Utilities

print = (arg...) ->
  console.log arg...

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

# Asychrounous Workings

pagePaths = (sufix, done) ->
  exec "ls #{farm}/*/pages/*-#{sufix}", (err, stdout, stderr) ->
    done stdout.split /\n/

pageObject = (path, done) ->
  text = fs.readFile path, 'utf8', (err, text) ->
    done JSON.parse text

# print report.intervals.DAILY
# d = new Date()
# print d.getDate()

pagePaths 'report', (paths) ->
  pageObject paths[0], (page) ->
    schedule = report.decode page.story[1].text
    [x,x,x,x,x,site,x,slug] = paths[0].split '/'
    print [header
        To: schedule[0].recipients.join ", "
        Subject: "#{page.title} (#{schedule[0].interval})"
      compose page
      "See details at http://#{site}/#{slug}.html"].join "\n\n"

    