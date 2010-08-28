(defmacro json (fn &rest args)
  (concat "JSON." (translate fn) "("
	  (join ", " (map args translate)) ")"))

(io.set-path "/client")

(defvar socket (new (io.-socket null (hash port 8888))))
(socket.connect)

(j-query (lambda (jq)

(socket.on 'message
	   (lambda (message)
	     (chain (jq "<li></li>")
		    (append-to 'ul)
		    (text message))))

(chain (jq document.body)
       (mousemove (lambda (evt)
		    (console.log evt.page-x evt.page-y)
		    (socket.send (json stringify
				       (hash x evt.page-x
					     y evt.page-y)))
		    true)))))