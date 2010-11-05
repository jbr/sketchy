
var _historyLength_ = 750;

io.setPath("/client");

var socket = (new io.Socket(null, { port: 8888 }));
socket.connect();

var remoteCallableFunctions = {  };
var browse = (function(url, from) {
  // url:required from:required
  return socket.send(JSON.stringify({
    fn: "browse",
    args: [ url, from ]
  }));
});

var points = {  },
    color = {  };
jQuery((function(jq) {
  // jq:required
  socket.on("message", (function(message) {
    // message:required
    var message = JSON.parse(message),
        fn = (remoteCallableFunctions)[message.fn],
        args = (message)["args"];;
    return (function() {
      if ((typeof(args) !== "undefined" && (args) && (args).constructor.name === "Array" && typeof(fn) !== "undefined")) {
        return fn.apply(undefined, args);
      };
    })();
  }));
  var canvas = jq("canvas"),
      context = canvas // chain
    .get(0)
    .getContext("2d")
  ,
      body = jq(document.body),
      mouseDown = false,
      newSegment = false;;
  body // chain
    .mousedown((function(evt) {
      // evt:required
      mouseDown = true;;
      return newSegment = true;;
    }))
    .mouseup((function(evt) {
      // evt:required
      return mouseDown = false;;
    }))
    .mousemove((function(evt) {
      // evt:required
      return (function() {
        if (mouseDown) {
          socket.send(JSON.stringify({
            fn: "mouseMove",
            args: [ [ evt.clientX, evt.clientY, newSegment ] ]
          }));
          return newSegment = false;;
        };
      })();
    }))
    .resize((function(evt) {
      // evt:required
      canvas.attr("width", body.width());
      canvas.attr("height", body.height());
      return draw(true);
    }))
  ;
  var draw = (function(skipResize) {
    // skipResize:required
    (function() {
      if ((!skipResize)) {
        return body.resize();
      };
    })();
    context.clearRect(0, 0, canvas.width(), canvas.height());
    return Object.keys(points).forEach((function(key) {
      // key:required
      var userPoints = (points)[key];;
      (context)["strokeStyle"] = "black";;
      (context)["lineWidth"] = 1;;
      (context)["lineCap"] = "round";;
      var color = (colors)[key],
          lastPoint = undefined;;
      return userPoints.forEach((function(point, i) {
        // point:required i:required
        (function() {
          if ((point)[2]) {
            return lastPoint = undefined;;
          };
        })();
        context.beginPath();
        (context)["strokeStyle"] = ("rgb(" + (color).join(",") + ")");;
        (context)["lineWidth"] = (5 * (i / (userPoints)["length"]));;
        var x = (point)[0];;
        var y = (point)[1];;
        (function() {
          if (typeof(lastPoint) !== "undefined") {
            context.moveTo((lastPoint)[0], (lastPoint)[1]);
            context.lineTo(x, y);
            return context.stroke();
          };
        })();
        return lastPoint = point;;
      }));
    }));
  });
  ;
  var remove = (function(id) {
    // id:required
    delete (points)[id];
    return draw();
  });
  (remoteCallableFunctions)["remove"] = remove;;
  var syncColors = (function(currentColors) {
    // currentColors:required
    colors = currentColors;;
    return draw();
  });
  (remoteCallableFunctions)["syncColors"] = syncColors;;
  var syncPoints = (function(currentPoints) {
    // currentPoints:required
    points = currentPoints;;
    return draw();
  });
  (remoteCallableFunctions)["syncPoints"] = syncPoints;;
  var syncColor = (function(id, color) {
    // id:required color:required
    (colors)[id] = color;;
    return draw();
  });
  (remoteCallableFunctions)["syncColor"] = syncColor;;
  var addPoint = (function(id, point) {
    // id:required point:required
    (function() {
      if (typeof((points)[id]) === "undefined") {
        return (points)[id] = [  ];;
      };
    })();
    var currentPoints = (points)[id];;
    currentPoints.push(point);
    (function() {
      if ((currentPoints.length > _historyLength_)) {
        return (points)[id] = currentPoints.slice((0 - _historyLength_));;
      };
    })();
    return draw();
  });
  (remoteCallableFunctions)["addPoint"] = addPoint;;
  return draw();
}));


