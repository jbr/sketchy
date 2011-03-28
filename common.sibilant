(defmacro defremote (fn args &rest body)
  (body.unshift fn args)
  (concat (apply macros.defun body)
	  (macros.set 'remote-callable-functions
		      (macros.quote fn)
		      fn)))

(defmacro remote (fn &rest args)
  (macros.call 'socket.send
	       (concat "JSON.stringify("
		       (macros.hash 'fn   (macros.quote (translate fn))
				    'args (apply macros.list args))
		       ")")))


(defvar *history-length* 750
        json             (meta "JSON"))
