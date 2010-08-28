
var io = require("socket.io");
var connect = require("connect");
var express = require("express");
var app = express.createServer();
var socket = io.listen(app);
console.log("here");

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

app.get("/", (function(req, res) {
  // req:required res:required
  return res.send("Hello Express");
}));

socket.on("connection", (function(client) {
  // client:required
  client.on("message", (function(message) {
    // message:required
    var coords = JSON.parse(message);;
    console.log(message);
    client.send(("hello " + coords.x + ", " + coords.y));
    return setTimeout((function() {
      if (arguments.length > 0)
        throw new Error("argument count mismatch: expected no arguments");
      
      return client.send("WHEE");
    }), 1000);
  }));
  return client.on("disconnect", (function(args) {
    // args:rest
    var args = Array.prototype.slice.call(arguments, 0);
    
    console.log(args);
    return console.log("disconnect");
  }));
}));

app.listen(8888);


