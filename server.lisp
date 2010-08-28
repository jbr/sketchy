(defvar express (require 'express))

(defvar app (express.create-server))

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

(app.listen 8888)
