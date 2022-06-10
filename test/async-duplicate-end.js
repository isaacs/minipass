const Minipass = require('../')
const t = require('tap')

t.test('async pipes should only end one time', t => {
  const m = new Minipass({ async: true })
  let ended = 0
  const d = new Minipass()
  d.end = () => {
    ended++
    Minipass.prototype.end.call(d)
  }
  m.pipe(d)
  m.end()
  m.end()
  m.end()
  setTimeout(() => {
    t.equal(ended, 1)
    t.end()
  })
})
