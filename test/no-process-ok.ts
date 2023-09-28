import t from 'tap'

t.test('run without a process global', async t => {
  t.intercept(global, 'process', { value: null })
  const { Minipass: MP } = await import('../src/index.js')
  const src = new MP()
  const dest = new MP<string>({ encoding: 'utf8' })
  src.pipe(dest)
  src.end('ok')
  const result = dest.read()
  t.equal(result, 'ok')
})
