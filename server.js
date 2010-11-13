var _historyLength_ = 750,
    json = JSON;

var io = require("./socket.io"),
    path = require("path"),
    fs = require("fs"),
    url = require("url"),
    http = require("http");
var serveFile = (function(fileName, response) {
  // fileName:required response:required
  var contentType = (function() {
    switch(path.extname(fileName)) {
    case ".html":
      return "text/html";
    
    case ".css":
      return "text/css";
    
    case ".js":
      return "text/javascript";
    }
  })();;
  return fs.readFile((__dirname + "/public/" + fileName), (function(err, data) {
    // err:required data:required
    return (function() {
      if (err) {
        response.writeHead(404);
        response.write("404");
        return response.end();;
      } else {
        console.log(fileName, contentType);
        response.writeHead(200, { "Content-Type": contentType });
        response.write(data, "utf8");
        return response.end();;
      };
    })();
  }));
});

var server = http.createServer((function(request, response) {
  // request:required response:required
  var path = (url.parse(request.url))["pathname"];;
  return (function() {
    switch(path) {
    case "/":
      return serveFile("index.html", response);
    
    default:
      return serveFile(path, response);
    }
  })();
}));
server.listen(8888);

var socketServer = io.listen(server),
    remoteCallableFunctions = {  },
    sockets = socketServer.clientsIndex,
    points = {  },
    colors = {  };
var randomInt = (function(max) {
  // max:required
  return Math.floor((max * Math.random()));
});

var randomColor = (function() {
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
    var message = json.parse(message);;
    var fn = (remoteCallableFunctions)[message.fn];;
    var args = (message)["args"];;
    return (function() {
      if ((typeof(args) !== 'undefined' && typeof(fn) !== 'undefined')) {
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
    return delete (sockets)[socketId];;
  }));
}));

var broadcast = (function(fn) {
  // fn:required
  return Object.keys(sockets).forEach((function(sessionId) {
    // sessionId:required
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
    if (typeof((points)[id]) === 'undefined') {
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
  // originatingSocket:required x:required y:required newSegment:required
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

