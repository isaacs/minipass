const MM = require('../')
const t = require('tap')
if (typeof AbortSignal === 'undefined') {
  Object.assign(global, require('node-abort-controller'))
}

const ac = new AbortController()
const m = new MM({ signal: ac.signal, encoding: 'utf8' })
const er = new Error('operation aborted')
let sawAbort = false
m.on('abort', e => {
  sawAbort = true
  t.equal(e, er)
})
m.write('hello')
t.equal(m.aborted, false)
m.aborted = 123
t.equal(m.aborted, false)
const d = new MM({ encoding: 'utf8' })
m.pipe(d)
ac.abort(er)
t.equal(sawAbort, true)
t.equal(m.read(), null)
m.write(' world')
t.equal(m.read(), null)
t.equal(m.aborted, true)
m.aborted = 123
t.equal(m.aborted, true)
t.equal(d.read(), 'hello')
t.equal(d.read(), null)

t.test('aborting rejects .promise() and friends', async t => {
  const ac = new AbortController()
  const m = new MM({ encoding: 'utf8', signal: ac.signal })
  m.write('hello')
  const testp = t.rejects(m.promise())
  ac.abort(new Error('abort'))
  await testp
})
