const Minipass = require('../..')
module.exports = class extends Minipass {
  constructor (options = {}) {
    options.async = true
    super(options)
  }
}
