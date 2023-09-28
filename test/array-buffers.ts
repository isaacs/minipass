import t from 'tap'

const stringToArrayBuffer = (s: string) => {
  const buf = Buffer.from(s)
  const ab = new ArrayBuffer(buf.length)
  const ui = new Uint8Array(ab)
  for (let i = 0; i < buf.length; i++) {
    ui[i] = buf[i] as number
  }
  return ab
}

import { Minipass as MP } from '../src/index.js'

const e = { encoding: 'utf8' } as const
t.test('write array buffer', async t => {
  const ab = stringToArrayBuffer('hello world')
  const mp = new MP<string>(e).end(ab)
  t.equal(mp.objectMode, false, 'array buffer does not trigger objectMode')
  const s = await mp.concat()
  t.equal(s, 'hello world')
})

t.test('write uint8 typed array', async t => {
  const ab = stringToArrayBuffer('hello world')
  const ui = new Uint8Array(ab, 0, 5)
  const mp = new MP<string>(e).end(ui)
  t.equal(mp.objectMode, false, 'typed array does not trigger objectMode')
  const s = await mp.concat()
  t.equal(s, 'hello')
})

import { runInNewContext } from 'vm'
const { ArrayBuffer: VMArrayBuffer, Uint8Array: VMUint8Array } =
  runInNewContext('({ArrayBuffer,Uint8Array})')

const stringToVMArrayBuffer = (s: string) => {
  const buf = Buffer.from(s)
  const ab = new VMArrayBuffer(buf.length)
  const ui = new VMUint8Array(ab)
  for (let i = 0; i < buf.length; i++) {
    ui[i] = buf[i]
  }
  return ab
}

t.test('write vm array buffer', async t => {
  const ab = stringToVMArrayBuffer('hello world')
  const mp = new MP<string>(e).end(ab)
  t.equal(mp.objectMode, false, 'array buffer does not trigger objectMode')
  const s = await mp.concat()
  t.equal(s, 'hello world')
})

t.test('write uint8 typed array', async t => {
  const ab = stringToVMArrayBuffer('hello world')
  const ui = new VMUint8Array(ab, 0, 5)
  const mp = new MP<string>(e).end(ui)
  t.equal(mp.objectMode, false, 'typed array does not trigger objectMode')
  const s = await mp.concat()
  t.equal(s, 'hello')
})
