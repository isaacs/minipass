const through2 = require('through2')
module.exports = function (opts) {
  if (opts.objectMode)
    return through2.obj(func)
  s = through2(func)
  if (opts.encoding) {
    s.setEncoding(opts.encoding)
  }
  return s

  function func (data, enc, done) {
    this.push(data, enc)
    done()
  }
}
