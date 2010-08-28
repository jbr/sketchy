
io.setPath("/client");

var socket = (new io.Socket(null, { port: 8888 }));
socket.connect();

jQuery((function(jq) {
  // jq:required
  socket.on("message", (function(message) {
    // message:required
    return jq("<li></li>") // chain
      .appendTo("ul")
      .text(message)
    ;
  }));
  return jq(document.body) // chain
    .mousemove((function(evt) {
      // evt:required
      console.log(evt.pageX, evt.pageY);
      socket.send(JSON.stringify({
        x: evt.pageX,
        y: evt.pageY
      }));
      return true;
    }))
  ;
}));


