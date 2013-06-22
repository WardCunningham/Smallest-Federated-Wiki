(function() {
  var WebSocketServer, delay, domain, es, fs, startServer, txtzymeDevice, waiting;

  WebSocketServer = require('ws').Server;

  fs = require('fs');

  es = require('event-stream');

  domain = require('domain');

  delay = function(done) {};

  txtzymeDevice = function(done) {
    var result;
    result = null;
    if (process.platform === "win32") {
      return done(new Error("on windows..."));
    }
    return fs.readdir('/dev', function(err, files) {
      var file, _i, _len;
      if (err) {
        done(err);
      }
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        if (file.match(/^ttyACM/)) {
          result = file;
        }
        if (file.match(/^cu.usbmodem1234/)) {
          result = file;
        }
      }
      if (result) {
        return done(null, "/dev/" + result);
      }
      return done(new Error("can't find txtzyme device"));
    });
  };

  waiting = false;

  startServer = function(params) {
    var d, server;
    console.log("startServer");
    d = domain.create();
    d.on('error', function(err) {
      server.close();
      d.dispose();
      console.log(err);
      if (!waiting) {
        waiting = true;
        return delay(function() {
          waiting = false;
          return startServer(params);
        });
      }
    });
    server = new WebSocketServer({
      server: params.server,
      path: '/plugin/txtzyme'
    });
    d.add(server);
    return txtzymeDevice(d.intercept(function(fn) {
      var fromDevice, toDevice;
      toDevice = fs.createWriteStream(fn);
      fromDevice = fs.createReadStream(fn).pipe(es.split());
      d.add(toDevice);
      d.add(fromDevice);
      return server.on('connection', function(socket) {
        var uplink;
        console.log('connection established, listening');
        d.add(socket);
        fromDevice.on('data', uplink = function(line) {
          return socket.send(line, function(err) {
            if (err) {
              return console.log('txtzyme send err', err);
            }
          });
        });
        socket.on('message', function(message) {
          return toDevice.write(message);
        });
        return socket.on('close', function(code, message) {
          console.log("txtzyme socket closed, " + code + " " + message);
          return fromDevice.removeListener('data', uplink);
        });
      });
    }));
  };

  module.exports = {
    startServer: startServer
  };

}).call(this);
