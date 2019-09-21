'use strict'
const t = require('tap')
global._MP_NO_ITERATOR_SYMBOLS_ = '1'
const MP = require('../index.js')
const mp = new MP
mp.write('foo')
setTimeout(() => mp.end())
t.throws(() => {
  for (let x of mp) {
    t.fail('should not be iterable')
  }
})
t.rejects(async () => {
  for await (let x of mp) {
    t.fail('should not be async iterable')
  }
})
