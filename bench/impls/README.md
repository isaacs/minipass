To add a new stream type to test, create a file here that exports a
function or class that can be called with `s = new Class(options)`, where
`options` can include `{encoding: 'utf8'}` or `{objectMode: true}`.

The returned object must implement at minimum the following subset of the
stream interface:

* `on(event, fn)` call `fn` when `event` happens
* `write(data)` where `data` will be an object, string, or buffer.  Return
  `true` if more data should be written, `false` otherwise.  Emit `drain`
  when ready for more data if `false` is written.
* `end()` no further data will be written, emit `'finish'` when all data
  processed
* `pipe(dest)` pipe all output to `dest` stream
