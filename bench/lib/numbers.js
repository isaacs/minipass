'use strict'
const stream = require('stream')

module.exports = class Numbers {
  constructor (opt) {
    this.objectMode = opt.objectMode
    this.encoding = opt.encoding
    this.ii = 0
    this.acc = ''
    this.dest = null
    this.done = false
  }
  pipe (dest) {
    this.dest = dest
    this.go()
    return dest
  }

  go () {
    let flowing = true
    while (flowing) {
      if (++this.ii >= 1000) {
        this.dest.end()
        this.done = true
        flowing = false
      } else {
        const str = this.acc += this.ii
        const chunk = this.objectMode ? { str }
          : this.encoding ? str
          : new Buffer(str)
        flowing = this.dest.write(chunk)
      }
    }

    if (!this.done)
      this.dest.once('drain', _ => this.go())
  }
}
