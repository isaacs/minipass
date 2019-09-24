const t = require('tap')

const stringToArrayBuffer = s => {
  const buf = Buffer.from(s)
  const ab = new ArrayBuffer(buf.length)
  const ui = new Uint8Array(ab)
  for (let i = 0; i < buf.length; i++) {
    ui[i] = buf[i]
  }
  return ab
}

const MP = require('../')

const e = { encoding: 'utf8' }
t.test('write array buffer', t => {
  const ab = stringToArrayBuffer('hello world')
  const mp = new MP(e).end(ab)
  t.equal(mp.objectMode, false, 'array buffer does not trigger objectMode')
  return mp.concat().then(s => t.equal(s, 'hello world'))
})

t.test('write uint8 typed array', t => {
  const ab = stringToArrayBuffer('hello world')
  const ui = new Uint8Array(ab, 0, 5)
  const mp = new MP(e).end(ui)
  t.equal(mp.objectMode, false, 'typed array does not trigger objectMode')
  return mp.concat().then(s => t.equal(s, 'hello'))
})

const {
  ArrayBuffer: VMArrayBuffer,
  Uint8Array: VMUint8Array,
} = require('vm').runInNewContext('({ArrayBuffer,Uint8Array})')

const stringToVMArrayBuffer = s => {
  const buf = Buffer.from(s)
  const ab = new VMArrayBuffer(buf.length)
  const ui = new VMUint8Array(ab)
  for (let i = 0; i < buf.length; i++) {
    ui[i] = buf[i]
  }
  return ab
}

t.test('write vm array buffer', t => {
  const ab = stringToVMArrayBuffer('hello world')
  const mp = new MP(e).end(ab)
  t.equal(mp.objectMode, false, 'array buffer does not trigger objectMode')
  return mp.concat().then(s => t.equal(s, 'hello world'))
})

t.test('write uint8 typed array', t => {
  const ab = stringToVMArrayBuffer('hello world')
  const ui = new VMUint8Array(ab, 0, 5)
  const mp = new MP(e).end(ui)
  t.equal(mp.objectMode, false, 'typed array does not trigger objectMode')
  return mp.concat().then(s => t.equal(s, 'hello'))
})
