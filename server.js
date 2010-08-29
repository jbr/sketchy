

var io = require("socket.io");
var connect = require("connect");
var express = require("express");
var request = require("request");
var apricot = (require("apricot"))["Apricot"];
var urlUtil = require("url");
var redis = require("./redis-node-client/lib/redis-client").createClient();
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
    
    console.log("clearing", socket.sessionId);
    redis.del(socket.sessionId);
    return console.log("disconnect");
  }));
}));

var processPage = (function(socket, url, body, recursionLevel, from) {
  // socket:required url:required body:required recursion-level:required from:required
  return (function() {
    try {
      return apricot.parse(body, (function(doc) {
        // doc:required
        doc // chain
          .find("title")
          .each((function(elt) {
            // elt:required
            return redis.hset("title", url, (elt)["innerHTML"].trim());
          }))
          .remove()
        ;
        return doc // chain
          .find("a")
          .each((function(elt) {
            // elt:required
            var href = elt.href;;
            return (function() {
              if ((!href.match(/^javascript:/))) {
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
              };
            })();
          }))
        ;
      }));
    } catch (e) {
      return console.log(url, e);
    }
  })();
});

var getAndProcess = (function(socket, url, recursionLevel, from) {
  // socket:required url:required recursion-level:required from:required
  return request({ uri: url }, (function(err, response, body) {
    // err:required response:required body:required
    return (function() {
      if (err) {
        return console.log(url, err);
      } else {
        return (function() {
          if ((200 === response.statusCode)) {
            return processPage(socket, url, body, recursionLevel, from);
          };
        })();
      };
    })();
  }));
});

var browse = (function(socket, url, recursionLevel, from) {
  // socket:required url:required recursion-level:required from:required
  var recursionLevel = (recursionLevel || 0);;
  console.log((recursionLevel + " " + url));
  return (function() {
    if ((_maxRecursion_ > recursionLevel)) {
      (function() {
        if (typeof(from) !== "undefined") {
          socket.send(JSON.stringify({
            fn: "link",
            args: [ from, url ]
          }));
          redis.sadd(from, url);
          return redis.sismember(socket.sessionId, (function(err, alreadyVisited) {
            // err:required already-visited:required
            return (function() {
              if ((!alreadyVisited)) {
                redis.sadd(socket.sessionId, url);
                // (get-and-process socket url recursion-level from);
                return redis.smembers(url, (function(err, urls) {
                  // err:required urls:required
                  return (function() {
                    if (urls) {
                      return urls.forEach((function(to) {
                        // to:required
                        return browse(socket, url, to);
                      }));
                    } else {
                      return getAndProcess(socket, url, recursionLevel, from);
                    };
                  })();
                }));
              };
            })();
          }));
        };
      })();
      return (function() {
        if (typeof(from) === "undefined") {
          console.log("clearing", socket.sessionId);
          return redis.del(socket.sessionId, (function(err) {
            // err:required
            return getAndProcess(socket, url, recursionLevel, from);
          }));
        };
      })();
    };
  })();
});
(remoteCallableFunctions)["browse"] = browse;

