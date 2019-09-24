const t = require('tap')
const MP = require('../')

const enc = { encoding: 'utf8' }

t.test('encoding and immediate end', t =>
  new MP(enc).end().concat().then(s => t.equal(s, '')))

t.test('encoding and end with empty string', t =>
  new MP(enc).end('').concat().then(s => t.equal(s, '')))

t.test('encoding and end with empty buffer', t =>
  new MP(enc).end(Buffer.alloc(0)).concat().then(s => t.equal(s, '')))

t.test('encoding and end with stringly empty buffer', t =>
  new MP(enc).end(Buffer.from('')).concat().then(s => t.equal(s, '')))

t.test('encoding and write then end with empty buffer', t => {
  const mp = new MP(enc)
  mp.write('ok')
  return mp.end(Buffer.alloc(0)).concat().then(s => t.equal(s, 'ok'))
})

t.test('encoding and write then end with empty string', t => {
  const mp = new MP(enc)
  mp.write('ok')
  return mp.end('').concat().then(s => t.equal(s, 'ok'))
})

t.test('empty write with cb', t => new MP(enc).write(Buffer.from(''), t.end))
