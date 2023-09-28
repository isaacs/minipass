import { Minipass as MM } from '../src/index.js'
import t from 'tap'
if (typeof AbortSignal === 'undefined') {
  Object.assign(global, require('node-abort-controller'))
}

const ac = new AbortController()
const m = new MM<string>({ signal: ac.signal, encoding: 'utf8' })
const er = new Error('operation aborted')
let sawAbort = false
m.on('abort', e => {
  sawAbort = true
  t.equal(e, er)
})
m.write('hello')
t.equal(m.aborted, false)
//@ts-expect-error
m.aborted = 123
t.equal(m.aborted, false)
const d = new MM<string>({ encoding: 'utf8' })
m.pipe(d)
ac.abort(er)
t.equal(sawAbort, true)
t.equal(m.read(), null)
t.equal(m.write(' world'), false)
t.equal(m.read(), null)
t.equal(m.aborted, true)
//@ts-expect-error
m.aborted = 123
t.equal(m.aborted, true)
t.equal(d.read(), 'hello')
t.equal(d.read(), null)

t.test('aborting rejects .promise() and friends', async t => {
  const ac = new AbortController()
  const m = new MM<string>({ encoding: 'utf8', signal: ac.signal })
  m.write('hello')
  const testp = t.rejects(m.promise())
  ac.abort(new Error('abort'))
  await testp
})

t.test('having a signal means errors are nonfatal', t => {
  const ac = new AbortController()
  const m = new MM<string>({ encoding: 'utf8', signal: ac.signal })
  m.emit('error', new Error('this is fine'))
  t.end()
})

t.test('pre-aborted stream', t => {
  const ac = new AbortController()
  ac.abort(new Error('operation aborted before it began'))
  const m = new MM({ signal: ac.signal })
  t.equal(m.aborted, true)
  m.on('data', () => t.fail('should not get any data'))
  t.equal(m.write('no op writing'), false)
  m.end()
  t.equal(m.write('even write after end is no op'), false)
  t.end()
})
