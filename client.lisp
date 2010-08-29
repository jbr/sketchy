(include "common.lisp")

(io.set-path "/client")

(defvar socket (new (io.-socket null (hash port 8888))))
(socket.connect)

(defvar remote-callable-functions (hash))
(defun browse (url from) (remote browse url from))


(j-query (lambda (jq)
	   (defvar url (window.location.search.replace /^\?/ ""))
	   (when (and (defined? url) (not (= url "")))
	     (send (jq "input[type=text]") val url))

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

	   (chain (jq 'form)
		  (submit (lambda ()
			    (send (jq "input[type=text]") change)
			    false)))

	   (defvar canvas (jq 'canvas))
	   
	   (chain (jq window)
		  (resize (lambda (evt)
			    (chain canvas
				   (width (send (jq document.body) width))
				   (height (send (jq document.body) height))
				   (resize))))
		  (resize))


	   (send (jq "input[type=button]") click
		 (lambda (evt) (send (jq "input[type=text]") change)))))
