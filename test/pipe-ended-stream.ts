import t from 'tap'
import { Minipass as MP } from '../src/index.js'

t.test('pipe from ended stream', t => {
  const from = new MP()
  from.end().on('end', () => {
    t.equal(from.emittedEnd, true, 'from already emitted end')
    from.pipe(new MP()).on('end', () => t.end())
  })
})

t.test('pipe from ended stream with a promise', async () => {
  const from = new MP()
  await from.end().promise()
  await from.pipe(new MP()).promise()
})

t.test('pipe from ended stream is no-op if {end:false}', async t => {
  const from = new MP()
  await from.end().promise()
  const to = new MP<string>({ encoding: 'utf8' })
  from.pipe(to, { end: false })
  to.write('this is fine')
  to.end()
  t.equal(await to.concat(), 'this is fine')
})
