http = require 'http'
fs = require 'fs'
    
port = 8888

process.serve_url = (req, res) ->
    console.log req.method, req.url
    
    file = req.url[1..]
      
    filePath = file
    contentType =  'application/json'
    encoding = 'ascii'

    if file == ''
      console.log 'getting index file: '+file
      contentType =  'text/html'
      filePath = './index.html'
    else 
      file_extension = file.match(/\.([^\.]*)$/i)
      console.log file_extension
      if file_extension[0]
        file_extension = file_extension[1].toLowerCase()
        
        if file_extension == 'css'
          console.log 'getting style.css file: '+file
          contentType =  'text/css'
          filePath = './style.css'
        if file_extension == 'js'
          console.log 'getting js file: '+file
          contentType =  'text/javascript'
          filePath = '../client/'+file
        if file_extension == 'png' || file_extension == 'jpg'
          encoding = 'binary'
          console.log 'getting image file: '+file
          contentType =  'image/'+file_extension
          filePath = '../client/'+file
        else if file.match(/\.json\?random=........$/i)
          file = file.replace(/\.json\?random=........$/i, '')
          console.log 'getting wiki page: '+file
          filePath = '../data/pages/'+file
      else
        #a wiki page in json
        filePath = '../data/pages/'+file
    
    
    console.log 'reading: '+filePath
    
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


