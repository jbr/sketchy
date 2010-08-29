

var io = require("socket.io");
var connect = require("connect");
var express = require("express");
var request = require("./node-utils/request/lib/main");
var xml = require("./node-xml/lib/node-xml");
var urlUtil = require("url");
var redis = require("./redis-node-client/lib/redis-client").createClient();
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
    
    console.log("clearing", socket.sessionId);
    redis.del(socket.sessionId);
    return console.log("disconnect");
  }));
}));

var attrsAsHash = (function(attrs) {
  // attrs:required
  var hash = {  };;
  attrs.forEach((function(attr) {
    // attr:required
    return (hash)[(attr)[0]] = attr // chain
      .slice(1)
      .join(" ")
      .trim()
    ;;
  }));
  return hash;
});

var linkParser = (function(linkCallback) {
  // link-callback:required
  return (new xml.SaxParser((function(cb) {
    // cb:required
    cb.onError((function(err) {
      // err:required
      return console.log(("*--" + err));
    }));
    return cb.onStartElementNS((function(elem, attrs) {
      // elem:required attrs:required
      console.log(elem, attrs);
      return (function() {
        if (false) {
          console.log(elem);
          var href = (attrsAsHash(attrs))["href"];;
          return (function() {
            if (href) {
              return linkCallback(href);
            };
          })();
        };
      })();
    }));
  })));
});

var processLink = (function(socket, url, href) {
  // socket:required url:required href:required
  var href = href;;
  return (function() {
    if ((!href.match(/^javascript:/))) {
      (function() {
        if ((!href.match(/^https?:\/\//))) {
          var previousDomain = (urlUtil.parse(url))["host"];;
          return href = ("http://" + previousDomain + href);;
        };
      })();
      socket.send(JSON.stringify({
        fn: "link",
        args: [ url, href ]
      }));
      return redis.sadd(url, href);
    };
  })();
});

var getAndProcess = (function(socket, url) {
  // socket:required url:required
  var parser = linkParser((function(link) {
    // link:required
    return processLink(socket, url, link);
  }));;
  return request({
    uri: url,
    dataCallback: (function(chunk) {
      // chunk:required
      return parser.parseString(chunk.toString());
    })
  });
});

var browse = (function(socket, url) {
  // socket:required url:required
  return (function() {
    if (socket.connected) {
      return redis.sismember(socket.sessionId, url, (function(err, alreadyVisited) {
        // err:required already-visited:required
        return (function() {
          if ((!alreadyVisited)) {
            redis.sadd(socket.sessionId, url);
            return redis.smembers(url, (function(err, urls) {
              // err:required urls:required
              return (function() {
                if (urls) {
                  return urls.forEach((function(to) {
                    // to:required
                    return socket.send(JSON.stringify({
                      fn: "link",
                      args: [ url, to.toString() ]
                    }));
                  }));
                } else {
                  return getAndProcess(socket, url);
                };
              })();
            }));
          };
        })();
      }));
    };
  })();
});
(remoteCallableFunctions)["browse"] = browse;

