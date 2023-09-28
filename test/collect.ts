import t from 'tap'
import { Minipass as MP } from '../src/index.js'

t.test('basic', async t => {
  const mp = new MP<string>({ encoding: 'utf8' })
  let i = 5
  const interval = setInterval(() => {
    if (i-- > 0) mp.write('foo\n')
    else {
      clearInterval(interval)
      mp.end()
    }
  })
  const all = await mp.collect()
  t.same(all, ['foo\n', 'foo\n', 'foo\n', 'foo\n', 'foo\n'])
})

t.test('error', async t => {
  const mp = new MP()
  const poop = new Error('poop')
  setTimeout(() => mp.emit('error', poop))
  await t.rejects(mp.collect(), poop)
})

t.test('concat strings', async t => {
  const mp = new MP<string>({ encoding: 'utf8' })
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
  const a = new MP({ objectMode: true })
  await t.rejects(a.concat(), new Error('cannot concat in objectMode'))
})

t.test('collect does not set bodyLength in objectMode', t =>
  new MP<any>({ objectMode: true })
    .end({ a: 1 })
    .collect()
    .then(data => {
      t.equal(data.dataLength, 0)
      t.same(data, [{ a: 1 }])
    })
)
