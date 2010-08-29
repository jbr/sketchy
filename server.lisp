(include 'common.lisp)
(defvar io       (require "socket.io"))
(defvar connect  (require 'connect))
(defvar express  (require 'express))
(defvar request  (require "./node-utils/request/lib/main"))
(defvar xml      (require "./node-xml/lib/node-xml"))
(defvar url-util (require 'url))
(defvar redis    (send (require "./redis-node-client/lib/redis-client")
		       create-client))

(defvar app     (express.create-server))
(defvar socket  (io.listen app))

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


(defun attrs-as-hash (attrs)
  (defvar hash (hash))
  (attrs.for-each (lambda (attr)
		    (set hash (first attr)
			 (chain attr (slice 1) (join " ") (trim)))))
  hash)

(defun link-parser (link-callback)
  (new (xml.-sax-parser
	(lambda (cb)
	  (cb.on-error (lambda (err) (console.log (concat "*--" err))))
	  (cb.on-start-element-n-s
	   (lambda (elem attrs)
	     (console.log elem attrs)
	     (when false
	       (console.log elem)
	       (defvar href (get (attrs-as-hash attrs) 'href))
	       (when href (link-callback href)))))))))


(defun process-link (socket url href)
  (defvar href href)
  (when (not (href.match /^javascript:/))
    (when (not (href.match /^https?:\/\//))
      (defvar previous-domain (get (url-util.parse url) 'host))
      (setf href (concat "http://" previous-domain href)))
    (remote link url href)
    (redis.sadd url href)))

(defun get-and-process (socket url)
  (defvar parser
    (link-parser (lambda (link)
		   (process-link socket url link))))

  (request (hash uri url
		 data-callback (lambda (chunk)
				 (parser.parse-string (chunk.to-string))))))

(defremote browse (socket url)
  (when socket.connected
    (redis.sismember
     socket.session-id url
     (lambda (err already-visited)
       (when (not already-visited)
	 (redis.sadd socket.session-id url)
	 (redis.smembers
	  url (lambda (err urls)
		(if urls
		    (urls.for-each (lambda (to)
				     (remote link url (to.to-string))))
		  (get-and-process socket url)))))))))

