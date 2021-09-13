'use strict'
const t = require('tap')
const MP = require('../index.js')

t.test('basic', async t => {
  const mp = new MP()
  let i = 5
  const interval = setInterval(() => {
    if (i --> 0)
      mp.write('foo\n')
    else {
      clearInterval(interval)
      mp.end()
    }
  })
  mp.setEncoding('utf8')
  const all = await mp.collect()
  t.same(all, ['foo\n','foo\n','foo\n','foo\n','foo\n'])
})

t.test('error', async t => {
  const mp = new MP()
  const poop = new Error('poop')
  setTimeout(() => mp.emit('error', poop))
  await t.rejects(mp.collect(), poop)
})

t.test('concat strings', async t => {
  const mp = new MP({ encoding: 'utf8' })
  mp.write('foo')
  mp.write('bar')
  mp.write('baz')
  mp.end()
  await t.resolveMatch(mp.concat(), 'foobarbaz')
})
t.test('concat buffers', async t => {
  const mp = new MP()
  mp.write('foo')
  mp.write('bar')
  mp.write('baz')
  mp.end()
  await t.resolveMatch(mp.concat(), Buffer.from('foobarbaz'))
})

t.test('concat objectMode fails', async t => {
  const a = new MP({objectMode: true})
  await t.rejects(a.concat(), new Error('cannot concat in objectMode'))
  const b = new MP()
  b.write('asdf')
  setTimeout(() => b.end({foo:1}))
  await t.rejects(b.concat(), new Error('cannot concat in objectMode'))
})

t.test('collect does not set bodyLength in objectMode', t =>
  new MP({objectMode: true}).end({a:1}).collect().then(data => {
    t.equal(typeof data.dataLength, 'undefined')
    t.same(data, [{a:1}])
  }))
