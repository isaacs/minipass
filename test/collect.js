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
