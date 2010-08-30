
var _historyLength_ = 100;

var io = require("socket.io");
var connect = require("connect");
var express = require("express");
var app = express.createServer();
var socketServer = io.listen(app);
app.configure((function() {
  if (arguments.length > 0)
    throw new Error("argument count mismatch: expected no arguments");
  
  return app.use(express.staticProvider((__dirname + "/public")));
}));

app.configure("development", (function() {
  if (arguments.length > 0)
    throw new Error("argument count mismatch: expected no arguments");
  
  return app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
}));

app.configure("production", (function() {
  if (arguments.length > 0)
    throw new Error("argument count mismatch: expected no arguments");
  
  return app.use(express.errorHandler());
}));

app.listen(8888);

var remoteCallableFunctions = {  };
var sockets = socketServer.clientsIndex;
var points = {  };
var colors = {  };
var randomInt = (function(max) {
  // max:required
  return Math.floor((max * Math.random()));
});

var randomColor = (function() {
  if (arguments.length > 0)
    throw new Error("argument count mismatch: expected no arguments");
  
  return [ randomInt(255), randomInt(255), randomInt(255) ];
});

socketServer.on("connection", (function(socket) {
  // socket:required
  var socketId = socket.sessionId;;
  (colors)[socketId] = randomColor();;
  socket.send(JSON.stringify({
    fn: "syncColors",
    args: [ colors ]
  }));
  (points)[socketId] = [  ];;
  socket.send(JSON.stringify({
    fn: "syncPoints",
    args: [ points ]
  }));
  broadcast((function(socket) {
    // socket:required
    return socket.send(JSON.stringify({
      fn: "syncColor",
      args: [ socketId, (colors)[socketId] ]
    }));
  }));
  socket.on("message", (function(message) {
    // message:required
    var message = JSON.parse(message);;
    var fn = (remoteCallableFunctions)[message.fn];;
    var args = (message)["args"];;
    return (function() {
      if ((typeof(args) !== "undefined" && typeof(fn) !== "undefined")) {
        args.unshift(socket);
        return fn.apply(undefined, args);
      };
    })();
  }));
  return socket.on("disconnect", (function(args) {
    // args:rest
    var args = Array.prototype.slice.call(arguments, 0);
    
    broadcast((function(socket) {
      // socket:required
      return socket.send(JSON.stringify({
        fn: "remove",
        args: [ socketId ]
      }));
    }));
    delete (points)[socketId];
    delete (colors)[socketId];
    return delete (sockets)[socketId];
  }));
}));

var broadcast = (function(fn) {
  // fn:required
  return Object.keys(sockets).forEach((function(sessionId) {
    // session-id:required
    var socket = (sockets)[sessionId];;
    return (function() {
      if (socket) {
        return fn(socket);
      };
    })();
  }));
});

var addPoint = (function(id, point) {
  // id:required point:required
  (function() {
    if (typeof((points)[id]) === "undefined") {
      return (points)[id] = [  ];;
    };
  })();
  var currentPoints = (points)[id];;
  currentPoints.push(point);
  return (function() {
    if ((currentPoints.length > _historyLength_)) {
      return (points)[id] = currentPoints.slice((0 - _historyLength_));;
    };
  })();
});

var mouseMove = (function(originatingSocket, x, y, newSegment) {
  // originating-socket:required x:required y:required new-segment:required
  addPoint(originatingSocket.sessionId, x, y, newSegment);
  return broadcast((function(socket) {
    // socket:required
    return socket.send(JSON.stringify({
      fn: "addPoint",
      args: [ originatingSocket.sessionId, x, y, newSegment ]
    }));
  }));
});
(remoteCallableFunctions)["mouseMove"] = mouseMove;

