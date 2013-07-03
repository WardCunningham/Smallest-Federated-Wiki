(function() {
  var WebSocketServer, child, events, fetchPage, fs, job, radio, startJob, startServer, status, stopJob;

  WebSocketServer = require('ws').Server;

  fs = require('fs');

  child = require('child_process');

  events = require('events');

  fetchPage = function(path, done) {
    var text;
    return text = fs.readFile(path, 'utf8', function(err, text) {
      if (err) {
        return console.log(['twadio fetchPage error', path, err]);
      }
      return done(JSON.parse(text));
    });
  };

  status = {
    pid: null,
    freq: 14.042,
    mode: null
  };

  radio = new events.EventEmitter();

  job = null;

  stopJob = function() {
    if (job) {
      return job.kill('SIGTERM');
    }
  };

  startJob = function(text) {
    job = child.spawn('/usr/bin/ruby', [__dirname + '/twadio.rb', status.mode, status.freq, '0', '1', '.5', text]);
    status.pid = job.pid;
    console.log("twadio start", job.pid);
    radio.emit('update');
    return job.on('exit', function(code, signal) {
      console.log('twadio exit', code, signal);
      status.mode = null;
      status.pid = null;
      return radio.emit('update');
    });
  };

  startServer = function(params) {
    var k, server, v;
    console.log('twadio startServer', (function() {
      var _results;
      _results = [];
      for (k in params) {
        v = params[k];
        _results.push(k);
      }
      return _results;
    })());
    server = new WebSocketServer({
      server: params.server,
      path: '/plugin/twadio'
    });
    return server.on('connection', function(socket) {
      var update;
      console.log('connection established, listening');
      update = function() {
        return socket.send(JSON.stringify(status, null, 2), function(err) {
          if (err) {
            return console.log('twadio send err:', err);
          }
        });
      };
      update();
      radio.on('update', update);
      socket.on('close', function() {
        return radio.removeListener('update', update);
      });
      return socket.on('message', function(message) {
        var action;
        console.log('twadio message:', message);
        action = JSON.parse(message);
        switch (action.action) {
          case 'stop':
            return stopJob();
          case 'send':
            status.mode = 'send';
            return startJob(action.text);
          case 'tune':
            status.mode = 'tune';
            return startJob("30");
        }
      });
    });
  };

  module.exports = {
    startServer: startServer
  };

}).call(this);
