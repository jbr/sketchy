(include 'common.lisp)
(defvar io (require "socket.io"))
(defvar connect (require 'connect))
(defvar express (require 'express))
(defvar app (express.create-server))
(defvar socket (io.listen app))

(app.configure (lambda ()
	 (app.use (express.static-provider
		   (concat **dirname "/public")))))

(app.configure 'development
       (lambda ()
	 (app.use (express.error-handler
		   (hash dump-exceptions true
			 show-stack      true)))))

(app.configure 'production (lambda ()
    (app.use (express.error-handler))))

(app.listen 8888)

(defvar remote-callable-functions (hash))
(socket.on 'connection (lambda (socket)
  (socket.on 'message
	     (lambda (message)
	       (defvar message (json parse message))
	       (defvar fn (get remote-callable-functions message.fn))
	       (defvar args (get message 'args))
	       (when (and (defined? args) (defined? fn))
		 (args.unshift socket)
		 (apply fn args))))

  (socket.on 'disconnect
	     (lambda (&rest args) (console.log 'disconnect)))))


(defremote browse (socket url)
  (remote text url))

