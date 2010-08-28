

var io = require("socket.io");
var connect = require("connect");
var express = require("express");
var app = express.createServer();
var socket = io.listen(app);
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
socket.on("connection", (function(socket) {
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
    
    return console.log("disconnect");
  }));
}));

var browse = (function(socket, url) {
  // socket:required url:required
  return socket.send(JSON.stringify({
    fn: "text",
    args: [ url ]
  }));
});
(remoteCallableFunctions)["browse"] = browse;

