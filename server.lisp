(include 'common.lisp)
(defvar io       (require "socket.io"))
(defvar connect  (require 'connect))
(defvar express  (require 'express))
(defvar request  (require 'request))
(defvar apricot  (get (require 'apricot) '-apricot))
(defvar url-util (require 'url))

(defvar app     (express.create-server))
(defvar socket  (io.listen app))

(defvar *max-recursion* 3)

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

(defun process-page (socket url body recursion-level from)
  (try
   (apricot.parse body
     (lambda (doc)
	    (chain doc
		   (find "a")
		   (each (lambda (elt)
			   (defvar href elt.href)
			   (when (not (href.match /^https?:\/\//))
			     (defvar previous-domain (get (url-util.parse url) 'host))
			     (setf href (concat "http://" previous-domain href)))
			   (process.next-tick
			    (lambda () (browse socket href (+ 1 recursion-level) url))))))))
   (console.log e)))


(defremote browse (socket url recursion-level from)
  (default recursion-level 0)
  (when (> *max-recursion* recursion-level)
    (console.log (concat from "->" url))
    (when (defined? from) (remote text (concat from "->" url)))

    (request (hash uri url)
	     (lambda (err response body)
	       (if err (console.log err)
		 (when (= 200 response.status-code)
		   (process-page socket url body from)))))))


