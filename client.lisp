(include "common.lisp")

(io.set-path "/client")

(defvar socket (new (io.-socket null (hash port 8888))))
(socket.connect)

(defvar remote-callable-functions (hash))

(j-query (lambda (jq)

(socket.on 'message
	   (lambda (message)
	     (defvar message (json parse message))
	     (defvar fn (get remote-callable-functions message.fn))
	     (defvar args (get message 'args))
	     (when (and (defined? args)
			(array? args)
			(defined? fn))
	       (apply fn args))))

(defremote text (text)
  (chain (jq "<li/>")
	 (prepend-to 'ul)
	 (text text))
  (chain (jq "li")
	 (slice 10)
	 (remove)))


(chain (jq "input")
      (keyup (lambda (evt)
	      (remote browse
		      (send (jq this) val))
	      true))
      (focus))


))