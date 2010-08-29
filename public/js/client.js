

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
    return jq("<li/>") // chain
      .prependTo("ul")
      .text(text)
    ;
  });
  (remoteCallableFunctions)["text"] = text;;
  jq("input[type=text]") // chain
    .change((function(evt) {
      // evt:required
      jq("ul").empty();
      return socket.send(JSON.stringify({
        fn: "browse",
        args: [ jq(this).val() ]
      }));
    }))
    .focus()
  ;
  return jq("input[type=button]").click((function(evt) {
    // evt:required
    return jq("input[type=text]").change();
  }));
}));


