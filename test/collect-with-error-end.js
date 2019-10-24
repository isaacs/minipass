const MP = require('../')
const mp = new MP()
const poop = new Error('poop')
mp.on('end', () => mp.emit('error', poop))
mp.end('foo')
const t = require('tap')
t.test('promise catches error emitted on end', t =>
  t.rejects(mp.collect(), poop))
