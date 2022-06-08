const t = require('tap')
const MP = require('../')

t.test('pipe', t => {
  const m = new MP({ encoding: 'utf8', async: true })
  const d1 = new MP({ encoding: 'utf8' })
  const d2 = new MP({ encoding: 'utf8' })

  m.pipe(d1)
  m.write('hello, ')
  m.pipe(d2)
  m.write('world')
  m.end()
  return Promise.all([d1.concat(), d2.concat()])
    .then(result => t.strictSame(result, ['hello, world', 'hello, world']))
})

t.test('pipe split', t => {
  const m = new MP({ encoding: 'utf8' })
  t.equal(m.async, false)
  m.async = true
  t.equal(m.async, true)
  m.async = 'banana'
  t.equal(m.async, true)
  m.async = false
  t.equal(m.async, true, 'cannot make an async stream sync')
  const d1 = new MP({ encoding: 'utf8' })
  const d2 = new MP({ encoding: 'utf8' })

  m.pipe(d1)
  m.write('hello, ')
  m.pipe(d2)
  setTimeout(() => {
    m.write('world')
    m.end()
  })
  return Promise.all([d1.concat(), d2.concat()])
    .then(result => t.strictSame(result, ['hello, world', 'hello, world']))
})

t.test('data event', t => {
  const m = new MP({ encoding: 'utf8', async: true })
  const d1 = new MP({ encoding: 'utf8' })

  const out1 = []
  m.on('data', c => out1.push(c))
  m.write('hello, ')
  const out2 = []
  m.on('data', c => out2.push(c))
  m.pipe(d1)
  m.end('world!')
  return d1.concat().then(res => {
    t.equal(res, 'hello, world!')
    t.equal(out1.join(''), 'hello, world!')
    t.equal(out2.join(''), 'hello, world!')
  })
})

t.test('data event split', t => {
  const m = new MP({ encoding: 'utf8', async: true })
  const d1 = new MP({ encoding: 'utf8' })

  const out1 = []
  m.on('data', c => out1.push(c))
  m.write('hello, ')
  const out2 = []
  m.on('data', c => out2.push(c))
  m.pipe(d1)
  setTimeout(() => m.end('world!'))
  return d1.concat().then(res => {
    t.equal(res, 'hello, world!')
    t.equal(out1.join(''), 'hello, world!')
    t.equal(out2.join(''), 'hello, world!')
  })
})

t.test('defer error event', t => {
  const m = new MP()
  try { m.emit('error', new Error('poop')) } catch (_) {}
  m.async = true
  let calledErrorHandler = false
  m.on('error', er => {
    t.equal(calledErrorHandler, false)
    t.match(er, { message: 'poop' })
    calledErrorHandler = true
    t.end()
  })
  t.equal(calledErrorHandler, false)
})
