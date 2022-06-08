const t = require('tap')
const MP = require('../')
t.test('pipe from ended stream', t => {
  const from = new MP()
  from.end().on('end', () => {
    t.equal(from.emittedEnd, true, 'from already emitted end')
    from.pipe(new MP()).on('end', () => t.end())
  })
})

t.test('pipe from ended stream with a promise', t => {
  const from = new MP()
  return from.end().promise().then(() =>
    from.pipe(new MP()).promise())
})

t.test('pipe from ended stream is no-op if {end:false}', async t => {
  const from = new MP()
  await from.end().promise()
  const to = new MP({ encoding: 'utf8' })
  from.pipe(to, {end:false})
  to.write('this is fine')
  to.end()
  t.equal(await to.concat(), 'this is fine')
})
