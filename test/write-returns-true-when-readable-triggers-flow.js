// if you do s.on('readable', s => s.pipe(d)), then s.write() should return
// true, because even though s is not flowing at the START of the write(),
// it IS flowing by the END of the write call.

const Minipass = require('../')
const t = require('tap')

t.test('empty write', async t => {
  const s = new Minipass({ encoding: 'utf8' })
  const dest = new Minipass({ encoding: 'utf8' })
  const p = dest.concat().then(d => t.equal(d, 'a', 'got data'))
  t.equal(s.write('a'), false, 'first write returns false')
  t.equal(s.write(''), false, 'empty write returns false')
  // since readable emits immediately, the NEXT one needs to trigger
  let firstReadable = false
  s.on('readable', () => {
    if (!firstReadable)
      firstReadable = true
    else
      s.pipe(dest)
  })
  t.equal(s.flowing, false, 'src is not flowing yet')
  t.equal(s.write(''), true, 'return true, now flowing')
  s.end()
  await p
})

t.test('non-empty write', async t => {
  const s = new Minipass({ encoding: 'utf8' })
  const dest = new Minipass({ encoding: 'utf8' })
  const p = dest.concat().then(d => t.equal(d, 'ab', 'got data'))
  t.equal(s.write('a'), false, 'first write returns false')
  t.equal(s.write(''), false, 'empty write returns false')
  // since readable emits immediately, the NEXT one needs to trigger
  let firstReadable = false
  s.on('readable', () => {
    if (!firstReadable)
      firstReadable = true
    else
      s.pipe(dest)
  })
  t.equal(s.flowing, false, 'src is not flowing yet')
  t.equal(s.write('b'), true, 'return true, now flowing')
  s.end()
  await p
})
