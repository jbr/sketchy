

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

jQuery((function(jq) {
  // jq:required
  var url = window.location.search.replace(/^\?/, "");;
  (function() {
    if ((typeof(url) !== "undefined" && (!(url === "")))) {
      return jq("input[type=text]").val(url);
    };
  })();
  socket.on("message", (function(message) {
    // message:required
    var message = JSON.parse(message);;
    var fn = (remoteCallableFunctions)[message.fn];;
    var args = (message)["args"];;
    console.log(args);
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
      .html(text)
    ;
  });
  (remoteCallableFunctions)["text"] = text;;
  var link = (function(from, to) {
    // from:required to:required
    return text((from + " &rarr; " + to));
  });
  (remoteCallableFunctions)["link"] = link;;
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
    .change()
  ;
  jq("form") // chain
    .submit((function() {
      if (arguments.length > 0)
        throw new Error("argument count mismatch: expected no arguments");
      
      jq("input[type=text]").change();
      return false;
    }))
  ;
  var canvas = jq("canvas");;
  jq(window) // chain
    .resize((function(evt) {
      // evt:required
      return canvas // chain
        .width(jq(document.body).width())
        .height(jq(document.body).height())
        .resize()
      ;
    }))
    .resize()
  ;
  return jq("input[type=button]").click((function(evt) {
    // evt:required
    return jq("input[type=text]").change();
  }));
}));


