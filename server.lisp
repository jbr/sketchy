(include 'common.lisp)
(defvar io       (require "socket.io"))
(defvar connect  (require 'connect))
(defvar express  (require 'express))
(defvar redis    (send (require "./redis-node-client/lib/redis-client")
		       create-client))

(defvar app           (express.create-server))
(defvar socket-server (io.listen app))

(app.configure (lambda ()
	 (app.use (express.static-provider
		   (concat **dirname "/public")))))

(app.configure 'development
       (lambda ()
	 (app.use (express.error-handler
		   (hash dump-exceptions true
			 show-stack      true)))))

(app.configure 'production (lambda () (app.use (express.error-handler))))

(app.listen 8888)

(defvar remote-callable-functions (hash))
(defvar sockets socket-server.clients-index)

(socket-server.on 'connection
		  (lambda (socket)
		    (socket.on 'message
			       (lambda (message)
				 (defvar message (json parse message))
				 (defvar fn (get remote-callable-functions message.fn))
				 (defvar args (get message 'args))
				 (when (and (defined? args) (defined? fn))
				   (args.unshift socket)
				   (apply fn args))))

		    (socket.on 'disconnect
			       (lambda (&rest args)
				 (defvar departing-id socket.session-id)
				 (broadcast (lambda (socket)
					      (remote remove departing-id)))
				 (delete sockets socket.session-id)))))

(defun broadcast (fn)
  (send (keys sockets) for-each
	(lambda (session-id)
	  (defvar socket (get sockets session-id))
	  (when socket (fn socket)))))


(defremote mouse-move (originating-socket x y)
  (broadcast (lambda (socket)
	       (remote cursor-at originating-socket.session-id x y))))

