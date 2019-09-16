'use strict'
const t = require('tap')
const MP = require('../')

t.test('end is not missed if listened to after end', t => {
  t.plan(1)
  const mp = new MP()
  mp.end('foo')
  let str = ''
  mp.on('data', d => str += d)
  mp.on('end', () => t.equal(str, 'foo'))
})

t.test('listening for any endish event after end re-emits', t => {
  t.plan(1)
  const mp = new MP()
  mp.end('foo')
  let str = ''
  mp.on('data', d => str += d)
  mp.on('finish', () => t.equal(str, 'foo'))
})
