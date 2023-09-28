import t from 'tap'
import { Minipass as MP } from '../src/index.js'

const enc = { encoding: 'utf8' } as const

t.test('encoding and immediate end', t =>
  new MP<string>(enc)
    .end()
    .concat()
    .then(s => t.equal(s, ''))
)

t.test('encoding and end with empty string', t =>
  new MP<string>(enc)
    .end('')
    .concat()
    .then(s => t.equal(s, ''))
)

t.test('encoding and end with empty buffer', t =>
  new MP<string>(enc)
    .end(Buffer.alloc(0))
    .concat()
    .then(s => t.equal(s, ''))
)

t.test('encoding and end with stringly empty buffer', t =>
  new MP<string>(enc)
    .end(Buffer.from(''))
    .concat()
    .then(s => t.equal(s, ''))
)

t.test('encoding and write then end with empty buffer', async t => {
  const mp = new MP<string>(enc)
  mp.write('ok')
  const s = await mp.end(Buffer.alloc(0)).concat()
  t.equal(s, 'ok')
})

t.test('encoding and write then end with empty string', async t => {
  const mp = new MP<string>(enc)
  mp.write('ok')
  const s = await mp.end('').concat()
  t.equal(s, 'ok')
})

t.test('empty write with cb', t =>
  new MP<string>(enc).write(Buffer.from(''), t.end)
)
