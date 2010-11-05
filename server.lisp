(include 'common.lisp)

(defvar io      (require 'socket.io)
  connect       (require 'connect)
  express       (require 'express)
  app           (express.create-server)
  socket-server (io.listen app))

(app.configure (thunk
		(app.use (express.static-provider
			  (concat **dirname "/public")))))

(app.configure 'development
	       (thunk
		(app.use (express.error-handler
			  (hash dump-exceptions true
				show-stack      true)))))

(app.configure 'production (thunk (app.use (express.error-handler))))

(app.listen 8888)

(defvar remote-callable-functions (hash)
  sockets socket-server.clients-index
  points (hash)
  colors (hash))

(defun random-int (max)
  (-math.floor (* max (-math.random))))

(defun random-color ()
  (list (random-int 255) (random-int 255) (random-int 255)))

(socket-server.on 'connection
		  (lambda (socket)
		    (defvar socket-id socket.session-id)

		    (set colors socket-id (random-color))
		    (remote sync-colors colors)

		    (set points socket-id (list))
		    (remote sync-points points)

		    (broadcast (lambda (socket)
				 (remote sync-color socket-id
					 (get colors socket-id))))

		    (socket.on 'message
			       (lambda (message)
				 (defvar message (json parse message))
				 (defvar fn (get remote-callable-functions
						 message.fn))
				 (defvar args (get message 'args))
				 (when (and (defined? args) (defined? fn))
				   (args.unshift socket)
				   (apply fn args))))

		    (socket.on 'disconnect
			       (lambda (&rest args)
				 (broadcast (lambda (socket)
					      (remote remove socket-id)))
				 (delete (get points  socket-id))
				 (delete (get colors  socket-id))
				 (delete (get sockets socket-id))))))

(defun broadcast (fn)
  (each (session-id) (keys sockets)
	(defvar socket (get sockets session-id))
	(when socket (fn socket))))

(defun add-point (id point)
  (when (undefined? (get points id))
    (set points id (list)))
  (defvar current-points (get points id))
  (current-points.push point)
  (when (> current-points.length *history-length*)
    (set points id (current-points.slice (- 0 *history-length*)))))

(defremote mouse-move (originating-socket x y new-segment)
  (add-point originating-socket.session-id x y new-segment)
  (broadcast (lambda (socket)
	       (remote add-point originating-socket.session-id x y new-segment))))

