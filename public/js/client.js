

io.setPath("/client");

var socket = (new io.Socket(null, { port: 8888 }));
socket.connect();

var remoteCallableFunctions = {  };
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
  var text = (function(text) {
    // text:required
    jq("<li/>") // chain
      .prependTo("ul")
      .text(text)
    ;
    return jq("li") // chain
      .slice(10)
      .remove()
    ;
  });
  (remoteCallableFunctions)["text"] = text;;
  return jq("input") // chain
    .keyup((function(evt) {
      // evt:required
      socket.send(JSON.stringify({
        fn: "browse",
        args: [ jq(this).val() ]
      }));
      return true;
    }))
    .focus()
  ;
}));


