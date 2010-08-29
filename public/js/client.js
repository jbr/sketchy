

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

var cursors = {  };
jQuery((function(jq) {
  // jq:required
  socket.on("message", (function(message) {
    // message:required
    var message = JSON.parse(message);;
    var fn = (remoteCallableFunctions)[message.fn];;
    var args = (message)["args"];;
    return (function() {
      if ((typeof(args) !== "undefined" && (args) && (args).constructor.name === "Array" && typeof(fn) !== "undefined")) {
        return fn.apply(undefined, args);
      };
    })();
  }));
  var canvas = jq("canvas");;
  var context = jq("canvas") // chain
    .get(0)
    .getContext("2d")
  ;;
  var body = jq(document.body);;
  body // chain
    .mousemove((function(evt) {
      // evt:required
      return socket.send(JSON.stringify({
        fn: "mouseMove",
        args: [ evt.clientX, evt.clientY ]
      }));
    }))
    .resize((function(evt) {
      // evt:required
      canvas.attr("width", body.width());
      return canvas.attr("height", body.height());
    }))
  ;
  var draw = (function() {
    if (arguments.length > 0)
      throw new Error("argument count mismatch: expected no arguments");
    
    body.resize();
    context.clearRect(0, 0, canvas.width(), canvas.height());
    return Object.keys(cursors).forEach((function(key) {
      // key:required
      var cursor = (cursors)[key];;
      context.beginPath();
      (context)["strokeStyle"] = "black";;
      context.arc((cursor)[0], (cursor)[1], 20, 0, (2 * (Math)["PI"]), false);
      return context.stroke();
    }));
  });
  ;
  var remove = (function(id) {
    // id:required
    console.log(id);
    return delete (cursors)[id];
  });
  (remoteCallableFunctions)["remove"] = remove;;
  var cursorAt = (function(id, x, y) {
    // id:required x:required y:required
    (cursors)[id] = [ x, y ];;
    return draw();
  });
  (remoteCallableFunctions)["cursorAt"] = cursorAt;;
  return draw();
}));


