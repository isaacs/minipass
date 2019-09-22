const MP = require('../')
const t = require('tap')

t.match(new MP(), { destroy: Function }, 'destroy is implemented')

{
  const mp = new MP()
  t.equal(mp.destroy(), mp, 'destroy() returns this')
}

t.equal(new MP().destroy().destroyed, true, 'destroy() sets .destroyed getter')

t.test('destroy(er) emits error', t => {
  const mp = new MP()
  const er = new Error('skoarchhh')
  const ret = t.rejects(() => mp.promise(), er)
  mp.destroy(er)
  return ret
})

t.test('calls close if present', t => {
  const mp = new MP()
  let closeCalled = false
  mp.close = () => {
    closeCalled = true
    setTimeout(() => mp.emit('close'))
  }
  mp.on('close', () => {
    t.equal(closeCalled, true, 'called close')
    t.end()
  })
  mp.destroy()
})

t.test('destroy a second time just emits the error', t => {
  const mp = new MP()
  mp.destroy()
  const er = new Error('skoarchhh')
  const ret = t.rejects(() => mp.promise(), er)
  mp.destroy(er)
  return ret
})

t.test('destroy with no error rejects a promise', t => {
  const mp = new MP()
  const ret = t.rejects(() => mp.promise(), { message: 'stream destroyed' })
  mp.destroy()
  return ret
})

t.test('destroy with no error second time rejects a promise', t => {
  const mp = new MP()
  mp.destroy()
  const ret = t.rejects(() => mp.promise(), { message: 'stream destroyed' })
  mp.destroy()
  return ret
})

t.test('emits after destruction are ignored', t => {
  const mp = new MP().destroy()
  mp.on('foo', () => t.fail('should not emit foo after destroy'))
  mp.emit('foo')
  t.end()
})

t.test('pipe after destroy is a no-op', t => {
  const p = new MP()
  p.write('foo')
  p.destroy()
  const q = new MP()
  q.on('data', c => t.fail('should not get data, upstream is destroyed'))
  p.pipe(q)
  t.end()
})

t.test('resume after destroy is a no-op', t => {
  const p = new MP()
  p.pause()
  p.on('resume', () => t.fail('should not see resume event after destroy'))
  p.destroy()
  p.resume()
  t.end()
})

t.test('read after destroy always returns null', t => {
  const p = new MP({ encoding: 'utf8' })
  p.write('hello, ')
  p.write('world')
  t.equal(p.read(), 'hello, world')
  p.write('destroyed!')
  p.destroy()
  t.equal(p.read(), null)
  t.end()
})

t.test('write after destroy emits error', t => {
  const p = new MP()
  p.destroy()
  p.on('error', er => {
    t.match(er, {
      message: 'Cannot call write after a stream was destroyed',
      code: 'ERR_STREAM_DESTROYED',
    })
    t.end()
  })
  p.write('nope')
})
