

var io = require("socket.io");
var connect = require("connect");
var express = require("express");
var request = require("request");
var apricot = (require("apricot"))["Apricot"];
var urlUtil = require("url");
var app = express.createServer();
var socket = io.listen(app);
var _maxRecursion_ = 3;
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

var processPage = (function(socket, url, body, recursionLevel, from) {
  // socket:required url:required body:required recursion-level:required from:required
  return (function() {
    try {
      return apricot.parse(body, (function(doc) {
        // doc:required
        return doc // chain
          .find("a")
          .each((function(elt) {
            // elt:required
            var href = elt.href;;
            (function() {
              if ((!href.match(/^https?:\/\//))) {
                var previousDomain = (urlUtil.parse(url))["host"];;
                return href = ("http://" + previousDomain + href);;
              };
            })();
            return process.nextTick((function() {
              if (arguments.length > 0)
                throw new Error("argument count mismatch: expected no arguments");
              
              return browse(socket, href, (1 + recursionLevel), url);
            }));
          }))
        ;
      }));
    } catch (e) {
      return console.log(e);
    }
  })();
});

var browse = (function(socket, url, recursionLevel, from) {
  // socket:required url:required recursion-level:required from:required
  var recursionLevel = (recursionLevel || 0);;
  return (function() {
    if ((_maxRecursion_ > recursionLevel)) {
      console.log((from + "->" + url));
      (function() {
        if (typeof(from) !== "undefined") {
          return socket.send(JSON.stringify({
            fn: "text",
            args: [ (from + "->" + url) ]
          }));
        };
      })();
      return request({ uri: url }, (function(err, response, body) {
        // err:required response:required body:required
        return (function() {
          if (err) {
            return console.log(err);
          } else {
            return (function() {
              if ((200 === response.statusCode)) {
                return processPage(socket, url, body, from);
              };
            })();
          };
        })();
      }));
    };
  })();
});
(remoteCallableFunctions)["browse"] = browse;

