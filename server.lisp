(include 'common.lisp)
(defvar io       (require "socket.io"))
(defvar connect  (require 'connect))
(defvar express  (require 'express))
(defvar request  (require 'request))
(defvar apricot  (get (require 'apricot) '-apricot))
(defvar url-util (require 'url))
(defvar redis    (send (require "./redis-node-client/lib/redis-client")
		       create-client))

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
	     (lambda (&rest args)
	       (console.log "clearing" socket.session-id)
	       (redis.del socket.session-id)
	       (console.log 'disconnect)))))

(defun process-page (socket url body recursion-level from)
  (try
   (apricot.parse body (lambda (doc)
     (chain doc
	    (find 'title)
	    (each (lambda (elt)
		    (redis.hset 'title url
				(send (get elt "innerHTML") trim))))
	    (remove))

     (chain doc
       (find 'a)
       (each (lambda (elt)
	       (defvar href elt.href)
	       (when (not (href.match /^javascript:/))
		 (when (not (href.match /^https?:\/\//))
		   (defvar previous-domain (get (url-util.parse url) 'host))
		   (setf href (concat "http://" previous-domain href)))
		 (process.next-tick (lambda ()
		   (browse socket href (+ 1 recursion-level) url)))))))))
   (console.log url e)))

(defun get-and-process (socket url recursion-level from)
  (request (hash uri url)
    (lambda (err response body)
      (if err (console.log url err)
	(when (= 200 response.status-code)
	  (process-page socket url body recursion-level from))))))

(defremote browse (socket url recursion-level from)
  (default recursion-level 0)
  (console.log (concat recursion-level " " url))
  (when (> *max-recursion* recursion-level)
    (when (defined? from)
      (remote link from url)
      (redis.sadd from url)
      (redis.sismember socket.session-id
       (lambda (err already-visited)
	 (when (not already-visited)
	   (redis.sadd socket.session-id url)
	   ;; (get-and-process socket url recursion-level from)
	   (redis.smembers url (lambda (err urls)
             (if urls (urls.for-each (lambda (to) (browse socket url to)))
	       (get-and-process socket url recursion-level from))))))))
    (when (undefined? from)
      (console.log "clearing" socket.session-id)
      (redis.del socket.session-id (lambda (err)
        (get-and-process socket url recursion-level from))))))

