import t from 'tap'
import { Minipass as MP } from '../src/index.js'
t.test('do not auto-end empty stream if explicitly paused', async t => {
  const mp = new MP()
  let waitedForEnd = false
  mp.pause()
  setTimeout(() => {
    waitedForEnd = true
    mp.resume()
  })
  await mp.end().promise()
  t.ok(waitedForEnd, 'waited for end')
})
