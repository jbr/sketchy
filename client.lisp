(include "common.lisp")

(io.set-path "/client")

(defvar socket (new (io.-socket null (hash port 8888))))
(socket.connect)

(defvar remote-callable-functions (hash))
(defun browse (url from) (remote browse url from))
(defvar points (hash))
(defvar colors (hash))

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
	   (defvar mouse-down false)
	   (defvar new-segment false)
	   (chain body
		  (mousedown (lambda (evt)
			       (setf mouse-down true)
			       (setf new-segment true)))
		  (mouseup   (lambda (evt) (setf mouse-down false)))
		  (mousemove (lambda (evt)
			       (when mouse-down
				 (remote mouse-move
					 (list evt.client-x
					       evt.client-y
					       new-segment))
				 (setf new-segment false))))

		  (resize (lambda (evt)
			    (send canvas attr 'width (body.width))
			    (send canvas attr 'height (body.height))
			    (draw true))))

	   (defun draw (skip-resize)
	     (when (not skip-resize) (body.resize))
	     (context.clear-rect 0 0 (canvas.width) (canvas.height))
	     (send (keys points) for-each
	      (lambda (key)
		(defvar user-points (get points key))
		(set context 'stroke-style 'black)
		(set context 'line-width 1)
		(set context 'line-cap 'round)
		(defvar color (get colors key))
		(defvar last-point)
		(user-points.for-each (lambda (point i)
					(when (third point)
					  (setf last-point undefined))
					(context.begin-path)
					(set context 'stroke-style
					     (concat "rgb("
						     (join "," color)
						     ")"))
					(set context 'line-width
					     (* 5 (/ i (length user-points))))
					(defvar x (first point))
					(defvar y (second point))
					(when (defined? last-point)
					  (context.move-to (first last-point)
							   (second last-point))
					  (context.line-to x y)
					  (context.stroke))
					(setf last-point point))))))

	   (defremote remove (id)
	     (delete (get points id))
	     (draw))

	   (defremote sync-colors (current-colors)
	     (setf colors current-colors)
	     (draw))

	   (defremote sync-points (current-points)
	     (setf points current-points)
	     (draw))

	   (defremote sync-color (id color)
	     (set colors id color)
	     (draw))

	   (defremote add-point (id point)
	     (when (undefined? (get points id))
	       (set points id (list)))
	     (defvar current-points (get points id))
	     (current-points.push point)
	     (when (> current-points.length *history-length*)
	       (set points id (current-points.slice (- 0 *history-length*))))
	     (draw))

	   (draw)))

