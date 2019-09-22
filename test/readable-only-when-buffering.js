const MP = require('../')
const t = require('tap')
const mp = new MP()
let readables = 0
mp.on('readable', () => readables++)
const ondata = d => {}
mp.on('data', ondata)
t.equal(mp.write('foo'), true)
t.equal(readables, 0)
mp.pause()
t.equal(mp.write('foo'), false)
t.equal(readables, 1)
