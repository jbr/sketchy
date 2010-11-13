(include 'common.lisp)

($ (thunk
  (defvar socket                    (new (io.-socket null (hash port 8888)))
          remote-callable-functions (hash)
          points                    (hash)
          color                     (hash))

  (socket.connect)

  (defun browse (url from) (remote browse url from))


  (socket.on 'message
             (lambda (message)
               (defvar message (json.parse message)
                 fn (get remote-callable-functions message.fn)
                 args (get message 'args))

               (when (and (defined? args)
                          (array? args)
                          (defined? fn))
                 (apply fn args))))

  (defvar canvas ($ 'canvas)
    context (chain canvas (get 0) (get-context "2d"))
    body ($ document.body)
    mouse-down false
    new-segment false)

  (chain body
         (mousedown (lambda (evt)
                      (setf mouse-down true
                            new-segment true)
                      true))
         (mouseup   (lambda (evt) (setf mouse-down false)))
         (mousemove (lambda (evt)
                      (when mouse-down
                        (remote mouse-move
                                (list evt.client-x
                                      evt.client-y
                                      new-segment))
                        (setf new-segment false))))

         (resize (lambda (evt)
                   (send canvas attr 'width (body.width))
                   (send canvas attr 'height (body.height))
                   (draw true))))

  (defun window.draw (skip-resize)
    (when (not skip-resize) (body.resize))
    (context.clear-rect 0 0 (canvas.width) (canvas.height))
    (each (key) (keys points)
          (defvar user-points (get points key)
            color       (get colors key)
            last-point  undefined)

          (set context 'stroke-style 'black
               'line-width   1
               'line-cap     'round)

          (each (point i) user-points
                (when (third point) (setf last-point undefined))
                (context.begin-path)
                (set context
                     'stroke-style (concat "rgb(" (join "," color) ")")
                     'line-width   (* 5 (/ i (length user-points))))
                (defvar x (first point)
                  y (second point))
                (when (defined? last-point)
                  (context.move-to (first last-point)
                                   (second last-point))
                  (context.line-to x y)
                  (context.stroke))
                (setf last-point point))))

  (defvar draw window.draw)
  (defremote remove (id)
    (delete (get points id))
    (draw))

  (defremote sync-colors (current-colors)
    (setf colors current-colors)
    (draw))

  (defremote sync-points (current-points)
    (setf points current-points)
    (draw))

  (defremote sync-color (id color)
    (set colors id color)
    (draw))

  (defremote add-point (id point)
    (when (undefined? (get points id))
      (set points id (list)))
    (defvar current-points (get points id))
    (current-points.push point)
    (when (> current-points.length *history-length*)
      (set points id (current-points.slice (- 0 *history-length*))))
    (draw))

  (draw)))

