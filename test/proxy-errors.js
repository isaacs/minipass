const t = require('tap')
const Minipass = require('../')

t.test('not proxied', t => {
  const src = new Minipass()
  const dest = new Minipass()

  let srcEr = null
  let destEr = null
  src.on('error', er => srcEr = er)
  dest.on('error', er => destEr = er)

  src.pipe(dest)

  src.emit('error', new Error('not proxied'))
  t.match(srcEr, { message: 'not proxied' })
  t.equal(destEr, null)

  t.end()
})

t.test('proxied', t => {
  const src = new Minipass()
  const dest = new Minipass()

  let srcEr = null
  let destEr = null
  src.on('error', er => srcEr = er)
  dest.on('error', er => destEr = er)

  src.pipe(dest, { proxyErrors: true })

  // let the flow go
  dest.resume()

  src.emit('error', new Error('proxied'))
  t.match(srcEr, { message: 'proxied' })
  t.match(destEr, { message: 'proxied' })

  t.end()
})

t.test('not proxied after stream end', t => {
  const src = new Minipass()
  const dest = new Minipass()

  let srcEr = null
  let destEr = null
  src.on('error', er => srcEr = er)
  dest.on('error', er => destEr = er)

  src.pipe(dest, { proxyErrors: true })

  // let the flow go
  dest.resume()
  src.end('hello')

  src.emit('error', new Error('post end'))
  t.match(srcEr, { message: 'post end' })
  t.equal(destEr, null)

  t.end()
})

t.test('not proxied after unpipe', t => {
  const src = new Minipass()
  const dest = new Minipass()

  let srcEr = null
  let destEr = null
  src.on('error', er => srcEr = er)
  dest.on('error', er => destEr = er)

  src.pipe(dest, { proxyErrors: true })
  src.unpipe(dest)

  src.emit('error', new Error('unpiped'))
  t.match(srcEr, { message: 'unpiped' })
  t.equal(destEr, null)

  t.end()
})
