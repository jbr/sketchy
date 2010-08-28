(io.set-path "/client")

(defvar socket (new (io.-socket null (hash port 8888))))
(socket.connect)

(j-query (lambda (jq)
	   (chain (jq document.body)
		  (click (lambda (evt)
			   (socket.send 'hello))))))