const through2 = require('through2')
module.exports = function (opts) {
  if (opts.objectMode)
    return through2.obj()
  s = through2()
  if (opts.encoding) {
    s.setEncoding(opts.encoding)
  }
  return s
}
