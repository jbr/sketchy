

var io = require("socket.io");
var connect = require("connect");
var express = require("express");
var redis = require("./redis-node-client/lib/redis-client").createClient();
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
socketServer.on("connection", (function(socket) {
  // socket:required
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
    
    var departingId = socket.sessionId;;
    broadcast((function(socket) {
      // socket:required
      return socket.send(JSON.stringify({
        fn: "remove",
        args: [ departingId ]
      }));
    }));
    return delete sockets;
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

var mouseMove = (function(originatingSocket, x, y) {
  // originating-socket:required x:required y:required
  return broadcast((function(socket) {
    // socket:required
    return socket.send(JSON.stringify({
      fn: "cursorAt",
      args: [ originatingSocket.sessionId, x, y ]
    }));
  }));
});
(remoteCallableFunctions)["mouseMove"] = mouseMove;

