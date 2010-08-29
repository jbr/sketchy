(include "common.lisp")

(io.set-path "/client")

(defvar socket (new (io.-socket null (hash port 8888))))
(socket.connect)

(defvar remote-callable-functions (hash))
(defun browse (url from) (remote browse url from))
(defvar cursors (hash))


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

	   (defvar canvas (jq 'canvas))
	   (defvar context (chain (jq 'canvas) (get 0) (get-context "2d")))
	   (defvar body (jq document.body))

	   (chain body
		  (mousemove (lambda (evt)
			       (remote mouse-move evt.client-x evt.client-y)))

		  (resize (lambda (evt)
			    (send canvas attr 'width (body.width))
			    (send canvas attr 'height (body.height)))))

	   (defun draw ()
	     (body.resize)
	     (context.clear-rect 0 0 (canvas.width) (canvas.height))
	     (send (keys cursors) for-each
	      (lambda (key)
		(defvar cursor (get cursors key))
		(context.begin-path)
		(set context 'stroke-style 'black)
		(context.arc (first cursor) (second cursor)
			     20 0 (* 2 (get -math "PI")) false)
		(context.stroke))))

	   (defremote remove (id)
	     (console.log id)
	     (delete (get cursors id)))

	   (defremote cursor-at (id x y)
	     (set cursors id (list x y))
	     (draw))
	   (draw)))

