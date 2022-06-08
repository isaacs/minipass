// https://github.com/isaacs/minipass/issues/36
const Minipass = require('../')
const t = require('tap')

const m = new Minipass({ encoding: 'utf8' })
m.write('hello')
t.equal(m.flowing, false)
let readableEmitted = false
m.on('readable', () => {
  readableEmitted = true
  m.on('data', c => t.equal(c, 'hello'))
})
t.equal(m.flowing, true)
t.equal(readableEmitted, true)
