const t = require('tap')
const { Minipass: MP } = require('../')
t.test('do not auto-end empty stream if explicitly paused', t => {
  const mp = new MP()
  let waitedForEnd = false
  mp.pause()
  setTimeout(() => {
    waitedForEnd = true
    mp.resume()
  })
  return mp
    .end()
    .promise()
    .then(() => t.ok(waitedForEnd, 'waited for end'))
})
