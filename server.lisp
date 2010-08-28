(defmacro json (fn &rest args)
  (concat "JSON." (translate fn) "("
	  (join ", " (map args translate)) ")"))

(defvar io (require "socket.io"))
(defvar connect (require 'connect))
(defvar express (require 'express))
(defvar app (express.create-server))
(defvar socket (io.listen app))

(console.log 'here)

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

(app.get "/" (lambda (req res) (res.send "Hello Express")))


(socket.on 'connection (lambda (client)

  (client.on 'message (lambda (message)
			(defvar coords (json parse message))
			(console.log message)
			(client.send (concat "hello "
					     coords.x ", " coords.y))
			(set-timeout (lambda () (client.send "WHEE"))
				     1000)))

  (client.on 'disconnect (lambda (&rest args)
			   (console.log args)
			   (console.log 'disconnect)))))

(app.listen 8888)
