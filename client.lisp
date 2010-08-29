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
	       (console.log args)

	     (when (and (defined? args)
			(array? args)
			(defined? fn))
	       (apply fn args))))

(defremote text (text)
  (chain (jq "<li/>")
	 (prepend-to 'ul)
	 (html text)))

(defremote link (from to)
  (text (concat from " &rarr; " to)))

(chain (jq "input[type=text]")
      (change
       (lambda (evt)
	 (send (jq 'ul) empty)
	 (remote browse (send (jq this) val))))
      (focus)
      (change))

(send (jq "input[type=button]") click
      (lambda (evt) (send (jq "input[type=text]") change)))

))