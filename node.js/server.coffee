http = require 'http'
fs = require 'fs'
qs = require 'querystring'

DEBUG = 0
    
port = 8888

#where to find what - yes, cfg file.
filetype = {
  json: {
      content_type: 'application/json', encoding: 'ascii', dir: '../data/pages/'
    },
  index: {
      content_type: 'text/html', encoding: 'ascii', dir: '../server/views/static.html'
    },
  css: {  #this one is complicated - there's css from jquery, the view css, and then (probably) css for plugins - so I'll make the views css a special case in code below :(
      #content_type: 'text/css', encoding: 'ascii', dir: '../server/views/'
      content_type: 'text/css', encoding: 'ascii', dir: '../client/'
    },
  stylecss: {
      content_type: 'text/css', encoding: 'ascii', dir: '../server/views/'
    }
  js: {
      content_type: 'text/javascript', encoding: 'ascii', dir: '../client/'
    },
  jpg: {
      content_type: 'image/jpg', encoding: 'binary', dir: '../client/'
    },
  png: {
      content_type: 'image/png', encoding: 'binary', dir: '../client/'
    },
}

process.serve_url = (req, res) ->
    file = req.url[1..]
    console.log req.method+' '+req.url+': '+file if DEBUG

    if req.method == 'PUT'
       #nasty hack, as we're only putting pages atm, and the URI's are :(
       file = file.replace(/^page\//, '')    #TODO: mmm, substring anyone?
       file = file.replace(/\/action$/, '')
       body = ''
       req.on 'data', (data) -> body +=data;
       req.on 'end', ->
         POST =  qs.parse(body, true);
         console.log(POST) if DEBUG


    if file == ''
      console.log '    getting / == welcome-visitors.html topic' if DEBUG
      file = 'welcome-visitors.html'

    #TODO: use require('url').parse(request.url, true) to parse the url

    #TODO: security, don't allow non-topic id chars - avoid ../ etc
    file = file.replace(/\.\.[\/\\]/g, '')    #remove all instances of ../ and ..\ (talk about brutish and a tad simplistic
    file = file.replace(/\?.*$/i, '')     #remove ?random= - or other urlparams

    file_extension = file.match(/\.([^\.]*)$/i)
    if file == 'style.css'
      file_extension = ['stylecss', 'stylecss']
    if file_extension && file_extension[0]
      file_extension = file_extension[1].toLowerCase()
    else
      file_extension = 'json'

    if ! filetype[file_extension]
      console.log '    defaulting: ' + file_extension if DEBUG
      file_extension = 'index'
      file = ''
      #TODO: modify the index.html page div id (I think I'll get client.coffee to update it)

    encoding = filetype[file_extension]['encoding']
    contentType =  filetype[file_extension]['content_type']
    filePath = filetype[file_extension]['dir']+file

    #and here's a pointless exception to the filename.extension :(
    filePath = filePath.replace(/\.json/, '') if file_extension == 'json'

    console.log '    serverfile: '+filePath if DEBUG

    #fulfil the request
    #read
    fs.readFile filePath, encoding, (err, data) ->
      status = 200
      if err
        if err.errno is 2
          status = 404
        else
          status = 404
        data = ""
      console.log '    filePath: ' + filePath if DEBUG
      console.log '    status: '+ status if DEBUG
      #console.log ' contentType: '+ contentType
      if status is 200
          res.writeHead 200,
              'Content-Type': contentType
              'Content-Length': data.length + 1
          if encoding == 'binary'
            #console.log 'sending binary'
            res.write data, encoding
          else
            #console.log 'sending string'
            data = data.toString()
            res.write data + '\n'

          #console.log 'result(s): ' + data
      else
        res.writeHead status

      res.end()
      console.log 'DONE: ' + filePath if DEBUG
#done.

if process.myserver
  console.log '  restarting'
  process.myserver.close()

process.myserver = http.createServer (req, res) -> process.serve_url(req, res)

process.myserver.on 'error', (e) ->
    console.log("Error: %j", e);
    process.exit

process.myserver.listen port , ->
  console.log '--------------------------------------------------------------------------'
  console.log("Federated Wiki server on %j", process.myserver.address());


