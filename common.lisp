(defmacro thunk (&rest args)
  (args.unshift (list))
  (apply macros.lambda args))

(defmacro keys (obj)
  (macros.call "Object.keys" (translate obj)))

(defmacro delete (obj) (concat "delete " (translate obj)))


(defmacro default (varname value)
  (macros.defvar (translate varname)
		 (macros.or (translate varname) (translate value))))

(defmacro json (fn &rest args)
  (concat "JSON." (translate fn) "("
	  (join ", " (map args translate)) ")"))

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

(defvar *history-length* 300)
