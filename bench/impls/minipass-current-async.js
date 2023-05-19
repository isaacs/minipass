const Minipass = require('../..').Minipass
module.exports = class extends Minipass {
  constructor (options = {}) {
    options.async = true
    super(options)
  }
}
