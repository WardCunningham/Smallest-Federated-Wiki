http = require 'http'
fs = require 'fs'
    
port = 8888

#where to find what - yes, cfg file.
filetype = {
  json: {
      content_type: 'application/json', encoding: 'ascii', dir: '../data/pages/'
    },
  index: {
      content_type: 'text/html', encoding: 'ascii', dir: './'
    },
  css: {
      content_type: 'text/css', encoding: 'ascii', dir: './'
    },
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
    console.log req.method, req.url
    
    file = req.url[1..]
    
    if file == ''
      console.log 'getting / == welcome-visitors.html topic'
      file = 'welcome-visitors.html'
      
    #TODO: security, don't allow non-topic id chars - avoid ../ etc
    file = file.replace(/\.\.[\/\\]/g, '')    #remove all instances of ../ and ..\ (talk about brutish and a tad simplistic
    file = file.replace(/\?.*$/i, '')     #remove ?random= - or other urlparams
      
    file_extension = file.match(/\.([^\.]*)$/i)
    if !file_extension[0]
      file_extension = 'json'
    else
      file_extension = file_extension[1].toLowerCase()
    
    if ! filetype[file_extension]
      file_extension = 'index'
      file = 'index.html'
      #TODO: do something to load the right page (and here we start with html templating
    
    encoding = filetype[file_extension]['encoding']
    contentType =  filetype[file_extension]['content_type']
    filePath = filetype[file_extension]['dir']+file
    
    #and here's a pointless exception to the filename.extension :(
    filePath = filePath.replace(/\.json/, '') if file_extension == 'json'
    
    console.log req.method+filePath
    
    fs.readFile filePath, encoding, (err, data) ->
      status = 200
      if err
        if err.errno is 2
          status = 404
        else
          status = 404
        data = ""
      console.log 'status: '+ status
      console.log ' contentType: '+ contentType
      if status is 200
          res.writeHead 200,
              'Content-Type': contentType
              'Content-Length': data.length + 1
          if encoding == 'binary'
            console.log 'sending binary'
            res.write data, encoding
          else
            console.log 'sending string'
            data = data.toString()
            res.write data + '\n'
          
          #console.log 'result(s): ' + data
      else 
        res.writeHead status

      res.end()
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


