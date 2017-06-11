'use strict'
const stream = require('stream')

module.exports = class NullSink extends stream.Writable {
  constructor () {
    super({objectMode: true})
  }
  _write (data, encoding, next) {
    if (next) next()
    return true
  }
  end () {
    this.emit('finish')
  }
}
